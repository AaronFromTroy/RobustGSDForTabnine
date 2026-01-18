/**
 * State Manager Module
 * Provides atomic STATE.md persistence and progress tracking
 *
 * Critical patterns:
 * - Uses writeFileAtomic() for atomic STATE.md updates (prevents corruption)
 * - Parses and updates STATE.md fields with regex
 * - Generates visual progress indicators (█░ blocks)
 * - All functions async (no *Sync methods)
 */

import { readFile, writeFileAtomic } from './file-ops.js';
import path from 'node:path';

/**
 * Valid status values for STATE.md
 */
export const STATUS_VALUES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked'
};

/**
 * Read and parse STATE.md content
 * @param {string} projectRoot - Root directory of the project
 * @returns {Promise<Object>} Parsed state object
 * @throws {Error} If STATE.md not found or parsing fails
 */
export async function readState(projectRoot) {
  try {
    const statePath = path.join(projectRoot, '.planning', 'STATE.md');
    const content = await readFile(statePath);

    // Extract fields using regex with optional whitespace
    const phaseMatch = content.match(/\*\*Phase:\*\*\s*(\d+)/);
    const planMatch = content.match(/\*\*Plan:\*\*\s*(\d+)/);
    const statusMatch = content.match(/\*\*Status:\*\*\s*(\w+)/);
    const stepMatch = content.match(/\*\*Last activity:\*\*\s*([^\n]+)/);
    const progressMatch = content.match(/\*\*Progress:\*\*\s*`([█░▓]+)/);
    const lastUpdatedMatch = content.match(/\*\*Last Updated:\*\*\s*([^\n]+)/);

    // Validate all required fields were found
    if (!phaseMatch || !planMatch || !statusMatch) {
      throw new Error('Failed to parse STATE.md: Missing required fields (Phase, Plan, or Status)');
    }

    return {
      phase: parseInt(phaseMatch[1], 10),
      plan: parseInt(planMatch[1], 10),
      status: statusMatch[1],
      step: stepMatch ? stepMatch[1].trim() : 'Unknown',
      progressIndicator: progressMatch ? progressMatch[1] : '',
      lastUpdated: lastUpdatedMatch ? lastUpdatedMatch[1].trim() : new Date().toISOString().split('T')[0],
      rawContent: content
    };
  } catch (error) {
    if (error.message.includes('File not found')) {
      throw new Error(`STATE.md not found at ${projectRoot}/.planning/STATE.md. Initialize project first.`);
    }
    throw error;
  }
}

/**
 * Validate state data before writing
 * @param {Object} stateData - State data to validate
 * @throws {Error} If validation fails
 */
export function validateStateData(stateData) {
  // Check required fields exist
  const requiredFields = ['phase', 'plan', 'status', 'step'];
  const missingFields = requiredFields.filter(field => !(field in stateData));

  if (missingFields.length > 0) {
    throw new Error(`Missing required field: ${missingFields.join(', ')}`);
  }

  // Check status is valid
  const validStatuses = Object.values(STATUS_VALUES);
  if (!validStatuses.includes(stateData.status)) {
    throw new Error(`Invalid status: ${stateData.status}. Must be one of: ${validStatuses.join(', ')}`);
  }

  // Check phase and plan are positive integers
  if (!Number.isInteger(stateData.phase) || stateData.phase < 1) {
    throw new Error('Phase must be a positive integer');
  }

  if (!Number.isInteger(stateData.plan) || stateData.plan < 0) {
    throw new Error('Plan must be a non-negative integer');
  }

  // Check step is non-empty string
  if (typeof stateData.step !== 'string' || stateData.step.trim() === '') {
    throw new Error('Step must be a non-empty string');
  }
}

/**
 * Write updated state data to STATE.md atomically
 * @param {string} projectRoot - Root directory of the project
 * @param {Object} stateData - State data to write
 * @param {number} stateData.phase - Current phase number
 * @param {number} stateData.plan - Current plan number
 * @param {string} stateData.status - Current status
 * @param {string} stateData.step - Current step description
 * @param {string} stateData.progressIndicator - Visual progress bar
 * @returns {Promise<void>}
 * @throws {Error} If write fails
 */
export async function writeState(projectRoot, stateData) {
  try {
    // Validate state data before writing
    validateStateData(stateData);

    const statePath = path.join(projectRoot, '.planning', 'STATE.md');

    // Read current content
    const currentContent = await readFile(statePath);

    // Update specific fields using regex replacement
    let updatedContent = currentContent;

    if (stateData.phase !== undefined) {
      updatedContent = updatedContent.replace(
        /(\*\*Phase:\*\*\s*)\d+/,
        `$1${stateData.phase}`
      );
    }

    if (stateData.plan !== undefined) {
      updatedContent = updatedContent.replace(
        /(\*\*Plan:\*\*\s*)\d+/,
        `$1${stateData.plan}`
      );
    }

    if (stateData.status !== undefined) {
      updatedContent = updatedContent.replace(
        /(\*\*Status:\*\*\s*)\w+/,
        `$1${stateData.status}`
      );
    }

    if (stateData.step !== undefined) {
      updatedContent = updatedContent.replace(
        /(\*\*Last activity:\*\*\s*)[^\n]+/,
        `$1${stateData.step}`
      );
    }

    if (stateData.progressIndicator !== undefined) {
      updatedContent = updatedContent.replace(
        /(\*\*Progress:\*\*\s*)`[^`]+`/,
        `$1\`${stateData.progressIndicator}\``
      );
    }

    // Always update last updated date
    const today = new Date().toISOString().split('T')[0];
    updatedContent = updatedContent.replace(
      /(\*\*Last Updated:\*\*\s*)[^\n]+/,
      `$1${today}`
    );

    // Write atomically
    await writeFileAtomic(statePath, updatedContent);
  } catch (error) {
    throw new Error(`Failed to write STATE.md: ${error.message}`);
  }
}

/**
 * Generate visual progress indicator
 * @param {number} currentPhase - Current phase number (1-indexed)
 * @param {number} totalPhases - Total number of phases
 * @returns {string} Progress bar string (e.g., "██░░" for 2/4)
 */
export function generateProgressIndicator(currentPhase, totalPhases) {
  const percentage = Math.round((currentPhase / totalPhases) * 100);
  const filled = '█'.repeat(currentPhase);
  const empty = '░'.repeat(totalPhases - currentPhase);
  return `${filled}${empty} (${percentage}% - Phase ${currentPhase} of ${totalPhases})`;
}

/**
 * Update progress with convenience merge
 * @param {string} projectRoot - Root directory of the project
 * @param {Object} updates - Partial state updates to merge
 * @returns {Promise<Object>} Updated state object
 */
export async function updateProgress(projectRoot, updates) {
  try {
    // Read current state
    const currentState = await readState(projectRoot);

    // Merge updates
    const updatedState = { ...currentState, ...updates };

    // If phase changed and no progress indicator provided, regenerate it
    if (updates.phase !== undefined && updates.progressIndicator === undefined) {
      // Extract total phases from current state if available
      // For now, assume 4 phases (from ROADMAP.md)
      updatedState.progressIndicator = generateProgressIndicator(updates.phase, 4);
    }

    // Write updated state
    await writeState(projectRoot, updatedState);

    return updatedState;
  } catch (error) {
    throw new Error(`Failed to update progress: ${error.message}`);
  }
}

/**
 * Transition to a new phase
 * Specialized function for phase transitions used by orchestration
 * @param {string} projectRoot - Root directory of the project
 * @param {number} newPhase - New phase number
 * @param {number} totalPhases - Total number of phases
 * @returns {Promise<Object>} Updated state object
 */
export async function transitionPhase(projectRoot, newPhase, totalPhases) {
  try {
    // Read current state
    const currentState = await readState(projectRoot);

    // Create updated state for phase transition
    const updatedState = {
      phase: newPhase,
      plan: 0, // Reset plan counter
      status: STATUS_VALUES.IN_PROGRESS,
      step: `Ready for Phase ${newPhase}`,
      progressIndicator: generateProgressIndicator(newPhase, totalPhases)
    };

    // Validate and write state
    await writeState(projectRoot, updatedState);

    return { ...currentState, ...updatedState };
  } catch (error) {
    throw new Error(`Failed to transition to phase ${newPhase}: ${error.message}`);
  }
}
