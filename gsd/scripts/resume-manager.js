/**
 * Resume Manager Module
 * Provides checkpoint-based workflow resume from STATE.md with brief status summaries
 *
 * Critical patterns:
 * - Brief checkpoint (current position + next action only, not full history)
 * - Auto-continue from checkpoint (no re-explanation)
 * - Recovery options for corrupted STATE.md (no automatic recovery)
 * - Loads correct guideline for workflow stage
 */

import { readState } from './state-manager.js';
import { loadGuideline } from './guideline-loader.js';
import path from 'node:path';

/**
 * Determine which guideline to load based on workflow state
 * @param {Object} state - Current state from STATE.md
 * @returns {string} Workflow name (e.g., 'newProject', 'planPhase', 'executePhase')
 */
export function determineWorkflowType(state) {
  // If at phase 0 or plan 0: initialization
  if (state.phase === 0 || state.plan === 0) {
    return 'newProject';
  }

  // If phase completed: plan next phase
  if (state.status === 'completed') {
    return 'planPhase';
  }

  // If in progress: execute current phase
  if (state.status === 'in_progress') {
    return 'executePhase';
  }

  // Default: plan phase
  return 'planPhase';
}

/**
 * Determine next action based on workflow state
 * @param {Object} state - Current state from STATE.md
 * @returns {string} Next action description
 */
export function determineNextAction(state) {
  // Phase completed: ready for transition
  if (state.status === 'completed') {
    return `Phase ${state.phase} complete. Ready to transition to Phase ${state.phase + 1}.`;
  }

  // Blocked: need to resolve blocker
  if (state.status === 'blocked') {
    return `Workflow blocked: ${state.step}. Resolve blocker to continue.`;
  }

  // In progress: continue current step
  if (state.status === 'in_progress') {
    return `Continue ${state.step}`;
  }

  // Pending: ready to start
  if (state.status === 'pending') {
    return `Ready to begin: ${state.step}`;
  }

  // Unknown status: default message
  return `Current step: ${state.step}`;
}

/**
 * Generate brief status summary
 * Brief checkpoint: current position and next action only (not full history)
 *
 * @param {Object} state - Current state from STATE.md
 * @param {Object} guideline - Loaded guideline object (with metadata.workflow)
 * @returns {string} Formatted status summary
 */
export function generateStatusSummary(state, guideline) {
  const workflowName = guideline?.metadata?.workflow || 'unknown';
  const nextAction = determineNextAction(state);

  return `📍 Current Position
Phase: ${state.phase} (${workflowName})
Status: ${state.status}
Last activity: ${state.step}

⏭️  Next Action
${nextAction}`;
}

/**
 * Recover from STATE.md corruption
 * Provides recovery options to user without automatic recovery
 *
 * @param {string} projectRoot - Root directory of the project
 * @param {Error} stateError - Error from STATE.md parsing
 * @returns {Object} Recovery options object
 */
export function recoverFromCorruption(projectRoot, stateError) {
  return {
    error: true,
    corruption: true,
    message: 'STATE.md corrupted. Recovery options:',
    options: [
      '1. Restore from backup: node gsd/scripts/resume-manager.js --recover',
      '2. View corruption: cat .planning/STATE.md',
      '3. Restart workflow: node gsd/scripts/workflow-orchestrator.js --restart'
    ],
    originalError: stateError.message
  };
}

/**
 * Resume workflow from STATE.md checkpoint
 * Loads current state, determines workflow type, and generates brief summary
 *
 * @param {string} projectRoot - Root directory of the project
 * @returns {Promise<Object>} Resume result: { state, guideline, summary, nextAction }
 * @throws {Error} If no active workflow or STATE.md corrupted
 */
export async function resumeWorkflow(projectRoot) {
  try {
    // Load current state from STATE.md
    const state = await readState(projectRoot);

    // Validate state has an active workflow
    if (!state.phase || state.phase === 0 || state.status === 'pending' && state.step === 'Initialization') {
      throw new Error("No active workflow found. Use 'start GSD' to begin a new project.");
    }

    // Determine which workflow guideline to load
    const workflowType = determineWorkflowType(state);

    // Load guideline content
    const guidelineContent = await loadGuideline(workflowType);

    // Parse guideline metadata (YAML frontmatter)
    // Simple extraction: look for workflow field in frontmatter
    const metadataMatch = guidelineContent.match(/^---\n([\s\S]*?)\n---/);
    const guideline = {
      content: guidelineContent,
      metadata: {
        workflow: workflowType
      }
    };

    if (metadataMatch) {
      // Extract workflow name from frontmatter
      const workflowMatch = metadataMatch[1].match(/workflow:\s*([^\n]+)/);
      if (workflowMatch) {
        guideline.metadata.workflow = workflowMatch[1].trim();
      }
    }

    // Generate brief status summary
    const summary = generateStatusSummary(state, guideline);

    // Determine next action
    const nextAction = determineNextAction(state);

    return {
      state,
      guideline,
      summary,
      nextAction
    };
  } catch (error) {
    // Handle STATE.md not found
    if (error.message.includes('STATE.md not found')) {
      throw new Error("No active workflow found. Use 'start GSD' to begin a new project.");
    }

    // Handle STATE.md corruption
    if (error.message.includes('Failed to parse STATE.md')) {
      throw new Error(JSON.stringify(recoverFromCorruption(projectRoot, error)));
    }

    // Rethrow other errors
    throw error;
  }
}
