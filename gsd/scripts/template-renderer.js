/**
 * Template rendering module
 * Provides template loading, variable validation, and rendering with template literals
 *
 * Critical patterns:
 * - Parses YAML frontmatter with front-matter library
 * - Validates all required variables before rendering
 * - Uses Function constructor for safe template literal evaluation
 * - Supports ${variable} syntax and expressions
 */

import fm from 'front-matter';
import { readFile } from './file-ops.js';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * Render a template with variable substitution
 *
 * @param {string} templateName - Template name (without .md extension)
 * @param {Object} variables - Key-value pairs for template variables
 * @param {string} templatesDir - Path to templates directory
 * @returns {Promise<string>} Rendered template content
 * @throws {Error} If template not found or required variables missing
 */
export async function renderTemplate(templateName, variables, templatesDir) {
  // Construct template path
  const templatePath = path.join(templatesDir, `${templateName}.md`);

  // Load template file
  let templateContent;
  try {
    templateContent = await readFile(templatePath);
  } catch (error) {
    throw new Error(`Template not found: ${templateName} (path: ${templatePath})`);
  }

  // Parse YAML frontmatter
  const { attributes, body } = fm(templateContent);

  // Extract required variables from frontmatter
  const requiredVars = attributes.variables || [];

  // Validate all required variables are provided
  const missing = requiredVars.filter(v => !(v in variables));
  if (missing.length > 0) {
    throw new Error(
      `Template ${templateName} requires missing variables: ${missing.join(', ')}`
    );
  }

  // Render using template literals via Function constructor
  // This evaluates ${varName} placeholders in template body
  // Safe because templates are controlled (from gsd/templates/), not user-provided
  const varNames = Object.keys(variables);
  const varValues = Object.values(variables);

  try {
    // Create function that returns evaluated template literal
    const renderFn = new Function(...varNames, `return \`${body}\`;`);
    const rendered = renderFn(...varValues);
    return rendered;
  } catch (error) {
    throw new Error(`Template rendering failed for ${templateName}: ${error.message}`);
  }
}

/**
 * List available templates in directory
 *
 * @param {string} templatesDir - Path to templates directory
 * @returns {Promise<string[]>} Array of template names (without .md extension)
 * @throws {Error} If directory cannot be read
 */
export async function listTemplates(templatesDir) {
  try {
    const files = await readdir(templatesDir);
    // Filter for .md files and remove extension
    const templates = files
      .filter(file => file.endsWith('.md'))
      .map(file => file.slice(0, -3)); // Remove .md extension
    return templates;
  } catch (error) {
    throw new Error(`Failed to list templates in ${templatesDir}: ${error.message}`);
  }
}
