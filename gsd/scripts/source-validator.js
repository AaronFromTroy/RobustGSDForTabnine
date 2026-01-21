/**
 * Source Validator
 *
 * Enhanced source authority classification for research quality validation.
 * Provides multi-tier authority classification using regex patterns (not string matching).
 *
 * @module source-validator
 */

/**
 * Authority classification rules with regex patterns.
 *
 * Tiers:
 * - HIGH: Official documentation, .dev domains, official paths, org docs
 * - MEDIUM: Trusted technical sources (MDN, Stack Overflow, .edu, .gov)
 * - LOW: Blog platforms and personal content (Medium, Dev.to, Hashnode)
 * - UNVERIFIED: No matches (returned by default)
 *
 * Why regex over string matching:
 * - More flexible: Can match wildcard patterns like github.com slash star slash docs
 * - More precise: Regex only matches docs domains at start of URL
 * - Extensible: Easy to add complex patterns for API documentation paths
 */
const AUTHORITY_RULES = {
  HIGH: [
    /^https:\/\/docs\./,                      // docs domains at start
    /^https:\/\/[^/]+\.dev\//,                // .dev TLD (modern tech docs)
    /\/official\//,                           // /official/ in path
    /github\.com\/[^/]+\/[^/]+\/docs\//,      // GitHub project docs (owner/repo/docs/)
    /^https:\/\/[^/]+\.org\/docs\//           // .org domain with /docs/ path
  ],
  MEDIUM: [
    /developer\.mozilla\.org/,                // MDN web docs
    /stackoverflow\.com/,                     // Stack Overflow
    /\.edu\//,                                // Educational institutions
    /\.gov\//                                 // Government resources
  ],
  LOW: [
    /medium\.com/,                            // Medium articles
    /dev\.to/,                                // Dev.to posts
    /hashnode\.dev/,                          // Hashnode blogs
    /blog\./                                  // Blog subdomains
  ]
};

/**
 * Classify source authority into multi-tier levels.
 *
 * @param {string} url - The source URL to classify
 * @returns {string} Authority tier: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNVERIFIED'
 *
 * @example
 * classifySourceAuthority('https://docs.react.dev/') // 'HIGH'
 * classifySourceAuthority('https://developer.mozilla.org/') // 'MEDIUM'
 * classifySourceAuthority('https://medium.com/article') // 'LOW'
 * classifySourceAuthority('https://random.com/page') // 'UNVERIFIED'
 */
export function classifySourceAuthority(url) {
  const urlLower = url.toLowerCase();

  // Iterate through tiers in priority order (HIGH → MEDIUM → LOW)
  for (const [tier, patterns] of Object.entries(AUTHORITY_RULES)) {
    // Test each pattern in the tier
    for (const pattern of patterns) {
      if (pattern.test(urlLower)) {
        return tier;
      }
    }
  }

  // No matches found
  return 'UNVERIFIED';
}

/**
 * Assign confidence level to research finding with enhanced metadata.
 *
 * Enhances basic authority classification with additional metadata signals:
 * - verifiedWithOfficial flag elevates confidence to HIGH
 * - Falls back to authority classification if no metadata present
 *
 * @param {Object} finding - Research finding object
 * @param {string} finding.source - Source URL
 * @param {boolean} [finding.verifiedWithOfficial] - Optional verification flag
 * @returns {string} Confidence level: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNVERIFIED'
 *
 * @example
 * assignConfidenceLevel({
 *   source: 'https://docs.react.dev/',
 *   content: 'React documentation'
 * }) // 'HIGH'
 *
 * assignConfidenceLevel({
 *   source: 'https://random.com/article',
 *   verifiedWithOfficial: true
 * }) // 'HIGH' (elevated by verification)
 *
 * assignConfidenceLevel({
 *   source: 'https://stackoverflow.com/questions/123'
 * }) // 'MEDIUM'
 */
export function assignConfidenceLevel(finding) {
  // Classify base authority from URL
  const authority = classifySourceAuthority(finding.source);

  // Check for verification metadata
  const isVerified = finding.verifiedWithOfficial === true;

  // Elevation rules:
  // - HIGH authority sources → HIGH confidence
  // - Verified sources → HIGH confidence (regardless of authority)
  // - MEDIUM/LOW authority → respective confidence
  // - UNVERIFIED authority → UNVERIFIED confidence

  if (authority === 'HIGH' || isVerified) {
    return 'HIGH';
  } else if (authority === 'MEDIUM') {
    return 'MEDIUM';
  } else if (authority === 'LOW') {
    return 'LOW';
  }

  return 'UNVERIFIED';
}
