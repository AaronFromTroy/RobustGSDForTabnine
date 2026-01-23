---
phase: 10-fix-path-handling-bugs-in-all-guidelines
plan: 01
subsystem: infra
tags: [bash, path-handling, guidelines, bug-fix]

# Dependency graph
requires:
  - phase: 09-improve-initialization-terminology
    provides: Updated guidelines with improved terminology
provides:
  - Robust bash path handling in all workflow guidelines
  - Prevents directory creation failures with variable expansion
affects: [all-phases, new-project, plan-phase, execute-phase, verify-work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Quote all bash paths containing variables"
    - "Use mkdir -p flag for directory creation"

key-files:
  created: []
  modified:
    - gsd/guidelines/plan-phase.md
    - gsd/guidelines/execute-phase.md
    - gsd/guidelines/verify-work.md
    - gsd/guidelines/new-project.md

key-decisions:
  - "Apply -p flag to all mkdir commands for parent directory creation"
  - "Quote all bash paths containing variables to prevent word splitting"
  - "Fix both Commands sections and Workflow Steps documentation for consistency"

patterns-established:
  - "Pattern: mkdir -p \".planning/phases/${PHASE_DIR}\" ensures parent dirs exist"
  - "Pattern: node script.js --output=\"${PATH}\" prevents word splitting on expansion"
  - "Pattern: git add \"${PATH}\" ensures correct path handling with special chars"

# Metrics
duration: 5min
completed: 2026-01-22
---

# Phase 10 Plan 01: Fix Path Handling Bugs In All Guidelines Summary

**All bash commands now use proper quoting and -p flags to prevent .planningphases directory creation bug**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-22T23:53:39Z
- **Completed:** 2026-01-22T23:58:48Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments
- Fixed critical path handling bug that caused `.planningphases` directory creation instead of `.planning/phases/`
- Added proper quoting to all bash paths containing variables across 4 guideline files
- Applied `-p` flag to mkdir commands for robust parent directory creation
- Verified no unquoted variable paths remain in any guideline

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix plan-phase.md path handling** - `3a94f01` (fix)
   - Added -p flag to mkdir commands
   - Quoted paths in git add and node --output commands
   - Fixed both Commands section and Workflow Steps

2. **Task 2: Fix execute-phase.md path handling** - `b95278d` (fix)
   - Quoted all --execute-plan and --output paths
   - Quoted git add paths with variables

3. **Task 3: Fix verify-work.md path handling** - `2ae32bd` (fix)
   - Quoted git add path containing PHASE_DIR variable

4. **Task 4: Fix new-project.md path handling** - `60dbc25` (fix)
   - Added -p flag to mkdir .planning
   - Quoted all --output paths for template-renderer and codebase-researcher
   - Fixed both Commands and Workflow Steps sections

## Files Created/Modified
- `gsd/guidelines/plan-phase.md` - Fixed 3 mkdir commands, 2 git add, 1 node --output
- `gsd/guidelines/execute-phase.md` - Fixed 2 node commands (--execute-plan, --output), 1 git add
- `gsd/guidelines/verify-work.md` - Fixed 1 git add with PHASE_DIR variable
- `gsd/guidelines/new-project.md` - Fixed 2 mkdir commands, 4 node --output commands

## Decisions Made
None - plan executed exactly as written. This was a straightforward bug fix with clear pattern application.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None - all path fixes applied cleanly and verified successfully.

## Path Fixes Summary

### By File
- **plan-phase.md:** 6 fixes (3 mkdir with -p, 2 git add quoted, 1 node --output quoted)
- **execute-phase.md:** 3 fixes (2 node paths quoted, 1 git add quoted)
- **verify-work.md:** 1 fix (git add path quoted)
- **new-project.md:** 6 fixes (2 mkdir with -p, 4 node --output paths quoted)

### By Command Type
- **mkdir:** 5 commands fixed with -p flag and quotes
- **git add:** 4 commands fixed with path quoting
- **node --output:** 6 commands fixed with path quoting
- **node --execute-plan:** 1 command fixed with path quoting

### Before/After Examples

**mkdir (plan-phase.md line 41):**
```bash
# Before:
mkdir .planning/phases/${PHASE_DIR}

# After:
mkdir -p ".planning/phases/${PHASE_DIR}"
```

**git add (plan-phase.md line 71):**
```bash
# Before:
git add .planning/phases/${PHASE_DIR}/

# After:
git add ".planning/phases/${PHASE_DIR}/"
```

**node --output (execute-phase.md line 25):**
```bash
# Before:
node gsd/scripts/template-renderer.js --template=SUMMARY --output=.planning/phases/${PHASE_DIR}/${PHASE}-${PLAN}-SUMMARY.md

# After:
node gsd/scripts/template-renderer.js --template=SUMMARY --output=".planning/phases/${PHASE_DIR}/${PHASE}-${PLAN}-SUMMARY.md"
```

## Verification Results

All verification checks passed:

1. ✓ All mkdir commands now have -p flag
2. ✓ All bash paths containing variables are wrapped in double quotes
3. ✓ Pattern grep commands return empty results (no unquoted variable paths)
4. ✓ No `.planningphases` or similar malformed directories can be created
5. ✓ Only the four guideline files were modified

### Test Case
The original bug scenario is now fixed:
```bash
PHASE_DIR="04-something"

# Old pattern (BROKEN):
# mkdir .planning/phases/${PHASE_DIR}
# Could create: .planningphases04-something

# New pattern (FIXED):
mkdir -p ".planning/phases/${PHASE_DIR}"
# Creates: .planning/phases/04-something/
```

## Next Phase Readiness
- Critical bug fixed - all dynamic phase operations now safe
- Guidelines are consistent in path handling patterns
- No blockers for future work

---
*Phase: 10-fix-path-handling-bugs-in-all-guidelines*
*Completed: 2026-01-22*
