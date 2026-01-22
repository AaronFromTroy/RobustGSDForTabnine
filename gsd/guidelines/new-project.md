---
version: "1.0.0"
type: "guideline"
workflow: "new-project"
last_updated: "2026-01-18"
schema: "gsd-guideline-v1"
---

# New Project Workflow

This guideline enables Tabnine to initialize a new project with GSD workflow infrastructure.

## Workflow Branching

This workflow adapts based on whether the current directory contains existing code:

**New Project (empty or only .git/):**
- Simple initialization flow
- User provides goals → generate PROJECT.md and REQUIREMENTS.md
- Proceed to next workflow

**Existing Project (contains code, dependencies, structure):**
- Research-first initialization flow
- Detect existing codebase → analyze tech stack, architecture, patterns
- Generate codebase research summary (CODEBASE.md in .planning/)
- User provides goals → generate context-aware PROJECT.md and REQUIREMENTS.md
- Requirements consider existing patterns and constraints

## Commands

Execute these exact commands in sequence:

```bash
# Detect existing codebase
node gsd/scripts/codebase-detector.js > .planning/.codebase-detection.json

# Conditional: Research existing codebase (only if detected as existing)
# Check .codebase-detection.json for isExisting flag
# If true, execute:
#   node gsd/scripts/codebase-researcher.js --output=".planning/CODEBASE.md"

# Create planning directory (if doesn't exist)
mkdir -p ".planning"

# Generate PROJECT.md (pass CODEBASE.md if exists)
node gsd/scripts/template-renderer.js --template=PROJECT --output=".planning/PROJECT.md" --projectName="${PROJECT_NAME}" --createdDate="${DATE}" --coreValue="${CORE_VALUE}" --existingCodebase=".planning/CODEBASE.md"

# Generate REQUIREMENTS.md from template
node gsd/scripts/template-renderer.js --template=REQUIREMENTS --output=".planning/REQUIREMENTS.md" --projectName="${PROJECT_NAME}"

# Initialize STATE.md
node gsd/scripts/state-manager.js --init --projectName="${PROJECT_NAME}"

# Create initial git commit
git add .planning/
git commit -m "docs: initialize GSD project structure

- Created PROJECT.md with core value definition
- Created REQUIREMENTS.md for tracking
- Initialized STATE.md for workflow state

Co-Authored-By: Tabnine Agent <noreply@tabnine.com>"
```

## Testing

Validate workflow completion by checking:

1. `.planning/PROJECT.md` exists and contains:
   - Project name in H1 heading
   - "What This Is" section
   - "Core Value" section
   - "Requirements" section

2. `.planning/REQUIREMENTS.md` exists and contains:
   - "v1 Requirements" section
   - "v2 Requirements" section
   - "Out of Scope" section

3. `.planning/STATE.md` exists and contains:
   - Current Position section showing "Phase: Not started"
   - Project Reference section with core value
   - Session Continuity section

4. Git commit created with conventional format

5. (If existing project) `.planning/CODEBASE.md` exists and contains:
   - Tech Stack section
   - Architecture Patterns section
   - Conventions section

## Project Structure

After workflow completion:

```
project-root/
├── gsd/                      # GSD system files (copied during installation)
│   ├── guidelines/
│   ├── templates/
│   ├── scripts/
│   └── .gsd-config.json
└── .planning/                # Generated artifacts
    ├── PROJECT.md            # Project definition
    ├── REQUIREMENTS.md       # Requirements tracking
    └── STATE.md              # Workflow state
```

## Code Style

Templates use markdown with YAML frontmatter. Generated artifacts follow this structure:

- **Headings:** H1 for document title, H2 for major sections
- **Metadata:** Dates in YYYY-MM-DD format
- **Version:** Semantic versioning (1.0.0)
- **Lists:** Unordered lists for requirements, ordered lists for procedures

## Git Workflow

**Commit message format:**
```
docs: initialize GSD project structure

- [Brief description of artifacts created]
- [Key sections populated]
- [State initialization status]

Co-Authored-By: Tabnine Agent <noreply@tabnine.com>
```

**Branches:**
- Work in current branch (typically main)
- Create feature branches only if explicitly requested

## Boundaries

### Always Do

- Create `.planning/` directory before generating artifacts
- Validate all required sections exist in generated files before marking complete
- Update STATE.md to reflect initialization status
- Create git commit after successful initialization

### Ask First

- Changing default directory structure (`.planning/` → something else)
- Adding additional artifact files beyond PROJECT.md, REQUIREMENTS.md, STATE.md
- Modifying template structure or sections

### Never Do

- Skip artifact validation (required sections must exist)
- Proceed to next workflow without successful git commit
- Generate artifacts outside `.planning/` directory
- Modify `.gsd-config.json` without user approval

## Workflow Steps

1. **Detect trigger phrase and gather context:**
   - User says "start GSD" or equivalent trigger from `.gsd-config.json`
   - Ask: "What do you want to accomplish with this project?"
   - Listen for goals, features, problems to solve (not metadata like project name)
   - Extract project name from directory name or ask if ambiguous
   - Derive core value from user's stated goals

2. **Detect existing codebase:**
   - Execute: `node gsd/scripts/codebase-detector.js`
   - Script checks for indicators of existing project:
     * package.json, requirements.txt, Cargo.toml (dependency files)
     * src/, app/, lib/ directories (common code directories)
     * More than just .git/ and gsd/ in current directory
   - Output: { isExisting: true/false, indicators: [...] }
   - Store detection result in workflow context for branching logic

3. **Perform codebase research (if existing project):**
   - **ONLY execute if step 2 detected isExisting: true**
   - Execute: `node gsd/scripts/codebase-researcher.js --output=".planning/CODEBASE.md"`
   - Script analyzes:
     * Tech stack (languages, frameworks, libraries from package files)
     * Directory structure and architecture patterns
     * Coding conventions (linting configs, formatting)
     * Existing tests and quality infrastructure
   - Output: `.planning/CODEBASE.md` with structured findings
   - Pass CODEBASE.md context to template-renderer.js when generating PROJECT.md
   - Use findings to inform REQUIREMENTS.md generation (respect existing patterns)

   **If new project (isExisting: false), skip this step entirely.**

4. **Create planning directory:**
   - Execute: `mkdir -p ".planning"`
   - Verify directory exists

5. **Generate PROJECT.md:**
   - Execute template-renderer.js with PROJECT template
   - Substitute variables: projectName, createdDate, coreValue, description, context, constraints
   - Write to `.planning/PROJECT.md`
   - Verify file contains all required sections

6. **Generate REQUIREMENTS.md:**
   - Execute template-renderer.js with REQUIREMENTS template
   - Substitute variables: projectName, createdDate, coreValue
   - Write to `.planning/REQUIREMENTS.md`
   - Verify file contains v1, v2, and Out of Scope sections

7. **Initialize STATE.md:**
   - Execute state-manager.js with --init flag
   - Populate: projectName, coreValue, currentPhase (Not started), status (pending)
   - Write to `.planning/STATE.md`
   - Verify Current Position section shows "Phase: Not started"

8. **Create git commit:**
   - Stage `.planning/` directory
   - Commit with conventional format (docs: initialize GSD project structure)
   - Include co-authorship line

## Success Criteria

Workflow is complete when:

1. `.planning/PROJECT.md` exists with all required sections populated
2. `.planning/REQUIREMENTS.md` exists with section structure
3. `.planning/STATE.md` exists with status: initialized
4. Git commit created successfully
5. User can open any artifact file and see properly formatted markdown

## Next Action

After successful completion:
- Inform user: "GSD initialized for [PROJECT_NAME]. Your goal: [USER_STATED_GOAL]. Next: I'll help define requirements based on this goal."
- Recommended workflow: System generates initial REQUIREMENTS.md based on user's stated goals, then user reviews/refines
