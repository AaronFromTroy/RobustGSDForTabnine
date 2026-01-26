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
# 0. FIRST: Verify previous plan is complete (if not plan 1)
if [ "${PLAN_NUM}" -gt 1 ]; then
  PREV_PLAN=$((PLAN_NUM - 1))
  PREV_SUMMARY=".planning/phases/${PHASE_DIR}/${PHASE}-$(printf '%02d' $PREV_PLAN)-SUMMARY.md"

  if [ ! -f "$PREV_SUMMARY" ]; then
    echo "⚠ ERROR: Cannot execute Plan ${PLAN_NUM}"
    echo "Previous plan (${PREV_PLAN}) not complete - missing SUMMARY.md"
    exit 1
  fi
fi

# 1. Load PLAN.md for current phase
node gsd/scripts/guideline-loader.js --workflow=execute-phase --phase=${PHASE_NUM} --plan=${PLAN_NUM}

# 2. Execute tasks sequentially (automated by workflow orchestrator)
node gsd/scripts/workflow-orchestrator.js --execute-plan=".planning/phases/${PHASE_DIR}/${PHASE}-${PLAN}-PLAN.md"

# 3. After all tasks complete, generate SUMMARY.md
node gsd/scripts/template-renderer.js --template=SUMMARY --output=".planning/phases/${PHASE_DIR}/${PHASE}-${PLAN}-SUMMARY.md"

# 4. Present summary and WAIT for user approval (see Approval Protocol section)
#    DO NOT PROCEED TO STEP 5 until user says "approved" or "looks good"

# 5. Update STATE.md (ONLY after user approval)
node gsd/scripts/state-manager.js --update status="completed" completedPlans="${COMPLETED_PLANS}"

# 6. Create git commit
git add ".planning/phases/${PHASE_DIR}/${PHASE}-${PLAN}-SUMMARY.md"
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
- **Execute plan N before plan N-1 is complete (strict sequencing required)**
- **Update STATE.md before user approves completed work (critical - causes confusion)**
- **Suggest next phase before STATE.md is updated (causes state drift)**
- Modify STATE.md manually (use state-manager.js) - **ALWAYS use the script**
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

1.5. **Verify previous plan is complete (sequencing enforcement):**

   **Purpose:** Ensure plans execute in sequential order (05-01 → 05-02 → 05-03)

   a. **Determine expected sequence:**
      - Read STATE.md to get currentPlan number
      - If currentPlan > 1, there is a previous plan
      - Calculate previous plan number: prevPlan = currentPlan - 1

   b. **Check previous plan completion:**

      **If currentPlan = 1:**
      - No previous plan, skip this check ✓

      **If currentPlan > 1:**
      - Check 1: Does `${PHASE}-${PREV_PLAN}-SUMMARY.md` exist?
      - Check 2: Does STATE.md show `completedPlans >= prevPlan`?

      **If either check fails:**
      ```
      ⚠ ERROR: Cannot execute Plan ${PHASE}-${CURRENT_PLAN}

      Previous plan not complete:
      - Plan ${PHASE}-${PREV_PLAN} must finish first
      - Missing: .planning/phases/${PHASE_DIR}/${PHASE}-${PREV_PLAN}-SUMMARY.md
      - STATE.md shows: completedPlans=${COMPLETED} (expected: ≥${PREV_PLAN})

      Please complete Plan ${PHASE}-${PREV_PLAN} first:
      1. Execute all tasks
      2. Wait for user approval
      3. Update STATE.md
      4. Create SUMMARY.md

      Then retry Plan ${PHASE}-${CURRENT_PLAN}.
      ```

      **STOP EXECUTION.** Do not proceed without previous plan completion.

      **If both checks pass:**
      - Previous plan is complete ✓
      - Safe to proceed with current plan

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

7. **Wait for user approval and update STATE.md:**

   a. **Present work summary showing:**
      - Tasks completed (with status)
      - Deliverables created/modified
      - Test results and coverage
      - Files changed
      - Any warnings or notes

   b. **PAUSE and WAIT for user approval phrase** (see Approval Protocol section below)
      - Say: "Please review the work above. Say 'looks good' or 'approved' when ready to continue."
      - **DO NOT PROCEED** until user provides approval phrase

   c. **After approval detected**, execute state-manager.js:
      ```bash
      node gsd/scripts/state-manager.js --update status="completed" completedPlans="${COMPLETED_PLANS}"
      ```

   d. **CRITICAL:** NEVER manually edit STATE.md - always use state-manager.js

   e. **If user describes issues** instead of approving:
      - Fix the issues
      - Re-verify work
      - Return to step 7a (wait for approval again)
      - Do NOT update STATE.md until user approves

   f. Increment completedPlans counter
   g. Update currentPlan if more plans exist

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

## Approval Protocol

After completing all tasks, WAIT for user confirmation before updating STATE.md.

**Trigger Phrases (case-insensitive):**
- "looks good"
- "approved"
- "lgtm" (looks good to me)
- "continue"
- "next phase" / "proceed"
- "done" / "complete"
- "ship it"

**User Response Types:**

1. **Approval phrases** → Proceed to state update
2. **Describes issues** → Fix issues, re-verify, wait again
3. **Asks questions** → Answer, then wait for approval again

**Critical Sequence:**
```
Complete all tasks
      ↓
Present work summary to user
      ↓
[WAIT] ← DO NOT UPDATE STATE YET
      ↓
User types approval phrase
      ↓
node gsd/scripts/state-manager.js --update status="completed"
      ↓
Create git commit
      ↓
Announce next action
```

**NEVER:**
- Update STATE.md before user approves
- Manually edit STATE.md (always use state-manager.js)
- Assume silence means approval
- Suggest next action before state update

**Example Interaction:**

```
Agent: ✓ All 3 tasks complete

Summary:
- Created authentication system
- Added JWT middleware
- Wrote 15 tests (100% pass rate)

Files modified:
- src/auth.js (new)
- src/middleware/jwt.js (new)
- tests/auth.test.js (new)

Please review the work above. Say "looks good" or "approved" when ready to continue.

[WAITING FOR USER...]

User: looks good

Agent: ✓ Approval detected

[NOW updating STATE.md...]

node gsd/scripts/state-manager.js --update status="completed" completedPlans="3"

✓ STATE.md updated
✓ Git commit created

Plan 01-03 complete. Ready for Plan 01-04.
```

**If user describes issues:**

```
User: the auth.js file has a bug on line 42

Agent: Let me fix that issue.

[Fixes bug, re-verifies...]

Agent: ✓ Bug fixed and verified

Please review again. Say "looks good" when ready.

[WAIT again - do not update state until approved]
```

## Next Action

**IMPORTANT:** Only announce next action AFTER user approves and STATE.md is updated.

**Sequence:**
1. Wait for user approval (see Approval Protocol)
2. Update STATE.md using state-manager.js
3. Create git commit with deliverables
4. **THEN** announce to user:

After successful completion (with user approval):
- If more plans in phase: "Plan ${PLAN_NUM} complete. Ready for plan ${NEXT_PLAN_NUM}."
- If phase complete: "Phase ${PHASE_NUM} complete. All plans executed. Ready for verify-work workflow."

**Do not suggest next action until STATE.md is updated.**
