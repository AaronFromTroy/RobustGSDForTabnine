/**
 * Version detection and update notification module
 * Supports dual-mode version checking: npm registry and local sources
 *
 * Usage patterns:
 * - npm mode: Queries npm registry for latest published version
 * - local mode: Reads version from local filesystem path (for offline/dev upgrades)
 *
 * Network failures handled gracefully - returns null instead of crashing
 */

import { readFile } from './file-ops.js';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get current GSD version from package.json
 * @returns {Promise<string|null>} Current version string or null if not found
 */
export async function getCurrentVersion() {
  try {
    const packagePath = join(__dirname, '..', 'package.json');
    const content = await readFile(packagePath);
    const pkg = JSON.parse(content);
    return pkg.version || null;
  } catch (error) {
    console.error('Warning: Could not read current version:', error.message);
    return null;
  }
}

/**
 * Get latest version from specified source
 * @param {Object} options - Configuration options
 * @param {string} options.source - Source type: 'npm' or 'local'
 * @param {string} options.localPath - Path to local GSD installation (for local mode)
 * @param {string} options.packageName - npm package name (for npm mode)
 * @returns {Promise<string|null>} Latest version string or null if unavailable
 */
export async function getLatestVersion(options = {}) {
  const {
    source = 'npm',
    localPath = null,
    packageName = 'gsd-for-tabnine'
  } = options;

  if (source === 'npm') {
    return await getLatestVersionFromNpm(packageName);
  } else if (source === 'local') {
    return await getLatestVersionFromLocal(localPath);
  } else {
    console.error(`Unknown source: ${source}. Use 'npm' or 'local'.`);
    return null;
  }
}

/**
 * Query npm registry for latest version
 * @param {string} packageName - npm package name
 * @returns {Promise<string|null>} Latest version or null on error
 */
async function getLatestVersionFromNpm(packageName) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`https://registry.npmjs.org/${packageName}`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        console.error(`Package not found on npm: ${packageName}`);
      } else {
        console.error(`npm registry error: ${response.status}`);
      }
      return null;
    }

    const data = await response.json();
    const latest = data['dist-tags']?.latest;

    if (!latest) {
      console.error('No latest version tag in npm registry response');
      return null;
    }

    return latest;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('npm registry request timed out');
    } else {
      console.error('Failed to fetch from npm registry:', error.message);
    }
    return null;
  }
}

/**
 * Read version from local filesystem path
 * @param {string|null} localPath - Path to local GSD installation
 * @returns {Promise<string|null>} Version from local package.json or null
 */
async function getLatestVersionFromLocal(localPath) {
  if (!localPath) {
    console.error('Local path required for local source mode');
    return null;
  }

  try {
    const packagePath = join(localPath, 'package.json');
    const content = await readFile(packagePath);
    const pkg = JSON.parse(content);

    if (pkg.name !== 'gsd-for-tabnine') {
      console.error(`Invalid GSD source: package.json has name "${pkg.name}" (expected "gsd-for-tabnine")`);
      return null;
    }

    return pkg.version || null;

  } catch (error) {
    console.error(`Failed to read version from ${localPath}:`, error.message);
    return null;
  }
}

/**
 * Check for available updates
 * @param {Object} options - Options passed to getLatestVersion
 * @returns {Promise<Object>} Update status with hasUpdate, current, latest, type, source
 */
export async function checkForUpdates(options = {}) {
  const source = options.source || 'npm';
  const current = await getCurrentVersion();

  if (!current) {
    return {
      hasUpdate: false,
      current: null,
      source,
      error: 'Could not determine current version'
    };
  }

  const latest = await getLatestVersion(options);

  if (!latest) {
    return {
      hasUpdate: false,
      current,
      source,
      error: 'Could not fetch latest version'
    };
  }

  // Compare versions using semver
  if (semver.gt(latest, current)) {
    const updateType = semver.diff(latest, current); // 'major', 'minor', 'patch'
    return {
      hasUpdate: true,
      current,
      latest,
      type: updateType,
      source
    };
  }

  // Already on latest or newer
  return {
    hasUpdate: false,
    current,
    latest,
    source
  };
}

/**
 * Check if npm registry is available
 * @returns {Promise<Object>} { available: boolean, reason: string|null }
 */
export async function checkNpmAvailability() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    // HEAD request - no download, just connectivity check
    const response = await fetch('https://registry.npmjs.org/', {
      method: 'HEAD',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return { available: true, reason: null };
    } else {
      return {
        available: false,
        reason: `HTTP ${response.status}: ${response.statusText}`
      };
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      return { available: false, reason: 'Request timed out' };
    } else if (error.message.includes('fetch')) {
      return { available: false, reason: 'Network error' };
    } else {
      return { available: false, reason: error.message };
    }
  }
}

/**
 * Validate if path contains a valid GSD installation
 * @param {string} path - Path to check
 * @returns {Promise<boolean>} True if valid GSD source
 */
export async function isValidGsdSource(path) {
  try {
    // Check package.json exists with correct name
    const packagePath = join(path, 'package.json');
    if (!existsSync(packagePath)) {
      return false;
    }

    const content = readFileSync(packagePath, 'utf8');
    const pkg = JSON.parse(content);

    if (pkg.name !== 'gsd-for-tabnine') {
      return false;
    }

    // Check required directories exist
    const requiredDirs = ['scripts', 'templates', 'guidelines'];
    for (const dir of requiredDirs) {
      const dirPath = join(path, dir);
      if (!existsSync(dirPath)) {
        return false;
      }
    }

    return true;

  } catch (error) {
    return false;
  }
}
