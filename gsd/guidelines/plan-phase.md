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

## Phase Discovery Examples

### Example 1: Backend API Phase (Technical)

**Phase Goal:** Build RESTful API with authentication and CRUD operations

```
Agent: "Before I create plans for Phase 2: Backend API, I have a few questions:

1. Any technology preferences for the backend?
2. Are there constraints I should know about?
3. How should we handle authentication?"

User: "Use what makes sense. No major constraints. Need user login."

[VAGUE - dig deeper]

Agent: "For the backend, I'm thinking Node.js with Express since it's popular and has good ecosystem support. Does that work for you?"

User: "Yeah, Node.js is good. We know JavaScript."

Agent: "Great. For authentication, are you thinking traditional email/password, OAuth (Google/GitHub), magic links, or a combination?"

User: "Email and password for now"

Agent: "Got it. Should we use sessions or JWT tokens?"

User: "JWT is fine"

Agent: "Perfect. One more thing - any database preference, or should I recommend PostgreSQL?"

User: "PostgreSQL works"

[CLEAR]

Agent: "Based on our discussion:
- Backend: Node.js with Express
- Auth: Email/password with JWT tokens
- Database: PostgreSQL

I'll create plans for these components."
```

### Example 2: Dashboard UI Phase (Design + Technical)

**Phase Goal:** Create admin dashboard for managing users and content

```
Agent: "Before I create plans for Phase 3: Admin Dashboard, I have a few questions:

1. Do you have designs or mockups, or should I plan the UI structure?
2. Any specific UI framework or component library preferences?
3. Any accessibility or responsive design requirements?"

User: "No mockups. React is good. Make it look professional."

[VAGUE "professional" - clarify]

Agent: "Got it. By 'professional', are you thinking clean and minimal (like Stripe), data-dense (like AWS Console), or something else?"

User: "Clean and minimal, like Stripe or Linear"

Agent: "Perfect. For that aesthetic, Tailwind CSS works well. Should I use a pre-built component library like shadcn/ui, or custom Tailwind components?"

User: "shadcn/ui sounds good, faster to build"

Agent: "Agreed. For the dashboard layout - sidebar navigation or top navigation?"

User: "Sidebar, easier to add more sections later"

Agent: "Makes sense. Should the dashboard be responsive for mobile/tablet, or desktop-only since it's an admin tool?"

User: "Desktop-only is fine for v1"

Agent: "One last thing - dark mode support, or light mode only?"

User: "Light mode only for now"

[CLEAR]

Agent: "Based on our discussion:
- UI: React with Tailwind CSS and shadcn/ui components
- Style: Clean, minimal (Stripe/Linear aesthetic)
- Layout: Sidebar navigation
- Platform: Desktop-only (v1)
- Theme: Light mode only

I'll create plans for this dashboard structure."
```

### Example 3: Real-Time Feature Phase (User Experience + Technical)

**Phase Goal:** Add real-time chat feature to application

```
Agent: "Before I create plans for Phase 4: Real-Time Chat, I have a few questions:

1. How should users interact with chat? (workflow/UX)
2. Any technical approach preferences?
3. What's most important - speed to ship or polish?"

User: "Like Slack - channels and DMs. Need it working in 2 weeks."

[CLEAR PRIORITY: SPEED]

Agent: "Got it, Slack-style UX with a 2-week timeline. To ship fast, should we use an existing chat SDK like Stream or SendBird, or build custom with WebSockets?"

User: "What's faster?"

Agent: "Stream Chat SDK would be fastest - they handle infrastructure, UI components, and real-time sync. Custom with Socket.io gives more control but takes longer. Given your 2-week timeline, I'd recommend Stream."

User: "Yeah, let's use Stream then"

Agent: "Smart. For the UI, should we use Stream's pre-built React components (fastest) or build custom UI that matches your design system?"

User: "Pre-built is fine, we can customize later"

Agent: "Perfect approach for speed. One more thing - do you need message search, file uploads, or just text messages for v1?"

User: "Just text for now"

[CLEAR WITH CONSTRAINTS]

Agent: "Based on our discussion:
- UX: Slack-style (channels + DMs)
- Tech: Stream Chat SDK with React components
- Approach: Use pre-built components (optimize for speed)
- Features: Text messages only (v1)
- Timeline: 2 weeks

I'll create plans focused on rapid integration of Stream Chat."
```

### Example 4: User Says "Just Do What's Best"

**Phase Goal:** Add payment processing to e-commerce app

```
Agent: "Before I create plans for Phase 5: Payment Processing, I have a few questions:

1. Any payment provider preferences?
2. Are there constraints I should know about?
3. How should we handle payment flow?"

User: "I don't know much about payments. Just do what's best."

[USER UNCERTAIN - offer recommendation]

Agent: "No problem! For payment processing, I'd recommend Stripe because:
- Industry standard (trusted by millions)
- Excellent documentation and SDKs
- Handles security/compliance (PCI)
- Works in most countries
- Good developer experience

Does Stripe work for you?"

User: "Sure, Stripe is fine"

Agent: "Great. For the payment flow, we have two options:

**Option A - Stripe Checkout (faster):**
- Pre-built payment page hosted by Stripe
- Less customization, but ships in days
- Stripe handles all UI and validation

**Option B - Stripe Elements (more control):**
- Embedded payment form in your site
- Full design control, matches your brand
- Takes longer to build and test

Given you want to ship quickly, which appeals more?"

User: "Option A sounds better for now"

Agent: "Smart choice for v1. Last question - what should happen after successful payment? Email confirmation, redirect to success page, or both?"

User: "Both - email and success page"

[CLEAR WITH RECOMMENDATIONS ACCEPTED]

Agent: "Based on our discussion:
- Payment provider: Stripe
- Integration: Stripe Checkout (hosted, pre-built)
- Post-payment: Email confirmation + success page redirect

I'll create plans for Stripe Checkout integration."
```

## Boundaries

### Always Do

- **Have conversational discovery before planning** (not rigid questionnaire)
- **Start with 3 essential questions** (don't overwhelm with long lists)
- **Dig deeper only if user's answer is vague or raises new questions**
- **Summarize understanding briefly** before creating plans
- **Save discussion to CONTEXT.md** before creating plans
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

- **Skip conversational discovery** (must ask questions before planning)
- **Ask all questions at once** (use conversational flow, 1-3 at a time)
- **Accept vague answers without clarification** (dig deeper when needed)
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

### Phase 2: Pre-Planning Discussion (Conversational Discovery)

3. **Conversational phase discovery (adaptive questioning):**

   Read ROADMAP.md phase goal, then engage in brief conversation to clarify approach.

   **Pattern: Ask 3 essentials → Listen → Dig deeper if needed**

   **The 3 Essential Questions (adapt based on phase type):**

   Identify phase type from goal keywords:
   - **Technical** (keywords: "infrastructure", "backend", "API", "database", "system"): tech choices
   - **UI/Design** (keywords: "frontend", "UI", "dashboard", "interface", "design"): design + tech
   - **Feature** (keywords: "add", "implement", "build feature"): user experience + tech

   **For Technical/Infrastructure phases:**
   ```
   Before I create plans for Phase X: [Name], I have a few questions:

   1. Any technology preferences for [key component]?
   2. Are there constraints I should know about? (performance, existing systems, etc.)
   3. How should we handle [key technical decision]?
   ```

   **For UI/Design phases:**
   ```
   Before I create plans for Phase X: [Name], I have a few questions:

   1. Do you have designs or mockups, or should I plan the UI structure?
   2. Any specific UI framework or component library preferences?
   3. Any accessibility or responsive design requirements?
   ```

   **For Feature Implementation phases:**
   ```
   Before I create plans for Phase X: [Name], I have a few questions:

   1. How should users interact with [feature]? (workflow/UX)
   2. Any technical approach preferences? (architecture, libraries)
   3. What's most important - speed to ship or polish?
   ```

   **Follow-Up Question Rules:**

   If user's answer reveals ambiguity or new questions, dig deeper:

   1. **If user gives vague answer:**
      - "What do you mean by [term]?"
      - "Can you give an example?"

   2. **If user mentions existing system:**
      - "How should [new feature] integrate with [existing system]?"
      - "Should we follow the same patterns as [existing feature]?"

   3. **If user says "I don't know" or "you decide":**
      - Offer 2-3 options with trade-offs
      - "I'm thinking [option A] because [reason]. Does that work?"

   4. **If user's answer introduces new complexity:**
      - "That sounds more involved. Should we break this into multiple phases?"
      - "What's the priority - [aspect A] or [aspect B]?"

   **Keep it conversational:**
   - Ask 1-3 questions initially (not overwhelming)
   - If user gives detailed first answer, ask fewer follow-ups
   - If user gives brief answers, dig deeper
   - Stop when you understand the approach clearly

   **Stopping Condition:**

   Stop asking when you have clarity on:
   - ✓ Key technical/design decisions for this phase
   - ✓ Constraints or requirements specific to this phase
   - ✓ Integration points with existing work

   **Conversation Examples:**

   **Example 1: Infrastructure Phase (Brief)**
   ```
   Phase 3: Core Infrastructure

   Agent: "Before I create plans for Phase 3: Core Infrastructure, I have a few questions:

   1. Any technology preferences for the backend API?
   2. Are there constraints I should know about?
   3. How should we handle authentication?"

   User: "Node.js with Express is fine. No constraints. Use JWT for auth."

   [USER CLEAR - minimal follow-up needed]

   Agent: "Perfect, that's clear. I'll create plans using Express and JWT authentication."
   ```

   **Example 2: UI Phase (Needs Depth)**
   ```
   Phase 4: Dashboard UI

   Agent: "Before I create plans for Phase 4: Dashboard UI, I have a few questions:

   1. Do you have designs or mockups, or should I plan the UI structure?
   2. Any specific UI framework or component library preferences?
   3. Any accessibility or responsive design requirements?"

   User: "No mockups yet. Use React."

   [VAGUE - dig deeper]

   Agent: "Got it. For the component library, are you thinking Material-UI, Ant Design, Tailwind, or build custom?"

   User: "Tailwind for styling"

   Agent: "Good choice. For the dashboard layout, are you envisioning a sidebar navigation, top nav, or something else?"

   User: "Sidebar navigation like most admin dashboards"

   Agent: "Makes sense. One more thing - any accessibility requirements? WCAG 2.1 AA compliance, screen reader support?"

   User: "Basic accessibility is fine, don't need full WCAG compliance yet"

   [ENOUGH CONTEXT]

   Agent: "Perfect. I'll create plans for a React dashboard with Tailwind styling, sidebar navigation, and basic accessibility practices."
   ```

   **Example 3: Feature Phase (Needs Clarification)**
   ```
   Phase 5: User Notifications

   Agent: "Before I create plans for Phase 5: User Notifications, I have a few questions:

   1. How should users interact with notifications? (in-app popup, email, push, etc.)
   2. Any technical approach preferences?
   3. What's most important - speed to ship or polish?"

   User: "In-app notifications, real-time updates"

   Agent: "Got it. For real-time, are you thinking WebSockets, Server-Sent Events, or polling?"

   User: "WebSockets"

   Agent: "Good. Socket.io or native WebSockets?"

   User: "Socket.io is fine"

   Agent: "Perfect. Should notifications persist in database, or just live updates?"

   User: "Persist them, users should see notification history"

   Agent: "Makes sense. Last thing - notification preferences? Should users be able to mute certain types?"

   User: "Not for MVP, we can add that later"

   [CLEAR]

   Agent: "Understood. I'll create plans for Socket.io-based real-time notifications with database persistence, notification preferences deferred to Phase 2."
   ```

   **Wait for conversation to complete, then summarize understanding briefly:**
   ```
   Based on our discussion:
   - [Key decision 1]
   - [Key decision 2]
   - [Key decision 3]

   I'll use this to create your execution plans.
   ```

4. **Save discussion context:**
   After conversational discovery completes, persist to CONTEXT.md:

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

1. **Conversational discovery completed**: Agent asked ~3 questions, dug deeper on vague answers, summarized understanding
2. **Discussion saved to CONTEXT.md**: Key decisions and preferences documented
3. At least one PLAN.md exists for phase
4. Each PLAN.md has all required sections (objective, tasks, verification, success_criteria)
5. Tasks include `<name>`, `<files>`, `<action>`, `<verify>`, `<done>` elements
6. **Plans presented to user**: Structured summary shown with key decisions from conversation
7. **User approval obtained**: User explicitly approved plans (logged in STATE.md)
8. STATE.md shows currentPhase, currentPlan, and status="planned-approved"
9. Git commit created successfully with approval timestamp
10. Total tasks across all plans cover all phase deliverables from ROADMAP.md
11. **Plans reflect conversation context**: Technical decisions from discussion are incorporated into plans

**Critical:** Conversational discovery (steps 1-2) must happen before plan creation. Plans without discovery context are generic and miss user preferences.

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
