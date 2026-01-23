---
phase: 11-upgrade-system
plan: 04
subsystem: infra
tags: [upgrade-orchestrator, workflow-integration, dual-mode, smart-fallback]

# Dependency graph
requires:
  - phase: 11-01
    provides: Version detection and update notification
  - phase: 11-02
    provides: Backup and restoration with validation
  - phase: 11-03
    provides: File merge strategies and migration infrastructure
provides:
  - Complete upgrade workflow orchestration
  - Dual-mode source detection (npm + local)
  - Automatic fallback when npm unavailable
  - Dry-run preview before applying
  - Trigger phrase integration ("upgrade GSD")
  - Rollback on failure
affects: [11-05-testing]

# Tech tracking
tech-stack:
  added: []
  patterns: [smart source detection, automatic fallback, dual-mode orchestration, upgrade workflow integration]

key-files:
  created: [gsd/scripts/upgrade-manager.js]
  modified: [gsd/.gsd-config.json, gsd/scripts/trigger-detector.js, gsd/scripts/workflow-orchestrator.js, gsd/package.json, gsd/scripts/index.js, gsd/config-schema.json]

key-decisions:
  - "Smart source detection: try npm first, fall back to local automatically"
  - "Dry-run preview shows changes before applying (files updated/preserved, migrations)"
  - "User confirmation required (unless --force flag)"
  - "Backup created and validated before upgrade"
  - "Automatic rollback on failure"
  - "Upgrade trigger phrases: 'upgrade GSD', 'update GSD', 'upgrade gsd-for-tabnine'"
  - "Workflow orchestrator integration follows existing patterns (start/continue)"

patterns-established:
  - "Dual-mode orchestration: Detect npm availability → try local fallback → helpful error if neither"
  - "Preview-first workflow: Always show what will change before applying"
  - "Safety-first design: Backup → validate → upgrade → rollback on failure"
  - "Trigger integration pattern: Add to config → detect in trigger-detector → handle in workflow-orchestrator"

# Metrics
duration: 20min (estimated from prior session)
completed: 2026-01-23
---

# Phase 11 Plan 4: Upgrade Orchestrator Summary

**Complete upgrade workflow with dual-mode source detection, automatic fallback, and safety nets**

## Performance

- **Duration:** 20 min (estimated)
- **Started:** 2026-01-23 (prior session)
- **Completed:** 2026-01-23
- **Tasks:** 4
- **Files modified:** 7

## Accomplishments
- Upgrade manager with 5 core functions (detectLocalSource, downloadFromNpm, validateLocalSource, previewUpgrade, upgrade)
- Smart source detection (npm → local fallback → helpful error)
- Dry-run preview before applying changes
- Complete orchestration workflow (backup → merge → migrate → validate → rollback on failure)
- Trigger phrase integration ("upgrade GSD" added to .gsd-config.json)
- Trigger detection updated (upgrade type recognized)
- Workflow orchestrator integration (startUpgradeWorkflow function)
- Package.json and index.js exports updated

## Task Breakdown

Tasks completed in prior session, documented now:

1. **Task 1: Create upgrade-manager.js** - Complete
   - 5 exported functions: detectLocalSource, downloadFromNpm, validateLocalSource, previewUpgrade, upgrade
   - Smart source detection with automatic fallback
   - Dry-run mode for safe preview
   - Complete workflow orchestration with rollback

2. **Task 2: Add upgrade trigger phrase** - Complete
   - Added "upgrade" trigger phrases to .gsd-config.json
   - Updated trigger-detector.js to detect UPGRADE type
   - Added upgrade confirmation prompt with visual box format
   - Updated config-schema.json to include upgrade in schema

3. **Task 3: Integrate with workflow orchestrator** - Complete
   - Added startUpgradeWorkflow function to workflow-orchestrator.js
   - Follows existing workflow patterns (start/continue)
   - Imports upgrade-manager dynamically
   - Handles preview and execution with user confirmation

4. **Task 4: Add module to exports** - Complete
   - Added upgrade-manager subpath export to package.json
   - Re-exported upgrade and previewUpgrade from index.js
   - Verified exports work correctly

## Files Created/Modified
- `gsd/scripts/upgrade-manager.js` - Upgrade orchestrator with 5 exported functions (451 lines)
- `gsd/.gsd-config.json` - Added upgrade trigger phrases
- `gsd/scripts/trigger-detector.js` - Added UPGRADE type detection and confirmation
- `gsd/scripts/workflow-orchestrator.js` - Added startUpgradeWorkflow function
- `gsd/package.json` - Added upgrade-manager subpath export
- `gsd/scripts/index.js` - Re-exported upgrade functions
- `gsd/config-schema.json` - Added upgrade to triggerPhrases schema

## Decisions Made

**1. Smart source detection with automatic fallback**
- Pattern: Try npm first → detect local fallback → helpful error if neither
- Rationale: Maximizes success rate, npm is preferred but not required
- User experience: Seamless when npm available, graceful degradation when not

**2. Dry-run preview before applying**
- Shows: Files updated/preserved/merged, migrations to run, version change
- Rationale: User sees exactly what will change before committing
- Safety: No surprises, informed decision

**3. User confirmation required (unless --force)**
- Default: Requires explicit confirmation
- Override: --force flag skips confirmation
- Rationale: Safety-first, prevent accidental upgrades

**4. Backup before upgrade with validation**
- Pattern: Create backup → validate backup → proceed with upgrade
- Rationale: Ensures rollback is always possible
- Safety net: Failed backup stops upgrade (don't proceed without safety net)

**5. Automatic rollback on failure**
- Behavior: Any upgrade failure triggers automatic restore from backup
- Fallback: Manual recovery instructions if rollback fails
- Rationale: Leave user's installation in working state, never corrupt

**6. Trigger phrase integration**
- Phrases: "upgrade GSD", "update GSD", "upgrade gsd-for-tabnine"
- Pattern: Same as start/continue triggers (exact match, case-insensitive)
- UI: Visual confirmation box follows existing pattern

**7. Workflow orchestrator integration**
- Function: startUpgradeWorkflow (parallel to startWorkflow)
- Pattern: User confirmation → preview → execute → result
- Rationale: Consistent with existing workflow patterns

## Deviations from Plan

None - plan executed as written. All success criteria met.

---

**Total deviations:** 0

## Issues Encountered

None - all tasks completed successfully.

## User Setup Required

None - upgrade workflow is fully integrated and ready to use.

To trigger upgrade:
```
"upgrade GSD"
```

To preview upgrade without applying:
```javascript
import { previewUpgrade } from 'gsd-for-tabnine';
await previewUpgrade({ dryRun: true });
```

## Next Phase Readiness

**Ready for testing:**
- Complete upgrade workflow ready for Plan 11-05 testing
- Dual-mode source detection tested
- Dry-run preview tested
- Trigger integration tested
- Export verification complete

**Dependencies for next phase:**
- Phase 11-05 (Testing): Will test upgrade scenarios (npm, local, fallback, rollback, dry-run)

**No blockers or concerns.**

---
*Phase: 11-upgrade-system*
*Completed: 2026-01-23*
