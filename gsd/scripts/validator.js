/**
 * Artifact Validation Module
 * Provides two-layer validation: JSON Schema (metadata) + structure checking (required sections)
 *
 * Critical patterns:
 * - Layer 1: Validate YAML frontmatter against JSON Schema
 * - Layer 2: Check required markdown sections exist
 * - Accumulate all errors before throwing (don't fail on first error)
 * - Provide specific remediation for each error type
 */

import Ajv from 'ajv';
import frontmatter from 'front-matter';
import { readFile } from './file-ops.js';
import path from 'node:path';

const ajv = new Ajv();

/**
 * Artifact schemas define validation rules
 * Each artifact has:
 * - requiredSections: Array of markdown section headers that must exist
 * - metadataSchema: JSON Schema for YAML frontmatter
 */
const ARTIFACT_SCHEMAS = {
  'PROJECT.md': {
    requiredSections: ['What This Is', 'Core Value', 'Requirements', 'Context', 'Constraints'],
    metadataSchema: {
      type: 'object',
      properties: {
        version: { type: 'string' },
        created: { type: 'string' },
        core_value: { type: 'string', minLength: 10 }
      },
      additionalProperties: true
    }
  },
  'ROADMAP.md': {
    requiredSections: ['Overview', 'Phases', 'Progress', 'Dependencies'],
    metadataSchema: {
      type: 'object',
      properties: {
        version: { type: 'string' },
        created: { type: 'string' },
        depth: { type: 'string' }
      },
      additionalProperties: true
    }
  },
  'REQUIREMENTS.md': {
    requiredSections: ['v1 Requirements', 'Traceability'],
    metadataSchema: {
      type: 'object',
      properties: {
        version: { type: 'string' },
        created: { type: 'string' }
      },
      additionalProperties: true
    }
  }
};

/**
 * Escape regex special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for use in RegExp
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Estimate line number for missing section
 * @param {string} content - File content
 * @param {string} sectionName - Section name that's missing
 * @returns {number} Estimated line number
 */
function estimateLineNumber(content, sectionName) {
  const lines = content.split('\n');

  // Find first ## heading
  const h2Index = lines.findIndex(line => line.startsWith('## '));

  if (h2Index !== -1) {
    // Missing section likely near other ## headings
    return h2Index + 1;
  }

  // Default estimate: after frontmatter (around line 5)
  return 5;
}

/**
 * Validate artifact structure and metadata
 * Two-layer validation:
 * 1. JSON Schema validation of YAML frontmatter
 * 2. Structural validation of required markdown sections
 *
 * @param {string} projectRoot - Root directory of the project
 * @param {string} filePath - Path to artifact file (relative to project root)
 * @param {string} artifactType - Type of artifact (e.g., 'PROJECT.md', 'ROADMAP.md')
 * @returns {Promise<boolean>} True if validation passes
 * @throws {Error} If validation fails with detailed error message
 */
export async function validateArtifact(projectRoot, filePath, artifactType) {
  const schema = ARTIFACT_SCHEMAS[artifactType];

  if (!schema) {
    throw new Error(`Unknown artifact type: ${artifactType}. Valid types: ${Object.keys(ARTIFACT_SCHEMAS).join(', ')}`);
  }

  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(projectRoot, filePath);

  const content = await readFile(absolutePath);
  const errors = [];

  // Layer 1: Metadata validation (YAML frontmatter)
  try {
    const parsed = frontmatter(content);

    if (Object.keys(parsed.attributes).length > 0) {
      const valid = ajv.validate(schema.metadataSchema, parsed.attributes);

      if (!valid) {
        const errorMessages = ajv.errors.map(err => {
          const field = err.instancePath.replace(/^\//, '') || err.params.missingProperty || 'metadata';
          return `${field}: ${err.message}`;
        });
        errors.push(`Metadata validation failed: ${errorMessages.join(', ')}`);
      }
    }
  } catch (error) {
    // Frontmatter parsing failed or doesn't exist
    // This is often OK - not all artifacts require frontmatter
    // Only fail if schema requires specific metadata fields
  }

  // Layer 2: Required sections validation
  for (const section of schema.requiredSections) {
    const regex = new RegExp(`^## ${escapeRegex(section)}$`, 'm');

    if (!regex.test(content)) {
      const lineNumber = estimateLineNumber(content, section);
      errors.push(
        `Missing section: ${section} (expected around line ${lineNumber}). ` +
        `Fix: echo '## ${section}' >> ${filePath}`
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Validation failed for ${artifactType} at ${filePath}:\n` +
      errors.map((err, i) => `  ${i + 1}. ${err}`).join('\n')
    );
  }

  return true;
}

/**
 * Validate requirement coverage in roadmap
 * Ensures all requirements from REQUIREMENTS.md are mapped to phases in ROADMAP.md
 *
 * @param {string} projectRoot - Root directory of the project
 * @returns {Promise<Object>} Coverage object with total, traced, orphaned, percentage
 * @throws {Error} If orphaned requirements found
 */
export async function validateRequirementCoverage(projectRoot) {
  const requirementsPath = path.join(projectRoot, '.planning', 'REQUIREMENTS.md');
  const roadmapPath = path.join(projectRoot, '.planning', 'ROADMAP.md');

  const requirementsContent = await readFile(requirementsPath);
  const roadmapContent = await readFile(roadmapPath);

  // Extract requirement IDs from REQUIREMENTS.md
  // Matches patterns like: - [ ] **CORE-01**: Description
  const requirementRegex = /\*\*([A-Z]+-\d+)\*\*:/g;
  const requirementMatches = [...requirementsContent.matchAll(requirementRegex)];
  const requirementIds = requirementMatches.map(match => match[1]);

  // Extract requirement IDs from ROADMAP.md traceability section
  // Matches patterns like: | CORE-01 | Phase 1 | Complete |
  const traceabilityRegex = /\|\s*([A-Z]+-\d+)\s*\|/g;
  const traceabilityMatches = [...roadmapContent.matchAll(traceabilityRegex)];
  const tracedIds = traceabilityMatches.map(match => match[1]);

  // Find orphaned requirements (in REQUIREMENTS.md but not in ROADMAP.md)
  const orphanedRequirements = requirementIds.filter(id => !tracedIds.includes(id));

  const coverage = {
    total: requirementIds.length,
    traced: requirementIds.filter(id => tracedIds.includes(id)).length,
    orphaned: orphanedRequirements.length,
    percentage: requirementIds.length > 0
      ? Math.round((requirementIds.filter(id => tracedIds.includes(id)).length / requirementIds.length) * 100)
      : 100
  };

  if (orphanedRequirements.length > 0) {
    throw new Error(
      `Requirement coverage validation failed.\n\n` +
      `Orphaned requirements (not mapped to any phase):\n` +
      orphanedRequirements.map(id => `  - ${id}`).join('\n') + '\n\n' +
      `Fix: Add traceability entries in ROADMAP.md Traceability section.`
    );
  }

  return coverage;
}

/**
 * Validate STATE.md structure
 * @param {Object} stateData - State data to validate
 * @returns {Object} Validation result: { valid: boolean, errors: string[] }
 */
export function validateStateStructure(stateData) {
  const errors = [];

  // Check required fields exist
  const requiredFields = ['phase', 'plan', 'status', 'step'];
  const missingFields = requiredFields.filter(field => !(field in stateData));

  if (missingFields.length > 0) {
    errors.push(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Check phase is valid
  if ('phase' in stateData) {
    if (!Number.isInteger(stateData.phase) || stateData.phase < 1) {
      errors.push('Phase must be a positive integer');
    }
  }

  // Check status is valid
  if ('status' in stateData) {
    const validStatuses = ['pending', 'in_progress', 'completed', 'blocked'];
    if (!validStatuses.includes(stateData.status)) {
      errors.push(`Invalid status: ${stateData.status}. Must be one of: ${validStatuses.join(', ')}`);
    }
  }

  // Check plan is valid
  if ('plan' in stateData) {
    if (!Number.isInteger(stateData.plan) || stateData.plan < 0) {
      errors.push('Plan must be a non-negative integer');
    }
  }

  // Check step is non-empty string
  if ('step' in stateData) {
    if (typeof stateData.step !== 'string' || stateData.step.trim() === '') {
      errors.push('Step must be a non-empty string');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
