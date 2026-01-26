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

## Conversational Examples

### Example 1: New CLI Tool Project

```
User: "initialize GSD"

Agent: "I'll help you set up GSD for this project. What do you want to accomplish?"

User: "Build a CLI tool to manage database migrations"

Agent: "Interesting! What do you mean by 'manage' - are you thinking creating migrations, running them, rolling back, or all of the above?"

User: "All of it - create, run forward, rollback, show status"

Agent: "Got it. What databases do you need to support?"

User: "PostgreSQL and MySQL to start"

Agent: "Makes sense. Who's the target user - developers using this in their projects, or are you building this for internal use?"

User: "Developers in general, I want to publish it as an open source tool"

Agent: "Nice! What language are you thinking for the CLI? Node.js, Go, Python, Rust?"

User: "Go - I want it to be a single binary with no dependencies"

Agent: "Perfect choice for a CLI. Any timeline in mind?"

User: "Side project, no rush. Want to get a working MVP then iterate."

Agent: "Sounds good. Let me make sure I understand correctly:

**Project Goal:**
Build a lightweight, Go-based CLI tool for database migrations (create, run, rollback, status) supporting PostgreSQL and MySQL, published as open source.

**Target Users:**
Developers who want a simple migration tool

**Core Features (MVP):**
- Create new migration files
- Run migrations forward
- Rollback migrations
- Show migration status
- Support PostgreSQL and MySQL

**Technical Context:**
- Language: Go (single binary distribution)
- Target: CLI tool
- Distribution: Open source

**Timeline & Constraints:**
- Side project, iterative development
- No hard deadline

Does this capture what you're building?"

User: "Yes, that's exactly it!"

Agent: "Great! I'll generate your project structure and requirements based on this."

[Proceeds to codebase detection and artifact generation]
```

### Example 2: Existing Codebase Enhancement

```
User: "start GSD"

Agent: "I'll help you set up GSD. Let me check if there's existing code here..."

[Detects existing Express/MongoDB project]

Agent: "I see you have an existing Express app here. What do you want to accomplish with GSD in this project?"

User: "Add a real-time notification system"

Agent: "Got it. What kind of notifications - in-app alerts, push notifications, email, or something else?"

User: "In-app real-time notifications, like when someone comments on your post"

Agent: "Makes sense. Looking at your codebase, you're using Express with MongoDB. Do you want to stick with that stack for notifications, or are you open to adding new tech?"

User: "Stick with what we have if possible"

Agent: "Good call. For real-time, are you thinking WebSockets, Server-Sent Events, or polling?"

User: "WebSockets probably"

Agent: "Socket.io or native WebSockets?"

User: "Socket.io is fine"

Agent: "Perfect. What's the scale - how many users and what notification volume?"

User: "About 500 active users, maybe 50-100 notifications per minute at peak"

Agent: "That's manageable. Timeline on this?"

User: "Need it working in 2 weeks"

Agent: "Alright, let me summarize:

**Project Goal:**
Add real-time in-app notifications to existing Express/MongoDB app using Socket.io

**Existing Codebase:**
- Stack: Node.js, Express, MongoDB
- Already has Socket.io in dependencies

**What We're Adding:**
- Real-time notification system
- WebSocket connection management
- Notification storage and retrieval
- UI components for notifications
- Read/unread status tracking

**Technical Constraints:**
- Use existing stack (Express, MongoDB, Socket.io)
- Handle ~100 notifications/minute peak

**Timeline:**
- 2 weeks to working implementation

**Scale:**
- 500 active users

Does that match what you need?"

User: "Yes, but I also need notification preferences - users should be able to mute certain types"

Agent: "Ah good point! I'll add that:

**Additional Requirements:**
- User notification preferences/settings
- Ability to mute specific notification types
- Preference persistence in MongoDB

Updated summary good?"

User: "Perfect"

Agent: "Great! I'll generate your GSD project structure with full context about your existing codebase and what we're adding."

[Proceeds to artifact generation]
```

## Boundaries

### Always Do

- **Engage in conversational discovery before generating artifacts** (don't skip to artifact creation)
- **Ask follow-up questions** when initial answer is vague or incomplete
- **Summarize understanding** and wait for user confirmation before proceeding
- Create `.planning/` directory before generating artifacts
- Validate all required sections exist in generated files before marking complete
- Update STATE.md to reflect initialization status
- Create git commit after successful initialization

### Ask First

- Changing default directory structure (`.planning/` → something else)
- Adding additional artifact files beyond PROJECT.md, REQUIREMENTS.md, STATE.md
- Modifying template structure or sections

### Never Do

- **Skip conversational discovery** (don't generate artifacts from one-sentence descriptions)
- **Generate artifacts before confirming understanding** (always summarize and get user confirmation)
- **Ask all questions at once** (use conversational flow with 1-2 questions at a time)
- Skip artifact validation (required sections must exist)
- Proceed to next workflow without successful git commit
- Generate artifacts outside `.planning/` directory
- Modify `.gsd-config.json` without user approval

## Workflow Steps

1. **Detect trigger phrase and start conversation:**
   - User says "start GSD" or equivalent trigger from `.gsd-config.json`
   - Say: "I'll help you set up GSD for this project. What do you want to accomplish?"
   - Wait for initial response

1.5. **Conversational Discovery (adaptive questioning):**

   After user provides initial goal, engage in conversational Q&A to deeply understand their project.

   **Pattern: Ask → Listen → Clarify → Repeat**

   **Question Generation Rules:**

   Based on user's answer, identify **ambiguous or incomplete areas** and ask follow-up questions:

   1. **If user mentions a feature/outcome without context:**
      - "What do you mean by [feature]?"
      - "Who would use [feature]?"
      - "What problem does [feature] solve?"

   2. **If user describes a problem without scale:**
      - "How many users/records/requests are we talking about?"
      - "Is this for personal use, a team, or public?"

   3. **If user mentions technical terms vaguely:**
      - "When you say [term], do you mean [interpretation A] or [interpretation B]?"
      - "Are you thinking [specific tech] or open to recommendations?"

   4. **If scope is unclear:**
      - "Is this an MVP for validation, or production-ready from day one?"
      - "What's the minimum version that would be useful?"

   5. **If constraints are missing:**
      - "Any timeline in mind?"
      - "Working solo or with a team?"
      - "Any technical constraints? (existing systems, required tech, etc.)"

   6. **If user gives broad vision:**
      - "That sounds comprehensive. What's the first priority?"
      - "If you could only build one part first, which would it be?"

   **Conversation Guidelines:**
   - Ask 1-2 questions at a time (not overwhelming)
   - Build on previous answers
   - Dig deeper when answers reveal new questions
   - Don't ask about things already clear from context
   - Be conversational, not interrogative

   **Stopping Conditions - Stop asking questions when you have clarity on:**

   **Must-have context:**
   - ✓ What the project does (core functionality)
   - ✓ Who uses it (target audience)
   - ✓ Scale/scope (MVP vs full product, user count estimate)

   **Important context (ask if not clear):**
   - Technical stack preferences (or existing codebase determines this)
   - Timeline/urgency
   - Deployment environment

   **Nice-to-have context (use defaults if missing):**
   - Testing preferences
   - Documentation needs
   - CI/CD preferences

   **Summarize Understanding:**

   After gathering sufficient context, summarize your understanding:

   ```
   Okay, based on our conversation, here's what I understand:

   **Project Goal:**
   [1-2 sentence summary of what they're building and why]

   **Target Users:**
   [Who will use this, how many, what context]

   **Core Features (MVP):**
   - [Feature 1]
   - [Feature 2]
   - [Feature 3]

   **Technical Context:**
   - Stack: [Language, framework, database]
   - Deployment: [Where it will run]
   - Integrations: [External systems]

   **Timeline & Constraints:**
   - Target: [Timeline if mentioned]
   - Team: [Solo/team if mentioned]
   - Constraints: [Any technical/business constraints]

   **Deferred/Out of Scope (for now):**
   - [Feature X - mentioned but not MVP]
   - [Feature Y - nice-to-have]

   Does this capture what you're trying to build? Anything I'm missing or misunderstanding?
   ```

   **Wait for user confirmation:**
   - If user confirms: proceed to step 2
   - If user corrects: update understanding, re-summarize, confirm again
   - If user adds more: incorporate, update summary, confirm again

   **Extract project metadata:**
   - Project name: from directory name or ask if ambiguous
   - Core value: derive from user's stated goals
   - Requirements: extract from features discussed

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

5. **Generate PROJECT.md from discovery context:**
   - Execute template-renderer.js with PROJECT template
   - Populate with **specific details from conversational discovery**:
     * projectName: extracted from directory or discussion
     * coreValue: derived from user's stated goals
     * description: "What This Is" from discussion
     * context: users, scale, existing systems discussed
     * constraints: timeline, team, technical constraints mentioned
     * requirements: features and capabilities identified
   - Write to `.planning/PROJECT.md`
   - Verify file contains all required sections with **specific, not generic, content**

6. **Generate REQUIREMENTS.md from discovery context:**
   - Execute template-renderer.js with REQUIREMENTS template
   - Populate with **specific requirements from discovery**:
     * Active requirements: core features discussed for MVP
     * Out of Scope: features explicitly deferred or mentioned as "later"
     * Context-aware: if existing codebase, requirements respect existing patterns
   - Write to `.planning/REQUIREMENTS.md`
   - Verify file contains v1, v2, and Out of Scope sections with **user's actual features**

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

1. **Conversational discovery completed**: User confirmed understanding summary
2. `.planning/PROJECT.md` exists with all required sections populated with **specific context** from discovery
3. `.planning/REQUIREMENTS.md` exists with section structure reflecting **user's actual needs**
4. `.planning/STATE.md` exists with status: initialized
5. Git commit created successfully
6. User can open any artifact file and see properly formatted markdown with **their specific project details** (not generic boilerplate)

## Next Action

After successful completion:
- Inform user: "GSD initialized for [PROJECT_NAME]. Your goal: [USER_STATED_GOAL]. I've documented everything we discussed in PROJECT.md and REQUIREMENTS.md. Next step: create a roadmap breaking this down into phases."
- Recommended workflow: User can now trigger roadmap creation (which will reference the context gathered during discovery)
