# Phase 4: Advanced Features - Research

**Researched:** 2026-01-18
**Domain:** Human-in-the-Loop (HITL) approval gates and multi-source research synthesis
**Confidence:** MEDIUM

## Summary

Phase 4 adds two critical production features: human-in-the-loop approval gates for key decisions and automated research synthesis from multiple sources. The research reveals a fundamental architectural constraint: **Tabnine Agent already provides interactive approval gates through its UI**, which means the Node.js scripts should focus on **preparing approval payloads and logging decisions** rather than implementing CLI prompts.

For research synthesis, the standard approach in 2026 combines multi-source web scraping with confidence scoring (HIGH/MEDIUM/LOW based on source authority) and structured markdown document generation. RAG+LLM systems are the emerging standard, but for this phase, a simpler approach using web search APIs and document templates is more appropriate given Tabnine's constraints.

**Primary recommendation:** Leverage Tabnine's built-in approval UI for HITL gates; build file-based decision logging and research document generators that work within the sequential execution model.

## Standard Stack

The established libraries/tools for this domain:

### Core: Tabnine Agent Native Capabilities
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tabnine Agent UI | Built-in | Interactive approval gates | Native to platform, handles "Apply Code", "Run Command" approvals |
| Tool Permissions | Native | Auto-approve vs Ask-first modes | Configuration-driven approval workflow |

### Supporting: Node.js Document Generation
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @inquirer/prompts | 11.x | CLI interactive prompts | **NOT USED** - Tabnine handles UI |
| Front-matter | 4.0.2 | Parse YAML frontmatter | Already installed, for template metadata |
| Template literals | Native | Document generation | Already used in Phase 2 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tabnine native approval | Custom CLI prompts with @inquirer/prompts | Would conflict with Tabnine UI, creates confusing dual UX |
| File-based decision log | In-memory state only | Loses traceability, no Git history |
| Simple web search API | RAG+LLM systems (LangChain, crewAI) | Over-engineered for v1; defer to v2 for agentic research |

**Installation:**
```bash
# No new dependencies needed - use existing stack
# Front-matter 4.0.2 already installed in Phase 2
# Native Node.js features sufficient for document generation
```

## Architecture Patterns

### Recommended Project Structure
```
gsd/
├── scripts/
│   ├── approval-gate.js        # Prepare approval payloads, log decisions
│   ├── research-synthesizer.js # Multi-source research and document generation
│   └── (existing modules)
├── templates/
│   ├── STACK.md                # Research: technology stack findings
│   ├── FEATURES.md             # Research: feature requirements and capabilities
│   ├── ARCHITECTURE.md         # Research: architectural patterns and recommendations
│   ├── PITFALLS.md             # Research: common mistakes and anti-patterns
│   └── SUMMARY.md              # Research: executive summary with roadmap implications
└── (existing files)
```

### Pattern 1: Tabnine-Native Approval Gates
**What:** Use Tabnine's built-in Tool Permissions system for user approvals, with Node.js scripts preparing approval payloads and logging decisions.

**When to use:** All HITL requirements (HITL-01 through HITL-05)

**How it works:**
1. Node.js script prepares decision context (options, recommendations, tradeoffs)
2. Script presents context through Tabnine's normal output
3. Tabnine Agent prompts user through its UI ("Apply Code", "Run Command", etc.)
4. Script logs approval decision to STATE.md after Tabnine confirms action
5. Decision log becomes Git-tracked traceability record

**Example:**
```javascript
// Source: Research findings from Tabnine docs
// approval-gate.js

/**
 * Prepare approval gate context for Tabnine UI
 * @param {string} gateName - Name of decision point (e.g., "Stack Choice")
 * @param {Array<Object>} options - Array of options with {name, pros, cons, recommendation}
 * @returns {Object} Formatted approval context
 */
export function prepareApprovalGate(gateName, options) {
  // Format options for clear presentation
  const formattedOptions = options.map((opt, idx) => ({
    number: idx + 1,
    name: opt.name,
    pros: opt.pros,
    cons: opt.cons,
    recommendation: opt.recommendation || ''
  }));

  return {
    gate: gateName,
    timestamp: new Date().toISOString(),
    options: formattedOptions,
    status: 'awaiting_approval'
  };
}

/**
 * Log approval decision to STATE.md for traceability
 * @param {string} projectRoot - Root directory
 * @param {string} gateName - Decision point name
 * @param {string} selectedOption - User's choice
 * @param {string} rationale - Why this choice was made
 */
export async function logApprovalDecision(projectRoot, gateName, selectedOption, rationale) {
  // Read current STATE.md
  const state = await readState(projectRoot);

  // Append to accumulated decisions section
  const decision = {
    gate: gateName,
    choice: selectedOption,
    rationale: rationale,
    timestamp: new Date().toISOString(),
    approvedBy: 'user' // Could be enhanced with user identity
  };

  // Persist to STATE.md in "Key Decisions" section
  // Uses regex replacement pattern from Phase 2 state-manager.js
}
```

### Pattern 2: File-Based Decision Logging
**What:** Append approval decisions to STATE.md in structured format for Git-tracked traceability.

**When to use:** After every approval gate (HITL-04 requirement)

**How it works:**
1. Extract current "Key Decisions" section from STATE.md
2. Append new decision with timestamp, gate name, choice, rationale
3. Atomic write using write-file-atomic (Phase 2 pattern)
4. Git commit captures decision in version history

**Example:**
```markdown
## Key Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| Sequential execution model | 2026-01-18 | Tabnine constraint: no sub-agents |
| [APPROVAL GATE] Stack: React + Vite | 2026-01-18 | User selected React over Vue (faster ecosystem, team experience) |
| [APPROVAL GATE] Database: PostgreSQL | 2026-01-18 | User selected Postgres over MongoDB (ACID requirements) |
```

### Pattern 3: Research Document Generation
**What:** Generate structured markdown documents from multi-source research with confidence levels.

**When to use:** Research synthesis requirements (RES-01 through RES-05)

**How it works:**
1. Perform web search across multiple sources (documentation, Stack Overflow, GitHub)
2. Extract findings with source URLs
3. Assign confidence levels: HIGH (official docs), MEDIUM (verified community), LOW (single source)
4. Generate markdown using template literals (Phase 2 pattern)
5. Include "Sources" section with clickable URLs

**Example:**
```javascript
// Source: Research findings on document generation patterns
// research-synthesizer.js

/**
 * Synthesize research into structured markdown document
 * @param {string} topic - Research topic (e.g., "React best practices")
 * @param {Array<Object>} findings - Array of {content, source, confidence}
 * @param {string} templateType - Which template to use (STACK, FEATURES, etc.)
 * @returns {string} Generated markdown document
 */
export async function synthesizeResearch(topic, findings, templateType) {
  // Load template (e.g., templates/STACK.md)
  const template = await loadTemplate(templateType);

  // Group findings by confidence level
  const high = findings.filter(f => f.confidence === 'HIGH');
  const medium = findings.filter(f => f.confidence === 'MEDIUM');
  const low = findings.filter(f => f.confidence === 'LOW');

  // Prepare context for template rendering
  const context = {
    topic,
    timestamp: new Date().toISOString(),
    highConfidenceFindings: high,
    mediumConfidenceFindings: medium,
    lowConfidenceFindings: low,
    sourceList: findings.map(f => f.source)
  };

  // Render using Function constructor (Phase 2 pattern)
  return renderTemplate(template, context);
}
```

### Pattern 4: Confidence Level Assignment
**What:** Systematic approach to rating research finding reliability.

**When to use:** All research synthesis (RES-02 requirement)

**Decision tree:**
```
1. Is source official documentation?
   YES → HIGH confidence
   NO → Continue to 2

2. Is source verified with official docs?
   YES → MEDIUM confidence
   NO → Continue to 3

3. Do multiple independent sources agree?
   YES → MEDIUM confidence
   NO → LOW confidence (flag for validation)
```

**Example:**
```javascript
/**
 * Assign confidence level to research finding
 * @param {Object} finding - Finding with source, content
 * @returns {string} Confidence level: HIGH, MEDIUM, LOW
 */
export function assignConfidenceLevel(finding) {
  const source = finding.source.toLowerCase();

  // HIGH: Official documentation
  if (source.includes('docs.') ||
      source.includes('official') ||
      source.includes('.dev') ||
      source.includes('github.com') && source.includes('/docs/')) {
    return 'HIGH';
  }

  // MEDIUM: Reputable technical sources
  if (source.includes('mdn.') ||
      source.includes('stackoverflow.com') ||
      finding.verifiedWithOfficial === true) {
    return 'MEDIUM';
  }

  // LOW: Blog posts, unverified community content
  return 'LOW';
}
```

### Anti-Patterns to Avoid

- **Custom CLI prompts**: Do NOT use @inquirer/prompts or similar - conflicts with Tabnine's native UI
- **In-memory decision log**: Do NOT store approvals only in memory - must persist to STATE.md for traceability
- **Unverified research claims**: Do NOT present LOW confidence findings as authoritative - always mark confidence level
- **Missing source URLs**: Do NOT generate research documents without source citations - breaks verification requirement (RES-05)
- **Synchronous file operations**: Do NOT use fs.readFileSync() - async only (Phase 2 convention)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interactive CLI prompts | Custom readline/prompt loop | Tabnine native approval UI | Platform already provides approval workflow through Tool Permissions |
| Markdown document parsing | Custom regex parser | Front-matter library (already installed) | Handles YAML frontmatter edge cases, already in package.json |
| Template rendering | Custom string replacement | Function constructor with template literals (Phase 2) | Already established pattern, no new dependencies |
| Atomic file writes | Manual temp file + rename | write-file-atomic (already installed) | Prevents corruption on interruption, already in use |
| Web scraping/API calls | Low-level HTTP requests | Consider Context7, official APIs | Tabnine may have built-in web search capabilities to leverage |

**Key insight:** Tabnine Agent already solves the approval gate UX problem. Don't rebuild what the platform provides; instead, focus on **preparing approval context** and **logging decisions**.

## Common Pitfalls

### Pitfall 1: Fighting Tabnine's Native UI
**What goes wrong:** Implementing custom CLI prompts that conflict with Tabnine's approval system, creating confusing dual UX.

**Why it happens:** Assumption that Node.js scripts must handle all user interaction directly.

**How to avoid:**
- Use Tabnine's Tool Permissions for approval gates
- Scripts prepare context and log decisions, not collect input
- Present options through clear console output, let Tabnine UI handle confirmation

**Warning signs:**
- Installing @inquirer/prompts or similar prompt libraries
- Seeing "waiting for user input..." hangs during Tabnine execution
- Users confused about where to respond to prompts

### Pitfall 2: Losing Decision Traceability
**What goes wrong:** Approval decisions stored only in memory or separate logs, not tracked in Git history.

**Why it happens:** Treating STATE.md as read-only, not realizing it's the decision log.

**How to avoid:**
- Append all approval decisions to STATE.md "Key Decisions" section
- Use structured format (table with date, decision, rationale)
- Atomic writes ensure no corruption during updates
- Git commits after each decision create audit trail

**Warning signs:**
- "What did we decide about X?" questions with no written record
- Approval history lost after STATE.md updates
- Inability to trace why certain architectural choices were made

### Pitfall 3: Unverified Research Claims
**What goes wrong:** Presenting blog posts and community opinions as authoritative findings without confidence levels.

**Why it happens:** Treating all web search results equally, not validating against official sources.

**How to avoid:**
- Always assign confidence levels (HIGH/MEDIUM/LOW)
- Cross-reference community findings with official documentation
- Mark LOW confidence items with "Needs validation" flags
- Include source URLs for every claim

**Warning signs:**
- Research documents without source citations
- Conflicting information presented as equally valid
- Missing confidence level indicators

### Pitfall 4: Synchronous Research Blocking
**What goes wrong:** Sequential web searches blocking execution while waiting for responses.

**Why it happens:** Not leveraging async/await patterns for parallel research queries.

**How to avoid:**
- Use Promise.all() for parallel web searches
- Fetch multiple sources concurrently (docs, GitHub, Stack Overflow)
- Collect results, then synthesize (don't wait for each sequentially)
- Set reasonable timeouts for research operations

**Warning signs:**
- Research synthesis taking 2-3 minutes per query
- Single-threaded execution visible in logs
- User waiting for sequential "fetching..." messages

### Pitfall 5: Template Bloat
**What goes wrong:** Creating 10+ research templates with overlapping structure, making maintenance difficult.

**Why it happens:** Creating new template file for every slight variation.

**How to avoid:**
- Start with 5 core templates (STACK, FEATURES, ARCHITECTURE, PITFALLS, SUMMARY)
- Use sections within templates for variations
- Share common structure (frontmatter, sources section, confidence indicators)
- Consider parameterized templates if patterns emerge

**Warning signs:**
- Templates directory with 20+ files
- Copy-paste between template files
- Difficulty updating common sections across templates

## Code Examples

Verified patterns from official sources and research findings:

### HITL Approval Gate Pattern
```javascript
// Source: Tabnine docs + workflow automation patterns research
// approval-gate.js

import { readState, writeState } from './state-manager.js';
import path from 'node:path';

/**
 * Present approval gate to user through Tabnine UI
 * Prepares context, presents options, waits for Tabnine confirmation
 *
 * @param {string} projectRoot - Root directory
 * @param {string} gateName - Decision point name (e.g., "Technology Stack")
 * @param {Array<Object>} options - Choices: [{name, description, pros, cons, recommendation}]
 * @returns {Promise<Object>} Result: {approved: boolean, selectedOption, timestamp}
 */
export async function presentApprovalGate(projectRoot, gateName, options) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`APPROVAL GATE: ${gateName}`);
  console.log('='.repeat(60));
  console.log(`\nPlease review options and select your preference:\n`);

  // Display options with clear formatting
  options.forEach((opt, idx) => {
    console.log(`\n${idx + 1}. ${opt.name}`);
    console.log(`   ${opt.description}`);
    console.log(`\n   ✓ Pros:`);
    opt.pros.forEach(pro => console.log(`     - ${pro}`));
    console.log(`\n   ✗ Cons:`);
    opt.cons.forEach(con => console.log(`     - ${con}`));
    if (opt.recommendation) {
      console.log(`\n   💡 Recommendation: ${opt.recommendation}`);
    }
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Respond with your choice (1-${options.length}) when Tabnine prompts for approval.`);
  console.log('='.repeat(60));

  // In Tabnine, this would trigger "Apply Code" or "Run Command" approval
  // The user's selection would be captured through Tabnine's UI
  // For now, return structure that calling code can use

  return {
    gate: gateName,
    options: options,
    timestamp: new Date().toISOString(),
    status: 'presented'
  };
}

/**
 * Log approval decision to STATE.md
 * @param {string} projectRoot - Root directory
 * @param {string} gateName - Decision point name
 * @param {string} selectedOption - User's choice
 * @param {string} rationale - Why this choice
 */
export async function logApprovalDecision(projectRoot, gateName, selectedOption, rationale) {
  const state = await readState(projectRoot);
  const statePath = path.join(projectRoot, '.planning', 'STATE.md');

  // Prepare decision entry
  const decision = `| [APPROVAL GATE] ${gateName}: ${selectedOption} | ${new Date().toISOString().split('T')[0]} | ${rationale} |`;

  // Insert into Key Decisions table
  // Find the table in STATE.md and append new row
  let content = state.rawContent;

  // Look for the Key Decisions table
  const tableMatch = content.match(/(## Key Decisions\s+\| Decision \| Date \| Rationale \|\s+\|[-|]+\|[^\n]*\n)((?:\|[^\n]+\n)*)/);

  if (tableMatch) {
    // Insert new decision before the next section
    const tableStart = tableMatch[1];
    const tableRows = tableMatch[2];
    const newTable = tableStart + tableRows + decision + '\n';
    content = content.replace(tableMatch[0], newTable);
  }

  // Write atomically
  const { writeFileAtomic } = await import('./file-ops.js');
  await writeFileAtomic(statePath, content);

  return {
    logged: true,
    decision: { gateName, selectedOption, rationale }
  };
}
```

### Research Synthesis Pattern
```javascript
// Source: Research automation patterns + document generation best practices
// research-synthesizer.js

import { readFile } from './file-ops.js';
import { renderTemplate } from './template-renderer.js';
import path from 'node:path';

/**
 * Assign confidence level based on source authority
 * @param {Object} finding - Finding with source URL
 * @returns {string} Confidence: HIGH, MEDIUM, LOW
 */
export function assignConfidenceLevel(finding) {
  const source = finding.source.toLowerCase();

  // HIGH: Official documentation, primary sources
  if (source.includes('docs.') ||
      source.includes('official') ||
      source.includes('.dev') ||
      source.match(/github\.com\/[^/]+\/[^/]+\/(blob|tree)\/main\/docs/)) {
    return 'HIGH';
  }

  // MEDIUM: Verified sources, reputable platforms
  if (source.includes('mdn.mozilla.org') ||
      source.includes('developer.mozilla.org') ||
      source.includes('stackoverflow.com') ||
      finding.verifiedWithOfficial === true) {
    return 'MEDIUM';
  }

  // LOW: Blog posts, single sources, unverified
  return 'LOW';
}

/**
 * Synthesize research findings into structured document
 * @param {string} projectRoot - Root directory
 * @param {string} topic - Research topic
 * @param {Array<Object>} findings - Findings with {content, source, timestamp}
 * @param {string} templateType - Template name (STACK, FEATURES, etc.)
 * @returns {Promise<string>} Generated markdown content
 */
export async function synthesizeResearch(projectRoot, topic, findings, templateType) {
  // Assign confidence levels
  const enrichedFindings = findings.map(f => ({
    ...f,
    confidence: assignConfidenceLevel(f)
  }));

  // Group by confidence
  const high = enrichedFindings.filter(f => f.confidence === 'HIGH');
  const medium = enrichedFindings.filter(f => f.confidence === 'MEDIUM');
  const low = enrichedFindings.filter(f => f.confidence === 'LOW');

  // Load template
  const templatePath = path.join(projectRoot, 'gsd', 'templates', `${templateType}.md`);
  const templateContent = await readFile(templatePath);

  // Prepare rendering context
  const context = {
    topic,
    timestamp: new Date().toISOString().split('T')[0],
    highFindings: high,
    mediumFindings: medium,
    lowFindings: low,
    totalSources: findings.length,
    sourceList: findings.map(f => `- [${f.title || 'Source'}](${f.source})`).join('\n')
  };

  // Render using Phase 2 template pattern
  return renderTemplate(templateContent, context);
}

/**
 * Generate STACK.md from technology research
 * @param {string} projectRoot - Root directory
 * @param {Array<Object>} stackFindings - Technology choices with rationale
 * @returns {Promise<string>} Path to generated file
 */
export async function generateStackDocument(projectRoot, stackFindings) {
  const content = await synthesizeResearch(
    projectRoot,
    'Technology Stack',
    stackFindings,
    'STACK'
  );

  const outputPath = path.join(projectRoot, '.planning', 'STACK.md');
  const { writeFileAtomic } = await import('./file-ops.js');
  await writeFileAtomic(outputPath, content);

  return outputPath;
}
```

### Research Template Example (STACK.md)
```markdown
---
type: research
topic: \${topic}
generated: \${timestamp}
confidence:
  high: \${highFindings.length}
  medium: \${mediumFindings.length}
  low: \${lowFindings.length}
---

# Technology Stack Research: \${topic}

**Generated:** \${timestamp}
**Total Sources:** \${totalSources}

## Summary

[Executive summary of stack recommendations]

## High Confidence Findings

\${highFindings.map(f => \`
### \${f.title}
**Source:** [\${f.source}](\${f.source})
**Confidence:** HIGH

\${f.content}
\`).join('\n')}

## Medium Confidence Findings

\${mediumFindings.map(f => \`
### \${f.title}
**Source:** [\${f.source}](\${f.source})
**Confidence:** MEDIUM

\${f.content}
\`).join('\n')}

## Low Confidence Findings

**⚠️ The following findings need validation with official sources:**

\${lowFindings.map(f => \`
### \${f.title}
**Source:** [\${f.source}](\${f.source})
**Confidence:** LOW

\${f.content}
\`).join('\n')}

## Sources

\${sourceList}

---
*Research synthesized on \${timestamp}*
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom readline prompts in CLI | Platform-native approval UI (Tabnine Tool Permissions) | 2025-2026 | Better UX integration, no prompt conflicts |
| Manual research aggregation | AI-assisted research synthesis with confidence scoring | 2025-2026 | Faster research, explicit confidence levels |
| Ad-hoc decision logs | Structured STATE.md decision tracking | 2026 (this project) | Git-tracked traceability, audit trail |
| RAG without source citation | Source URLs mandatory for verification | 2026 | Research transparency, validation possible |
| Inquirer.js v8 (callback-based) | @inquirer/prompts v11 (async/await) | 2024-2025 | Modern API, but NOT needed for this project |

**Deprecated/outdated:**
- **Inquirer.js legacy version**: Now split into @inquirer/prompts with rewritten API. However, **neither should be used** for this project - Tabnine handles approval UI natively.
- **Synchronous file operations**: Phase 2 established async-only pattern; continue this convention.
- **Unstructured decision logs**: Freeform notes in STATE.md replaced by structured table format.

## Open Questions

Things that couldn't be fully resolved:

1. **Tabnine Agent Interactive Capabilities**
   - What we know: Tabnine Agent has native approval UI (Tool Permissions: Auto-approve, Ask first, Disable)
   - What's unclear: Whether custom prompts can be presented during execution, or only pre-defined tool approvals
   - Recommendation: Start with pre-defined approval gates (file writes, command execution); if more flexibility needed, investigate Tabnine MCP server extensions

2. **Web Search API Integration**
   - What we know: Tabnine may have built-in web search capabilities; standard Node.js can use web APIs
   - What's unclear: Whether to build custom web scraping or leverage Tabnine's potential search features
   - Recommendation: Investigate Tabnine's web access capabilities first; fallback to Node.js fetch() + cheerio if needed

3. **Research Document Template Scope**
   - What we know: ROADMAP.md specifies STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md, SUMMARY.md (5 templates)
   - What's unclear: Whether these 5 cover all research needs, or if additional templates emerge during execution
   - Recommendation: Start with these 5; add templates only if clear gaps appear during Phase 4 planning

4. **Approval Gate Granularity**
   - What we know: Gates should pause at "key decision points" (HITL-01)
   - What's unclear: What qualifies as "key" - stack choice yes, but library version choice?
   - Recommendation: Define gate criteria during planning: architectural decisions (yes), implementation details (no)

## Sources

### Primary (HIGH confidence)
- [Tabnine Agent - How to Use](https://docs.tabnine.com/main/getting-started/tabnine-agent/how-to-use-tabnine-agent) - Verified Tabnine capabilities and limitations
- [Tabnine Agent Settings](https://docs.tabnine.com/main/getting-started/tabnine-agent/agent-settings) - Tool Permissions and auto-approval modes
- [Inquirer.js GitHub](https://github.com/SBoudrias/Inquirer.js) - Confirmed modern API and migration path
- [prompts - npm](https://www.npmjs.com/package/prompts) - Alternative prompt library research

### Secondary (MEDIUM confidence)
- [Human-in-the-Loop AI (HITL) - Complete Guide 2026](https://parseur.com/blog/human-in-the-loop-ai) - HITL workflow patterns
- [Human in the loop automation](https://blog.n8n.io/human-in-the-loop-automation/) - Practical HITL implementation patterns
- [n8n wait node](https://ryanandmattdatascience.com/n8n-wait-node/) - Pause workflow patterns
- [Top Node.js Design Patterns 2026](https://nareshit.com/blogs/top-nodejs-design-patterns-2026) - Current Node.js patterns
- [State of Web Scraping 2026](https://www.browserless.io/blog/state-of-web-scraping-2026) - Web scraping best practices
- [AI Web Scraping 2026](https://www.gptbots.ai/blog/web-scraping-ai-agents) - AI-assisted research automation
- [Retrieval-Augmented Generation (RAG) and LLMs](https://www.mdpi.com/2076-3417/16/1/368) - RAG+LLM for knowledge management
- [Autonomous Quality Gates](https://www.augmentcode.com/guides/autonomous-quality-gates-ai-powered-code-review) - AI-powered approval gates

### Tertiary (LOW confidence)
- [How To Create Interactive Command-line Prompts with Inquirer.js](https://www.digitalocean.com/community/tutorials/nodejs-interactive-command-line-prompts) - Tutorial on CLI prompts (not applicable due to Tabnine constraint)
- [Document Generation Software 2026](https://www.capterra.com/document-generation-software/) - Commercial document generation tools

## Metadata

**Confidence breakdown:**
- Tabnine capabilities: MEDIUM - Official docs verified, but interactive capabilities partially documented
- Approval gate architecture: HIGH - Clear pattern: use Tabnine native UI, log decisions to STATE.md
- Research synthesis: MEDIUM - Standard patterns identified, but implementation details need validation
- Document templates: MEDIUM - Structure clear from markdown research, but specific section needs emerge during execution
- Web search integration: LOW - Tabnine capabilities unclear, may need custom implementation

**Research date:** 2026-01-18
**Valid until:** 2026-02-17 (30 days - relatively stable domain)

**Key architectural insight:** The most important finding is that **Tabnine Agent already provides interactive approval gates**. This fundamentally changes the implementation strategy from "build CLI prompts" to "prepare approval payloads and log decisions." This constraint actually simplifies implementation and improves UX by working with the platform rather than against it.
