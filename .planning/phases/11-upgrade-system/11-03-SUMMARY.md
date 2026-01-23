---
phase: 11-upgrade-system
plan: 03
subsystem: infra
tags: [file-merger, migrations, config-merge, upgrade-safety]

# Dependency graph
requires:
  - phase: 11-01
    provides: Version detection and update notification system
  - phase: 11-02
    provides: Backup creation and restoration
provides:
  - File merge strategies (PRESERVE, OVERWRITE, MERGE) for safe upgrades
  - Three-way config merge preserving user customizations
  - Migration infrastructure following Nx/Angular pattern
  - Version-specific migration execution with fail-fast behavior
affects: [11-04-upgrade-orchestrator, 11-05-testing]

# Tech tracking
tech-stack:
  added: [json-merge-patch@1.0.2]
  patterns: [three-way merge, file strategy determination, Nx migrations, sequential migration execution]

key-files:
  created: [gsd/scripts/file-merger.js, gsd/scripts/migration-runner.js, gsd/scripts/migrations/migrations.json]
  modified: [gsd/package.json, gsd/scripts/index.js]

key-decisions:
  - "Three-way merge for .gsd-config.json preserves user customizations while applying new schema"
  - "PRESERVE strategy for user-editable files (.gsd-config.json only)"
  - "OVERWRITE strategy for GSD core files (templates/, guidelines/, scripts/)"
  - "MERGE strategy reserved for future user-customizable templates"
  - "Nx/Angular migration pattern for battle-tested registry format"
  - "Fail-fast migration execution (stop on first failure)"
  - "Sequential migration execution (version-ordered)"

patterns-established:
  - "File strategy pattern: Categorize files into PRESERVE/OVERWRITE/MERGE based on path patterns"
  - "Three-way merge pattern: base (from backup) + user (current) + new (package) → merged with validation"
  - "Migration registry pattern: migrations.json with version, description, implementation path"
  - "Migration execution pattern: filter applicable → sort by version → execute sequentially → fail-fast"

# Metrics
duration: 15min
completed: 2026-01-23
---

# Phase 11 Plan 3: File Merging and Preservation Summary

**Three-way config merge and Nx-pattern migration infrastructure for preserving user customizations during GSD upgrades**

## Performance

- **Duration:** 15 min (estimated)
- **Started:** 2026-01-23 (estimated)
- **Completed:** 2026-01-23
- **Tasks:** 4
- **Files modified:** 5

## Accomplishments
- File merger module with 3 core functions (determineFileStrategy, mergeConfig, applyUpgrade)
- Three-way merge algorithm preserves user .gsd-config.json customizations
- File strategy determination (PRESERVE for user files, OVERWRITE for core files)
- Migration runner with 2 core functions (getApplicableMigrations, runMigrations)
- Nx/Angular-style migration registry (migrations.json)
- JSON Schema validation of merged configurations
- Fail-fast migration execution with clear error reporting

## Task Commits

Each task was committed atomically:

1. **Task 1: Install merge dependency** - `60825cf` (chore)
2. **Task 2: Create file-merger.js module** - `72c7dad` (feat)
3. **Task 3: Create migration infrastructure** - `ad2973a` (feat)
4. **Task 4: Add modules to exports** - Included in Task 3 commit

## Files Created/Modified
- `gsd/scripts/file-merger.js` - File merge strategies with 3 exported functions (determineFileStrategy, mergeConfig, applyUpgrade)
- `gsd/scripts/migration-runner.js` - Migration execution with 2 exported functions (getApplicableMigrations, runMigrations)
- `gsd/scripts/migrations/migrations.json` - Migration registry (Nx pattern, initially empty)
- `gsd/package.json` - Added json-merge-patch dependency and file-merger/migration-runner subpath exports
- `gsd/scripts/index.js` - Re-exported file-merger and migration-runner functions from main entry

## Decisions Made

**1. json-merge-patch for config merging**
- Rationale: RFC 7396 standard implementation, handles deep merge and null values correctly
- Alternative considered: lodash.merge - rejected (heavier dependency, non-standard)

**2. Three-way merge strategy**
- Pattern: base (from backup) + user (current) + new (from package) → merged
- Rationale: Preserves user changes while applying new structure/defaults
- User changes detected by comparing user to base, then applied to new

**3. File strategy categorization**
- PRESERVE: .gsd-config.json (user-customizable)
- OVERWRITE: templates/, guidelines/, scripts/, package.json, docs (GSD-managed)
- MERGE: Reserved for future (if users can customize templates)
- Rationale: Clear separation between user-editable and GSD-managed files

**4. JSON Schema validation of merged config**
- Check: Validate merged config against config-schema.json before writing
- Rationale: Prevents invalid merged configs from breaking GSD
- Fallback: Skip validation if schema not found (graceful degradation)

**5. Nx/Angular migration pattern**
- Registry format: migrations.json with version, description, implementation path
- Execution: Filter by version range → sort ascending → execute sequentially
- Rationale: Battle-tested pattern used by major frameworks (Nx, Angular CLI)

**6. Fail-fast migration execution**
- Behavior: Stop on first migration failure, throw error
- Rationale: Unsafe to continue after failed migration (may corrupt state)
- User impact: Clear error message indicates which migration failed

**7. Dynamic import for migration scripts**
- Pattern: `await import(migration.implementation)`
- Rationale: Allows migrations to be added without code changes
- Interface: Each migration exports default async function

## Deviations from Plan

None - plan executed exactly as written.

---

**Total deviations:** 0

## Issues Encountered

None - all tasks completed successfully without issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for upgrade orchestrator:**
- File merge strategies determine how each file is handled
- Three-way merge preserves user .gsd-config.json customizations
- Migration infrastructure ready for version-specific migrations
- Empty migration registry ready for future breaking changes

**Dependencies for next phases:**
- Phase 11-04 (Upgrade Orchestrator): Will use file-merger.applyUpgrade() and migration-runner.runMigrations()
- Phase 11-05 (Testing): Will test upgrade scenarios with file merging and migrations

**No blockers or concerns.**

---
*Phase: 11-upgrade-system*
*Completed: 2026-01-23*
