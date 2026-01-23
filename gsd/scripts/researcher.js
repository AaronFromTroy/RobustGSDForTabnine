/**
 * Automated Research Module
 * Performs web searches and gathers research findings with source attribution
 *
 * Critical patterns:
 * - Generates search queries based on research type (STACK/FEATURES/ARCHITECTURE/PITFALLS)
 * - Extracts findings from search results with source URLs
 * - Merges automated and manual findings (manual takes precedence)
 * - All operations async (Phase 2 convention)
 * - Real web scraping using scraper.js (Phase 7 enhancement)
 *
 * TODO: Integrate with WebSearch tool when available in Tabnine for URL discovery
 * Current implementation uses heuristic documentation URL building
 */

import { scrapeContent } from './scraper.js';
import { assignConfidenceLevel } from './source-validator.js';
import { deduplicateFindings } from './deduplicator.js';

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
 * Build candidate documentation URLs for common topics
 * Heuristic-based URL generation for popular libraries and frameworks
 *
 * This is an MVP approach for URL discovery. In production with WebSearch,
 * the WebSearch API would return URLs and this function would not be needed.
 *
 * @param {string} topic - Research topic (e.g., "React", "Node.js", "Express")
 * @param {string} type - Research type (STACK, FEATURES, etc.)
 * @returns {Array<string>} Array of candidate documentation URLs
 */
function buildDocumentationUrls(topic, type) {
  const normalized = topic.toLowerCase().replace(/\s+/g, '');
  const urls = [];

  // Common documentation URL patterns
  // Pattern 1: docs.{topic}.{tld}
  urls.push(`https://docs.${normalized}.com/`);
  urls.push(`https://docs.${normalized}.dev/`);
  urls.push(`https://docs.${normalized}.org/`);

  // Pattern 2: {topic}.{tld}
  urls.push(`https://${normalized}.dev/`);
  urls.push(`https://${normalized}.com/`);
  urls.push(`https://${normalized}.org/`);

  // Pattern 3: Special cases for popular technologies
  const specialCases = {
    'react': ['https://react.dev/', 'https://react.dev/learn'],
    'nodejs': ['https://nodejs.org/en/docs/', 'https://nodejs.org/api/'],
    'node.js': ['https://nodejs.org/en/docs/', 'https://nodejs.org/api/'],
    'express': ['https://expressjs.com/', 'https://expressjs.com/en/guide/routing.html'],
    'vue': ['https://vuejs.org/', 'https://vuejs.org/guide/introduction.html'],
    'angular': ['https://angular.dev/', 'https://angular.dev/overview'],
    'svelte': ['https://svelte.dev/', 'https://svelte.dev/docs/introduction'],
    'nextjs': ['https://nextjs.org/', 'https://nextjs.org/docs'],
    'next.js': ['https://nextjs.org/', 'https://nextjs.org/docs'],
    'typescript': ['https://www.typescriptlang.org/', 'https://www.typescriptlang.org/docs/'],
    'python': ['https://docs.python.org/', 'https://docs.python.org/3/'],
    'django': ['https://docs.djangoproject.com/', 'https://www.djangoproject.com/start/'],
    'flask': ['https://flask.palletsprojects.com/', 'https://flask.palletsprojects.com/en/stable/'],
    'fastapi': ['https://fastapi.tiangolo.com/', 'https://fastapi.tiangolo.com/tutorial/']
  };

  if (specialCases[normalized]) {
    urls.unshift(...specialCases[normalized]);
  }

  // Pattern 4: MDN for web technologies
  if (topic.toLowerCase().includes('javascript') ||
      topic.toLowerCase().includes('html') ||
      topic.toLowerCase().includes('css') ||
      topic.toLowerCase().includes('web')) {
    urls.push(`https://developer.mozilla.org/en-US/docs/Web/${topic.replace(/\s+/g, '_')}`);
  }

  // Limit to top 3 URLs to avoid excessive scraping
  return urls.slice(0, 3);
}

/**
 * DEPRECATED: Generate mock search results for development and testing
 * Replaced with real scraping via scraper.js
 *
 * Kept for backward compatibility with existing tests.
 * TODO: Update tests to use real scraping, then remove this function.
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

  // Build candidate documentation URLs (MVP approach)
  // TODO: In production with WebSearch, use WebSearch API to discover URLs
  const docUrls = buildDocumentationUrls(topic, type);
  console.log(`[researcher] Built ${docUrls.length} documentation URLs to scrape`);

  // Scrape each URL with real web scraping
  const scrapedFindings = [];
  for (const url of docUrls) {
    try {
      console.log(`[researcher] Scraping: ${url}`);
      const result = await scrapeContent(url);

      scrapedFindings.push({
        title: result.title || topic,
        url: result.url,
        content: result.content.substring(0, 500), // First 500 chars for content
        snippet: result.content.substring(0, 200),  // First 200 chars for snippet
        method: result.method,
        source: result.url
      });

      console.log(`[researcher] Successfully scraped ${url} (${result.method} method, ${result.content.length} chars)`);
    } catch (error) {
      console.warn(`[researcher] Failed to scrape ${url}: ${error.message}`);
      // Continue with other URLs even if one fails
    }
  }

  // Extract findings (applies filtering and deduplication)
  const findings = extractFindings(scrapedFindings);

  console.log(`[researcher] Extracted ${findings.length} findings from ${scrapedFindings.length} scraped sources`);

  return findings;
}

/**
 * Extract findings from search results
 * Parses search results and creates structured findings with source attribution
 *
 * Enhanced in Phase 7 with:
 * - Content-based deduplication (not just URL)
 * - Authority classification for confidence scoring
 *
 * @param {Array<Object>} searchResults - Search results with {title, snippet, url, source, content}
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

    const { title, snippet, url, source, content } = result;

    // Support both old (url) and new (source) field names
    const sourceUrl = source || url;

    // Require essential fields
    if (!title || !sourceUrl) {
      continue;
    }

    // Use content if available, fallback to snippet
    const findingContent = content || snippet || '';

    // Skip if no content
    if (!findingContent) {
      continue;
    }

    // Filter out low-quality sources
    // Exclude HTTP (require HTTPS)
    if (sourceUrl.startsWith('http://')) {
      continue;
    }

    // Exclude forums (low signal-to-noise)
    if (sourceUrl.includes('forum.') || sourceUrl.includes('reddit.com') || sourceUrl.includes('discord.')) {
      continue;
    }

    // Deduplicate by URL (content-based deduplication happens later)
    if (seenUrls.has(sourceUrl)) {
      continue;
    }

    seenUrls.add(sourceUrl);

    // Create structured finding
    findings.push({
      title,
      content: findingContent,
      source: sourceUrl
    });
  }

  // Apply content-based deduplication (catches same content from different URLs)
  const deduplicated = deduplicateFindings(findings);

  // Assign confidence levels using enhanced source validator
  const withConfidence = deduplicated.map(finding => ({
    ...finding,
    confidence: assignConfidenceLevel(finding)
  }));

  return withConfidence;
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

  // Apply content-based deduplication
  const deduplicated = deduplicateFindings(combined);

  // Sort by confidence level (HIGH -> MEDIUM -> LOW)
  // Assign confidence to each finding for sorting using enhanced source validator
  const withConfidence = deduplicated.map(f => ({
    ...f,
    confidence: assignConfidenceLevel(f)
  }));

  // Sort by confidence (HIGH=3, MEDIUM=2, LOW=1, UNVERIFIED=0)
  const confidenceWeight = { HIGH: 3, MEDIUM: 2, LOW: 1, UNVERIFIED: 0 };
  withConfidence.sort((a, b) => {
    return confidenceWeight[b.confidence] - confidenceWeight[a.confidence];
  });

  // Return sorted findings (keep confidence field for downstream use)
  return withConfidence;
}
