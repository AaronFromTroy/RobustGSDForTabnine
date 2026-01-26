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
# 1. Run comprehensive verification (all 5 layers)
node gsd/scripts/verifier.js --phase=${PHASE_NUM}

# 2. If verification failed, generate report
node gsd/scripts/verification-report.js --phase=${PHASE_NUM} --results="${RESULTS_JSON}"

# 3. Present results to user and WAIT for approval (see Approval Protocol section)
#    DO NOT PROCEED TO STEP 4 until user reviews and approves

# 4. Update STATE.md (ONLY after user approval)
node gsd/scripts/state-manager.js --update verification="${RESULT}" verifiedDate="${DATE}"

# 5. Create git commit (if verification passed)
git add .planning/STATE.md ".planning/phases/${PHASE_DIR}/VERIFICATION.md"
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
- **Update STATE.md before user reviews verification results (critical - user must see results first)**
- **Suggest next phase before user approves verification (causes premature advancement)**
- Ignore missing requirements coverage
- Skip artifact structure validation
- Proceed to next phase with failing verification (unless user explicitly approves)
- Modify STATE.md manually (always use state-manager.js)

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

1.5. **Present results and wait for user approval:**

   a. **Format results summary showing:**
      - Each layer result (✓ PASSED or ✗ FAILED)
      - Test counts and coverage percentages
      - Criteria met/total
      - Duration
      - Any warnings or issues

   b. **If verification PASSED:**
      - Show summary with all green checkmarks
      - Say: "All verification layers passed. Say 'approved' or 'looks good' to mark phase as verified."
      - **WAIT** for user approval phrase (see Approval Protocol section)

   c. **If verification FAILED:**
      - Show summary with failure details
      - Reference VERIFICATION.md for remediation
      - Ask user: "Fix issues now, proceed anyway (not recommended), or review details?"
      - **WAIT** for user decision
      - Do NOT update STATE.md as "verified" if failed

   d. **After user approves** (passed case) or decides (failed case):
      - Proceed to step 3 (Update STATE.md)

2. **Generate report if failed:**
   - If verification passed: skip report generation
   - If verification failed:
     a. Execute verification-report.js
     b. Generates VERIFICATION.md using template
     c. Saves to phase directory

3. **Update STATE.md (only after user approval):**

   **CRITICAL:** This step only executes AFTER user approval from step 1.5
   - Execute state-manager.js with verification result
   - If passed: verification="passed", verifiedDate="${DATE}"
   - If failed: verification="failed", include issue summary

4. **Report results:**
   - If passed: "Phase ${PHASE_NUM} verification passed. All ${LAYERS_COUNT} layers complete."
   - If failed: "Phase ${PHASE_NUM} verification failed. See VERIFICATION.md for ${ISSUE_COUNT} issue(s)."

## Approval Protocol

After verification completes, WAIT for user to review results before updating STATE.md.

**Trigger Phrases (case-insensitive):**
- "looks good" / "lgtm"
- "approved" / "approve"
- "continue" / "proceed"
- "next phase"
- "mark verified"
- "ship it"

**Verification States:**

**1. Verification PASSED:**
```
Agent: ✓ Phase X verification complete

Results:
✓ Smoke tests: PASSED
✓ Linting: PASSED (0 errors, 3 warnings)
✓ Unit tests: PASSED (45/45 tests, 92% coverage)
✓ Integration tests: PASSED (12/12 tests)
✓ Acceptance criteria: PASSED (5/5 criteria met)

Duration: 4m 23s

All verification layers passed. Say "approved" or "looks good" to mark phase as verified.

[WAITING FOR USER...]

User: approved

Agent: ✓ Approval detected

node gsd/scripts/state-manager.js --update verification="passed" verifiedDate="2026-01-26"

✓ Phase X marked as verified
✓ Ready for next phase
```

**2. Verification FAILED:**
```
Agent: ✗ Phase X verification failed

Results:
✓ Smoke tests: PASSED
✓ Linting: PASSED
✗ Unit tests: FAILED (43/45 tests, 78% coverage - below 80% threshold)
✓ Integration tests: PASSED
✗ Acceptance criteria: FAILED (4/5 criteria met)

Failures:
1. Coverage below threshold (78% vs 80% required)
2. Success criterion not met: "All guidelines have examples"

See VERIFICATION.md for detailed remediation steps.

Recommendation: Fix issues before proceeding to next phase.

Do you want to:
1. Fix issues now
2. Proceed anyway (not recommended)
3. Review VERIFICATION.md for details

[WAITING FOR USER DECISION...]
```

**Critical Sequence:**
```
Run verification (automatic)
      ↓
Generate results
      ↓
Present results to user
      ↓
[WAIT] ← DO NOT UPDATE STATE YET
      ↓
User reviews and approves
      ↓
node gsd/scripts/state-manager.js --update verification="passed"
      ↓
Create git commit (only if passed)
      ↓
Announce next action
```

**NEVER:**
- Update STATE.md before user reviews verification results
- Mark phase verified without user approval
- Suggest next phase before state update
- Manually edit STATE.md (always use state-manager.js)

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

**IMPORTANT:** Only announce next action AFTER user approves and STATE.md is updated.

**Sequence:**
1. Wait for user approval (see Approval Protocol)
2. Update STATE.md using state-manager.js
3. Create git commit (if passed)
4. **THEN** announce to user:

After user approves verification results:

- If passed: "Phase ${PHASE_NUM} verified and approved. Ready for Phase ${PHASE_NUM + 1}."
- If failed: "Phase ${PHASE_NUM} verification failed (${ISSUE_COUNT} issues). See VERIFICATION.md for remediation."
- If all phases complete: "All phases verified. Project milestone complete!"

**Do not suggest next action until STATE.md is updated.**
