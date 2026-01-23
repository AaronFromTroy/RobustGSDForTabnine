/**
 * Quality gate enforcement module
 * Validates code quality metrics: coverage thresholds, linting results, quality gates
 *
 * Exports:
 * - checkCoverageThreshold: Validate coverage metrics against thresholds
 * - runLinting: Execute ESLint and parse results
 * - checkQualityGates: Validate multiple quality gates
 */

import { runCommand } from './process-runner.js';

/**
 * Default quality gate thresholds
 */
export const DEFAULT_GATES = {
  coverage: { threshold: 80, metric: 'lines' },
  tests: { allowFailures: 0 },
  linting: { allowErrors: 0, allowWarnings: true }
};

/**
 * Check if coverage metrics meet threshold requirements
 *
 * @param {Object} coverageData - Coverage metrics object
 * @param {number} coverageData.lines - Line coverage percentage (0-100)
 * @param {number} coverageData.branches - Branch coverage percentage (0-100)
 * @param {number} coverageData.functions - Function coverage percentage (0-100)
 * @param {number} coverageData.statements - Statement coverage percentage (0-100)
 * @param {number} threshold - Minimum required coverage percentage (default 80)
 * @returns {Object} { passed: boolean, failures: string[] }
 */
export function checkCoverageThreshold(coverageData, threshold = 80) {
  const failures = [];

  // Validate each coverage metric against threshold
  const metrics = ['lines', 'branches', 'functions', 'statements'];

  for (const metric of metrics) {
    const value = coverageData[metric] || 0;
    if (value < threshold) {
      failures.push(
        `${metric.charAt(0).toUpperCase() + metric.slice(1)} coverage ${value}% below ${threshold}% threshold`
      );
    }
  }

  return {
    passed: failures.length === 0,
    failures
  };
}

/**
 * Run ESLint and parse results for errors and warnings
 *
 * @param {Object} options - Linting options
 * @param {string[]} options.files - Files/patterns to lint (default: ['.'])
 * @param {boolean} options.fix - Auto-fix issues (default: false)
 * @returns {Promise<Object>} { passed: boolean, errors: number, warnings: number, output: string }
 */
export async function runLinting(options = {}) {
  const files = options.files || ['.'];
  const args = ['eslint', ...files];

  if (options.fix) {
    args.push('--fix');
  }

  try {
    const result = await runCommand('npx', args);

    // ESLint exits with 0 if no errors (warnings allowed)
    return {
      passed: true,
      errors: 0,
      warnings: parseWarningCount(result.stdout + result.stderr),
      output: result.stdout + result.stderr
    };
  } catch (error) {
    // Check if ESLint is not installed/configured
    if (error.message.includes('not found') ||
        error.message.includes('Cannot find module')) {
      return {
        passed: true,
        errors: 0,
        warnings: 0,
        output: 'ESLint not configured - skipping linting'
      };
    }

    // ESLint found errors
    const output = error.message;
    return {
      passed: false,
      errors: parseErrorCount(output),
      warnings: parseWarningCount(output),
      output
    };
  }
}

/**
 * Check multiple quality gates and accumulate failures
 *
 * @param {Object} results - Test/analysis results
 * @param {Object} results.coverage - Coverage data with lines/branches/functions/statements
 * @param {number} results.testFailures - Number of test failures
 * @param {number} results.lintingErrors - Number of linting errors
 * @param {number} results.lintingWarnings - Number of linting warnings (optional)
 * @param {number} results.complexity - Max cyclomatic complexity (optional)
 * @param {Object} gates - Quality gate configuration (default: DEFAULT_GATES)
 * @returns {Object} { passed: boolean, failures: string[], status: 'PASS'|'FAIL' }
 */
export function checkQualityGates(results, gates = DEFAULT_GATES) {
  const failures = [];

  // Gate 1: Coverage threshold
  if (results.coverage && gates.coverage) {
    const coverageMetric = gates.coverage.metric || 'lines';
    const coverageValue = results.coverage[coverageMetric] || 0;
    const threshold = gates.coverage.threshold;

    if (coverageValue < threshold) {
      failures.push(
        `Coverage ${coverageValue}% below ${threshold}% threshold`
      );
    }
  }

  // Gate 2: Test failures
  if (results.testFailures !== undefined && gates.tests) {
    if (results.testFailures > gates.tests.allowFailures) {
      failures.push(
        `${results.testFailures} test failure(s) exceeds allowed ${gates.tests.allowFailures}`
      );
    }
  }

  // Gate 3: Linting errors
  if (results.lintingErrors !== undefined && gates.linting) {
    if (results.lintingErrors > gates.linting.allowErrors) {
      failures.push(
        `${results.lintingErrors} linting error(s) exceeds allowed ${gates.linting.allowErrors}`
      );
    }

    // Check warnings if configured
    if (!gates.linting.allowWarnings && results.lintingWarnings > 0) {
      failures.push(
        `${results.lintingWarnings} linting warning(s) not allowed`
      );
    }
  }

  // Gate 4: Cyclomatic complexity (optional)
  if (results.complexity !== undefined && gates.complexity) {
    if (results.complexity > gates.complexity.maxPerFunction) {
      failures.push(
        `Complexity ${results.complexity} exceeds max ${gates.complexity.maxPerFunction}`
      );
    }
  }

  return {
    passed: failures.length === 0,
    failures,
    status: failures.length === 0 ? 'PASS' : 'FAIL'
  };
}

/**
 * Parse error count from ESLint output
 * @param {string} output - ESLint output text
 * @returns {number} Number of errors found
 */
function parseErrorCount(output) {
  const match = output.match(/(\d+)\s+error/i);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Parse warning count from ESLint output
 * @param {string} output - ESLint output text
 * @returns {number} Number of warnings found
 */
function parseWarningCount(output) {
  const match = output.match(/(\d+)\s+warning/i);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Parse coverage percentage from test output
 * @param {string} output - Test output with coverage info
 * @returns {number} Coverage percentage (0-100)
 */
export function parseCoverage(output) {
  // Try c8 format: "All files      |   91.23 |"
  const c8Match = output.match(/All files\s+\|\s+([\d.]+)/);
  if (c8Match) {
    return parseFloat(c8Match[1]);
  }

  // Try Vitest format: "Coverage: 91.23%"
  const vitestMatch = output.match(/Coverage:\s+([\d.]+)%/i);
  if (vitestMatch) {
    return parseFloat(vitestMatch[1]);
  }

  return 0;
}
