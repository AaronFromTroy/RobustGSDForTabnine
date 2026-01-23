/**
 * File Merger Module
 * Provides file merge strategies for safe GSD upgrades
 *
 * Critical patterns:
 * - Three-way merge for user config (.gsd-config.json)
 * - Overwrite for GSD core files (templates/, guidelines/, scripts/)
 * - Preserves user customizations during upgrades
 * - Validates merged config against JSON Schema
 *
 * Strategy Rules:
 * - PRESERVE: User-editable files (.gsd-config.json)
 * - OVERWRITE: GSD core files (templates/, guidelines/, scripts/, package.json, docs)
 * - MERGE: Reserved for future user-customizable templates
 */

import { merge } from 'json-merge-patch';
import { readFile as fsReadFile, writeFile as fsWriteFile } from 'node:fs/promises';
import { copy } from 'fs-extra';
import path from 'node:path';
import Ajv from 'ajv';

/**
 * File strategy constants
 * Defines merge behavior for different file types during upgrade
 */
const FILE_STRATEGIES = {
  PRESERVE: ['.gsd-config.json'],
  OVERWRITE: [
    'templates/',
    'guidelines/',
    'scripts/',
    'package.json',
    'README.md',
    'QUICKSTART.md',
    'LICENSE',
    'CHANGELOG.md'
  ],
  MERGE: [] // Future: user-customizable templates
};

/**
 * Determine merge strategy for a given file path
 *
 * @param {string} filePath - Relative file path from gsd/ directory
 * @returns {string} Strategy: 'PRESERVE', 'OVERWRITE', or 'MERGE'
 *
 * @example
 * determineFileStrategy('.gsd-config.json') // => 'PRESERVE'
 * determineFileStrategy('templates/PROJECT.md') // => 'OVERWRITE'
 * determineFileStrategy('scripts/state-manager.js') // => 'OVERWRITE'
 */
export function determineFileStrategy(filePath) {
  // Normalize path separators for cross-platform compatibility
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Check PRESERVE first (highest priority)
  for (const pattern of FILE_STRATEGIES.PRESERVE) {
    if (normalizedPath.includes(pattern)) {
      return 'PRESERVE';
    }
  }

  // Check OVERWRITE
  for (const pattern of FILE_STRATEGIES.OVERWRITE) {
    if (normalizedPath.includes(pattern)) {
      return 'OVERWRITE';
    }
  }

  // Check MERGE
  for (const pattern of FILE_STRATEGIES.MERGE) {
    if (normalizedPath.includes(pattern)) {
      return 'MERGE';
    }
  }

  // Default: OVERWRITE for unknown files (safer to update)
  return 'OVERWRITE';
}

/**
 * Perform three-way merge of configuration files
 * Preserves user customizations while applying new version changes
 *
 * Three-way merge strategy:
 * 1. Start with new config (has latest structure)
 * 2. Overlay user changes from user config
 * 3. Validate merged result against JSON Schema
 *
 * @param {string} basePath - Path to original config from backup (base version)
 * @param {string} userPath - Path to user's current config
 * @param {string} newPath - Path to new version config from package
 * @param {string} outputPath - Path where merged config will be written
 * @returns {Promise<Object>} Result object with merged config and user changes
 *
 * @throws {Error} If merged config is invalid per JSON Schema
 *
 * @example
 * await mergeConfig(
 *   '.gsd-backups/backup-123/.gsd-config.json',
 *   'gsd/.gsd-config.json',
 *   'new-gsd/.gsd-config.json',
 *   'gsd/.gsd-config.json'
 * )
 */
export async function mergeConfig(basePath, userPath, newPath, outputPath) {
  // Read all three versions
  const baseContent = await fsReadFile(basePath, 'utf8');
  const userContent = await fsReadFile(userPath, 'utf8');
  const newContent = await fsReadFile(newPath, 'utf8');

  const baseConfig = JSON.parse(baseContent);
  const userConfig = JSON.parse(userContent);
  const newConfig = JSON.parse(newContent);

  // Detect user changes: compare user config to base config
  // Only preserve user-added fields, not system fields that should update
  const systemFields = ['version', 'schemaVersion']; // Fields that should always come from new version
  const userChanges = [];
  const userOnlyChanges = {};

  for (const [key, value] of Object.entries(userConfig)) {
    const baseValue = baseConfig[key];
    const isSystemField = systemFields.includes(key);

    if (!isSystemField && JSON.stringify(value) !== JSON.stringify(baseValue)) {
      userChanges.push(`${key}: ${JSON.stringify(value)}`);
      userOnlyChanges[key] = value;
    }
  }

  // Perform merge: start with new config, overlay only user changes (not system fields)
  const merged = merge(newConfig, userOnlyChanges);

  // Validate merged config against JSON Schema
  // Load config schema
  const schemaPath = path.join(path.dirname(newPath), 'config-schema.json');
  let schema;
  try {
    const schemaContent = await fsReadFile(schemaPath, 'utf8');
    schema = JSON.parse(schemaContent);
  } catch (error) {
    // If schema doesn't exist, skip validation
    console.warn(`Warning: config-schema.json not found at ${schemaPath}, skipping validation`);
    schema = null;
  }

  if (schema) {
    const ajv = new Ajv();
    const validate = ajv.compile(schema);
    const valid = validate(merged);

    if (!valid) {
      const errors = validate.errors.map(err => {
        const field = err.instancePath.replace(/^\//, '') || err.params.missingProperty || 'config';
        return `${field}: ${err.message}`;
      });
      throw new Error(
        `Merged config validation failed:\n` +
        errors.map((err, i) => `  ${i + 1}. ${err}`).join('\n') + '\n\n' +
        `User changes applied:\n` +
        userChanges.map(change => `  - ${change}`).join('\n')
      );
    }
  }

  // Write merged config
  await fsWriteFile(outputPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');

  return {
    merged,
    userChanges
  };
}

/**
 * Apply upgrade from source directory to target directory
 * Uses file strategies to determine how each file is handled
 *
 * @param {string} sourceDir - Path to new version (e.g., downloaded package)
 * @param {string} targetDir - Path to user's current installation
 * @param {string} backupPath - Path to backup for three-way merge reference
 * @param {Object} options - Optional configuration
 * @param {boolean} options.dryRun - If true, log actions without executing
 * @returns {Promise<Object>} Summary: { filesUpdated, filesPreserved, filesMerged }
 *
 * @example
 * const result = await applyUpgrade(
 *   'new-gsd/',
 *   'gsd/',
 *   '.gsd-backups/backup-123/'
 * )
 * console.log(`Updated: ${result.filesUpdated}, Preserved: ${result.filesPreserved}`)
 */
export async function applyUpgrade(sourceDir, targetDir, backupPath, options = {}) {
  const { dryRun = false } = options;
  const stats = {
    filesUpdated: 0,
    filesPreserved: 0,
    filesMerged: 0
  };

  // Import readdirSync for directory traversal
  const fs = await import('node:fs');
  const { readdirSync, statSync } = fs.default;

  /**
   * Recursively process directory
   */
  async function processDirectory(relativePath = '') {
    const sourcePath = path.join(sourceDir, relativePath);
    const entries = readdirSync(sourcePath);

    for (const entry of entries) {
      const entryRelativePath = path.join(relativePath, entry);
      const entrySourcePath = path.join(sourceDir, entryRelativePath);
      const entryTargetPath = path.join(targetDir, entryRelativePath);
      const entryBackupPath = path.join(backupPath, entryRelativePath);

      // Skip node_modules
      if (entry === 'node_modules') {
        continue;
      }

      const stat = statSync(entrySourcePath);

      if (stat.isDirectory()) {
        // Recurse into directory
        await processDirectory(entryRelativePath);
      } else if (stat.isFile()) {
        // Determine strategy for this file
        const strategy = determineFileStrategy(entryRelativePath);

        if (strategy === 'PRESERVE') {
          console.log(`  PRESERVE: ${entryRelativePath}`);
          stats.filesPreserved++;
          // Don't touch user's file
        } else if (strategy === 'OVERWRITE') {
          console.log(`  OVERWRITE: ${entryRelativePath}`);
          if (!dryRun) {
            await copy(entrySourcePath, entryTargetPath, { overwrite: true });
          }
          stats.filesUpdated++;
        } else if (strategy === 'MERGE') {
          console.log(`  MERGE: ${entryRelativePath}`);
          if (!dryRun) {
            // Special handling for .gsd-config.json (currently the only PRESERVE file)
            // This branch is for future MERGE files
            await mergeConfig(
              entryBackupPath,
              entryTargetPath,
              entrySourcePath,
              entryTargetPath
            );
          }
          stats.filesMerged++;
        }
      }
    }
  }

  await processDirectory();

  return stats;
}
