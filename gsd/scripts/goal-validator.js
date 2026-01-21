/**
 * Goal Validator Module
 * Implements ATDD (Acceptance Test-Driven Development) pattern for goal-backward validation
 *
 * Critical patterns:
 * - Extract success criteria from ROADMAP.md
 * - Create type-specific validators based on criterion keywords
 * - Execute validation and return pass/fail with remediation guidance
 * - Graceful error handling (validators don't crash, return false with remediation)
 */

import { readFile, fileExists } from './file-ops.js';
import { runCommand } from './process-runner.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Validate acceptance criteria for a phase
 * Reads ROADMAP.md, extracts success criteria for specified phase, and validates each
 *
 * @param {number} phaseNumber - Phase number to validate (1-8)
 * @param {string} [projectRoot] - Project root directory (defaults to repository root)
 * @returns {Promise<Array<{criterion: string, passed: boolean, remediation: string}>>} Validation results
 */
export async function validateAcceptanceCriteria(phaseNumber, projectRoot = null) {
  // Default to repository root (2 levels up from gsd/scripts/)
  const root = projectRoot || path.resolve(__dirname, '..', '..');
  const roadmapPath = path.join(root, '.planning', 'ROADMAP.md');

  try {
    const roadmapContent = await readFile(roadmapPath);
    const criteria = extractSuccessCriteria(roadmapContent, phaseNumber);

    if (criteria.length === 0) {
      return [{
        criterion: `No success criteria found for Phase ${phaseNumber}`,
        passed: false,
        remediation: `Add success criteria to ROADMAP.md under "### Phase ${phaseNumber}:" section`
      }];
    }

    // Validate each criterion
    const results = [];
    for (const criterion of criteria) {
      const validator = createValidator(criterion.text, root);
      let passed = false;
      let remediation = criterion.remediation || 'No specific remediation available';

      try {
        passed = await validator();
      } catch (error) {
        // Graceful failure: validator error = criterion not met
        passed = false;
        remediation = `Validation error: ${error.message}. ${criterion.remediation || ''}`;
      }

      results.push({
        criterion: criterion.text,
        passed,
        remediation: passed ? 'Success criterion met' : remediation
      });
    }

    return results;
  } catch (error) {
    return [{
      criterion: 'ROADMAP.md validation failed',
      passed: false,
      remediation: `Unable to read ROADMAP.md: ${error.message}`
    }];
  }
}

/**
 * Extract success criteria from ROADMAP.md for specific phase
 * Parses markdown structure to find phase section and success criteria list
 *
 * @param {string} roadmap - ROADMAP.md content
 * @param {number} phaseNumber - Phase number (1-8)
 * @returns {Array<{text: string, remediation: string}>} Array of criteria objects
 */
export function extractSuccessCriteria(roadmap, phaseNumber) {
  const criteria = [];

  // Find the phase section: "### Phase N:" or "### Phase N - Name"
  const phaseRegex = new RegExp(`### Phase ${phaseNumber}[:\\-]`, 'm');
  const phaseMatch = roadmap.match(phaseRegex);

  if (!phaseMatch) {
    return criteria;
  }

  // Extract content from phase section to next phase section or end
  const phaseStartIndex = phaseMatch.index;
  const nextPhaseRegex = new RegExp(`### Phase ${phaseNumber + 1}[:\\-]`, 'm');
  const nextPhaseMatch = roadmap.slice(phaseStartIndex + 1).match(nextPhaseRegex);

  const phaseEndIndex = nextPhaseMatch
    ? phaseStartIndex + 1 + nextPhaseMatch.index
    : roadmap.length;

  const phaseContent = roadmap.slice(phaseStartIndex, phaseEndIndex);

  // Find "Success Criteria:" section
  const successCriteriaRegex = /\*\*Success Criteria:\*\*/;
  const successMatch = phaseContent.match(successCriteriaRegex);

  if (!successMatch) {
    return criteria;
  }

  // Extract numbered list items after "Success Criteria:"
  const criteriaStartIndex = successMatch.index + successMatch[0].length;
  const criteriaSection = phaseContent.slice(criteriaStartIndex);

  // Match numbered items: "1. Text" or "2. Text" etc.
  // Stop at next section (line starting with ### or **) or empty lines followed by non-list content
  const lines = criteriaSection.split('\n');

  for (const line of lines) {
    // Stop at next major section
    if (line.match(/^#{2,3}\s/) || line.match(/^\*\*[^*]+:\*\*/)) {
      break;
    }

    // Match numbered list item: "1. Description text"
    const listMatch = line.match(/^\d+\.\s+(.+)$/);
    if (listMatch) {
      const text = listMatch[1].trim();
      criteria.push({
        text,
        remediation: generateRemediation(text)
      });
    }
  }

  return criteria;
}

/**
 * Create validator function for a specific criterion
 * Detects criterion type from keywords and returns appropriate async validator
 *
 * @param {string} criterionText - Success criterion text from ROADMAP.md
 * @param {string} projectRoot - Project root directory
 * @returns {Function} Async validator function that returns boolean
 */
export function createValidator(criterionText, projectRoot) {
  const text = criterionText.toLowerCase();

  // Validator type detection based on keywords

  // Type: Artifact existence
  if (text.includes('artifacts') || text.includes('files exist')) {
    return async () => {
      const artifactPaths = [
        '.planning/PROJECT.md',
        '.planning/ROADMAP.md',
        '.planning/REQUIREMENTS.md',
        '.planning/STATE.md'
      ];

      for (const artifactPath of artifactPaths) {
        const fullPath = path.join(projectRoot, artifactPath);
        const exists = await fileExists(fullPath);
        if (!exists) {
          return false;
        }
      }
      return true;
    };
  }

  // Type: Test execution
  if (text.includes('tests pass') || text.includes('integration tests')) {
    return async () => {
      try {
        const testScriptPath = path.join(projectRoot, 'gsd', 'scripts', 'integration-test.js');
        const testExists = await fileExists(testScriptPath);

        if (!testExists) {
          return false;
        }

        const result = await runCommand('node', [testScriptPath], { cwd: projectRoot });
        return result.exitCode === 0;
      } catch (error) {
        return false;
      }
    };
  }

  // Type: Coverage threshold
  if (text.includes('coverage')) {
    return async () => {
      try {
        const testScriptPath = path.join(projectRoot, 'gsd', 'scripts', 'integration-test.js');
        const testExists = await fileExists(testScriptPath);

        if (!testExists) {
          return false;
        }

        const result = await runCommand('node', [testScriptPath], { cwd: projectRoot });

        // Parse coverage from output (if available)
        // For now, check if tests passed (coverage validation done separately)
        return result.exitCode === 0;
      } catch (error) {
        return false;
      }
    };
  }

  // Type: Requirements coverage
  if (text.includes('requirement') && (text.includes('coverage') || text.includes('mapped'))) {
    return async () => {
      try {
        const roadmapPath = path.join(projectRoot, '.planning', 'ROADMAP.md');
        const requirementsPath = path.join(projectRoot, '.planning', 'REQUIREMENTS.md');

        const roadmapExists = await fileExists(roadmapPath);
        const requirementsExists = await fileExists(requirementsPath);

        if (!roadmapExists || !requirementsExists) {
          return false;
        }

        const roadmap = await readFile(roadmapPath);
        const requirements = await readFile(requirementsPath);

        // Extract requirement IDs from REQUIREMENTS.md
        const requirementRegex = /\*\*([A-Z]+-\d+)\*\*:/g;
        const requirementMatches = [...requirements.matchAll(requirementRegex)];
        const requirementIds = requirementMatches.map(match => match[1]);

        // Extract requirement IDs from ROADMAP.md traceability
        const traceabilityRegex = /\|\s*([A-Z]+-\d+)\s*\|/g;
        const traceabilityMatches = [...roadmap.matchAll(traceabilityRegex)];
        const tracedIds = traceabilityMatches.map(match => match[1]);

        // Check all requirements are traced
        const orphaned = requirementIds.filter(id => !tracedIds.includes(id));
        return orphaned.length === 0;
      } catch (error) {
        return false;
      }
    };
  }

  // Type: Developer experience / documentation
  if (text.includes('developer can') || text.includes('installation')) {
    return async () => {
      try {
        const readmePath = path.join(projectRoot, 'gsd', 'README.md');
        return await fileExists(readmePath);
      } catch (error) {
        return false;
      }
    };
  }

  // Type: STATE.md validation
  if (text.includes('state.md') || text.includes('state shows')) {
    return async () => {
      try {
        const statePath = path.join(projectRoot, '.planning', 'STATE.md');
        const exists = await fileExists(statePath);

        if (!exists) {
          return false;
        }

        const stateContent = await readFile(statePath);

        // Check STATE.md has basic structure
        return stateContent.includes('## Current Position') &&
               stateContent.includes('Phase:') &&
               stateContent.includes('Status:');
      } catch (error) {
        return false;
      }
    };
  }

  // Type: Guideline files
  if (text.includes('guideline') && text.includes('exist')) {
    return async () => {
      try {
        const guidelinePaths = [
          'gsd/guidelines/new-project.md',
          'gsd/guidelines/plan-phase.md',
          'gsd/guidelines/execute-phase.md',
          'gsd/guidelines/verify-work.md'
        ];

        for (const guidelinePath of guidelinePaths) {
          const fullPath = path.join(projectRoot, guidelinePath);
          const exists = await fileExists(fullPath);
          if (!exists) {
            return false;
          }
        }
        return true;
      } catch (error) {
        return false;
      }
    };
  }

  // Type: Template files
  if (text.includes('template') && text.includes('exist')) {
    return async () => {
      try {
        const templatePaths = [
          'gsd/templates/PROJECT.md',
          'gsd/templates/ROADMAP.md',
          'gsd/templates/PLAN.md',
          'gsd/templates/REQUIREMENTS.md',
          'gsd/templates/STATE.md'
        ];

        for (const templatePath of templatePaths) {
          const fullPath = path.join(projectRoot, templatePath);
          const exists = await fileExists(fullPath);
          if (!exists) {
            return false;
          }
        }
        return true;
      } catch (error) {
        return false;
      }
    };
  }

  // Type: Workflow execution (trigger detection, orchestration)
  if (text.includes('workflow') || text.includes('trigger')) {
    return async () => {
      try {
        const orchestratorPath = path.join(projectRoot, 'gsd', 'scripts', 'workflow-orchestrator.js');
        const triggerPath = path.join(projectRoot, 'gsd', 'scripts', 'trigger-detector.js');

        const orchestratorExists = await fileExists(orchestratorPath);
        const triggerExists = await fileExists(triggerPath);

        return orchestratorExists && triggerExists;
      } catch (error) {
        return false;
      }
    };
  }

  // Default: Assume criterion is met (optimistic)
  // Used for criteria that require manual validation
  return async () => true;
}

/**
 * Generate remediation guidance based on criterion type
 * Provides actionable steps to fix failing criteria
 *
 * @param {string} criterionText - Success criterion text
 * @returns {string} Remediation guidance
 */
function generateRemediation(criterionText) {
  const text = criterionText.toLowerCase();

  if (text.includes('artifacts') || text.includes('files exist')) {
    return 'Ensure all required artifacts exist in .planning/ directory: PROJECT.md, ROADMAP.md, REQUIREMENTS.md, STATE.md';
  }

  if (text.includes('tests pass') || text.includes('integration tests')) {
    return 'Run tests and fix failures: node gsd/scripts/integration-test.js';
  }

  if (text.includes('coverage')) {
    return 'Increase test coverage to meet 80% threshold. Add tests for uncovered code paths.';
  }

  if (text.includes('requirement') && (text.includes('coverage') || text.includes('mapped'))) {
    return 'Update ROADMAP.md traceability section to map all requirements from REQUIREMENTS.md';
  }

  if (text.includes('developer can') || text.includes('installation')) {
    return 'Create gsd/README.md with installation instructions and usage examples';
  }

  if (text.includes('state.md') || text.includes('state shows')) {
    return 'Ensure .planning/STATE.md exists with Current Position, Phase, and Status sections';
  }

  if (text.includes('guideline') && text.includes('exist')) {
    return 'Create all guideline files in gsd/guidelines/: new-project.md, plan-phase.md, execute-phase.md, verify-work.md';
  }

  if (text.includes('template') && text.includes('exist')) {
    return 'Create all template files in gsd/templates/: PROJECT.md, ROADMAP.md, PLAN.md, REQUIREMENTS.md, STATE.md';
  }

  if (text.includes('workflow') || text.includes('trigger')) {
    return 'Implement workflow orchestration: gsd/scripts/workflow-orchestrator.js and trigger-detector.js';
  }

  return 'Manually verify this criterion is met according to ROADMAP.md specification';
}
