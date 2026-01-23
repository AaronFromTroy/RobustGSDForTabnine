/**
 * Backup and restore manager for GSD upgrade operations
 * Provides safety net for upgrade failures with create, validate, restore, and list capabilities
 *
 * Key patterns:
 * - Timestamped backup directories in .gsd-backups/
 * - Validation before restore (fail-fast)
 * - Temp backup during restore (safety net)
 * - Metadata tracking (version, file count, timestamp)
 * - Excludes node_modules (too large, can reinstall)
 */

import fse from 'fs-extra';
import { readdir, stat, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create timestamped backup of GSD directory
 *
 * @param {string} sourceDir - Directory to backup (default: 'gsd')
 * @param {object} options - Backup options
 * @param {string} options.backupRoot - Root directory for backups (default: '.gsd-backups')
 * @param {string[]} options.exclude - Additional paths to exclude beyond node_modules
 * @returns {Promise<{backupPath: string, metadata: object}>} Backup location and metadata
 * @throws {Error} If backup creation fails
 */
export async function createBackup(sourceDir = 'gsd', options = {}) {
  const { backupRoot = '.gsd-backups', exclude = [] } = options;

  const timestamp = Date.now();
  const backupPath = path.join(backupRoot, `backup-${timestamp}`);

  try {
    // Ensure backup root exists
    await fse.ensureDir(backupRoot);

    // Read version from package.json
    let version = '1.0.0';
    try {
      const pkgPath = path.join(sourceDir, 'package.json');
      const pkgContent = await readFile(pkgPath, 'utf8');
      const pkg = JSON.parse(pkgContent);
      version = pkg.version;
    } catch (error) {
      // Version optional, use default if package.json not found
    }

    // Count files before copy (for metadata)
    const fileCount = await countFiles(sourceDir, ['node_modules', ...exclude]);

    // Copy directory recursively, excluding node_modules and additional exclusions
    await fse.copy(sourceDir, backupPath, {
      filter: (src) => {
        const relativePath = path.relative(sourceDir, src);
        const excluded = ['node_modules', ...exclude];

        // Exclude if path matches any exclusion
        return !excluded.some(ex => relativePath.startsWith(ex));
      }
    });

    // Create metadata file
    const metadata = {
      timestamp,
      version,
      sourceDir,
      files: fileCount,
      created: new Date(timestamp).toISOString(),
      exclude: ['node_modules', ...exclude]
    };

    const metadataPath = path.join(backupPath, 'backup-metadata.json');
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

    return { backupPath, metadata };

  } catch (error) {
    // Clean up partial backup on failure
    try {
      await fse.remove(backupPath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    throw new Error(`Failed to create backup: ${error.message}`);
  }
}

/**
 * Validate backup directory structure and contents
 *
 * @param {string} backupPath - Path to backup directory
 * @returns {Promise<{valid: boolean, errors: string[]}>} Validation result
 */
export async function validateBackup(backupPath) {
  const errors = [];

  try {
    // Check backup directory exists
    const exists = await fse.pathExists(backupPath);
    if (!exists) {
      errors.push(`Backup directory does not exist: ${backupPath}`);
      return { valid: false, errors };
    }

    // Check metadata file exists
    const metadataPath = path.join(backupPath, 'backup-metadata.json');
    const metadataExists = await fse.pathExists(metadataPath);
    if (!metadataExists) {
      errors.push('Backup metadata file missing: backup-metadata.json');
      return { valid: false, errors };
    }

    // Parse and validate metadata
    let metadata;
    try {
      const metadataContent = await readFile(metadataPath, 'utf8');
      metadata = JSON.parse(metadataContent);

      if (!metadata.timestamp || !metadata.version || !metadata.files) {
        errors.push('Backup metadata is incomplete (missing timestamp, version, or files count)');
      }
    } catch (error) {
      errors.push(`Invalid metadata JSON: ${error.message}`);
      return { valid: false, errors };
    }

    // Check critical files/directories exist
    const criticalPaths = [
      'package.json',
      '.gsd-config.json',
      'scripts',
      'templates',
      'guidelines'
    ];

    for (const criticalPath of criticalPaths) {
      const fullPath = path.join(backupPath, criticalPath);
      const exists = await fse.pathExists(fullPath);
      if (!exists) {
        errors.push(`Missing critical file/directory: ${criticalPath}`);
      }
    }

    // Count files in backup and compare to metadata
    const actualFileCount = await countFiles(backupPath, ['backup-metadata.json']);
    const expectedFileCount = metadata.files;

    // Allow small variance (±5%) for file count differences
    const variance = Math.abs(actualFileCount - expectedFileCount);
    const allowedVariance = Math.ceil(expectedFileCount * 0.05);

    if (variance > allowedVariance) {
      errors.push(`File count mismatch: expected ~${expectedFileCount}, found ${actualFileCount}`);
    }

    return { valid: errors.length === 0, errors };

  } catch (error) {
    errors.push(`Validation error: ${error.message}`);
    return { valid: false, errors };
  }
}

/**
 * Restore backup to target directory with safety net
 *
 * @param {string} backupPath - Path to backup directory
 * @param {string} targetDir - Target directory to restore to (default: 'gsd')
 * @param {object} options - Restore options
 * @param {boolean} options.preserveNodeModules - Keep existing node_modules (default: true)
 * @returns {Promise<{restored: boolean, backupPath: string, tempBackup: string}>} Restore result
 * @throws {Error} If restore fails and rollback succeeds
 */
export async function restoreBackup(backupPath, targetDir = 'gsd', options = {}) {
  const { preserveNodeModules = true } = options;

  // Step 1: Validate backup before restore
  const validation = await validateBackup(backupPath);
  if (!validation.valid) {
    throw new Error(`Cannot restore invalid backup:\n${validation.errors.join('\n')}`);
  }

  // Step 2: Create temp backup of current state (safety net)
  const tempBackupPath = path.join('.gsd-backups', `temp-backup-${Date.now()}`);
  let tempBackupCreated = false;

  try {
    // Backup current state if target exists
    const targetExists = await fse.pathExists(targetDir);
    if (targetExists) {
      await fse.ensureDir('.gsd-backups');
      await fse.copy(targetDir, tempBackupPath);
      tempBackupCreated = true;
    }

    // Step 3: Save node_modules if preserving
    let nodeModulesPath = null;
    if (preserveNodeModules) {
      const nodeModulesSource = path.join(targetDir, 'node_modules');
      const nodeModulesExists = await fse.pathExists(nodeModulesSource);
      if (nodeModulesExists) {
        nodeModulesPath = path.join('.gsd-backups', `temp-node_modules-${Date.now()}`);
        await fse.move(nodeModulesSource, nodeModulesPath);
      }
    }

    // Step 4: Remove existing target directory (except node_modules already moved)
    if (targetExists) {
      await fse.remove(targetDir);
    }

    // Step 5: Copy backup to target
    await fse.copy(backupPath, targetDir, {
      filter: (src) => {
        // Exclude metadata file from restore
        return !src.endsWith('backup-metadata.json');
      }
    });

    // Step 6: Restore node_modules if preserved
    if (nodeModulesPath) {
      const nodeModulesTarget = path.join(targetDir, 'node_modules');
      await fse.move(nodeModulesPath, nodeModulesTarget);
    }

    return { restored: true, backupPath, tempBackup: tempBackupCreated ? tempBackupPath : null };

  } catch (error) {
    // Restore from temp backup on failure
    if (tempBackupCreated) {
      console.error(`Restore failed: ${error.message}`);
      console.log('Rolling back from temp backup...');

      try {
        await fse.remove(targetDir);
        await fse.copy(tempBackupPath, targetDir);
        console.log('✅ Rollback complete. System restored to previous state.');
      } catch (rollbackError) {
        throw new Error(`Restore failed AND rollback failed: ${rollbackError.message}`);
      }
    }

    throw new Error(`Failed to restore backup: ${error.message}`);
  }
}

/**
 * List available backups with metadata
 *
 * @param {string} backupsDir - Directory containing backups (default: '.gsd-backups')
 * @returns {Promise<Array<{path: string, timestamp: number, version: string, filesCount: number, valid: boolean}>>} List of backups sorted by timestamp (newest first)
 */
export async function listBackups(backupsDir = '.gsd-backups') {
  try {
    // Check if backups directory exists
    const exists = await fse.pathExists(backupsDir);
    if (!exists) {
      return [];
    }

    // Read directory contents
    const entries = await readdir(backupsDir, { withFileTypes: true });

    // Filter for backup directories (backup-*)
    const backupDirs = entries
      .filter(entry => entry.isDirectory() && entry.name.startsWith('backup-'))
      .map(entry => path.join(backupsDir, entry.name));

    // Read metadata from each backup
    const backups = await Promise.all(
      backupDirs.map(async (backupPath) => {
        try {
          const metadataPath = path.join(backupPath, 'backup-metadata.json');
          const metadataContent = await readFile(metadataPath, 'utf8');
          const metadata = JSON.parse(metadataContent);

          // Validate backup
          const validation = await validateBackup(backupPath);

          return {
            path: backupPath,
            timestamp: metadata.timestamp,
            version: metadata.version,
            filesCount: metadata.files,
            created: metadata.created,
            valid: validation.valid
          };
        } catch (error) {
          // Return corrupted backup with minimal info
          return {
            path: backupPath,
            timestamp: 0,
            version: 'unknown',
            filesCount: 0,
            created: 'unknown',
            valid: false
          };
        }
      })
    );

    // Sort by timestamp (newest first)
    backups.sort((a, b) => b.timestamp - a.timestamp);

    return backups;

  } catch (error) {
    throw new Error(`Failed to list backups: ${error.message}`);
  }
}

/**
 * Count files recursively in directory (helper function)
 *
 * @param {string} dirPath - Directory to count files in
 * @param {string[]} exclude - Paths to exclude from count
 * @returns {Promise<number>} File count
 */
async function countFiles(dirPath, exclude = []) {
  let count = 0;

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(dirPath, fullPath);

      // Skip excluded paths
      if (exclude.some(ex => relativePath.startsWith(ex))) {
        continue;
      }

      if (entry.isDirectory()) {
        count += await countFiles(fullPath, exclude);
      } else if (entry.isFile()) {
        count++;
      }
    }

    return count;
  } catch (error) {
    return 0;
  }
}
