/**
 * Trigger Detector Module
 * Provides exact phrase matching for workflow triggers with confirmation prompts
 *
 * Critical patterns:
 * - Exact phrase matching only (no fuzzy logic, no NLP)
 * - Case-insensitive normalization (trim + toLowerCase)
 * - Visual confirmation prompts (box format with icon)
 * - Conflict detection (prevent dual workflows)
 */

import { readFile } from './file-ops.js';
import { readState } from './state-manager.js';
import path from 'node:path';

/**
 * Detect workflow trigger in user input
 * Uses exact phrase matching (case-insensitive) without fuzzy logic
 *
 * @param {string} userInput - User input text to check for triggers
 * @param {Object} config - Configuration object with triggerPhrases
 * @returns {Object|null} Trigger result {type: 'START'|'CONTINUE', phrase: string} or null
 */
export function detectTrigger(userInput, config) {
  if (!userInput || typeof userInput !== 'string') {
    return null;
  }

  if (!config || !config.triggerPhrases) {
    throw new Error('Invalid config: missing triggerPhrases');
  }

  // Normalize input: trim whitespace and convert to lowercase
  const normalized = userInput.trim().toLowerCase();

  // Check for START triggers (exact match only)
  if (config.triggerPhrases.start && Array.isArray(config.triggerPhrases.start)) {
    for (const phrase of config.triggerPhrases.start) {
      if (normalized === phrase.toLowerCase()) {
        return {
          type: 'START',
          phrase: phrase
        };
      }
    }
  }

  // Check for CONTINUE triggers (exact match only)
  if (config.triggerPhrases.continue && Array.isArray(config.triggerPhrases.continue)) {
    for (const phrase of config.triggerPhrases.continue) {
      if (normalized === phrase.toLowerCase()) {
        return {
          type: 'CONTINUE',
          phrase: phrase
        };
      }
    }
  }

  // Check for UPGRADE triggers (exact match only)
  if (config.triggerPhrases.upgrade && Array.isArray(config.triggerPhrases.upgrade)) {
    for (const phrase of config.triggerPhrases.upgrade) {
      if (normalized === phrase.toLowerCase()) {
        return {
          type: 'UPGRADE',
          phrase: phrase
        };
      }
    }
  }

  return null; // No trigger detected
}

/**
 * Load trigger configuration from .gsd-config.json
 *
 * @param {string} projectRoot - Root directory of the project
 * @returns {Promise<Object>} Configuration object with triggerPhrases
 * @throws {Error} If config file not found or parsing fails
 */
export async function loadTriggerConfig(projectRoot) {
  try {
    const configPath = path.join(projectRoot, 'gsd', '.gsd-config.json');
    const configContent = await readFile(configPath);
    const config = JSON.parse(configContent);

    if (!config.triggerPhrases) {
      throw new Error('Configuration missing triggerPhrases section');
    }

    return config;
  } catch (error) {
    if (error.message.includes('File not found')) {
      throw new Error('Configuration file not found at gsd/.gsd-config.json');
    }
    throw new Error(`Failed to load trigger config: ${error.message}`);
  }
}

/**
 * Generate confirmation prompt for detected trigger
 * Creates visual box format with icon for user confirmation
 *
 * @param {Object} triggerResult - Trigger detection result from detectTrigger()
 * @param {string} triggerResult.type - Trigger type ('START' or 'CONTINUE')
 * @param {string} triggerResult.phrase - Detected phrase
 * @returns {string} Formatted confirmation message
 */
export function confirmTrigger(triggerResult) {
  if (!triggerResult || !triggerResult.type || !triggerResult.phrase) {
    throw new Error('Invalid trigger result');
  }

  let action;
  if (triggerResult.type === 'START') {
    action = 'Start new workflow';
  } else if (triggerResult.type === 'CONTINUE') {
    action = 'Resume workflow from checkpoint';
  } else if (triggerResult.type === 'UPGRADE') {
    return `╔═══════════════════════════════════════════╗
║  🔵 UPGRADE DETECTED                      ║
╠═══════════════════════════════════════════╣
║  Trigger: "${triggerResult.phrase}"
║
║  This will:
║  - Check for available GSD updates
║  - Show preview of changes
║  - Create backup before upgrade
║  - Preserve your .gsd-config.json
║  - Update templates, guidelines, scripts
║
║  Type "yes" to continue or "no" to cancel
╚═══════════════════════════════════════════╝`;
  }

  return `🔵 GSD Trigger Detected

Phrase: "${triggerResult.phrase}"
Action: ${action}

Continue? (yes/no)`;
}

/**
 * Check for workflow conflicts before activation
 * Prevents starting new workflow when one exists, or continuing when none exists
 *
 * @param {string} projectRoot - Root directory of the project
 * @param {string} triggerType - Trigger type ('START' or 'CONTINUE')
 * @returns {Promise<string|null>} Conflict message if conflict exists, null otherwise
 */
export async function checkWorkflowConflict(projectRoot, triggerType) {
  try {
    // Try to read existing state
    const state = await readState(projectRoot);

    // START trigger conflict: workflow already in progress
    if (triggerType === 'START' && state.phase > 0) {
      return `Workflow already in progress at Phase ${state.phase}. Use 'continue GSD workflow' to resume or complete current first.`;
    }

    // CONTINUE trigger conflict: no workflow exists
    if (triggerType === 'CONTINUE' && (state.phase === 0 || !state.phase)) {
      return `No active workflow found. Use 'start GSD' to initialize GSD in this project.\nNote: This works for both new and existing codebases.`;
    }

    return null; // No conflict
  } catch (error) {
    // If STATE.md doesn't exist, treat as no workflow
    if (error.message.includes('STATE.md not found') || error.message.includes('File not found')) {
      if (triggerType === 'CONTINUE') {
        return `No active workflow found. Use 'start GSD' to initialize GSD in this project.\nNote: This works for both new and existing codebases.`;
      }
      return null; // OK to start new workflow
    }

    // Rethrow other errors (parsing errors, etc.)
    throw new Error(`Failed to check workflow conflict: ${error.message}`);
  }
}
