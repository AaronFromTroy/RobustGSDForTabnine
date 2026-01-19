/**
 * Automated Research Module
 * Performs web searches and gathers research findings with source attribution
 *
 * Critical patterns:
 * - Generates search queries based on research type (STACK/FEATURES/ARCHITECTURE/PITFALLS)
 * - Extracts findings from search results with source URLs
 * - Merges automated and manual findings (manual takes precedence)
 * - All operations async (Phase 2 convention)
 *
 * TODO: Integrate with WebSearch tool when available in Tabnine
 * Current implementation uses mock data for development and testing
 */

import { assignConfidenceLevel } from './research-synthesizer.js';

/**
 * Generate search queries based on research topic and type
 * Different types produce different query patterns
 *
 * @param {string} topic - Research topic (e.g., "React", "Node.js authentication")
 * @param {string} type - Research type: STACK, FEATURES, ARCHITECTURE, PITFALLS, or CUSTOM
 * @returns {Array<string>} Array of search query strings
 */
function generateSearchQueries(topic, type) {
  const queries = [];

  switch (type) {
    case 'STACK':
      queries.push(`${topic} official documentation`);
      queries.push(`${topic} getting started guide`);
      queries.push(`${topic} best practices`);
      queries.push(`${topic} tutorial`);
      queries.push(`${topic} ecosystem overview`);
      break;

    case 'FEATURES':
      queries.push(`${topic} features`);
      queries.push(`${topic} capabilities`);
      queries.push(`${topic} use cases`);
      queries.push(`${topic} feature comparison`);
      queries.push(`${topic} what can it do`);
      break;

    case 'ARCHITECTURE':
      queries.push(`${topic} architecture patterns`);
      queries.push(`${topic} design patterns`);
      queries.push(`${topic} project structure`);
      queries.push(`${topic} architectural best practices`);
      queries.push(`${topic} folder organization`);
      break;

    case 'PITFALLS':
      queries.push(`${topic} common mistakes`);
      queries.push(`${topic} pitfalls`);
      queries.push(`${topic} anti-patterns`);
      queries.push(`${topic} gotchas`);
      queries.push(`${topic} what to avoid`);
      break;

    case 'CUSTOM':
    default:
      // Generic queries for custom research
      queries.push(`${topic} documentation`);
      queries.push(`${topic} guide`);
      queries.push(`${topic} best practices`);
      break;
  }

  return queries;
}

/**
 * Generate mock search results for development and testing
 * TODO: Replace with actual WebSearch integration when available
 *
 * @param {string} query - Search query string
 * @param {string} topic - Research topic
 * @param {string} type - Research type
 * @returns {Array<Object>} Mock search results with {title, snippet, url}
 */
function generateMockSearchResults(query, topic, type) {
  // Mock results simulate different source types for confidence level testing
  const mockResults = [];

  // Always include official documentation (HIGH confidence)
  if (query.includes('official') || query.includes('documentation')) {
    mockResults.push({
      title: `${topic} Official Documentation`,
      snippet: `Official documentation for ${topic}. Getting started guide, API reference, and best practices.`,
      url: `https://docs.${topic.toLowerCase().replace(/\s+/g, '')}.com/getting-started`
    });
  }

  // Include .dev domain (HIGH confidence)
  if (type === 'STACK' || type === 'FEATURES') {
    mockResults.push({
      title: `${topic} Developer Guide`,
      snippet: `Comprehensive developer guide covering ${topic} features and usage patterns.`,
      url: `https://${topic.toLowerCase().replace(/\s+/g, '')}.dev/guide`
    });
  }

  // Include GitHub docs (HIGH confidence)
  if (query.includes('guide') || query.includes('tutorial')) {
    mockResults.push({
      title: `${topic} GitHub Documentation`,
      snippet: `Official ${topic} repository documentation and examples.`,
      url: `https://github.com/${topic.toLowerCase().replace(/\s+/g, '')}/${topic.toLowerCase().replace(/\s+/g, '')}/docs/README.md`
    });
  }

  // Include MDN for web technologies (MEDIUM confidence)
  if (topic.toLowerCase().includes('javascript') || topic.toLowerCase().includes('web')) {
    mockResults.push({
      title: `${topic} - MDN Web Docs`,
      snippet: `Learn about ${topic} on MDN Web Docs. Browser compatibility, examples, and specifications.`,
      url: `https://developer.mozilla.org/en-US/docs/Web/${topic.replace(/\s+/g, '_')}`
    });
  }

  // Include Stack Overflow (MEDIUM confidence)
  mockResults.push({
    title: `Best practices for ${topic} - Stack Overflow`,
    snippet: `Community discussion about ${topic} best practices and common patterns.`,
    url: `https://stackoverflow.com/questions/12345/${topic.toLowerCase().replace(/\s+/g, '-')}-best-practices`
  });

  // Include blog post (LOW confidence)
  mockResults.push({
    title: `Getting Started with ${topic} in 2024`,
    snippet: `A comprehensive blog post about ${topic} for beginners and experienced developers.`,
    url: `https://blog.example.com/${topic.toLowerCase().replace(/\s+/g, '-')}-guide`
  });

  return mockResults;
}

/**
 * Perform automated research using web searches
 * Generates search queries, performs searches, and extracts findings
 *
 * @param {string} topic - Research topic (e.g., "React ecosystem", "Node.js authentication")
 * @param {string} type - Research type: 'STACK', 'FEATURES', 'ARCHITECTURE', 'PITFALLS', or 'CUSTOM'
 * @param {Object} options - Optional configuration
 * @param {number} options.maxSearches - Maximum number of searches to perform (default: 5)
 * @param {boolean} options.includeOfficialDocs - Prioritize official documentation (default: true)
 * @param {Array<string>} options.targetSources - Additional specific sources to search
 * @returns {Promise<Array<Object>>} Array of findings with {title, content, source}
 * @throws {Error} If topic or type is invalid
 */
export async function performResearch(topic, type, options = {}) {
  // Validate inputs
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    throw new Error('Invalid topic: must be a non-empty string');
  }

  const validTypes = ['STACK', 'FEATURES', 'ARCHITECTURE', 'PITFALLS', 'CUSTOM'];
  if (!type || !validTypes.includes(type)) {
    throw new Error(`Invalid type: must be one of ${validTypes.join(', ')}`);
  }

  // Extract options with defaults
  const maxSearches = options.maxSearches || 5;
  const includeOfficialDocs = options.includeOfficialDocs !== false; // Default true

  // Generate search queries
  const queries = generateSearchQueries(topic, type);
  const searchQueries = queries.slice(0, maxSearches);

  console.log(`[researcher] Performing ${searchQueries.length} searches for "${topic}" (${type})`);

  // TODO: Replace with actual WebSearch integration when available in Tabnine
  // For now, use mock data for development and testing
  const allSearchResults = [];

  for (const query of searchQueries) {
    console.log(`[researcher] Query: ${query}`);

    // Simulate web search
    const mockResults = generateMockSearchResults(query, topic, type);
    allSearchResults.push(...mockResults);
  }

  // Extract findings from search results
  const findings = extractFindings(allSearchResults);

  console.log(`[researcher] Extracted ${findings.length} findings from ${allSearchResults.length} search results`);

  return findings;
}

/**
 * Extract findings from search results
 * Parses search results and creates structured findings with source attribution
 *
 * @param {Array<Object>} searchResults - Search results with {title, snippet, url}
 * @returns {Array<Object>} Structured findings with {title, content, source}
 */
export function extractFindings(searchResults) {
  if (!Array.isArray(searchResults)) {
    return [];
  }

  const findings = [];
  const seenUrls = new Set();

  for (const result of searchResults) {
    // Validate result structure
    if (!result || typeof result !== 'object') {
      continue;
    }

    const { title, snippet, url } = result;

    // Require all fields
    if (!title || !snippet || !url) {
      continue;
    }

    // Filter out low-quality sources
    // Exclude HTTP (require HTTPS)
    if (url.startsWith('http://')) {
      continue;
    }

    // Exclude forums (low signal-to-noise)
    if (url.includes('forum.') || url.includes('reddit.com') || url.includes('discord.')) {
      continue;
    }

    // Deduplicate by URL
    if (seenUrls.has(url)) {
      continue;
    }

    seenUrls.add(url);

    // Create structured finding
    findings.push({
      title,
      content: snippet,
      source: url
    });
  }

  return findings;
}

/**
 * Merge manual findings with automated findings
 * Combines both sources, with manual findings taking precedence during deduplication
 *
 * @param {Array<Object>} automatedFindings - Findings from performResearch()
 * @param {Array<Object>} manualFindings - User-provided findings with {title, content, source, verifiedWithOfficial?}
 * @returns {Array<Object>} Combined and deduplicated findings, sorted by confidence level
 */
export function mergeManualFindings(automatedFindings, manualFindings) {
  if (!Array.isArray(automatedFindings)) {
    automatedFindings = [];
  }
  if (!Array.isArray(manualFindings)) {
    manualFindings = [];
  }

  // Use Map to deduplicate by source URL
  // Manual findings take precedence (processed first)
  const findingsMap = new Map();

  // Add manual findings first (higher precedence)
  for (const finding of manualFindings) {
    if (finding && finding.source) {
      findingsMap.set(finding.source, finding);
    }
  }

  // Add automated findings (only if URL not already present)
  for (const finding of automatedFindings) {
    if (finding && finding.source && !findingsMap.has(finding.source)) {
      findingsMap.set(finding.source, finding);
    }
  }

  // Convert Map back to array
  const combined = Array.from(findingsMap.values());

  // Sort by confidence level (HIGH -> MEDIUM -> LOW)
  // Assign confidence to each finding for sorting
  const withConfidence = combined.map(f => ({
    ...f,
    confidence: assignConfidenceLevel(f)
  }));

  // Sort by confidence (HIGH=3, MEDIUM=2, LOW=1)
  const confidenceWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  withConfidence.sort((a, b) => {
    return confidenceWeight[b.confidence] - confidenceWeight[a.confidence];
  });

  // Return sorted findings (remove confidence field as it will be reassigned by synthesizer)
  return withConfidence.map(({ confidence, ...finding }) => finding);
}
