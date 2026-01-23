/**
 * Basic Usage Example for GSD for Tabnine
 *
 * Demonstrates core library functions:
 * - State management (read/write STATE.md)
 * - Template rendering
 * - Guideline loading
 */

import { readState, writeState, renderTemplate, loadGuideline } from 'gsd-for-tabnine';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function demo() {
  console.log('🚀 GSD for Tabnine - Basic Usage Demo\n');

  // Example 1: Read state (if exists)
  console.log('📖 Example 1: Reading project state');
  try {
    const state = await readState();
    console.log(`Current phase: ${state.currentPhase}`);
    console.log(`Status: ${state.status}\n`);
  } catch (err) {
    console.log('No STATE.md found (expected for new projects)\n');
  }

  // Example 2: Render a template
  console.log('📝 Example 2: Rendering PROJECT.md template');
  const templatePath = join(__dirname, '../../gsd/templates/PROJECT.md');
  const projectData = {
    projectName: 'My Demo Project',
    coreValue: 'Demonstrate GSD library usage',
    createdDate: new Date().toISOString().split('T')[0]
  };

  const rendered = await renderTemplate(templatePath, projectData);
  console.log('Template rendered successfully');
  console.log(`Output length: ${rendered.length} characters\n`);

  // Example 3: Load a guideline
  console.log('📋 Example 3: Loading new-project guideline');
  const guideline = await loadGuideline('new-project');
  console.log(`Guideline: ${guideline.metadata.title}`);
  console.log(`Version: ${guideline.metadata.version}`);
  console.log(`Content: ${guideline.content.substring(0, 100)}...\n`);

  console.log('✅ Demo complete! Check the code in demo-project.js to see usage patterns.');
}

demo().catch(err => {
  console.error('❌ Demo failed:', err.message);
  process.exit(1);
});
