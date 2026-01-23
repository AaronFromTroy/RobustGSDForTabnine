# Phase 6: Discussion & Context System - Research

**Researched:** 2026-01-20
**Domain:** Conversational context gathering, human-in-the-loop AI systems, structured decision records
**Confidence:** HIGH

## Summary

Phase 6 creates a discussion and context gathering system that runs BEFORE planning to prevent misalignment between user expectations and AI plans. Research focused on five domains: (1) conversational AI clarifying questions, (2) human-in-the-loop context gathering patterns, (3) adaptive questioning strategies, (4) machine-readable context formats, and (5) decision record integration.

The standard approach is structured YAML frontmatter with markdown sections for machine-readable context storage, progressive questioning that starts broad and narrows based on responses, and MADR-style decision records. Key finding from 2026: human-in-the-loop systems are evolving from validation-focused to context-provision-focused, where humans provide judgment, context, and strategic direction at critical decision points rather than reviewing every output.

Critical insight: The existing plan-phase.md guideline (v1.1.0) already implements a discussion system with question banks for technical, design/UX, and workflow phases. Phase 6's goal is to FORMALIZE and ENHANCE this with better question taxonomies, structured context storage (CONTEXT.md), and integration with research/planning workflows.

**Primary recommendation:** Build on existing discussion patterns in plan-phase.md. Create structured CONTEXT.md format with YAML frontmatter and categorized sections (Decisions, Claude's Discretion, Deferred Ideas). Implement question taxonomy system that adapts to phase type (technical, design, workflow). Store responses in machine-readable format that research and planning consume directly.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| YAML frontmatter | N/A | Context metadata (date, status, phase) | Industry standard (MADR, GitHub), human-readable, machine-parsable |
| gray-matter | ^4.0.3 | Parse CONTEXT.md frontmatter | De facto standard for frontmatter parsing, already in Phase 1 |
| Markdown sections | N/A | Structured context categories | MADR pattern, version-controllable, human-editable |
| XML-style tags | N/A | Semantic markup in markdown | Already used in PLAN.md tasks, consistent with project patterns |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| JSON Schema | Draft 2020-12 | Validate CONTEXT.md structure | Ensure required sections exist, already in .gsd-config.json validation |
| markdownlint | ^0.33.0 | Lint CONTEXT.md files | Notify about formatting inconsistencies, MADR ecosystem standard |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Markdown + YAML | Pure JSON context | JSON less human-editable; markdown allows prose explanations |
| Static question banks | LLM-generated questions | Dynamic questions add complexity; static banks are predictable and testable |
| MADR-style sections | Free-form discussion notes | Structure enables machine consumption; free-form requires parsing |

**Installation:**
```bash
# Already installed in Phase 1
npm install gray-matter ajv
# Optional for linting
npm install --save-dev markdownlint markdownlint-cli
```

## Architecture Patterns

### Recommended Project Structure
```
.planning/
├── phases/
│   └── XX-name/
│       ├── XX-CONTEXT.md         # Discussion results (new format)
│       ├── XX-RESEARCH.md        # Research informed by context
│       └── XX-NN-PLAN.md         # Plans informed by context + research
└── STATE.md                      # Tracks discussion completion
```

### Pattern 1: CONTEXT.md File Structure (MADR-Inspired)
**What:** Structured markdown with YAML frontmatter and categorized sections
**When to use:** Store discussion results for every phase before planning
**Example:**
```markdown
---
phase: 6
phase_name: "Discussion & Context System"
gathered: "2026-01-20"
status: "ready-for-planning"
discussion_type: "technical"
---

# Phase 6: Discussion & Context System - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

[Phase goal/scope from ROADMAP.md]

</domain>

<decisions>
## Implementation Decisions

User's locked-in choices that constrain research and planning.

### Technology Stack
- **Library X:** Use library X version Y (not alternatives Z)
- **Architecture pattern:** Use pattern A (user confirmed)

### Claude's Discretion
- Detail level for question taxonomy
- Context validation strategy
- Integration approach with existing discussion system

</decisions>

<specifics>
## Specific Ideas

Implementation details and preferences gathered from discussion.

**Exact phrases user prefers:**
- Use "context gathering" not "requirements elicitation"

**Priority order:**
1. Formalize existing system first
2. Add adaptive questioning second
3. Defer AI-generated questions to v2

</specifics>

<deferred>
## Deferred Ideas

Ideas explicitly marked as out-of-scope for this phase.

- LLM-generated adaptive questions (too complex for v1)
- Multi-language context files (English-only for v1)

</deferred>

---

*Phase: 06-discussion-and-context-system*
*Context gathered: 2026-01-20*
```
**Source:** Adapted from [MADR (Markdown Architectural Decision Records)](https://adr.github.io/madr/)

### Pattern 2: Question Taxonomy by Phase Type
**What:** Categorized question banks tailored to technical, design, and workflow phases
**When to use:** Discussion phase in plan-phase.md workflow
**Example:**
```javascript
// question-bank.js
export const QUESTION_TAXONOMY = {
  technical: {
    stack: [
      "What technology stack do you prefer for {component}?",
      "Any existing libraries or frameworks you want to use?",
      "Testing strategy (unit, integration, e2e)?"
    ],
    architecture: [
      "Code organization preference (flat, modular, domain-driven)?",
      "API design approach (REST, GraphQL, RPC)?",
      "State management pattern?"
    ]
  },
  design: {
    visual: [
      "Do you have a design system or style guide to follow?",
      "Color palette or brand guidelines?",
      "Typography preferences (font families, scale)?"
    ],
    ux: [
      "Responsive design requirements (mobile-first, desktop-first)?",
      "Accessibility requirements (WCAG level, screen reader support)?",
      "Animation/interaction preferences (minimal, smooth, rich)?"
    ]
  },
  workflow: {
    risk: [
      "What's your risk tolerance? (move fast vs be cautious)",
      "Preferred commit granularity? (atomic vs feature branches)"
    ],
    constraints: [
      "Are there any constraints I should know about?",
      "Timeline or milestone pressure?"
    ]
  }
};
```
**Source:** Adapted from plan-phase.md existing questions + [Software Requirements Elicitation Techniques](https://www.softwaretestinghelp.com/requirements-elicitation-techniques/)

### Pattern 3: Progressive Questioning Strategy
**What:** Start broad, narrow based on responses, avoid overwhelming user
**When to use:** All discussion phases, especially for complex technical decisions
**Example:**
```javascript
// Progressive questioning flow
async function conductDiscussion(phaseType, phaseGoal) {
  // Stage 1: Essential questions (always ask)
  const essentialAnswers = await askQuestions(ESSENTIAL_QUESTIONS[phaseType]);

  // Stage 2: Follow-up based on answers
  const followUps = determineFollowUps(essentialAnswers);
  const followUpAnswers = await askQuestions(followUps);

  // Stage 3: Clarifications (only if ambiguous)
  const clarifications = identifyAmbiguities(essentialAnswers, followUpAnswers);
  const clarificationAnswers = await askQuestions(clarifications);

  // Merge and structure
  return structureContext({
    essential: essentialAnswers,
    followUp: followUpAnswers,
    clarifications: clarificationAnswers
  });
}
```
**Source:** [Conversational AI Design Best Practices 2026](https://botpress.com/blog/conversation-design) - Progressive questioning, elicitation vs assumption balance

### Pattern 4: Context Consumption by Research/Planning
**What:** Research and planning scripts read CONTEXT.md to constrain exploration
**When to use:** Beginning of research and planning workflows
**Example:**
```javascript
// research-phase.js
import matter from 'gray-matter';
import fs from 'fs';

async function conductResearch(phase, phaseName) {
  // Load context if exists
  const contextPath = `.planning/phases/${phase}-${phaseName}/${phase}-CONTEXT.md`;
  let context = null;

  if (fs.existsSync(contextPath)) {
    const { data, content } = matter(fs.readFileSync(contextPath, 'utf8'));

    // Parse decisions
    const decisionsMatch = content.match(/<decisions>([\s\S]*?)<\/decisions>/);
    if (decisionsMatch) {
      context = parseDecisions(decisionsMatch[1]);
    }
  }

  // Research respects locked decisions
  if (context?.decisions?.library) {
    // Research THIS library deeply, not alternatives
    await researchLibrary(context.decisions.library);
  } else {
    // User gave freedom - research options and recommend
    await researchOptions();
  }
}
```
**Source:** Pattern adapted from existing RESEARCH.md consumption in plan-phase.md

### Anti-Patterns to Avoid

- **Asking every possible question:** Overwhelming user → Use progressive questioning, ask essentials first
- **Generic yes/no questions:** Low signal → Ask open-ended or choice-based questions with context
- **Technical jargon without explanation:** User confusion → Frame questions in business terms, explain technical options
- **No default/skip option:** Forcing answers → "Please answer what's relevant - I'll use defaults for anything skipped"
- **Ignoring previous answers:** Repetition fatigue → Track context across questions, avoid redundant asks
- **Burying key decisions in prose:** Hard to parse → Use structured sections (XML tags, markdown headers)

**Source:** [Microsoft Conversational UX Recommendations](https://learn.microsoft.com/en-us/power-platform/well-architected/experience-optimization/conversation-design)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Decision record format | Custom context structure | MADR (Markdown Architectural Decision Records) | Established format, tool support, linting, human + machine readable |
| YAML frontmatter parsing | Regex extraction | gray-matter | Handles edge cases (nested objects, arrays, escaped delimiters) |
| Question branching logic | Custom if/else trees | Decision table pattern | Easier to test, visualize, and maintain; avoids nested conditionals |
| Multi-turn conversation state | Global variables | Conversation context object | Testable, serializable, resumable after interruption |
| Context validation | Manual section checks | JSON Schema for structure | Standard error formats, reusable, validates required sections |

**Key insight:** Conversation design has well-studied patterns from chatbot UX research (2020-2026). Key finding: progressive questioning (start broad, narrow based on responses) prevents user fatigue while maintaining conversational flow. Balance elicitation (asking) vs assumption (defaulting) to respect user time.

## Common Pitfalls

### Pitfall 1: Question Overload (Fatigue)
**What goes wrong:** Asking 15+ questions at once; user abandons or gives low-quality rushed answers.
**Why it happens:** Designer wants comprehensive context; doesn't consider user cognitive load.
**How to avoid:** Group questions into stages (3-5 per stage). Start with essentials. Follow up only if needed. Offer "skip and use defaults" option.
**Warning signs:** User responds with "too many questions" or gives one-word answers to complex questions.

### Pitfall 2: Ambiguous Question Scope
**What goes wrong:** Question like "What's your testing strategy?" → User unsure if you mean unit, integration, e2e, TDD, coverage targets, CI/CD, or all of above.
**Why it happens:** Developer knows implicit context; question lacks boundaries.
**How to avoid:** Scope every question: "Testing strategy for THIS PHASE: unit tests required? Integration tests? E2e tests?"
**Warning signs:** User asks clarifying questions about your questions; answers don't match expected format.

### Pitfall 3: Locked Decisions Not Enforced
**What goes wrong:** User says "use library X" in discussion; planner researches alternatives anyway; rework required.
**Why it happens:** CONTEXT.md not parsed or planner ignores decisions section.
**How to avoid:** Research and planning scripts MUST read `<decisions>` section and treat as constraints. Validate: if decision exists, don't explore alternatives.
**Warning signs:** User says "I already told you to use X" after reviewing plans; rework loops.

### Pitfall 4: No Machine-Readable Structure
**What goes wrong:** Discussion results stored as free-form prose; research script can't parse; human must manually extract decisions.
**Why it happens:** Optimizing for human readability only; forgetting machine consumption.
**How to avoid:** Use XML-style tags (`<decisions>`, `<deferred>`) or strict markdown sections. Scripts can regex extract. Human can still read/edit prose within tags.
**Warning signs:** Scripts require manual intervention; can't automate research constraint application.

### Pitfall 5: Ignoring User's "I Don't Know"
**What goes wrong:** User doesn't have opinion on design system; discussion stalls waiting for answer.
**Why it happens:** No default/fallback path when user lacks context or preference.
**How to avoid:** Every question should have explicit "skip and use default" option. Document what default is. Example: "Design system? (Skip → I'll use minimal custom CSS)"
**Warning signs:** Discussion stuck; user says "I'm not sure" repeatedly; frustration.

### Pitfall 6: Context Drift Between Phases
**What goes wrong:** Phase 3 discussion decides "use library X"; Phase 5 discussion contradicts with "use library Y"; inconsistent system.
**Why it happens:** No cross-phase context tracking; each discussion happens in isolation.
**How to avoid:** STATE.md Key Decisions table tracks cross-phase decisions. New discussion checks existing decisions. Flag conflicts.
**Warning signs:** User notices inconsistency; "Why did we switch from X to Y?"; technical debt from conflicting choices.

### Pitfall 7: Questions Not Tailored to Phase Type
**What goes wrong:** Asking design questions for backend infrastructure phase; user confused about relevance.
**Why it happens:** Generic question bank without phase type detection.
**How to avoid:** Detect phase type from ROADMAP.md goal keywords (UI, frontend, API, infrastructure). Load appropriate question taxonomy.
**Warning signs:** User skips most questions; "not applicable" responses; low engagement.

### Pitfall 8: No Conversation Resumption Support
**What goes wrong:** Discussion interrupted (context window, user break); must restart from beginning; user re-answers same questions.
**Why it happens:** Conversation state not persisted; no checkpoint mechanism.
**How to avoid:** Persist partial answers to CONTEXT.md after each question group. On resume, load existing answers and continue from last question.
**Warning signs:** User says "I already answered that"; frustration with repetition; abandonment.

## Code Examples

Verified patterns from official sources:

### Parse CONTEXT.md Decisions Section
```javascript
// Source: Adapted from gray-matter docs + existing RESEARCH.md pattern
import matter from 'gray-matter';
import fs from 'fs';

function loadPhaseContext(phase, phaseName) {
  const contextPath = `.planning/phases/${phase}-${phaseName}/${phase}-CONTEXT.md`;

  if (!fs.existsSync(contextPath)) {
    return null; // No context - Claude has full discretion
  }

  const fileContent = fs.readFileSync(contextPath, 'utf8');
  const { data: frontmatter, content } = matter(fileContent);

  // Extract decisions section (locked choices)
  const decisionsMatch = content.match(/<decisions>([\s\S]*?)<\/decisions>/);
  const decisions = decisionsMatch ? parseDecisionsMarkdown(decisionsMatch[1]) : {};

  // Extract Claude's discretion section (freedom areas)
  const discretionMatch = content.match(/<decisions>[\s\S]*?### Claude's Discretion\s+([\s\S]*?)<\/decisions>/);
  const discretion = discretionMatch ? parseListItems(discretionMatch[1]) : [];

  // Extract deferred ideas (out of scope)
  const deferredMatch = content.match(/<deferred>([\s\S]*?)<\/deferred>/);
  const deferred = deferredMatch ? parseListItems(deferredMatch[1]) : [];

  return {
    frontmatter,
    decisions,      // User's locked choices
    discretion,     // Claude's freedom
    deferred        // Explicitly out of scope
  };
}

function parseDecisionsMarkdown(markdown) {
  const decisions = {};
  // Parse bullet list format: "- **Key:** Value"
  const regex = /- \*\*([^:]+):\*\* (.+)/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    decisions[match[1].toLowerCase().replace(/\s+/g, '_')] = match[2];
  }
  return decisions;
}
```

### Progressive Question Flow
```javascript
// Source: Conversational AI best practices - progressive elicitation
async function conductProgressiveDiscussion(phaseType, phaseGoal) {
  console.log(`Before I create execution plans for ${phaseGoal}, I'd like to clarify:\n`);

  // Stage 1: Essential questions (3-5 only)
  const essentialQuestions = QUESTION_TAXONOMY[phaseType].essential;
  console.log("## Essential Context\n");
  const essentialAnswers = await askQuestions(essentialQuestions);

  // Stage 2: Conditional follow-ups based on answers
  const followUps = [];
  if (essentialAnswers.uiFramework === 'React') {
    followUps.push("State management approach? (Context API, Redux, Zustand)");
  }
  if (essentialAnswers.hasDesignSystem === 'no') {
    followUps.push("Should I create a minimal design system or use utility CSS?");
  }

  if (followUps.length > 0) {
    console.log("\n## Follow-up Questions\n");
    const followUpAnswers = await askQuestions(followUps);
    Object.assign(essentialAnswers, followUpAnswers);
  }

  // Stage 3: Clarifications only if ambiguous
  const clarifications = identifyAmbiguities(essentialAnswers);
  if (clarifications.length > 0) {
    console.log("\n## Clarifications\n");
    const clarificationAnswers = await askQuestions(clarifications);
    Object.assign(essentialAnswers, clarificationAnswers);
  }

  console.log("\nPlease answer what's relevant - I'll use defaults for anything skipped.\n");

  return essentialAnswers;
}
```

### Determine Phase Type from ROADMAP.md Goal
```javascript
// Source: Pattern recognition from existing plan-phase.md
function detectPhaseType(phaseGoal) {
  const goal = phaseGoal.toLowerCase();

  // UI/Design keywords
  const uiKeywords = ['ui', 'frontend', 'interface', 'dashboard', 'component', 'design', 'visual', 'layout'];
  if (uiKeywords.some(keyword => goal.includes(keyword))) {
    return { technical: true, design: true, workflow: true };
  }

  // Pure technical keywords
  const techKeywords = ['api', 'backend', 'infrastructure', 'database', 'service', 'integration'];
  if (techKeywords.some(keyword => goal.includes(keyword))) {
    return { technical: true, design: false, workflow: true };
  }

  // Workflow/process keywords
  const workflowKeywords = ['workflow', 'orchestration', 'automation', 'pipeline'];
  if (workflowKeywords.some(keyword => goal.includes(keyword))) {
    return { technical: true, design: false, workflow: true };
  }

  // Default: ask technical + workflow (safest)
  return { technical: true, design: false, workflow: true };
}
```

### Validate CONTEXT.md Structure with JSON Schema
```javascript
// Source: JSON Schema + existing validator.js pattern
import Ajv from 'ajv';

const CONTEXT_SCHEMA = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["phase", "phase_name", "gathered", "status"],
  "properties": {
    "phase": { "type": "number", "minimum": 1 },
    "phase_name": { "type": "string", "minLength": 1 },
    "gathered": { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$" },
    "status": { "enum": ["ready-for-planning", "incomplete", "deferred"] },
    "discussion_type": { "enum": ["technical", "design", "workflow", "mixed"] }
  }
};

function validateContextFile(contextPath) {
  const { data: frontmatter, content } = matter(fs.readFileSync(contextPath, 'utf8'));

  // Validate frontmatter structure
  const ajv = new Ajv();
  const validate = ajv.compile(CONTEXT_SCHEMA);
  const valid = validate(frontmatter);

  if (!valid) {
    throw new Error(`CONTEXT.md frontmatter invalid: ${JSON.stringify(validate.errors)}`);
  }

  // Validate required sections exist
  const requiredSections = ['<domain>', '<decisions>', '<deferred>'];
  for (const section of requiredSections) {
    if (!content.includes(section)) {
      throw new Error(`CONTEXT.md missing required section: ${section}`);
    }
  }

  return { valid: true, frontmatter, content };
}
```

### Store Discussion Results to CONTEXT.md
```javascript
// Source: Template rendering pattern from Phase 1
import { renderTemplate } from './template-renderer.js';
import { writeFileAtomic } from './file-ops.js';
import path from 'path';

async function saveDiscussionContext(phase, phaseName, answers, phaseGoal) {
  const phaseDir = `.planning/phases/${phase}-${phaseName}`;
  const contextPath = path.join(phaseDir, `${phase}-CONTEXT.md`);

  // Structure answers into decisions and discretion
  const { locked, discretion, deferred } = categorizeAnswers(answers);

  // Render CONTEXT.md template
  const content = await renderTemplate('CONTEXT', {
    phase,
    phase_name: phaseName,
    gathered: new Date().toISOString().split('T')[0],
    status: 'ready-for-planning',
    discussion_type: answers.phaseType || 'technical',
    phase_boundary: phaseGoal,
    locked_decisions: formatDecisions(locked),
    discretion_items: formatList(discretion),
    deferred_items: formatList(deferred)
  });

  await writeFileAtomic(contextPath, content);

  return contextPath;
}

function categorizeAnswers(answers) {
  // User explicitly chose something → locked decision
  // User said "up to you" or skipped → Claude's discretion
  // User said "not this phase" → deferred

  const locked = [];
  const discretion = [];
  const deferred = [];

  for (const [question, answer] of Object.entries(answers)) {
    if (!answer || answer.toLowerCase().includes('skip') || answer.toLowerCase().includes('up to you')) {
      discretion.push(question);
    } else if (answer.toLowerCase().includes('not now') || answer.toLowerCase().includes('later')) {
      deferred.push({ question, answer });
    } else {
      locked.push({ question, answer });
    }
  }

  return { locked, discretion, deferred };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Plan first, discuss if conflicts | Discuss before planning | 2025-2026 (human-in-the-loop focus) | Prevents rework; user provides context upfront |
| Fixed question lists | Adaptive progressive questioning | 2026 (conversational AI maturity) | Reduces user fatigue; higher quality answers |
| Free-form discussion notes | Structured CONTEXT.md with MADR format | 2024-2026 (ADR adoption) | Machine-readable; version-controlled decisions |
| Generic questions for all phases | Phase-type-aware question taxonomy | 2026 (phase 5 learning) | Relevant questions; higher engagement |
| Validation-focused HITL | Context-provision-focused HITL | 2025-2026 shift | Humans provide judgment/context, not just approve/reject |

**Deprecated/outdated:**
- **Planning without discussion:** Leads to misalignment (Phase 5 npm publishing example)
- **Yes/no only questions:** Low signal; modern practice uses open-ended + choice-based
- **Ignoring user's "skip":** Forcing answers creates friction; respect user's time
- **Prose-only decision records:** Hard to parse; MADR-style structure is now standard

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal question count per stage**
   - What we know: Best practice is 3-5 questions per stage to avoid fatigue
   - What's unclear: Whether this applies specifically to Tabnine's chat UI or developer workflows
   - Recommendation: Start with 3-5 essentials, 2-3 follow-ups max; measure engagement in testing

2. **Adaptive questioning complexity**
   - What we know: LLM-generated adaptive questions are possible but add complexity
   - What's unclear: Whether static taxonomy + conditional branching is sufficient for v1
   - Recommendation: Implement static taxonomy with simple branching (Phase 6); defer LLM-generated questions to v2 if user demand exists

3. **Context validation enforcement level**
   - What we know: Research/planning should respect locked decisions
   - What's unclear: Should violation be blocking error or warning?
   - Recommendation: Blocking error for locked decisions; warning for discretion items; prevents silent misalignment

4. **Cross-phase context tracking**
   - What we know: Decisions in Phase 3 may affect Phase 5
   - What's unclear: How to track and surface cross-phase context dependencies
   - Recommendation: STATE.md Key Decisions table tracks all phases; discussion checks for conflicts before asking

5. **Discussion resumption after interruption**
   - What we know: Should persist partial answers for resume
   - What's unclear: Granularity (after each question vs after each stage)
   - Recommendation: Persist after each stage (3-5 questions); balance between interruption safety and file write overhead

## Sources

### Primary (HIGH confidence)
- [Conversational AI Design Best Practices 2026](https://botpress.com/blog/conversation-design) - Progressive questioning, clarifying questions, dialogue management
- [Microsoft Conversational UX Recommendations](https://learn.microsoft.com/en-us/power-platform/well-architected/experience-optimization/conversation-design) - Avoid generic responses, break down complex requests
- [MADR (Markdown Architectural Decision Records)](https://adr.github.io/madr/) - Decision record format, YAML frontmatter, structured sections
- [Future of Human-in-the-Loop AI 2026](https://parseur.com/blog/future-of-hitl-ai) - Context provision focus, strategic validation
- [GitHub YAML Frontmatter Format](https://github.com/jlevy/frontmatter-format) - Machine-readable metadata convention

### Secondary (MEDIUM confidence)
- [Software Requirements Elicitation Techniques](https://www.softwaretestinghelp.com/requirements-elicitation-techniques/) - Open-ended vs closed questions, interview patterns
- [Context-Driven AI Planning Systems 2026](https://www.mosaicapp.com/post/the-rise-of-ai-driven-decision-making-in-2026-and-beyond) - Agentic AI, context awareness
- [Chatbot Survey Question Design](https://typebot.io/blog/chatbot-survey-questions) - Keep questions short, conversational language, branching
- [Multi-Turn Conversation Design](https://learn.microsoft.com/en-us/azure/ai-services/qnamaker/how-to/multi-turn) - Context across turns, dialogue management
- Existing plan-phase.md guideline (v1.1.0) - Current discussion implementation, question banks

### Tertiary (LOW confidence - for context only)
- Various WebSearch results about adaptive questioning and conversational AI (2026)
- Academic research on multi-turn dialogue evaluation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - YAML frontmatter and MADR format are industry standards; gray-matter already in use
- Architecture: HIGH - CONTEXT.md pattern exists (Phases 1, 3); formalization straightforward; MADR is established
- Question taxonomy: MEDIUM-HIGH - Best practices documented; existing question banks in plan-phase.md; needs tailoring
- Adaptive questioning: MEDIUM - Progressive questioning is standard; conditional branching feasible; LLM-generation deferred
- Pitfalls: HIGH - Drawn from conversational AI research and existing Phase 5 misalignment experience

**Research date:** 2026-01-20
**Valid until:** ~30 days (2026-02-19) - Conversational AI patterns evolving rapidly; MADR format stable; revalidate question taxonomy based on user feedback

**Notes for planner:**
- Phase 6 builds on existing plan-phase.md discussion (v1.1.0) - don't rebuild from scratch
- Focus on formalizing CONTEXT.md format and ensuring research/planning consume it
- Question taxonomy can start simple (static banks + phase type detection) and evolve
- Key success: prevent Phase 5-style misalignment (planning npm publishing without user confirmation)
- Test with actual users to validate question count and relevance
