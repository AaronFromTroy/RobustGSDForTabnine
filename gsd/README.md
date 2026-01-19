# GSD for Tabnine

**Version:** 1.0.0

Get Shit Done workflow system adapted for Tabnine's agent mode. Provides modular guidelines, templates, and scripts for sequential multi-phase project execution with automatic state persistence and resume capabilities.

## What This Is

A lightweight workflow orchestration system for Tabnine agent that:
- Breaks projects into phases with clear success criteria
- Persists state in human-readable `.planning/STATE.md`
- Loads only needed guideline files (context-aware, modular)
- Resumes workflows from last checkpoint
- Validates artifacts before phase transitions

**Key difference from Claude Code GSD:** Tabnine can't spawn sub-agents, so workflows execute sequentially inline. Guidelines are optimized for Tabnine's context window constraints.

## Architecture

### How It Works in Tabnine

```
User says "start GSD" in Tabnine chat
         ↓
Tabnine loads .tabnine/guidelines/new-project.md
         ↓
Guideline instructs Tabnine to run Node.js scripts
         ↓
Scripts read gsd/templates/, write to .planning/
         ↓
STATE.md tracks progress, enables resume
```

**Key components:**
1. **`.tabnine/guidelines/`** - Where Tabnine looks for workflow instructions (symlinked to `gsd/guidelines/`)
2. **`gsd/scripts/`** - Node.js modules that do the actual work (state management, template rendering, validation)
3. **`gsd/templates/`** - Markdown templates for artifacts (PROJECT.md, ROADMAP.md, etc.)
4. **`.planning/`** - Generated artifacts and workflow state (created by scripts)

### Sequential Execution Model

Unlike Claude Code's parallel execution, Tabnine runs everything sequentially:

```javascript
// Tabnine can't spawn sub-agents, so guidelines tell it:
1. Run script A (node gsd/scripts/state-manager.js)
2. Wait for completion
3. Run script B (node gsd/scripts/template-renderer.js)
4. Wait for completion
5. Continue to next step
```

## Installation

### For Tabnine Projects

1. **Copy gsd/ directory to your project root:**
   ```bash
   cp -r gsd/ /path/to/your/project/
   cd /path/to/your/project
   ```

2. **Create .tabnine/guidelines/ symlink:**
   ```bash
   mkdir -p .tabnine
   ln -s ../gsd/guidelines .tabnine/guidelines
   ```

   On Windows (Command Prompt as Administrator):
   ```cmd
   mkdir .tabnine
   mklink /D .tabnine\guidelines gsd\guidelines
   ```

   **Why symlink?** Tabnine looks in `.tabnine/guidelines/` by default. Symlinking avoids duplicating files and keeps the source of truth in `gsd/guidelines/`.

3. **Install Node.js dependencies:**
   ```bash
   cd gsd
   npm install
   # Installs: write-file-atomic, ajv, front-matter, markdownlint
   ```

4. **Verify installation:**
   ```bash
   ls .tabnine/guidelines/
   # Should show: new-project.md, plan-phase.md, execute-phase.md, verify-work.md, research.md

   node gsd/scripts/integration-test.js
   # Should show: 57 tests passing
   ```

5. **Start using GSD:**
   Open Tabnine chat and say: **"start GSD"**

   Tabnine will:
   - Load `.tabnine/guidelines/new-project.md`
   - Run `gsd/scripts/template-renderer.js` to create `.planning/PROJECT.md`
   - Run `gsd/scripts/state-manager.js` to initialize `.planning/STATE.md`
   - Create git commit with initialization

6. **Resume workflow later:**
   Say to Tabnine: **"continue GSD workflow"**

   Tabnine will:
   - Read `.planning/STATE.md` to see current position
   - Load the appropriate guideline (e.g., `plan-phase.md` if planning next phase)
   - Resume from last checkpoint

## Trigger Phrases

Configured in `gsd/.gsd-config.json`:

| Workflow | Triggers | Action |
|----------|----------|--------|
| New Project | "start GSD", "begin GSD", "initialize GSD" | Initialize `.planning/` and create PROJECT.md |
| Resume | "continue GSD workflow", "resume GSD" | Read STATE.md and continue from checkpoint |

## Directory Structure

### After Installation

```
your-project/
├── .tabnine/
│   └── guidelines/       # Symlink to gsd/guidelines/ (where Tabnine looks)
│       ├── new-project.md
│       ├── plan-phase.md
│       ├── execute-phase.md
│       ├── verify-work.md
│       └── research.md
│
├── gsd/                  # GSD system (source of truth)
│   ├── guidelines/       # Workflow instructions (real files)
│   │   ├── new-project.md
│   │   ├── plan-phase.md
│   │   ├── execute-phase.md
│   │   ├── verify-work.md
│   │   └── research.md
│   ├── templates/        # Artifact templates
│   │   ├── PROJECT.md
│   │   ├── ROADMAP.md
│   │   ├── PLAN.md
│   │   ├── REQUIREMENTS.md
│   │   ├── STATE.md
│   │   ├── SUMMARY.md
│   │   └── research/     # Research document templates
│   │       ├── STACK.md
│   │       ├── FEATURES.md
│   │       ├── ARCHITECTURE.md
│   │       ├── PITFALLS.md
│   │       └── SUMMARY.md
│   ├── scripts/          # Node.js execution modules
│   │   ├── file-ops.js           # Atomic file operations
│   │   ├── process-runner.js     # Safe command execution
│   │   ├── state-manager.js      # STATE.md read/write
│   │   ├── guideline-loader.js   # Load workflow guidelines
│   │   ├── template-renderer.js  # Render templates with variables
│   │   ├── trigger-detector.js   # Detect workflow triggers
│   │   ├── validator.js          # Validate artifacts
│   │   ├── workflow-orchestrator.js  # Sequential execution
│   │   ├── resume-manager.js     # Resume from checkpoints
│   │   ├── approval-gate.js      # Human-in-the-loop gates
│   │   ├── research-synthesizer.js   # Research synthesis
│   │   ├── researcher.js         # Automated web research
│   │   └── integration-test.js   # Test suite
│   ├── .gsd-config.json      # Configuration (trigger phrases, paths)
│   ├── config-schema.json    # JSON Schema for validation
│   ├── package.json          # Node.js dependencies
│   ├── package-lock.json
│   └── README.md             # This file
│
└── .planning/            # Generated artifacts (created after "start GSD")
    ├── PROJECT.md        # Project definition
    ├── ROADMAP.md        # Phase roadmap (after requirements defined)
    ├── REQUIREMENTS.md   # Requirements tracking
    ├── STATE.md          # Workflow state (auto-updated)
    └── phases/           # Phase execution plans
        └── 01-foundation/
            ├── 01-01-PLAN.md     # Execution plan
            └── 01-01-SUMMARY.md  # Completion summary
```

### Key Paths

| Component | Path | Purpose |
|-----------|------|---------|
| **Tabnine lookup** | `.tabnine/guidelines/` | Where Tabnine searches for workflow instructions (symlink) |
| **Guidelines source** | `gsd/guidelines/` | Real guideline files (symlinked by `.tabnine/`) |
| **Scripts** | `gsd/scripts/` | Node.js modules executed by guidelines |
| **Templates** | `gsd/templates/` | Markdown templates for artifacts |
| **Generated artifacts** | `.planning/` | STATE.md, PROJECT.md, ROADMAP.md, etc. |
| **Phase plans** | `.planning/phases/XX-name/` | Execution plans and summaries |

## Configuration

Edit `gsd/.gsd-config.json` to customize:
- Trigger phrases (add variations)
- Directory paths (change `.planning` to something else)
- Workflow guideline filenames

Schema validation ensures configuration is valid. VS Code provides autocomplete and validation if `$schema` field references `config-schema.json`.

## Workflows

### How Workflows Execute in Tabnine

When you trigger a workflow, here's what happens:

```
1. You: "start GSD"
   ↓
2. Tabnine: Detects trigger phrase (exact match, case-insensitive)
   ↓
3. Tabnine: Loads .tabnine/guidelines/new-project.md
   ↓
4. Guideline: Contains step-by-step bash commands
   ↓
5. Tabnine: Executes commands sequentially:
   - node gsd/scripts/template-renderer.js --template=PROJECT --output=.planning/PROJECT.md
   - node gsd/scripts/state-manager.js --init
   - git add .planning/ && git commit -m "docs: initialize GSD"
   ↓
6. Scripts: Read templates, substitute variables, write artifacts
   ↓
7. STATE.md: Updated with current position
   ↓
8. Tabnine: Reports completion and next steps
```

**Key insight:** Guidelines are instruction sets, not code. They tell Tabnine *what to do*, and Tabnine executes bash commands that call Node.js scripts.

### 1. New Project (new-project.md)

**Trigger:** "start GSD"

**What it does:**
1. Creates `.planning/` directory
2. Renders `PROJECT.md` from template (asks user for project name, core value)
3. Renders `REQUIREMENTS.md` from template
4. Initializes `STATE.md` with starting position
5. Creates git commit

**Output:** `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`

**Next step:** User populates requirements, then says "plan roadmap" or "continue GSD workflow"

### 2. Plan Phase (plan-phase.md)

**Trigger:** "plan phase X" or automatic after roadmap creation

**What it does:**
1. Reads phase goal from `ROADMAP.md`
2. Analyzes requirements for this phase
3. Breaks work into sequential plans (01, 02, 03...)
4. Writes each plan as `XX-NN-PLAN.md` with tasks
5. Updates `STATE.md` with planning completion

**Output:** `.planning/phases/XX-name/XX-NN-PLAN.md` file(s)

**Next step:** User says "execute phase X" to run the plans

### 3. Execute Phase (execute-phase.md)

**Trigger:** "execute phase X" or automatic after planning

**What it does:**
1. Loads all `XX-NN-PLAN.md` files for phase
2. Executes tasks sequentially (one plan at a time)
3. For each task:
   - Runs action (file operations, command execution)
   - Validates against `<verify>` criteria
   - Confirms `<done>` condition met
4. Pauses at checkpoints for user approval
5. Creates `XX-NN-SUMMARY.md` after each plan completes
6. Updates `STATE.md` with progress

**Output:** Completed tasks, `.planning/phases/XX-name/XX-NN-SUMMARY.md`

**Next step:** User says "verify phase X" to validate goal achievement

### 4. Verify Work (verify-work.md)

**Trigger:** "verify phase X" or automatic after execution

**What it does:**
1. Loads phase goal from `ROADMAP.md`
2. Checks must-haves against actual codebase (not just SUMMARY claims)
3. Validates phase success criteria met
4. Creates `VERIFICATION.md` if issues found
5. Updates `STATE.md` and `ROADMAP.md` with completion

**Output:** Validation results, optional `XX-VERIFICATION.md` if gaps found

**Next step:** If verified, continue to next phase. If gaps, plan additional work to close them.

### 5. Research (research.md)

**Trigger:** Called by other workflows when research is needed

**What it does:**
1. Generates search queries based on research type (STACK/FEATURES/ARCHITECTURE/PITFALLS)
2. Performs web searches (or uses mock data in development)
3. Extracts findings with confidence levels (HIGH/MEDIUM/LOW)
4. Synthesizes findings into structured documents
5. Merges manual findings with automated research

**Output:** Research documents in `.planning/research/` (STACK.md, FEATURES.md, etc.)

**Next step:** Research findings inform roadmap creation and phase planning

## Tabnine vs Claude Code GSD

This is an **adapted version** of the GSD methodology specifically for Tabnine. Here are the key differences:

| Feature | Claude Code GSD | Tabnine GSD |
|---------|-----------------|-------------|
| **Execution model** | Parallel sub-agent spawning | Sequential inline execution |
| **Orchestration** | Orchestrator spawns multiple agents | Scripts coordinate sequentially |
| **Context window** | 200k tokens per agent | Smaller window, modular loading |
| **Commands** | Slash commands (`/gsd:execute-phase 1`) | Natural language triggers ("execute phase 1") |
| **Guidelines location** | Built-in workflows | `.tabnine/guidelines/` in project |
| **State tracking** | STATE.md + orchestrator memory | STATE.md only (no orchestrator) |
| **Plan execution** | Wave-based parallel execution | One plan at a time, tasks sequential |
| **Checkpoints** | Fresh continuation agents | Inline pause/resume |

**Why these differences?**

1. **No sub-agents**: Tabnine can't spawn sub-agents, so parallelism is replaced with sequential execution
2. **Context constraints**: Guidelines are modular (load only what's needed) to fit smaller context windows
3. **Trigger-based**: No slash commands, so natural language triggers activate workflows
4. **Script-driven**: Node.js scripts do heavy lifting (state management, template rendering, validation)

**Trade-offs:**

- **Slower execution**: Sequential vs parallel (but more predictable)
- **User-driven**: User must trigger each workflow phase explicitly
- **Portable**: Works in any environment with Node.js (not just Claude Code)
- **Transparent**: All logic in readable scripts, not opaque agent behavior

## Version Compatibility

All guidelines and templates include version metadata in YAML frontmatter:
```yaml
---
version: "1.0.0"
type: "guideline"
workflow: "new-project"
---
```

When resuming workflows, Tabnine checks version compatibility. Major version mismatches require migration.

**Versioning scheme:**
- **Major version** (1.x.x): Breaking changes to guideline structure or script interfaces
- **Minor version** (x.1.x): New workflows or scripts, backward compatible
- **Patch version** (x.x.1): Bug fixes, documentation updates

## Troubleshooting

### Tabnine-Specific Issues

**"Tabnine doesn't respond to 'start GSD'":**
- Verify `.tabnine/guidelines/` symlink exists: `ls -la .tabnine/`
- Check symlink points to `../gsd/guidelines/`: `readlink .tabnine/guidelines`
- On Windows, ensure symlink was created as Administrator
- Alternative: Copy files instead of symlinking:
  ```bash
  mkdir -p .tabnine/guidelines
  cp gsd/guidelines/* .tabnine/guidelines/
  ```

**"Tabnine says guideline not found":**
- Tabnine looks in `.tabnine/guidelines/` by default
- Verify files exist: `ls .tabnine/guidelines/` should show 5 .md files
- Check guideline names match `.gsd-config.json` workflows section

**"Node.js scripts fail with MODULE_NOT_FOUND":**
- Install dependencies: `cd gsd && npm install`
- Verify `gsd/node_modules/` exists with write-file-atomic, ajv, front-matter
- Check Node.js version: `node --version` (requires Node 18+)

**"Trigger phrase not recognized":**
- Triggers are case-insensitive but must be exact phrase matches
- Default triggers in `.gsd-config.json`:
  - Start: "start GSD", "begin GSD", "initialize GSD"
  - Continue: "continue GSD workflow", "resume GSD"
- Add custom triggers to `.gsd-config.json` if needed

**"STATE.md corrupted or missing":**
- Check `.planning/STATE.md` exists: `ls .planning/STATE.md`
- Verify valid markdown: `cat .planning/STATE.md | head -20`
- If corrupted, run: `node gsd/scripts/resume-manager.js --recover`
- Guideline will offer recovery options

**"Template variable not substituted (${varName} appears in output)":**
- Check script invocation includes all required variables
- Example: `--projectName="${PROJECT_NAME}" --createdDate="${DATE}"`
- See template frontmatter `variables` array for required vars

**"Scripts run but artifacts not created":**
- Check file permissions: `ls -la .planning/`
- Verify output paths: scripts write to `.planning/` by default
- Check script exit codes: `echo $?` after running (0 = success)

**"Git commits fail with 'no changes added'":**
- Guidelines stage specific files only (never `git add .`)
- Verify files were actually created before staging
- Check `.gitignore` doesn't exclude `.planning/`

### General Issues

**"Workflow stuck at checkpoint":**
- Checkpoints require explicit user approval
- Say "approved", "done", or describe issues to continue
- Check STATE.md for checkpoint details

**"Can't resume after context limit":**
- STATE.md enables resume from any point
- Say "continue GSD workflow"
- Tabnine reads STATE.md and determines next action

**"Phase verification fails":**
- Review `.planning/phases/XX-name/XX-VERIFICATION.md`
- Address gaps listed in verification report
- Run gap closure: plan additional fixes, execute them, verify again

## Quick Reference

### Common Operations

| Task | Tabnine Command | What Happens |
|------|----------------|--------------|
| **Initialize project** | "start GSD" | Creates `.planning/` with PROJECT.md, REQUIREMENTS.md, STATE.md |
| **Resume workflow** | "continue GSD workflow" | Reads STATE.md, loads appropriate guideline, continues from checkpoint |
| **Plan a phase** | "plan phase 1" | Reads phase goal, creates execution plans (01-01-PLAN.md, 01-02-PLAN.md, etc.) |
| **Execute phase** | "execute phase 1" | Runs all plans sequentially, creates SUMMARY.md for each |
| **Verify phase** | "verify phase 1" | Checks must-haves against codebase, creates VERIFICATION.md if gaps found |
| **Check status** | "show GSD status" | Displays current position from STATE.md |

### File Locations

| Artifact | Path | Purpose |
|----------|------|---------|
| Project definition | `.planning/PROJECT.md` | Core value, description, constraints |
| Requirements | `.planning/REQUIREMENTS.md` | v1/v2 requirements, out of scope |
| Roadmap | `.planning/ROADMAP.md` | Phase breakdown, dependencies, success criteria |
| Workflow state | `.planning/STATE.md` | Current position, decisions, TODOs, metrics |
| Phase plans | `.planning/phases/01-name/01-01-PLAN.md` | Execution tasks for each plan |
| Plan summaries | `.planning/phases/01-name/01-01-SUMMARY.md` | What was built, files changed |
| Verification | `.planning/phases/01-name/01-VERIFICATION.md` | Phase goal validation report |

### Trigger Phrases (Customizable in .gsd-config.json)

**Start new project:**
- "start GSD"
- "begin GSD"
- "initialize GSD"
- "start getting shit done"

**Resume existing workflow:**
- "continue GSD workflow"
- "resume GSD"
- "continue workflow"
- "resume getting shit done"

### Scripts (Manual Invocation)

```bash
# Render a template
node gsd/scripts/template-renderer.js --template=PROJECT --output=.planning/PROJECT.md --projectName="My App"

# Update state
node gsd/scripts/state-manager.js --update status="in-progress" phase=2

# Load a guideline
node gsd/scripts/guideline-loader.js --workflow=plan-phase --phase=1

# Validate an artifact
node gsd/scripts/validator.js --artifact=.planning/PROJECT.md --type=PROJECT

# Run tests
node gsd/scripts/integration-test.js
```

## Complete Workflow Example

### Day 1: Initialize
```
You: "start GSD"
Tabnine: Creates .planning/, asks for project name and core value
Tabnine: Generates PROJECT.md, REQUIREMENTS.md, STATE.md
Tabnine: "Project initialized. Next: populate requirements and create roadmap."

You: [Edit .planning/REQUIREMENTS.md to add v1 requirements]

You: "continue GSD workflow"
Tabnine: Reads requirements, creates ROADMAP.md with phases
Tabnine: "Roadmap created with 4 phases. Next: plan phase 1."
```

### Day 2: Plan Phase 1
```
You: "plan phase 1"
Tabnine: Reads phase 1 goal from ROADMAP.md
Tabnine: Creates .planning/phases/01-foundation/
Tabnine: Writes 01-01-PLAN.md, 01-02-PLAN.md (breaks work into plans)
Tabnine: Updates STATE.md
Tabnine: "Phase 1 planning complete with 2 plans. Next: execute phase 1."
```

### Day 3-4: Execute Phase 1
```
You: "execute phase 1"
Tabnine: Loads 01-01-PLAN.md
Tabnine: Executes tasks sequentially (create files, run tests, etc.)
Tabnine: Creates 01-01-SUMMARY.md
Tabnine: Loads 01-02-PLAN.md, repeats
Tabnine: Updates STATE.md
Tabnine: "Phase 1 execution complete (2 plans). Next: verify phase 1."
```

### Day 5: Verify Phase 1
```
You: "verify phase 1"
Tabnine: Reads phase 1 goal and must-haves from ROADMAP.md
Tabnine: Checks actual codebase against must-haves
Tabnine: Creates 01-VERIFICATION.md
Tabnine: Updates ROADMAP.md (marks phase 1 complete)
Tabnine: "Phase 1 verified ✓. Next: plan phase 2."
```

### Repeat for Phases 2-4...

## Support

- **Documentation**: This README and inline guideline comments
- **Issues**: Report bugs or request features via your project's issue tracker
- **Testing**: Run `node gsd/scripts/integration-test.js` for validation
- **State inspection**: Check `.planning/STATE.md` for current position and decisions

## License

MIT License - See LICENSE file
