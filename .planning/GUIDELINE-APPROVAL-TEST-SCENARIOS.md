# Guideline Approval Protocol - Test Scenarios

**Created:** 2026-01-26
**Purpose:** Validate approval protocol improvements address user-reported issues

## Issue Background

User reported that after completing work in execute-phase, agent:
1. Did not automatically update STATE.md using state-manager.js
2. Manually edited STATE.md instead of using script
3. Offered to move to next phase without waiting for approval
4. Guidelines were unclear about when to update state

## Test Scenarios

### Scenario 1: Execute Phase 05-02 (Normal Flow)

**Setup:**
- Phase 05 with 4 plans (05-01, 05-02, 05-03, 05-04)
- 05-01-SUMMARY.md exists
- STATE.md shows: currentPlan=2, completedPlans=1, status="planned-approved"

**Expected Agent Behavior:**

1. **Sequencing Check (Step 1.5):**
   - ✓ Check 05-01-SUMMARY.md exists
   - ✓ Check completedPlans >= 1
   - ✓ Pass - proceed to execution

2. **Execute Tasks (Steps 2-6):**
   - Load PLAN.md
   - Execute all tasks
   - Validate each task
   - Generate work summary

3. **Approval Wait (Step 7):**
   - Present summary to user
   - Say: "Please review the work above. Say 'looks good' or 'approved' when ready to continue."
   - **WAIT** - do NOT update STATE.md yet

4. **User Response: "looks good"**
   - ✓ Detect approval phrase
   - Execute: `node gsd/scripts/state-manager.js --update status="completed" completedPlans="2"`
   - Create git commit
   - Announce: "Plan 05-02 complete. Ready for plan 05-03."

**Success Criteria:**
- ✓ Agent waits for approval before updating STATE.md
- ✓ Agent uses state-manager.js (not manual edit)
- ✓ Agent announces next action AFTER state update

---

### Scenario 2: Execute Phase 05-03 (Skip Detected)

**Setup:**
- Phase 05 with 4 plans
- 05-01-SUMMARY.md exists
- 05-02-SUMMARY.md MISSING (user trying to skip)
- STATE.md shows: currentPlan=3, completedPlans=1

**Expected Agent Behavior:**

1. **Sequencing Check (Step 1.5):**
   - Check 05-02-SUMMARY.md exists
   - ✗ FAIL - file missing
   - Show error message:
     ```
     ⚠ ERROR: Cannot execute Plan 05-03

     Previous plan not complete:
     - Plan 05-02 must finish first
     - Missing: .planning/phases/05-polish/05-02-SUMMARY.md
     - STATE.md shows: completedPlans=1 (expected: ≥2)

     Please complete Plan 05-02 first...
     ```
   - **STOP EXECUTION**

**Success Criteria:**
- ✓ Agent blocks execution (strict sequencing)
- ✓ Agent provides clear error message
- ✓ Agent does NOT proceed without previous plan

---

### Scenario 3: Execute Phase with User-Requested Fixes

**Setup:**
- Phase 05, Plan 02
- Agent completes all tasks

**Expected Agent Behavior:**

1. **Present Summary:**
   - Show completed work
   - Say: "Please review the work above. Say 'looks good' or 'approved' when ready."
   - **WAIT**

2. **User Response: "there's a bug in line 42"**
   - ✓ Recognize this is NOT approval
   - Say: "Let me fix that issue."
   - Fix the bug
   - Re-verify work
   - Present summary again
   - **WAIT again** - do NOT update STATE.md

3. **User Response (2nd attempt): "approved"**
   - ✓ Detect approval phrase
   - Execute: `node gsd/scripts/state-manager.js --update status="completed" completedPlans="2"`
   - Create git commit
   - Announce next action

**Success Criteria:**
- ✓ Agent handles multiple iterations
- ✓ Agent only updates state after approval
- ✓ Agent never updates state prematurely

---

### Scenario 4: Plan Phase with Natural Language Approval

**Setup:**
- Agent presents plans for Phase 06
- Shows structured summary

**Expected Agent Behavior:**

1. **Present Plans (Step 8):**
   - Show plan summaries
   - Key decisions

2. **Check Natural Language (Step 8.5):**
   - User types: "looks good"
   - ✓ Detect approval phrase
   - Skip approval-gate.js structured UI
   - Proceed to step 10 (log approval)

3. **Update State (Step 11):**
   - Execute: `node gsd/scripts/state-manager.js --update status="planned-approved"`
   - Create git commit

**Success Criteria:**
- ✓ Agent recognizes natural language approval
- ✓ Agent doesn't require structured UI if user already approved
- ✓ Agent logs approval correctly

---

### Scenario 5: Verify Work with Failed Verification

**Setup:**
- Phase 05 complete
- Run verification
- 2 layers fail (coverage below threshold, 1 acceptance criterion unmet)

**Expected Agent Behavior:**

1. **Run Verification (Step 1):**
   - Execute all 5 layers
   - Generate VERIFICATION.md (failures detected)

2. **Present Results (Step 1.5):**
   - Show failure summary
   - Reference VERIFICATION.md
   - Ask: "Fix issues now, proceed anyway, or review details?"
   - **WAIT** - do NOT update STATE.md

3. **User Response: "proceed anyway"**
   - ✓ Recognize this as user decision
   - Execute: `node gsd/scripts/state-manager.js --update verification="failed-approved"`
   - Note: Does NOT mark as "passed" but logs user acknowledged

**Success Criteria:**
- ✓ Agent presents results before updating state
- ✓ Agent waits for user decision on failures
- ✓ Agent respects user decision to proceed despite failures

---

## Key Improvements Summary

| Guideline | Issue Fixed | Improvement |
|-----------|-------------|-------------|
| **execute-phase.md** | No approval protocol, unclear timing | Added Approval Protocol section, step 7 now waits explicitly, added sequencing check (step 1.5) |
| **plan-phase.md** | Only structured UI, no natural language | Added step 8.5 to check for natural language approval before showing options |
| **verify-work.md** | No approval, immediate state update | Added Approval Protocol section, step 1.5 waits for user review before state update |

## Common Pattern

All three workflows now follow:
```
Complete work → Present results → WAIT → User approves → Update STATE.md → Announce next
```

**Critical enforcements:**
1. NEVER update STATE.md before user approval
2. ALWAYS use state-manager.js (never manual edit)
3. NEVER suggest next action before state update
4. ALWAYS wait for explicit approval phrases

---

*Test scenarios based on real user feedback from 2026-01-26*
