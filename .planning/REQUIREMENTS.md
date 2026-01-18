# Requirements: GSD for Tabnine

**Defined:** 2026-01-18
**Core Value:** Enable the complete GSD methodology within Tabnine's agent mode through context-aware modular guidelines that work within its constraints

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core Infrastructure

- [ ] **CORE-01**: System provides sequential workflow orchestration for multi-phase projects
- [ ] **CORE-02**: System persists workflow state in STATE.md file after each phase completion
- [ ] **CORE-03**: System provides template files for PROJECT.md, ROADMAP.md, and PLAN.md artifacts
- [ ] **CORE-04**: System loads only the guideline file needed for current phase (modular loading)
- [ ] **CORE-05**: System can read, write, and edit project files via Node.js file operations
- [ ] **CORE-06**: System can execute commands (git, npm, Node.js scripts) via child processes

### Auto-Resume

- [ ] **RESUME-01**: System reads STATE.md on startup and determines current workflow phase
- [ ] **RESUME-02**: System continues workflow from last completed checkpoint without user re-explanation
- [ ] **RESUME-03**: System displays status summary showing current phase, step, and next action
- [ ] **RESUME-04**: System handles missing or corrupted STATE.md by offering to reconstruct or restart

### Trigger System

- [ ] **TRIG-01**: System detects phrase "start GSD" and initiates new-project workflow
- [ ] **TRIG-02**: System detects phrase "continue GSD workflow" and resumes from STATE.md
- [ ] **TRIG-03**: System detects phrase variations with fuzzy matching (e.g., "begin GSD", "resume workflow")
- [ ] **TRIG-04**: System confirms trigger detection before activating workflow to prevent false positives

### Progress Tracking

- [ ] **PROG-01**: STATE.md shows current phase number and name
- [ ] **PROG-02**: STATE.md shows current step within phase
- [ ] **PROG-03**: STATE.md shows completion status (pending, in_progress, completed, blocked)
- [ ] **PROG-04**: STATE.md includes visual progress indicator (e.g., "Phase 2/5 - 40% complete")
- [ ] **PROG-05**: System updates STATE.md automatically after each phase transition

### Validation Checkpoints

- [ ] **VALID-01**: System validates required sections exist in generated artifacts before marking phase complete
- [ ] **VALID-02**: System checks requirements traceability - every v1 requirement maps to a phase
- [ ] **VALID-03**: System verifies STATE.md structure matches schema on resume
- [ ] **VALID-04**: System prevents phase transitions if validation fails (e.g., can't go to planning without PROJECT.md)
- [ ] **VALID-05**: System provides clear validation error messages with remediation guidance

### Human-in-the-Loop

- [ ] **HITL-01**: System pauses workflow at key decision points (stack choice, architecture approach)
- [ ] **HITL-02**: System presents options with context and asks user to select preferred approach
- [ ] **HITL-03**: System waits for explicit user approval before proceeding past approval gate
- [ ] **HITL-04**: System logs approval decisions in STATE.md for traceability
- [ ] **HITL-05**: System allows user to override or modify agent recommendations

### Research Synthesis

- [ ] **RES-01**: System performs research across multiple sources (web search, documentation)
- [ ] **RES-02**: System assigns confidence levels to research findings (HIGH, MEDIUM, LOW)
- [ ] **RES-03**: System synthesizes findings into structured research documents (STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md)
- [ ] **RES-04**: System creates SUMMARY.md with key findings and roadmap implications
- [ ] **RES-05**: System cites sources with URLs for verification

### Guideline System

- [ ] **GUIDE-01**: System provides separate guideline files for each major workflow (new-project.md, plan-phase.md, execute-phase.md, verify-work.md)
- [ ] **GUIDE-02**: Guidelines include explicit success criteria for phase completion
- [ ] **GUIDE-03**: Guidelines include step-by-step procedures with numbered steps
- [ ] **GUIDE-04**: Guidelines include schema definitions for expected artifacts
- [ ] **GUIDE-05**: System includes VERSION metadata in all guidelines

### Template System

- [ ] **TMPL-01**: System provides PROJECT.md template with sections: What This Is, Core Value, Requirements, Context, Constraints, Key Decisions
- [ ] **TMPL-02**: System provides ROADMAP.md template with phase structure and success criteria
- [ ] **TMPL-03**: System provides PLAN.md template for phase execution plans
- [ ] **TMPL-04**: System provides REQUIREMENTS.md template with categorized requirements and traceability
- [ ] **TMPL-05**: Templates include VERSION metadata and validation schemas
- [ ] **TMPL-06**: System uses template literals for variable substitution (no Handlebars unless needed)

### Node.js Scripts

- [ ] **SCRIPT-01**: state-manager.js reads and writes STATE.md atomically
- [ ] **SCRIPT-02**: guideline-loader.js loads guideline file for specified phase
- [ ] **SCRIPT-03**: template-renderer.js populates templates with project data
- [ ] **SCRIPT-04**: Scripts use cross-platform patterns (path module, no hard-coded separators)
- [ ] **SCRIPT-05**: Scripts use Node.js 24.x LTS with ESM modules
- [ ] **SCRIPT-06**: Scripts handle errors gracefully with clear messages

### Installation & Setup

- [ ] **SETUP-01**: User can copy gsd/ directory to project root for installation
- [ ] **SETUP-02**: System includes .gsd-config.json with trigger phrases and directory paths
- [ ] **SETUP-03**: System includes README with installation instructions and trigger reference
- [ ] **SETUP-04**: System works immediately after copying files (no build step required)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Error Handling

- **ERR-01**: System retries failed operations with exponential backoff
- **ERR-02**: System provides semantic fallback strategies when operations fail
- **ERR-03**: System implements circuit breakers for repeated failures
- **ERR-04**: System logs errors to .planning/errors.log for debugging

### Atomic Git Commits

- **COMMIT-01**: System creates atomic git commit after each completed phase
- **COMMIT-02**: Commit messages include phase name, requirements covered, and co-authorship
- **COMMIT-03**: System tags commits with phase identifiers for rollback
- **COMMIT-04**: System uses conventional commit format (feat, fix, docs, chore)

### Dependency-Aware Phase Ordering

- **DEP-01**: System analyzes feature dependencies and orders phases accordingly
- **DEP-02**: System prevents starting Phase B if Phase A (dependency) not complete
- **DEP-03**: Roadmap creation considers feature dependency graph
- **DEP-04**: System suggests optimal phase order based on dependencies

### Rollback & Recovery

- **ROLL-01**: System creates checkpoint backups before risky operations
- **ROLL-02**: System provides rollback.js script to revert to previous checkpoint
- **ROLL-03**: System maintains checkpoint history in .planning/backups/
- **ROLL-04**: System auto-rollbacks on validation failure

### Multi-User Collaboration

- **COLLAB-01**: Git-based collaboration with branch-per-user workflow
- **COLLAB-02**: Conflict detection when multiple users modify same phase
- **COLLAB-03**: Shared guideline library (centralized)
- **COLLAB-04**: Workspace isolation (separate .planning/ directories)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Parallel sub-agent spawning | Tabnine doesn't support Task tool; use sequential inline execution instead |
| Slash command system | Tabnine doesn't support custom commands; use phrase-based triggers instead |
| Global installation/config | Per-project needs differ; use per-project copy for explicit isolation |
| Real-time streaming output | Exceeds Tabnine context limits and increases token usage |
| Automatic decision-making | Critical mistakes on wrong assumptions; require human approval for key decisions |
| Everything-in-one-prompt guideline | Exceeds context limits; use modular loading instead |
| Feature parity with Claude Code | Tabnine has different constraints; adapt to strengths rather than force-fit |
| Database state management | Overkill for single-user workflow; use file-based STATE.md instead |
| OAuth login / user authentication | Local tool, not web service; no authentication needed |
| Real-time multi-user sync | v1 is single-user; defer collaboration to v2+ |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 2 | Complete |
| CORE-02 | Phase 2 | Complete |
| CORE-03 | Phase 2 | Complete |
| CORE-04 | Phase 2 | Complete |
| CORE-05 | Phase 2 | Complete |
| CORE-06 | Phase 2 | Complete |
| RESUME-01 | Phase 3 | Pending |
| RESUME-02 | Phase 3 | Pending |
| RESUME-03 | Phase 3 | Pending |
| RESUME-04 | Phase 3 | Pending |
| TRIG-01 | Phase 3 | Pending |
| TRIG-02 | Phase 3 | Pending |
| TRIG-03 | Phase 3 | Pending |
| TRIG-04 | Phase 3 | Pending |
| PROG-01 | Phase 2 | Complete |
| PROG-02 | Phase 2 | Complete |
| PROG-03 | Phase 2 | Complete |
| PROG-04 | Phase 2 | Complete |
| PROG-05 | Phase 2 | Complete |
| VALID-01 | Phase 3 | Pending |
| VALID-02 | Phase 3 | Pending |
| VALID-03 | Phase 3 | Pending |
| VALID-04 | Phase 3 | Pending |
| VALID-05 | Phase 3 | Pending |
| HITL-01 | Phase 4 | Pending |
| HITL-02 | Phase 4 | Pending |
| HITL-03 | Phase 4 | Pending |
| HITL-04 | Phase 4 | Pending |
| HITL-05 | Phase 4 | Pending |
| RES-01 | Phase 4 | Pending |
| RES-02 | Phase 4 | Pending |
| RES-03 | Phase 4 | Pending |
| RES-04 | Phase 4 | Pending |
| RES-05 | Phase 4 | Pending |
| GUIDE-01 | Phase 1 | Complete |
| GUIDE-02 | Phase 1 | Complete |
| GUIDE-03 | Phase 1 | Complete |
| GUIDE-04 | Phase 1 | Complete |
| GUIDE-05 | Phase 1 | Complete |
| TMPL-01 | Phase 1 | Complete |
| TMPL-02 | Phase 1 | Complete |
| TMPL-03 | Phase 1 | Complete |
| TMPL-04 | Phase 1 | Complete |
| TMPL-05 | Phase 1 | Complete |
| TMPL-06 | Phase 1 | Complete |
| SCRIPT-01 | Phase 2 | Complete |
| SCRIPT-02 | Phase 2 | Complete |
| SCRIPT-03 | Phase 2 | Complete |
| SCRIPT-04 | Phase 2 | Complete |
| SCRIPT-05 | Phase 2 | Complete |
| SCRIPT-06 | Phase 2 | Complete |
| SETUP-01 | Phase 1 | Complete |
| SETUP-02 | Phase 1 | Complete |
| SETUP-03 | Phase 1 | Complete |
| SETUP-04 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 55 total
- Mapped to phases: 55 ✓
- Unmapped: 0 ✓

**Phase Distribution:**
- Phase 1 (Foundation & Templates): 19 requirements
- Phase 2 (Core Infrastructure): 17 requirements
- Phase 3 (Workflow Orchestration): 14 requirements
- Phase 4 (Advanced Features): 10 requirements

---
*Requirements defined: 2026-01-18*
*Last updated: 2026-01-18 after roadmap creation*
