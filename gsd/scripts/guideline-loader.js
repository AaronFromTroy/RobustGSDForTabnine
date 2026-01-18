/**
 * Guideline loading module
 * Provides modular loading of workflow guidelines by name
 *
 * Critical patterns:
 * - Loads config from .gsd-config.json to map workflow names to files
 * - Loads only the requested guideline (not all files at once)
 * - Reduces context window usage by 70-80% vs loading all guidelines
 * - Validates workflow names with helpful error messages
 */

import { readFile } from './file-ops.js';
import path from 'node:path';

/**
 * Load a single guideline by workflow name
 *
 * @param {string} workflowName - Workflow name (e.g., 'newProject', 'planPhase')
 * @param {string} configPath - Path to .gsd-config.json (default: 'gsd/.gsd-config.json')
 * @returns {Promise<string>} Guideline content (markdown with YAML frontmatter)
 * @throws {Error} If config not found, workflow unknown, or guideline not found
 */
export async function loadGuideline(workflowName, configPath = 'gsd/.gsd-config.json') {
  // Load config file
  let configContent;
  try {
    configContent = await readFile(configPath);
  } catch (error) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  // Parse JSON
  let config;
  try {
    config = JSON.parse(configContent);
  } catch (error) {
    throw new Error(`Invalid config file (JSON parse error): ${error.message}`);
  }

  // Find guideline file for workflow
  const guidelineFile = config.workflows?.[workflowName];
  if (!guidelineFile) {
    const availableWorkflows = Object.keys(config.workflows || {});
    throw new Error(
      `Unknown workflow: ${workflowName}. Available workflows: ${availableWorkflows.join(', ')}`
    );
  }

  // Construct guideline path
  const guidelinesDir = config.paths?.guidelines || 'gsd/guidelines';
  const guidelinePath = path.join(guidelinesDir, guidelineFile);

  // Load and return guideline content
  try {
    const guidelineContent = await readFile(guidelinePath);
    return guidelineContent;
  } catch (error) {
    throw new Error(`Guideline file not found: ${guidelinePath}`);
  }
}

/**
 * List available workflows from config
 *
 * @param {string} configPath - Path to .gsd-config.json (default: 'gsd/.gsd-config.json')
 * @returns {Promise<string[]>} Array of workflow names
 * @throws {Error} If config not found or invalid
 */
export async function listWorkflows(configPath = 'gsd/.gsd-config.json') {
  // Load config file
  let configContent;
  try {
    configContent = await readFile(configPath);
  } catch (error) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  // Parse JSON
  let config;
  try {
    config = JSON.parse(configContent);
  } catch (error) {
    throw new Error(`Invalid config file (JSON parse error): ${error.message}`);
  }

  // Return workflow names
  return Object.keys(config.workflows || {});
}

// Usage examples (in comments):
// Load planning guideline only when planning
// const planGuideline = await loadGuideline('planPhase');
//
// Load execution guideline only when executing
// const execGuideline = await loadGuideline('executePhase');
//
// Workflows: newProject, planPhase, executePhase, verifyWork
