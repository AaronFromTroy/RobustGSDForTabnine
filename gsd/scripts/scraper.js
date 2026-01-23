/**
 * scraper.js - Web scraping with progressive enhancement
 *
 * Implements Cheerio-first static parsing with Playwright fallback for dynamic content.
 * Includes exponential backoff retry logic with jitter for rate limiting.
 *
 * Exports:
 * - scrapeContent(url, options): Main scraping function with progressive enhancement
 * - scrapeWithFallback(url): Internal progressive enhancement implementation
 * - fetchWithRetry(url, maxRetries): HTTP client with exponential backoff
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';

/**
 * Scrape content from URL using progressive enhancement pattern
 *
 * @param {string} url - URL to scrape
 * @param {object} options - Scraping options
 * @param {number} options.timeout - Request timeout in ms (default: 10000)
 * @param {number} options.maxRetries - Max retry attempts (default: 3)
 * @param {string[]} options.selectors - Content selectors (default: ['main', 'article', '.content'])
 * @returns {Promise<object>} Scraping result: { method, content, title, url }
 */
export async function scrapeContent(url, options = {}) {
  const {
    timeout = 10000,
    maxRetries = 3,
    selectors = ['main', 'article', '.content']
  } = options;

  try {
    const result = await scrapeWithFallback(url, { timeout, selectors });
    return {
      ...result,
      url
    };
  } catch (error) {
    throw new Error(`Failed to scrape ${url}: ${error.message}`);
  }
}

/**
 * Progressive enhancement scraping: try Cheerio first, fallback to Playwright
 *
 * Pattern from 07-RESEARCH.md:
 * 1. Try static HTML parsing with Cheerio (fast, lightweight)
 * 2. Check content length > 100 to validate static content exists
 * 3. Fallback to Playwright for JavaScript-rendered content (comprehensive but slower)
 *
 * @param {string} url - URL to scrape
 * @param {object} options - Scraping options
 * @returns {Promise<object>} { method: 'static'|'dynamic', content, title }
 */
async function scrapeWithFallback(url, options = {}) {
  const { timeout = 10000, selectors = ['main', 'article', '.content'] } = options;
  const selectorString = selectors.join(', ');

  // PHASE 1: Try Cheerio first (static HTML parsing)
  try {
    const response = await axios.get(url, {
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Research Bot)'
      }
    });

    const $ = cheerio.load(response.data);
    const content = $(selectorString).text().trim();
    const title = $('title').text().trim();

    // Content validation: check length > 100 to detect JavaScript-rendered pages
    if (content.length > 100) {
      return {
        method: 'static',
        content,
        title
      };
    }

    // Content too short - likely JavaScript-rendered
    console.warn(`Static content too short for ${url} (${content.length} chars), falling back to Playwright`);
  } catch (error) {
    console.warn(`Static scraping failed for ${url}: ${error.message}, falling back to Playwright`);
  }

  // PHASE 2: Fallback to Playwright (dynamic content rendering)
  // CRITICAL: Use try-finally block for browser cleanup (Pitfall 1 from 07-RESEARCH.md)
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();

    // Set timeout and wait for network idle (JavaScript execution complete)
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout
    });

    // Extract content using same selectors
    const content = await page.textContent(selectorString) || '';
    const title = await page.title();

    return {
      method: 'dynamic',
      content: content.trim(),
      title
    };
  } finally {
    // ALWAYS close browser to prevent memory leaks (Pitfall 1)
    await browser.close();
  }
}

/**
 * Fetch URL with exponential backoff retry logic
 *
 * Pattern from 07-RESEARCH.md Pattern 3:
 * - Exponential backoff: 1s, 2s, 4s (Math.pow(2, attempt) * 1000)
 * - Jitter: random 0-1000ms to prevent retry storms (Pitfall 2)
 * - Respect Retry-After header if present (Pitfall 6)
 *
 * @param {string} url - URL to fetch
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @returns {Promise<object>} Axios response object
 */
export async function fetchWithRetry(url, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Research Bot)'
        }
      });

      return response;
    } catch (error) {
      const isRateLimited = error.response?.status === 429;
      const isLastAttempt = attempt === maxRetries - 1;

      if (isRateLimited && !isLastAttempt) {
        // Check for Retry-After header (Pitfall 6 from 07-RESEARCH.md)
        const retryAfterHeader = error.response?.headers['retry-after'];
        let delay;

        if (retryAfterHeader) {
          // Respect server's retry timing
          delay = parseInt(retryAfterHeader) * 1000;
        } else {
          // Exponential backoff: 1s, 2s, 4s
          const baseDelay = Math.pow(2, attempt) * 1000;

          // Jitter: random 0-1000ms to avoid retry storms (Pitfall 2)
          const jitter = Math.random() * 1000;

          delay = baseDelay + jitter;
        }

        console.warn(`Rate limited on ${url}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Other errors or last attempt - throw
      throw error;
    }
  }

  // Should never reach here, but TypeScript/ESLint wants explicit return
  throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
}

/**
 * Re-export scrapeWithFallback for testing and advanced usage
 */
export { scrapeWithFallback };

/**
 * INTEGRATION NOTES:
 *
 * This module replaces Phase 4's generateMockSearchResults() with real web scraping.
 *
 * Usage in researcher.js:
 *
 *   import { scrapeContent } from './scraper.js';
 *
 *   // Instead of mock data:
 *   const findings = await Promise.all(
 *     searchResults.map(async result => {
 *       const scraped = await scrapeContent(result.url);
 *       return {
 *         source: result.url,
 *         title: scraped.title,
 *         content: scraped.content,
 *         verifiedWithOfficial: scraped.method === 'static' && result.url.includes('docs.')
 *       };
 *     })
 *   );
 *
 * Anti-patterns avoided (from 07-RESEARCH.md):
 * - ✓ Puppeteer-first scraping (use Cheerio first per research)
 * - ✓ Missing try-finally for browser (Pitfall 1 - memory leaks)
 * - ✓ No jitter in retry delays (Pitfall 2 - retry storms)
 * - ✓ Synchronous HTTP (never use request() library)
 * - ✓ Ignoring Retry-After header (Pitfall 6)
 */
