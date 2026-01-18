# Phase 3: Workflow Orchestration - Research

**Researched:** 2026-01-18
**Domain:** Workflow orchestration, state machines, trigger detection, artifact validation
**Confidence:** MEDIUM

## Summary

Workflow orchestration in Node.js involves coordinating sequential task execution, managing state transitions, detecting triggers, and validating outputs. For this phase, the core challenge is building a lightweight orchestration layer that works within Tabnine's constraints (no sub-agents, file-based state, sequential execution).

The research reveals that **simple state machine patterns combined with validation-first architecture** are most appropriate for this use case, rather than heavyweight workflow engines designed for distributed systems. The existing Phase 2 infrastructure (state-manager.js with atomic writes, template validation, file operations) provides the foundation needed.

Key findings:
1. **Don't use heavyweight workflow engines** - Libraries like XState, Orbits, or @datarster/workflow-engine are designed for complex distributed workflows with parallel execution, hierarchical states, and event-driven architectures. This project needs simple sequential execution with file-based state.

2. **Build custom orchestration using existing patterns** - State machine pattern using TypeScript discriminated unions, validation-before-write, and checkpoint-based recovery aligns perfectly with the existing codebase architecture.

3. **Trigger detection doesn't need NLP** - Exact phrase matching with case-insensitive string comparison is sufficient and more predictable than lightweight NLP libraries. The 2026 trend toward on-device NLP (TinyML) is for voice triggers, not text matching.

4. **Artifact validation should use existing tools** - Ajv (already installed) for schema validation, plus custom markdown section checking using regex patterns matches the existing state-manager.js approach.

5. **Graceful degradation over automatic recovery** - Circuit breaker pattern and clear error messages with remediation steps prevent cascading failures better than automatic retry mechanisms in file-based systems.

**Primary recommendation:** Build custom orchestration modules (trigger-detector.js, workflow-orchestrator.js, resume-manager.js, validator.js) using patterns from state-manager.js rather than introducing new workflow engine dependencies.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ajv | 8.12.0 | JSON Schema validation | Already installed; fastest validator (50% faster than joi/zod); 50M+ weekly downloads; supports draft-2020-12 |
| write-file-atomic | 5.0.1 | Atomic STATE.md writes | Already installed; prevents corruption on interruption; used by state-manager.js |
| front-matter | 4.0.2 | YAML frontmatter parsing | Already installed; parses guideline metadata; simple API |
| markdownlint | 0.36+ | Markdown structure validation | Industry standard (20M+ downloads/month); validates CommonMark + GFM; enforces consistency |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| markdown-it | 14.1+ | Markdown parsing | If need AST for section detection (alternative to regex) |
| fastest-validator | 1.19+ | Custom validation rules | If schema validation needs custom logic beyond JSON Schema |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom orchestrator | XState 5.x | XState adds 100KB, requires TypeScript 5.0+, designed for UI state; overkill for sequential file-based workflow |
| Custom orchestrator | @datarster/workflow-engine | Adds JSON workflow definitions, rollback complexity; project already has guideline files |
| Regex section checking | markdown-it parser | AST parsing is more robust but slower; regex sufficient for known template structure |
| Exact string matching | lightweight NLP | NLP adds dependencies and unpredictability; exact matching prevents false positives |

**Installation:**
```bash
# Already installed from Phase 2:
# - ajv@8.12.0
# - write-file-atomic@5.0.1
# - front-matter@4.0.2

# Add for Phase 3:
npm install markdownlint@0.36.1
```

## Architecture Patterns

### Recommended Project Structure
```
gsd/scripts/
├── file-ops.js              # [Phase 2] Atomic file I/O
├── process-runner.js        # [Phase 2] Command execution
├── state-manager.js         # [Phase 2] STATE.md persistence
├── template-renderer.js     # [Phase 2] Template rendering
├── guideline-loader.js      # [Phase 2] Guideline loading
├── trigger-detector.js      # [Phase 3] Detect "start GSD" phrases
├── workflow-orchestrator.js # [Phase 3] Sequential workflow execution
├── resume-manager.js        # [Phase 3] Read STATE.md and continue
├── validator.js             # [Phase 3] Artifact and state validation
└── integration-test.js      # [Phase 2] Test suite
```

### Pattern 1: State Machine with Validation-Before-Write
**What:** Explicit state transitions with validation layer preventing invalid writes
**When to use:** All state mutations (phase transitions, status updates, checkpoint writes)
**Example:**
```javascript
// Source: Existing state-manager.js pattern (lines 71-98)
export function validateStateData(stateData) {
  const requiredFields = ['phase', 'plan', 'status', 'step'];
  const missingFields = requiredFields.filter(field => !(field in stateData));

  if (missingFields.length > 0) {
    throw new Error(`Missing required field: ${missingFields.join(', ')}`);
  }

  const validStatuses = Object.values(STATUS_VALUES);
  if (!validStatuses.includes(stateData.status)) {
    throw new Error(`Invalid status: ${stateData.status}. Must be one of: ${validStatuses.join(', ')}`);
  }
}

// Always validate before write
export async function writeState(projectRoot, stateData) {
  validateStateData(stateData); // Validation layer
  // ... perform write
}
```

### Pattern 2: Checkpoint-Based Recovery
**What:** Save workflow state incrementally; on corruption, reconstruct from last valid checkpoint
**When to use:** Before risky operations (phase transitions, artifact generation, validation failures)
**Example:**
```javascript
// Source: Distributed Systems checkpoint patterns (ACM, GeeksforGeeks)
// Adapted for file-based state:

export async function createCheckpoint(projectRoot, checkpointName) {
  const statePath = path.join(projectRoot, '.planning', 'STATE.md');
  const checkpointPath = path.join(
    projectRoot, '.planning', 'backups',
    `STATE-${checkpointName}-${Date.now()}.md`
  );

  await ensureDir(path.dirname(checkpointPath));
  const content = await readFile(statePath);
  await writeFileAtomic(checkpointPath, content);

  return checkpointPath;
}

export async function recoverFromCheckpoint(projectRoot, checkpointPath) {
  const statePath = path.join(projectRoot, '.planning', 'STATE.md');
  const content = await readFile(checkpointPath);
  await writeFileAtomic(statePath, content);
}
```

### Pattern 3: Trigger Detection with Exact Matching
**What:** Case-insensitive exact phrase matching without fuzzy logic or NLP
**When to use:** Detecting workflow triggers from user input
**Example:**
```javascript
// Source: .gsd-config.json + string matching patterns
export function detectTrigger(userInput, config) {
  const normalized = userInput.trim().toLowerCase();

  for (const phrase of config.triggerPhrases.start) {
    if (normalized === phrase.toLowerCase()) {
      return { type: 'START', phrase };
    }
  }

  for (const phrase of config.triggerPhrases.continue) {
    if (normalized === phrase.toLowerCase()) {
      return { type: 'CONTINUE', phrase };
    }
  }

  return null; // No trigger detected
}
```

### Pattern 4: Artifact Validation with Schema + Structure Checking
**What:** Two-layer validation - JSON Schema for metadata, custom checks for required sections
**When to use:** Validating generated artifacts before marking phase complete
**Example:**
```javascript
// Source: Ajv validation + markdownlint patterns
import Ajv from 'ajv';
import { readFile } from './file-ops.js';

const ajv = new Ajv();

export async function validateArtifact(filePath, artifactType) {
  const content = await readFile(filePath);

  // Layer 1: Schema validation (frontmatter)
  const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
  if (frontmatterMatch) {
    const metadata = yaml.parse(frontmatterMatch[1]);
    const schema = getSchemaForType(artifactType);
    const valid = ajv.validate(schema, metadata);
    if (!valid) {
      throw new Error(`Invalid metadata: ${ajv.errorsText()}`);
    }
  }

  // Layer 2: Required sections (structure)
  const requiredSections = getRequiredSections(artifactType);
  for (const section of requiredSections) {
    const regex = new RegExp(`^## ${section}$`, 'm');
    if (!regex.test(content)) {
      const lineNumber = estimateLineNumber(content, section);
      throw new Error(
        `Missing section: ${section} (expected around line ${lineNumber}). ` +
        `Add with: echo '## ${section}' >> ${filePath}`
      );
    }
  }

  return true;
}
```

### Pattern 5: Graceful Degradation with Circuit Breaker
**What:** Stop attempting failing operations after threshold; provide clear error with remediation
**When to use:** Operations that might fail repeatedly (file corruption, missing artifacts)
**Example:**
```javascript
// Source: Circuit breaker pattern (Graceful Degradation patterns 2026)
class CircuitBreaker {
  constructor(maxFailures = 3) {
    this.failures = 0;
    this.maxFailures = maxFailures;
    this.state = 'CLOSED'; // CLOSED = normal, OPEN = failing
  }

  async execute(operation, fallback) {
    if (this.state === 'OPEN') {
      return fallback();
    }

    try {
      const result = await operation();
      this.failures = 0; // Reset on success
      return result;
    } catch (error) {
      this.failures++;

      if (this.failures >= this.maxFailures) {
        this.state = 'OPEN';
        throw new Error(
          `Operation failed ${this.failures} times. ` +
          `Circuit breaker opened. ${error.message}`
        );
      }

      throw error;
    }
  }
}
```

### Anti-Patterns to Avoid
- **Over-engineering state machine**: Don't use hierarchical states or parallel regions - sequential execution is simpler and sufficient
- **Automatic retries without user feedback**: File operations should fail fast with clear messages, not retry silently
- **Persisting entire state machine**: Only persist data (phase, plan, status), not behavior or workflow logic
- **Fuzzy trigger matching**: Exact phrase matching prevents false positives in natural conversation
- **Validation after write**: Always validate before writing to prevent corruption

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON Schema validation | Custom object validator | ajv@8.12.0 | Already installed; handles edge cases (nested schemas, $ref, anyOf); 50M+ weekly downloads |
| Markdown linting | Custom regex for all markdown rules | markdownlint | Validates CommonMark spec; extensible rules; prevents inconsistencies |
| YAML parsing | Custom frontmatter parser | front-matter@4.0.2 | Already installed; handles edge cases (multiline, special chars); battle-tested |
| Atomic file writes | fs.writeFile + manual locking | write-file-atomic@5.0.1 | Already installed; prevents corruption on crash/interruption; cross-platform |
| State machine library | Full FSM framework (XState, finity) | Custom with STATUS_VALUES constants | Project needs simple sequential transitions, not hierarchical states or event-driven logic |
| Workflow engine | Full orchestration engine (@datarster/workflow-engine) | Custom orchestrator using state-manager.js | Project already has guideline files and sequential model; workflow engines add JSON DSL and rollback complexity |

**Key insight:** This project already has the right foundation (validation-before-write, atomic operations, schema validation). Phase 3 should extend these patterns, not replace them with heavyweight libraries designed for different use cases.

## Common Pitfalls

### Pitfall 1: State Corruption from Race Conditions
**What goes wrong:** Multiple concurrent writes to STATE.md cause corruption or lost updates
**Why it happens:** File operations aren't atomic by default; fs.writeFile can be interrupted
**How to avoid:**
- Always use write-file-atomic for STATE.md writes (already implemented in state-manager.js)
- Never write STATE.md directly - always go through state-manager.js API
- Validate state data before writing (validation-before-write pattern)
**Warning signs:** STATE.md contains partial writes, missing fields, or unparseable content

### Pitfall 2: Unclear State Transitions (State Explosion)
**What goes wrong:** State machine becomes unmaintainable with too many states or unclear transitions
**Why it happens:** Adding states without thinking about transition rules; allowing transitions from any state to any state
**How to avoid:**
- Define explicit STATUS_VALUES constants (already in state-manager.js: pending, in_progress, completed, blocked)
- Document valid transitions (e.g., pending → in_progress, in_progress → completed/blocked, never completed → pending)
- Use transitionPhase() function to enforce rules
**Warning signs:** STATE.md shows invalid status values; transitions that shouldn't happen (e.g., phase 1 → phase 4)

### Pitfall 3: Poor Error Recovery Experience
**What goes wrong:** System fails with cryptic errors; user doesn't know how to fix the problem
**Why it happens:** Errors thrown without context or remediation guidance
**How to avoid:**
- Always include file path, line number (when applicable), and remediation command in error messages
- Example: `Missing section: Core Value (expected at line 5). Add with: echo '## Core Value' >> PROJECT.md`
- Provide recovery options for corrupted state: "STATE.md corrupted. Options: 1) Restore from backup, 2) Reconstruct manually, 3) Restart workflow"
**Warning signs:** User repeatedly encounters same error without knowing how to fix it

### Pitfall 4: Trigger False Positives
**What goes wrong:** Workflow activates when user didn't intend to trigger it (e.g., "I want to start GSD soon" triggers workflow)
**Why it happens:** Fuzzy matching or substring matching instead of exact phrase matching
**How to avoid:**
- Use exact phrase matching with normalization (trim + lowercase)
- Require confirmation before activating workflow (CONTEXT.md decision: "Always confirm")
- Check for active workflow before allowing "start GSD" to prevent conflicts
**Warning signs:** Users report accidental workflow activation; workflows start mid-conversation

### Pitfall 5: Validation After Write (Too Late)
**What goes wrong:** Invalid state written to STATE.md; artifact generated with missing sections
**Why it happens:** Validation happens after write operation completes
**How to avoid:**
- Validation-before-write pattern: Call validateStateData() before writeState()
- Validation-before-commit pattern: Call validateArtifact() before marking phase complete
- Make validation functions synchronous when possible (fail fast)
**Warning signs:** STATE.md contains invalid status values; artifacts missing required sections

### Pitfall 6: Ignoring Checkpoint Backups
**What goes wrong:** STATE.md corruption with no recovery path; user forced to restart entire workflow
**Why it happens:** No backup created before risky operations (phase transitions, validation failures)
**How to avoid:**
- Create checkpoint before phase transitions: `createCheckpoint(projectRoot, 'before-phase-3')`
- Keep last 5 checkpoints (FIFO rotation to prevent disk bloat)
- Provide `--recover` flag to restore from checkpoint
**Warning signs:** No `.planning/backups/` directory; checkpoints not created before risky ops

### Pitfall 7: Over-reliance on Automatic Recovery
**What goes wrong:** System retries failing operation indefinitely; user not notified of problem
**Why it happens:** Automatic retry without circuit breaker or user feedback
**How to avoid:**
- Circuit breaker pattern: Stop after N failures (default: 3)
- Fail fast with clear error and remediation steps
- User approval for recovery actions (don't auto-restore from checkpoint)
**Warning signs:** Operations retry silently; long delays before error surfaces

## Code Examples

Verified patterns from official sources and existing codebase:

### Example 1: Trigger Detection with Confirmation
```javascript
// Source: CONTEXT.md decisions + .gsd-config.json structure
import { readFile } from './file-ops.js';
import path from 'node:path';

export async function detectAndConfirmTrigger(userInput, projectRoot) {
  // Load trigger phrases from config
  const configPath = path.join(projectRoot, 'gsd', '.gsd-config.json');
  const configContent = await readFile(configPath);
  const config = JSON.parse(configContent);

  // Normalize input
  const normalized = userInput.trim().toLowerCase();

  // Check for start triggers
  for (const phrase of config.triggerPhrases.start) {
    if (normalized === phrase.toLowerCase()) {
      return {
        type: 'START',
        phrase,
        needsConfirmation: true,
        message: `🔵 GSD Trigger Detected\n\nPhrase: "${phrase}"\nAction: Start new workflow\n\nContinue? (yes/no)`
      };
    }
  }

  // Check for continue triggers
  for (const phrase of config.triggerPhrases.continue) {
    if (normalized === phrase.toLowerCase()) {
      return {
        type: 'CONTINUE',
        phrase,
        needsConfirmation: true,
        message: `🔵 GSD Trigger Detected\n\nPhrase: "${phrase}"\nAction: Resume workflow from checkpoint\n\nContinue? (yes/no)`
      };
    }
  }

  return null; // No trigger detected
}
```

### Example 2: Artifact Validation (Two-Layer)
```javascript
// Source: Ajv validation patterns + markdownlint structure checking
import Ajv from 'ajv';
import { readFile } from './file-ops.js';
import frontmatter from 'front-matter';

const ajv = new Ajv();

// Artifact schemas
const ARTIFACT_SCHEMAS = {
  'PROJECT.md': {
    requiredSections: ['What This Is', 'Core Value', 'Requirements', 'Context', 'Constraints'],
    metadataSchema: {
      type: 'object',
      required: ['version', 'created', 'core_value'],
      properties: {
        version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
        created: { type: 'string', format: 'date' },
        core_value: { type: 'string', minLength: 10 }
      }
    }
  },
  'ROADMAP.md': {
    requiredSections: ['Overview', 'Phases', 'Progress', 'Dependencies'],
    metadataSchema: {
      type: 'object',
      required: ['version', 'created', 'depth'],
      properties: {
        depth: { enum: ['Quick', 'Deep'] }
      }
    }
  }
};

export async function validateArtifact(filePath, artifactType) {
  const content = await readFile(filePath);
  const schema = ARTIFACT_SCHEMAS[artifactType];

  if (!schema) {
    throw new Error(`Unknown artifact type: ${artifactType}`);
  }

  const errors = [];

  // Layer 1: Metadata validation (YAML frontmatter)
  try {
    const parsed = frontmatter(content);
    const valid = ajv.validate(schema.metadataSchema, parsed.attributes);

    if (!valid) {
      errors.push(`Metadata validation failed: ${ajv.errorsText()}`);
    }
  } catch (error) {
    errors.push(`Frontmatter parsing failed: ${error.message}`);
  }

  // Layer 2: Required sections
  for (const section of schema.requiredSections) {
    const regex = new RegExp(`^## ${escapeRegex(section)}$`, 'm');

    if (!regex.test(content)) {
      const lineNumber = estimateLineNumber(content, section);
      errors.push(
        `Missing section: ${section} (expected around line ${lineNumber}). ` +
        `Fix: echo '## ${section}' >> ${filePath}`
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed for ${artifactType}:\n${errors.join('\n')}`);
  }

  return true;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function estimateLineNumber(content, sectionName) {
  const lines = content.split('\n');
  const h2Index = lines.findIndex(line => line.startsWith('## '));
  return h2Index !== -1 ? h2Index + 1 : 5;
}
```

### Example 3: Resume Manager with Status Summary
```javascript
// Source: CONTEXT.md decisions (brief checkpoint) + state-manager.js patterns
import { readState } from './state-manager.js';
import { loadGuideline } from './guideline-loader.js';

export async function resumeWorkflow(projectRoot) {
  try {
    // Read current state
    const state = await readState(projectRoot);

    // Validate state structure
    if (state.phase < 1 || state.status === 'pending') {
      throw new Error('No active workflow found. Use "start GSD" to begin a new project.');
    }

    // Load guideline for current workflow stage
    const workflowType = determineWorkflowType(state);
    const guideline = await loadGuideline(workflowType);

    // Generate brief checkpoint message (CONTEXT.md: "Brief checkpoint")
    const summary = generateStatusSummary(state, guideline);

    return {
      state,
      guideline,
      summary,
      nextAction: determineNextAction(state)
    };
  } catch (error) {
    if (error.message.includes('STATE.md not found')) {
      throw new Error('No active workflow found. Use "start GSD" to begin a new project.');
    }

    if (error.message.includes('Failed to parse STATE.md')) {
      throw new Error(
        'STATE.md corrupted. Recovery options:\n' +
        '1. Restore from backup: node gsd/scripts/resume-manager.js --recover\n' +
        '2. View corruption: cat .planning/STATE.md\n' +
        '3. Restart workflow: node gsd/scripts/workflow-orchestrator.js --restart'
      );
    }

    throw error;
  }
}

function generateStatusSummary(state, guideline) {
  return `
📍 Current Position
Phase: ${state.phase} (${guideline.metadata.workflow})
Status: ${state.status}
Last activity: ${state.step}

⏭️  Next Action
${determineNextAction(state)}
`.trim();
}

function determineNextAction(state) {
  if (state.status === 'completed') {
    return `Phase ${state.phase} complete. Ready to transition to Phase ${state.phase + 1}.`;
  }

  if (state.status === 'blocked') {
    return `Workflow blocked: ${state.step}. Resolve blocker to continue.`;
  }

  return `Continue ${state.step}`;
}

function determineWorkflowType(state) {
  if (state.phase === 0 || state.plan === 0) {
    return 'newProject';
  }

  if (state.status === 'in_progress') {
    return 'executePhase';
  }

  return 'planPhase';
}
```

### Example 4: Requirement Traceability Validation
```javascript
// Source: Requirements traceability patterns (Parasoft, Perforce 2026)
import { readFile } from './file-ops.js';
import path from 'node:path';

export async function validateRequirementCoverage(projectRoot) {
  const requirementsPath = path.join(projectRoot, '.planning', 'REQUIREMENTS.md');
  const roadmapPath = path.join(projectRoot, '.planning', 'ROADMAP.md');

  const requirementsContent = await readFile(requirementsPath);
  const roadmapContent = await readFile(roadmapPath);

  // Extract requirement IDs from REQUIREMENTS.md
  const requirementIds = extractRequirementIds(requirementsContent);

  // Extract requirement IDs from ROADMAP.md traceability section
  const tracedIds = extractTracedRequirements(roadmapContent);

  // Find orphaned requirements (in REQUIREMENTS.md but not in ROADMAP.md)
  const orphanedRequirements = requirementIds.filter(id => !tracedIds.includes(id));

  if (orphanedRequirements.length > 0) {
    throw new Error(
      `Requirement coverage validation failed.\n\n` +
      `Orphaned requirements (not mapped to any phase):\n` +
      orphanedRequirements.map(id => `  - ${id}`).join('\n') + '\n\n' +
      `Fix: Add traceability entries in ROADMAP.md Traceability section.`
    );
  }

  // Verify all requirements have phase mapping
  const coverage = {
    total: requirementIds.length,
    traced: tracedIds.length,
    orphaned: orphanedRequirements.length,
    percentage: Math.round((tracedIds.length / requirementIds.length) * 100)
  };

  return coverage;
}

function extractRequirementIds(content) {
  // Match patterns like: - [ ] **CORE-01**: Description
  const regex = /\*\*([A-Z]+-\d+)\*\*:/g;
  const matches = [...content.matchAll(regex)];
  return matches.map(match => match[1]);
}

function extractTracedRequirements(content) {
  // Match traceability table: | CORE-01 | Phase 1 | Complete |
  const regex = /\|\s*([A-Z]+-\d+)\s*\|/g;
  const matches = [...content.matchAll(regex)];
  return matches.map(match => match[1]);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom FSM with integer states | TypeScript discriminated unions + constants | 2025-2026 | Type safety prevents invalid transitions; compiler catches errors |
| Retry logic everywhere | Circuit breaker pattern | 2025-2026 | Fail fast with clear errors; prevent retry storms |
| fs.writeFile for state | write-file-atomic | Always best practice | Prevents corruption on crash/interruption |
| String-based validation | JSON Schema (ajv) | Industry standard since 2020 | Declarative schemas; better error messages |
| Fuzzy trigger matching | Exact phrase matching with confirmation | 2026 trend | Prevents false positives; better UX with confirmation |
| Event-driven orchestration | Sequential execution with checkpoints | Project-specific | Simpler for file-based workflows; matches Tabnine constraints |

**Deprecated/outdated:**
- **Workflow engines with JSON DSLs** (Processus, old node-workflow): Modern trend (2025-2026) is code-first workflows (TypeScript/JavaScript), not JSON configurations. Project already has guideline markdown files.
- **Automatic rollback on failure**: 2026 research shows user approval for recovery actions provides better UX than automatic rollback.
- **Global workflow state**: Persist minimal state (phase, plan, status), not entire workflow execution graph. File-based state works better than database for single-user tools.

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal checkpoint retention policy**
   - What we know: Keep backups before risky operations (phase transitions, validations)
   - What's unclear: How many checkpoints to retain (5? 10? all?), when to auto-prune old checkpoints
   - Recommendation: Start with last 5 checkpoints (FIFO rotation); monitor disk usage; allow manual pruning

2. **Trigger detection in Tabnine context**
   - What we know: Tabnine agent mode receives user input as text; exact matching works
   - What's unclear: Does Tabnine pre-process input? Is there access to full conversation context?
   - Recommendation: Implement exact matching first; test with Tabnine; adjust if preprocessing interferes

3. **Validation enforcement level**
   - What we know: CONTEXT.md marks as "Claude's Discretion" - block vs warn on validation failures
   - What's unclear: Should failed validation prevent phase transition (block) or just warn user?
   - Recommendation: **Block on critical failures** (missing STATE.md, corrupted state, missing required sections in artifacts); **Warn on soft failures** (markdown linting, non-critical metadata)

4. **STATE.md corruption recovery method**
   - What we know: CONTEXT.md marks as "Claude's Discretion" - reconstruct vs manual vs backup
   - What's unclear: Best recovery strategy when STATE.md corrupted (multiple options exist)
   - Recommendation: **Tiered recovery**: 1) Restore from latest checkpoint (auto), 2) Reconstruct from artifacts (semi-auto with user confirmation), 3) Manual edit (user decides)

## Sources

### Primary (HIGH confidence)
- [state-manager.js implementation](C:\Projects\GSDForTabnine\gsd\scripts\state-manager.js) - Existing validation-before-write pattern, STATUS_VALUES constants, atomic writes
- [.gsd-config.json structure](C:\Projects\GSDForTabnine\gsd\.gsd-config.json) - Trigger phrases definition, workflow mappings
- [03-CONTEXT.md decisions](C:\Projects\GSDForTabnine\.planning\phases\03-workflow-orchestration\03-CONTEXT.md) - User decisions on triggers, validation, error recovery
- [Ajv JSON Schema Validator documentation](https://github.com/ajv-validator/ajv) - Fastest validator; draft-2020-12 support
- [write-file-atomic npm package](https://www.npmjs.com/package/write-file-atomic) - Atomic write guarantees

### Secondary (MEDIUM confidence)
- [Graceful Degradation in Distributed Systems - GeeksforGeeks](https://www.geeksforgeeks.org/system-design/graceful-degradation-in-distributed-systems/) - Circuit breaker pattern, error recovery UX
- [Graceful Degradation: Handling Errors Without Disrupting User Experience - Medium](https://medium.com/@satyendra.jaiswal/graceful-degradation-handling-errors-without-disrupting-user-experience-fd4947a24011) - User feedback during failures
- [Checkpointing and Rollback-Recovery for Distributed Systems (ACM)](https://dl.acm.org/doi/pdf/10.5555/324493.325074) - Checkpoint-based recovery patterns
- [Distributed System Fault Tolerance Using Message Logging and Checkpointing - GeeksforGeeks](https://www.geeksforgeeks.org/system-design/distributed-system-fault-tolerance-using-message-logging-and-checkpointing/) - Recovery strategies
- [Common pitfalls to avoid when working with state machines](https://statemachine.events/article/Common_pitfalls_to_avoid_when_working_with_state_machines.html) - State explosion, unclear transitions, testing
- [Implementing State Machines - Embedded Related](https://www.embeddedrelated.com/showarticle/543.php) - Type safety, enumerated types
- [How to Avoid The 5 Common Workflow Orchestration Pitfalls - Avatu](https://avatu.in/blogs/5-common-workflow-orchestration-mistakes-and-ways-to-avoid-them/) - Over-engineering, monitoring, automation without objectives
- [10 Microservice Anti-Patterns Every Engineer Must Avoid - Medium](https://medium.com/@leela.kumili/10-microservice-anti-patterns-every-engineer-must-avoid-639f068a8249) - Observability, choreography without sequencing
- [Best Requirements Traceability Software To Choose in 2026 - Inflectra](https://www.inflectra.com/tools/requirements-management/10-best-requirements-traceability-tools) - Automated traceability, completeness checks
- [Requirements Traceability: ISO 26262 Software Compliance - Parasoft](https://www.parasoft.com/learning-center/iso-26262/requirements-traceability/) - Bidirectional traceability, automated validation

### Tertiary (LOW confidence - not used for core recommendations)
- [XState documentation](https://github.com/statelyai/xstate) - Modern state machine library (marked as overkill for this use case)
- [@datarster/workflow-engine - npm](https://www.npmjs.com/package/@datarster/workflow-engine) - Workflow engine with rollback (adds complexity not needed)
- [markdownlint GitHub](https://github.com/DavidAnson/markdownlint) - Markdown linting (useful for structure validation)
- [5 Cutting-Edge Natural Language Processing Trends Shaping 2026 - KDnuggets](https://www.kdnuggets.com/5-cutting-edge-natural-language-processing-trends-shaping-2026) - On-device NLP (TinyML) - not applicable to text trigger detection
- [Comparing Schema Validation Libraries - Bitovi](https://www.bitovi.com/blog/comparing-schema-validation-libraries-ajv-joi-yup-and-zod) - Ajv vs alternatives (verified ajv as fastest)

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - Ajv, write-file-atomic, front-matter already installed (HIGH); markdownlint recommended but not yet verified with project (MEDIUM); decision to avoid heavyweight workflow engines based on requirements analysis (HIGH)
- Architecture: MEDIUM - Patterns based on existing state-manager.js (HIGH); checkpoint recovery pattern from distributed systems literature but adapted for file-based use (MEDIUM); validation-before-write verified in codebase (HIGH)
- Pitfalls: MEDIUM - State corruption and validation pitfalls verified with multiple sources (HIGH); trigger false positives based on CONTEXT.md decisions (HIGH); checkpoint backup practices from literature (MEDIUM)

**Research date:** 2026-01-18
**Valid until:** 2026-02-17 (30 days - Node.js ecosystem is stable, patterns are established)

---

*Phase: 03-workflow-orchestration*
*Researched: 2026-01-18*
*Next step: Planning (create PLAN.md files for Phase 3 implementation)*
