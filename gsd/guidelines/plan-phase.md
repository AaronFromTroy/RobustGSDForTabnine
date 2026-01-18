---
version: "1.0.0"
type: "guideline"
workflow: "plan-phase"
last_updated: "2026-01-18"
schema: "gsd-guideline-v1"
---

# Plan Phase Workflow

This guideline enables Tabnine to create execution plans for a specific roadmap phase.

## Commands

Execute these exact commands in sequence:

```bash
# Load ROADMAP.md to identify next phase
node gsd/scripts/guideline-loader.js --workflow=plan-phase

# Create phase directory
mkdir .planning/phases/${PHASE_DIR}

# Generate PLAN.md file(s)
node gsd/scripts/template-renderer.js --template=PLAN --output=.planning/phases/${PHASE_DIR}/${PHASE}-${PLAN}-PLAN.md --phaseName="${PHASE_NAME}" --planNumber="${PLAN_NUM}"

# Update STATE.md
node gsd/scripts/state-manager.js --update currentPhase="${PHASE_NUM}" currentPlan="${PLAN_NUM}" status="planned"

# Create git commit
git add .planning/phases/${PHASE_DIR}/
git add .planning/STATE.md
git commit -m "docs(phase-${PHASE_NUM}): create execution plan ${PLAN_NUM}

- Defined ${TASK_COUNT} tasks for ${PHASE_NAME}
- Mapped requirements: ${REQ_IDS}
- Success criteria established

Co-Authored-By: Tabnine Agent <noreply@tabnine.com>"
```

## Testing

Validate workflow completion by checking:

1. Phase directory exists: `.planning/phases/XX-name/`

2. At least one PLAN.md file exists with structure:
   - YAML frontmatter (phase, plan, type, wave, depends_on)
   - `<objective>` section with purpose and output
   - `<tasks>` section with XML task elements
   - `<verification>` section with validation criteria
   - `<success_criteria>` section with measurable completion

3. STATE.md updated:
   - Current Phase shows phase number and name
   - Current Plan shows plan number
   - Status shows "planned"

4. Git commit created with phase identifier

## Project Structure

After workflow completion:

```
.planning/
├── PROJECT.md
├── ROADMAP.md
├── REQUIREMENTS.md
├── STATE.md
└── phases/
    └── XX-name/                    # Phase directory
        ├── XX-01-PLAN.md           # First plan
        ├── XX-02-PLAN.md           # Second plan (if needed)
        └── XX-CONTEXT.md           # Optional context/research
```

## Code Style

PLAN.md files use XML-style task structure:

```xml
<task type="auto">
  <name>Task 1: Create feature X</name>
  <files>src/feature.js, tests/feature.test.js</files>
  <action>
  Create feature.js with:
  - Function A
  - Function B
  </action>
  <verify>
  File exists, contains functions A and B
  </verify>
  <done>Feature X implemented and verified</done>
</task>
```

Checkpoint tasks use different structure:

```xml
<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Authentication system with JWT</what-built>
  <how-to-verify>
  1. Run: npm test
  2. Visit: http://localhost:3000/login
  3. Verify login flow works
  </how-to-verify>
  <resume-signal>Type "approved" to continue</resume-signal>
</task>
```

## Git Workflow

**Commit message format:**
```
docs(phase-X): create execution plan Y

- [Number of tasks defined]
- [Requirements mapped]
- [Success criteria summary]

Co-Authored-By: Tabnine Agent <noreply@tabnine.com>
```

**File organization:**
- Phase directories named: `01-foundation-templates`, `02-core-infrastructure`
- Plan files named: `01-01-PLAN.md`, `01-02-PLAN.md`

## Boundaries

### Always Do

- Read ROADMAP.md before creating plans
- Load CONTEXT.md or RESEARCH.md if exists for phase
- Break phase into 2-3 tasks per plan (not monolithic)
- Include verification criteria for each task
- Update STATE.md after creating plans

### Ask First

- Adding more than 3 plans per phase
- Changing task structure (XML format)
- Modifying phase directory naming convention

### Never Do

- Skip reading ROADMAP.md (plans must align with phase goals)
- Create plans without success criteria
- Proceed to execution without completing all plans
- Modify existing PLAN.md files without user approval

## Workflow Steps

1. **Read ROADMAP.md:**
   - Identify next phase based on STATE.md current position
   - Extract phase name, dependencies, requirements, success criteria
   - Note deliverables expected

2. **Check for phase context:**
   - Look for `.planning/phases/XX-name/XX-CONTEXT.md`
   - Look for `.planning/phases/XX-name/XX-RESEARCH.md`
   - Load if exists to understand implementation decisions

3. **Determine plan structure:**
   - Count deliverables from ROADMAP.md
   - Group related deliverables into logical plans
   - Target 2-3 tasks per plan for manageability
   - Identify any checkpoint tasks (human verification needed)

4. **Create phase directory:**
   - Execute: `mkdir .planning/phases/${PHASE_DIR}`
   - Use naming pattern: `01-foundation-templates`

5. **Generate PLAN.md file(s):**
   - For each plan:
     - Execute template-renderer.js with PLAN template
     - Populate frontmatter: phase, plan, type, wave, depends_on
     - Write `<objective>` with purpose and output
     - Write `<tasks>` section with task XML elements
     - Write `<verification>` criteria
     - Write `<success_criteria>` measurable completion
     - Save to `.planning/phases/XX-name/XX-NN-PLAN.md`

6. **Update STATE.md:**
   - Execute state-manager.js with update flags
   - Set currentPhase, currentPlan, status="planned"

7. **Create git commit:**
   - Stage phase directory and STATE.md
   - Commit with phase identifier in message

## Success Criteria

Workflow is complete when:

1. At least one PLAN.md exists for phase
2. Each PLAN.md has all required sections (objective, tasks, verification, success_criteria)
3. Tasks include `<name>`, `<files>`, `<action>`, `<verify>`, `<done>` elements
4. STATE.md shows currentPhase and currentPlan updated
5. Git commit created successfully
6. Total tasks across all plans cover all phase deliverables from ROADMAP.md

## Next Action

After successful completion:
- Inform user: "Phase ${PHASE_NUM} planning complete. ${PLAN_COUNT} plan(s) created with ${TASK_COUNT} total tasks."
- Recommended workflow: Trigger "execute phase" workflow to begin task execution
