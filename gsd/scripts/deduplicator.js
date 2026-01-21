/**
 * Deduplicator
 *
 * Content-based deduplication using SHA256 hashing to detect duplicate content
 * even when URLs differ (versioned docs, localized pages, canonical URLs).
 *
 * @module deduplicator
 */

import crypto from 'node:crypto';

/**
 * Hash content using SHA256 after normalization.
 *
 * Normalization steps:
 * 1. Lowercase: Ignore case differences
 * 2. Collapse whitespace: "hello  world\n" becomes "hello world"
 * 3. Trim: Remove leading/trailing spaces
 *
 * This catches duplicate content with minor formatting differences:
 * - Different line breaks
 * - Extra whitespace
 * - Case variations
 *
 * @param {string} content - The content to hash
 * @returns {string} SHA256 hex digest (64 characters)
 *
 * @example
 * hashContent('Hello  World')    // Same hash as below
 * hashContent('hello\nworld')    // Same hash as above
 * hashContent('HELLO WORLD')     // Same hash as above
 */
export function hashContent(content) {
  // Normalize content: lowercase + collapse whitespace + trim
  const normalized = content
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  // Create SHA256 hash
  const hash = crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex');

  return hash;
}

/**
 * Deduplicate findings based on content hash (not just URL).
 *
 * Why content-based vs URL-only:
 * - Official docs often have multiple URLs for same content:
 *   - Versioned: /v1.0/guide, /v2.0/guide (same content)
 *   - Localized: /en/guide, /guide (English default)
 *   - Canonical: /docs/guide, /documentation/guide
 * - Catches near-duplicates with minor formatting differences
 *
 * Algorithm:
 * 1. Hash each finding's content
 * 2. If hash not seen: add to deduplicated array
 * 3. If hash already seen: add current URL to existing.alternateSources
 *
 * @param {Array<Object>} findings - Array of research findings
 * @param {string} findings[].content - Finding content
 * @param {string} findings[].source - Source URL
 * @param {string} [findings[].title] - Optional finding title
 * @returns {Array<Object>} Deduplicated findings with alternateSources
 *
 * @example
 * const findings = [
 *   { source: 'url1', content: 'Hello World', title: 'T1' },
 *   { source: 'url2', content: 'hello  world', title: 'T2' }  // Same content
 * ];
 * const result = deduplicateFindings(findings);
 * // result.length === 1
 * // result[0].alternateSources === [{ url: 'url2', title: 'T2' }]
 */
export function deduplicateFindings(findings) {
  // Track seen content hashes
  const seen = new Map(); // hash → first finding
  const deduplicated = [];

  for (const finding of findings) {
    // Hash the content
    const hash = hashContent(finding.content);

    if (!seen.has(hash)) {
      // First occurrence: add to deduplicated array
      seen.set(hash, finding);
      deduplicated.push(finding);
    } else {
      // Duplicate content: add current URL to alternate sources
      const existing = seen.get(hash);

      // Initialize alternateSources array if not present
      if (!existing.alternateSources) {
        existing.alternateSources = [];
      }

      // Add current finding as alternate source
      existing.alternateSources.push({
        url: finding.source,
        title: finding.title || 'Untitled'
      });
    }
  }

  // Log deduplication effectiveness
  const duplicatesRemoved = findings.length - deduplicated.length;
  console.log(`Deduplicated ${findings.length} → ${deduplicated.length} findings (removed ${duplicatesRemoved} duplicates)`);

  return deduplicated;
}
