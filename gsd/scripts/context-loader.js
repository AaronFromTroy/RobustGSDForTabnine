/**
 * Context Loader Module
 * Provides CONTEXT.md parsing and discussion result persistence
 *
 * Enables research and planning scripts to read user decisions from CONTEXT.md,
 * ensuring locked choices are respected during plan creation.
 *
 * Critical patterns:
 * - Returns null for missing CONTEXT.md (graceful handling)
 * - Parses decision markdown into structured key-value pairs
 * - Categorizes user responses as locked/discretion/deferred
 * - Uses template-renderer.js for CONTEXT.md generation
 * - Uses writeFileAtomic for safe file writes
 */

import matter from 'front-matter';
import { readFile, writeFileAtomic, ensureDir, fileExists } from './file-ops.js';
import { renderTemplate } from './template-renderer.js';
import path from 'node:path';

/**
 * Load and parse phase CONTEXT.md if it exists
 *
 * @param {number} phase - Phase number (e.g., 1, 2, 3)
 * @param {string} phaseName - Phase name slug (e.g., "foundation-templates")
 * @returns {Promise<Object|null>} Parsed context object or null if file doesn't exist
 * @returns {Object} returns.frontmatter - YAML frontmatter data
 * @returns {Object} returns.decisions - Parsed decision key-value pairs
 * @returns {Array<string>} returns.discretion - Items where Claude has discretion
 * @returns {Array<string>} returns.deferred - Items explicitly deferred to future phases
 *
 * @example
 * const context = await loadPhaseContext(2, 'core-infrastructure');
 * if (context) {
 *   console.log('Locked decisions:', context.decisions);
 * }
 */
export async function loadPhaseContext(phase, phaseName) {
  try {
    // Construct path to CONTEXT.md
    const contextPath = path.join(
      process.cwd(),
      '.planning',
      'phases',
      `${String(phase).padStart(2, '0')}-${phaseName}`,
      `${String(phase).padStart(2, '0')}-CONTEXT.md`
    );

    // Check if file exists - return null if not (no context = full discretion)
    const exists = await fileExists(contextPath);
    if (!exists) {
      return null;
    }

    // Read and parse file
    const content = await readFile(contextPath);
    const parsed = matter(content);

    // Extract decisions section
    const decisionsMatch = content.match(/<decisions>([\s\S]*?)<\/decisions>/);
    const decisionsMarkdown = decisionsMatch ? decisionsMatch[1] : '';

    // Parse decisions into key-value pairs
    const decisions = parseDecisions(decisionsMarkdown);

    // Extract "Claude's Discretion" subsection
    const discretionMatch = decisionsMarkdown.match(/### Claude's Discretion([\s\S]*?)(?=###|<\/decisions>|$)/);
    const discretionMarkdown = discretionMatch ? discretionMatch[1] : '';
    const discretion = discretionMarkdown
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim());

    // Extract deferred section
    const deferredMatch = content.match(/<deferred>([\s\S]*?)<\/deferred>/);
    const deferredMarkdown = deferredMatch ? deferredMatch[1] : '';
    const deferred = deferredMarkdown
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim());

    return {
      frontmatter: parsed.attributes,
      decisions,
      discretion,
      deferred
    };
  } catch (error) {
    throw new Error(`Failed to load phase context: ${error.message}`);
  }
}

/**
 * Parse decision markdown into key-value object
 * Converts "- **Key:** Value" format to { key: 'Value' }
 *
 * @param {string} markdown - Markdown with decision bullets
 * @returns {Object} Key-value pairs (keys are lowercase snake_case)
 *
 * @example
 * const markdown = '- **Technology Stack:** React\n- **Testing:** Jest';
 * parseDecisions(markdown);
 * // Returns: { technology_stack: 'React', testing: 'Jest' }
 */
export function parseDecisions(markdown) {
  const decisions = {};

  // Match pattern: - **Key:** Value
  const regex = /- \*\*([^:]+):\*\* (.+)/g;
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    const key = match[1].trim();
    const value = match[2].trim();

    // Convert key to lowercase snake_case
    const snakeCaseKey = key
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with underscore
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores

    decisions[snakeCaseKey] = value;
  }

  return decisions;
}

/**
 * Categorize user responses into locked/discretion/deferred
 *
 * @param {Object} answers - User responses to discussion questions
 * @returns {Object} Categorized responses
 * @returns {Object} returns.locked - User explicitly chose something
 * @returns {Object} returns.discretion - User said "skip", "up to you", or left blank
 * @returns {Object} returns.deferred - User said "not now", "later", "future phase"
 *
 * @example
 * const answers = {
 *   tech_stack: 'React',
 *   testing: 'skip',
 *   auth: 'handle later'
 * };
 * categorizeAnswers(answers);
 * // Returns: {
 * //   locked: { tech_stack: 'React' },
 * //   discretion: ['testing'],
 * //   deferred: ['auth']
 * // }
 */
export function categorizeAnswers(answers) {
  const locked = {};
  const discretion = [];
  const deferred = [];

  // Keywords indicating discretion (Claude can choose)
  const discretionKeywords = ['skip', 'up to you', 'your choice', 'whatever', 'default'];

  // Keywords indicating deferral (future phase)
  const deferredKeywords = ['not now', 'later', 'future', 'next phase', 'defer'];

  for (const [key, value] of Object.entries(answers)) {
    // Skip empty values
    if (!value || value.trim() === '') {
      discretion.push(key);
      continue;
    }

    const valueLower = value.toLowerCase();

    // Check if deferred
    if (deferredKeywords.some(keyword => valueLower.includes(keyword))) {
      deferred.push(key);
      continue;
    }

    // Check if discretion
    if (discretionKeywords.some(keyword => valueLower.includes(keyword))) {
      discretion.push(key);
      continue;
    }

    // Otherwise, it's a locked decision
    locked[key] = value;
  }

  return { locked, discretion, deferred };
}

/**
 * Save discussion context to CONTEXT.md
 * Creates phase directory if needed, categorizes answers, renders template, and writes atomically
 *
 * @param {number} phase - Phase number (e.g., 1, 2, 3)
 * @param {string} phaseName - Phase name slug (e.g., "foundation-templates")
 * @param {Object} answers - User responses to discussion questions
 * @param {string} phaseGoal - Phase objective/description from ROADMAP.md
 * @returns {Promise<string>} Path to created CONTEXT.md file
 * @throws {Error} If directory creation or file write fails
 *
 * @example
 * await saveDiscussionContext(
 *   2,
 *   'core-infrastructure',
 *   { tech_stack: 'Node.js', testing: 'Jest' },
 *   'Build core infrastructure modules'
 * );
 */
export async function saveDiscussionContext(phase, phaseName, answers, phaseGoal) {
  try {
    // Create phase directory if needed
    const phaseDir = path.join(
      process.cwd(),
      '.planning',
      'phases',
      `${String(phase).padStart(2, '0')}-${phaseName}`
    );
    await ensureDir(phaseDir);

    // Categorize answers
    const { locked, discretion, deferred } = categorizeAnswers(answers);

    // Format locked decisions as markdown bullets
    const lockedDecisions = Object.entries(locked)
      .map(([key, value]) => {
        // Convert snake_case back to Title Case
        const title = key
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        return `- **${title}:** ${value}`;
      })
      .join('\n');

    // Format discretion items as markdown bullets
    const discretionItems = discretion.length > 0
      ? discretion
          .map(key => {
            const title = key
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            return `- ${title}`;
          })
          .join('\n')
      : '- (None - all decisions locked in)';

    // Format deferred items as markdown bullets
    const deferredItems = deferred.length > 0
      ? deferred
          .map(key => {
            const title = key
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            return `- ${title}`;
          })
          .join('\n')
      : '- (None - no items deferred)';

    // Prepare template variables
    const variables = {
      phase,
      phase_name: phaseName,
      gathered: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      status: 'ready-for-planning',
      discussion_type: answers.phaseType || 'technical',
      phase_boundary: phaseGoal,
      locked_decisions: lockedDecisions,
      discretion_items: discretionItems,
      specifics_content: '(No additional specifics provided)',
      deferred_items: deferredItems
    };

    // Render CONTEXT template
    const templatesDir = path.join(process.cwd(), 'gsd', 'templates');
    const rendered = await renderTemplate('CONTEXT', variables, templatesDir);

    // Write atomically
    const contextPath = path.join(
      phaseDir,
      `${String(phase).padStart(2, '0')}-CONTEXT.md`
    );
    await writeFileAtomic(contextPath, rendered);

    return contextPath;
  } catch (error) {
    throw new Error(`Failed to save discussion context: ${error.message}`);
  }
}
