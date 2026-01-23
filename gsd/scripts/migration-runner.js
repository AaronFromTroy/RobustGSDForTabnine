/**
 * Migration Runner Module
 * Executes version-specific migration scripts following Nx/Angular pattern
 *
 * Critical patterns:
 * - Sequential execution (migrations run in version order)
 * - Fail-fast behavior (stop on first migration failure)
 * - Version filtering (only run migrations between current and target)
 * - Dynamic import for migration scripts
 *
 * Migration registry format (migrations.json):
 * {
 *   "version": "2",
 *   "migrations": {
 *     "migration-id": {
 *       "version": "1.1.0",
 *       "description": "Migrate config schema to v2",
 *       "implementation": "./migrations/1.0.0-to-1.1.0.js",
 *       "type": "breaking-change"
 *     }
 *   }
 * }
 */

import { readFile } from 'node:fs/promises';
import semver from 'semver';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get migrations applicable for upgrade from one version to another
 * Filters migrations by version range and sorts by version ascending
 *
 * @param {string} fromVersion - Current version (e.g., "1.0.0")
 * @param {string} toVersion - Target version (e.g., "1.2.0")
 * @returns {Promise<Array>} Array of migration objects sorted by version
 *
 * @example
 * const migrations = await getApplicableMigrations('1.0.0', '1.2.0')
 * // Returns migrations with version > 1.0.0 AND <= 1.2.0
 */
export async function getApplicableMigrations(fromVersion, toVersion) {
  // Read migrations registry
  const registryPath = path.join(__dirname, 'migrations', 'migrations.json');
  let registry;
  try {
    const registryContent = await readFile(registryPath, 'utf8');
    registry = JSON.parse(registryContent);
  } catch (error) {
    // Registry doesn't exist or invalid - return empty array
    console.warn(`Migration registry not found at ${registryPath}, no migrations to run`);
    return [];
  }

  // Handle empty registry
  if (!registry.migrations || Object.keys(registry.migrations).length === 0) {
    return [];
  }

  // Filter migrations by version range
  const applicableMigrations = [];
  for (const [id, migration] of Object.entries(registry.migrations)) {
    const migrationVersion = migration.version;

    // Include if: version > fromVersion AND version <= toVersion
    const isApplicable = semver.gt(migrationVersion, fromVersion) &&
                        semver.lte(migrationVersion, toVersion);

    if (isApplicable) {
      applicableMigrations.push({
        id,
        ...migration
      });
    }
  }

  // Sort by version ascending (oldest to newest)
  applicableMigrations.sort((a, b) => semver.compare(a.version, b.version));

  return applicableMigrations;
}

/**
 * Run migrations sequentially from one version to another
 * Stops on first migration failure
 *
 * @param {string} fromVersion - Current version (e.g., "1.0.0")
 * @param {string} toVersion - Target version (e.g., "1.2.0")
 * @param {Object} options - Optional configuration
 * @param {string} options.targetDir - Target directory for migrations (default: current directory)
 * @param {boolean} options.dryRun - If true, log migrations without executing
 * @returns {Promise<Object>} Result: { migrationsRun: number, results: array }
 *
 * @throws {Error} If any migration fails (stops execution)
 *
 * @example
 * const result = await runMigrations('1.0.0', '1.2.0')
 * console.log(`Ran ${result.migrationsRun} migrations`)
 */
export async function runMigrations(fromVersion, toVersion, options = {}) {
  const { targetDir = process.cwd(), dryRun = false } = options;

  // Get applicable migrations
  const migrations = await getApplicableMigrations(fromVersion, toVersion);

  if (migrations.length === 0) {
    console.log('No migrations to run');
    return { migrationsRun: 0, results: [] };
  }

  console.log(`Found ${migrations.length} migration(s) to run:`);
  for (const migration of migrations) {
    console.log(`  - ${migration.description} (${migration.version})`);
  }
  console.log('');

  const results = [];

  // Execute migrations sequentially
  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    console.log(`🔧 [${i + 1}/${migrations.length}] ${migration.description} (${migration.version})`);

    if (dryRun) {
      console.log(`   ⏩ Skipped (dry run)`);
      results.push({
        id: migration.id,
        version: migration.version,
        success: true,
        skipped: true
      });
      continue;
    }

    try {
      // Dynamically import migration script
      const migrationPath = path.join(__dirname, 'migrations', path.basename(migration.implementation));
      const migrationModule = await import(migrationPath);

      // Call default export (migration function)
      if (typeof migrationModule.default !== 'function') {
        throw new Error(`Migration ${migration.id} does not export a default function`);
      }

      await migrationModule.default({ targetDir });

      console.log(`   ✅ Complete`);
      results.push({
        id: migration.id,
        version: migration.version,
        success: true
      });
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);

      // Add failure to results
      results.push({
        id: migration.id,
        version: migration.version,
        success: false,
        error: error.message
      });

      // Stop on first failure
      throw new Error(
        `Migration failed: ${migration.description} (${migration.version})\n` +
        `Error: ${error.message}\n\n` +
        `Migrations completed: ${i}/${migrations.length}\n` +
        `Upgrade stopped to prevent data corruption.\n` +
        `Please fix the error and retry the upgrade.`
      );
    }
  }

  console.log('');
  console.log(`✅ All migrations completed successfully (${migrations.length}/${migrations.length})`);

  return {
    migrationsRun: migrations.length,
    results
  };
}
