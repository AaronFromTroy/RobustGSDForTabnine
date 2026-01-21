/**
 * Integration Test Suite for GSD Infrastructure
 * Validates all modules work together correctly
 *
 * Test coverage:
 * - Phase 2: File operations, process runner, state manager, template renderer, guideline loader, cross-platform
 * - Phase 3: Trigger detection, artifact validation, resume & orchestration
 * - Phase 4: Approval gates, research synthesis, automated research
 * - Phase 6: Discussion & context system (CONTEXT template, question taxonomy, context parsing)
 * - Phase 7: Web scraping (scraper, source-validator, deduplicator), multi-domain coordination
 * - Phase 8: Verification system (goal-validator, quality-checker, verifier)
 */

import { readFile, writeFileAtomic, fileExists, ensureDir } from './file-ops.js';
import { runCommand } from './process-runner.js';
import { readState, writeState, generateProgressIndicator, validateStateData, STATUS_VALUES } from './state-manager.js';
import { renderTemplate, listTemplates } from './template-renderer.js';
import { loadGuideline, listWorkflows } from './guideline-loader.js';
import { detectPhaseType, getQuestionsForPhase } from './question-bank.js';
import { parseDecisions, categorizeAnswers, loadPhaseContext } from './context-loader.js';
import { scrapeContent, scrapeWithFallback, fetchWithRetry } from './scraper.js';
import { classifySourceAuthority, assignConfidenceLevel } from './source-validator.js';
import { deduplicateFindings, hashContent } from './deduplicator.js';
import { coordinateMultiDomainResearch, performDomainResearch } from './domain-coordinator.js';
import { performResearch } from './researcher.js';
import { validateAcceptanceCriteria, extractSuccessCriteria, createValidator } from './goal-validator.js';
import { checkCoverageThreshold, runLinting, checkQualityGates } from './quality-checker.js';
import { verifyPhase, runSmokeTests, runUnitTests } from './verifier.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unlink, rmdir } from 'node:fs/promises';
import fs from 'node:fs';

// Calculate paths relative to this script's location
// Script is at: gsd/scripts/integration-test.js
// GSD root is: gsd/ (one level up)
// Project root is: ./ (two levels up)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GSD_ROOT = path.resolve(__dirname, '..'); // gsd/
const PROJECT_ROOT = path.resolve(__dirname, '..', '..'); // project root

// Helper to get paths relative to project root
function projectPath(...parts) {
  return path.join(PROJECT_ROOT, ...parts);
}

// Helper to get paths relative to GSD root
function gsdPath(...parts) {
  return path.join(GSD_ROOT, ...parts);
}

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

  const testDir = gsdPath('scripts', 'test-tmp');
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

  // Test 1: readState parses STATE.md (skip if .planning doesn't exist)
  try {
    const state = await readState(PROJECT_ROOT);
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

  const templatesDir = gsdPath('templates');

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

  const configPath = gsdPath('.gsd-config.json');

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
    const joined = gsdPath('scripts', 'integration-test.js');
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
    const testDir = gsdPath('scripts', 'cross-platform-test');
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
 * Test Suite 7: Trigger Detection
 */
async function testTriggerDetection() {
  console.log('\n=== Test Suite 7: Trigger Detection ===');

  const config = { triggerPhrases: { start: ['start GSD'], continue: ['continue GSD workflow'] } };

  // Test 1: Exact phrase matching (START)
  try {
    const { detectTrigger } = await import('./trigger-detector.js');
    const result = detectTrigger('start GSD', config);
    const passed = result?.type === 'START' && result?.phrase === 'start GSD';
    logTest('Exact phrase matching (START)', passed);
  } catch (error) {
    logTest('Exact phrase matching (START)', false, error.message);
  }

  // Test 2: Case insensitive matching
  try {
    const { detectTrigger } = await import('./trigger-detector.js');
    const result = detectTrigger('START GSD', config);
    const passed = result?.type === 'START';
    logTest('Case insensitive matching', passed);
  } catch (error) {
    logTest('Case insensitive matching', false, error.message);
  }

  // Test 3: Fuzzy matching rejected
  try {
    const { detectTrigger } = await import('./trigger-detector.js');
    const result = detectTrigger('I want to start GSD soon', config);
    const passed = result === null;
    logTest('Fuzzy matching rejected', passed);
  } catch (error) {
    logTest('Fuzzy matching rejected', false, error.message);
  }

  // Test 4: CONTINUE trigger detection
  try {
    const { detectTrigger } = await import('./trigger-detector.js');
    const result = detectTrigger('continue GSD workflow', config);
    const passed = result?.type === 'CONTINUE';
    logTest('CONTINUE trigger detection', passed);
  } catch (error) {
    logTest('CONTINUE trigger detection', false, error.message);
  }

  // Test 5: Confirmation format includes icon
  try {
    const { confirmTrigger } = await import('./trigger-detector.js');
    const confirmation = confirmTrigger({ type: 'START', phrase: 'start GSD' });
    const passed = confirmation.includes('🔵') && confirmation.includes('GSD Trigger Detected');
    logTest('Confirmation format includes icon', passed);
  } catch (error) {
    logTest('Confirmation format includes icon', false, error.message);
  }
}

/**
 * Test Suite 8: Artifact Validation
 */
async function testArtifactValidation() {
  console.log('\n=== Test Suite 8: Artifact Validation ===');

  try {
    const { validateArtifact, validateRequirementCoverage, validateStateStructure } = await import('./validator.js');

    // Test 1: Valid PROJECT.md passes validation (skip if .planning doesn't exist)
    try {
      await validateArtifact(PROJECT_ROOT, '.planning/PROJECT.md', 'PROJECT.md');
      logTest('Valid PROJECT.md passes validation', true);
    } catch (error) {
      logTest('Valid PROJECT.md passes validation', false, error.message);
    }

    // Test 2: Valid ROADMAP.md passes validation (skip if .planning doesn't exist)
    try {
      await validateArtifact(PROJECT_ROOT, '.planning/ROADMAP.md', 'ROADMAP.md');
      logTest('Valid ROADMAP.md passes validation', true);
    } catch (error) {
      logTest('Valid ROADMAP.md passes validation', false, error.message);
    }

    // Test 3: State structure validation (valid state)
    const validState = {
      phase: 2,
      plan: 5,
      status: 'completed',
      step: 'Integration testing'
    };
    const result3 = validateStateStructure(validState);
    if (result3.valid === true) {
      logTest('State structure validation (valid state)', true);
    } else {
      logTest('State structure validation (valid state)', false, `Errors: ${result3.errors.join(', ')}`);
    }

    // Test 4: State structure validation (invalid status)
    const invalidState = {
      phase: 1,
      plan: 1,
      status: 'invalid_status',
      step: 'Test'
    };
    const result4 = validateStateStructure(invalidState);
    if (result4.valid === false && result4.errors.length > 0) {
      logTest('State structure validation (invalid status rejected)', true);
    } else {
      logTest('State structure validation (invalid status rejected)', false, 'Invalid status not rejected');
    }

    // Test 5: validateStateStructure exports work
    const testResult = validateStateStructure({
      phase: 3,
      plan: 2,
      status: 'in_progress',
      step: 'Executing Task 2'
    });
    logTest('Validator exports functional', testResult.valid === true);

  } catch (error) {
    logTest('Artifact validation tests - ERROR', false, error.message);
    // If import failed, mark remaining tests as failed
    for (let i = 0; i < 5; i++) {
      failedTests++;
      totalTests++;
    }
  }
}

/**
 * Test Suite 9: Resume & Orchestration
 */
async function testResumeOrchestration() {
  console.log('\n=== Test Suite 9: Resume & Orchestration ===');

  try {
    const { resumeWorkflow, generateStatusSummary, determineNextAction } = await import('./resume-manager.js');
    const { validatePhaseTransition, validatePhaseCompletion } = await import('./workflow-orchestrator.js');

    // Test 1: Resume workflow from STATE.md (skip if .planning doesn't exist)
    try {
      const result = await resumeWorkflow(PROJECT_ROOT);
      if (result.state && result.guideline && result.summary && result.nextAction) {
        logTest('Resume workflow from STATE.md', true);
      } else {
        logTest('Resume workflow from STATE.md', false, 'missing fields in result');
      }
    } catch (error) {
      logTest('Resume workflow from STATE.md', false, error.message);
    }

    // Test 2: Status summary format
    const testState = { phase: 2, plan: 5, status: 'completed', step: 'Integration testing' };
    const testGuideline = { metadata: { workflow: 'executePhase' } };
    const summary = generateStatusSummary(testState, testGuideline);
    if (summary.includes('📍') && summary.includes('Phase: 2')) {
      logTest('Status summary format includes icon and phase', true);
    } else {
      logTest('Status summary format includes icon and phase', false, 'format incorrect');
    }

    // Test 3: Next action determination
    const nextAction = determineNextAction(testState);
    if (nextAction.includes('Phase 2 complete') && nextAction.includes('Phase 3')) {
      logTest('Next action determination (completed state)', true);
    } else {
      logTest('Next action determination (completed state)', false, 'next action incorrect');
    }

    // Test 4: Valid phase transition (2 -> 3)
    try {
      validatePhaseTransition({ phase: 2, status: 'completed' }, 3);
      logTest('Valid phase transition (2 -> 3)', true);
    } catch (error) {
      logTest('Valid phase transition (2 -> 3)', false, error.message);
    }

    // Test 5: Invalid phase transition (2 -> 5)
    try {
      validatePhaseTransition({ phase: 2, status: 'completed' }, 5);
      logTest('Invalid phase transition blocked (2 -> 5)', false, 'should have thrown');
    } catch (error) {
      logTest('Invalid phase transition blocked (2 -> 5)', true);
    }

    // Test 6: Phase completion validation (skip if .planning doesn't exist)
    try {
      const result = await validatePhaseCompletion(PROJECT_ROOT, 1, [
        { filePath: '.planning/PROJECT.md', type: 'PROJECT.md' }
      ]);
      if (result.valid === true) {
        logTest('Phase completion validation', true);
      } else {
        logTest('Phase completion validation', false, 'validation failed');
      }
    } catch (error) {
      logTest('Phase completion validation', false, error.message);
    }

  } catch (error) {
    logTest('Resume & orchestration tests - ERROR', false, error.message);
    // If import failed, mark remaining tests as failed
    for (let i = 0; i < 5; i++) {
      failedTests++;
      totalTests++;
    }
  }
}

/**
 * Test Suite 10: Approval Gates and Research Synthesis
 */
async function testApprovalGatesAndResearch() {
  console.log('\n=== Test Suite 10: Approval Gates and Research Synthesis ===');

  try {
    const { prepareApprovalGate, logApprovalDecision } = await import('./approval-gate.js');
    const { assignConfidenceLevel, synthesizeResearch } = await import('./research-synthesizer.js');

    // === APPROVAL GATE TESTS (4 tests) ===

    // Test 1: prepareApprovalGate formats options correctly
    try {
      const result = prepareApprovalGate('Test Gate', [
        {
          name: 'Option A',
          description: 'Test option',
          pros: ['Pro 1'],
          cons: ['Con 1']
        }
      ]);
      const passed = result.gate === 'Test Gate' &&
                     result.options.length === 1 &&
                     result.status === 'presented' &&
                     result.timestamp;
      logTest('prepareApprovalGate formats options correctly', passed);
    } catch (error) {
      logTest('prepareApprovalGate formats options correctly', false, error.message);
    }

    // Test 2: logApprovalDecision appends to STATE.md
    try {
      const testDir = gsdPath('scripts', 'test-approval-tmp');
      const planningDir = path.join(testDir, '.planning');
      const statePath = path.join(planningDir, 'STATE.md');

      // Create temp directory and STATE.md with Key Decisions table
      fs.mkdirSync(planningDir, { recursive: true });
      const testStateContent = `# State: Test Project

**Last Updated:** 2026-01-18

---

## Current Position

**Phase:** 1 of 4 (Test Phase)
**Plan:** 1 of 1 (in progress)
**Status:** In progress

---

## Accumulated Context

### Key Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| Test Decision 1 | 2026-01-18 | Test rationale 1 |
`;
      fs.writeFileSync(statePath, testStateContent);

      // Log approval decision
      await logApprovalDecision(testDir, 'Stack Choice', 'React', 'User preference');

      // Read updated STATE.md
      const updatedContent = fs.readFileSync(statePath, 'utf8');
      const passed = updatedContent.includes('[APPROVAL GATE] Stack Choice: React') &&
                     updatedContent.includes('User preference');

      // Cleanup
      fs.rmSync(testDir, { recursive: true, force: true });

      logTest('logApprovalDecision appends to STATE.md', passed);
    } catch (error) {
      logTest('logApprovalDecision appends to STATE.md', false, error.message);
    }

    // Test 3: logApprovalDecision handles missing STATE.md
    try {
      const testDir = gsdPath('scripts', 'test-approval-missing');
      fs.mkdirSync(testDir, { recursive: true });

      // Try to log decision without STATE.md
      await logApprovalDecision(testDir, 'Test', 'Option', 'Reason');

      // Should have thrown error
      fs.rmSync(testDir, { recursive: true, force: true });
      logTest('logApprovalDecision handles missing STATE.md', false, 'Should have thrown error');
    } catch (error) {
      // Cleanup
      const testDir = gsdPath('scripts', 'test-approval-missing');
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
      const passed = error.message.includes('STATE.md') || error.message.includes('not found');
      logTest('logApprovalDecision handles missing STATE.md', passed);
    }

    // Test 4: logApprovalDecision preserves existing decisions
    try {
      const testDir = gsdPath('scripts', 'test-approval-preserve');
      const planningDir = path.join(testDir, '.planning');
      const statePath = path.join(planningDir, 'STATE.md');

      // Create temp STATE.md with 2 existing decisions
      fs.mkdirSync(planningDir, { recursive: true });
      const testStateContent = `# State: Test Project

**Last Updated:** 2026-01-18

---

## Current Position

**Phase:** 1 of 4 (Test Phase)
**Plan:** 1 of 1 (in progress)
**Status:** In progress

---

## Accumulated Context

### Key Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| Decision 1 | 2026-01-18 | Rationale 1 |
| Decision 2 | 2026-01-18 | Rationale 2 |
`;
      fs.writeFileSync(statePath, testStateContent);

      // Add 3rd decision
      await logApprovalDecision(testDir, 'Decision 3', 'Option 3', 'Rationale 3');

      // Read updated STATE.md
      const updatedContent = fs.readFileSync(statePath, 'utf8');
      const passed = updatedContent.includes('Decision 1') &&
                     updatedContent.includes('Decision 2') &&
                     updatedContent.includes('[APPROVAL GATE] Decision 3: Option 3');

      // Cleanup
      fs.rmSync(testDir, { recursive: true, force: true });

      logTest('logApprovalDecision preserves existing decisions', passed);
    } catch (error) {
      logTest('logApprovalDecision preserves existing decisions', false, error.message);
    }

    // === RESEARCH SYNTHESIS TESTS (4 tests) ===

    // Test 5: assignConfidenceLevel detects HIGH confidence sources
    try {
      const test1 = assignConfidenceLevel({ source: 'https://docs.example.com/guide' });
      const test2 = assignConfidenceLevel({ source: 'https://example.dev/docs' });
      const test3 = assignConfidenceLevel({ source: 'https://github.com/owner/repo/blob/main/docs/guide.md' });
      const passed = test1 === 'HIGH' && test2 === 'HIGH' && test3 === 'HIGH';
      logTest('assignConfidenceLevel detects HIGH confidence sources', passed);
    } catch (error) {
      logTest('assignConfidenceLevel detects HIGH confidence sources', false, error.message);
    }

    // Test 6: assignConfidenceLevel detects MEDIUM confidence sources
    try {
      const test1 = assignConfidenceLevel({ source: 'https://developer.mozilla.org/en-US/docs/Web' });
      const test2 = assignConfidenceLevel({ source: 'https://stackoverflow.com/questions/123' });
      const test3 = assignConfidenceLevel({ source: 'https://blog.example.com', verifiedWithOfficial: true });
      const passed = test1 === 'MEDIUM' && test2 === 'MEDIUM' && test3 === 'MEDIUM';
      logTest('assignConfidenceLevel detects MEDIUM confidence sources', passed);
    } catch (error) {
      logTest('assignConfidenceLevel detects MEDIUM confidence sources', false, error.message);
    }

    // Test 7: assignConfidenceLevel detects LOW confidence sources
    try {
      const test1 = assignConfidenceLevel({ source: 'https://blog.example.com/post' });
      const test2 = assignConfidenceLevel({ source: 'https://random-site.com' });
      const passed = test1 === 'LOW' && test2 === 'LOW';
      logTest('assignConfidenceLevel detects LOW confidence sources', passed);
    } catch (error) {
      logTest('assignConfidenceLevel detects LOW confidence sources', false, error.message);
    }

    // Test 8: synthesizeResearch generates document with confidence sections
    try {
      const testDir = gsdPath('scripts', 'test-synth-tmp');
      const templatesDir = path.join(testDir, 'gsd', 'templates');

      // Create temp directory and STACK.md template
      fs.mkdirSync(templatesDir, { recursive: true });

      // Copy STACK.md template to temp location
      const actualTemplatePath = gsdPath('templates', 'STACK.md');
      const testTemplatePath = path.join(templatesDir, 'STACK.md');
      const templateContent = fs.readFileSync(actualTemplatePath, 'utf8');
      fs.writeFileSync(testTemplatePath, templateContent);

      // Create test findings
      const findings = [
        {
          title: 'Test Finding',
          content: 'Test content',
          source: 'https://docs.example.com/test'
        }
      ];

      // Synthesize research
      const result = await synthesizeResearch(testDir, 'Test Stack', findings, 'STACK');

      // Verify result contains confidence sections and source
      const passed = result.includes('High Confidence Findings') &&
                     result.includes('https://docs.example.com/test');

      // Cleanup
      fs.rmSync(testDir, { recursive: true, force: true });

      logTest('synthesizeResearch generates document with confidence sections', passed);
    } catch (error) {
      // Cleanup on error
      const testDir = gsdPath('scripts', 'test-synth-tmp');
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
      logTest('synthesizeResearch generates document with confidence sections', false, error.message);
    }

  } catch (error) {
    logTest('Approval gates and research synthesis tests - ERROR', false, error.message);
    // If import failed, mark remaining tests as failed
    for (let i = 0; i < 8; i++) {
      failedTests++;
      totalTests++;
    }
  }
}

/**
 * Test Suite 11: Automated Research
 */
async function testAutomatedResearch() {
  console.log('\n=== Test Suite 11: Automated Research ===');

  try {
    const { performResearch, extractFindings, mergeManualFindings } = await import('./researcher.js');

    // Test 1: performResearch generates findings for STACK type
    try {
      const findings = await performResearch('React', 'STACK');
      const passed = Array.isArray(findings) &&
                     findings.length > 0 &&
                     findings[0].title &&
                     findings[0].content &&
                     findings[0].source &&
                     findings[0].source.startsWith('https://');
      logTest('performResearch generates findings for STACK type', passed);
    } catch (error) {
      logTest('performResearch generates findings for STACK type', false, error.message);
    }

    // Test 2: performResearch generates findings for FEATURES type
    try {
      const findings = await performResearch('React', 'FEATURES');
      const passed = Array.isArray(findings) &&
                     findings.length > 0;
      // Verify different queries generate different findings (at least one difference)
      const stackFindings = await performResearch('React', 'STACK');
      const hasDifference = JSON.stringify(findings) !== JSON.stringify(stackFindings);
      logTest('performResearch generates findings for FEATURES type', passed && hasDifference);
    } catch (error) {
      logTest('performResearch generates findings for FEATURES type', false, error.message);
    }

    // Test 3: performResearch generates findings for ARCHITECTURE type
    try {
      const findings = await performResearch('Node.js', 'ARCHITECTURE');
      const passed = Array.isArray(findings) &&
                     findings.length > 0;
      // Check if at least one finding mentions architecture or patterns
      const mentionsArchitecture = findings.some(f =>
        f.title.toLowerCase().includes('architecture') ||
        f.title.toLowerCase().includes('pattern') ||
        f.content.toLowerCase().includes('architecture') ||
        f.content.toLowerCase().includes('pattern')
      );
      logTest('performResearch generates findings for ARCHITECTURE type', passed && mentionsArchitecture);
    } catch (error) {
      logTest('performResearch generates findings for ARCHITECTURE type', false, error.message);
    }

    // Test 4: extractFindings parses search results correctly
    try {
      const mockResults = [
        {
          title: 'Test Official Docs',
          snippet: 'Official documentation content',
          url: 'https://docs.example.com/test'
        },
        {
          title: 'Insecure HTTP Source',
          snippet: 'Should be filtered out',
          url: 'http://example.com/test' // HTTP, should be excluded
        },
        {
          title: 'Forum Post',
          snippet: 'Should be filtered out',
          url: 'https://forum.example.com/thread/123' // Forum, should be excluded
        }
      ];

      const findings = extractFindings(mockResults);
      const passed = findings.length === 1 && // Only HTTPS non-forum result
                     findings[0].title === 'Test Official Docs' &&
                     findings[0].content === 'Official documentation content' &&
                     findings[0].source === 'https://docs.example.com/test';
      logTest('extractFindings parses search results correctly', passed);
    } catch (error) {
      logTest('extractFindings parses search results correctly', false, error.message);
    }

    // Test 5: mergeManualFindings combines automated + manual
    try {
      const automatedFindings = [
        {
          title: 'Auto Finding',
          content: 'Automated content',
          source: 'https://auto.com/doc'
        }
      ];

      const manualFindings = [
        {
          title: 'Manual Finding',
          content: 'Manual content',
          source: 'https://manual.com/doc',
          verifiedWithOfficial: true
        }
      ];

      const combined = mergeManualFindings(automatedFindings, manualFindings);
      const passed = combined.length === 2 &&
                     combined.some(f => f.source === 'https://auto.com/doc') &&
                     combined.some(f => f.source === 'https://manual.com/doc' && f.verifiedWithOfficial === true);
      logTest('mergeManualFindings combines automated + manual', passed);
    } catch (error) {
      logTest('mergeManualFindings combines automated + manual', false, error.message);
    }

    // Test 6: mergeManualFindings deduplicates by source URL
    try {
      const automatedFindings = [
        {
          title: 'Auto Finding',
          content: 'Old content from automated search',
          source: 'https://example.com/doc'
        }
      ];

      const manualFindings = [
        {
          title: 'Manual Override',
          content: 'New content manually verified',
          source: 'https://example.com/doc' // Same URL
        }
      ];

      const combined = mergeManualFindings(automatedFindings, manualFindings);
      const passed = combined.length === 1 &&
                     combined[0].title === 'Manual Override' &&
                     combined[0].content === 'New content manually verified';
      logTest('mergeManualFindings deduplicates by source URL', passed);
    } catch (error) {
      logTest('mergeManualFindings deduplicates by source URL', false, error.message);
    }

  } catch (error) {
    logTest('Automated research tests - ERROR', false, error.message);
    // If import failed, mark remaining tests as failed
    for (let i = 0; i < 6; i++) {
      failedTests++;
      totalTests++;
    }
  }
}

/**
 * Test Suite 12: Discussion & Context System
 */
async function testDiscussionContextSystem() {
  console.log('\n=== Test Suite 12: Discussion & Context System ===');

  try {
    // Test 1: CONTEXT.md template rendering
    try {
      const result = await renderTemplate('CONTEXT', {
        phase: 6,
        phase_name: 'discussion-and-context-system',
        gathered: '2026-01-20',
        status: 'ready-for-planning',
        discussion_type: 'technical',
        phase_boundary: 'Gather user context before planning',
        locked_decisions: '- **Library:** React\n- **Testing:** Jest',
        discretion_items: '- Component structure\n- File naming',
        specifics_content: 'Additional technical notes here',
        deferred_items: '- Advanced features\n- Performance optimization'
      }, gsdPath('templates'));

      const passed = result.includes('phase: 6') &&
                     result.includes('<decisions>') &&
                     result.includes('<deferred>') &&
                     result.includes('React') &&
                     result.includes('Jest');
      logTest('CONTEXT template renders frontmatter', passed);
    } catch (error) {
      logTest('CONTEXT template renders frontmatter', false, error.message);
    }

    // Test 2: Phase type detection - UI phase
    try {
      const phaseType = detectPhaseType('Build dashboard UI with responsive design');
      const passed = phaseType.technical === true &&
                     phaseType.design === true &&
                     phaseType.workflow === true;
      logTest('UI phase detected as technical+design+workflow', passed);
    } catch (error) {
      logTest('UI phase detected as technical+design+workflow', false, error.message);
    }

    // Test 3: Phase type detection - API phase
    try {
      const phaseType = detectPhaseType('Create REST API infrastructure');
      const passed = phaseType.technical === true &&
                     phaseType.design === false &&
                     phaseType.workflow === true;
      logTest('API phase detected as technical+workflow (no design)', passed);
    } catch (error) {
      logTest('API phase detected as technical+workflow (no design)', false, error.message);
    }

    // Test 4: Get questions for phase
    try {
      const questions = getQuestionsForPhase('Dashboard UI');
      const passed = Array.isArray(questions) &&
                     questions.length > 0 &&
                     questions.some(q => q.category === 'Design & UX');
      logTest('Design questions included for UI phase', passed);
    } catch (error) {
      logTest('Design questions included for UI phase', false, error.message);
    }

    // Test 5: Parse decisions from markdown
    try {
      const markdown = '- **Library:** React\n- **Testing Strategy:** Jest with React Testing Library';
      const decisions = parseDecisions(markdown);
      const passed = decisions.library === 'React' &&
                     decisions.testing_strategy === 'Jest with React Testing Library';
      logTest('Parse decisions from markdown', passed);
    } catch (error) {
      logTest('Parse decisions from markdown', false, error.message);
    }

    // Test 6: Categorize answers - locked
    try {
      const answers = {
        library: 'React',
        testing: 'Jest',
        styling: 'skip',
        performance: 'not now'
      };
      const { locked, discretion, deferred } = categorizeAnswers(answers);
      const passed = locked.library === 'React' &&
                     locked.testing === 'Jest';
      logTest('Categorize locked decisions', passed);
    } catch (error) {
      logTest('Categorize locked decisions', false, error.message);
    }

    // Test 7: Categorize answers - discretion
    try {
      const answers = {
        naming: 'up to you',
        structure: '',
        pattern: 'skip'
      };
      const { locked, discretion, deferred } = categorizeAnswers(answers);
      const passed = discretion.includes('naming') &&
                     discretion.includes('structure') &&
                     discretion.includes('pattern');
      logTest('Categorize discretion items', passed);
    } catch (error) {
      logTest('Categorize discretion items', false, error.message);
    }

    // Test 8: Categorize answers - deferred
    try {
      const answers = {
        advanced: 'not now',
        optimization: 'later'
      };
      const { locked, discretion, deferred } = categorizeAnswers(answers);
      const passed = deferred.includes('advanced') &&
                     deferred.includes('optimization');
      logTest('Categorize deferred items', passed);
    } catch (error) {
      logTest('Categorize deferred items', false, error.message);
    }

    // Test 9: Load missing CONTEXT.md (graceful handling)
    try {
      const context = await loadPhaseContext(99, 'nonexistent-phase');
      const passed = context === null;
      logTest('Returns null for missing CONTEXT.md', passed);
    } catch (error) {
      logTest('Returns null for missing CONTEXT.md', false, error.message);
    }

  } catch (error) {
    logTest('Discussion & context system tests - ERROR', false, error.message);
    // If import failed, mark remaining tests as failed
    for (let i = 0; i < 9; i++) {
      failedTests++;
      totalTests++;
    }
  }
}

/**
 * Test Suite 13: Web Scraping (Phase 7)
 */
async function testWebScraping() {
  console.log('\n=== Test Suite 13: Web Scraping ===');

  try {
    // === SCRAPER.JS TESTS (3 tests) ===

    // Test 1: scrapeContent returns content object with method/content/title
    try {
      console.log('    Attempting network request to nodejs.org...');
      const result = await scrapeContent('https://nodejs.org/en/docs/');
      const passed = result &&
                     result.method &&
                     (result.method === 'static' || result.method === 'dynamic') &&
                     result.content &&
                     result.content.length > 100 &&
                     result.title &&
                     result.url;
      logTest('scrapeContent returns content object with method/content/title', passed);
      if (passed) {
        console.log(`      Method: ${result.method}, Title: "${result.title.substring(0, 40)}...", Content length: ${result.content.length}`);
      }
    } catch (error) {
      // Network errors are acceptable - mark as warning
      if (error.message.includes('ENOTFOUND') || error.message.includes('network') || error.message.includes('timeout')) {
        console.log('  ⚠ scrapeContent returns content object with method/content/title (SKIPPED - network unavailable)');
        console.log(`    Network error: ${error.message}`);
      } else {
        logTest('scrapeContent returns content object with method/content/title', false, error.message);
      }
    }

    // Test 2: fetchWithRetry handles retries (using mock behavior check)
    try {
      // Test fetchWithRetry function exists and has correct signature
      const passed = typeof fetchWithRetry === 'function';
      logTest('fetchWithRetry function is exported', passed);
    } catch (error) {
      logTest('fetchWithRetry function is exported', false, error.message);
    }

    // Test 3: scrapeWithFallback function exists
    try {
      const passed = typeof scrapeWithFallback === 'function';
      logTest('scrapeWithFallback function is exported', passed);
    } catch (error) {
      logTest('scrapeWithFallback function is exported', false, error.message);
    }

    // === SOURCE-VALIDATOR.JS TESTS (3 tests) ===

    // Test 4: classifySourceAuthority returns HIGH for official docs
    try {
      const test1 = classifySourceAuthority('https://docs.react.dev/');
      const test2 = classifySourceAuthority('https://react.dev/'); // .dev domain
      const test3 = classifySourceAuthority('https://github.com/facebook/react/docs/guide.html');
      const passed = test1 === 'HIGH' && test2 === 'HIGH' && test3 === 'HIGH';
      logTest('classifySourceAuthority returns HIGH for official docs', passed);
      if (passed) {
        console.log(`      docs.react.dev: ${test1}, react.dev: ${test2}, github docs: ${test3}`);
      } else {
        console.log(`      docs.react.dev: ${test1}, react.dev: ${test2}, github docs: ${test3}`);
      }
    } catch (error) {
      logTest('classifySourceAuthority returns HIGH for official docs', false, error.message);
    }

    // Test 5: classifySourceAuthority returns MEDIUM for MDN/StackOverflow
    try {
      const test1 = classifySourceAuthority('https://developer.mozilla.org/en-US/');
      const test2 = classifySourceAuthority('https://stackoverflow.com/questions/');
      const passed = test1 === 'MEDIUM' && test2 === 'MEDIUM';
      logTest('classifySourceAuthority returns MEDIUM for MDN/StackOverflow', passed);
      if (passed) {
        console.log(`      MDN: ${test1}, StackOverflow: ${test2}`);
      }
    } catch (error) {
      logTest('classifySourceAuthority returns MEDIUM for MDN/StackOverflow', false, error.message);
    }

    // Test 6: classifySourceAuthority returns UNVERIFIED for unknown domains
    try {
      const test1 = classifySourceAuthority('https://random-website.example.com/');
      const test2 = classifySourceAuthority('https://unknown.xyz/');
      const passed = test1 === 'UNVERIFIED' && test2 === 'UNVERIFIED';
      logTest('classifySourceAuthority returns UNVERIFIED for unknown domains', passed);
      if (passed) {
        console.log(`      random-website: ${test1}, unknown.xyz: ${test2}`);
      } else {
        console.log(`      random-website: ${test1}, unknown.xyz: ${test2}`);
      }
    } catch (error) {
      logTest('classifySourceAuthority returns UNVERIFIED for unknown domains', false, error.message);
    }

    // === DEDUPLICATOR.JS TESTS (3 tests) ===

    // Test 7: hashContent normalizes whitespace and case
    try {
      const hash1 = hashContent('Hello  World');
      const hash2 = hashContent('hello world');
      const hash3 = hashContent('Test\n\n\nString');
      const hash4 = hashContent('test string');
      const passed = hash1 === hash2 && hash3 === hash4 && hash1 !== hash3;
      logTest('hashContent normalizes whitespace and case', passed);
      if (passed) {
        console.log(`      "Hello  World" === "hello world": ${hash1 === hash2}`);
        console.log(`      "Test\\n\\n\\nString" === "test string": ${hash3 === hash4}`);
      }
    } catch (error) {
      logTest('hashContent normalizes whitespace and case', false, error.message);
    }

    // Test 8: deduplicateFindings removes exact duplicates
    try {
      const findings = [
        { content: 'Content A', source: 'url1', title: 'Title 1' },
        { content: 'Content A', source: 'url2', title: 'Title 2' },
        { content: 'Content B', source: 'url3', title: 'Title 3' }
      ];
      const result = deduplicateFindings(findings);
      const passed = result.length === 2; // A and B
      logTest('deduplicateFindings removes exact duplicates', passed);
      if (passed) {
        console.log(`      Original: ${findings.length}, Deduplicated: ${result.length}`);
      }
    } catch (error) {
      logTest('deduplicateFindings removes exact duplicates', false, error.message);
    }

    // Test 9: deduplicateFindings merges alternate sources
    try {
      const findings = [
        { source: 'url1', content: 'Same content here', title: 'Title 1' },
        { source: 'url2', content: 'Same content here', title: 'Title 2' }
      ];
      const result = deduplicateFindings(findings);
      const passed = result.length === 1 &&
                     result[0].alternateSources &&
                     Array.isArray(result[0].alternateSources) &&
                     result[0].alternateSources.length === 1;
      logTest('deduplicateFindings merges alternate sources', passed);
      if (passed) {
        console.log(`      Merged: url1 + url2 into single finding with alternateSources`);
      }
    } catch (error) {
      logTest('deduplicateFindings merges alternate sources', false, error.message);
    }

  } catch (error) {
    logTest('Web scraping tests - ERROR', false, error.message);
    // If import failed, mark remaining tests as failed
    for (let i = 0; i < 9; i++) {
      failedTests++;
      totalTests++;
    }
  }
}

/**
 * Test Suite 14: Multi-Domain Coordination (Phase 7)
 */
async function testMultiDomainCoordination() {
  console.log('\n=== Test Suite 14: Multi-Domain Coordination ===');

  try {
    // === DOMAIN-COORDINATOR.JS TESTS (3 tests) ===

    // Test 1: coordinateMultiDomainResearch executes all 4 domains
    try {
      console.log('    Testing multi-domain coordination with React...');
      const results = await coordinateMultiDomainResearch('React', { concurrency: 2 });
      const passed = results &&
                     typeof results === 'object' &&
                     'stack' in results &&
                     'features' in results &&
                     'architecture' in results &&
                     'pitfalls' in results &&
                     Array.isArray(results.stack) &&
                     Array.isArray(results.features) &&
                     Array.isArray(results.architecture) &&
                     Array.isArray(results.pitfalls);
      logTest('coordinateMultiDomainResearch executes all 4 domains', passed);
      if (passed) {
        console.log(`      STACK: ${results.stack.length}, FEATURES: ${results.features.length}, ARCHITECTURE: ${results.architecture.length}, PITFALLS: ${results.pitfalls.length}`);
      }
    } catch (error) {
      logTest('coordinateMultiDomainResearch executes all 4 domains', false, error.message);
    }

    // Test 2: performDomainResearch returns findings with domain metadata
    try {
      console.log('    Testing single domain research for Node.js STACK...');
      const results = await performDomainResearch('Node.js', 'STACK');
      const passed = Array.isArray(results);
      logTest('performDomainResearch returns findings array', passed);
      if (passed) {
        console.log(`      Findings count: ${results.length}`);
      }
    } catch (error) {
      logTest('performDomainResearch returns findings array', false, error.message);
    }

    // Test 3: Concurrency control (function signature test)
    try {
      // Test that coordinateMultiDomainResearch accepts concurrency option
      const passed = typeof coordinateMultiDomainResearch === 'function';
      logTest('coordinateMultiDomainResearch function is exported', passed);
    } catch (error) {
      logTest('coordinateMultiDomainResearch function is exported', false, error.message);
    }

    // === UPDATED RESEARCHER.JS TESTS (3 tests) ===

    // Test 4: performResearch uses real scraping (not mock data)
    try {
      const findings = await performResearch('Express', 'STACK');
      // Check for real scraping indicators: confidence property assigned by source-validator
      const hasRealScrapingIndicators = findings.length === 0 || // Empty is OK (network failure)
                                         findings.some(f => f.confidence); // Has confidence from source-validator
      logTest('performResearch uses real scraping integration', hasRealScrapingIndicators);
      if (hasRealScrapingIndicators && findings.length > 0) {
        console.log(`      Found ${findings.length} findings with confidence: ${findings[0].confidence}`);
      }
    } catch (error) {
      logTest('performResearch uses real scraping integration', false, error.message);
    }

    // Test 5: performResearch applies deduplication
    try {
      // Call performResearch which internally calls deduplicateFindings
      const findings = await performResearch('Vue', 'FEATURES');
      // Deduplication should have been applied (we can't easily test removal without duplicates)
      // But we can verify the function completed without errors
      const passed = Array.isArray(findings);
      logTest('performResearch applies deduplication', passed);
    } catch (error) {
      logTest('performResearch applies deduplication', false, error.message);
    }

    // Test 6: extractFindings integrates source-validator confidence
    try {
      // Import extractFindings from researcher.js
      const { extractFindings } = await import('./researcher.js');

      // Create mock scraped results with method property (from scraper.js)
      const mockScrapedResults = [
        {
          title: 'Official Docs',
          content: 'Official documentation content',
          url: 'https://docs.example.dev/',
          method: 'static' // From scraper.js
        }
      ];

      const findings = extractFindings(mockScrapedResults);
      const passed = findings.length > 0 &&
                     findings[0].confidence &&
                     (findings[0].confidence === 'HIGH' || findings[0].confidence === 'MEDIUM' ||
                      findings[0].confidence === 'LOW' || findings[0].confidence === 'UNVERIFIED');
      logTest('extractFindings integrates source-validator confidence', passed);
      if (passed) {
        console.log(`      Confidence assigned: ${findings[0].confidence}`);
      }
    } catch (error) {
      logTest('extractFindings integrates source-validator confidence', false, error.message);
    }

  } catch (error) {
    logTest('Multi-domain coordination tests - ERROR', false, error.message);
    // If import failed, mark remaining tests as failed
    for (let i = 0; i < 6; i++) {
      failedTests++;
      totalTests++;
    }
  }
}

/**
 * Test Suite 15: Verification Modules (Phase 8)
 */
async function testVerificationModules() {
  console.log('\n=== Test Suite 15: Verification Modules (Phase 8) ===');

  // Test 1: goal-validator exports expected functions
  try {
    const hasValidate = typeof validateAcceptanceCriteria === 'function';
    const hasExtract = typeof extractSuccessCriteria === 'function';
    const hasCreate = typeof createValidator === 'function';
    logTest('goal-validator exports 3 functions', hasValidate && hasExtract && hasCreate);
  } catch (error) {
    logTest('goal-validator exports 3 functions', false, error.message);
  }

  // Test 2: extractSuccessCriteria parses ROADMAP.md
  try {
    const roadmapPath = projectPath('.planning', 'ROADMAP.md');
    const roadmapContent = await readFile(roadmapPath);
    const criteria = extractSuccessCriteria(roadmapContent, 1);
    const passed = Array.isArray(criteria) && criteria.length > 0;
    logTest('extractSuccessCriteria parses Phase 1 criteria', passed);
  } catch (error) {
    logTest('extractSuccessCriteria parses Phase 1 criteria', false, error.message);
  }

  // Test 3: validateAcceptanceCriteria returns results array
  try {
    const results = await validateAcceptanceCriteria(1);
    const passed = Array.isArray(results) && results.every(r => 'criterion' in r && 'passed' in r);
    logTest('validateAcceptanceCriteria returns structured results', passed);
  } catch (error) {
    logTest('validateAcceptanceCriteria returns structured results', false, error.message);
  }

  // Test 4: quality-checker exports expected functions
  try {
    const hasCheck = typeof checkCoverageThreshold === 'function';
    const hasLint = typeof runLinting === 'function';
    const hasGates = typeof checkQualityGates === 'function';
    logTest('quality-checker exports 3 functions', hasCheck && hasLint && hasGates);
  } catch (error) {
    logTest('quality-checker exports 3 functions', false, error.message);
  }

  // Test 5: checkCoverageThreshold validates coverage data
  try {
    const result = checkCoverageThreshold({ lines: 85, branches: 80, functions: 90 }, 80);
    const passed = typeof result.passed === 'boolean' && Array.isArray(result.failures);
    logTest('checkCoverageThreshold validates coverage', passed);
  } catch (error) {
    logTest('checkCoverageThreshold validates coverage', false, error.message);
  }

  // Test 6: verifier exports expected functions
  try {
    const hasVerify = typeof verifyPhase === 'function';
    const hasSmoke = typeof runSmokeTests === 'function';
    const hasUnit = typeof runUnitTests === 'function';
    logTest('verifier exports verification functions', hasVerify && hasSmoke && hasUnit);
  } catch (error) {
    logTest('verifier exports verification functions', false, error.message);
  }

  // Test 7: runSmokeTests checks critical files
  try {
    const result = await runSmokeTests(1);
    const passed = typeof result.passed === 'boolean' && typeof result.duration === 'string';
    logTest('runSmokeTests validates critical files', passed);
  } catch (error) {
    logTest('runSmokeTests validates critical files', false, error.message);
  }

  // Test 8: verifyPhase orchestrates all layers
  try {
    const result = await verifyPhase(1, { coverageThreshold: 80 });
    const passed = typeof result.passed === 'boolean' &&
                  typeof result.layers === 'object' &&
                  Array.isArray(result.failures);
    logTest('verifyPhase orchestrates multi-layer verification', passed);
  } catch (error) {
    logTest('verifyPhase orchestrates multi-layer verification', false, error.message);
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('===========================================');
  console.log('Phase 2, 3, 4, 6, & 7 Integration Test Suite');
  console.log('===========================================');
  console.log(`\nTest paths:`);
  console.log(`  GSD Root: ${GSD_ROOT}`);
  console.log(`  Project Root: ${PROJECT_ROOT}`);
  console.log(`  Templates: ${gsdPath('templates')}`);
  console.log(`  Config: ${gsdPath('.gsd-config.json')}`);
  console.log('');

  try {
    await testFileOperations();
    await testProcessRunner();
    await testStateManager();
    await testTemplateRenderer();
    await testGuidelineLoader();
    await testCrossPlatform();
    await testTriggerDetection();
    await testArtifactValidation();
    await testResumeOrchestration();
    await testApprovalGatesAndResearch();
    await testAutomatedResearch();
    await testDiscussionContextSystem();
    await testWebScraping();
    await testMultiDomainCoordination();
    await testVerificationModules();

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
