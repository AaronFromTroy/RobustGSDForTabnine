# New Project Conversational Discovery - Test Scenarios

**Created:** 2026-01-26
**Purpose:** Validate conversational discovery protocol works like original GSD

## Issue Background

User wanted project initialization to work like the original GSD library:
- Ask initial question
- Generate follow-up questions dynamically based on responses
- Dig deeper on vague answers ("what do you mean by X?")
- Continue until agent has clear understanding
- Summarize and confirm before generating artifacts

**Not** a rigid checklist of 25 questions.

## Test Scenarios

### Scenario 1: Vague Initial Response (Needs Depth)

**User Type:** Gives brief, high-level answers

```
User: "initialize GSD"

Agent: "I'll help you set up GSD for this project. What do you want to accomplish?"

User: "Build a web app"

[TOO VAGUE - agent must dig deeper]

Agent: "What kind of web app? What does it do?"

User: "Task management"

[STILL VAGUE - clarify further]

Agent: "Got it. What do you mean by task management? Are you thinking personal todo lists, team project management, or something else?"

User: "Team project management for small software teams"

[BETTER - now ask about specifics]

Agent: "Makes sense. What features are essential for the first version?"

User: "Tasks, assignments, due dates, comments. Maybe GitHub integration"

[GOOD DETAIL - ask about scale/constraints]

Agent: "Clear. How many users are we talking about? Is this for internal use or will you offer it as a service?"

User: "Start with our team of 8, might open it up later"

Agent: "Got it. Any tech stack preferences, or should I recommend based on your team's skills?"

User: "We're a React/Node shop"

Agent: "Perfect. Timeline on this?"

User: "Want an MVP in a month"

[ENOUGH CONTEXT - summarize]

Agent: "Okay, based on our conversation, here's what I understand:

**Project Goal:**
Build a team project management web app for small software teams, focused on task tracking with GitHub integration.

**Target Users:**
Small software teams (starting with internal team of 8)

**Core Features (MVP):**
- Task creation and tracking
- Task assignments
- Due dates
- Comments/discussion
- GitHub integration

**Technical Context:**
- Stack: React frontend, Node.js backend
- Deployment: TBD (will discuss during planning)

**Timeline & Constraints:**
- Target: MVP in 1 month
- Team: 8 developers (internal first)

**Deferred/Out of Scope (for now):**
- Public offering (internal MVP first)

Does this capture what you're trying to build?"

User: "Yes, that's it!"

Agent: "Great! I'll generate your project structure based on this."
```

**Success Criteria:**
- ✓ Agent didn't accept "build a web app" as sufficient
- ✓ Agent asked follow-up questions to clarify vague terms
- ✓ Agent identified missing context (scale, timeline)
- ✓ Agent summarized before proceeding
- ✓ Conversation felt natural, not like a checklist

---

### Scenario 2: Detailed Initial Response (Less Digging Needed)

**User Type:** Provides comprehensive first answer

```
User: "start GSD"

Agent: "I'll help you set up GSD for this project. What do you want to accomplish?"

User: "I'm building a CLI tool in Rust for compressing video files. It should support H.264 and H.265 codecs, run on Linux/macOS, and be faster than FFmpeg for batch processing. Target users are video editors who process hundreds of files daily. Open source project, no timeline pressure."

[VERY DETAILED - minimal follow-up needed]

Agent: "That's very clear! A few quick clarifications:

1. For 'faster than FFmpeg' - are you using different algorithms, or optimizing the workflow/parallel processing?
2. Any specific output formats besides the codecs you mentioned?"

User: "Parallel processing with GPU acceleration. Output formats: MP4 and MKV."

Agent: "Perfect. Distribution method - Cargo package, homebrew, or both?"

User: "Cargo primarily, homebrew would be nice-to-have later"

[SUFFICIENT CONTEXT]

Agent: "Got it. Let me confirm:

**Project Goal:**
Build a fast, open-source CLI tool in Rust for batch video compression using GPU acceleration, targeting video editors who process large volumes.

**Target Users:**
Video editors processing hundreds of files daily

**Core Features (MVP):**
- H.264 and H.265 codec support
- MP4 and MKV output formats
- GPU-accelerated parallel processing
- Linux and macOS support
- CLI interface
- Faster than FFmpeg for batch operations

**Technical Context:**
- Language: Rust
- Platform: Linux, macOS
- Distribution: Cargo (primary), Homebrew (later)
- Architecture: GPU acceleration, parallel processing

**Timeline & Constraints:**
- Open source project
- No hard deadline

Does this capture it?"

User: "Exactly!"

Agent: "Excellent! I'll generate your project structure."
```

**Success Criteria:**
- ✓ Agent recognized detailed first response
- ✓ Only asked clarifying questions on unclear points
- ✓ Didn't ask redundant questions about already-clear context
- ✓ Short conversation (user was clear upfront)

---

### Scenario 3: Existing Codebase (Context-Aware Questions)

**User Type:** Initializing GSD in existing project

```
User: "initialize GSD"

Agent: "I'll help you set up GSD. Let me check if there's existing code here..."

[Detects: Next.js 14 app with TypeScript, Prisma ORM, PostgreSQL, Tailwind CSS, deployed on Vercel]

Agent: "I see you have an existing Next.js app with Prisma and PostgreSQL. What do you want to accomplish with GSD in this project?"

User: "Add user authentication"

[CLARIFY - what kind of auth?]

Agent: "Got it. What kind of authentication are you thinking - email/password, social logins (Google, GitHub), magic links, or a combination?"

User: "Email/password and Google OAuth"

Agent: "Makes sense. Looking at your stack, you're using Prisma. Do you want to use an auth library like NextAuth.js, or build custom auth?"

User: "NextAuth.js is fine"

[EXISTING PATTERNS - check if current architecture supports this]

Agent: "Good call. I see you're using TypeScript throughout. Any preference on where to store sessions - database or JWT?"

User: "Database sessions"

Agent: "Perfect, that integrates well with Prisma. One more thing - do you need role-based access control right away, or just basic authenticated/unauthenticated?"

User: "Just basic auth for now, roles can come later"

Agent: "Great. Timeline?"

User: "Need it working this week"

[ENOUGH - summarize with codebase context]

Agent: "Alright, let me summarize:

**Project Goal:**
Add user authentication to existing Next.js/Prisma app using NextAuth.js

**Existing Codebase:**
- Framework: Next.js 14 with App Router
- Language: TypeScript
- Database: PostgreSQL via Prisma ORM
- Styling: Tailwind CSS
- Deployment: Vercel

**What We're Adding:**
- NextAuth.js integration
- Email/password authentication
- Google OAuth integration
- Database session storage (via Prisma adapter)
- Protected routes/middleware
- Basic auth UI (login, signup, password reset)

**Technical Constraints:**
- Must integrate with existing Prisma schema
- Use TypeScript throughout
- Follow existing code patterns
- Vercel deployment compatible

**Timeline:**
- 1 week to working implementation

**Deferred:**
- Role-based access control (future phase)

Does that match what you need?"

User: "Yes, perfect!"

Agent: "Great! I'll generate your GSD project structure with full context about your existing codebase."
```

**Success Criteria:**
- ✓ Agent detected existing codebase first
- ✓ Questions referenced existing tech stack
- ✓ Agent asked about integration patterns (NextAuth.js vs custom)
- ✓ Agent checked for architectural fit (sessions with Prisma)
- ✓ Summary included both existing context and new features

---

### Scenario 4: User Corrections During Summary

**User Type:** Realizes missing detail during confirmation

```
User: "start GSD"

Agent: "I'll help you set up GSD for this project. What do you want to accomplish?"

User: "API for mobile app that tracks fitness workouts"

Agent: "Got it. What kind of workouts - running/cycling tracking, gym exercises, or both?"

User: "Gym exercises - sets, reps, weights"

Agent: "Makes sense. Who's the target user?"

User: "People who go to the gym regularly"

Agent: "How many users are you expecting?"

User: "Start with maybe 100, could grow to 10k"

Agent: "Tech stack preferences?"

User: "Python for the API"

Agent: "Framework preference - FastAPI, Django REST, Flask?"

User: "FastAPI"

Agent: "Database?"

User: "PostgreSQL"

Agent: "Timeline?"

User: "3 weeks"

[SUMMARIZE]

Agent: "Let me confirm:

**Project Goal:**
Build a Python API for a mobile fitness app to track gym workouts (exercises, sets, reps, weights)

**Target Users:**
Regular gym-goers

**Core Features (MVP):**
- User workout tracking
- Exercise library
- Set/rep/weight recording
- Workout history

**Technical Context:**
- Stack: Python, FastAPI, PostgreSQL
- Target: RESTful API
- Deployment: TBD

**Timeline:**
- 3 weeks to MVP

**Scale:**
- Start: 100 users, grow to 10k

Does this capture it?"

User: "Actually, I also need social features - users should be able to share workouts and follow friends"

[USER CORRECTS - update understanding]

Agent: "Ah, good addition! So we need:

**Additional Features:**
- Social features (share workouts, follow users)
- Social feed/activity stream

That changes the scope a bit. Is that still in the 3-week MVP, or should social be phase 2?"

User: "Hmm, good point. Let's do basic tracking first, social in phase 2"

Agent: "Smart. Updated summary:

**Core Features (MVP - 3 weeks):**
- User workout tracking
- Exercise library
- Set/rep/weight recording
- Workout history

**Phase 2 (Deferred):**
- Social features (sharing, following)
- Activity feed

Rest stays the same. This work better?"

User: "Yes, much better"

Agent: "Perfect! I'll generate your project structure."
```

**Success Criteria:**
- ✓ Agent accepted user correction gracefully
- ✓ Agent helped user refine scope (MVP vs Phase 2)
- ✓ Agent re-summarized with corrections
- ✓ Agent confirmed again after changes

---

### Scenario 5: "I Don't Know Yet" Responses

**User Type:** Uncertain about some details

```
User: "initialize GSD"

Agent: "I'll help you set up GSD for this project. What do you want to accomplish?"

User: "Build a SaaS analytics dashboard for e-commerce stores"

Agent: "Got it. What kind of analytics - sales metrics, customer behavior, inventory, or all of the above?"

User: "All of it eventually, but starting with sales metrics"

Agent: "Makes sense. What e-commerce platforms do you need to integrate with?"

User: "Shopify for sure, maybe others later"

Agent: "Clear. Tech stack preferences?"

User: "Not sure yet, what do you recommend?"

[USER UNCERTAIN - offer recommendation, note as TBD]

Agent: "For a dashboard with real-time updates, I'd recommend Next.js for the frontend (great for dashboards) and Node.js backend with PostgreSQL. Does that work, or do you have other preferences?"

User: "That sounds good"

Agent: "Great. How many stores do you expect to support initially?"

User: "I don't know, maybe 50?"

Agent: "Okay, I'll plan for 50-100 stores initially. Deployment preference - cloud provider?"

User: "Um, I haven't thought about that yet"

[USER UNCERTAIN - use sensible default]

Agent: "No problem, I'll note that as TBD. We can decide during planning phase. Timeline on this?"

User: "Need an MVP in 6 weeks to show investors"

[ENOUGH CONTEXT - summarize with TBDs noted]

Agent: "Alright, here's what I understand:

**Project Goal:**
Build a SaaS analytics dashboard for Shopify stores, starting with sales metrics and expanding to customer behavior and inventory tracking.

**Target Users:**
E-commerce store owners using Shopify

**Core Features (MVP - 6 weeks):**
- Shopify integration
- Sales metrics dashboard
- Real-time data updates
- Store connection management

**Technical Context:**
- Stack: Next.js (frontend), Node.js (backend), PostgreSQL
- Integrations: Shopify API
- Deployment: TBD (will decide during planning)

**Timeline & Constraints:**
- Target: MVP in 6 weeks for investor demo
- Initial scale: 50-100 stores

**Deferred:**
- Additional e-commerce platforms (Shopify MVP first)
- Customer behavior analytics
- Inventory tracking

**To Be Decided:**
- Cloud provider / deployment strategy (will clarify during roadmap phase)
- Additional platform integrations

Does this capture it?"

User: "Yes, that works!"

Agent: "Perfect! I'll generate your project structure. The TBD items will be addressed when we create the roadmap."
```

**Success Criteria:**
- ✓ Agent handled "I don't know" gracefully
- ✓ Agent offered recommendations when appropriate
- ✓ Agent noted TBD items explicitly in summary
- ✓ Agent didn't force decisions on uncertain points
- ✓ Agent explained when TBD items will be decided

---

## Key Patterns Validated

| Pattern | Scenario | Result |
|---------|----------|--------|
| **Dig deeper on vague answers** | Scenario 1 | ✓ "web app" → "task management" → "team project management" |
| **Minimal questions for clear answers** | Scenario 2 | ✓ Detailed first response → only 2 follow-ups |
| **Context-aware questioning** | Scenario 3 | ✓ Existing codebase → questions reference existing stack |
| **Accept corrections gracefully** | Scenario 4 | ✓ User adds social features → agent helps refine scope |
| **Handle uncertainty** | Scenario 5 | ✓ "I don't know" → sensible defaults + TBD notes |

## Conversational Quality Checklist

For each test, verify:

- [ ] Conversation feels natural (not interrogative)
- [ ] Agent asks 1-2 questions at a time (not overwhelming)
- [ ] Agent builds on previous answers
- [ ] Agent identifies and clarifies vague terms
- [ ] Agent stops when sufficient context gathered
- [ ] Agent summarizes understanding before proceeding
- [ ] Agent waits for confirmation
- [ ] Agent handles corrections and additions
- [ ] PROJECT.md contains specific details (not generic boilerplate)
- [ ] REQUIREMENTS.md reflects actual discussed features

---

*Test scenarios based on conversational discovery protocol added 2026-01-26*
