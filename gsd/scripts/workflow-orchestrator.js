/**
 * Workflow Orchestrator Module
 * Provides sequential workflow orchestration with validation gates
 *
 * Critical patterns:
 * - Sequential execution (no sub-agent spawning - Tabnine constraint)
 * - Blocks invalid phase transitions (don't warn - block)
 * - Validates artifacts before phase transitions (validation gates)
 * - Accumulates errors before throwing (show all issues at once)
 */

import { readState, writeState, updateProgress, transitionPhase as stateTransition, STATUS_VALUES } from './state-manager.js';
import { loadGuideline } from './guideline-loader.js';
import { validateArtifact, validateRequirementCoverage } from './validator.js';
import { checkWorkflowConflict } from './trigger-detector.js';
import path from 'node:path';

/**
 * Validate phase transition is valid (blocks invalid jumps)
 * @param {Object} state - Current state from STATE.md
 * @param {number} targetPhase - Phase to transition to
 * @returns {boolean} True if valid
 * @throws {Error} If transition is invalid
 */
export function validatePhaseTransition(state, targetPhase) {
  // Cannot skip phases (must be sequential)
  if (targetPhase > state.phase + 1) {
    throw new Error(
      `Invalid transition: Phase ${state.phase} to Phase ${targetPhase}. ` +
      `Complete Phase ${state.phase + 1} first.`
    );
  }

  // Cannot move backward
  if (targetPhase < state.phase) {
    throw new Error(
      `Cannot move backward from Phase ${state.phase} to Phase ${targetPhase}`
    );
  }

  return true;
}

/**
 * Validate phase completion with artifact checks
 * @param {string} projectRoot - Root directory of the project
 * @param {number} phaseNumber - Phase number to validate
 * @param {Array<Object>} requiredArtifacts - Array of {filePath, type} objects
 * @returns {Promise<Object>} Validation result: { valid: true, artifacts: number }
 * @throws {Error} If validation fails with accumulated errors
 */
export async function validatePhaseCompletion(projectRoot, phaseNumber, requiredArtifacts) {
  const errors = [];

  // Validate each required artifact
  for (const artifact of requiredArtifacts) {
    try {
      await validateArtifact(projectRoot, artifact.filePath, artifact.type);
    } catch (error) {
      errors.push(`${artifact.type}: ${error.message}`);
    }
  }

  // If this is the final phase, validate requirement coverage
  // Assume 4 phases based on ROADMAP.md
  if (phaseNumber === 4) {
    try {
      await validateRequirementCoverage(projectRoot);
    } catch (error) {
      errors.push(`Requirement coverage: ${error.message}`);
    }
  }

  // If any errors, throw with all accumulated errors
  if (errors.length > 0) {
    throw new Error(
      `Phase ${phaseNumber} completion validation failed:\n\n` +
      errors.map((err, i) => `${i + 1}. ${err}`).join('\n\n') +
      '\n\nResolve all validation errors before transitioning to next phase.'
    );
  }

  return {
    valid: true,
    artifacts: requiredArtifacts.length
  };
}

/**
 * Start new workflow
 * @param {string} projectRoot - Root directory of the project
 * @param {boolean} userConfirmation - User confirmed workflow start
 * @returns {Promise<Object>} Result: { guideline, message }
 * @throws {Error} If workflow conflict exists or not confirmed
 */
export async function startWorkflow(projectRoot, userConfirmation) {
  // Check for workflow conflicts (existing workflow)
  const conflict = await checkWorkflowConflict(projectRoot, 'START');
  if (conflict) {
    throw new Error(conflict);
  }

  // Require user confirmation
  if (!userConfirmation) {
    throw new Error('Workflow start requires confirmation');
  }

  // Load initialization guideline (new-project.md)
  const guidelineContent = await loadGuideline('newProject');

  // Initialize STATE.md with phase 0
  const statePath = path.join(projectRoot, '.planning', 'STATE.md');

  // Create initial state data
  const initialState = {
    phase: 0,
    plan: 0,
    status: STATUS_VALUES.PENDING,
    step: 'Initialization',
    progressIndicator: '░░░░ (0% - Phase 0 of 4)'
  };

  // Write initial state
  await writeState(projectRoot, initialState);

  return {
    guideline: guidelineContent,
    message: 'Workflow started. Initializing GSD in this project (works for new or existing codebases).'
  };
}

/**
 * Execute upgrade workflow
 * @param {string} projectRoot - Root directory of the project
 * @param {boolean} userConfirmation - User confirmed upgrade
 * @param {Object} options - Upgrade options (dryRun, force, source, localPath)
 * @returns {Promise<Object>} Result: { success, from, to, backupPath }
 * @throws {Error} If upgrade fails
 */
export async function startUpgradeWorkflow(projectRoot, userConfirmation, options = {}) {
  // Require user confirmation
  if (!userConfirmation) {
    throw new Error('Upgrade workflow requires confirmation');
  }

  console.log('\n=== GSD Upgrade Workflow ===\n');

  // Import upgrade-manager
  const { upgrade, previewUpgrade } = await import('./upgrade-manager.js');

  // Show preview
  console.log('Checking for updates...\n');
  const preview = await previewUpgrade(options);

  if (!preview.hasUpdate) {
    console.log(`✅ Already on latest version (${preview.current})`);
    return { workflow: 'upgrade', status: 'up-to-date', current: preview.current };
  }

  // Display preview (already done by previewUpgrade)
  console.log(`\nUpdate available: ${preview.current} → ${preview.latest} (${preview.updateType})\n`);

  // Execute upgrade (with user confirmation already handled)
  console.log('Starting upgrade...\n');
  const result = await upgrade({ ...options, force: true });

  if (result.success) {
    console.log('\n✅ Upgrade complete!');
    console.log('Verify everything works, then remove backup from .gsd-backups/\n');
  }

  return { workflow: 'upgrade', status: 'complete', ...result };
}

/**
 * Execute single phase
 * Returns guideline for Tabnine to follow (no sub-agent spawning)
 *
 * @param {string} projectRoot - Root directory of the project
 * @param {number} phaseNumber - Phase number to execute
 * @returns {Promise<Object>} Result: { guideline, phase, status }
 * @throws {Error} If phase transition is invalid
 */
export async function executePhase(projectRoot, phaseNumber) {
  // Load current state
  const state = await readState(projectRoot);

  // Validate phase transition is valid
  validatePhaseTransition(state, phaseNumber);

  // Determine guideline type based on state
  const guidelineType = state.status === 'completed' ? 'planPhase' : 'executePhase';

  // Load guideline
  const guidelineContent = await loadGuideline(guidelineType);

  // Update state to in_progress
  await updateProgress(projectRoot, {
    phase: phaseNumber,
    plan: state.plan || 1,
    status: STATUS_VALUES.IN_PROGRESS,
    step: `Executing phase ${phaseNumber}`
  });

  return {
    guideline: guidelineContent,
    phase: phaseNumber,
    status: 'in_progress'
  };
}

/**
 * Transition to next phase with validation gate
 * @param {string} projectRoot - Root directory of the project
 * @param {number} fromPhase - Current phase number
 * @param {number} toPhase - Next phase number
 * @param {string} completionNote - Completion note for state
 * @returns {Promise<Object>} Result: { transitioned: true, from, to }
 * @throws {Error} If validation fails
 */
export async function transitionPhase(projectRoot, fromPhase, toPhase, completionNote) {
  // Note: Validation should be done before calling this function
  // This function assumes validation has already passed

  // Use state-manager's transitionPhase function
  // Assume 4 total phases from ROADMAP.md
  await stateTransition(projectRoot, toPhase, 4);

  // Update completion note
  await updateProgress(projectRoot, {
    status: STATUS_VALUES.PENDING,
    step: completionNote || `Phase ${fromPhase} complete. Ready for Phase ${toPhase}.`
  });

  return {
    transitioned: true,
    from: fromPhase,
    to: toPhase
  };
}
