# GSD for Tabnine - Quick Start

Get up and running with GSD workflow system in Tabnine in under 5 minutes.

## Prerequisites

- Node.js 18+ installed (`node --version`)
- Git repository initialized (`git status` works)
- Tabnine agent mode enabled

## Installation (3 minutes)

### Step 1: Copy GSD to Your Project

```bash
# Clone or download this repository, then:
cp -r /path/to/GSDForTabnine/gsd /path/to/your/project/
cd /path/to/your/project
```

### Step 2: Create Tabnine Guidelines Symlink

**macOS/Linux:**
```bash
mkdir -p .tabnine
ln -s ../gsd/guidelines .tabnine/guidelines
```

**Windows (Command Prompt as Administrator):**
```cmd
mkdir .tabnine
mklink /D .tabnine\guidelines gsd\guidelines
```

**Windows (Git Bash/WSL):**
```bash
mkdir -p .tabnine
ln -s ../gsd/guidelines .tabnine/guidelines
```

**Alternative (if symlinks don't work):**
```bash
mkdir -p .tabnine/guidelines
cp gsd/guidelines/*.md .tabnine/guidelines/
```
⚠️ Note: If you copy instead of symlink, you'll need to manually sync updates.

### Step 3: Install Dependencies

```bash
cd gsd
npm install
cd ..
```

### Step 4: Verify Installation

```bash
# Check Tabnine can find guidelines
ls .tabnine/guidelines/
# Should show: new-project.md, plan-phase.md, execute-phase.md, verify-work.md, research.md

# Check scripts work
node gsd/scripts/integration-test.js
# Should show: 57 tests passing (100%)
```

**Success checkpoint:** All 57 tests pass ✓

---

## First Project (2 minutes)

### Step 1: Initialize GSD

Open Tabnine chat and say:

```
start GSD
```

**What happens:**
- Tabnine loads `.tabnine/guidelines/new-project.md`
- Creates `.planning/` directory
- Asks for project name and core value
- Generates PROJECT.md, REQUIREMENTS.md, STATE.md
- Creates git commit

**Success checkpoint:** `.planning/` directory exists with 3 files ✓

### Step 2: Define Requirements

Edit `.planning/REQUIREMENTS.md` and add your v1 requirements:

```markdown
## v1 Requirements

### Must Have (Critical - blocks launch)
- REQ-001: User can create account with email/password
- REQ-002: User can log in and stay authenticated
- REQ-003: User can view dashboard after login
...
```

**Success checkpoint:** REQUIREMENTS.md has at least 3 v1 requirements ✓

### Step 3: Create Roadmap

Say to Tabnine:

```
continue GSD workflow
```

**What happens:**
- Tabnine reads REQUIREMENTS.md
- Creates ROADMAP.md with phases
- Maps requirements to phases
- Updates STATE.md

**Success checkpoint:** `.planning/ROADMAP.md` exists with phases ✓

### Step 4: Plan First Phase

Say to Tabnine:

```
plan phase 1
```

**What happens:**
- Tabnine reads phase 1 goal from ROADMAP.md
- Creates `.planning/phases/01-{name}/` directory
- Writes execution plans (01-01-PLAN.md, 01-02-PLAN.md, etc.)
- Each plan has tasks with verify criteria

**Success checkpoint:** Phase directory exists with PLAN.md files ✓

### Step 5: Execute First Phase

Say to Tabnine:

```
execute phase 1
```

**What happens:**
- Tabnine loads each plan sequentially
- Executes tasks one by one
- Creates files, runs tests, etc.
- Pauses at checkpoints for approval
- Writes SUMMARY.md after each plan completes

**Success checkpoint:** SUMMARY.md files exist, code is written ✓

### Step 6: Verify Phase Complete

Say to Tabnine:

```
verify phase 1
```

**What happens:**
- Tabnine checks must-haves from ROADMAP.md
- Validates against actual codebase (not just claims)
- Creates VERIFICATION.md if gaps found
- Updates ROADMAP.md to mark phase complete

**Success checkpoint:** Phase marked complete in ROADMAP.md ✓

---

## What's Next?

After completing phase 1:

1. **Continue to Phase 2:** Say "plan phase 2"
2. **Repeat:** Plan → Execute → Verify for each phase
3. **Resume anytime:** Say "continue GSD workflow" to pick up where you left off

---

## Troubleshooting

### "Tabnine doesn't respond to 'start GSD'"

**Check:**
```bash
ls -la .tabnine/
# Should show: guidelines -> ../gsd/guidelines

ls .tabnine/guidelines/
# Should show: 5 .md files
```

**Fix:** Recreate symlink or copy files:
```bash
rm -rf .tabnine/guidelines
ln -s ../gsd/guidelines .tabnine/guidelines
```

### "node: command not found"

**Fix:** Install Node.js 18+ from [nodejs.org](https://nodejs.org/)

### "npm install fails"

**Check Node version:**
```bash
node --version
# Must be 18.0.0 or higher
```

**Try clean install:**
```bash
cd gsd
rm -rf node_modules package-lock.json
npm install
```

### "Scripts run but artifacts not created"

**Check permissions:**
```bash
ls -la .planning/
# Should be writable
```

**Check script output:**
```bash
node gsd/scripts/template-renderer.js --template=PROJECT --output=.planning/TEST.md --projectName="Test"
echo $?
# Should return 0 (success)
```

### "Workflow stuck at checkpoint"

Checkpoints require explicit approval. Say:
- "approved" - to continue
- "done" - after manual action
- Describe issues - to provide feedback

### "Can't resume after closing Tabnine"

STATE.md enables resume. Say:
```
continue GSD workflow
```

Tabnine reads `.planning/STATE.md` and continues from last position.

---

## File Structure After Quick Start

```
your-project/
├── .tabnine/
│   └── guidelines/           # Symlink to gsd/guidelines/
│
├── gsd/                      # GSD system
│   ├── guidelines/           # Workflow instructions
│   ├── templates/            # Markdown templates
│   ├── scripts/              # Node.js modules
│   ├── node_modules/         # Dependencies
│   └── .gsd-config.json      # Configuration
│
└── .planning/                # Your project artifacts
    ├── PROJECT.md            # Project definition
    ├── REQUIREMENTS.md       # Requirements list
    ├── ROADMAP.md            # Phase roadmap
    ├── STATE.md              # Current position
    └── phases/
        └── 01-foundation/
            ├── 01-01-PLAN.md     # Execution plan
            └── 01-01-SUMMARY.md  # What was built
```

---

## Common Commands

| Say to Tabnine | What It Does |
|----------------|--------------|
| `start GSD` | Initialize new project |
| `continue GSD workflow` | Resume from STATE.md |
| `plan phase 1` | Create execution plans for phase 1 |
| `execute phase 1` | Run all plans in phase 1 |
| `verify phase 1` | Validate phase 1 goal achieved |
| `show GSD status` | Display current position |

---

## Tips for Success

1. **Be specific in requirements**: Clear requirements lead to better roadmaps
2. **Trust the checkpoints**: They exist for good reasons (UI validation, decisions, etc.)
3. **Review VERIFICATION.md**: If phase verification fails, it shows exactly what's missing
4. **State is in Git**: `.planning/` is tracked, so you can revert or branch
5. **Read STATE.md**: See decisions made, TODOs, metrics, recent changes

---

## Need More Help?

- **Full documentation:** See [README.md](README.md) for architecture, workflows, and detailed troubleshooting
- **Script reference:** Run `node gsd/scripts/{script-name}.js --help` for options
- **Test your setup:** Run `node gsd/scripts/integration-test.js` anytime
- **Check state:** Read `.planning/STATE.md` for current position and context

---

## Example Session

```
You: "start GSD"
Tabnine: Creates .planning/, asks for project details
Tabnine: "Project initialized. Edit REQUIREMENTS.md and say 'continue GSD workflow'"

[You edit .planning/REQUIREMENTS.md with 10 requirements]

You: "continue GSD workflow"
Tabnine: Reads requirements, creates ROADMAP.md with 3 phases
Tabnine: "Roadmap created. Say 'plan phase 1' to begin"

You: "plan phase 1"
Tabnine: Creates 2 execution plans in .planning/phases/01-foundation/
Tabnine: "Phase 1 planning complete. Say 'execute phase 1'"

You: "execute phase 1"
Tabnine: Runs 01-01-PLAN.md (creates files, runs tests)
Tabnine: Runs 01-02-PLAN.md (adds features)
Tabnine: "Phase 1 execution complete. Say 'verify phase 1'"

You: "verify phase 1"
Tabnine: Checks must-haves against codebase
Tabnine: "Phase 1 verified ✓. Say 'plan phase 2'"

[Repeat for phases 2-3...]

You: "verify phase 3"
Tabnine: "All phases complete 🎉. Project ready for v1 launch"
```

---

**Time from zero to first phase complete:** ~30 minutes (10 min setup, 20 min execution)

**Ready?** Open Tabnine and say: **"start GSD"**
