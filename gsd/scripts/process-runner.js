/**
 * Safe child process execution wrapper
 * Uses spawn() instead of exec() to prevent shell injection and handle large outputs
 *
 * Critical patterns:
 * - spawn() with arguments array (no shell spawning)
 * - Streams output (no buffering limits)
 * - Proper error handling (attach 'error' before 'close')
 * - Promise-based API for async/await
 *
 * Usage examples:
 * - await runCommand('git', ['add', '.planning/STATE.md']);
 * - await runCommand('npm', ['install', 'packageName']);
 * - const { stdout } = await runCommand('git', ['rev-parse', 'HEAD']);
 */

import { spawn } from 'node:child_process';

/**
 * Execute a command safely using spawn()
 *
 * Why spawn() instead of exec():
 * - exec() spawns shell, interprets metacharacters - security risk with user input
 * - exec() buffers entire output in memory - fails with large outputs
 * - spawn() takes arguments as array - automatically escaped, no injection
 * - spawn() streams output - handles large outputs gracefully
 *
 * @param {string} command - Command to execute (e.g., 'git', 'npm', 'node')
 * @param {string[]} args - Arguments array (e.g., ['add', 'file.txt'])
 * @param {object} options - Options to pass to spawn (e.g., { cwd: '/path' })
 * @returns {Promise<{stdout: string, stderr: string, code: number}>}
 * @throws {Error} If process fails to start, is killed by signal, or exits non-zero
 */
export async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    // Default stdio: ignore stdin, capture stdout/stderr
    const spawnOptions = {
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options
    };

    const proc = spawn(command, args, spawnOptions);

    let stdout = '';
    let stderr = '';

    // Accumulate output from streams
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // CRITICAL: Handle 'error' event before 'close'
    // Fires if process fails to start (command not found, permission denied)
    proc.on('error', (err) => {
      reject(new Error(`Failed to start ${command}: ${err.message}`));
    });

    // Handle process completion
    proc.on('close', (code, signal) => {
      if (signal) {
        reject(new Error(`${command} killed by signal ${signal}`));
      } else if (code !== 0) {
        reject(new Error(
          `${command} failed with code ${code}\nstderr: ${stderr}`
        ));
      } else {
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          code
        });
      }
    });
  });
}
