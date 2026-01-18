# Phase 1: Foundation & Templates - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Create markdown guideline files and templates that Tabnine's agent will read to understand and execute GSD workflows. Includes: workflow guidelines (new-project.md, plan-phase.md, execute-phase.md, verify-work.md), artifact templates (PROJECT.md, ROADMAP.md, PLAN.md, REQUIREMENTS.md, STATE.md), configuration (.gsd-config.json), and installation documentation (README.md).

</domain>

<decisions>
## Implementation Decisions

### Guideline Structure
- **Detail level:** Claude's discretion — balance detail appropriately for each workflow type
- **Success criteria:** Claude's discretion — add where helpful for validation (phase-level, step-level, or key milestones)
- **GSD reference approach:** Claude's discretion — use Claude Code GSD as reference where helpful, adapt for Tabnine constraints
- **Versioning:** Claude's discretion — choose versioning strategy (per-file, single VERSION file, or git-only)

### Instruction Clarity for Tabnine
- **Sub-agent adaptation:** Claude's discretion — adapt parallel workflows to sequential execution appropriately
- **Examples:** Claude's discretion — include examples where they reduce ambiguity
- **Script invocation:** **Explicit commands required** — show exact syntax like `node gsd/scripts/state-manager.js --update phase=1`
- **Troubleshooting:** Claude's discretion — add troubleshooting sections where helpful

### Claude's Discretion
- Detail level for each workflow type
- Success criteria placement (step vs phase vs checkpoint)
- Versioning strategy implementation
- Example inclusion strategy
- Troubleshooting documentation approach
- Whether to adapt Claude Code GSD directly or redesign

</decisions>

<specifics>
## Specific Ideas

**Explicit script commands:**
- Guidelines must show exact Node.js command syntax for script invocation
- Example: `node gsd/scripts/state-manager.js --update phase=1` not "update STATE.md"
- First invocation should be explicit; subsequent mentions can reference

**Tabnine constraints to address:**
- No sub-agent spawning (sequential execution required)
- Smaller context window (modular guideline loading critical)
- No slash commands (phrase-based triggers)
- Natural language interface

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-templates*
*Context gathered: 2026-01-18*
