---
version: "1.0.0"
type: "guideline"
workflow: "execute-phase"
last_updated: "2026-01-18"
schema: "gsd-guideline-v1"
---

# Execute Phase Workflow

This guideline enables Tabnine to execute tasks from PLAN.md files and create SUMMARY.md after completion.

## Commands

Execute these exact commands in sequence:

```bash
# Load PLAN.md for current phase
node gsd/scripts/guideline-loader.js --workflow=execute-phase --phase=${PHASE_NUM} --plan=${PLAN_NUM}

# Execute tasks sequentially (automated by workflow orchestrator)
node gsd/scripts/workflow-orchestrator.js --execute-plan=.planning/phases/${PHASE_DIR}/${PHASE}-${PLAN}-PLAN.md

# After all tasks complete, generate SUMMARY.md
node gsd/scripts/template-renderer.js --template=SUMMARY --output=.planning/phases/${PHASE_DIR}/${PHASE}-${PLAN}-SUMMARY.md

# Update STATE.md
node gsd/scripts/state-manager.js --update status="completed" completedPlans="${COMPLETED_PLANS}"

# Create git commit
git add .planning/phases/${PHASE_DIR}/${PHASE}-${PLAN}-SUMMARY.md
git add .planning/STATE.md
git commit -m "docs(phase-${PHASE_NUM}): complete plan ${PLAN_NUM}

- ${TASK_COUNT} tasks executed
- Deliverables: ${DELIVERABLE_LIST}
- Summary documented

Co-Authored-By: Tabnine Agent <noreply@tabnine.com>"
```

## Testing

Validate workflow completion by checking:

1. All tasks in PLAN.md executed:
   - Each task's `<verify>` criteria met
   - Each task's `<done>` condition satisfied

2. SUMMARY.md exists with structure:
   - "What Was Built" section
   - "Tasks Completed" section listing each task
   - "Files Created/Modified" section
   - "Next Steps" section

3. STATE.md updated:
   - Status shows "completed" for current plan
   - completedPlans incremented

4. Git commit created with deliverables list

## Project Structure

After workflow completion:

```
.planning/phases/XX-name/
├── XX-01-PLAN.md         # Execution plan
├── XX-01-SUMMARY.md      # Completion summary (new)
├── XX-02-PLAN.md         # Next plan
└── XX-CONTEXT.md         # Optional context
```

## Code Style

Task execution follows these patterns:

**Auto tasks (type="auto"):**
- Execute action sequentially
- Validate against `<verify>` criteria
- Confirm `<done>` condition met
- Continue to next task

**Checkpoint tasks (type="checkpoint:*"):**
- Execute automation up to checkpoint
- Document what was built
- Provide verification steps for user
- PAUSE execution
- Wait for user signal before resuming

## Git Workflow

**Commit message format:**
```
docs(phase-X): complete plan Y

- [Task count] tasks executed
- [Deliverables list]
- [Summary documented]

Co-Authored-By: Tabnine Agent <noreply@tabnine.com>
```

**Atomic commits:**
- Commit after each plan completion (not after each task)
- Include SUMMARY.md and STATE.md in commit
- Use conventional format with phase identifier

## Boundaries

### Always Do

- Read PLAN.md before executing tasks
- Execute tasks in sequential order
- Validate each task's `<verify>` criteria before proceeding
- Create SUMMARY.md after all tasks complete
- Update STATE.md with completion status

### Ask First

- Skipping tasks (all tasks must execute)
- Changing task execution order
- Modifying PLAN.md during execution

### Never Do

- Skip task verification (must validate before marking complete)
- Continue past checkpoint without user approval
- Modify STATE.md manually (use state-manager.js)
- Proceed to next phase without completing all plans

## Workflow Steps

1. **Verify plans were approved:**
   - Read `.planning/STATE.md`
   - Check status field contains "approved" (e.g., "planned-approved")
   - If status is "planned" (not approved):
     ```
     ⚠ Warning: Phase plans not yet approved

     Plans must be reviewed and approved before execution.
     Please run: "plan phase ${PHASE_NUM}" to review and approve plans.
     ```
     **Stop execution.** Do not proceed without approval.

2. **Load PLAN.md:**
   - Read `.planning/phases/XX-name/XX-NN-PLAN.md`
   - Parse frontmatter for phase, plan, type, dependencies
   - Extract all `<task>` elements

3. **Execute tasks sequentially:**
   - For each task in order:
     a. Read `<action>` instructions
     b. Execute action (file operations, command execution)
     c. Validate against `<verify>` criteria
     d. Confirm `<done>` condition met
     e. If type="checkpoint:*", PAUSE and follow checkpoint protocol
     f. Continue to next task

4. **Handle checkpoint tasks:**
   - If task has `type="checkpoint:human-verify"`:
     a. Document what was built in `<what-built>`
     b. Provide verification steps from `<how-to-verify>`
     c. Display resume signal from `<resume-signal>`
     d. PAUSE execution
     e. Wait for user approval
     f. Resume on user signal

5. **Validate plan completion:**
   - Confirm all tasks executed
   - Check all `<verify>` criteria met
   - Verify all `<done>` conditions satisfied

6. **Generate SUMMARY.md:**
   - Execute template-renderer.js with SUMMARY template
   - Populate sections:
     - What Was Built (deliverables)
     - Tasks Completed (list with status)
     - Files Created/Modified (with descriptions)
     - Next Steps (continuation guidance)
   - Write to `.planning/phases/XX-name/XX-NN-SUMMARY.md`

7. **Update STATE.md:**
   - Execute state-manager.js with completion status
   - Increment completedPlans counter
   - Update currentPlan if more plans exist

8. **Create git commit:**
   - Stage SUMMARY.md and STATE.md
   - Commit with deliverables list

## Success Criteria

Workflow is complete when:

1. All tasks in PLAN.md executed successfully
2. All `<verify>` criteria validated
3. All `<done>` conditions confirmed
4. SUMMARY.md exists with all required sections populated
5. STATE.md shows status="completed" for current plan
6. Git commit created successfully
7. If more plans exist for phase, STATE.md points to next plan

## Checkpoint Protocol

When encountering checkpoint tasks:

**Type: checkpoint:human-verify**
- Purpose: User validates visual/functional outcomes
- Action: Execute automation, document what was built, provide verification steps
- Wait for: User types "approved" or describes issues

**Type: checkpoint:decision**
- Purpose: User selects implementation approach
- Action: Present options with pros/cons
- Wait for: User selects option (e.g., "option-a")

**Type: checkpoint:human-action**
- Purpose: User performs manual step (email verification, 2FA)
- Action: Document what agent attempted, what user must do
- Wait for: User types "done"

**Resume after checkpoint:**
- Continue from next task in sequence
- Do not re-execute checkpoint task
- Update STATE.md to reflect continuation

## Next Action

After successful completion:
- If more plans in phase: "Plan ${PLAN_NUM} complete. Proceeding to plan ${NEXT_PLAN_NUM}."
- If phase complete: "Phase ${PHASE_NUM} complete. All plans executed. Recommend: verify-work workflow."
