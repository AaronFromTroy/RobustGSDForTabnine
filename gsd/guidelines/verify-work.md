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
# Validate artifact structure
node gsd/scripts/validator.js --check=artifacts --phase=${PHASE_NUM}

# Validate requirements coverage
node gsd/scripts/validator.js --check=requirements --phase=${PHASE_NUM}

# Validate success criteria
node gsd/scripts/validator.js --check=success-criteria --phase=${PHASE_NUM}

# If issues found, generate VERIFICATION.md
node gsd/scripts/template-renderer.js --template=VERIFICATION --output=.planning/phases/${PHASE_DIR}/VERIFICATION.md --issues="${ISSUES_JSON}"

# Update STATE.md
node gsd/scripts/state-manager.js --update verification="${RESULT}" verifiedDate="${DATE}"

# Create git commit (if verification passed)
git add .planning/STATE.md
git commit -m "docs(phase-${PHASE_NUM}): verification ${RESULT}

- Artifacts validated: ${ARTIFACT_COUNT}
- Requirements coverage: ${COVERAGE_PERCENT}%
- Success criteria: ${CRITERIA_MET}/${CRITERIA_TOTAL}

Co-Authored-By: Tabnine Agent <noreply@tabnine.com>"
```

## Testing

Validate workflow completion by checking:

1. All required artifacts exist and have correct structure
2. Requirements traceability confirmed (all requirements mapped to phases)
3. Success criteria from ROADMAP.md validated
4. STATE.md shows verification status (passed or issues documented)
5. If issues found, VERIFICATION.md exists with remediation guidance

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

1. **Load SUMMARY.md:**
   - Read `.planning/phases/XX-name/XX-NN-SUMMARY.md` for all plans
   - Extract deliverables, tasks completed, files modified

2. **Validate artifact structure:**
   - For each artifact mentioned in deliverables:
     a. Verify file exists
     b. Parse YAML frontmatter (if applicable)
     c. Check all required sections present
     d. Validate section content (not empty)
   - Example: PROJECT.md must have "What This Is", "Core Value", "Requirements"

3. **Check requirements coverage:**
   - Read REQUIREMENTS.md for all v1 requirements
   - Read ROADMAP.md for phase-to-requirement mappings
   - Identify unmapped requirements
   - Verify 100% coverage (every v1 requirement mapped to a phase)

4. **Verify success criteria:**
   - Read ROADMAP.md for phase success criteria
   - For each criterion:
     a. Determine validation method
     b. Execute validation
     c. Record pass/fail
   - Example: "Developer can copy gsd/ directory" → Check gsd/ exists with README.md

5. **Update STATE.md:**
   - Execute state-manager.js with verification result
   - If passed: verification="passed", verifiedDate="${DATE}"
   - If failed: verification="failed", include issue summary

6. **Create VERIFICATION.md if issues found:**
   - Execute template-renderer.js with VERIFICATION template
   - Document each issue:
     - Issue description
     - Affected artifact/requirement
     - Remediation steps
     - Priority (critical, high, medium, low)
   - Write to `.planning/phases/XX-name/VERIFICATION.md`

7. **Report results:**
   - If passed: "Phase ${PHASE_NUM} verification passed. All criteria met."
   - If failed: "Phase ${PHASE_NUM} verification failed. See VERIFICATION.md for ${ISSUE_COUNT} issue(s)."

## Success Criteria

Workflow is complete when:

1. All required artifacts validated (structure checks passed)
2. 100% requirement coverage confirmed (no unmapped requirements)
3. All phase success criteria validated
4. STATE.md shows verification result (passed or failed with issue count)
5. If failed, VERIFICATION.md exists with detailed remediation guidance
6. Git commit created (only if verification passed)

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
