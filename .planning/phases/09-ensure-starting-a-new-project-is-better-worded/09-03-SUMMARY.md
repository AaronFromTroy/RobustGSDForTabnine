---
phase: 09-ensure-starting-a-new-project-is-better-worded-even-when-work-withing-an-existing-application-that-is-simply-intializing-gsd-for-the-first
plan: 03
subsystem: workflow
tags: [initialization, onboarding, ux, goal-oriented, codebase-detection]

# Dependency graph
requires:
  - phase: 09-01
    provides: Script messaging updates with initialization terminology
provides:
  - Goal-oriented initialization workflow (asks "what do you want to accomplish")
  - Workflow branching logic (new vs existing projects)
  - Codebase detection and research integration
  - Updated new-project.md guideline with conditional execution
affects: [09-04, future-onboarding-improvements]

# Tech tracking
tech-stack:
  added: []
  patterns: [goal-oriented-questioning, workflow-branching, conditional-research]

key-files:
  created: []
  modified: [gsd/guidelines/new-project.md]

key-decisions:
  - "Ask 'what do you want to accomplish' instead of requesting project name/value upfront"
  - "Derive project name from directory name, ask only if ambiguous"
  - "Derive core value from user's stated goals"
  - "Branch workflow based on existing vs new project detection"
  - "Research existing codebases before generating requirements"
  - "Conditional execution pattern for research step"

patterns-established:
  - "Goal-oriented questioning: Ask user goals, derive metadata from answers"
  - "Workflow branching: Explicit paths for new vs existing project contexts"
  - "Conditional research: Only analyze codebase when existing code detected"

# Metrics
duration: 5min
completed: 2026-01-22
---

# Phase 9 Plan 3: Guideline Workflow Updates Summary

**Goal-oriented initialization workflow with codebase detection and conditional research integration for existing projects**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-22T21:26:14Z
- **Completed:** 2026-01-22T21:31:29Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments
- Changed new-project.md to ask "what do you want to accomplish?" instead of requesting metadata
- Added workflow branching section explaining two initialization paths (new vs existing)
- Integrated codebase detection step and conditional research for existing projects
- Updated commands to show conditional execution based on detection results
- Established goal-oriented questioning pattern for better UX alignment

## Task Commits

Each task was committed atomically:

1. **Task 1: Change questioning approach in Workflow Steps section** - `a0e638b` (feat)
2. **Task 2: Add existing project detection step** - `da2a02c` (feat)
3. **Task 3: Integrate codebase research for existing projects** - `ec650ad` (feat)

## Files Created/Modified
- `gsd/guidelines/new-project.md` - Updated workflow to be goal-oriented with branching logic for new vs existing projects

## Decisions Made

**1. Goal-oriented questioning instead of metadata requests**
- **Rationale:** Research (09-RESEARCH.md) shows asking for goals → deriving value is more natural than asking for "core value" upfront. Users know what they want to build, not necessarily how to articulate abstract metadata.

**2. Derive project name from directory name**
- **Rationale:** Most projects already have a directory name. Asking again creates friction. Use directory name as default, ask only if it's generic (like "project" or "app").

**3. Explicit workflow branching section**
- **Rationale:** Makes branching logic explicit and findable. Executor can quickly see "there are two paths" without parsing prose. Pattern from Azure CLI research.

**4. Conditional research only for existing projects**
- **Rationale:** New projects don't need research (nothing to research). Existing projects MUST have research to avoid generating blind requirements that conflict with existing architecture.

**5. Reference scripts to be created in plan 09-04**
- **Rationale:** Guideline updates (09-03) precede script implementation (09-04). Guideline now references codebase-detector.js and codebase-researcher.js which will be created next.

## Deviations from Plan

None - plan executed exactly as written. All 3 tasks completed successfully with verification passing for each.

## Issues Encountered

None - workflow updates proceeded smoothly.

## User Setup Required

None - no external service configuration required. This plan updated guideline documentation only.

## Next Phase Readiness

**Ready for plan 09-04:** Script implementation plan can now implement:
- `codebase-detector.js` - Detects existing project indicators (referenced in new-project.md step 2)
- `codebase-researcher.js` - Analyzes tech stack and architecture (referenced in new-project.md step 3)
- CODEBASE.md template - Structured findings format (referenced in new-project.md testing section)

**Workflow coherence:** new-project.md now has clear workflow branching with references to detection and research scripts. Plan 09-04 will make those references functional.

**No blockers:** Guideline updates complete and committed. Ready for script implementation.

---
*Phase: 09-ensure-starting-a-new-project-is-better-worded-even-when-work-withing-an-existing-application-that-is-simply-intializing-gsd-for-the-first*
*Completed: 2026-01-22*
