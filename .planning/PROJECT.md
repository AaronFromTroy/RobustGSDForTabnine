# GSD for Tabnine

## What This Is

A GSD (Get Stuff Done) library adapted for Tabnine's agent mode, consisting of guideline markdown files, templates, and Node.js scripts that enable Tabnine to execute the full GSD workflow. Users copy the library into their project and trigger workflows using explicit phrases. The system reads STATE.md to resume work across fresh windows, adapting the complete GSD methodology to work within Tabnine's constraints.

## Core Value

Enable the complete GSD methodology within Tabnine's agent mode through context-aware modular guidelines that work within its constraints (no sub-agent spawning, smaller context window, no slash commands).

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Modular workflow guideline files (new-project, plan-phase, execute-phase, verify, etc.)
- [ ] Template directory with all GSD templates (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, PLAN.md, etc.)
- [ ] Node.js helper scripts for state management and workflow coordination
- [ ] Trigger detection system using explicit phrases ("start GSD", "continue GSD workflow")
- [ ] Auto-resume capability that reads STATE.md and continues from current phase
- [ ] Sequential workflow execution (adapts parallel agent workflows to run inline)
- [ ] Installation/setup instructions for copying library to new projects
- [ ] Test validation on a real project (end-to-end workflow execution)

### Out of Scope

- Parallel agent spawning — Tabnine limitation, use sequential execution instead
- Slash command system — Tabnine doesn't support custom commands, use phrase triggers
- Tabnine-specific optimizations — Straight port of GSD, no special features
- Global Tabnine installation — Copy to each project, not centralized config
- Claude Code features that don't translate — Stick to file ops + command execution

## Context

Tabnine's agent mode provides file operations and command execution but lacks several capabilities that Claude Code's GSD relies on:
- Cannot spawn sub-agents (no Task tool for parallel researchers, planners, executors)
- Smaller context window than Claude direct
- No custom slash command support
- Natural language interface only

The user has never completed a full GSD workflow before, so the "end state" follows standard GSD completion: all roadmap phases executed, requirements validated, milestone marked complete.

## Constraints

- **Platform**: Tabnine agent mode - limited to file operations and command execution
- **Context size**: Smaller than Claude Code - requires modular loading (only load needed workflow file)
- **Execution model**: Sequential only - workflows that use parallel agents must run inline one-by-one
- **Script language**: Node.js/JavaScript for helper scripts
- **Installation**: Per-project copy (drop library files into each project)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Modular workflow files | Smaller context window requires loading only needed guidelines | — Pending |
| Phrase triggers instead of commands | Tabnine lacks slash command support | — Pending |
| Sequential execution model | Tabnine cannot spawn sub-agents | — Pending |
| Node.js for scripts | Better cross-platform compatibility than bash | — Pending |

---
*Last updated: 2026-01-18 after initialization*
