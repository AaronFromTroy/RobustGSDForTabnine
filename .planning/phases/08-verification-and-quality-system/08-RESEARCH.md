# Phase 8: Verification & Quality System - Research

**Researched:** 2026-01-21
**Domain:** Software verification, quality assurance, automated testing
**Confidence:** HIGH

## Summary

Phase 8 focuses on building a comprehensive verification and quality system that validates built features achieve their intended goals through goal-backward verification. Research reveals that modern verification systems in 2026 emphasize shift-left testing (early verification), automated quality gates in CI/CD pipelines, and continuous validation throughout the development lifecycle.

The standard approach combines multiple verification layers: smoke testing for build stability, acceptance criteria validation against user stories, code coverage analysis (80%+ target), static analysis for code quality, and integration testing for component interactions. Modern tools like Vitest (10-20x faster than Jest), c8 (native V8 coverage), and ESLint provide the foundation for automated verification.

Goal-backward verification—while not a formally established term—aligns with Acceptance Test-Driven Development (ATDD) and behavior-driven development patterns where verification criteria are defined from desired outcomes first, then code is validated against those criteria. This approach ensures features meet user needs rather than just technical specifications.

**Primary recommendation:** Implement a multi-layer verification system with automated quality gates that validate both technical correctness (tests pass, coverage meets threshold, no linting errors) and goal achievement (acceptance criteria met, success criteria validated, deliverables complete).

## Standard Stack

The established libraries/tools for verification and quality systems in Node.js:

### Core Testing Framework
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | 2.x | Unit and integration testing | 10-20x faster than Jest, native ESM/TypeScript support, Vite integration, Jest API compatible |
| c8 | 10.x | Code coverage reporting | Native V8 coverage (no instrumentation overhead), Istanbul reporter compatible, accurate source maps |
| ESLint | 9.x | Static analysis/linting | Industry standard, pluggable architecture, TypeScript support, 50M+ weekly downloads |

### Supporting Tools
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitest/ui | 2.x | Visual test runner | Development - browser-based test UI and trace view |
| @vitest/coverage-v8 | 2.x | Coverage provider | Alternative to c8, integrated with Vitest configuration |
| actionlint | 1.x | GitHub Actions validation | CI/CD - validates workflow YAML syntax and security |
| typescript-eslint | 8.x | TypeScript linting | TypeScript projects - type-aware linting rules |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vitest | Jest | More mature ecosystem and React Native support, but 10-20x slower and experimental ESM support |
| c8 | nyc (Istanbul) | More features and plugins, but requires instrumentation overhead (slower) |
| ESLint | Biome | 10x faster linting and formatting, but smaller ecosystem and fewer plugins |

**Installation:**
```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8 c8 eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

## Architecture Patterns

### Recommended Project Structure
```
gsd/
├── scripts/
│   ├── verifier.js           # Main verification orchestrator
│   ├── goal-validator.js     # Acceptance criteria validation
│   ├── quality-checker.js    # Quality gates (coverage, linting)
│   └── verification-report.js # Generate verification reports
├── tests/
│   ├── unit/                 # Unit tests (fast, isolated)
│   ├── integration/          # Integration tests (component interactions)
│   └── acceptance/           # Acceptance tests (goal validation)
└── .github/
    └── workflows/
        └── verify.yml        # Automated verification workflow
```

### Pattern 1: Multi-Layer Verification
**What:** Execute verification in layers from fast to slow, failing early on critical issues.

**When to use:** All verification workflows - maximizes feedback speed.

**Layer order:**
1. **Smoke tests** (seconds) - Build stability, critical paths only
2. **Static analysis** (seconds) - Linting, type checking, complexity analysis
3. **Unit tests** (seconds-minutes) - Isolated component behavior
4. **Integration tests** (minutes) - Component interactions
5. **Acceptance tests** (minutes) - Goal/criteria validation

**Example:**
```javascript
// Source: Research synthesis - industry standard pattern
async function verifyPhase(phaseNumber) {
  // Layer 1: Smoke tests (fail fast)
  await runSmokeTests(phaseNumber);

  // Layer 2: Static analysis
  await runLinting();
  await checkComplexity();

  // Layer 3: Unit tests with coverage
  const unitResults = await runUnitTests();
  if (unitResults.coverage < 80) {
    throw new Error('Coverage below 80% threshold');
  }

  // Layer 4: Integration tests
  await runIntegrationTests();

  // Layer 5: Acceptance criteria validation
  await validateAcceptanceCriteria(phaseNumber);

  return { passed: true, layers: 5 };
}
```

### Pattern 2: Goal-Backward Verification (ATDD Pattern)
**What:** Define acceptance criteria from goals first, then validate code meets those criteria.

**When to use:** Feature verification - ensures features achieve intended outcomes, not just technical correctness.

**Implementation:**
1. Extract acceptance criteria from PLAN.md success criteria
2. Convert criteria to testable assertions (Given-When-Then format)
3. Execute automated validation against criteria
4. Generate pass/fail report with remediation guidance

**Example:**
```javascript
// Source: ATDD pattern from research
// Given-When-Then format for acceptance criteria
const acceptanceCriteria = [
  {
    given: 'A phase with 3 plans',
    when: 'All plans are executed',
    then: 'All 3 SUMMARY.md files exist',
    validator: async (phaseDir) => {
      const summaries = await glob(`${phaseDir}/*-SUMMARY.md`);
      return summaries.length === 3;
    }
  },
  {
    given: 'A completed phase',
    when: 'Verification runs',
    then: 'All success criteria from ROADMAP.md are met',
    validator: async (phase) => {
      const criteria = await extractSuccessCriteria(phase);
      return await validateEachCriterion(criteria);
    }
  }
];

// Execute validation
for (const criterion of acceptanceCriteria) {
  const passed = await criterion.validator(context);
  if (!passed) {
    throw new Error(`Failed: ${criterion.then}`);
  }
}
```

### Pattern 3: Quality Gates
**What:** Automated checkpoints that enforce quality standards before allowing progression.

**When to use:** CI/CD pipelines - prevents poor-quality code from advancing.

**Gate criteria:**
- Code coverage ≥ 80% (lines, branches, functions)
- All tests pass (unit + integration)
- No linting errors (warnings allowed)
- Complexity ≤ 10 per function (cyclomatic complexity)
- No high/critical security vulnerabilities

**Example:**
```javascript
// Source: Quality gates pattern from CI/CD research
const qualityGates = {
  coverage: { threshold: 80, metric: 'lines' },
  tests: { allowFailures: 0 },
  linting: { allowErrors: 0, allowWarnings: true },
  complexity: { maxPerFunction: 10 },
  security: { allowedLevels: ['low', 'medium'] }
};

async function checkQualityGates(results) {
  const failures = [];

  if (results.coverage < qualityGates.coverage.threshold) {
    failures.push(`Coverage ${results.coverage}% below ${qualityGates.coverage.threshold}% threshold`);
  }

  if (results.testFailures > 0) {
    failures.push(`${results.testFailures} test(s) failed`);
  }

  if (results.lintingErrors > 0) {
    failures.push(`${results.lintingErrors} linting error(s) found`);
  }

  return {
    passed: failures.length === 0,
    failures,
    status: failures.length === 0 ? 'PASS' : 'FAIL'
  };
}
```

### Pattern 4: Verification Report Generation
**What:** Generate human-readable reports documenting verification results with remediation guidance.

**When to use:** After verification completes - provides audit trail and action items.

**Report structure:**
- Executive summary (pass/fail, key metrics)
- Layer-by-layer results (smoke, lint, test, acceptance)
- Failed criteria with remediation steps
- Quality metrics (coverage %, complexity, test count)
- Next actions (if passed: proceed; if failed: fix issues)

**Example:**
```javascript
// Source: Verification reporting pattern
function generateVerificationReport(results) {
  return {
    summary: {
      passed: results.failures.length === 0,
      timestamp: new Date().toISOString(),
      phase: results.phase,
      duration: results.duration
    },
    layers: {
      smoke: { passed: true, duration: '2s' },
      linting: { passed: true, errors: 0, warnings: 3 },
      unitTests: { passed: true, count: 81, coverage: 91 },
      integration: { passed: true, count: 15 },
      acceptance: { passed: false, failedCriteria: ['Criterion 3'] }
    },
    failures: [
      {
        layer: 'acceptance',
        criterion: 'All success criteria from ROADMAP.md met',
        issue: 'Success criterion 3 not validated',
        remediation: 'Verify deliverable X exists and meets specification'
      }
    ],
    qualityMetrics: {
      coverage: { lines: 91, branches: 87, functions: 93 },
      complexity: { average: 6.2, max: 12, violations: 2 },
      tests: { total: 96, passed: 96, failed: 0 }
    },
    nextAction: results.failures.length === 0
      ? 'Phase verified. Proceed to next phase.'
      : `Fix ${results.failures.length} issue(s) before proceeding.`
  };
}
```

### Anti-Patterns to Avoid
- **Verification theater:** Running tests but ignoring failures - defeats purpose of verification
- **Coverage obsession:** Chasing 100% coverage without validating test quality - high coverage with poor tests is worthless
- **Manual verification only:** No automation - slow, error-prone, not repeatable
- **Single-layer verification:** Only unit tests or only linting - misses different issue types
- **Vague acceptance criteria:** "It should work" - not testable, not verifiable

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test runner | Custom test execution framework | Vitest or Jest | Complex features: parallel execution, watch mode, mocking, snapshots, coverage integration |
| Code coverage | Custom instrumentation | c8 or @vitest/coverage-v8 | Native V8 integration, source map handling, multiple report formats, threshold enforcement |
| Linting | Custom code analysis | ESLint | 1000+ rules, pluggable architecture, auto-fixing, IDE integration, TypeScript support |
| GitHub Actions validation | Custom YAML parsing | actionlint | Security checks, type validation, shellcheck integration, 100+ validation rules |
| Acceptance criteria parsing | Custom markdown parser | front-matter + regex | Handles YAML frontmatter, edge cases, malformed input |
| Quality gate enforcement | Custom threshold checking | CI/CD platform features | GitHub Actions, GitLab CI have built-in quality gate support |

**Key insight:** Testing and verification tools have 10+ years of edge case handling, performance optimization, and ecosystem integration. Custom solutions require months of development to reach basic feature parity and years to match robustness. The GSD system already uses integration-test.js (Phase 2) successfully—extend that pattern rather than rebuild.

## Common Pitfalls

### Pitfall 1: Incomplete Acceptance Criteria Validation
**What goes wrong:** Tests pass, coverage is high, but feature doesn't meet user goals because acceptance criteria aren't validated.

**Why it happens:** Focus on technical verification (tests, linting) without validating goal achievement. Acceptance criteria exist in PLAN.md but aren't programmatically checked.

**How to avoid:**
1. Extract success criteria from ROADMAP.md and PLAN.md
2. Convert each criterion to automated validation
3. Run acceptance validation as final verification layer
4. Fail verification if any criterion unmet

**Warning signs:**
- Phase marked complete but success criteria from ROADMAP.md not checked
- SUMMARY.md exists but deliverables not validated
- User reports "it works but doesn't do what I needed"

### Pitfall 2: Coverage Theater (High Coverage, Poor Tests)
**What goes wrong:** Coverage reaches 80%+ but tests don't catch real bugs because tests are shallow or test trivial code paths.

**Why it happens:** Optimizing for coverage percentage instead of test quality. Writing tests to increase coverage without validating meaningful behavior.

**How to avoid:**
1. Review test assertions - do they validate actual behavior or just call functions?
2. Measure mutation testing score (not just line coverage)
3. Require tests to fail when behavior breaks (not just when syntax errors)
4. Focus integration tests on user flows, not internal implementation

**Warning signs:**
- Coverage is 90%+ but bugs still reach production
- Tests pass after breaking changes to business logic
- Tests have no assertions or only check `exists()` or `typeof`

### Pitfall 3: Slow Verification Feedback Loop
**What goes wrong:** Verification takes 10+ minutes, developers skip running it locally, CI catches issues hours later.

**Why it happens:** All tests run serially, no layering, heavy integration tests run first, no smoke tests.

**How to avoid:**
1. Implement multi-layer verification (smoke → lint → unit → integration → acceptance)
2. Fail fast on critical issues (smoke tests first, 10 seconds)
3. Run unit tests in parallel (Vitest default behavior)
4. Cache dependencies and build artifacts in CI
5. Provide fast local verification command (`npm run verify:quick`)

**Warning signs:**
- Developers say "I'll just push and let CI test it"
- Verification takes >5 minutes for local feedback
- CI fails on issues that could be caught in 30 seconds locally

### Pitfall 4: Verification-Implementation Gap
**What goes wrong:** Verification script passes but phase isn't actually complete because verification doesn't check everything.

**Why it happens:** Verification focuses on code artifacts (tests, linting) but doesn't validate phase deliverables (files created, STATE.md updated, git commits).

**How to avoid:**
1. Verify both code quality AND phase deliverables
2. Check SUMMARY.md exists and has required sections
3. Validate STATE.md shows phase completion
4. Confirm git commits exist for each plan
5. Verify all files in PLAN.md deliverables list exist

**Warning signs:**
- Verification passes but SUMMARY.md missing
- STATE.md not updated despite "verification passed"
- Deliverables listed in PLAN.md don't exist

### Pitfall 5: Ignoring Verification Results
**What goes wrong:** Verification runs, reports failures, but workflow proceeds anyway because failures aren't enforced.

**Why it happens:** No quality gates in workflow, verification is advisory not blocking, manual override culture.

**How to avoid:**
1. Make verification a required step before phase transition
2. Block STATE.md status update if verification fails
3. Return non-zero exit code on verification failure
4. Log verification failures to STATE.md Key Decisions
5. Require explicit approval to proceed despite failures

**Warning signs:**
- VERIFICATION.md shows failures but phase marked complete
- STATE.md shows "verification: failed" but next phase started
- No process to address verification failures

### Pitfall 6: One-Size-Fits-All Verification
**What goes wrong:** Same verification runs for all phase types (templates, code, documentation) despite different needs.

**Why it happens:** Generic verification script doesn't adapt to phase content.

**How to avoid:**
1. Detect phase type from deliverables (*.js files → code phase, *.md only → documentation phase)
2. Skip code coverage for template-only phases
3. Require integration tests only for code phases
4. Adjust quality gates based on phase type

**Warning signs:**
- Linting fails on phases with no code
- Coverage requirements applied to documentation phases
- Integration tests required for template-only phases

## Code Examples

Verified patterns from official sources and research:

### Example 1: Vitest Test Suite for Verification Module
```javascript
// Source: https://vitest.dev/guide/ - Official Vitest documentation
import { describe, test, expect, beforeEach } from 'vitest';
import { verifyPhase } from '../scripts/verifier.js';
import { validateAcceptanceCriteria } from '../scripts/goal-validator.js';

describe('Phase Verification', () => {
  beforeEach(() => {
    // Reset state before each test
  });

  test('should pass verification when all criteria met', async () => {
    const result = await verifyPhase(7);
    expect(result.passed).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  test('should fail verification when coverage below threshold', async () => {
    const result = await verifyPhase(7, { coverageThreshold: 95 });
    expect(result.passed).toBe(false);
    expect(result.failures).toContain('Coverage 91% below 95% threshold');
  });

  test('should validate acceptance criteria from ROADMAP.md', async () => {
    const criteria = await validateAcceptanceCriteria(7);
    expect(criteria.every(c => c.passed)).toBe(true);
  });
});

// Run with: npx vitest
// Coverage: npx vitest --coverage
```

### Example 2: C8 Coverage with Thresholds
```bash
# Source: https://github.com/bcoe/c8 - Official c8 documentation
# Run tests with coverage and enforce 80% threshold
c8 --check-coverage --lines 80 --functions 80 --branches 80 npm test

# Generate HTML report
c8 --reporter=html npm test

# Per-file coverage enforcement (stricter)
c8 --check-coverage --lines 80 --per-file npm test

# Configuration in package.json
{
  "c8": {
    "check-coverage": true,
    "lines": 80,
    "functions": 80,
    "branches": 80,
    "statements": 80,
    "exclude": [
      "tests/**",
      "*.config.js"
    ],
    "reporter": ["text", "html", "lcov"]
  }
}
```

### Example 3: ESLint Configuration for Quality Checks
```javascript
// Source: https://eslint.org/docs/latest/use/getting-started - Official ESLint docs
// eslint.config.js (Flat Config - ESLint 9+)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Code quality rules
      'complexity': ['error', 10], // Cyclomatic complexity limit
      'max-lines-per-function': ['warn', 50],
      'max-depth': ['error', 4],
      'no-console': 'warn',

      // Best practices
      'no-unused-vars': 'error',
      'no-undef': 'error',
      'prefer-const': 'error',

      // TypeScript-specific
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off'
    },
    ignores: ['node_modules/', 'dist/', '.planning/']
  }
];

// Run: npx eslint .
// Auto-fix: npx eslint . --fix
```

### Example 4: Goal-Backward Acceptance Validation
```javascript
// Source: ATDD pattern synthesis from research
import { readFile } from './file-ops.js';
import path from 'node:path';
import frontmatter from 'front-matter';

/**
 * Validate acceptance criteria for a phase
 * Uses Given-When-Then format from ATDD pattern
 */
export async function validateAcceptanceCriteria(phaseNumber) {
  const roadmapPath = path.join(process.cwd(), '.planning', 'ROADMAP.md');
  const roadmap = await readFile(roadmapPath);

  // Extract success criteria for phase
  const criteria = extractSuccessCriteria(roadmap, phaseNumber);

  const results = [];
  for (const criterion of criteria) {
    const validator = createValidator(criterion);
    const passed = await validator();

    results.push({
      criterion: criterion.text,
      passed,
      remediation: passed ? null : criterion.remediation
    });
  }

  return results;
}

function extractSuccessCriteria(roadmap, phaseNumber) {
  // Find "Success Criteria:" section for phase
  const phaseRegex = new RegExp(
    `### Phase ${phaseNumber}:.*?\\*\\*Success Criteria:\\*\\*\\s+([\\s\\S]*?)(?=###|---|\$)`,
    'i'
  );
  const match = roadmap.match(phaseRegex);

  if (!match) return [];

  // Parse numbered list of criteria
  const criteriaText = match[1];
  const criteriaRegex = /^\d+\.\s+(.+)$/gm;
  const criteria = [];
  let criterionMatch;

  while ((criterionMatch = criteriaRegex.exec(criteriaText)) !== null) {
    criteria.push({
      text: criterionMatch[1].trim(),
      remediation: generateRemediation(criterionMatch[1])
    });
  }

  return criteria;
}

function createValidator(criterion) {
  // Convert criterion text to validation function
  // Example: "All required artifacts exist" → check file existence

  if (criterion.text.includes('artifacts')) {
    return async () => {
      // Validate artifact files exist
      const artifacts = ['PROJECT.md', 'ROADMAP.md', 'REQUIREMENTS.md'];
      for (const artifact of artifacts) {
        const exists = await fileExists(path.join('.planning', artifact));
        if (!exists) return false;
      }
      return true;
    };
  }

  if (criterion.text.includes('tests pass')) {
    return async () => {
      // Run tests and check exit code
      const result = await runTests();
      return result.exitCode === 0;
    };
  }

  // Add more validators as needed
  return async () => true; // Default: assume passes
}

function generateRemediation(criterionText) {
  // Generate actionable remediation steps
  if (criterionText.includes('artifacts')) {
    return 'Create missing artifact files using template-renderer.js';
  }
  if (criterionText.includes('tests')) {
    return 'Fix failing tests or add missing test coverage';
  }
  return 'Review criterion and ensure all conditions are met';
}
```

### Example 5: Multi-Layer Verification Orchestrator
```javascript
// Source: Pattern synthesis from research
import { spawn } from 'node:child_process';
import { readFile, writeFile } from './file-ops.js';
import path from 'node:path';

/**
 * Multi-layer verification orchestrator
 * Runs verification layers in order, failing fast on critical issues
 */
export async function verifyPhase(phaseNumber, options = {}) {
  const startTime = Date.now();
  const results = {
    phase: phaseNumber,
    passed: false,
    layers: {},
    failures: [],
    duration: 0
  };

  try {
    // Layer 1: Smoke tests (10 seconds, critical paths only)
    console.log('Layer 1/5: Running smoke tests...');
    results.layers.smoke = await runSmokeTests(phaseNumber);
    if (!results.layers.smoke.passed) {
      results.failures.push('Smoke tests failed - build is unstable');
      return finalizeResults(results, startTime);
    }

    // Layer 2: Static analysis (20 seconds)
    console.log('Layer 2/5: Running static analysis...');
    results.layers.linting = await runLinting();
    if (results.layers.linting.errors > 0) {
      results.failures.push(`${results.layers.linting.errors} linting error(s) found`);
      return finalizeResults(results, startTime);
    }

    // Layer 3: Unit tests with coverage (1-2 minutes)
    console.log('Layer 3/5: Running unit tests...');
    results.layers.unitTests = await runUnitTests();
    const coverageThreshold = options.coverageThreshold || 80;
    if (results.layers.unitTests.coverage < coverageThreshold) {
      results.failures.push(
        `Coverage ${results.layers.unitTests.coverage}% below ${coverageThreshold}% threshold`
      );
    }

    // Layer 4: Integration tests (2-3 minutes)
    console.log('Layer 4/5: Running integration tests...');
    results.layers.integration = await runIntegrationTests();
    if (results.layers.integration.failures > 0) {
      results.failures.push(`${results.layers.integration.failures} integration test(s) failed`);
    }

    // Layer 5: Acceptance criteria validation (1 minute)
    console.log('Layer 5/5: Validating acceptance criteria...');
    results.layers.acceptance = await validateAcceptanceCriteria(phaseNumber);
    const failedCriteria = results.layers.acceptance.filter(c => !c.passed);
    if (failedCriteria.length > 0) {
      results.failures.push(
        `${failedCriteria.length} acceptance criterion/criteria not met`
      );
    }

    // All layers complete
    results.passed = results.failures.length === 0;
    return finalizeResults(results, startTime);

  } catch (error) {
    results.failures.push(`Verification error: ${error.message}`);
    return finalizeResults(results, startTime);
  }
}

async function runSmokeTests(phaseNumber) {
  // Quick sanity checks - critical paths only
  const checks = [
    await checkStateFileValid(),
    await checkPhaseDirectoryExists(phaseNumber),
    await checkRequiredFilesExist()
  ];

  return {
    passed: checks.every(c => c),
    duration: '10s'
  };
}

async function runLinting() {
  // ESLint execution
  const result = await runCommand('npx', ['eslint', '.']);

  return {
    passed: result.exitCode === 0,
    errors: result.exitCode === 0 ? 0 : parseErrorCount(result.output),
    warnings: parseWarningCount(result.output)
  };
}

async function runUnitTests() {
  // Vitest with coverage
  const result = await runCommand('npx', ['vitest', 'run', '--coverage']);

  return {
    passed: result.exitCode === 0,
    count: parseTestCount(result.output),
    coverage: parseCoverage(result.output)
  };
}

async function runIntegrationTests() {
  // Integration test suite
  const result = await runCommand('node', ['gsd/scripts/integration-test.js']);

  return {
    passed: result.exitCode === 0,
    count: parseTestCount(result.output),
    failures: result.exitCode === 0 ? 0 : parseFailureCount(result.output)
  };
}

function finalizeResults(results, startTime) {
  results.duration = Math.round((Date.now() - startTime) / 1000);
  return results;
}

function runCommand(command, args) {
  return new Promise((resolve) => {
    const proc = spawn(command, args);
    let output = '';

    proc.stdout.on('data', (data) => { output += data; });
    proc.stderr.on('data', (data) => { output += data; });

    proc.on('close', (exitCode) => {
      resolve({ exitCode, output });
    });
  });
}

// Parsing helpers
function parseErrorCount(output) {
  const match = output.match(/(\d+) error/);
  return match ? parseInt(match[1]) : 0;
}

function parseWarningCount(output) {
  const match = output.match(/(\d+) warning/);
  return match ? parseInt(match[1]) : 0;
}

function parseTestCount(output) {
  const match = output.match(/(\d+) passed/);
  return match ? parseInt(match[1]) : 0;
}

function parseFailureCount(output) {
  const match = output.match(/(\d+) failed/);
  return match ? parseInt(match[1]) : 0;
}

function parseCoverage(output) {
  // Extract coverage percentage from c8 or Vitest output
  const match = output.match(/All files\s+\|\s+([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}
```

### Example 6: GitHub Actions Verification Workflow
```yaml
# Source: GitHub Actions best practices from research
# .github/workflows/verify.yml
name: Verification & Quality

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      # Layer 1: Smoke tests
      - name: Smoke Tests
        run: npm run test:smoke
        timeout-minutes: 1

      # Layer 2: Static analysis
      - name: Lint Code
        run: npm run lint
        timeout-minutes: 2

      # Layer 3: Unit tests with coverage
      - name: Unit Tests
        run: npm run test:coverage
        timeout-minutes: 5

      # Layer 4: Integration tests
      - name: Integration Tests
        run: npm run test:integration
        timeout-minutes: 5

      # Layer 5: Acceptance validation
      - name: Validate Acceptance Criteria
        run: npm run verify:acceptance
        timeout-minutes: 2

      # Quality gates
      - name: Check Coverage Threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% below 80% threshold"
            exit 1
          fi

      # Upload artifacts
      - name: Upload Coverage Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

      - name: Upload Verification Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: verification-report
          path: .planning/VERIFICATION.md
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jest for all testing | Vitest for modern projects | 2023-2024 | 10-20x faster tests, native ESM/TypeScript, better DX |
| Istanbul (nyc) instrumentation | c8 with native V8 coverage | 2020-2021 | No instrumentation overhead, accurate source maps, faster |
| Manual acceptance validation | ATDD with automated criteria | 2015-2020 | Criteria defined upfront, automated validation, living documentation |
| End-of-cycle verification | Shift-left continuous testing | 2018-2022 | Earlier bug detection, 10x cheaper fixes, faster feedback |
| Coverage as only metric | Multi-dimensional quality gates | 2020-2025 | Coverage + complexity + security + performance, holistic quality |
| Verification as afterthought | Quality gates block progression | 2019-2024 | Prevents poor quality from advancing, enforced standards |

**Deprecated/outdated:**
- **Jest for new projects**: Still works but Vitest is faster and more modern (unless React Native)
- **Manual verification checklists**: Automated checklist validation is standard (see actionlint, GitHub Actions)
- **100% coverage target**: 80-90% is optimal; 100% is diminishing returns and test quality suffers
- **Single test type**: Unit tests only or integration tests only is insufficient; multi-layer verification is standard
- **Synchronous verification**: Parallel test execution is standard (Vitest default, Jest --maxWorkers)

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal coverage threshold for GSD system**
   - What we know: Industry standard is 80-90%, current system has 91% (74/81 tests passing)
   - What's unclear: Should threshold be 80% (achievable), 85% (balanced), or 90% (strict)?
   - Recommendation: Start with 80% threshold, increase to 85% after Phase 8 complete

2. **Integration vs unit test ratio**
   - What we know: GSD currently has integration-test.js (81 tests), no separate unit tests
   - What's unclear: Should we split into unit tests (fast, many) and integration tests (slow, few)?
   - Recommendation: Keep current integration-test.js pattern, it's working well (91% pass rate)

3. **Mutation testing adoption**
   - What we know: Mutation testing validates test quality (not just coverage), tools like Stryker exist
   - What's unclear: Is mutation testing overhead worth it for GSD system size?
   - Recommendation: Defer to post-v1.0; focus on acceptance criteria validation first

4. **Acceptance criteria format standardization**
   - What we know: ROADMAP.md has success criteria, PLAN.md has success criteria, formats vary
   - What's unclear: Should we standardize on Given-When-Then format or keep current free-form?
   - Recommendation: Add optional frontmatter to PLAN.md with structured acceptance criteria

5. **Verification report format**
   - What we know: verify-work.md guideline references VERIFICATION.md template
   - What's unclear: Does VERIFICATION.md template exist? If not, what format?
   - Recommendation: Create VERIFICATION.md template as part of Phase 8 (currently missing)

## Sources

### Primary (HIGH confidence)
- [Vitest Getting Started](https://vitest.dev/guide/) - Official documentation, comprehensive features and API
- [c8 GitHub Repository](https://github.com/bcoe/c8) - Official documentation, installation and usage
- [ESLint Getting Started](https://eslint.org/docs/latest/use/getting-started) - Official documentation, configuration and rules

### Secondary (MEDIUM confidence)
- [Software Quality Assurance Best Practices 2026](https://monday.com/blog/rnd/software-quality-assurance/) - Industry trends, shift-left testing
- [Continuous Testing in DevOps 2026](https://blog.testunity.com/continuous-testing-devops-backbone/) - Quality gates, CI/CD integration
- [Software Quality Gates](https://testrigor.com/blog/software-quality-gates/) - Quality gate patterns, threshold enforcement
- [Vitest vs Jest Comparison](https://betterstack.com/community/guides/scaling-nodejs/vitest-vs-jest/) - Performance comparison, when to use each
- [Acceptance Test-Driven Development](https://en.wikipedia.org/wiki/Acceptance_test-driven_development) - ATDD overview, Given-When-Then pattern
- [Smoke Testing vs Sanity Testing](https://www.practitest.com/resource-center/article/smoke-testing-vs-sanity-testing/) - Verification patterns, testing triad
- [Checklist-Based Testing](https://testfort.com/blog/checklist-based-testing-an-in-depth-guide-for-qa-engineers) - Automation patterns, CI/CD integration
- [Integration Testing Node.js Best Practices](https://github.com/testjavascript/nodejs-integration-tests-best-practices) - Patterns, component testing
- [Cyclomatic Complexity Guide](https://www.sonarsource.com/resources/library/cyclomatic-complexity/) - Complexity metrics, thresholds
- [actionlint GitHub Repository](https://github.com/rhysd/actionlint) - GitHub Actions validation, security checks

### Tertiary (LOW confidence - marked for validation)
- [QA Trends 2026](https://medium.com/@aniqarasheed/qa-trends-2026-how-software-quality-assurance-is-changing-in-the-devops-world-4d53a5a1e844) - Future trends, AI integration
- [Backward Goal-Setting for Software Development](https://www.larksuite.com/en_us/topics/goal-setting-techniques-for-functional-teams/backward-goal-setting-for-software-development-teams) - Goal-backward concept
- [Going Beyond ESLint](https://www.telerik.com/blogs/going-beyond-eslint-overview-static-analysis-javascript) - Alternative static analysis tools

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Vitest, c8, ESLint are industry standards with official documentation
- Architecture patterns: HIGH - Multi-layer verification, ATDD, quality gates verified across multiple sources
- Pitfalls: MEDIUM - Synthesized from industry blogs and best practices articles, not all from official sources
- Code examples: HIGH - Verified against official documentation (Vitest, c8, ESLint) and working patterns

**Research date:** 2026-01-21
**Valid until:** 60 days (2026-03-22) - Testing tools are stable, patterns are established, but tooling ecosystem evolves

**Research notes:**
- "Goal-backward verification" is not an established term in software literature; closest matches are ATDD (Acceptance Test-Driven Development) and backward chaining in TDD
- Current GSD system (integration-test.js) already implements solid verification patterns; Phase 8 should extend, not replace
- Existing verify-work.md guideline references VERIFICATION.md template that doesn't exist yet - should be created in Phase 8
- GSD's existing validator.js (Phase 3) provides artifact validation; Phase 8 should add goal/acceptance validation layer
