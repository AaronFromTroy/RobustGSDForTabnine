---
version: "1.0.0"
type: "guideline"
workflow: "research"
last_updated: "2026-01-18"
schema: "gsd-guideline-v1"
description: "Conduct research on a topic with automated web search or manual input"
---

# Research Workflow

This guideline enables Tabnine to conduct research using automated web searches or manual input, synthesize findings with confidence scoring, and generate structured research documents.

## Objective

**What this workflow accomplishes:**

1. Gather research findings on a specified topic
2. Support both automated (web search) and manual research input
3. Assign confidence levels (HIGH/MEDIUM/LOW) based on source authority
4. Generate structured research documents with source citations
5. Enable informed decision-making during project planning

## Context

**When to use this workflow:**

- During new-project workflow to research stack/features/architecture
- When exploring new technologies or patterns before implementation
- Before making architectural decisions that require evidence
- When updating existing research with new findings
- During plan-phase workflow to validate technical feasibility

**Prerequisites:**
- Project initialized with `.planning/` directory
- researcher.js and research-synthesizer.js available in gsd/scripts/
- Research topic defined (stack, features, architecture, pitfalls, or custom)

## Process

Follow these steps in sequence:

### Step 1: Define Research Scope

**Define what to research:**
- Determine research topic (e.g., "React ecosystem", "Node.js authentication patterns")
- Identify research type: STACK, FEATURES, ARCHITECTURE, PITFALLS, or CUSTOM
- List key questions to answer
- Decide research approach: automated web search, manual input, or hybrid

**Example:**
```
Topic: "Next.js 14 App Router"
Type: STACK
Questions:
- What are the core features?
- What are common pitfalls?
- What's the recommended project structure?
```

### Step 2: Gather Findings (Automated)

**If using automated research:**

Execute researcher.js to perform web searches:

```javascript
import { performResearch } from './gsd/scripts/researcher.js';

const findings = await performResearch('React ecosystem', 'STACK', {
  maxSearches: 5,
  includeOfficialDocs: true
});
```

**What happens:**
- System generates 3-5 search queries based on topic and type
- For STACK: "${topic} official documentation", "${topic} getting started", "${topic} best practices"
- For FEATURES: "${topic} features", "${topic} capabilities", "${topic} use cases"
- For ARCHITECTURE: "${topic} architecture patterns", "${topic} design patterns", "${topic} project structure"
- For PITFALLS: "${topic} common mistakes", "${topic} pitfalls", "${topic} anti-patterns"
- Extracts findings with source URLs
- Returns array of {title, content, source} objects

**Note:** Current implementation uses mock data. WebSearch integration planned for future Tabnine releases.

### Step 3: Add Manual Findings (Optional)

**If providing manual research:**

Supplement automated findings with verified information:

```javascript
import { mergeManualFindings } from './gsd/scripts/researcher.js';

const manualFindings = [
  {
    title: 'React 19 Beta Features',
    content: 'New features include: Server Actions, Asset Loading, Document Metadata...',
    source: 'https://react.dev/blog/2024/react-19',
    verifiedWithOfficial: true
  }
];

const combined = mergeManualFindings(findings, manualFindings);
```

**Manual findings structure:**
- **title**: Finding title or heading
- **content**: Summary or key points
- **source**: URL to original source
- **verifiedWithOfficial**: Set to `true` to boost confidence to MEDIUM

**Benefits:**
- Add findings from books, videos, documentation not in search results
- Include internal knowledge or team expertise
- Override automated findings with verified information (manual takes precedence in deduplication)

### Step 4: Assign Confidence Levels

System automatically assigns confidence levels to each finding:

**HIGH confidence** - Official documentation and primary sources:
- Official docs (docs.*, official, .dev domains)
- GitHub documentation (github.com/*/docs/)
- Primary source materials

**MEDIUM confidence** - Verified sources and reputable platforms:
- MDN Web Docs (developer.mozilla.org)
- Stack Overflow (stackoverflow.com)
- Manual findings with verifiedWithOfficial: true

**LOW confidence** - Blogs and unverified sources:
- Blog posts without verification
- Single-source information
- Unverified community content

**Confidence logic** is handled by assignConfidenceLevel() in research-synthesizer.js.

### Step 5: Generate Research Document

Execute appropriate document generator based on research type:

**Generate STACK.md** (Technology stack research):
```javascript
import { generateStackDocument } from './gsd/scripts/research-synthesizer.js';
await generateStackDocument(projectRoot, findings);
```

**Generate FEATURES.md** (Feature requirements research):
```javascript
import { generateFeaturesDocument } from './gsd/scripts/research-synthesizer.js';
await generateFeaturesDocument(projectRoot, findings);
```

**Generate ARCHITECTURE.md** (Architecture patterns research):
```javascript
import { generateArchitectureDocument } from './gsd/scripts/research-synthesizer.js';
await generateArchitectureDocument(projectRoot, findings);
```

**Generate PITFALLS.md** (Common pitfalls research):
```javascript
import { generatePitfallsDocument } from './gsd/scripts/research-synthesizer.js';
await generatePitfallsDocument(projectRoot, findings);
```

**Generate RESEARCH-SUMMARY.md** (Aggregated summary from all types):
```javascript
import { generateSummaryDocument } from './gsd/scripts/research-synthesizer.js';
await generateSummaryDocument(projectRoot, {
  stack: stackFindings,
  features: featureFindings,
  architecture: architectureFindings,
  pitfalls: pitfallFindings
});
```

**Document structure:**
- YAML frontmatter with metadata
- High Confidence Findings section (official sources)
- Medium Confidence Findings section (verified sources)
- Low Confidence Findings section (blogs, unverified)
- Sources section with all citations

### Step 6: Review and Iterate

**Review generated document:**
1. Open document in `.planning/` directory
2. Check each confidence section for completeness
3. Verify sources are cited correctly
4. Identify gaps or missing information

**If gaps exist:**
- Add manual findings with verifiedWithOfficial: true
- Regenerate document (merges new findings)
- Repeat until research is comprehensive

**Approval:**
- User reviews and approves research quality
- Document becomes reference for planning and implementation
- Findings inform ROADMAP.md and architectural decisions

## Success Criteria

Workflow is complete when:

- [ ] Research findings gathered (automated and/or manual)
- [ ] All findings include source URLs
- [ ] Confidence levels assigned to each finding (HIGH/MEDIUM/LOW)
- [ ] Research document generated in `.planning/` directory
- [ ] Document includes confidence sections with findings grouped appropriately
- [ ] Document includes sources section with citations
- [ ] User approves research quality and completeness

## Artifacts

**Expected outputs in `.planning/` directory:**

- **STACK.md** - Technology stack research (if researching stack)
- **FEATURES.md** - Feature requirements research (if researching features)
- **ARCHITECTURE.md** - Architecture patterns research (if researching architecture)
- **PITFALLS.md** - Common pitfalls research (if researching pitfalls)
- **RESEARCH-SUMMARY.md** - Aggregated research summary (if generating summary)

**Artifact structure:**
```markdown
---
research_type: "STACK"
topic: "React Ecosystem"
generated: "2026-01-18"
total_sources: 12
high_confidence: 5
medium_confidence: 4
low_confidence: 3
---

# Technology Stack Research: React Ecosystem

## High Confidence Findings

[Official sources and primary documentation]

## Medium Confidence Findings

[Verified sources and reputable platforms]

## Low Confidence Findings

[Blogs and unverified sources]

## Sources

- [Source 1](url)
- [Source 2](url)
```

## Integration

**How this workflow connects to others:**

1. **Called by new-project workflow:**
   - During roadmap creation phase
   - Researches stack, features, and architecture before planning
   - Results inform ROADMAP.md structure

2. **Used before plan-phase workflow:**
   - Validates technical feasibility
   - Identifies potential pitfalls
   - Informs implementation approach

3. **Feeds into approval-gate workflow:**
   - Research findings provide evidence for decisions
   - Confidence levels indicate decision certainty
   - Sources enable verification

4. **Referenced in STATE.md:**
   - Research documents tracked in Key Decisions
   - Findings inform accumulated context
   - Updates reflected in session continuity

**Data flow:**
```
User defines topic
  → researcher.js performs searches
  → research-synthesizer.js assigns confidence
  → Document generated in .planning/
  → Referenced in ROADMAP.md and STATE.md
  → Informs planning and implementation
```

## Example Usage

**Complete research workflow:**

```javascript
// 1. Define scope
const topic = 'Next.js 14 App Router';
const type = 'STACK';

// 2. Automated research
import { performResearch, mergeManualFindings } from './gsd/scripts/researcher.js';
import { generateStackDocument } from './gsd/scripts/research-synthesizer.js';

const autoFindings = await performResearch(topic, type, {
  maxSearches: 5,
  includeOfficialDocs: true
});

// 3. Add manual findings (optional)
const manualFindings = [
  {
    title: 'Next.js 14 App Router Official Docs',
    content: 'App Router is the new paradigm for building React applications with Next.js. Features: React Server Components, Streaming, Suspense...',
    source: 'https://nextjs.org/docs/app',
    verifiedWithOfficial: true
  }
];

const allFindings = mergeManualFindings(autoFindings, manualFindings);

// 4. Confidence levels assigned automatically by generateStackDocument

// 5. Generate document
const outputPath = await generateStackDocument(process.cwd(), allFindings);

console.log(`Research document generated: ${outputPath}`);

// 6. Review and approve
// User reviews .planning/STACK.md and approves for use in planning
```

## Boundaries

### Always Do

- Generate search queries appropriate to research type (STACK, FEATURES, ARCHITECTURE, PITFALLS)
- Include source URLs for all findings (automated and manual)
- Assign confidence levels based on source authority
- Group findings by confidence in generated documents
- Preserve manual findings during merge (manual takes precedence)

### Ask First

- Changing confidence level criteria (HIGH/MEDIUM/LOW thresholds)
- Adding new research types beyond STACK/FEATURES/ARCHITECTURE/PITFALLS/CUSTOM
- Modifying document template structure
- Performing research outside `.planning/` directory

### Never Do

- Generate findings without source attribution
- Skip confidence level assignment
- Overwrite manual findings with automated ones during merge
- Proceed with planning using LOW confidence findings only (require HIGH or MEDIUM)
- Modify research templates without user approval
