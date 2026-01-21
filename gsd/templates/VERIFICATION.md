---
version: "1.0.0"
type: "template"
artifact: "VERIFICATION"
schema: "gsd-verification-v1"
phase: ${phase}
verified: ${verified}
timestamp: "${timestamp}"
passed: ${passed}
failures_count: ${failures_count}
layers:
  smoke: ${layers_smoke_passed}
  lint: ${layers_lint_passed}
  unit: ${layers_unit_passed}
  integration: ${layers_integration_passed}
  acceptance: ${layers_acceptance_passed}
variables:
  - phase
  - verified
  - timestamp
  - passed
  - failures_count
  - layers_smoke_passed
  - layers_lint_passed
  - layers_unit_passed
  - layers_integration_passed
  - layers_acceptance_passed
  - duration
  - phase_name
  - failures
  - coverage_lines
  - coverage_branches
  - coverage_functions
  - complexity_avg
  - complexity_max
  - tests_total
  - tests_passed
  - tests_failed
  - next_action
---

# Phase ${phase}: ${phase_name} - Verification Report

**Verified:** ${verified}
**Timestamp:** ${timestamp}
**Result:** ${passed ? 'PASSED' : 'FAILED'}
**Duration:** ${duration}

## Executive Summary

Phase ${phase} verification ${passed ? 'passed' : 'failed'} all quality gates.

${passed ?
  `All verification layers completed successfully:
- Smoke tests: PASSED
- Static analysis: PASSED
- Unit tests: PASSED
- Integration tests: PASSED
- Acceptance criteria: PASSED

Phase is ready for completion.` :
  `Verification failed with ${failures_count} issue(s). See "Failed Criteria" section below for remediation guidance.`
}

## Verification Layers

### Layer 1: Smoke Tests
**Status:** ${layers_smoke_passed ? 'PASSED' : 'FAILED'}
**Purpose:** Build stability and critical path validation

${layers_smoke_passed ?
  'All smoke tests passed. Build is stable.' :
  'Smoke tests failed. Critical issues detected - see failures below.'
}

### Layer 2: Static Analysis (Linting)
**Status:** ${layers_lint_passed ? 'PASSED' : 'FAILED'}
**Purpose:** Code quality and style consistency

${layers_lint_passed ?
  'No linting errors detected. Code meets quality standards.' :
  'Linting errors detected - see failures below for specific issues.'
}

### Layer 3: Unit Tests
**Status:** ${layers_unit_passed ? 'PASSED' : 'FAILED'}
**Purpose:** Isolated component behavior validation

${layers_unit_passed ?
  'All unit tests passed. Components function correctly in isolation.' :
  'Unit test failures detected - see failures below.'
}

### Layer 4: Integration Tests
**Status:** ${layers_integration_passed ? 'PASSED' : 'FAILED'}
**Purpose:** Component interaction validation

${layers_integration_passed ?
  'All integration tests passed. Components work together correctly.' :
  'Integration test failures detected - see failures below.'
}

### Layer 5: Acceptance Criteria
**Status:** ${layers_acceptance_passed ? 'PASSED' : 'FAILED'}
**Purpose:** Goal-backward validation (features achieve intended outcomes)

${layers_acceptance_passed ?
  'All acceptance criteria met. Phase goals achieved.' :
  'Acceptance criteria failures detected - phase goals not fully met.'
}

## Failed Criteria

${failures_count > 0 ? failures : 'None - all criteria passed.'}

## Quality Metrics

### Code Coverage
- **Lines:** ${coverage_lines}%
- **Branches:** ${coverage_branches}%
- **Functions:** ${coverage_functions}%

**Threshold:** 80% (lines)
**Status:** ${coverage_lines >= 80 ? 'PASSED' : 'FAILED'}

### Code Complexity
- **Average:** ${complexity_avg}
- **Maximum:** ${complexity_max}

**Threshold:** ≤10 per function
**Status:** ${complexity_max <= 10 ? 'PASSED' : 'FAILED'}

### Test Results
- **Total:** ${tests_total}
- **Passed:** ${tests_passed}
- **Failed:** ${tests_failed}

**Pass Rate:** ${tests_total > 0 ? Math.round((tests_passed / tests_total) * 100) : 0}%

## Next Action

${next_action}

---
*Verification completed: ${timestamp}*
*Phase ${phase}: ${phase_name}*
