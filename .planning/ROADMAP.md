# Roadmap: GSD for Tabnine

**Project:** GSD library adapted for Tabnine's agent mode
**Created:** 2026-01-18
**Depth:** Quick (4 phases)
**Coverage:** 55/55 v1 requirements mapped ✓

## Overview

Build a GSD workflow system for Tabnine agent mode by creating modular guidelines, templates, and Node.js scripts that enable sequential workflow execution with automatic state persistence and resume capabilities. Each phase delivers a complete, testable capability.

## Phases

### Phase 1: Foundation & Templates

**Goal:** Establish the guideline and template infrastructure that all workflows depend on.

**Dependencies:** None (foundation)

**Requirements:** GUIDE-01, GUIDE-02, GUIDE-03, GUIDE-04, GUIDE-05, TMPL-01, TMPL-02, TMPL-03, TMPL-04, TMPL-05, TMPL-06, SETUP-01, SETUP-02, SETUP-03, SETUP-04

**Success Criteria:**
1. Developer can copy gsd/ directory to any project and find complete installation instructions
2. All workflow guideline files exist with explicit success criteria, step-by-step procedures, and version metadata
3. All artifact templates exist with proper structure, version metadata, and variable substitution support
4. Guideline files use unambiguous language that prevents agent misinterpretation
5. Templates are human-readable and can be manually edited if needed

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Workflow guidelines (new-project, plan-phase, execute-phase, verify-work)
- [x] 01-02-PLAN.md — Artifact templates (PROJECT, ROADMAP, PLAN, REQUIREMENTS, STATE)
- [x] 01-03-PLAN.md — Configuration and documentation (.gsd-config.json, README.md)

**Deliverables:**
- gsd/guidelines/new-project.md
- gsd/guidelines/plan-phase.md
- gsd/guidelines/execute-phase.md
- gsd/guidelines/verify-work.md
- gsd/templates/PROJECT.md
- gsd/templates/ROADMAP.md
- gsd/templates/PLAN.md
- gsd/templates/REQUIREMENTS.md
- gsd/templates/STATE.md
- gsd/.gsd-config.json
- gsd/README.md (installation guide)

---

### Phase 2: Core Infrastructure

**Goal:** Build the Node.js scripts and core capabilities that enable workflow execution.

**Dependencies:** Phase 1 (needs templates and config)

**Requirements:** CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, SCRIPT-01, SCRIPT-02, SCRIPT-03, SCRIPT-04, SCRIPT-05, SCRIPT-06, PROG-01, PROG-02, PROG-03, PROG-04, PROG-05

**Success Criteria:**
1. System can read and write STATE.md atomically without corruption
2. System loads only the guideline file needed for current workflow phase (not all at once)
3. System generates artifacts from templates with correct variable substitution
4. System executes git and npm commands via child processes successfully
5. STATE.md displays current phase, step, status, and visual progress indicator
6. All scripts work cross-platform (Windows, macOS, Linux) using path module

**Plans:** 5 plans

Plans:
- [ ] 02-01-PLAN.md — Foundation setup (package.json, dependencies, scripts directory)
- [ ] 02-02-PLAN.md — Core utilities (file-ops.js, process-runner.js)
- [ ] 02-03-PLAN.md — State management (state-manager.js with progress tracking)
- [ ] 02-04-PLAN.md — Template and guideline loading (template-renderer.js, guideline-loader.js)
- [ ] 02-05-PLAN.md — Integration testing and cross-platform verification

**Deliverables:**
- gsd/package.json (ESM, Node 24 LTS)
- gsd/scripts/file-ops.js (atomic file operations)
- gsd/scripts/process-runner.js (safe child process execution)
- gsd/scripts/state-manager.js (STATE.md read/write with progress tracking)
- gsd/scripts/guideline-loader.js (modular guideline loading)
- gsd/scripts/template-renderer.js (template rendering with variable validation)
- gsd/scripts/integration-test.js (validates all modules work together)
- node_modules/ (write-file-atomic, ajv, front-matter)

---

### Phase 3: Workflow Orchestration

**Goal:** Enable complete workflow execution with triggers, auto-resume, and validation.

**Dependencies:** Phase 2 (needs scripts and state management)

**Requirements:** TRIG-01, TRIG-02, TRIG-03, TRIG-04, RESUME-01, RESUME-02, RESUME-03, RESUME-04, VALID-01, VALID-02, VALID-03, VALID-04, VALID-05

**Success Criteria:**
1. User says "start GSD" and system initiates new-project workflow
2. User says "continue GSD workflow" and system resumes from last checkpoint in STATE.md
3. System handles corrupted or missing STATE.md gracefully with recovery options
4. System validates artifact structure before marking phase complete
5. System verifies 100% requirement coverage in roadmap (no orphaned requirements)
6. System prevents invalid phase transitions with clear error messages
7. System displays status summary on resume showing current position and next action

**Plans:** 3 plans

Plans:
- [ ] 03-01-PLAN.md — Trigger detection and conflict handling
- [ ] 03-02-PLAN.md — Artifact validation (schema + structure)
- [ ] 03-03-PLAN.md — Resume manager and workflow orchestrator

**Deliverables:**
- gsd/scripts/trigger-detector.js (detect "start GSD", "continue GSD workflow")
- gsd/scripts/workflow-orchestrator.js (sequential execution engine)
- gsd/scripts/resume-manager.js (read STATE.md and continue)
- gsd/scripts/validator.js (validate artifacts and state)
- Integration logic for Tabnine context injection

---

### Phase 4: Advanced Features

**Goal:** Add human-in-the-loop gates and research synthesis for production workflows.

**Dependencies:** Phase 3 (needs working orchestration)

**Requirements:** HITL-01, HITL-02, HITL-03, HITL-04, HITL-05, RES-01, RES-02, RES-03, RES-04, RES-05

**Success Criteria:**
1. Workflow pauses at key decision points and presents options to user
2. System waits for explicit user approval before proceeding past gates
3. Approval decisions are logged in STATE.md for traceability
4. System performs research across multiple sources and assigns confidence levels
5. Research findings are synthesized into structured documents (STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md, SUMMARY.md)
6. All research includes source URLs for verification

**Plans:** 2 plans

Plans:
- [ ] 04-01-PLAN.md — Research templates and approval gates (templates + approval-gate.js)
- [ ] 04-02-PLAN.md — Research synthesizer and integration testing (research-synthesizer.js + Test Suite 10)

**Deliverables:**
- gsd/scripts/approval-gate.js (pause and collect user input)
- gsd/scripts/research-synthesizer.js (multi-source research)
- Research templates (STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md, SUMMARY.md)
- Test Suite 10 (approval gates and research synthesis validation)

---

### Phase 5: Polish and Distribution Readiness

**Goal:** Prepare the library for production use and public distribution on npm.

**Dependencies:** Phase 4 (needs complete functionality)

**Requirements:** DIST-01 through DIST-10 (licensing, packaging, CI/CD, examples, cross-platform testing)

**Success Criteria:**
1. Package has MIT license and distribution-ready package.json
2. Automated releases via semantic-release and GitHub Actions with trusted publishing
3. CI tests pass on Windows, Linux, and macOS
4. Contributors have clear guidelines and commit message conventions
5. Users have working example demonstrating library integration
6. Pre-publish validation prevents sensitive files and validates package size
7. Package exports enable clean subpath imports
8. Cross-platform compatibility validated in CI

**Plans:** 4 plans

Plans:
- [ ] 05-01-PLAN.md — Distribution metadata and licensing (LICENSE, package.json exports/files, .npmignore)
- [ ] 05-02-PLAN.md — Automated release infrastructure (semantic-release, GitHub Actions CI/release workflows)
- [ ] 05-03-PLAN.md — Documentation and examples (CONTRIBUTING.md, scripts/index.js, examples/basic-usage/)
- [ ] 05-04-PLAN.md — Quality validation (cross-platform CI matrix, pre-publish checks, CI-friendly tests)

**Deliverables:**
- LICENSE (MIT)
- Updated package.json (exports, files, keywords, repository)
- .npmignore
- .releaserc.json (semantic-release config)
- .github/workflows/ci.yml (cross-platform testing)
- .github/workflows/release.yml (automated publishing)
- CONTRIBUTING.md
- gsd/scripts/index.js (main entry point)
- gsd/scripts/pre-publish-check.js
- examples/basic-usage/ (demo project)

---

## Progress

| Phase | Status | Requirements | Success Criteria |
|-------|--------|--------------|------------------|
| 1 - Foundation & Templates | Complete | 19 | 5 |
| 2 - Core Infrastructure | Complete | 17 | 6 |
| 3 - Workflow Orchestration | Complete | 14 | 7 |
| 4 - Advanced Features | Complete | 10 | 6 |
| 5 - Polish and Distribution Readiness | Pending | 10 | 8 |

**Total:** 5 phases, 65 requirements, 32 success criteria

---

## Dependencies

```
Phase 1 (Foundation)
    ↓
Phase 2 (Core Infrastructure)
    ↓
Phase 3 (Workflow Orchestration)
    ↓
Phase 4 (Advanced Features)
    ↓
Phase 5 (Polish and Distribution Readiness)
```

**Linear dependency chain:** Each phase builds on the previous. No parallel execution needed.

---

## Risk Mitigation

**Context Window Overflow (Critical):**
- Mitigated in Phase 1: Modular guideline structure
- Mitigated in Phase 2: Guideline loader (load only needed file)

**State Corruption (Critical):**
- Mitigated in Phase 2: Atomic STATE.md updates
- Mitigated in Phase 3: Validation and recovery

**Instruction Ambiguity (Critical):**
- Mitigated in Phase 1: Unambiguous guideline language
- Mitigated in Phase 3: Validation checkpoints

**Sequential Execution Overhead (Critical):**
- Mitigated in Phase 1: Workflow design for sequential patterns
- Mitigated in Phase 3: Benchmarking during validation

---

*Roadmap created: 2026-01-18*
*Last updated: 2026-01-20 - Phase 5 planned with 4 plans in 2 waves*
