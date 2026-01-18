# Phase 3: Workflow Orchestration - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable complete workflow execution through trigger detection ("start GSD", "continue GSD workflow"), auto-resume from STATE.md checkpoints, sequential workflow orchestration, and artifact validation. System integrates with Tabnine's natural language interface to provide seamless workflow state management.

</domain>

<decisions>
## Implementation Decisions

### Trigger Detection
- **Exact match only** — Only activate on exact phrases "start GSD" and "continue GSD workflow" (no fuzzy matching)
- **Always confirm** — Show visual indicator (box/banner: "\ud83d\udd35 GSD Trigger Detected") and ask for confirmation before activating
- **Warn and block** on conflict — If "start GSD" triggered with existing workflow, show: "Workflow already in progress at Phase X. Use 'continue GSD workflow' to resume or complete current first."
- **Clear visual indicator** — Use box/banner format for trigger detection communication, not plain text

### Resume Behavior
- **Brief checkpoint** — Show minimal info when resuming: current phase and what's next (not full status/history)
- **Auto-continue from checkpoint** — Resume exactly from last STATE.md checkpoint without asking (handle interruptions transparently)
- **Error with guidance** — If no workflow exists on "continue": "No active workflow found. Use 'start GSD' to begin a new project."

### Validation Strategy
- **After each phase completes** — Validate artifacts when phase finishes (ensures phase delivered before moving on)
- **Specific error messages with remediation** — Format: "Missing section: Core Value (line 5 expected). Add it with: echo '## Core Value' >> PROJECT.md"

### Error Recovery
- **Auto-complete missing phases** — If invalid transition detected (Phase 1 → 4), prompt: "Phases 2-3 required. Execute them first, then proceed to Phase 4?"

### Claude's Discretion
- Validation enforcement level (block vs warn on failures)
- Requirement coverage checking strategy (enforce 100% or warn only)
- STATE.md corruption recovery method (reconstruct vs manual vs backup)
- Unexpected error handling (retry vs checkpoint vs manual intervention)
- Error logging approach (persistent log file vs STATE.md only vs none)
- Context loading on resume (key decisions only vs recent activity vs stateless)

</decisions>

<specifics>
## Specific Ideas

**Exact phrases for triggers:**
- "start GSD" (case-insensitive, but exact wording)
- "continue GSD workflow" (case-insensitive, but exact wording)

**Visual indicator format:**
- Use box/banner with icon for trigger detection (not plain text response)
- Example: "\ud83d\udd35 GSD Trigger Detected"

**Error message style:**
- Provide specific line numbers and remediation commands
- Example format: "Missing section: X (expected at line Y). Fix with: [command]"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-workflow-orchestration*
*Context gathered: 2026-01-18*
