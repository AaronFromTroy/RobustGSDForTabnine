# Architecture Patterns: AI Agent Workflow Frameworks

**Domain:** AI agent workflow systems / Guideline-driven agent frameworks
**Researched:** 2026-01-18
**Confidence:** MEDIUM (WebSearch verified with architectural patterns, Node.js frameworks, and production practices)

## Executive Summary

AI agent workflow frameworks in 2025 have matured into modular, stateful architectures following clear design patterns. The most successful production systems use:

1. **Graph-based state management** for tracking workflow progress
2. **Sequential orchestration** for predictable, dependency-heavy workflows
3. **File-based persistence** for long-term state and context
4. **Guideline-driven instruction files** for agent behavior specification
5. **Modular component loading** to reduce memory footprint and improve performance

For GSD within Tabnine, the optimal architecture follows the **Sequential Workflow + File-Based State + Guideline Files** pattern, which provides simplicity, debuggability, and clear phase progression without the complexity of parallel coordination.

## Recommended Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Tabnine Agent                           │
│                   (Context Manager)                         │
└────────────────┬──────────────────────┬─────────────────────┘
                 │                      │
                 ▼                      ▼
        ┌────────────────┐    ┌────────────────┐
        │ Trigger        │    │ State          │
        │ Detection      │    │ Manager        │
        │ System         │    │ (Node.js)      │
        └────────┬───────┘    └────┬───────────┘
                 │                  │
                 │                  ▼
                 │         ┌────────────────┐
                 │         │ STATE.md       │
                 │         │ (Current Phase)│
                 │         └────────────────┘
                 │
                 ▼
        ┌────────────────────────────────────┐
        │   Guideline Loader                 │
        │   (Modular File Selection)         │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────────────┐
        │        Guidelines Directory              │
        │  ┌────────────────────────────────────┐  │
        │  │ 01-project-kickoff.md              │  │
        │  │ 02-milestone-creation.md           │  │
        │  │ 03-phase-execution.md              │  │
        │  │ ...                                │  │
        │  └────────────────────────────────────┘  │
        └──────────────────┬───────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────────┐
        │      Sequential Workflow Engine          │
        │      (Phase-by-Phase Execution)          │
        └──────────────┬───────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────────┐
        │       Template System                    │
        │  ┌────────────────────────────────────┐  │
        │  │ PROJECT.md                         │  │
        │  │ ROADMAP.md                         │  │
        │  │ MILESTONE.md                       │  │
        │  │ PHASE.md                           │  │
        │  └────────────────────────────────────┘  │
        └──────────────┬───────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────────┐
        │     Output Artifacts                     │
        │     (.planning/*.md files)               │
        └──────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Input | Output | Communicates With |
|-----------|---------------|-------|--------|-------------------|
| **Trigger Detection System** | Recognizes workflow commands ("start GSD", "continue GSD") | User natural language | Workflow command + phase intent | State Manager, Guideline Loader |
| **State Manager** | Reads/writes STATE.md, tracks current phase, validates transitions | Current state, transition request | Updated state, validation result | All components (central coordinator) |
| **Guideline Loader** | Loads only the guideline file needed for current phase | Phase name/number | Guideline content (markdown) | Sequential Workflow Engine |
| **Sequential Workflow Engine** | Executes phase steps in order, coordinates between guideline instructions and scripts | Guideline instructions, state | Phase completion status | Template System, State Manager |
| **Template System** | Provides artifact templates, populates with project data | Template name, data context | Populated markdown artifact | Sequential Workflow Engine |
| **Script Orchestrator** | Executes Node.js scripts for state transitions, validation, resume logic | Script name, parameters | Execution result | State Manager |

### Data Flow

```
1. USER INPUT
   └─> Trigger Detection System
       └─> Recognizes: "start GSD", "continue GSD workflow", "what phase am I on?"

2. STATE QUERY
   └─> State Manager (Node.js)
       └─> Reads: .planning/STATE.md
       └─> Returns: {phase: "02-milestone-creation", step: 3, context: {...}}

3. GUIDELINE LOADING (Modular)
   └─> Guideline Loader
       └─> Reads: guidelines/{phase-name}.md
       └─> Injects into: Tabnine context window

4. SEQUENTIAL EXECUTION
   └─> Tabnine Agent
       └─> Follows: Guideline instructions (step-by-step)
       └─> Calls: Template System for artifact generation
       └─> Updates: STATE.md after each step

5. PHASE TRANSITION
   └─> Script Orchestrator
       └─> Validates: Phase completion criteria
       └─> Updates: STATE.md (next phase)
       └─> Triggers: Next guideline load

6. RESUME FLOW
   └─> State Manager
       └─> Reads: STATE.md
       └─> Loads: Correct guideline + step
       └─> Continues: From last checkpoint
```

### Interaction Flow: Tabnine Agent with GSD System

```
┌──────────────────┐
│ User in Tabnine  │
└────────┬─────────┘
         │
         │ "I want to start GSD for a new project"
         │
         ▼
┌────────────────────────────────────────┐
│ Tabnine Agent (Context Manager)        │
│ - Loads .gsd-config.json               │
│ - Detects trigger phrase               │
└────────┬───────────────────────────────┘
         │
         │ Calls: gsd-state --read
         │
         ▼
┌────────────────────────────────────────┐
│ Node.js State Manager                  │
│ Returns: { phase: null, step: null }   │
└────────┬───────────────────────────────┘
         │
         │ Load: guidelines/01-project-kickoff.md
         │
         ▼
┌────────────────────────────────────────┐
│ Tabnine Context (Agent)                │
│ - Guideline instructions now in context│
│ - Follows: Step 1, 2, 3...             │
│ - Generates: PROJECT.md from template  │
└────────┬───────────────────────────────┘
         │
         │ Calls: gsd-state --update phase="01-project-kickoff" step=4
         │
         ▼
┌────────────────────────────────────────┐
│ STATE.md (Updated)                     │
│ Current Phase: 01-project-kickoff      │
│ Current Step: 4                        │
│ Last Modified: 2026-01-18              │
└────────────────────────────────────────┘
```

## Patterns to Follow

### Pattern 1: Sequential Orchestration (Core Pattern)

**What:** Agents execute in predetermined order, each building on previous output.

**When:**
- Clear dependencies between phases (GSD phases are sequential by design)
- Predictable workflow progression
- Need for simplicity and debuggability
- Single-agent systems without parallel coordination

**Why for GSD:**
- Each GSD phase depends on artifacts from previous phases
- Sequential execution eliminates parallel coordination overhead
- Easier to debug and understand workflow state
- Matches mental model of project progression

**Implementation:**
```typescript
// Sequential workflow engine (simplified)
class SequentialWorkflow {
  async executePhase(phaseName: string) {
    const guideline = await this.guidelineLoader.load(phaseName);
    const state = await this.stateManager.getCurrentState();

    // Execute steps in order
    for (const step of guideline.steps) {
      await this.executeStep(step, state);
      await this.stateManager.updateStep(step.number);
    }

    // Transition to next phase
    await this.stateManager.transitionPhase(guideline.nextPhase);
  }
}
```

**Example GSD Flow:**
```
Phase 1: Project Kickoff
  └─> Creates: PROJECT.md
      └─> Phase 2: Roadmap Creation
          └─> Reads: PROJECT.md
          └─> Creates: ROADMAP.md
              └─> Phase 3: Milestone Creation
                  └─> Reads: PROJECT.md, ROADMAP.md
                  └─> Creates: MILESTONE.md
```

**Sources:**
- [Azure AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)
- [Google ADK Sequential Agents](https://google.github.io/adk-docs/agents/workflow-agents/sequential-agents/)

---

### Pattern 2: File-Based State Management

**What:** Use markdown/JSON files as persistent state store instead of databases.

**When:**
- Single-user or small team workflows
- Need for human-readable state
- State changes are infrequent (phase transitions, not real-time)
- Portability and version control important

**Why for GSD:**
- STATE.md is human-readable and Git-friendly
- No database dependency (simpler setup)
- State can be edited manually if needed
- Aligns with markdown-based artifact system

**Implementation:**
```typescript
// State manager (file-based)
interface WorkflowState {
  phase: string;
  step: number;
  context: Record<string, any>;
  timestamp: string;
}

class StateManager {
  private statePath = '.planning/STATE.md';

  async getCurrentState(): Promise<WorkflowState> {
    const content = await fs.readFile(this.statePath, 'utf-8');
    return this.parseState(content);
  }

  async updateState(updates: Partial<WorkflowState>): Promise<void> {
    const current = await this.getCurrentState();
    const updated = { ...current, ...updates, timestamp: new Date().toISOString() };
    await fs.writeFile(this.statePath, this.formatState(updated));
  }
}
```

**STATE.md Format:**
```markdown
# GSD Workflow State

**Current Phase:** 02-milestone-creation
**Current Step:** 3
**Last Updated:** 2026-01-18T10:30:00Z

## Context
- Project: GSD for Tabnine
- Milestone: Core State Management
- Previous Artifacts: PROJECT.md, ROADMAP.md

## History
- 2026-01-18T09:00:00Z: Started Phase 01-project-kickoff
- 2026-01-18T09:45:00Z: Completed Phase 01-project-kickoff
- 2026-01-18T10:00:00Z: Started Phase 02-milestone-creation
```

**Sources:**
- [AI Agent Memory Systems](https://www.projectpro.io/article/ai-agent-architectures/1135)
- [Long-term File Stores in Agent Architecture](https://www.lindy.ai/blog/ai-agent-architecture)

---

### Pattern 3: Modular Guideline Loading

**What:** Load only the guideline file needed for current phase, not all guidelines.

**When:**
- Large instruction sets that exceed context windows
- Performance concerns (reduce token usage)
- Clear phase boundaries
- Instructions are phase-specific

**Why for GSD:**
- Each phase has distinct instructions (kickoff vs execution vs retrospective)
- Loading all guidelines would waste context window
- Modular loading reduces cognitive load on agent
- Matches GSD's phase-oriented structure

**Implementation:**
```typescript
class GuidelineLoader {
  private guidelinesDir = 'guidelines/';

  async loadForPhase(phaseName: string): Promise<string> {
    const filename = `${phaseName}.md`;
    const path = join(this.guidelinesDir, filename);

    if (!await exists(path)) {
      throw new Error(`Guideline not found for phase: ${phaseName}`);
    }

    return await fs.readFile(path, 'utf-8');
  }

  async loadForCurrentState(): Promise<string> {
    const state = await this.stateManager.getCurrentState();
    return this.loadForPhase(state.phase);
  }
}
```

**Directory Structure:**
```
guidelines/
├── 01-project-kickoff.md         (Phase 1 only)
├── 02-roadmap-creation.md        (Phase 2 only)
├── 03-milestone-creation.md      (Phase 3 only)
├── 04-phase-execution.md         (Phase 4 only)
├── 05-phase-retrospective.md     (Phase 5 only)
└── README.md                     (Overview)
```

**Context Injection Pattern:**
```typescript
// Tabnine integration (conceptual)
async function injectGSDContext(userMessage: string): Promise<string> {
  // Detect trigger
  if (detectGSDTrigger(userMessage)) {
    // Load appropriate guideline
    const state = await stateManager.getCurrentState();
    const guideline = await guidelineLoader.loadForPhase(state.phase);

    // Inject into context
    return `${guideline}\n\n---\n\nUser: ${userMessage}`;
  }

  return userMessage;
}
```

**Sources:**
- [GitHub Copilot Instructions Pattern](https://github.blog/ai-and-ml/github-copilot/how-to-build-reliable-ai-workflows-with-agentic-primitives-and-context-engineering/)
- [JetBrains Junie Guidelines](https://blog.jetbrains.com/idea/2025/05/coding-guidelines-for-your-ai-agents/)

---

### Pattern 4: Template-Driven Artifact Generation

**What:** Use parameterized markdown templates to generate consistent artifacts.

**When:**
- Multiple artifacts with similar structure
- Need for consistency across projects
- Agent should fill in content, not reinvent format
- Artifacts are well-defined (PROJECT.md, ROADMAP.md, etc.)

**Why for GSD:**
- Ensures artifacts have consistent structure
- Reduces cognitive load (agent focuses on content, not format)
- Templates are versionable and improvable
- Supports tooling (parsers, validators)

**Implementation:**
```typescript
interface TemplateData {
  projectName: string;
  description: string;
  [key: string]: any;
}

class TemplateSystem {
  private templatesDir = 'templates/';

  async render(templateName: string, data: TemplateData): Promise<string> {
    const template = await this.loadTemplate(templateName);
    return this.interpolate(template, data);
  }

  private interpolate(template: string, data: TemplateData): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return data[key] ?? `{{${key}}}`;
    });
  }
}
```

**Template Example (PROJECT.md):**
```markdown
# {{projectName}}

## Description
{{description}}

## Goals
{{#goals}}
- {{.}}
{{/goals}}

## Constraints
{{#constraints}}
- {{.}}
{{/constraints}}

## Success Criteria
{{#successCriteria}}
- {{.}}
{{/successCriteria}}
```

**Usage in Guideline:**
```markdown
# Phase 1: Project Kickoff

## Step 3: Create PROJECT.md

Use the PROJECT.md template with:
- projectName: [from user input]
- description: [from conversation]
- goals: [extracted from requirements]
- constraints: [identified during discovery]

Generate .planning/PROJECT.md using the template.
```

**Sources:**
- [AWS Agentic AI Patterns](https://docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-patterns/introduction.html)
- [n8n Template-Driven Workflows](https://n8n.io/ai/)

---

### Pattern 5: Resume/Recovery System

**What:** Agent can resume workflow from last known state after interruption.

**When:**
- Long-running workflows (hours or days)
- User may exit and return
- Steps are checkpointed
- State persistence is reliable

**Why for GSD:**
- GSD workflows span multiple sessions
- User may start project, leave, return days later
- Each step is discrete and resumable
- Prevents starting from scratch

**Implementation:**
```typescript
class ResumeManager {
  async resume(): Promise<void> {
    const state = await this.stateManager.getCurrentState();

    if (!state.phase) {
      // No workflow in progress
      throw new Error('No GSD workflow in progress');
    }

    // Load guideline for current phase
    const guideline = await this.guidelineLoader.loadForPhase(state.phase);

    // Resume from current step
    const remainingSteps = guideline.steps.slice(state.step);

    // Continue workflow
    for (const step of remainingSteps) {
      await this.workflowEngine.executeStep(step, state);
      await this.stateManager.updateStep(step.number);
    }
  }
}
```

**Resume Trigger Detection:**
```typescript
function detectResumeIntent(userMessage: string): boolean {
  const resumePhrases = [
    'continue gsd',
    'resume workflow',
    'where was i',
    'what phase am i on',
    'continue project',
  ];

  return resumePhrases.some(phrase =>
    userMessage.toLowerCase().includes(phrase)
  );
}
```

**STATE.md Checkpoint Format:**
```markdown
# GSD Workflow State

**Current Phase:** 03-milestone-creation
**Current Step:** 2
**Phase Status:** IN_PROGRESS

## Checkpoint Details
- Last Action: Generated initial milestone breakdown
- Next Action: Review and refine phases
- Artifacts Created: MILESTONE.md (draft)

## Resume Instructions
To resume: "I'd like to continue the GSD workflow"
Agent will: Load milestone-creation guideline, continue from Step 2
```

**Sources:**
- [Temporal Long-Running Workflows](https://docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-patterns/introduction.html)
- [LangGraph Persistent State](https://docs.langchain.com/oss/python/langgraph/workflows-agents)

---

### Pattern 6: Trigger-Based Workflow Activation

**What:** Detect specific phrases to activate workflow context without explicit commands.

**When:**
- Natural language interface (Tabnine chat)
- Want seamless UX (no special syntax)
- Multiple workflows possible (need disambiguation)
- User intent is clear from context

**Why for GSD:**
- Tabnine users expect natural language interaction
- "start GSD" is intuitive vs "/gsd-start" command
- Can detect variants ("begin GSD", "kick off project", etc.)
- Aligns with conversational AI patterns

**Implementation:**
```typescript
interface TriggerPattern {
  phrases: string[];
  intent: string;
  confidence: number;
}

class TriggerDetector {
  private patterns: TriggerPattern[] = [
    {
      phrases: ['start gsd', 'begin gsd', 'new gsd project'],
      intent: 'START_GSD',
      confidence: 1.0
    },
    {
      phrases: ['continue gsd', 'resume gsd', 'where was i'],
      intent: 'RESUME_GSD',
      confidence: 1.0
    },
    {
      phrases: ['what phase', 'current phase', 'gsd status'],
      intent: 'STATUS_GSD',
      confidence: 0.9
    }
  ];

  detect(userMessage: string): { intent: string; confidence: number } | null {
    const normalized = userMessage.toLowerCase().trim();

    for (const pattern of this.patterns) {
      for (const phrase of pattern.phrases) {
        if (normalized.includes(phrase)) {
          return { intent: pattern.intent, confidence: pattern.confidence };
        }
      }
    }

    return null;
  }
}
```

**Context Injection Strategy:**
```typescript
async function handleUserMessage(message: string): Promise<string> {
  const trigger = triggerDetector.detect(message);

  if (!trigger) {
    // Regular Tabnine interaction
    return message;
  }

  // GSD workflow detected
  let context = '';

  switch (trigger.intent) {
    case 'START_GSD':
      context = await guidelineLoader.loadForPhase('01-project-kickoff');
      await stateManager.initializeWorkflow();
      break;

    case 'RESUME_GSD':
      const state = await stateManager.getCurrentState();
      context = await guidelineLoader.loadForPhase(state.phase);
      break;

    case 'STATUS_GSD':
      context = await stateManager.getStatusSummary();
      break;
  }

  return `${context}\n\n---\n\nUser: ${message}`;
}
```

**Phrase Variations (Production Quality):**
```typescript
const GSD_TRIGGERS = {
  START: [
    'start gsd',
    'begin gsd',
    'new gsd project',
    'kick off gsd',
    'initiate gsd',
    'create gsd project',
    'gsd new project'
  ],
  RESUME: [
    'continue gsd',
    'resume gsd',
    'pick up where i left off',
    'where was i in gsd',
    'continue the workflow',
    'keep going with gsd'
  ],
  STATUS: [
    'what phase am i on',
    'gsd status',
    'where am i in the workflow',
    'current gsd phase',
    'project status'
  ]
};
```

**Security Consideration (Prompt Injection Defense):**
```typescript
// Avoid prompt injection via trigger detection
function sanitizeTriggerInput(userMessage: string): string {
  // Only check first 100 chars for trigger phrases
  const prefix = userMessage.slice(0, 100);

  // Detect trigger in prefix only
  const trigger = triggerDetector.detect(prefix);

  // If trigger found, ensure rest of message doesn't contain instructions
  if (trigger && containsSuspiciousPatterns(userMessage)) {
    throw new Error('Potential prompt injection detected');
  }

  return userMessage;
}
```

**Sources:**
- [Intent Detection in AI Agents](https://decagon.ai/glossary/what-is-intent-detection)
- [Prompt Injection Defense 2025](https://www.obsidiansecurity.com/blog/prompt-injection)
- [Trigger Word Detection Patterns](https://github.com/topics/trigger-word-detection)

## Anti-Patterns to Avoid

### Anti-Pattern 1: Parallel Execution for Sequential Dependencies

**What:** Attempting to run dependent phases in parallel to "speed up" workflow.

**Why bad:**
- GSD phases have strict dependencies (can't create roadmap without project definition)
- Parallel coordination adds complexity without benefit
- Race conditions when multiple agents write to same files
- Harder to debug and understand workflow state

**Consequences:**
- Inconsistent artifacts (overwriting each other)
- State management becomes complex (locks, conflict resolution)
- User confusion about workflow progress
- Increased error handling burden

**Instead:**
- Embrace sequential execution for GSD (matches natural project flow)
- Optimize individual phase performance, not parallelization
- Use parallel execution only within a phase if truly independent (e.g., multiple research tasks)

**Example of What NOT to Do:**
```typescript
// BAD: Parallel phase execution
async function runGSDWorkflow() {
  await Promise.all([
    createProject(),      // Creates PROJECT.md
    createRoadmap(),      // Needs PROJECT.md - RACE CONDITION!
    createMilestone()     // Needs PROJECT.md + ROADMAP.md - RACE CONDITION!
  ]);
}

// GOOD: Sequential phase execution
async function runGSDWorkflow() {
  await createProject();     // Creates PROJECT.md
  await createRoadmap();     // Reads PROJECT.md, creates ROADMAP.md
  await createMilestone();   // Reads both, creates MILESTONE.md
}
```

---

### Anti-Pattern 2: Loading All Guidelines into Context

**What:** Loading entire guidelines directory into Tabnine context at once.

**Why bad:**
- Wastes context window (most content irrelevant to current phase)
- Increases latency (more tokens to process)
- Higher costs (token usage)
- Agent may get confused by instructions for different phases

**Consequences:**
- Agent follows wrong phase instructions
- Context window exhaustion on large projects
- Slower response times
- Increased API costs

**Instead:**
- Load only the guideline for current phase
- Use guideline index/overview for navigation
- Implement lazy loading (load on demand)

**Example of What NOT to Do:**
```typescript
// BAD: Load everything
async function initializeGSD() {
  const allGuidelines = await fs.readdir('guidelines/');
  const context = [];

  for (const file of allGuidelines) {
    context.push(await fs.readFile(`guidelines/${file}`, 'utf-8'));
  }

  return context.join('\n\n'); // Massive context blob
}

// GOOD: Load only what's needed
async function initializeGSD(phase: string) {
  return await fs.readFile(`guidelines/${phase}.md`, 'utf-8');
}
```

---

### Anti-Pattern 3: Database for State Management

**What:** Using PostgreSQL/MongoDB to store workflow state instead of files.

**Why bad (for GSD):**
- Adds infrastructure dependency
- State not human-readable
- Harder to debug (need database tools)
- Doesn't align with markdown-based artifact system
- Overkill for single-user workflow

**Consequences:**
- Complex setup (database installation, connection management)
- State not in Git (loses version history)
- Can't manually edit state if needed
- Requires database migrations for schema changes

**Instead:**
- Use STATE.md for workflow state (human-readable, Git-friendly)
- Use JSON files for structured config (.gsd-config.json)
- Reserve databases for multi-user collaboration (future enhancement)

**When Database WOULD Make Sense:**
- Multiple users working on same project simultaneously
- Real-time collaboration features
- High-frequency state updates (>100/sec)
- Complex querying requirements

---

### Anti-Pattern 4: Stateless Workflow (No Resume)

**What:** Agent has no memory of previous session, user must repeat context.

**Why bad:**
- Terrible UX (user repeats themselves)
- Can't pause and resume long workflows
- Agent can't learn from previous interactions
- No continuity across sessions

**Consequences:**
- User frustration ("I told you this yesterday!")
- Incomplete workflows (user gives up)
- Redundant work (re-creating artifacts)
- No sense of progress

**Instead:**
- Implement STATE.md with resume capabilities
- Checkpoint after each completed step
- Provide status summary on resume ("You were on Step 3 of Milestone Creation")
- Reference previous artifacts in context

---

### Anti-Pattern 5: Hard-Coded Instructions in Scripts

**What:** Embedding workflow instructions directly in Node.js scripts instead of guideline files.

**Why bad:**
- Instructions not accessible to Tabnine agent
- Hard to modify (requires code changes)
- Can't version instructions separately
- Tight coupling between logic and instructions

**Consequences:**
- Agent can't follow workflow (instructions hidden in code)
- Updating workflow requires code deployment
- Can't A/B test different instruction sets
- Instructions and code version drift

**Instead:**
- Store instructions in markdown guideline files
- Scripts handle state management and orchestration logic only
- Agent reads guidelines, scripts read state
- Clear separation of concerns

**Example:**
```typescript
// BAD: Instructions in code
async function createProject() {
  console.log("First, ask user about project goals...");
  console.log("Then, identify constraints...");
  // Agent can't see these instructions!
}

// GOOD: Instructions in guideline, script handles state
async function createProject() {
  // Load guideline (agent reads this)
  const guideline = await loadGuideline('01-project-kickoff.md');

  // Update state (script handles this)
  await stateManager.update({ phase: '01-project-kickoff', step: 1 });
}
```

---

### Anti-Pattern 6: No Validation or Error Handling

**What:** Assuming happy path, no validation of state transitions or artifact quality.

**Why bad:**
- Agent proceeds with incomplete/invalid data
- Artifacts don't meet quality standards
- State corruption when unexpected errors occur
- Hard to recover from failures

**Consequences:**
- Invalid artifacts generated
- Workflow stuck in bad state
- User can't complete workflow
- Manual intervention required

**Instead:**
- Validate state transitions (can't skip to Phase 3 from Phase 1)
- Validate artifact completeness (required sections present)
- Implement error recovery (return to last valid checkpoint)
- Provide clear error messages

**Validation Example:**
```typescript
class WorkflowValidator {
  async validateTransition(from: string, to: string): Promise<boolean> {
    const validTransitions = {
      '01-project-kickoff': ['02-roadmap-creation'],
      '02-roadmap-creation': ['03-milestone-creation'],
      // ...
    };

    return validTransitions[from]?.includes(to) ?? false;
  }

  async validateArtifact(artifactPath: string): Promise<ValidationResult> {
    const content = await fs.readFile(artifactPath, 'utf-8');

    // Check required sections exist
    const requiredSections = ['# ', '## Goals', '## Constraints'];
    const missing = requiredSections.filter(s => !content.includes(s));

    return {
      valid: missing.length === 0,
      errors: missing.map(s => `Missing section: ${s}`)
    };
  }
}
```

## Scalability Considerations

| Concern | At 1 User | At 10 Users (Team) | At 100+ Users (Enterprise) |
|---------|-----------|-------------------|---------------------------|
| **State Storage** | File-based (STATE.md) per project | File-based with workspace isolation | Centralized database (PostgreSQL) |
| **Guideline Loading** | Local file reads | Local file reads | CDN/cache layer for guidelines |
| **Concurrency** | Sequential only | Sequential per user | Parallel agents with queue system |
| **Context Management** | Single phase in context | Single phase in context | Multi-agent with shared memory |
| **Artifact Storage** | Local .planning/ directory | Git-based with branch per user | Artifact store (S3) with versioning |
| **Resume System** | File-based checkpoints | File-based checkpoints | Distributed state with Redis |
| **Authentication** | Not needed (local) | Not needed (local) | Required (OAuth/SAML) |
| **Rate Limiting** | Not needed | Not needed | Per-user API quotas |

### Growth Path (0 → 100 Users)

**Phase 1: Single User (MVP)**
- File-based state (STATE.md)
- Local guideline loading
- Sequential workflow only
- No authentication
- Simple trigger detection

**Phase 2: Small Team (10 users)**
- Git-based collaboration (branches)
- Workspace isolation (separate .planning/ dirs)
- Shared guidelines (centralized)
- Basic conflict detection

**Phase 3: Enterprise (100+ users)**
- Database state management
- Distributed caching (Redis)
- Parallel agent execution
- Advanced authentication
- Analytics and observability

## File Organization Patterns

### Recommended Structure for GSD

```
project-root/
├── .planning/                    # GSD artifacts
│   ├── STATE.md                  # Current workflow state
│   ├── PROJECT.md                # Project definition
│   ├── ROADMAP.md                # Project roadmap
│   ├── milestones/
│   │   ├── M01-MILESTONE.md
│   │   └── M02-MILESTONE.md
│   └── phases/
│       ├── M01-P01-PHASE.md
│       └── M01-P02-PHASE.md
│
├── gsd/                          # GSD library (installed)
│   ├── guidelines/               # Workflow instructions
│   │   ├── 01-project-kickoff.md
│   │   ├── 02-roadmap-creation.md
│   │   ├── 03-milestone-creation.md
│   │   ├── 04-phase-execution.md
│   │   ├── 05-phase-retrospective.md
│   │   └── README.md
│   │
│   ├── templates/                # Artifact templates
│   │   ├── PROJECT.md
│   │   ├── ROADMAP.md
│   │   ├── MILESTONE.md
│   │   └── PHASE.md
│   │
│   ├── scripts/                  # Node.js utilities
│   │   ├── state-manager.js      # Read/write STATE.md
│   │   ├── guideline-loader.js   # Load guideline for phase
│   │   ├── template-renderer.js  # Populate templates
│   │   ├── validator.js          # Validate artifacts/transitions
│   │   └── cli.js                # CLI interface (optional)
│   │
│   └── .gsd-config.json          # Configuration
│
└── src/                          # User's project code
    └── ...
```

### Configuration File (.gsd-config.json)

```json
{
  "version": "1.0.0",
  "guidelinesDir": "./gsd/guidelines",
  "templatesDir": "./gsd/templates",
  "planningDir": "./.planning",
  "stateFile": "./.planning/STATE.md",
  "triggers": {
    "start": ["start gsd", "begin gsd", "new gsd project"],
    "resume": ["continue gsd", "resume gsd", "where was i"],
    "status": ["what phase", "gsd status"]
  },
  "validation": {
    "requireAllSections": true,
    "allowSkipPhases": false
  }
}
```

### Guideline File Structure (Example)

```markdown
# Phase: Project Kickoff

**Phase ID:** 01-project-kickoff
**Next Phase:** 02-roadmap-creation
**Estimated Duration:** 30-60 minutes

## Objective
Create PROJECT.md with clear goals, constraints, and success criteria.

## Prerequisites
- [ ] User has project idea or requirements
- [ ] Tabnine agent has access to .planning/ directory

## Steps

### Step 1: Understand Project Intent
Ask user:
- What problem does this project solve?
- Who are the users?
- What's the scope (MVP vs full vision)?

### Step 2: Identify Goals
From conversation, extract 3-5 SMART goals.

**Template:** goals/GOAL.md

### Step 3: Identify Constraints
Ask about:
- Technical constraints (platform, languages)
- Time constraints (deadlines)
- Resource constraints (budget, team size)
- Dependencies (external systems)

### Step 4: Define Success Criteria
What does "done" look like?
- Measurable outcomes
- Acceptance criteria
- Quality standards

### Step 5: Generate PROJECT.md
Use template: templates/PROJECT.md
Populate with:
- projectName: [from Step 1]
- description: [from Step 1]
- goals: [from Step 2]
- constraints: [from Step 3]
- successCriteria: [from Step 4]

Write to: .planning/PROJECT.md

### Step 6: Update State
Call: gsd-state --update phase="01-project-kickoff" step=6 status="COMPLETED"

## Validation
- [ ] PROJECT.md exists
- [ ] All required sections populated
- [ ] At least 3 goals defined
- [ ] At least 2 constraints identified

## Next Phase
02-roadmap-creation.md
```

## Build Order Implications

### Suggested Build Order (Dependencies)

```
1. Core Infrastructure (Week 1)
   ├── State Manager (state-manager.js)
   │   └── Read/write STATE.md
   │   └── Validate state transitions
   │
   ├── Guideline Loader (guideline-loader.js)
   │   └── Load guideline by phase name
   │   └── Parse guideline structure
   │
   └── Template System (template-renderer.js)
       └── Load templates
       └── Interpolate with data

2. Workflow Orchestration (Week 2)
   ├── Trigger Detection (trigger-detector.js)
   │   └── Detect GSD phrases
   │   └── Map to workflow intents
   │
   ├── Sequential Workflow Engine
   │   └── Execute phase steps
   │   └── Coordinate state updates
   │
   └── Resume Manager (resume-manager.js)
       └── Resume from last checkpoint
       └── Status summary

3. Guidelines & Templates (Week 3)
   ├── Guideline Files (guidelines/*.md)
   │   └── 01-project-kickoff.md
   │   └── 02-roadmap-creation.md
   │   └── 03-milestone-creation.md
   │   └── ...
   │
   └── Template Files (templates/*.md)
       └── PROJECT.md
       └── ROADMAP.md
       └── MILESTONE.md
       └── PHASE.md

4. Validation & Error Handling (Week 4)
   ├── Artifact Validator (validator.js)
   │   └── Check required sections
   │   └── Validate artifact completeness
   │
   └── Error Recovery
       └── Rollback to checkpoint
       └── Clear error messages

5. Tabnine Integration (Week 5)
   ├── Context Injection
   │   └── Inject guideline into Tabnine context
   │   └── Detect triggers in user messages
   │
   └── Agent Response Handling
       └── Parse agent output
       └── Extract artifacts
       └── Update state
```

### Component Dependencies Graph

```
┌──────────────────┐
│   .gsd-config    │
│      .json       │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│            State Manager                     │
│  (Foundational - No dependencies)            │
└───────────┬──────────────────────────────────┘
            │
            ├────────────────┐
            │                │
            ▼                ▼
┌────────────────┐  ┌────────────────┐
│    Guideline   │  │    Template    │
│     Loader     │  │     System     │
│ (Needs State)  │  │ (Needs State)  │
└────────┬───────┘  └────┬───────────┘
         │                │
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │   Sequential   │
         │    Workflow    │
         │     Engine     │
         │ (Needs: State, │
         │ Guideline,     │
         │ Template)      │
         └────────┬───────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
┌────────────────┐  ┌──────────────┐
│    Trigger     │  │    Resume    │
│   Detection    │  │    Manager   │
│ (Needs: State, │  │ (Needs: All) │
│ Workflow)      │  │              │
└────────────────┘  └──────────────┘
```

### Critical Path

**Must build first:**
1. State Manager (everything depends on this)
2. Guideline Loader (workflow needs guidelines)
3. Template System (artifact generation needs templates)

**Can build in parallel after foundation:**
- Trigger Detection (independent of workflow engine)
- Validation (can be added incrementally)

**Build last:**
- Tabnine integration (needs working workflow first)
- Advanced features (resume, status, etc.)

## How Tabnine Agent Interacts with GSD System

### Interaction Model

```
┌─────────────────────────────────────────────────────┐
│                  Tabnine Agent                      │
│  - Receives user messages                           │
│  - Has access to project files                      │
│  - Can execute Node.js scripts                      │
│  - Can read/write files                             │
└────────────┬────────────────────────────────────────┘
             │
             │ User: "I want to start GSD"
             │
             ▼
┌─────────────────────────────────────────────────────┐
│          GSD Context Injection Layer                │
│  1. Detect trigger ("start gsd")                    │
│  2. Call: node scripts/state-manager.js --read      │
│  3. Determine: New workflow (no state)              │
│  4. Load: guidelines/01-project-kickoff.md          │
│  5. Inject guideline into context                   │
└────────────┬────────────────────────────────────────┘
             │
             │ Context now includes:
             │ - 01-project-kickoff.md (instructions)
             │ - STATE.md (current state)
             │ - User message
             │
             ▼
┌─────────────────────────────────────────────────────┐
│            Tabnine Agent (with GSD context)         │
│  Follows guideline steps:                           │
│  1. Ask user about project goals                    │
│  2. Identify constraints                            │
│  3. Generate PROJECT.md from template               │
│  4. Update STATE.md                                 │
└────────────┬────────────────────────────────────────┘
             │
             │ After completing step:
             │
             ▼
┌─────────────────────────────────────────────────────┐
│          State Update (via script)                  │
│  Call: node scripts/state-manager.js \              │
│        --update phase="01-project-kickoff" \        │
│                 step=3                              │
└────────────┬────────────────────────────────────────┘
             │
             │ Next user message:
             │ User: "Continue"
             │
             ▼
┌─────────────────────────────────────────────────────┐
│          Resume Detection                           │
│  1. Detect: "continue" (resume trigger)             │
│  2. Read STATE.md: phase=01, step=3                 │
│  3. Load: Same guideline, continue from step 4      │
│  4. Inject updated context                          │
└─────────────────────────────────────────────────────┘
```

### Context Injection Strategy (Detailed)

**Without GSD (normal Tabnine):**
```
Context Window:
┌────────────────────────────┐
│ - Project files            │
│ - Recent conversation      │
│ - User message             │
└────────────────────────────┘
```

**With GSD (when triggered):**
```
Context Window:
┌────────────────────────────┐
│ - Current guideline        │  <-- Injected
│   (e.g., 01-project-       │
│    kickoff.md)             │
│                            │
│ - STATE.md (parsed)        │  <-- Injected
│   Current Phase: 01        │
│   Current Step: 3          │
│                            │
│ - Relevant templates       │  <-- Injected (if needed)
│   (e.g., PROJECT.md)       │
│                            │
│ - Previous artifacts       │  <-- Injected (if exist)
│   (e.g., PROJECT.md)       │
│                            │
│ - User message             │
└────────────────────────────┘
```

### Script Invocation from Agent

**Agent can call Node.js scripts directly:**

```typescript
// Conceptual: How Tabnine agent would invoke scripts

// 1. Read current state
const state = await executeCommand('node gsd/scripts/state-manager.js --read');
// Returns: { phase: '01-project-kickoff', step: 2, ... }

// 2. Load guideline for current phase
const guideline = await executeCommand(
  `node gsd/scripts/guideline-loader.js --phase ${state.phase}`
);
// Returns: Content of 01-project-kickoff.md

// 3. Render template
const artifact = await executeCommand(
  `node gsd/scripts/template-renderer.js --template PROJECT.md --data '${JSON.stringify(data)}'`
);
// Returns: Populated PROJECT.md content

// 4. Update state after step completion
await executeCommand(
  `node gsd/scripts/state-manager.js --update phase="${state.phase}" step=${state.step + 1}`
);
```

### Guideline Integration Example

**Guideline instruction:**
```markdown
### Step 3: Generate PROJECT.md

Use template: templates/PROJECT.md
Populate with:
- projectName: [from user conversation]
- goals: [extracted from requirements]

Write to: .planning/PROJECT.md
```

**How agent interprets this:**
```typescript
// Agent's internal process (conceptual):

1. Parse instruction: "Use template: templates/PROJECT.md"
   → Call: template-renderer.js with template name

2. Parse data requirements: "projectName: [from user conversation]"
   → Extract from conversation history

3. Parse output location: "Write to: .planning/PROJECT.md"
   → Write rendered content to specified path

4. Update state: "Step 3 completed"
   → Call: state-manager.js --update step=3 status=COMPLETED
```

### Benefits of This Architecture for Tabnine

1. **No Special Integration Needed**
   - Agent just reads guideline files (markdown)
   - Agent just calls Node.js scripts (standard)
   - No custom Tabnine extensions required

2. **Testable Independently**
   - Scripts can be tested without Tabnine
   - Guidelines can be validated separately
   - State management works standalone

3. **Human-Readable**
   - Guidelines are plain markdown (developers can read/edit)
   - State is plain markdown (inspect without tools)
   - Templates are plain markdown (customize easily)

4. **Portable**
   - Works with any AI agent that can read files and execute scripts
   - Not locked to Tabnine
   - Could work with Cursor, Copilot, etc.

5. **Debuggable**
   - Can manually run scripts to inspect state
   - Can manually edit STATE.md if needed
   - Can add debug logging to scripts

## Technology Stack Recommendations

### Core Technologies

| Component | Technology | Rationale | Alternatives Considered |
|-----------|-----------|-----------|-------------------------|
| **Scripts** | Node.js (TypeScript) | - Native to modern dev workflows<br>- Excellent file system APIs<br>- Rich ecosystem (fs, path, etc.)<br>- TypeScript for type safety | - Python (more dependencies)<br>- Shell scripts (less portable) |
| **State Storage** | Markdown (STATE.md) | - Human-readable<br>- Git-friendly<br>- No database dependency<br>- Easy to parse/edit | - JSON (less readable)<br>- YAML (parsing overhead)<br>- SQLite (overkill) |
| **Templates** | Markdown with Handlebars | - Familiar syntax<br>- Powerful logic (if/each)<br>- Standard in industry | - Mustache (less features)<br>- EJS (too code-like)<br>- Jinja (Python-specific) |
| **Guideline Format** | Markdown | - Natural for instructions<br>- Renders nicely in GitHub<br>- AI-friendly (LLMs excel at markdown) | - HTML (too verbose)<br>- Custom format (reinventing wheel) |

### Node.js Libraries

```json
{
  "dependencies": {
    "handlebars": "^4.7.8",          // Template rendering
    "gray-matter": "^4.0.3",          // Parse frontmatter in markdown
    "commander": "^12.0.0",           // CLI interface for scripts
    "chalk": "^5.3.0"                 // Colored terminal output
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/handlebars": "^4.1.0",
    "typescript": "^5.6.0",
    "tsx": "^4.7.0",                  // Run TypeScript directly
    "vitest": "^2.0.0"                // Testing framework
  }
}
```

### Example Script Implementation (state-manager.js)

```typescript
#!/usr/bin/env node
import { readFile, writeFile } from 'fs/promises';
import { program } from 'commander';
import chalk from 'chalk';
import matter from 'gray-matter';

interface WorkflowState {
  phase: string | null;
  step: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  timestamp: string;
  context: Record<string, any>;
}

class StateManager {
  constructor(private statePath: string = '.planning/STATE.md') {}

  async read(): Promise<WorkflowState> {
    try {
      const content = await readFile(this.statePath, 'utf-8');
      const { data, content: body } = matter(content);

      return {
        phase: data.phase || null,
        step: data.step || 0,
        status: data.status || 'IN_PROGRESS',
        timestamp: data.timestamp || new Date().toISOString(),
        context: data.context || {}
      };
    } catch (error) {
      // State file doesn't exist - return initial state
      return {
        phase: null,
        step: 0,
        status: 'IN_PROGRESS',
        timestamp: new Date().toISOString(),
        context: {}
      };
    }
  }

  async update(updates: Partial<WorkflowState>): Promise<void> {
    const current = await this.read();
    const updated = {
      ...current,
      ...updates,
      timestamp: new Date().toISOString()
    };

    const content = this.formatState(updated);
    await writeFile(this.statePath, content, 'utf-8');

    console.log(chalk.green('✓ State updated'));
    console.log(chalk.gray(`  Phase: ${updated.phase}`));
    console.log(chalk.gray(`  Step: ${updated.step}`));
  }

  private formatState(state: WorkflowState): string {
    return `---
phase: ${state.phase}
step: ${state.step}
status: ${state.status}
timestamp: ${state.timestamp}
---

# GSD Workflow State

**Current Phase:** ${state.phase || 'Not started'}
**Current Step:** ${state.step}
**Status:** ${state.status}
**Last Updated:** ${state.timestamp}

## Context

\`\`\`json
${JSON.stringify(state.context, null, 2)}
\`\`\`

## History

- ${state.timestamp}: ${state.status} - Phase ${state.phase}, Step ${state.step}
`;
  }
}

// CLI interface
program
  .name('gsd-state')
  .description('GSD workflow state manager');

program
  .command('read')
  .description('Read current state')
  .action(async () => {
    const manager = new StateManager();
    const state = await manager.read();
    console.log(JSON.stringify(state, null, 2));
  });

program
  .command('update')
  .description('Update state')
  .option('--phase <phase>', 'Phase name')
  .option('--step <step>', 'Step number', parseInt)
  .option('--status <status>', 'Status (IN_PROGRESS|COMPLETED|BLOCKED)')
  .action(async (options) => {
    const manager = new StateManager();
    await manager.update({
      ...(options.phase && { phase: options.phase }),
      ...(options.step && { step: options.step }),
      ...(options.status && { status: options.status })
    });
  });

program.parse();
```

## Sources and References

### AI Agent Workflow Architecture (General)
- [Azure AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns) - MEDIUM confidence (official Microsoft documentation, 2025)
- [AWS Agentic AI Patterns and Workflows](https://docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-patterns/introduction.html) - HIGH confidence (official AWS guidance, July 2025)
- [20 Agentic AI Workflow Patterns That Actually Work in 2025](https://skywork.ai/blog/agentic-ai-examples-workflow-patterns-2025/) - MEDIUM confidence (industry blog, comprehensive)

### LangGraph and State Management
- [LangGraph: Workflows and Agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) - HIGH confidence (official documentation)
- [LangGraph Multi-Agent Orchestration Guide 2025](https://latenode.com/blog/ai-frameworks-technical-infrastructure/langgraph-multi-agent-orchestration/langgraph-multi-agent-orchestration-complete-framework-guide-architecture-analysis-2025) - MEDIUM confidence (technical analysis)

### State Management Patterns
- [Why State Management is the #1 Challenge for Agentic AI](https://intellyx.com/2025/02/24/why-state-management-is-the-1-challenge-for-agentic-ai/) - MEDIUM confidence (industry analysis)
- [Memory and State Management in AI Agents](https://substack.com/home/post/p-154988568) - MEDIUM confidence (technical deep dive)
- [AI Agent Architecture: Core Principles & Tools in 2025](https://orq.ai/blog/ai-agent-architecture) - MEDIUM confidence (comprehensive overview)

### Guideline-Based and Template-Driven Systems
- [A Practical Guide for Designing, Developing, and Deploying Production-Grade Agentic AI Workflows](https://arxiv.org/abs/2512.08769) - HIGH confidence (academic paper, December 2025)
- [How to Build Reliable AI Workflows with Agentic Primitives - GitHub Blog](https://github.blog/ai-and-ml/github-copilot/how-to-build-reliable-ai-workflows-with-agentic-primitives-and-context-engineering/) - HIGH confidence (official GitHub Copilot guidance)
- [Coding Guidelines for Your AI Agents - JetBrains](https://blog.jetbrains.com/idea/2025/05/coding-guidelines-for-your-ai-agents/) - MEDIUM confidence (official JetBrains Junie documentation)

### Sequential Workflow Patterns
- [Sequential Agents - Google ADK](https://google.github.io/adk-docs/agents/workflow-agents/sequential-agents/) - HIGH confidence (official Google documentation)
- [AI Agentic Workflows: Tutorial & Best Practices](https://fme.safe.com/guides/ai-agent-architecture/ai-agentic-workflows/) - MEDIUM confidence (comprehensive tutorial)

### Node.js AI Agent Frameworks
- [KaibanJS - AI Agent Framework](https://www.kaibanjs.com/) - MEDIUM confidence (official framework documentation)
- [Mastra - TypeScript AI Framework](https://mastra.ai/) - MEDIUM confidence (official framework documentation)
- [PraisonAI Node.js Documentation](https://docs.praison.ai/docs/js/nodejs) - MEDIUM confidence (official documentation)
- [Top 10 AI Agent Frameworks for 2025](https://www.kubiya.ai/blog/top-10-ai-agent-frameworks-for-building-autonomous-workflows-in-2025) - LOW confidence (comparison article, unverified)

### Trigger Detection and Security
- [Intent Detection in AI Agents - Decagon](https://decagon.ai/glossary/what-is-intent-detection) - MEDIUM confidence (industry definition)
- [Prompt Injection Attacks: The Most Common AI Exploit in 2025](https://www.obsidiansecurity.com/blog/prompt-injection) - MEDIUM confidence (security analysis)
- [Trigger Word Detection on GitHub](https://github.com/topics/trigger-word-detection) - LOW confidence (community resources)

### Multi-Agent and Modular Systems
- [AI Agent Architectures: Modular, Multi-Agent, and Evolving](https://www.projectpro.io/article/ai-agent-architectures/1135) - MEDIUM confidence (comprehensive overview)
- [Agentic AI Frameworks: Architectures, Protocols, and Design Challenges](https://arxiv.org/pdf/2508.10146) - HIGH confidence (academic paper, 2025)

## Confidence Assessment

| Research Area | Confidence | Notes |
|--------------|-----------|-------|
| **Sequential Workflow Pattern** | HIGH | Well-documented across multiple official sources (Google ADK, Azure, AWS) |
| **File-Based State Management** | MEDIUM | Common in single-user systems, verified in multiple agent architectures |
| **Modular Guideline Loading** | HIGH | GitHub Copilot and JetBrains Junie use similar patterns (official docs) |
| **Template-Driven Artifacts** | HIGH | Standard pattern in AWS, n8n, and other platforms |
| **Resume/Recovery System** | MEDIUM | Documented in distributed systems (Temporal), adapted for GSD context |
| **Trigger Detection** | MEDIUM | Intent detection well-documented, specific implementation for GSD is novel |
| **Node.js Stack Recommendations** | MEDIUM | Multiple Node.js frameworks exist (KaibanJS, Mastra), specific choices based on GSD requirements |
| **Scalability Path** | LOW | Projected based on general patterns, not GSD-specific experience |

## Gaps and Limitations

### Research Gaps

1. **Tabnine-Specific Integration**
   - No official documentation on Tabnine's agent mode API
   - Assumed agent can read files and execute scripts (common capability)
   - May need to verify actual integration capabilities

2. **Performance Benchmarks**
   - No performance data for file-based state management at scale
   - Guideline loading latency unknown
   - Context window utilization not measured

3. **Error Recovery Patterns**
   - Limited documentation on agent workflow error recovery
   - Resume system design based on general patterns, not tested

4. **Security Considerations**
   - Prompt injection defenses documented, but GSD-specific threats unknown
   - Guideline file security not thoroughly researched

### Recommended Follow-Up Research

1. **Phase-Specific Research** (as roadmap progresses)
   - Phase 1: Tabnine agent capabilities and limitations
   - Phase 2: Template rendering performance at scale
   - Phase 3: State synchronization for multi-user scenarios

2. **Validation Studies**
   - Test guideline loading latency with different file sizes
   - Measure context window usage with various phase complexities
   - Benchmark state read/write performance

3. **Security Audit**
   - Threat modeling for guideline injection attacks
   - Access control for STATE.md modifications
   - Audit logging for workflow transitions

## Conclusion

The recommended architecture for GSD in Tabnine follows proven patterns from production AI agent systems:

1. **Sequential orchestration** for predictable, dependency-heavy workflows
2. **File-based state management** for simplicity and Git-friendliness
3. **Modular guideline loading** to optimize context usage
4. **Template-driven artifacts** for consistency
5. **Resume capabilities** for multi-session workflows

This architecture is:
- ✅ **Simple:** No databases, no complex coordination
- ✅ **Portable:** Works with any AI agent that can read files and execute scripts
- ✅ **Debuggable:** Human-readable state and guidelines
- ✅ **Scalable:** Clear growth path from 1 to 100+ users
- ✅ **Testable:** Components are independent and scriptable

The build order prioritizes foundational components (State Manager, Guideline Loader, Template System) before higher-level features (Trigger Detection, Resume Manager), ensuring a solid base for the GSD workflow system.
