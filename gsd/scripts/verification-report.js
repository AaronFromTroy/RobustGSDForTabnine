/**
 * Verification report generator
 * Creates structured VERIFICATION.md reports from verification results
 *
 * Purpose: Transform verification results from verifier.js into human-readable
 * markdown reports using the VERIFICATION.md template. Provides comprehensive
 * documentation of verification layers, failures, quality metrics, and next actions.
 *
 * Exports:
 * - generateVerificationReport: Transforms results to template variables
 * - saveReport: Renders template and writes to phase directory
 */

import { renderTemplate } from './template-renderer.js';
import { writeFileAtomic } from './file-ops.js';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * Generate verification report variables from verification results
 * Transforms verifier.js results object into template variables for VERIFICATION.md
 *
 * @param {Object} results - Verification results from verifier.js
 * @param {number} results.phase - Phase number (1-8)
 * @param {boolean} results.passed - Overall verification result
 * @param {Object} results.layers - Layer-specific results (smoke, linting, unitTests, integration, acceptance)
 * @param {Array<string>} results.failures - Array of failure messages
 * @param {number} results.duration - Verification duration in seconds
 * @param {string} [phaseName] - Optional phase name for report header
 * @returns {Object} Template variables for VERIFICATION.md
 */
export function generateVerificationReport(results, phaseName = 'Phase') {
  const now = new Date().toISOString();

  // Extract layer results with graceful defaults
  const smoke = results.layers.smoke || {};
  const linting = results.layers.linting || {};
  const unitTests = results.layers.unitTests || {};
  const integration = results.layers.integration || {};
  const acceptance = results.layers.acceptance || [];

  // Calculate acceptance metrics
  const acceptanceTotal = acceptance.length || 0;
  const acceptancePassed = acceptance.filter(c => c.passed).length || 0;

  // Calculate test metrics
  const testsTotal = unitTests.count || 0;
  const testsPassed = testsTotal - (unitTests.failures || 0);
  const testsFailed = unitTests.failures || 0;

  // Format failures as numbered list
  const failuresFormatted = results.failures.length > 0
    ? results.failures.map((f, i) => `${i + 1}. ${f}`).join('\n')
    : 'None - all criteria passed.';

  // Determine next action based on overall result
  const nextAction = results.passed
    ? 'Phase verified. Proceed to next phase.'
    : `Fix ${results.failures.length} issue(s) before proceeding. See "Failed Criteria" section for details.`;

  return {
    // Basic metadata
    phase: results.phase,
    verified: now,
    timestamp: now,
    passed: results.passed,
    failures_count: results.failures.length,
    duration: `${results.duration}s`,
    phase_name: phaseName,

    // Layer results - smoke tests
    layers_smoke_passed: smoke.passed || false,

    // Layer results - linting
    layers_lint_passed: linting.passed !== false && (linting.errors || 0) === 0,
    layers_linting_passed: linting.passed !== false && (linting.errors || 0) === 0,
    linting_errors: linting.errors || 0,
    linting_warnings: linting.warnings || 0,

    // Layer results - unit tests
    layers_unit_passed: unitTests.passed || false,
    unit_count: testsTotal,
    unit_coverage: unitTests.coverage || 0,

    // Layer results - integration tests
    layers_integration_passed: integration.passed || false,
    integration_count: integration.count || 0,
    integration_failures: integration.failures || 0,

    // Layer results - acceptance criteria
    layers_acceptance_passed: acceptancePassed === acceptanceTotal && acceptanceTotal > 0,
    acceptance_total: acceptanceTotal,
    acceptance_passed: acceptancePassed,

    // Failures section
    failures: failuresFormatted,

    // Quality metrics - coverage
    coverage_lines: unitTests.coverage || 0,
    coverage_branches: 0, // Not tracked yet - placeholder for future
    coverage_functions: 0, // Not tracked yet - placeholder for future

    // Quality metrics - complexity
    complexity_avg: 0, // Not tracked yet - placeholder for future
    complexity_max: 0, // Not tracked yet - placeholder for future

    // Quality metrics - test results
    tests_total: testsTotal,
    tests_passed: testsPassed,
    tests_failed: testsFailed,

    // Next action guidance
    next_action: nextAction
  };
}

/**
 * Save verification report to phase directory
 * Renders VERIFICATION.md template and writes to file
 *
 * @param {number} phaseNumber - Phase number (1-8)
 * @param {Object} results - Verification results from verifier.js
 * @param {string} [outputPath] - Optional custom output path (default: auto-detect phase directory)
 * @param {string} [phaseName] - Optional phase name for report header
 * @returns {Promise<Object>} { path: string, success: boolean, error?: string }
 */
export async function saveReport(phaseNumber, results, outputPath = null, phaseName = null) {
  try {
    // Determine output path
    let reportPath;
    if (outputPath) {
      reportPath = outputPath;
    } else {
      // Auto-detect phase directory
      const phaseDir = await findPhaseDirectory(phaseNumber);
      reportPath = path.join(
        process.cwd(),
        '.planning',
        'phases',
        phaseDir,
        'VERIFICATION.md'
      );
    }

    // Use phase directory name as default phase name if not provided
    if (!phaseName && !outputPath) {
      const phaseDir = await findPhaseDirectory(phaseNumber);
      // Extract name from directory (e.g., "08-verification-and-quality-system" -> "Verification and Quality System")
      const match = phaseDir.match(/^\d+-(.+)$/);
      if (match) {
        phaseName = match[1]
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }

    // Generate report variables
    const variables = generateVerificationReport(results, phaseName || 'Phase');

    // Render template
    const templatesDir = path.join(process.cwd(), 'gsd', 'templates');
    const rendered = await renderTemplate('VERIFICATION', variables, templatesDir);

    // Write to file
    await writeFileAtomic(reportPath, rendered);

    return {
      path: reportPath,
      success: true
    };

  } catch (error) {
    return {
      path: outputPath || `[Phase ${phaseNumber} directory]`,
      success: false,
      error: error.message
    };
  }
}

/**
 * Find phase directory in .planning/phases/
 * Searches for directory matching phase number pattern (NN-* or N-*)
 *
 * @param {number} phaseNumber - Phase number (1-8)
 * @returns {Promise<string>} Directory name (e.g., "08-verification-and-quality-system")
 * @throws {Error} If phase directory not found
 */
async function findPhaseDirectory(phaseNumber) {
  const phasesDir = path.join(process.cwd(), '.planning', 'phases');

  try {
    const directories = await readdir(phasesDir);

    // Pattern: NN-name or N-name
    const paddedPhase = phaseNumber.toString().padStart(2, '0');
    const patterns = [
      new RegExp(`^${paddedPhase}-`),  // Matches "08-name"
      new RegExp(`^${phaseNumber}-`)   // Matches "8-name"
    ];

    for (const dir of directories) {
      for (const pattern of patterns) {
        if (pattern.test(dir)) {
          return dir;
        }
      }
    }

    throw new Error(`Phase ${phaseNumber} directory not found in ${phasesDir}`);

  } catch (error) {
    if (error.message.includes('not found')) {
      throw error;
    }
    throw new Error(`Failed to find phase directory: ${error.message}`);
  }
}
