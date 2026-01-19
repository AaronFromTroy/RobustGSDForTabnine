/**
 * Approval Gate Module
 * Prepares approval context and logs decisions to STATE.md
 *
 * Critical patterns:
 * - Does NOT use CLI prompts (@inquirer/prompts, readline) - Tabnine handles UI
 * - Presents options through console output, lets Tabnine UI handle confirmation
 * - Logs decisions to STATE.md Key Decisions table atomically
 * - Uses state-manager.js and file-ops.js for file operations
 */

import { readState } from './state-manager.js';
import { readFile, writeFileAtomic } from './file-ops.js';
import path from 'node:path';

/**
 * Prepare approval gate context for Tabnine UI
 * Formats and presents options, returns structure for logging
 *
 * @param {string} gateName - Name of decision point (e.g., "Technology Stack")
 * @param {Array<Object>} options - Choices: [{name, description, pros, cons, recommendation}]
 * @returns {Object} Result: {gate, options, timestamp, status}
 */
export function prepareApprovalGate(gateName, options) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`APPROVAL GATE: ${gateName}`);
  console.log('='.repeat(60));
  console.log(`\nPlease review options and select your preference:\n`);

  // Display options with clear formatting
  options.forEach((opt, idx) => {
    console.log(`\n${idx + 1}. ${opt.name}`);
    console.log(`   ${opt.description}`);

    if (opt.pros && opt.pros.length > 0) {
      console.log(`\n   Pros:`);
      opt.pros.forEach(pro => console.log(`     + ${pro}`));
    }

    if (opt.cons && opt.cons.length > 0) {
      console.log(`\n   Cons:`);
      opt.cons.forEach(con => console.log(`     - ${con}`));
    }

    if (opt.recommendation) {
      console.log(`\n   Recommendation: ${opt.recommendation}`);
    }
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Respond with your choice (1-${options.length}) when Tabnine prompts for approval.`);
  console.log('='.repeat(60));

  // Return structure for calling code to use
  return {
    gate: gateName,
    options: options,
    timestamp: new Date().toISOString(),
    status: 'presented'
  };
}

/**
 * Log approval decision to STATE.md Key Decisions table
 * Appends new decision row atomically
 *
 * @param {string} projectRoot - Root directory of the project
 * @param {string} gateName - Decision point name
 * @param {string} selectedOption - User's choice
 * @param {string} rationale - Why this choice was made
 * @returns {Promise<Object>} Result: {logged: true, decision: {...}}
 */
export async function logApprovalDecision(projectRoot, gateName, selectedOption, rationale) {
  try {
    // Read current STATE.md
    const state = await readState(projectRoot);
    const statePath = path.join(projectRoot, '.planning', 'STATE.md');

    // Prepare decision entry
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const decision = `| [APPROVAL GATE] ${gateName}: ${selectedOption} | ${date} | ${rationale} |`;

    // Get raw content
    let content = state.rawContent;

    // Find the Key Decisions table and append new row
    // Pattern: ## Key Decisions\n| Decision | Date | Rationale |\n|---|---|---|\n(existing rows)
    const tableRegex = /(## Key Decisions\s+\| Decision \| Date \| Rationale \|\s+\|[-|]+\|[^\n]*\n)((?:\|[^\n]+\n)*)/;
    const tableMatch = content.match(tableRegex);

    if (tableMatch) {
      // Insert new decision after existing rows
      const tableStart = tableMatch[1];
      const tableRows = tableMatch[2];
      const newTable = tableStart + tableRows + decision + '\n';
      content = content.replace(tableMatch[0], newTable);
    } else {
      throw new Error('Could not find Key Decisions table in STATE.md');
    }

    // Write atomically
    await writeFileAtomic(statePath, content);

    return {
      logged: true,
      decision: {
        gateName,
        selectedOption,
        rationale,
        timestamp: date
      }
    };
  } catch (error) {
    throw new Error(`Failed to log approval decision: ${error.message}`);
  }
}
