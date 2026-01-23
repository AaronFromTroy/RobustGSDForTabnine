/**
 * Upgrade Manager Module
 * Orchestrates complete GSD upgrade workflow with safety nets
 *
 * Critical patterns:
 * - Dual-mode source detection (npm registry + local filesystem)
 * - Automatic fallback (npm unavailable → try local)
 * - Dry-run preview before applying changes
 * - Backup before upgrade with validation
 * - Rollback on failure
 * - User confirmation required (unless --force)
 *
 * Upgrade workflow:
 * 1. Auto-detect source (npm first, local fallback)
 * 2. Preview changes (files updated/preserved/merged, migrations)
 * 3. Create backup and validate
 * 4. Apply file merge strategies
 * 5. Run version-specific migrations
 * 6. Validate upgraded installation
 * 7. Run npm install for dependencies
 * 8. On failure: restore backup
 */

import { getCurrentVersion, getLatestVersion, checkNpmAvailability, isValidGsdSource } from './version-checker.js';
import { createBackup, validateBackup, restoreBackup } from './backup-manager.js';
import { determineFileStrategy, applyUpgrade, mergeConfig } from './file-merger.js';
import { runMigrations, getApplicableMigrations } from './migration-runner.js';
import { readFile as fsReadFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { copy, remove } from 'fs-extra';

const execAsync = promisify(exec);

/**
 * Detect local GSD upgrade source
 * Checks multiple conventional locations for local GSD installations
 *
 * @returns {Promise<string|null>} Path to local source if found, null otherwise
 *
 * @example
 * const localPath = await detectLocalSource();
 * if (localPath) console.log('Found local source:', localPath);
 */
export async function detectLocalSource() {
  const candidates = [
    '../gsd-upgrade',
    '../gsd-latest',
    '../gsd-for-tabnine',
    process.env.GSD_UPGRADE_PATH
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (await isValidGsdSource(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Download GSD package from npm registry
 * Creates temp directory, runs npm pack, extracts tarball
 *
 * @param {Object} options - Download options
 * @param {string} options.version - Version to download (default: 'latest')
 * @returns {Promise<string>} Path to extracted package directory
 * @throws {Error} If download or extraction fails
 *
 * @example
 * const packagePath = await downloadFromNpm({ version: '1.2.0' });
 * console.log('Downloaded to:', packagePath);
 */
export async function downloadFromNpm(options = {}) {
  const { version = 'latest' } = options;
  const tempDir = `.gsd-temp-${Date.now()}`;

  try {
    // Create temp directory
    await execAsync(`mkdir "${tempDir}"`);

    // Download package tarball
    const packageSpec = version === 'latest' ? 'gsd-for-tabnine' : `gsd-for-tabnine@${version}`;
    await execAsync(`npm pack ${packageSpec}`, { cwd: tempDir });

    // Extract tarball (npm pack creates gsd-for-tabnine-{version}.tgz)
    await execAsync('tar -xzf *.tgz', { cwd: tempDir });

    // Return path to extracted package/ directory
    return path.join(tempDir, 'package');
  } catch (error) {
    // Clean up on failure
    try {
      await remove(tempDir);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    throw new Error(
      `Failed to download from npm: ${error.message}\n\n` +
      `Try one of these alternatives:\n` +
      `1. Clone GSD repo and set GSD_UPGRADE_PATH environment variable\n` +
      `2. Download tarball manually and extract to ../gsd-upgrade\n` +
      `3. Check network connectivity and npm configuration`
    );
  }
}

/**
 * Validate local GSD source directory
 * Checks that source contains valid GSD installation structure
 *
 * @param {string} localPath - Path to local source directory
 * @returns {Promise<string>} The localPath if valid
 * @throws {Error} If source is invalid with structure requirements
 *
 * @example
 * await validateLocalSource('../gsd-upgrade'); // throws if invalid
 */
export async function validateLocalSource(localPath) {
  const isValid = await isValidGsdSource(localPath);

  if (!isValid) {
    throw new Error(
      `Invalid GSD source at ${localPath}\n\n` +
      `Required structure:\n` +
      `- package.json (with name: "gsd-for-tabnine")\n` +
      `- scripts/ directory\n` +
      `- templates/ directory\n` +
      `- guidelines/ directory\n\n` +
      `Ensure the path points to a valid GSD installation.`
    );
  }

  return localPath;
}

/**
 * Preview upgrade changes without applying
 * Shows what will be updated/preserved/merged and which migrations will run
 *
 * @param {Object} options - Preview options
 * @param {string} options.source - Source mode: 'npm' or 'local'
 * @param {string} options.localPath - Path to local source (if source is 'local')
 * @returns {Promise<Object>} Preview object with hasUpdate, versions, files, migrations
 *
 * @example
 * const preview = await previewUpgrade();
 * if (preview.hasUpdate) {
 *   console.log(`Update available: ${preview.current} → ${preview.latest}`);
 * }
 */
export async function previewUpgrade(options = {}) {
  const current = await getCurrentVersion();

  // Auto-detect source if not specified
  let { source, localPath } = options;

  if (!source) {
    const npmAvailable = await checkNpmAvailability();
    if (npmAvailable.available) {
      source = 'npm';
    } else {
      const detectedLocal = await detectLocalSource();
      if (detectedLocal) {
        source = 'local';
        localPath = detectedLocal;
      } else {
        // Neither available - return no update
        return {
          hasUpdate: false,
          current,
          latest: current,
          source: 'none'
        };
      }
    }
  }

  // Get latest version
  const latest = await getLatestVersion({ source, localPath });

  if (!latest) {
    return {
      hasUpdate: false,
      current,
      latest: current,
      source
    };
  }

  // Check if update available
  const semver = await import('semver');
  const hasUpdate = semver.default.gt(latest, current);

  if (!hasUpdate) {
    return {
      hasUpdate: false,
      current,
      latest,
      source
    };
  }

  // Determine update type
  const updateType = semver.default.diff(current, latest) || 'patch';

  // Get applicable migrations
  const migrations = await getApplicableMigrations(current, latest);

  // Estimate file changes (simplified - would need actual source to scan)
  const filesUpdated = [
    'templates/ (12 files)',
    'guidelines/ (5 files)',
    'scripts/ (25+ files)',
    'package.json'
  ];

  const filesPreserved = [
    '.gsd-config.json (your customizations)'
  ];

  const filesMerged = [];

  // Display formatted preview
  console.log(`\n=== Upgrade Preview ===`);
  console.log(`From: ${current} → To: ${latest} (${updateType})`);
  console.log(`\nFiles to update:`);
  filesUpdated.forEach(file => console.log(`  📝 ${file}`));
  console.log(`\nFiles to preserve:`);
  filesPreserved.forEach(file => console.log(`  ✅ ${file}`));

  if (migrations.length > 0) {
    console.log(`\nMigrations to run:`);
    migrations.forEach(migration => {
      console.log(`  🔧 ${migration.description} (${migration.version})`);
    });
  } else {
    console.log(`\nNo migrations required.`);
  }

  return {
    hasUpdate: true,
    current,
    latest,
    updateType,
    filesUpdated,
    filesPreserved,
    filesMerged,
    migrations,
    source
  };
}

/**
 * Perform GSD upgrade
 * Complete workflow: detect source → preview → backup → merge → migrate → validate
 *
 * @param {Object} options - Upgrade options
 * @param {string} options.source - Source mode: 'npm', 'local', or undefined (auto-detect)
 * @param {string} options.localPath - Path to local source (if source is 'local')
 * @param {boolean} options.dryRun - If true, preview only (no changes)
 * @param {boolean} options.force - If true, skip user confirmation
 * @param {string} options.version - Version to upgrade to (default: 'latest')
 * @returns {Promise<Object>} Upgrade result with success, backupPath, source
 * @throws {Error} If upgrade fails (after rollback attempt)
 *
 * @example
 * // Auto-detect source, dry-run preview
 * await upgrade({ dryRun: true });
 *
 * // Upgrade from npm with confirmation
 * await upgrade({ source: 'npm' });
 *
 * // Upgrade from local without confirmation
 * await upgrade({ source: 'local', localPath: '../gsd-upgrade', force: true });
 */
export async function upgrade(options = {}) {
  const { dryRun = false, force = false, version = 'latest' } = options;
  let { source, localPath } = options;
  let sourceDir;
  let backupPath;

  try {
    // Step 1: Smart Source Detection
    if (!source) {
      console.log('\n🔍 Detecting upgrade source...');

      const npmCheck = await checkNpmAvailability();
      if (npmCheck.available) {
        source = 'npm';
        console.log('✅ npm registry available');
      } else {
        console.log(`⚠️  npm registry unavailable: ${npmCheck.reason}`);
        console.log('🔍 Checking for local upgrade sources...');

        const detectedLocal = await detectLocalSource();
        if (detectedLocal) {
          source = 'local';
          localPath = detectedLocal;
          console.log(`✅ Found local source: ${detectedLocal}`);
        } else {
          throw new Error(
            `No upgrade source available.\n\n` +
            `npm registry: ${npmCheck.reason}\n` +
            `Local sources: Not found in ../gsd-upgrade, ../gsd-latest, or GSD_UPGRADE_PATH\n\n` +
            `To upgrade manually:\n` +
            `1. Clone GSD repo to ../gsd-upgrade\n` +
            `2. Or set GSD_UPGRADE_PATH=/path/to/gsd\n` +
            `3. Or fix npm connectivity`
          );
        }
      }
    }

    // Step 2: Validate Source Before Proceeding
    if (source === 'npm') {
      console.log(`\n📦 Downloading from npm...`);
      try {
        sourceDir = await downloadFromNpm({ version });
        console.log(`✅ Downloaded to: ${sourceDir}`);
      } catch (npmError) {
        // Try local fallback
        console.log(`\n⚠️  npm download failed: ${npmError.message}`);
        console.log('🔍 Trying local source fallback...');

        const detectedLocal = await detectLocalSource();
        if (detectedLocal) {
          source = 'local';
          localPath = detectedLocal;
          sourceDir = await validateLocalSource(localPath);
          console.log(`✅ Using local source: ${sourceDir}`);
        } else {
          throw npmError; // No fallback available
        }
      }
    } else if (source === 'local') {
      console.log(`\n📁 Using local source: ${localPath}`);
      sourceDir = await validateLocalSource(localPath);
      console.log(`✅ Validated local source`);
    }

    // Step 3: Preview upgrade
    const preview = await previewUpgrade({ source, localPath });

    // Step 4: Dry-run check
    if (dryRun) {
      console.log(`\n[DRY-RUN] No changes applied.`);
      return { dryRun: true, preview };
    }

    // Step 5: No update check
    if (!preview.hasUpdate) {
      console.log(`\n✅ Already on latest version (${preview.current})`);
      return { success: true, current: preview.current, source };
    }

    // Step 6: User confirmation (unless force)
    if (!force) {
      console.log(`\n⚠️  This will upgrade GSD from ${preview.current} to ${preview.latest}`);
      console.log(`Backup will be created before applying changes.`);
      console.log(`\nTo proceed, run with --force flag or confirm in your workflow.`);
      return { requiresConfirmation: true, preview };
    }

    // Step 7: Create backup
    console.log(`\n💾 Creating backup...`);
    const backup = await createBackup('gsd');
    backupPath = backup.backupPath;
    console.log(`✅ Backup created: ${backupPath}`);

    // Step 8: Validate backup
    console.log(`\n🔍 Validating backup...`);
    const validation = await validateBackup(backupPath);
    if (!validation.valid) {
      throw new Error(
        `Backup validation failed:\n` +
        validation.errors.map((err, i) => `  ${i + 1}. ${err}`).join('\n')
      );
    }
    console.log(`✅ Backup validated`);

    // Step 9: Apply upgrade
    console.log(`\n📝 Applying upgrade...`);
    const mergeResult = await applyUpgrade(sourceDir, 'gsd', backupPath);
    console.log(`✅ Upgrade applied:`);
    console.log(`  - Files updated: ${mergeResult.filesUpdated}`);
    console.log(`  - Files preserved: ${mergeResult.filesPreserved}`);
    console.log(`  - Files merged: ${mergeResult.filesMerged}`);

    // Step 10: Run migrations
    if (preview.migrations.length > 0) {
      console.log(`\n🔧 Running migrations...`);
      const migrationResult = await runMigrations(preview.current, preview.latest);
      console.log(`✅ Migrations complete: ${migrationResult.migrationsRun} executed`);
    }

    // Step 11: Validate upgraded installation
    console.log(`\n🔍 Validating upgraded installation...`);
    const packageJsonPath = path.join('gsd', 'package.json');
    const packageJson = JSON.parse(await fsReadFile(packageJsonPath, 'utf8'));
    if (packageJson.version !== preview.latest) {
      throw new Error(
        `Version mismatch after upgrade: expected ${preview.latest}, got ${packageJson.version}`
      );
    }
    console.log(`✅ Installation validated`);

    // Step 12: Run npm install
    console.log(`\n📦 Installing dependencies...`);
    await execAsync('npm install', { cwd: 'gsd' });
    console.log(`✅ Dependencies installed`);

    // Success
    console.log(`\n✅ Upgrade complete!`);
    console.log(`\nUpgraded: ${preview.current} → ${preview.latest}`);
    console.log(`Backup: ${backupPath}`);
    console.log(`Source: ${source}`);
    console.log(`\nVerify everything works, then remove backup from .gsd-backups/`);

    return {
      success: true,
      from: preview.current,
      to: preview.latest,
      backupPath,
      source
    };
  } catch (error) {
    // Step 13: Rollback on failure
    if (backupPath) {
      console.log(`\n❌ Upgrade failed: ${error.message}`);
      console.log(`\n🔄 Rolling back from backup...`);

      try {
        await restoreBackup(backupPath, 'gsd');
        console.log(`✅ Rollback successful`);
      } catch (rollbackError) {
        console.log(`❌ Rollback failed: ${rollbackError.message}`);
        console.log(`\nManual recovery required:`);
        console.log(`  1. Remove corrupted gsd/ directory`);
        console.log(`  2. Copy backup from ${backupPath}`);
      }
    }

    throw error;
  }
}
