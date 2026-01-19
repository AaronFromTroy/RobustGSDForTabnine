/**
 * Research Synthesizer Module
 * Multi-source research synthesis with confidence scoring and document generation
 *
 * Critical patterns:
 * - Assigns confidence levels (HIGH/MEDIUM/LOW) based on source authority
 * - Generates structured research documents with source citations
 * - Uses template-renderer.js from Phase 2 for document generation
 * - All file operations async (Phase 2 convention)
 */

import { readFile, writeFileAtomic } from './file-ops.js';
import { renderTemplate } from './template-renderer.js';
import path from 'node:path';

/**
 * Assign confidence level to research finding based on source authority
 * Follows RESEARCH.md Pattern 4 decision tree
 *
 * @param {Object} finding - Finding with {content, source, title, verifiedWithOfficial?}
 * @returns {string} Confidence level: 'HIGH', 'MEDIUM', or 'LOW'
 */
export function assignConfidenceLevel(finding) {
  if (!finding || !finding.source) {
    return 'LOW';
  }

  const source = finding.source.toLowerCase();

  // HIGH: Official documentation, primary sources
  // Includes: docs.*, official, .dev domains, GitHub docs
  if (source.includes('docs.') ||
      source.includes('official') ||
      source.includes('.dev') ||
      (source.includes('github.com') && source.includes('/docs/'))) {
    return 'HIGH';
  }

  // MEDIUM: Verified sources, reputable platforms
  // Includes: MDN, Stack Overflow, verified findings
  if (source.includes('mdn.mozilla.org') ||
      source.includes('developer.mozilla.org') ||
      source.includes('stackoverflow.com') ||
      finding.verifiedWithOfficial === true) {
    return 'MEDIUM';
  }

  // LOW: Blog posts, single sources, unverified community content
  return 'LOW';
}

/**
 * Synthesize research findings into structured document
 * Enriches findings with confidence levels and renders using template
 *
 * @param {string} projectRoot - Root directory of the project
 * @param {string} topic - Research topic (e.g., "Technology Stack")
 * @param {Array<Object>} findings - Array of findings with {content, source, title}
 * @param {string} templateType - Template name (STACK, FEATURES, ARCHITECTURE, etc.)
 * @returns {Promise<string>} Generated markdown content
 * @throws {Error} If template not found or rendering fails
 */
export async function synthesizeResearch(projectRoot, topic, findings, templateType) {
  // Enrich findings with confidence levels
  const enrichedFindings = findings.map(f => ({
    ...f,
    confidence: assignConfidenceLevel(f)
  }));

  // Group findings by confidence level
  const highFindings = enrichedFindings.filter(f => f.confidence === 'HIGH');
  const mediumFindings = enrichedFindings.filter(f => f.confidence === 'MEDIUM');
  const lowFindings = enrichedFindings.filter(f => f.confidence === 'LOW');

  // Load template
  const templatePath = path.join(projectRoot, 'gsd', 'templates', `${templateType}.md`);
  let templateContent;
  try {
    templateContent = await readFile(templatePath);
  } catch (error) {
    throw new Error(`Template ${templateType}.md not found: ${error.message}`);
  }

  // Prepare rendering context
  const context = {
    topic,
    timestamp: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    highCount: highFindings.length,
    mediumCount: mediumFindings.length,
    lowCount: lowFindings.length,
    highFindings,
    mediumFindings,
    lowFindings,
    totalSources: findings.length,
    sourceList: findings.map(f => `- [${f.title || 'Source'}](${f.source})`).join('\n'),
    // Additional fields for specific templates
    summary: 'Research findings synthesized from multiple sources.',
    recommendedStack: 'Based on high-confidence findings above.'
  };

  // Render using Phase 2 template-renderer.js
  // Note: renderTemplate expects (templateName, variables, templatesDir)
  // We need to extract just the template name and provide the templates directory
  const templatesDir = path.join(projectRoot, 'gsd', 'templates');

  try {
    const rendered = await renderTemplate(templateType, context, templatesDir);
    return rendered;
  } catch (error) {
    throw new Error(`Template rendering failed for ${templateType}: ${error.message}`);
  }
}

/**
 * Generate STACK.md from technology research findings
 *
 * @param {string} projectRoot - Root directory of the project
 * @param {Array<Object>} stackFindings - Array of technology findings
 * @returns {Promise<string>} Path to generated file (.planning/STACK.md)
 */
export async function generateStackDocument(projectRoot, stackFindings) {
  const content = await synthesizeResearch(
    projectRoot,
    'Technology Stack',
    stackFindings,
    'STACK'
  );

  const outputPath = path.join(projectRoot, '.planning', 'STACK.md');
  await writeFileAtomic(outputPath, content);

  return outputPath;
}

/**
 * Generate FEATURES.md from feature requirements research
 *
 * @param {string} projectRoot - Root directory of the project
 * @param {Array<Object>} featureFindings - Array of feature findings
 * @returns {Promise<string>} Path to generated file (.planning/FEATURES.md)
 */
export async function generateFeaturesDocument(projectRoot, featureFindings) {
  const content = await synthesizeResearch(
    projectRoot,
    'Feature Requirements',
    featureFindings,
    'FEATURES'
  );

  const outputPath = path.join(projectRoot, '.planning', 'FEATURES.md');
  await writeFileAtomic(outputPath, content);

  return outputPath;
}

/**
 * Generate ARCHITECTURE.md from architecture patterns research
 *
 * @param {string} projectRoot - Root directory of the project
 * @param {Array<Object>} architectureFindings - Array of architecture findings
 * @returns {Promise<string>} Path to generated file (.planning/ARCHITECTURE.md)
 */
export async function generateArchitectureDocument(projectRoot, architectureFindings) {
  const content = await synthesizeResearch(
    projectRoot,
    'Architecture Patterns',
    architectureFindings,
    'ARCHITECTURE'
  );

  const outputPath = path.join(projectRoot, '.planning', 'ARCHITECTURE.md');
  await writeFileAtomic(outputPath, content);

  return outputPath;
}

/**
 * Generate PITFALLS.md from common pitfalls research
 *
 * @param {string} projectRoot - Root directory of the project
 * @param {Array<Object>} pitfallFindings - Array of pitfall findings
 * @returns {Promise<string>} Path to generated file (.planning/PITFALLS.md)
 */
export async function generatePitfallsDocument(projectRoot, pitfallFindings) {
  const content = await synthesizeResearch(
    projectRoot,
    'Common Pitfalls',
    pitfallFindings,
    'PITFALLS'
  );

  const outputPath = path.join(projectRoot, '.planning', 'PITFALLS.md');
  await writeFileAtomic(outputPath, content);

  return outputPath;
}

/**
 * Generate RESEARCH-SUMMARY.md from all research findings
 * Aggregates findings from all research types (stack, features, architecture, pitfalls)
 *
 * @param {string} projectRoot - Root directory of the project
 * @param {Object} allFindings - Object with {stack, features, architecture, pitfalls} arrays
 * @returns {Promise<string>} Path to generated file (.planning/RESEARCH-SUMMARY.md)
 */
export async function generateSummaryDocument(projectRoot, allFindings) {
  // Aggregate all findings from different research types
  const aggregatedFindings = [
    ...(allFindings.stack || []),
    ...(allFindings.features || []),
    ...(allFindings.architecture || []),
    ...(allFindings.pitfalls || [])
  ];

  const content = await synthesizeResearch(
    projectRoot,
    'Research Summary',
    aggregatedFindings,
    'SUMMARY'
  );

  const outputPath = path.join(projectRoot, '.planning', 'RESEARCH-SUMMARY.md');
  await writeFileAtomic(outputPath, content);

  return outputPath;
}
