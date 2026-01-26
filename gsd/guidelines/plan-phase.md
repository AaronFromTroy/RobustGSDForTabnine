---
version: "1.1.0"
type: "guideline"
workflow: "plan-phase"
last_updated: "2026-01-18"
schema: "gsd-guideline-v1"
---

# Plan Phase Workflow

This guideline enables Tabnine to create execution plans for a specific roadmap phase through discussion, planning, and approval.

## Commands

Execute in this order (see Workflow Steps for full details):

### Context Loading
```bash
# Load ROADMAP.md to identify next phase
node gsd/scripts/guideline-loader.js --workflow=plan-phase
```

### Pre-Planning Discussion
*Ask user clarifying questions (see Workflow Steps Phase 2)*
*Wait for user responses before proceeding*

### Save Discussion Context
```bash
# Persist user responses to CONTEXT.md
node gsd/scripts/context-loader.js \
  --action=save \
  --phase=${PHASE_NUM} \
  --phaseName="${PHASE_NAME}" \
  --answers='${ANSWERS_JSON}' \
  --phaseGoal="${GOAL_FROM_ROADMAP}"
```

### Plan Creation
```bash
# Create phase directory
mkdir -p ".planning/phases/${PHASE_DIR}"

# Generate PLAN.md file(s) - informed by discussion responses
node gsd/scripts/template-renderer.js --template=PLAN --output=".planning/phases/${PHASE_DIR}/${PHASE}-${PLAN}-PLAN.md" --phaseName="${PHASE_NAME}" --planNumber="${PLAN_NUM}"
```

### Plan Presentation & Approval
*Present plan summary to user (see Workflow Steps Phase 4)*

```bash
# Request approval with options
node gsd/scripts/approval-gate.js \
  --gate="Phase ${PHASE_NUM} Planning Approval" \
  --options='[...]'

# Log approval decision
node gsd/scripts/approval-gate.js \
  --log \
  --decision="User approved Phase ${PHASE_NUM} planning"
```

*If user requests changes: modify plans and re-present*
*If user rejects: return to discussion phase*

### Finalization
```bash
# Update STATE.md with approval
node gsd/scripts/state-manager.js --update currentPhase="${PHASE_NUM}" currentPlan="${PLAN_NUM}" status="planned-approved"

# Create git commit with approval note
git add ".planning/phases/${PHASE_DIR}/"
git add .planning/STATE.md
git commit -m "docs(phase-${PHASE_NUM}): create and approve execution plans

- ${PLAN_COUNT} plan(s) approved by user
- ${TASK_COUNT} total tasks defined
- Mapped requirements: ${REQ_IDS}
- Key decisions: ${DECISION_SUMMARY}

Approved: $(date --iso-8601=seconds)
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
        ├── XX-CONTEXT.md           # Discussion results (created before planning)
        ├── XX-RESEARCH.md          # Optional research
        ├── XX-01-PLAN.md           # First plan
        └── XX-02-PLAN.md           # Second plan (if needed)
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

- **Discuss before planning**: Ask clarifying questions before creating plans
- **Save discussion responses to CONTEXT.md before creating plans**
- **Present plans**: Show structured summary of what will be built
- **Wait for approval**: Do not proceed to execution without explicit user approval
- Read ROADMAP.md before creating plans
- Load CONTEXT.md or RESEARCH.md if exists for phase
- Break phase into 2-3 tasks per plan (not monolithic)
- Include verification criteria for each task
- Log approval decision to STATE.md
- Update STATE.md status to "planned-approved" after approval

### Ask First

- Adding more than 3 plans per phase
- Changing task structure (XML format)
- Modifying phase directory naming convention
- Skipping discussion questions (if user says "just plan it")

### Never Do

- **Skip discussion phase** (must ask clarifying questions)
- **Skip approval gate** (must wait for explicit approval)
- **Proceed to execution without approval** (critical - causes rework)
- Skip reading ROADMAP.md (plans must align with phase goals)
- Create plans without success criteria
- Modify existing PLAN.md files without user approval

## Workflow Steps

### Phase 1: Context Loading

1. **Read ROADMAP.md:**
   - Identify next phase based on STATE.md current position
   - Extract phase name, dependencies, requirements, success criteria
   - Note deliverables expected

2. **Check for phase context:**
   - Look for `.planning/phases/XX-name/XX-CONTEXT.md`
   - Look for `.planning/phases/XX-name/XX-RESEARCH.md`
   - Load if exists to understand implementation decisions

### Phase 2: Pre-Planning Discussion (NEW)

3. **Ask clarifying questions:**

   Present questions to gather context before creating plans. Tailor questions to the phase type:

   **For foundation/infrastructure phases:**
   - "What technology stack do you prefer for [specific component]?"
   - "Any existing libraries or frameworks you want to use?"
   - "Code organization preference (flat, modular, domain-driven)?"
   - "Testing strategy (unit, integration, e2e)?"

   **For UI/frontend phases (NEW - Design Focus):**
   - "Do you have a design system or style guide to follow?"
   - "Preferred UI framework/library (React, Vue, vanilla, etc.)?"
   - "Responsive design requirements (mobile-first, desktop-first, specific breakpoints)?"
   - "Accessibility requirements (WCAG level, screen reader support)?"
   - "Design patterns preference (Material, iOS, custom)?"
   - "Color palette or brand guidelines?"
   - "Typography preferences (font families, scale)?"
   - "Component library to use (MUI, Ant Design, Tailwind, custom)?"
   - "Animation/interaction preferences (minimal, smooth transitions, rich interactions)?"
   - "Layout system (grid, flexbox, CSS Grid, specific framework)?"

   **For feature implementation phases:**
   - "Any UI/UX constraints or design mockups to follow?"
   - "User flow preferences (multi-step wizard, single page, modal-based)?"
   - "Form design approach (inline validation, submit-only, progressive disclosure)?"
   - "Error/success feedback patterns (toasts, inline messages, modal alerts)?"
   - "Performance requirements (response time, load capacity)?"
   - "Error handling approach (fail fast, graceful degradation)?"
   - "Third-party services or APIs to integrate?"

   **For user-facing feature phases (NEW - UX Focus):**
   - "Target user personas or use cases?"
   - "Critical user journeys to support?"
   - "Onboarding/empty state handling?"
   - "Loading states and skeleton screens needed?"
   - "Confirmation patterns for destructive actions?"
   - "Help/documentation approach (tooltips, guided tours, help center)?"
   - "Search/filter/sort requirements?"
   - "Pagination or infinite scroll preference?"

   **For all phases:**
   - "Are there any constraints I should know about?"
   - "What's your risk tolerance? (move fast vs be cautious)"
   - "Preferred commit granularity? (atomic vs feature branches)"

   **Format:**
   ```
   Before I create execution plans for Phase X: [Name], I'd like to clarify a few things:

   ## Technical Approach
   1. [Question 1]
   2. [Question 2]

   ## Design & UX (if applicable)
   3. [Design question 1]
   4. [Design question 2]

   ## Workflow Preferences
   5. [Question about risk/commits]

   Please answer what's relevant - I'll use defaults for anything skipped.
   ```

   **Example for UI phase:**
   ```
   Before I create execution plans for Phase 2: Dashboard UI, I'd like to clarify:

   ## Technical Approach
   1. Preferred UI framework? (React, Vue, vanilla JS, or existing choice)
   2. State management approach? (Context API, Redux, Zustand, MobX)

   ## Design & UX
   3. Do you have design mockups or a style guide to follow?
   4. Responsive design priority? (mobile-first, desktop-first, or equal)
   5. Accessibility requirements? (WCAG 2.1 AA, screen reader support)
   6. Component library preference? (MUI, Ant Design, Tailwind, custom)
   7. Animation/interaction style? (minimal, smooth transitions, rich)

   ## Workflow Preferences
   8. Risk tolerance for this phase? (move fast, be cautious, balanced)

   Please answer what's relevant - I'll use defaults for anything skipped.
   ```

   **Wait for user responses.** Store responses in memory for plan creation.

4. **Save discussion context:**
   After user provides responses, persist to CONTEXT.md:

   ```javascript
   import { saveDiscussionContext } from './gsd/scripts/context-loader.js';

   // Example: Save responses to CONTEXT.md
   const contextPath = await saveDiscussionContext(
     phase,           // Phase number (e.g., 2)
     phaseName,       // Phase name slug (e.g., 'core-infrastructure')
     answers,         // User responses object
     phaseGoal        // Phase objective from ROADMAP.md
   );

   console.log(`Context saved to: ${contextPath}`);
   ```

   This creates: `.planning/phases/XX-name/XX-CONTEXT.md`

   **CONTEXT.md structure:**
   - Frontmatter: phase, phase_name, gathered date, status
   - `<domain>`: Phase boundary from ROADMAP.md
   - `<decisions>`: Locked-in choices (constraints for planning)
   - `<specifics>`: Implementation details and preferences
   - `<deferred>`: Out-of-scope items for this phase

### Phase 3: Plan Creation

5. **Determine plan structure:**
   - Count deliverables from ROADMAP.md
   - Load locked decisions from CONTEXT.md (respect user constraints)
   - Incorporate user responses from discussion
   - Group related deliverables into logical plans
   - Target 2-3 tasks per plan for manageability
   - Identify any checkpoint tasks (human verification needed)

6. **Create phase directory:**
   - Execute: `mkdir -p ".planning/phases/${PHASE_DIR}"`
   - Use naming pattern: `01-foundation-templates`

7. **Generate PLAN.md file(s):**
   - For each plan:
     - Execute template-renderer.js with PLAN template
     - Populate frontmatter: phase, plan, type, wave, depends_on
     - Write `<objective>` with purpose and output
     - Write `<tasks>` section with task XML elements (informed by discussion)
     - Write `<verification>` criteria
     - Write `<success_criteria>` measurable completion
     - Save to `.planning/phases/XX-name/XX-NN-PLAN.md`

### Phase 4: Plan Presentation (NEW)

8. **Present plans to user:**

   After creating all plans, show a structured summary:

   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Phase X: [Name] - Planning Complete
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ## Plans Created: [N]

   ### Plan X-01: [Plan Name]
   **What:** [1-2 sentence objective]
   **Tasks:** [N] tasks
   **Key deliverables:**
   - [Deliverable 1]
   - [Deliverable 2]

   ### Plan X-02: [Plan Name]
   **What:** [1-2 sentence objective]
   **Tasks:** [N] tasks
   **Key deliverables:**
   - [Deliverable 1]
   - [Deliverable 2]

   ## Key Decisions Based on Discussion:

   **Technical:**
   - [Technology choice]: [What you chose and why]
   - [Architecture pattern]: [What you chose and why]
   - [Testing approach]: [What you chose and why]

   **Design & UX:** (if applicable)
   - [Design system]: [What you'll follow]
   - [Component library]: [What you chose and why]
   - [Responsive approach]: [Mobile-first/desktop-first and breakpoints]
   - [Accessibility]: [Standards and requirements]
   - [Interaction patterns]: [Animation style, feedback patterns]
   - [Layout system]: [Grid/flexbox approach]

   ## Execution Order:
   1. Plan X-01 (wave 1) - no dependencies
   2. Plan X-02 (wave 2) - depends on X-01 completion

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

### Phase 5: Approval Gate (NEW)

8.5. **Check for natural language approval first:**

   Before presenting structured options, check if user already provided approval in natural language:

   **Approval phrases (case-insensitive):**
   - "looks good" / "lgtm"
   - "approved" / "approve"
   - "go ahead" / "proceed"
   - "ship it"
   - "continue" / "next"

   **If user already typed approval phrase:**
   - Skip approval-gate.js structured UI (step 9)
   - Proceed directly to step 10 (log approval)
   - Treat as equivalent to selecting "approve" option

   **If no approval phrase detected:**
   - Continue to step 9 (present structured options)

9. **Request approval (if not already given):**

   If user hasn't already provided approval in natural language, use approval-gate.js to present options:

   ```bash
   node gsd/scripts/approval-gate.js \
     --gate="Phase X Planning Approval" \
     --context="Review plans above" \
     --options='[
       {
         "label": "Approve - Proceed to execution",
         "value": "approve",
         "pros": ["Plans align with phase goal", "Task breakdown is clear"],
         "cons": []
       },
       {
         "label": "Request changes",
         "value": "changes",
         "pros": ["Refine approach before execution"],
         "cons": ["Takes more time"]
       },
       {
         "label": "Reject - Start over",
         "value": "reject",
         "pros": ["Completely different approach"],
         "cons": ["Loses current work"]
       }
     ]'
   ```

   **Wait for user decision:**
   - **If "approve"** OR **user types approval phrase** (from step 8.5): Continue to step 10
   - **If "changes"**: Ask "What would you like changed?" → Modify plans → Re-present → Request approval again
   - **If "reject"**: Ask "What approach should we take instead?" → Return to step 3 (discussion)

   **Natural language handling:**
   - If user types "looks good" instead of selecting option, treat as approval
   - If user describes specific issues, treat as "changes" request
   - If user asks questions, answer them then re-request approval

10. **Log approval decision:**
   ```bash
   node gsd/scripts/approval-gate.js \
     --log \
     --decision="User approved Phase X planning" \
     --rationale="[User's reasoning if provided]"
   ```

### Phase 6: Finalization

11. **Update STATE.md:**
    - Execute state-manager.js with update flags
    - Set currentPhase, currentPlan, status="planned-approved"
    - Record approval timestamp

12. **Create git commit:**
    - Stage phase directory and STATE.md
    - Commit with phase identifier and approval note in message:
    ```
    docs(phase-X): create and approve execution plans

    - [Number of plans] approved by user
    - [Number of tasks defined]
    - [Requirements mapped]
    - Key decisions: [Brief list]

    Approved: [Timestamp]
    Co-Authored-By: Tabnine Agent <noreply@tabnine.com>
    ```

## Success Criteria

Workflow is complete when:

1. **Discussion phase completed and saved to CONTEXT.md**: User answered clarifying questions (or explicitly skipped)
2. At least one PLAN.md exists for phase
3. Each PLAN.md has all required sections (objective, tasks, verification, success_criteria)
4. Tasks include `<name>`, `<files>`, `<action>`, `<verify>`, `<done>` elements
5. **Plans presented to user**: Structured summary shown with key decisions
6. **User approval obtained**: User explicitly approved plans (logged in STATE.md)
7. STATE.md shows currentPhase, currentPlan, and status="planned-approved"
8. Git commit created successfully with approval timestamp
9. Total tasks across all plans cover all phase deliverables from ROADMAP.md

**Critical:** Steps 1, 5, and 6 are new and mandatory. Skipping them defeats the purpose of this enhancement.

## Next Action

After successful completion (with user approval):

**Output to user:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase ${PHASE_NUM}: ${PHASE_NAME} - Ready for Execution ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Plans approved: ${PLAN_COUNT}
Total tasks: ${TASK_COUNT}
Status: Approved and ready

To begin execution, say: "execute phase ${PHASE_NUM}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Recommended workflow:** User triggers "execute phase ${PHASE_NUM}" to begin task execution

**If plans need revision:** User can say "revise phase ${PHASE_NUM} plans" to restart discussion and planning
