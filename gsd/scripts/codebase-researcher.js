#!/usr/bin/env node
/**
 * Codebase research module
 * Analyzes existing codebases for tech stack, architecture, and conventions
 *
 * Analysis includes:
 * - Tech stack (languages, frameworks, libraries)
 * - Directory structure and architecture patterns
 * - Code conventions (linting, formatting configs)
 * - Testing infrastructure
 * - Build/deployment setup
 *
 * Renders findings to CODEBASE.md template for context-aware planning
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderTemplate } from './template-renderer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Analyzes an existing codebase for tech stack, architecture, and conventions.
 *
 * Analysis includes:
 * - Tech stack (languages, frameworks, libraries)
 * - Directory structure and architecture patterns
 * - Code conventions (linting, formatting configs)
 * - Testing infrastructure
 * - Build/deployment setup
 *
 * @param {string} targetDir - Directory to analyze
 * @returns {Promise<object>} Analysis results
 */
export async function analyzeCodebase(targetDir = process.cwd()) {
  const analysis = {
    techStack: {},
    architecture: {},
    conventions: {},
    testing: {},
    metadata: {
      analyzedAt: new Date().toISOString(),
      targetDir: targetDir
    }
  };

  // Detect languages and frameworks
  analysis.techStack = detectTechStack(targetDir);

  // Analyze directory structure
  analysis.architecture = analyzeArchitecture(targetDir);

  // Detect code conventions
  analysis.conventions = detectConventions(targetDir);

  // Check testing setup
  analysis.testing = detectTesting(targetDir);

  return analysis;
}

/**
 * Detect tech stack from dependency files and project structure
 */
function detectTechStack(dir) {
  const stack = {
    languages: [],
    frameworks: [],
    libraries: [],
    packageManager: null
  };

  // Check package.json for Node.js projects
  const pkgPath = path.join(dir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    stack.languages.push('JavaScript/TypeScript');
    stack.packageManager = detectPackageManager(dir);

    // Check for common frameworks
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps['react']) stack.frameworks.push('React');
    if (deps['vue']) stack.frameworks.push('Vue');
    if (deps['@angular/core']) stack.frameworks.push('Angular');
    if (deps['next']) stack.frameworks.push('Next.js');
    if (deps['express']) stack.frameworks.push('Express');
    if (deps['fastify']) stack.frameworks.push('Fastify');
    if (deps['koa']) stack.frameworks.push('Koa');
    if (deps['nuxt']) stack.frameworks.push('Nuxt.js');
    if (deps['svelte']) stack.frameworks.push('Svelte');

    // Store top libraries (limit to 10 for brevity)
    const allDeps = Object.keys(deps);
    stack.libraries = allDeps.slice(0, 10);
  }

  // Check for Python
  if (fs.existsSync(path.join(dir, 'requirements.txt')) ||
      fs.existsSync(path.join(dir, 'setup.py')) ||
      fs.existsSync(path.join(dir, 'pyproject.toml'))) {
    stack.languages.push('Python');
    if (fs.existsSync(path.join(dir, 'Pipfile'))) {
      stack.packageManager = 'pipenv';
    } else if (fs.existsSync(path.join(dir, 'pyproject.toml'))) {
      stack.packageManager = 'poetry';
    } else {
      stack.packageManager = 'pip';
    }
  }

  // Check for Rust
  if (fs.existsSync(path.join(dir, 'Cargo.toml'))) {
    stack.languages.push('Rust');
    stack.packageManager = 'cargo';
  }

  // Check for Go
  if (fs.existsSync(path.join(dir, 'go.mod'))) {
    stack.languages.push('Go');
    stack.packageManager = 'go mod';
  }

  // Check for Ruby
  if (fs.existsSync(path.join(dir, 'Gemfile'))) {
    stack.languages.push('Ruby');
    stack.packageManager = 'bundler';
  }

  // Check for PHP
  if (fs.existsSync(path.join(dir, 'composer.json'))) {
    stack.languages.push('PHP');
    stack.packageManager = 'composer';
  }

  // Check for Java/Kotlin
  if (fs.existsSync(path.join(dir, 'pom.xml'))) {
    stack.languages.push('Java');
    stack.packageManager = 'maven';
  } else if (fs.existsSync(path.join(dir, 'build.gradle'))) {
    stack.languages.push('Java/Kotlin');
    stack.packageManager = 'gradle';
  }

  return stack;
}

/**
 * Detect package manager for Node.js projects
 */
function detectPackageManager(dir) {
  if (fs.existsSync(path.join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(dir, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(dir, 'bun.lockb'))) return 'bun';
  if (fs.existsSync(path.join(dir, 'package-lock.json'))) return 'npm';
  return 'npm (default)';
}

/**
 * Analyze directory structure and detect architecture patterns
 */
function analyzeArchitecture(dir) {
  const arch = {
    structure: [],
    patterns: []
  };

  // Check common directory patterns
  const dirs = fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
    .map(e => e.name);

  arch.structure = dirs;

  // Detect architecture patterns
  if (dirs.includes('components') && dirs.includes('pages')) {
    arch.patterns.push('Component-based (likely React/Next.js)');
  }
  if (dirs.includes('models') && dirs.includes('views') && dirs.includes('controllers')) {
    arch.patterns.push('MVC pattern');
  }
  if (dirs.includes('src') && dirs.includes('tests')) {
    arch.patterns.push('Standard src/tests split');
  }
  if (dirs.includes('src') && dirs.includes('test')) {
    arch.patterns.push('Standard src/test split');
  }
  if (dirs.includes('lib') || dirs.includes('utils')) {
    arch.patterns.push('Utility/helper separation');
  }
  if (dirs.includes('api') && dirs.includes('client')) {
    arch.patterns.push('API/Client separation');
  }
  if (dirs.includes('server') && dirs.includes('client')) {
    arch.patterns.push('Server/Client monorepo');
  }

  return arch;
}

/**
 * Detect code conventions (linting, formatting, TypeScript)
 */
function detectConventions(dir) {
  const conventions = {
    linting: [],
    formatting: [],
    typescript: false
  };

  // Check for linting
  if (fs.existsSync(path.join(dir, '.eslintrc.json')) ||
      fs.existsSync(path.join(dir, '.eslintrc.js')) ||
      fs.existsSync(path.join(dir, '.eslintrc.cjs')) ||
      fs.existsSync(path.join(dir, 'eslint.config.js'))) {
    conventions.linting.push('ESLint');
  }

  // Check for formatting
  if (fs.existsSync(path.join(dir, '.prettierrc')) ||
      fs.existsSync(path.join(dir, '.prettierrc.json')) ||
      fs.existsSync(path.join(dir, '.prettierrc.js')) ||
      fs.existsSync(path.join(dir, 'prettier.config.js'))) {
    conventions.formatting.push('Prettier');
  }

  // Check for EditorConfig
  if (fs.existsSync(path.join(dir, '.editorconfig'))) {
    conventions.formatting.push('EditorConfig');
  }

  // Check for TypeScript
  if (fs.existsSync(path.join(dir, 'tsconfig.json'))) {
    conventions.typescript = true;
  }

  return conventions;
}

/**
 * Detect testing infrastructure
 */
function detectTesting(dir) {
  const testing = {
    frameworks: [],
    hasTests: false,
    testDirs: []
  };

  // Check for test directories
  const testDirs = ['tests', 'test', '__tests__', 'spec'];
  testing.testDirs = testDirs.filter(d => fs.existsSync(path.join(dir, d)));
  testing.hasTests = testing.testDirs.length > 0;

  // Check package.json for test frameworks
  const pkgPath = path.join(dir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps['jest']) testing.frameworks.push('Jest');
    if (deps['mocha']) testing.frameworks.push('Mocha');
    if (deps['vitest']) testing.frameworks.push('Vitest');
    if (deps['@playwright/test']) testing.frameworks.push('Playwright');
    if (deps['cypress']) testing.frameworks.push('Cypress');
    if (deps['ava']) testing.frameworks.push('AVA');
    if (deps['tap']) testing.frameworks.push('TAP');
  }

  return testing;
}

/**
 * Render analysis results to CODEBASE.md using template
 *
 * @param {object} analysis - Analysis results from analyzeCodebase()
 * @param {string} outputPath - Path to write CODEBASE.md
 * @returns {Promise<void>}
 */
export async function renderCodebaseReport(analysis, outputPath) {
  // Prepare variables for template
  const vars = {
    analyzedAt: analysis.metadata.analyzedAt,
    languages: analysis.techStack.languages.join(', ') || 'Not detected',
    frameworks: analysis.techStack.frameworks.join(', ') || 'None detected',
    packageManager: analysis.techStack.packageManager || 'None',
    libraries: analysis.techStack.libraries.join(', ') || 'None',
    structure: analysis.architecture.structure.join(', ') || 'Flat structure',
    patterns: analysis.architecture.patterns.join('\n- ') || 'No clear pattern detected',
    linting: analysis.conventions.linting.join(', ') || 'None',
    formatting: analysis.conventions.formatting.join(', ') || 'None',
    typescript: analysis.conventions.typescript ? 'Yes' : 'No',
    testFrameworks: analysis.testing.frameworks.join(', ') || 'None',
    testDirs: analysis.testing.testDirs.join(', ') || 'None',
    hasTests: analysis.testing.hasTests ? 'Yes' : 'No'
  };

  // Use renderTemplate API: renderTemplate(templateName, variables, templatesDir)
  const templatesDir = path.join(__dirname, '..', 'templates');
  const rendered = await renderTemplate('CODEBASE', vars, templatesDir);

  // Write rendered content to output path
  fs.writeFileSync(outputPath, rendered, 'utf-8');
}

// CLI execution
if (import.meta.url.startsWith('file://') && process.argv[1] && import.meta.url.includes(path.basename(process.argv[1]))) {
  const args = process.argv.slice(2);
  const outputArg = args.find(a => a.startsWith('--output='));
  const outputPath = outputArg ? outputArg.split('=')[1] : '.planning/CODEBASE.md';

  const analysis = await analyzeCodebase();
  await renderCodebaseReport(analysis, outputPath);

  console.log(`Codebase analysis complete. Report saved to: ${outputPath}`);
  process.exit(0);
}
