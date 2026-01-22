# Phase 9: Improve Initialization Terminology - Research

**Researched:** 2026-01-22
**Domain:** Documentation clarity and onboarding UX
**Confidence:** HIGH

## Summary

This research investigated how to improve GSD's terminology and wording to make it clear that "starting a new project" applies to both brand-new projects AND existing applications initializing GSD for the first time. The current wording creates confusion because "new project" implies the user needs a fresh codebase, when in reality they're just adding GSD to an existing application.

Analysis of industry-standard CLI tools (git, npm, ESLint, Azure CLI, PlatformIO) reveals clear patterns: successful tools either use universal terminology like "init" or "setup" that works for both scenarios, or they provide explicit workflow branches that distinguish between the contexts.

The GSD system has terminology issues in 6 key areas: guideline filenames (new-project.md), template/config references, documentation (README/QUICKSTART), trigger phrases, error messages in scripts, and workflow description labels. The fix requires coordinated updates across all these touchpoints while maintaining backwards compatibility for existing users.

**Primary recommendation:** Replace "new project" terminology with "initialize GSD" or "setup GSD" throughout the system, emphasizing that this works for any codebase (new or existing) that doesn't yet have a `.planning/` directory.

## Standard Stack

The established patterns for CLI initialization across the industry:

### Core Patterns
| Tool | Command | Wording Pattern | Why It Works |
|------|---------|----------------|--------------|
| git | `git init` | "Initialize a repository" | Neutral - works for new or existing code |
| npm | `npm init` | "Initialize a package" | Creates package.json regardless of codebase age |
| ESLint | `npm init @eslint/config` | "Quick start" vs "Manual setup" | Procedure-focused, not project-age focused |
| Azure CLI | `azd init` | "Scan current directory" vs "Select template" | Explicit workflow branches by context |
| PlatformIO | `pio project init` | "Initialize or update existing" | Explicitly mentions both use cases |

### Supporting Concepts
| Concept | Application | When to Use |
|---------|-------------|-------------|
| **Workflow branching** | Offer different paths for different contexts | When initialization differs significantly |
| **Universal commands** | Single command works for all scenarios | When initialization process is identical |
| **Prerequisites clarity** | State what must exist before running command | Always - prevents confusion |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| "new project" | "initialize GSD" | More accurate but changes existing docs/commands |
| Single workflow | Branching workflows (new vs existing) | More accurate but adds complexity users don't need |
| Changing trigger phrases | Keeping "start GSD" | Backwards compatibility vs clarity |

**Installation:**
No new dependencies required - this is a documentation and wording improvement.

## Architecture Patterns

### Recommended Terminology Structure

**Current (Confusing):**
```
Concept: "New Project"
Guideline: new-project.md
Trigger: "start GSD"
Error: "Use 'start GSD' to begin a new project"
Docs: "Initialize new project"
```

**Proposed (Clear):**
```
Concept: "Initialize GSD" or "Setup GSD"
Guideline: init.md (alias: new-project.md for backwards compat)
Trigger: "start GSD" (keep for familiarity) or "initialize GSD"
Error: "Use 'start GSD' to initialize GSD in this project"
Docs: "Initialize GSD" with explicit note: "Works for new or existing projects"
```

### Pattern 1: Universal Initialization Language
**What:** Use terminology that applies equally to new and existing projects
**When to use:** Throughout all user-facing documentation and messages
**Example:**
```markdown
# Initialize GSD

**Works for:** New projects OR existing applications adding GSD for the first time

**Prerequisites:**
- Git repository initialized (`git status` works)
- Node.js 18+ installed
- No existing `.planning/` directory

This workflow sets up GSD infrastructure in your current project...
```
**Source:** Derived from ESLint and Azure CLI patterns

### Pattern 2: Prerequisite-First Documentation
**What:** State what must exist BEFORE the command, making it clear this adds to existing setups
**When to use:** At the start of installation/initialization docs
**Example:**
```markdown
## Prerequisites

Before initializing GSD, ensure:
1. You have a Git repository (run `git init` if needed)
2. You have a project directory (new or existing)
3. Node.js 18+ is installed

GSD works with any project structure. You're adding GSD to your existing codebase, not creating a new project.
```
**Source:** Pattern from npm init and git init documentation

### Pattern 3: Explicit Context Clarification
**What:** Add a prominent callout explaining the terminology applies to existing projects
**When to use:** In documentation headers and command descriptions
**Example:**
```markdown
> **Note:** "Initialize GSD" means adding GSD workflow files to your project. This works for:
> - Brand new projects (just created the directory)
> - Existing applications (adding GSD for the first time)
> - Projects with existing code, dependencies, and structure
>
> You are NOT creating a new project - you're adding GSD to your current one.
```
**Source:** Azure CLI "Scan current directory" documentation pattern

### Anti-Patterns to Avoid

- **Ambiguous "New":** Using "new project" when you mean "new to GSD" - this implies starting from scratch
- **Implicit assumptions:** Assuming users understand "new project workflow" means "first-time GSD setup"
- **Overloaded terminology:** Using "project" to mean both "software project" and "GSD initialization" in the same context

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fuzzy trigger matching | Custom NLP/similarity engine | Exact phrase matching with helpful error messages | Clear, predictable, no false positives. Industry standard (see: git aliases) |
| Automatic migration | Script that guesses and updates terminology | Manual migration guide with search/replace patterns | Users can review changes, control timing, understand impact |
| Multi-language support | Translation system for error messages | English with clear, simple phrasing | Complexity not justified for current user base. Simple English = easier to translate later if needed |
| Version detection | Code that checks doc versions and auto-updates | Version in frontmatter + manual check in docs | Explicit versions prevent silent breakage, users control updates |

**Key insight:** Documentation clarity problems require documentation fixes, not code solutions. Over-engineering wording improvements with automation creates maintenance burden without solving the core issue (confusing language).

## Common Pitfalls

### Pitfall 1: Changing Trigger Phrases Without Migration Path
**What goes wrong:** Existing users have muscle memory for "start GSD", changing to "initialize GSD" breaks their workflow
**Why it happens:** Desire for perfect terminology overrides backwards compatibility
**How to avoid:** Add new triggers alongside old ones, document both, deprecate slowly (if at all)
**Warning signs:** Issues filed about "commands stopped working" or "trigger not recognized"

### Pitfall 2: Incomplete Terminology Updates
**What goes wrong:** Updating README but not error messages leaves mixed signals that still confuse users
**Why it happens:** Not auditing all touchpoints where terminology appears
**How to avoid:** Search codebase for all instances of "new project", "new-project", "newProject" and update systematically
**Warning signs:** Users report "docs say one thing but error messages say another"

### Pitfall 3: Overly Technical Migration
**What goes wrong:** Renaming `new-project.md` to `init.md` breaks existing .tabnine/guidelines symlinks
**Why it happens:** Focusing on "correct" naming without considering deployment impact
**How to avoid:** Use symlinks, aliases, or copy-with-deprecation-notice strategies. Preserve existing filenames for at least one major version.
**Warning signs:** Reports of "guideline not found" after updates

### Pitfall 4: Assuming Context is Obvious
**What goes wrong:** Writing "Setup GSD" without clarifying this works for existing projects still leaves room for misinterpretation
**Why it happens:** Developer knowledge curse - you know it works both ways, so you assume others do too
**How to avoid:** Explicit callouts, examples showing existing project setup, clear prerequisites that reference existing codebases
**Warning signs:** Continued questions in issues/support about "do I need a new project?"

### Pitfall 5: Breaking Search/Discoverability
**What goes wrong:** Users google "GSD new project setup" and find outdated docs or get no results because terminology changed
**Why it happens:** SEO/search implications not considered during terminology updates
**How to avoid:** Keep old terminology as aliases/redirects in docs, add both terms to metadata, update search indices
**Warning signs:** Drop in documentation traffic, increase in "can't find setup docs" questions

## Code Examples

Verified patterns from research findings:

### Improved Trigger Configuration
```json
// Source: Derived from ESLint and git init patterns
// gsd/.gsd-config.json
{
  "triggerPhrases": {
    "start": [
      "start GSD",           // Original - keep for backwards compat
      "initialize GSD",      // New - clearer terminology
      "setup GSD",           // Alternative - also clear
      "init GSD",            // Short form - matches git/npm pattern
      "begin GSD"            // Keep existing
    ],
    "continue": [
      "continue GSD workflow",
      "resume GSD"
    ]
  }
}
```

### Clear Error Messages
```javascript
// Source: Azure CLI error message patterns
// Before (confusing):
throw new Error("No active workflow found. Use 'start GSD' to begin a new project.");

// After (clear):
throw new Error(
  "No active workflow found. Use 'start GSD' to initialize GSD in this project.\n" +
  "Note: This works for both new and existing codebases."
);
```

### Documentation Header Pattern
```markdown
<!-- Source: ESLint "Getting Started" + Azure CLI "Init Workflow" patterns -->
# Initialize GSD

**Add GSD workflow system to your project** (new or existing)

## Prerequisites

Before you begin:
- Git repository initialized (`git status` works)
- Node.js 18+ installed
- Project directory exists (can contain existing code)

**Important:** This workflow adds GSD to your *current* project. You're not creating a new project - you're adding GSD workflow infrastructure to an existing directory (even if that directory was just created).

## Quick Start

1. Copy `gsd/` directory to your project root
2. Run `start GSD` in Tabnine
3. Answer setup questions
4. GSD creates `.planning/` directory alongside your existing code
```

### Config Schema Description Updates
```json
// Source: npm init and git init man page descriptions
// gsd/config-schema.json
{
  "properties": {
    "workflows": {
      "properties": {
        "newProject": {
          "type": "string",
          "default": "new-project.md",
          "description": "Guideline file for initializing GSD (first-time setup in any project)"
        }
      }
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| "Create new project" | "Initialize in current directory" | git 1.0+ (2005) | Universal adoption - same command for all contexts |
| Separate commands for new/existing | Single universal init command | npm 1.0+ (2010) | Reduced cognitive load, simpler docs |
| Implicit context | Explicit workflow branches | Azure CLI (2021+) | Users choose path matching their scenario |
| Technical jargon | Plain language with examples | CLI Guidelines site (2020+) | Better accessibility, fewer support questions |

**Deprecated/outdated:**
- **"Scaffold new project" terminology:** Modern tools use "initialize" or "setup" - "scaffold" implies code generation, not config setup
- **Assuming "init" means empty directory:** Tools evolved to work in populated directories (git, npm, ESLint all support this)
- **Hiding existing project use cases:** Modern docs explicitly show both scenarios to prevent confusion

## Open Questions

Things that couldn't be fully resolved:

1. **Should guideline filename change from `new-project.md` to `init.md`?**
   - What we know: Changing filename requires symlink updates, potential breakage
   - What's unclear: Whether the benefit (clarity) outweighs the migration risk
   - Recommendation: Keep filename, update internal content and descriptions. Add alias in config if needed. File names are implementation detail, user-facing wording matters more.

2. **Should trigger phrases prioritize "start" or "initialize"?**
   - What we know: "start GSD" is established, "initialize GSD" is clearer
   - What's unclear: Whether familiarity trumps clarity for existing users
   - Recommendation: Keep "start GSD" as primary, add "initialize GSD" as alternative. Document both. Track usage to see if users naturally adopt new phrase.

3. **How to handle existing deployments with old documentation?**
   - What we know: Users may have bookmarked old docs or have local copies
   - What's unclear: Whether to redirect old URLs, show warnings, or just update in place
   - Recommendation: Update in place with prominent note at top: "Updated 2026-01: Clarified this works for existing projects." No URL changes needed.

4. **Should templates use different wording for brand-new vs existing projects?**
   - What we know: Current templates ask for "project name" and "core value" regardless of context
   - What's unclear: Whether questions should change based on whether code already exists
   - Recommendation: Keep questions universal. Wording like "What is this project?" works for both contexts. Don't branch template logic.

## Sources

### Primary (HIGH confidence)
- [Command Line Interface Guidelines](https://clig.dev/) - Industry best practices for CLI design, command naming, and subcommand patterns
- [ESLint Getting Started Guide](https://eslint.org/docs/latest/use/getting-started) - Shows "Quick Start" vs "Manual Setup" pattern without new/existing distinction
- [Azure Developer CLI Init Workflow](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/azd-init-workflow) - Explicit workflow branches: "Scan current directory" vs "Select template"
- [Git Init Documentation](https://git-scm.com/docs/git-init) - Universal initialization command that works for new and existing directories
- [npm Init Documentation](https://docs.npmjs.com/cli/v8/commands/npm-init/) - Shows same command works for initializing new packages or adding to existing

### Secondary (MEDIUM confidence)
- [PlatformIO Project Init](https://docs.platformio.org/en/latest/core/userguide/project/cmd_init.html) - Uses wording "Initialize a new PlatformIO based project or update existing with new data"
- [Tailwind CSS Installation](https://tailwindcss.com/docs/installation) - Installation guide that addresses adding to existing projects with conflict avoidance
- [Design2Tailwind Blog: Tailwind in Existing Project](https://design2tailwind.com/blog/tailwindcss-in-existing-project/) - Community guide showing "add to existing" patterns
- UX Patterns for CLI Tools (lucasfcosta.com) - General CLI UX guidance around command naming and user mental models

### Tertiary (LOW confidence - patterns observed, not explicitly documented)
- WebSearch results on CLI onboarding patterns (2026) - Limited specific results, but reinforced that "init" is standard pattern
- Various dev.to and Medium articles on adding ESLint/Prettier to existing projects - Show community consistently uses "add to project" framing

## Metadata

**Confidence breakdown:**
- Standard patterns (init/setup terminology): HIGH - Verified across multiple major tools (git, npm, ESLint, Azure CLI)
- Impact areas (6 touchpoints): HIGH - Directly audited GSD codebase files
- Migration risks: MEDIUM - Based on patterns from other tools, not GSD-specific testing
- User confusion sources: HIGH - Clear from issue context and terminology audit

**Research date:** 2026-01-22
**Valid until:** 90+ days (stable domain - CLI terminology best practices evolve slowly. Recommend re-check if major tools release new init patterns)
