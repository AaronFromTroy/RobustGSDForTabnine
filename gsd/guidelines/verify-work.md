---
version: "1.0.0"
type: "guideline"
workflow: "verify-work"
last_updated: "2026-01-18"
schema: "gsd-guideline-v1"
---

# Verify Work Workflow

This guideline enables Tabnine to validate completed phases against success criteria and requirements.

## Commands

Execute these exact commands in sequence:

```bash
# Run comprehensive verification (all 5 layers)
node gsd/scripts/verifier.js --phase=${PHASE_NUM}

# If verification failed, generate report
node gsd/scripts/verification-report.js --phase=${PHASE_NUM} --results="${RESULTS_JSON}"

# Update STATE.md
node gsd/scripts/state-manager.js --update verification="${RESULT}" verifiedDate="${DATE}"

# Create git commit (if verification passed)
git add .planning/STATE.md .planning/phases/${PHASE_DIR}/VERIFICATION.md
git commit -m "docs(phase-${PHASE_NUM}): verification ${RESULT}

- Smoke tests: ${SMOKE_RESULT}
- Linting: ${LINT_RESULT} (${ERROR_COUNT} errors, ${WARNING_COUNT} warnings)
- Unit tests: ${UNIT_RESULT} (${TEST_COUNT} tests, ${COVERAGE}% coverage)
- Integration tests: ${INTEGRATION_RESULT}
- Acceptance criteria: ${ACCEPTANCE_RESULT} (${CRITERIA_MET}/${CRITERIA_TOTAL})

Co-Authored-By: Tabnine Agent <noreply@tabnine.com>"
```

## Testing

Validate workflow completion by checking:

1. Smoke tests pass (STATE.md valid, phase directory exists, required artifacts exist)
2. Linting has no errors (warnings allowed)
3. Unit tests pass with coverage ≥ 80%
4. Integration tests pass (all test suites)
5. Acceptance criteria validated (all success criteria from ROADMAP.md met)
6. STATE.md shows verification status (passed or issues documented)
7. If issues found, VERIFICATION.md exists with remediation guidance

## Project Structure

After workflow completion:

```
.planning/
├── STATE.md                        # Updated with verification status
└── phases/
    └── XX-name/
        ├── XX-01-PLAN.md
        ├── XX-01-SUMMARY.md
        └── VERIFICATION.md         # Only if issues found
```

## Code Style

Validation follows explicit checks:

**Artifact structure validation:**
```javascript
// Example: Verify PROJECT.md has required sections
const requiredSections = [
  "What This Is",
  "Core Value",
  "Requirements",
  "Context",
  "Constraints"
];
// Check each section exists in document
```

**Requirements coverage validation:**
```javascript
// Example: Verify all requirements mapped
const unmappedRequirements = requirements.filter(req =>
  !roadmap.phases.some(phase => phase.requirements.includes(req.id))
);
// If unmappedRequirements.length > 0, fail validation
```

## Git Workflow

**Commit message format:**
```
docs(phase-X): verification [passed|failed]

- [Artifact count and status]
- [Requirements coverage percentage]
- [Success criteria results]

Co-Authored-By: Tabnine Agent <noreply@tabnine.com>
```

**Verification commits:**
- Only commit if verification passed
- If failed, create VERIFICATION.md but do not commit STATE.md as "verified"

## Boundaries

### Always Do

- Validate all artifacts before marking phase verified
- Check 100% requirements coverage in roadmap
- Verify all success criteria from ROADMAP.md met
- Create VERIFICATION.md if any issues found
- Provide remediation guidance for each issue

### Ask First

- Approving phase despite failed validation
- Skipping verification checks
- Modifying validation criteria

### Never Do

- Mark phase verified without running all checks
- Ignore missing requirements coverage
- Skip artifact structure validation
- Proceed to next phase with failing verification

## Workflow Steps

1. **Run multi-layer verification:**
   - Execute verifier.js with phase number
   - verifier.js orchestrates all 5 layers:
     a. Smoke tests (critical file checks)
     b. Static analysis (linting)
     c. Unit tests with coverage (integration-test.js)
     d. Integration tests (integration-test.js)
     e. Acceptance criteria (goal-validator.js)
   - Returns comprehensive results object

2. **Generate report if failed:**
   - If verification passed: skip report generation
   - If verification failed:
     a. Execute verification-report.js
     b. Generates VERIFICATION.md using template
     c. Saves to phase directory

3. **Update STATE.md:**
   - Execute state-manager.js with verification result
   - If passed: verification="passed", verifiedDate="${DATE}"
   - If failed: verification="failed", include issue summary

4. **Report results:**
   - If passed: "Phase ${PHASE_NUM} verification passed. All ${LAYERS_COUNT} layers complete."
   - If failed: "Phase ${PHASE_NUM} verification failed. See VERIFICATION.md for ${ISSUE_COUNT} issue(s)."

## Verification Layers

The verification system uses 5 layers executed in sequence:

**Layer 1: Smoke Tests (10 seconds)**
- Critical file existence (STATE.md, phase directory, PROJECT.md, ROADMAP.md, REQUIREMENTS.md)
- Fail-fast: if smoke tests fail, verification stops immediately

**Layer 2: Static Analysis (20 seconds)**
- ESLint code quality checks
- Fail-fast: if linting errors found, verification stops (warnings allowed)

**Layer 3: Unit Tests (1-2 minutes)**
- Execute integration-test.js for all test suites
- Check coverage threshold (80% default, configurable)
- Continue even if coverage below threshold (accumulates failure)

**Layer 4: Integration Tests (2-3 minutes)**
- Execute integration-test.js end-to-end workflows
- Validate component interactions
- Continue even if tests fail (accumulates failure)

**Layer 5: Acceptance Criteria (1 minute)**
- Validate success criteria from ROADMAP.md
- Check deliverables, requirements coverage, phase goals
- Continue to complete all criteria checks (accumulates failures)

**Total duration:** 4-6 minutes for complete verification

## Success Criteria

Workflow is complete when:

1. Smoke tests passed (all critical files exist and are valid)
2. Linting passed (no errors, warnings acceptable)
3. Unit tests passed with coverage ≥ 80%
4. Integration tests passed (all test suites)
5. Acceptance criteria validated (all success criteria from ROADMAP.md met)
6. STATE.md shows verification result (passed or failed with issue count)
7. If failed, VERIFICATION.md exists with layer-by-layer results and remediation
8. Git commit created (only if verification passed)

## Validation Examples

**JSON Schema validation for .gsd-config.json:**
```bash
node gsd/scripts/validator.js --schema=config --file=gsd/.gsd-config.json
# Validates against gsd/config-schema.json
# Returns: pass/fail with specific errors
```

**Artifact section checks for PROJECT.md:**
```bash
node gsd/scripts/validator.js --check=sections --file=.planning/PROJECT.md --required="What This Is,Core Value,Requirements"
# Parses markdown headings
# Confirms each required section exists
# Returns: pass/fail with missing sections list
```

**Requirements traceability:**
```bash
node gsd/scripts/validator.js --check=traceability
# Reads REQUIREMENTS.md for all v1 requirements
# Reads ROADMAP.md for phase mappings
# Confirms every requirement mapped to a phase
# Returns: pass/fail with unmapped requirements list
```

## Error Messages and Remediation

**Artifact structure failure:**
```
ERROR: PROJECT.md missing required section "Core Value"
REMEDIATION: Add ## Core Value section with project's core value proposition
PRIORITY: Critical (blocks phase verification)
```

**Requirements coverage failure:**
```
ERROR: Requirements CORE-03, CORE-04 not mapped to any phase
REMEDIATION: Update ROADMAP.md to assign these requirements to a phase
PRIORITY: Critical (blocks roadmap completion)
```

**Success criteria failure:**
```
ERROR: Success criterion "Developer can copy gsd/ directory" not met (gsd/README.md missing)
REMEDIATION: Create gsd/README.md with installation instructions
PRIORITY: High (blocks phase completion)
```

## Next Action

After successful verification:
- "Phase ${PHASE_NUM} verified. Ready to proceed to Phase ${NEXT_PHASE_NUM}."
- If all phases complete: "All phases verified. Project milestone complete!"

After failed verification:
- "Phase ${PHASE_NUM} verification failed. ${ISSUE_COUNT} issue(s) found. See VERIFICATION.md for remediation steps."
- Recommended: Fix issues before proceeding to next phase
