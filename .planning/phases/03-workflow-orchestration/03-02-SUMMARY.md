---
phase: 03-workflow-orchestration
plan: 02
subsystem: validation
tags: [ajv, markdownlint, json-schema, artifact-validation, state-validation]

# Dependency graph
requires:
  - phase: 02-core-infrastructure
    provides: File operations (readFile), state management patterns (validateStateData)
provides:
  - Two-layer artifact validation (schema + structure)
  - Requirement coverage validation (100% traceability)
  - State structure validation
  - ARTIFACT_SCHEMAS for PROJECT.md, ROADMAP.md, REQUIREMENTS.md
affects: [03-03-resume-manager, phase-transition-logic, artifact-generation]

# Tech tracking
tech-stack:
  added: [markdownlint@0.36.1]
  patterns: [two-layer-validation, validation-before-write, error-accumulation]

key-files:
  created: [gsd/scripts/validator.js]
  modified: [gsd/package.json, gsd/package-lock.json, gsd/scripts/integration-test.js]

key-decisions:
  - "Two-layer validation: JSON Schema for metadata + regex for required sections"
  - "Accumulate all errors before throwing (comprehensive validation reports)"
  - "Error messages include line numbers and remediation commands"
  - "Requirement coverage validation detects orphaned requirements"

patterns-established:
  - "Validation pattern: escapeRegex for section matching, estimateLineNumber for error context"
  - "Error format: 'Missing section: X (expected around line Y). Fix: [command]'"
  - "ARTIFACT_SCHEMAS constant defines validation rules for each artifact type"

# Metrics
duration: 15min
completed: 2026-01-19
---

# Phase 3 Plan 2: Artifact Validation Summary

**Two-layer validation system with JSON Schema for metadata and regex for structure checking, providing specific error messages with line numbers and remediation**

## Performance

- **Duration:** 15 min
- **Started:** 2026-01-19T00:06:20Z
- **Completed:** 2026-01-19T00:21:00Z (estimated)
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Created validator.js with three exported functions (validateArtifact, validateRequirementCoverage, validateStateStructure)
- Implemented two-layer validation: JSON Schema for YAML frontmatter + regex for required markdown sections
- Added comprehensive error messages with line numbers and remediation commands
- Integrated validation tests into existing integration test suite (37 tests total, 100% pass rate)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install markdownlint dependency** - `0f27f16` (chore)
2. **Task 2: Create validator.js with two-layer validation** - `735c38b` (feat)
3. **Task 3: Add integration tests for validation** - `f48d113` (test)

## Files Created/Modified
- `gsd/scripts/validator.js` - Two-layer artifact validation with three exported functions
- `gsd/package.json` - Added markdownlint@0.36.1 dependency
- `gsd/package-lock.json` - Lockfile updated with markdownlint and 9 sub-dependencies
- `gsd/scripts/integration-test.js` - Added Test Suite 8 with 5 validation tests

## Decisions Made

**1. Two-layer validation approach**
- Layer 1: JSON Schema validation for YAML frontmatter using Ajv (already installed)
- Layer 2: Required section checking using regex patterns
- Rationale: JSON Schema handles metadata structure; regex handles markdown-specific validation (section presence). Combining both ensures complete artifact validation.

**2. Error accumulation before throwing**
- Collect all validation errors before throwing exception
- Rationale: User sees all issues at once instead of fixing one error at a time. Improves debugging experience.

**3. Specific remediation in error messages**
- Format: "Missing section: X (expected around line Y). Fix: echo '## X' >> file.md"
- Rationale: CONTEXT.md requirement: "Specific error messages with remediation". Provides actionable guidance.

**4. ARTIFACT_SCHEMAS constant for validation rules**
- Centralized schema definitions for PROJECT.md, ROADMAP.md, REQUIREMENTS.md
- Each artifact defines requiredSections + metadataSchema
- Rationale: Extensible pattern for adding new artifact types. Clear separation between structural and metadata validation.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Issue 1: Requirement coverage validation detects v2 requirements**
- **Problem:** validateRequirementCoverage found orphaned requirements (v2 requirements in REQUIREMENTS.md not in ROADMAP.md traceability table)
- **Resolution:** This is correct behavior - v2 requirements are intentionally not mapped yet. Validation working as designed. Not an error.
- **Impact:** None. Validation function works correctly; v2 requirements will be mapped in future roadmap update.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 3 Plan 3 (Resume Manager and Workflow Orchestrator):**
- Validation infrastructure complete
- Can validate artifacts before marking phases complete
- Can check requirement coverage during roadmap generation
- Can validate state structure before resume

**Integration points for next plan:**
- Use `validateArtifact()` before phase transitions
- Use `validateRequirementCoverage()` during roadmap validation
- Use `validateStateStructure()` before resuming workflow

**Requirements fulfilled:**
- VALID-01: Validates required sections in artifacts ✓
- VALID-02: Checks requirement traceability ✓
- VALID-03: Verifies STATE.md structure ✓
- VALID-04: Prevents invalid phase transitions (schema enforcement) ✓
- VALID-05: Clear validation error messages with remediation ✓

---
*Phase: 03-workflow-orchestration*
*Completed: 2026-01-19*
