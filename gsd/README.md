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

## Installation

### Quick Start

1. **Copy gsd/ directory to your project root:**
   ```bash
   cp -r gsd/ /path/to/your/project/
   ```

2. **Verify structure:**
   ```bash
   ls gsd/
   # Should show: guidelines/ templates/ scripts/ .gsd-config.json README.md
   ```

3. **Install Node.js dependencies (Phase 2+):**
   ```bash
   cd /path/to/your/project
   npm install gray-matter ajv fs-extra
   ```
   *Note: Phase 1 (Foundation & Templates) requires no dependencies - just markdown files.*

4. **Start a new project:**
   Say to Tabnine: **"start GSD"**

   Tabnine will:
   - Create `.planning/` directory
   - Generate PROJECT.md, REQUIREMENTS.md, STATE.md from templates
   - Initialize workflow tracking

5. **Resume existing workflow:**
   Say to Tabnine: **"continue GSD workflow"**

   Tabnine will:
   - Read `.planning/STATE.md`
   - Load appropriate guideline for current phase
   - Resume from last checkpoint

## Trigger Phrases

Configured in `gsd/.gsd-config.json`:

| Workflow | Triggers | Action |
|----------|----------|--------|
| New Project | "start GSD", "begin GSD", "initialize GSD" | Initialize `.planning/` and create PROJECT.md |
| Resume | "continue GSD workflow", "resume GSD" | Read STATE.md and continue from checkpoint |

## Directory Structure

```
gsd/
├── guidelines/           # Workflow instructions for Tabnine
│   ├── new-project.md    # Initialize new project
│   ├── plan-phase.md     # Create phase execution plans
│   ├── execute-phase.md  # Execute phase tasks
│   └── verify-work.md    # Validate completed work
├── templates/            # Artifact templates
│   ├── PROJECT.md        # Project definition
│   ├── ROADMAP.md        # Phase roadmap
│   ├── PLAN.md           # Phase plan
│   ├── REQUIREMENTS.md   # Requirements tracking
│   └── STATE.md          # Workflow state
├── scripts/              # Node.js helpers (Phase 2+)
│   └── (state-manager.js, etc.)
├── .gsd-config.json      # Configuration
├── config-schema.json    # JSON Schema for validation
└── README.md             # This file
```

After initialization, your project will have:
```
your-project/
├── gsd/                  # GSD system (copy of this directory)
└── .planning/            # Generated artifacts
    ├── PROJECT.md
    ├── ROADMAP.md
    ├── REQUIREMENTS.md
    ├── STATE.md
    └── phases/
        └── XX-name/
            ├── XX-NN-PLAN.md
            └── XX-NN-SUMMARY.md
```

## Configuration

Edit `gsd/.gsd-config.json` to customize:
- Trigger phrases (add variations)
- Directory paths (change `.planning` to something else)
- Workflow guideline filenames

Schema validation ensures configuration is valid. VS Code provides autocomplete and validation if `$schema` field references `config-schema.json`.

## Workflows

### 1. New Project (new-project.md)
**Trigger:** "start GSD"
**Output:** `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`

### 2. Plan Phase (plan-phase.md)
**Trigger:** "plan phase X" or automatic after roadmap creation
**Output:** `.planning/phases/XX-name/XX-NN-PLAN.md` file(s)

### 3. Execute Phase (execute-phase.md)
**Trigger:** "execute phase X" or automatic after planning
**Output:** Completed tasks, `.planning/phases/XX-name/XX-NN-SUMMARY.md`

### 4. Verify Work (verify-work.md)
**Trigger:** "verify phase X" or automatic after execution
**Output:** Validation results, optional VERIFICATION.md if issues found

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

## Troubleshooting

**"Trigger phrase not recognized":**
- Verify phrase in `.gsd-config.json` under `triggerPhrases`
- Ensure exact match (case-sensitive)

**"STATE.md corrupted or missing":**
- Check `.planning/STATE.md` exists and is valid markdown
- Guideline will offer to reconstruct or restart

**"Template variable not substituted":**
- Verify all `${varName}` placeholders have corresponding values
- Check template frontmatter `variables` array

**"Guideline not found":**
- Verify `gsd/guidelines/` directory exists
- Check workflow filename matches `.gsd-config.json`

## Support

- Report issues: [GitHub Issues](https://github.com/your-repo/issues)
- Contribute: [CONTRIBUTING.md](CONTRIBUTING.md)
- Roadmap: See `.planning/ROADMAP.md` in your project

## License

MIT License - See LICENSE file
