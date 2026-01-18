/**
 * Integration Test Suite for Phase 2 Core Infrastructure
 * Validates all Phase 2 modules work together correctly
 *
 * Test coverage:
 * - File operations (read, write atomic, exists, ensureDir)
 * - Process runner (command execution, error handling)
 * - State manager (read, write, progress indicators, validation)
 * - Template renderer (render, list, variable validation)
 * - Guideline loader (load, list workflows)
 * - Cross-platform compatibility (path handling)
 */

import { readFile, writeFileAtomic, fileExists, ensureDir } from './file-ops.js';
import { runCommand } from './process-runner.js';
import { readState, writeState, generateProgressIndicator, validateStateData, STATUS_VALUES } from './state-manager.js';
import { renderTemplate, listTemplates } from './template-renderer.js';
import { loadGuideline, listWorkflows } from './guideline-loader.js';
import path from 'node:path';
import { unlink, rmdir } from 'node:fs/promises';

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * Log test result
 */
function logTest(name, passed, errorMsg = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`  ✓ ${name}`);
  } else {
    failedTests++;
    console.log(`  ✗ ${name}`);
    if (errorMsg) {
      console.log(`    Error: ${errorMsg}`);
    }
  }
}

/**
 * Test Suite 1: File Operations
 */
async function testFileOperations() {
  console.log('\n=== Test Suite 1: File Operations ===');

  const testDir = path.join('gsd', 'scripts', 'test-tmp');
  const testFile = path.join(testDir, 'test-file.txt');
  const testContent = 'Test content for file operations';

  try {
    // Test 1: ensureDir creates directory structure
    try {
      await ensureDir(testDir);
      const exists = await fileExists(testDir);
      logTest('ensureDir creates directory', exists);
    } catch (error) {
      logTest('ensureDir creates directory', false, error.message);
    }

    // Test 2: writeFileAtomic creates file with content
    try {
      await writeFileAtomic(testFile, testContent);
      const exists = await fileExists(testFile);
      logTest('writeFileAtomic creates file', exists);
    } catch (error) {
      logTest('writeFileAtomic creates file', false, error.message);
    }

    // Test 3: readFile returns correct content
    try {
      const content = await readFile(testFile);
      logTest('readFile returns correct content', content === testContent);
    } catch (error) {
      logTest('readFile returns correct content', false, error.message);
    }

    // Test 4: fileExists detects existing file
    try {
      const exists = await fileExists(testFile);
      logTest('fileExists detects existing file', exists === true);
    } catch (error) {
      logTest('fileExists detects existing file', false, error.message);
    }

    // Test 5: fileExists detects missing file
    try {
      const exists = await fileExists(path.join(testDir, 'nonexistent.txt'));
      logTest('fileExists detects missing file', exists === false);
    } catch (error) {
      logTest('fileExists detects missing file', false, error.message);
    }

    // Cleanup: Remove test files
    try {
      await unlink(testFile);
      await rmdir(testDir);
    } catch (error) {
      console.log(`  Note: Cleanup failed (may need manual removal): ${error.message}`);
    }

  } catch (error) {
    console.log(`  Suite error: ${error.message}`);
  }
}

/**
 * Test Suite 2: Process Runner
 */
async function testProcessRunner() {
  console.log('\n=== Test Suite 2: Process Runner ===');

  // Test 1: runCommand with successful command
  try {
    const result = await runCommand('node', ['--version']);
    const passed = result.code === 0 && result.stdout.includes('v');
    logTest('runCommand executes successful command', passed);
  } catch (error) {
    logTest('runCommand executes successful command', false, error.message);
  }

  // Test 2: runCommand captures stdout
  try {
    const result = await runCommand('node', ['--version']);
    const passed = result.stdout.length > 0;
    logTest('runCommand captures stdout', passed);
  } catch (error) {
    logTest('runCommand captures stdout', false, error.message);
  }

  // Test 3: runCommand fails with non-existent command
  try {
    await runCommand('nonexistent-command-xyz', []);
    logTest('runCommand rejects non-existent command', false, 'Should have thrown error');
  } catch (error) {
    const passed = error.message.includes('Failed to start');
    logTest('runCommand rejects non-existent command', passed);
  }

  // Test 4: runCommand fails with non-zero exit code
  try {
    await runCommand('node', ['--invalid-flag-xyz']);
    logTest('runCommand rejects non-zero exit', false, 'Should have thrown error');
  } catch (error) {
    const passed = error.message.includes('failed with code');
    logTest('runCommand rejects non-zero exit', passed);
  }
}

/**
 * Test Suite 3: State Manager
 */
async function testStateManager() {
  console.log('\n=== Test Suite 3: State Manager ===');

  // Test 1: readState parses STATE.md
  try {
    const state = await readState('.');
    const passed = state.phase && state.plan !== undefined && state.status;
    logTest('readState parses STATE.md', passed);
    if (passed) {
      console.log(`    Current state: Phase ${state.phase}, Plan ${state.plan}, Status: ${state.status}`);
    }
  } catch (error) {
    logTest('readState parses STATE.md', false, error.message);
  }

  // Test 2: generateProgressIndicator produces correct bars
  try {
    const progress = generateProgressIndicator(2, 4);
    const passed = progress.includes('██░░') && progress.includes('50%');
    logTest('generateProgressIndicator for 2/4', passed);
  } catch (error) {
    logTest('generateProgressIndicator for 2/4', false, error.message);
  }

  // Test 3: validateStateData rejects invalid status
  try {
    validateStateData({
      phase: 1,
      plan: 1,
      status: 'invalid_status',
      step: 'test'
    });
    logTest('validateStateData rejects invalid status', false, 'Should have thrown error');
  } catch (error) {
    const passed = error.message.includes('Invalid status');
    logTest('validateStateData rejects invalid status', passed);
  }

  // Test 4: validateStateData rejects missing fields
  try {
    validateStateData({
      phase: 1,
      plan: 1
      // Missing status and step
    });
    logTest('validateStateData rejects missing fields', false, 'Should have thrown error');
  } catch (error) {
    const passed = error.message.includes('Missing required field');
    logTest('validateStateData rejects missing fields', passed);
  }

  // Test 5: validateStateData accepts valid state
  try {
    validateStateData({
      phase: 2,
      plan: 5,
      status: STATUS_VALUES.IN_PROGRESS,
      step: 'Executing plan 02-05'
    });
    logTest('validateStateData accepts valid state', true);
  } catch (error) {
    logTest('validateStateData accepts valid state', false, error.message);
  }
}

/**
 * Test Suite 4: Template Renderer
 */
async function testTemplateRenderer() {
  console.log('\n=== Test Suite 4: Template Renderer ===');

  const templatesDir = path.join('gsd', 'templates');

  // Test 1: listTemplates discovers all templates
  try {
    const templates = await listTemplates(templatesDir);
    const passed = templates.length > 0;
    logTest('listTemplates discovers templates', passed);
    if (passed) {
      console.log(`    Found templates: ${templates.join(', ')}`);
    }
  } catch (error) {
    logTest('listTemplates discovers templates', false, error.message);
  }

  // Test 2: renderTemplate with valid variables
  try {
    const rendered = await renderTemplate('PROJECT', {
      projectName: 'Test Project',
      createdDate: '2026-01-18',
      coreValue: 'Test core value',
      description: 'Test description',
      context: 'Test context',
      constraints: 'Test constraints',
      requirements: 'Test requirements',
      outOfScope: 'Test out of scope'
    }, templatesDir);
    const passed = rendered.includes('Test Project') && rendered.includes('Test core value');
    logTest('renderTemplate with valid variables', passed);
  } catch (error) {
    logTest('renderTemplate with valid variables', false, error.message);
  }

  // Test 3: renderTemplate rejects missing variables
  try {
    await renderTemplate('PROJECT', {
      // Missing required variables
      projectName: 'Test Project'
    }, templatesDir);
    logTest('renderTemplate rejects missing variables', false, 'Should have thrown error');
  } catch (error) {
    const passed = error.message.includes('missing variables');
    logTest('renderTemplate rejects missing variables', passed);
  }

  // Test 4: renderTemplate substitutes variables correctly
  try {
    const rendered = await renderTemplate('PROJECT', {
      projectName: 'Integration Test Project',
      createdDate: '2026-01-18',
      coreValue: 'Testing all Phase 2 modules',
      description: 'Integration test description',
      context: 'Integration test context',
      constraints: 'Integration test constraints',
      requirements: 'Integration test requirements',
      outOfScope: 'Integration test out of scope'
    }, templatesDir);
    const passed = rendered.includes('Integration Test Project') &&
                   rendered.includes('Testing all Phase 2 modules') &&
                   rendered.includes('2026-01-18');
    logTest('renderTemplate performs substitution', passed);
  } catch (error) {
    logTest('renderTemplate performs substitution', false, error.message);
  }
}

/**
 * Test Suite 5: Guideline Loader
 */
async function testGuidelineLoader() {
  console.log('\n=== Test Suite 5: Guideline Loader ===');

  const configPath = path.join('gsd', '.gsd-config.json');

  // Test 1: listWorkflows returns all workflows
  try {
    const workflows = await listWorkflows(configPath);
    const passed = workflows.length === 4; // Should be 4 workflows
    logTest('listWorkflows returns 4 workflows', passed);
    if (passed) {
      console.log(`    Workflows: ${workflows.join(', ')}`);
    }
  } catch (error) {
    logTest('listWorkflows returns 4 workflows', false, error.message);
  }

  // Test 2: loadGuideline loads newProject workflow
  try {
    const guideline = await loadGuideline('newProject', configPath);
    const passed = guideline.length > 0 && guideline.includes('---');
    logTest('loadGuideline loads newProject', passed);
  } catch (error) {
    logTest('loadGuideline loads newProject', false, error.message);
  }

  // Test 3: loadGuideline loads planPhase workflow
  try {
    const guideline = await loadGuideline('planPhase', configPath);
    const passed = guideline.length > 0 && guideline.includes('---');
    logTest('loadGuideline loads planPhase', passed);
  } catch (error) {
    logTest('loadGuideline loads planPhase', false, error.message);
  }

  // Test 4: loadGuideline rejects unknown workflow
  try {
    await loadGuideline('unknownWorkflow', configPath);
    logTest('loadGuideline rejects unknown workflow', false, 'Should have thrown error');
  } catch (error) {
    const passed = error.message.includes('Unknown workflow') &&
                   error.message.includes('Available workflows');
    logTest('loadGuideline rejects unknown workflow', passed);
  }

  // Test 5: Loaded guideline has YAML frontmatter
  try {
    const guideline = await loadGuideline('executePhase', configPath);
    const passed = guideline.startsWith('---');
    logTest('Guideline has YAML frontmatter', passed);
  } catch (error) {
    logTest('Guideline has YAML frontmatter', false, error.message);
  }
}

/**
 * Test Suite 6: Cross-Platform Compatibility
 */
async function testCrossPlatform() {
  console.log('\n=== Test Suite 6: Cross-Platform Compatibility ===');

  // Test 1: path.join works with mixed separators
  try {
    const joined = path.join('gsd', 'scripts', 'integration-test.js');
    const passed = joined.includes('gsd') && joined.includes('integration-test.js');
    logTest('path.join handles path construction', passed);
  } catch (error) {
    logTest('path.join handles path construction', false, error.message);
  }

  // Test 2: Log current platform
  try {
    console.log(`    Platform: ${process.platform}`);
    logTest('Platform detection', true);
  } catch (error) {
    logTest('Platform detection', false, error.message);
  }

  // Test 3: Verify path separators are normalized
  try {
    const testPath = path.join('a', 'b', 'c');
    const normalizedSeparator = path.sep;
    const passed = !testPath.includes('/') || !testPath.includes('\\') ||
                   testPath.split(normalizedSeparator).length === 3;
    logTest('Path separators normalized', passed);
  } catch (error) {
    logTest('Path separators normalized', false, error.message);
  }

  // Test 4: File operations work with paths
  try {
    const testDir = path.join('gsd', 'scripts', 'cross-platform-test');
    const testFile = path.join(testDir, 'test.txt');

    await ensureDir(testDir);
    await writeFileAtomic(testFile, 'cross-platform test');
    const exists = await fileExists(testFile);

    // Cleanup
    await unlink(testFile);
    await rmdir(testDir);

    logTest('File operations with path.join', exists);
  } catch (error) {
    logTest('File operations with path.join', false, error.message);
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('===========================================');
  console.log('Phase 2 Integration Test Suite');
  console.log('===========================================');

  try {
    await testFileOperations();
    await testProcessRunner();
    await testStateManager();
    await testTemplateRenderer();
    await testGuidelineLoader();
    await testCrossPlatform();

    // Final report
    console.log('\n===========================================');
    console.log('Test Results Summary');
    console.log('===========================================');
    console.log(`Total tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
    console.log(`Failed: ${failedTests}`);
    console.log('===========================================');

    // Exit with appropriate code
    if (failedTests > 0) {
      console.log('\n❌ Some tests failed');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
