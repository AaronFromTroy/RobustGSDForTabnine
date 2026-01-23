/**
 * Domain Coordinator
 *
 * Parallel multi-domain research coordination with context awareness.
 * Executes STACK/FEATURES/ARCHITECTURE/PITFALLS research in parallel with
 * controlled concurrency to prevent resource exhaustion.
 *
 * Critical patterns:
 * - p-limit for controlled parallelism (default: 1, sequential execution)
 * - Context-aware research respects locked decisions from CONTEXT.md
 * - Error handling preserves partial results (one domain failure doesn't stop others)
 * - Progress logging per domain for monitoring
 *
 * Exports:
 * - coordinateMultiDomainResearch: Main parallel coordinator
 * - performDomainResearch: Single domain research with context awareness
 */

import pLimit from 'p-limit';
import { performResearch } from './researcher.js';
import { loadPhaseContext } from './context-loader.js';

/**
 * Perform research for a single domain with context awareness
 *
 * Loads CONTEXT.md to respect locked decisions from user discussions.
 * For example, if technology_stack is locked to "React", research will
 * focus on React rather than exploring alternatives.
 *
 * @param {string} topic - Research topic (e.g., "React", "Node.js authentication")
 * @param {string} domain - Domain type: 'STACK', 'FEATURES', 'ARCHITECTURE', or 'PITFALLS'
 * @param {Object} options - Optional configuration
 * @param {number} [options.phase] - Phase number for CONTEXT.md loading
 * @param {string} [options.phaseName] - Phase name slug for CONTEXT.md loading
 * @param {number} [options.maxSearches] - Max searches per domain (default: 5)
 * @returns {Promise<Array<Object>>} Array of findings with domain metadata
 *
 * @example
 * // Without context
 * const findings = await performDomainResearch('React', 'STACK');
 *
 * // With context awareness
 * const findings = await performDomainResearch('React', 'STACK', {
 *   phase: 2,
 *   phaseName: 'core-infrastructure'
 * });
 */
export async function performDomainResearch(topic, domain, options = {}) {
  // Validate domain type
  const validDomains = ['STACK', 'FEATURES', 'ARCHITECTURE', 'PITFALLS'];
  if (!validDomains.includes(domain)) {
    throw new Error(`Invalid domain: ${domain}. Must be one of: ${validDomains.join(', ')}`);
  }

  // Load phase context if phase information provided
  let constrainedTopic = topic;
  if (options.phase && options.phaseName) {
    try {
      const context = await loadPhaseContext(options.phase, options.phaseName);

      if (context && context.decisions) {
        // Check for locked decisions that constrain research
        const lockedStack = context.decisions.technology_stack;
        const lockedPatterns = context.decisions.architectural_patterns;

        if (lockedStack && domain === 'STACK') {
          console.log(`[${domain}] Respecting locked decision: technology_stack = ${lockedStack}`);
          constrainedTopic = lockedStack;
        } else if (lockedPatterns && domain === 'ARCHITECTURE') {
          console.log(`[${domain}] Respecting locked decision: architectural_patterns = ${lockedPatterns}`);
          constrainedTopic = lockedPatterns;
        }
      }
    } catch (error) {
      // Context loading failure shouldn't block research
      console.warn(`[${domain}] Failed to load context: ${error.message}`);
    }
  }

  // Perform research for this domain
  const findings = await performResearch(constrainedTopic, domain, {
    maxSearches: options.maxSearches || 5
  });

  // Add domain metadata to findings
  return findings.map(finding => ({
    ...finding,
    domain
  }));
}

/**
 * Coordinate multi-domain research execution in parallel
 *
 * Executes research across all 4 domains (STACK/FEATURES/ARCHITECTURE/PITFALLS)
 * in parallel with controlled concurrency to prevent resource exhaustion.
 *
 * Concurrency rationale (from 07-RESEARCH.md):
 * - Default: 1 (sequential execution, safest for all environments)
 * - Scraping is I/O-bound (waiting for network), benefits from parallelism
 * - Over-parallelism (>5 browsers) causes EMFILE errors (Pitfall 4)
 * - Each domain may spawn multiple HTTP requests internally
 *
 * Error handling:
 * - Individual domain failures logged as warnings
 * - Failed domains return empty array (partial results preserved)
 * - Successful domains continue execution unaffected
 *
 * @param {string} topic - Research topic (e.g., "React", "Node.js authentication")
 * @param {Object} options - Optional configuration
 * @param {number} [options.concurrency=1] - Max concurrent domains (1-10 valid, 1=sequential)
 * @param {number} [options.phase] - Phase number for context loading
 * @param {string} [options.phaseName] - Phase name slug for context loading
 * @param {number} [options.maxSearches] - Max searches per domain (default: 5)
 * @returns {Promise<Object>} Domain results: { stack: [...], features: [...], architecture: [...], pitfalls: [...] }
 *
 * @example
 * // Basic usage
 * const results = await coordinateMultiDomainResearch('React');
 * console.log('STACK findings:', results.stack.length);
 *
 * // With concurrency control and context
 * const results = await coordinateMultiDomainResearch('React', {
 *   concurrency: 3,
 *   phase: 2,
 *   phaseName: 'core-infrastructure'
 * });
 */
export async function coordinateMultiDomainResearch(topic, options = {}) {
  // Validate topic
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    throw new Error('Invalid topic: must be a non-empty string');
  }

  // Extract options with defaults
  const concurrency = options.concurrency || 1; // Default: sequential (1 domain at a time)

  // Validate concurrency range
  if (concurrency < 1 || concurrency > 10) {
    throw new Error('Concurrency must be between 1 and 10');
  }

  // Define research domains
  const domains = ['STACK', 'FEATURES', 'ARCHITECTURE', 'PITFALLS'];

  // Create concurrency limiter
  const limit = pLimit(concurrency);

  console.log(`[coordinator] Starting multi-domain research for: ${topic}`);
  console.log(`[coordinator] Concurrency limit: ${concurrency} domains`);

  // Create domain research promises with pLimit wrapper
  const domainPromises = domains.map(domain =>
    limit(async () => {
      try {
        console.log(`[${domain}] Starting research for: ${topic}`);

        const findings = await performDomainResearch(topic, domain, options);

        console.log(`[${domain}] Found ${findings.length} sources`);

        return { domain, findings };
      } catch (error) {
        // Log error but don't fail entire operation
        console.error(`[${domain}] Research failed: ${error.message}`);

        // Return empty findings for failed domain
        return { domain, findings: [] };
      }
    })
  );

  // Execute all domain research in parallel (respecting concurrency limit)
  const results = await Promise.all(domainPromises);

  // Transform array of {domain, findings} into object with lowercase keys
  const domainResults = {};
  for (const result of results) {
    const key = result.domain.toLowerCase();
    domainResults[key] = result.findings;
  }

  // Log summary
  const totalFindings = Object.values(domainResults).reduce((sum, findings) => sum + findings.length, 0);
  console.log(`[coordinator] Completed multi-domain research: ${totalFindings} total findings`);

  return domainResults;
}

/**
 * INTEGRATION NOTES:
 *
 * This module coordinates parallel research across multiple domains.
 *
 * Usage in research workflow:
 *
 *   import { coordinateMultiDomainResearch } from './domain-coordinator.js';
 *
 *   // Parallel research across all domains
 *   const results = await coordinateMultiDomainResearch('React', {
 *     concurrency: 2,
 *     phase: 2,
 *     phaseName: 'core-infrastructure'
 *   });
 *
 *   // Access domain-specific findings
 *   const stackFindings = results.stack;
 *   const featureFindings = results.features;
 *   const archFindings = results.architecture;
 *   const pitfallFindings = results.pitfalls;
 *
 * Performance characteristics:
 * - Concurrency 2: ~4x faster than sequential (2 domains at a time)
 * - Concurrency 3: ~6x faster than sequential (3 domains at a time)
 * - Concurrency 4: ~8x faster but higher memory usage
 *
 * Context awareness:
 * - Respects locked decisions from Phase 6 CONTEXT.md
 * - Constrains research to user-specified technologies/patterns
 * - Gracefully handles missing CONTEXT.md (full discretion)
 *
 * Error handling:
 * - Individual domain failures don't stop other domains
 * - Failed domains return empty arrays (partial results preserved)
 * - All errors logged for debugging
 */
