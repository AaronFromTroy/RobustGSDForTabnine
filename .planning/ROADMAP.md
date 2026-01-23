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

**Requirements:** Distribution infrastructure not tracked as formal v1 requirements (licensing, packaging, CI/CD, examples, cross-platform testing)

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

### Phase 6: Discussion & Context System

**Goal:** Formalize discussion and context gathering system to prevent planning misalignment through structured CONTEXT.md storage and adaptive questioning.

**Dependencies:** Phase 5 (builds on complete infrastructure)

**Requirements:** Context gathering infrastructure (CONTEXT template, question taxonomy, context parsing)

**Success Criteria:**
1. CONTEXT.md template exists with MADR-style structure (frontmatter + categorized sections)
2. Question taxonomy adapts to phase type (technical, design, workflow)
3. Context loader can parse CONTEXT.md and extract locked decisions
4. plan-phase.md workflow saves discussion to CONTEXT.md before creating plans
5. Questions are progressive (essential → follow-up → clarification)
6. User can distinguish between locked decisions and Claude's discretion areas
7. All 66+ integration tests pass (57 existing + 9 new = 100% pass rate)

**Plans:** 3 plans

Plans:
- [ ] 06-01-PLAN.md — Templates and question taxonomy (CONTEXT.md, question-bank.js)
- [ ] 06-02-PLAN.md — Context loader and workflow integration (context-loader.js, plan-phase.md update)
- [ ] 06-03-PLAN.md — Testing and validation (Test Suite 12 with 9 tests)

**Deliverables:**
- gsd/templates/CONTEXT.md (MADR-inspired structure)
- gsd/scripts/question-bank.js (adaptive question taxonomy)
- gsd/scripts/context-loader.js (CONTEXT.md parsing)
- Updated gsd/guidelines/plan-phase.md (CONTEXT.md persistence)
- Test Suite 12 (9 tests for discussion system)

---

### Phase 7: Enhanced Research Infrastructure

**Goal:** Replace mock data with real web scraping, add multi-domain parallel execution, enhanced source validation, and content-based deduplication.

**Dependencies:** Phase 6 (needs discussion system to inform research)

**Requirements:** Enhanced research capabilities (web scraping, source validation, deduplication, parallel execution)

**Success Criteria:**
1. System scrapes real documentation sites using progressive enhancement (Cheerio → Playwright fallback)
2. System classifies sources into multi-tier authority levels (HIGH/MEDIUM/LOW/UNVERIFIED)
3. System detects duplicate content across different URLs using content hashing
4. System executes multi-domain research in parallel (STACK/FEATURES/ARCHITECTURE/PITFALLS)
5. Concurrency controls prevent resource exhaustion (p-limit with configurable limits)
6. Rate limiting handled gracefully with exponential backoff and jitter
7. Browser cleanup prevents memory leaks (try-finally blocks)
8. Context-aware research respects locked decisions from CONTEXT.md
9. All 81+ integration tests pass (66 existing + 15 new = 100% pass rate)
10. Real scraped content replaces mock data in research findings

**Plans:** 4 plans

Plans:
- [x] 07-01-PLAN.md — Web scraping foundation (dependencies, scraper.js with progressive enhancement)
- [x] 07-02-PLAN.md — Source validation and deduplication (source-validator.js, deduplicator.js)
- [x] 07-03-PLAN.md — Multi-domain coordination and integration (domain-coordinator.js, update researcher.js)
- [x] 07-04-PLAN.md — Testing and validation (Test Suites 13-14, end-to-end verification)

**Deliverables:**
- Updated gsd/package.json (cheerio, playwright, axios, p-limit dependencies)
- gsd/scripts/scraper.js (progressive enhancement web scraping)
- gsd/scripts/source-validator.js (multi-tier authority classification)
- gsd/scripts/deduplicator.js (content-based duplicate detection)
- gsd/scripts/domain-coordinator.js (parallel multi-domain execution)
- Updated gsd/scripts/researcher.js (real scraping integration)
- Test Suite 13 (9 tests for web scraping modules)
- Test Suite 14 (6 tests for multi-domain coordination)

---

### Phase 8: Verification & Quality System

**Goal:** Validate that built features achieve intended goals through goal-backward verification.

**Dependencies:** Phase 7 (needs enhanced research for quality baselines)

**Requirements:** Verification infrastructure (goal validation, quality gates, multi-layer verification)

**Success Criteria:**
1. VERIFICATION.md template exists and can be rendered with verification results
2. Goal validator extracts success criteria from ROADMAP.md and validates programmatically
3. Multi-layer verification orchestrates smoke → lint → unit → integration → acceptance checks
4. Quality gates enforce coverage thresholds (80% default), linting rules, and test pass rates
5. Verification fails fast on critical issues (smoke tests, linting errors)
6. Verification report generation creates VERIFICATION.md with layer-by-layer results and remediation
7. verify-work.md guideline integrated with verifier.js orchestrator (simplified commands)
8. All 95+ integration tests pass (81 existing + 14 new = 90%+ pass rate)

**Plans:** 4 plans

Plans:
- [x] 08-01-PLAN.md — VERIFICATION template and goal-backward validation (VERIFICATION.md, goal-validator.js)
- [x] 08-02-PLAN.md — Quality gates and multi-layer orchestrator (quality-checker.js, verifier.js)
- [x] 08-03-PLAN.md — Report generation and guideline integration (verification-report.js, update verify-work.md)
- [x] 08-04-PLAN.md — Testing and validation (Test Suites 15-16 with 14 tests)

**Deliverables:**
- gsd/templates/VERIFICATION.md (verification report template)
- gsd/scripts/goal-validator.js (acceptance criteria validation)
- gsd/scripts/quality-checker.js (coverage/linting quality gates)
- gsd/scripts/verifier.js (multi-layer verification orchestrator)
- gsd/scripts/verification-report.js (VERIFICATION.md report generation)
- Updated gsd/guidelines/verify-work.md (verifier.js integration)
- Test Suite 15 (8 tests for verification modules)
- Test Suite 16 (6 tests for report generation and integration)

---

### Phase 9: Improve Initialization Terminology

**Goal:** Clarify that "starting GSD" means initializing GSD in the current project (new or existing), not creating a brand-new project from scratch. Add goal-oriented workflow, existing project detection, and codebase research capabilities.

**Dependencies:** Phase 8 (Verification & Quality System)

**Requirements:** Documentation clarity, UX improvement, workflow enhancement (not tracked as formal v1 requirements)

**Success Criteria:**
1. Error messages explicitly state "initialize GSD in this project" and mention existing codebases
2. Documentation (README.md, QUICKSTART.md) prominently clarifies GSD works for existing projects
3. Prerequisites explicitly mention users can have existing code
4. Config schema descriptions use "initialize" terminology consistently
5. No confusing "begin a new project" phrasing remains in user-facing content
6. Integration tests still pass (only strings changed, no logic)
7. Workflow asks "what you want to accomplish" instead of "project name and value"
8. Workflow detects existing codebases and branches accordingly
9. For existing projects, codebase research happens before requirements generation
10. Codebase detection and research scripts exist and integrate with new-project.md workflow

**Plans:** 4 plans

Plans:
- [x] 09-01-PLAN.md — Update script error messages (trigger-detector.js, resume-manager.js, workflow-orchestrator.js)
- [x] 09-02-PLAN.md — Update documentation and config (README.md, QUICKSTART.md, config-schema.json)
- [x] 09-03-PLAN.md — Update new-project.md workflow (goal-oriented questions, existing project detection, workflow branching)
- [x] 09-04-PLAN.md — Create detection and research scripts (codebase-detector.js, codebase-researcher.js, CODEBASE.md template)

**Deliverables:**
- Updated gsd/scripts/trigger-detector.js (clear error messages)
- Updated gsd/scripts/resume-manager.js (clear error messages)
- Updated gsd/scripts/workflow-orchestrator.js (clear workflow messages)
- Updated gsd/README.md (prominent callouts, prerequisite clarifications)
- Updated gsd/QUICKSTART.md (clear initialization language)
- Updated gsd/config-schema.json (clear descriptions)
- Updated gsd/guidelines/new-project.md (goal-oriented, existing project detection, research integration)
- gsd/scripts/codebase-detector.js (existing project detection)
- gsd/scripts/codebase-researcher.js (tech stack and architecture analysis)
- gsd/templates/CODEBASE.md (codebase research template)

---

### Phase 10: Fix Path Handling Bugs In All Guidelines

**Goal:** Fix critical path handling bugs in workflow guidelines that cause directory creation failures when adding phases dynamically. Ensure all bash commands use proper quoting, `-p` flags, and error handling to prevent path construction issues.

**Dependencies:** Phase 9 (Improve Initialization Terminology)

**Requirements:** Bug fixes not tracked as formal requirements (critical correctness issue discovered during real-world usage)

**Success Criteria:**
1. All `mkdir` commands use `-p` flag for parent directory creation
2. All path variables wrapped in double quotes to prevent word splitting
3. All file operation commands use quoted paths (git add, node script calls)
4. Path construction validated with test cases (missing slashes, special characters)
5. Guidelines tested with dynamic phase addition workflow
6. No `.planningphases` or similar malformed directories created during testing

**Plans:** 1 plan

Plans:
- [x] 10-01-PLAN.md — Fix bash path handling in all guideline commands

**Deliverables:**
- Updated gsd/guidelines/plan-phase.md (quoted paths, mkdir -p)
- Updated gsd/guidelines/execute-phase.md (quoted paths)
- Updated gsd/guidelines/verify-work.md (quoted paths)

---

### Phase 11: Upgrade System

**Goal:** Enable seamless GSD upgrades through automated version detection, backup, file merging, and migration infrastructure.

**Dependencies:** Phase 10 (Fix Path Handling Bugs In All Guidelines)

**Requirements:** Upgrade infrastructure (not tracked as formal v1 requirements)

**Success Criteria:**
1. System detects current GSD version and checks for updates via npm registry
2. System can detect version from local upgrade sources
3. System auto-detects best upgrade source (npm or local)
4. System falls back to local if npm unavailable
5. Upgrade preview shows files to update/preserve/merge and migrations to run
6. Backup created before upgrade with validation before proceeding
7. .gsd-config.json customizations preserved during upgrade (three-way merge)
8. Templates, guidelines, scripts overwritten with new versions
9. Version-specific migration scripts execute in order
10. Failed upgrade rolls back to backup automatically
11. User can trigger upgrade via "upgrade GSD" phrase
12. Dry-run mode shows changes without applying
13. All 110+ integration tests pass (95 existing + 15 new)
14. CHANGELOG.md documents both npm and local upgrade workflows
15. README.md includes clear upgrade instructions for both modes

**Plans:** 5 plans

Plans:
- [ ] 11-01-PLAN.md — Version detection and update notification (version-checker.js with dual-mode support, semver, update-notifier)
- [ ] 11-02-PLAN.md — Backup and rollback system (backup-manager.js, fs-extra)
- [ ] 11-03-PLAN.md — File merge and migration infrastructure (file-merger.js, migration-runner.js, migrations.json)
- [ ] 11-04-PLAN.md — Upgrade orchestrator with auto-detection (upgrade-manager.js with npm/local fallback, trigger integration)
- [ ] 11-05-PLAN.md — Testing and documentation (Test Suite 17 with 15 tests, CHANGELOG.md, README.md)

**Deliverables:**
- gsd/scripts/version-checker.js (dual-mode version detection: npm registry + local sources)
- gsd/scripts/backup-manager.js (backup creation, validation, restoration)
- gsd/scripts/file-merger.js (file merge strategies, config preservation)
- gsd/scripts/migration-runner.js (migration execution)
- gsd/scripts/migrations/migrations.json (migration registry)
- gsd/scripts/upgrade-manager.js (upgrade orchestration with auto-detection and fallback)
- Updated gsd/scripts/trigger-detector.js ("upgrade GSD" trigger)
- Updated gsd/scripts/workflow-orchestrator.js (upgrade workflow)
- Updated gsd/.gsd-config.json (upgrade trigger phrases)
- Updated gsd/package.json (semver, update-notifier, json-merge-patch, fs-extra dependencies)
- Test Suite 17 (15 tests for dual-mode upgrade system)
- gsd/CHANGELOG.md (upgrade documentation for both npm and local workflows)
- Updated gsd/README.md (upgrade instructions for both modes)

---

## Progress

| Phase | Status | Requirements | Success Criteria |
|-------|--------|--------------|------------------|
| 1 - Foundation & Templates | Complete | 19 | 5 |
| 2 - Core Infrastructure | Complete | 17 | 6 |
| 3 - Workflow Orchestration | Complete | 14 | 7 |
| 4 - Advanced Features | Complete | 10 | 6 |
| 5 - Polish and Distribution Readiness | Incomplete (1/4 plans) | (not tracked) | 8 |
| 6 - Discussion & Context System | Complete | (context gathering) | 7 |
| 7 - Enhanced Research Infrastructure | Complete | (enhanced research) | 10 |
| 8 - Verification & Quality System | Complete | (verification infra) | 8 |
| 9 - Improve Initialization Terminology | Complete | (not tracked) | 10 |
| 10 - Fix Path Handling Bugs In All Guidelines | Complete | (not tracked) | 6 |
| 11 - Upgrade System | Not started | (not tracked) | 15 |

**Total:** 11 phases, 55 v1 requirements, 88 success criteria

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
    ↓
Phase 6 (Discussion & Context System)
    ↓
Phase 7 (Enhanced Research Infrastructure)
    ↓
Phase 8 (Verification & Quality System)
    ↓
Phase 9 (Improve Initialization Terminology)
    ↓
Phase 10 (Fix Path Handling Bugs In All Guidelines)
    ↓
Phase 11 (Upgrade System)
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
*Last updated: 2026-01-22 - Phase 11 planned (upgrade system with 5 plans)*
