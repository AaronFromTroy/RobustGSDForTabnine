#!/usr/bin/env node
/**
 * Codebase detection module
 * Detects whether current directory contains an existing codebase vs new/empty project
 *
 * Detection criteria:
 * - Dependency files (package.json, requirements.txt, Cargo.toml, etc.)
 * - Common source directories (src/, app/, lib/, components/, etc.)
 * - More than just .git/ and gsd/ in directory
 *
 * Returns:
 * - isExisting: boolean indicating if existing codebase detected
 * - indicators: array of detected files/directories
 * - confidence: HIGH/MEDIUM/LOW based on indicators strength
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Detects if the current directory contains an existing codebase
 * vs being a new/empty project directory.
 *
 * Detection criteria:
 * - Dependency files (package.json, requirements.txt, Cargo.toml, go.mod, etc.)
 * - Common source directories (src/, app/, lib/, components/, etc.)
 * - More than just .git/ and gsd/ in directory
 *
 * @param {string} targetDir - Directory to check (defaults to current working directory)
 * @returns {{isExisting: boolean, indicators: string[], confidence: string}}
 */
export function detectExistingCodebase(targetDir = process.cwd()) {
  const indicators = [];

  // Check for dependency/package manager files
  const depFiles = [
    'package.json',
    'requirements.txt',
    'Cargo.toml',
    'go.mod',
    'composer.json',
    'Gemfile',
    'pom.xml',
    'build.gradle',
    'Pipfile'
  ];
  const foundDepFiles = depFiles.filter(f => fs.existsSync(path.join(targetDir, f)));
  if (foundDepFiles.length > 0) {
    indicators.push(...foundDepFiles.map(f => `dependency:${f}`));
  }

  // Check for common source directories
  const srcDirs = [
    'src',
    'app',
    'lib',
    'components',
    'pages',
    'views',
    'controllers',
    'models',
    'routes',
    'api'
  ];
  const foundSrcDirs = srcDirs.filter(d => {
    const dirPath = path.join(targetDir, d);
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  });
  if (foundSrcDirs.length > 0) {
    indicators.push(...foundSrcDirs.map(d => `directory:${d}`));
  }

  // Check for config files suggesting existing project
  const configFiles = [
    '.env',
    '.env.example',
    'tsconfig.json',
    'jsconfig.json',
    '.eslintrc.json',
    '.eslintrc.js',
    'vite.config.js',
    'next.config.js',
    'webpack.config.js',
    '.prettierrc'
  ];
  const foundConfigFiles = configFiles.filter(f => fs.existsSync(path.join(targetDir, f)));
  if (foundConfigFiles.length > 0) {
    indicators.push(...foundConfigFiles.map(f => `config:${f}`));
  }

  // Check for non-GSD, non-git files in root
  const entries = fs.readdirSync(targetDir, { withFileTypes: true });
  const meaningfulEntries = entries.filter(e =>
    !e.name.startsWith('.') &&
    e.name !== 'gsd' &&
    e.name !== 'node_modules' &&
    e.name !== '.planning'
  );
  if (meaningfulEntries.length > 0) {
    indicators.push(...meaningfulEntries.slice(0, 3).map(e => `root:${e.name}`));
  }

  // Determine confidence
  let confidence = 'LOW';
  if (foundDepFiles.length > 0 || foundSrcDirs.length > 0) {
    confidence = 'HIGH';
  } else if (meaningfulEntries.length > 3 || foundConfigFiles.length > 1) {
    confidence = 'MEDIUM';
  }

  const isExisting = indicators.length > 0;

  return { isExisting, indicators, confidence };
}

// CLI execution
if (import.meta.url.startsWith('file://') && process.argv[1] && import.meta.url.includes(path.basename(process.argv[1]))) {
  const result = detectExistingCodebase();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.isExisting ? 0 : 1);
}
