/**
 * File operations utility module
 * Provides atomic file writes, safe reads, and cross-platform path handling
 *
 * Critical patterns:
 * - Uses write-file-atomic for STATE.md persistence (prevents corruption)
 * - All functions async (no *Sync methods - blocks event loop)
 * - Uses node: protocol for built-in imports
 * - Cross-platform path handling with path.join()
 */

import { readFile as fsReadFile, access, mkdir } from 'node:fs/promises';
import writeFile from 'write-file-atomic';
import path from 'node:path';

/**
 * Read file contents as UTF-8 string
 * @param {string} filePath - Absolute or relative path to file
 * @returns {Promise<string>} File contents
 * @throws {Error} If file not found or read fails
 */
export async function readFile(filePath) {
  try {
    const content = await fsReadFile(filePath, 'utf8');
    return content;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw new Error(`Failed to read ${filePath}: ${error.message}`);
  }
}

/**
 * Write file contents atomically using temp-file-then-rename pattern
 * Prevents file corruption on interruption (Ctrl+C, crash, kill)
 *
 * @param {string} filePath - Absolute or relative path to file
 * @param {string} content - String content to write
 * @returns {Promise<void>}
 * @throws {Error} If write fails
 */
export async function writeFileAtomic(filePath, content) {
  try {
    // write-file-atomic uses temp-file-then-rename pattern
    // Atomic operation: file is either fully written or not at all
    await writeFile(filePath, content, 'utf8');
  } catch (error) {
    throw new Error(`Failed to write ${filePath}: ${error.message}`);
  }
}

/**
 * Check if file exists
 * @param {string} filePath - Absolute or relative path to file
 * @returns {Promise<boolean>} True if file exists, false otherwise
 * @throws {Error} For errors other than ENOENT (e.g., permission denied)
 */
export async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    // Rethrow other errors (permission denied, etc.)
    throw error;
  }
}

/**
 * Ensure directory exists, creating parent directories as needed
 * No error if directory already exists
 *
 * @param {string} dirPath - Absolute or relative path to directory
 * @returns {Promise<void>}
 * @throws {Error} If directory creation fails
 */
export async function ensureDir(dirPath) {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
  }
}
