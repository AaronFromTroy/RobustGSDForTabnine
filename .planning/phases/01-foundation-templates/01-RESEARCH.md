# Phase 1: Foundation & Templates - Research

**Researched:** 2026-01-18
**Domain:** Documentation architecture for AI agents, template systems, version metadata
**Confidence:** HIGH

## Summary

Phase 1 establishes guideline and template infrastructure for Tabnine agent workflows. Research focused on three domains: (1) writing unambiguous instructions for AI agents, (2) markdown template systems with variable substitution, and (3) version metadata patterns for documentation files.

The standard approach is AGENTS.md-style structured markdown with YAML frontmatter for metadata, JavaScript template literals for variable substitution, and explicit command examples. Guidelines should follow six core areas (commands, testing, project structure, code style, git workflow, boundaries) with affirmative phrasing and concrete examples.

Key finding: Ambiguous instructions are the #1 cause of agent failure. Success requires unique conditions, business-meaning descriptions (not technical implementation), affirmative phrasing ("do X" not "don't do Y"), and concrete examples.

**Primary recommendation:** Use structured markdown with YAML frontmatter for all guidelines/templates, JavaScript template literals for variable substitution (no external templating library needed), and explicit command examples in backticks.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| JavaScript template literals | ES6+ | Variable substitution in templates | Built into Node.js, no dependencies, simple `${var}` syntax |
| YAML frontmatter | N/A | Version metadata in markdown | Industry standard (Jekyll, Hugo, GitHub), human-readable |
| JSON Schema | Draft 2020-12 | Config file validation | Official standard, VS Code integration, clear validation errors |
| gray-matter | ^4.0.3 | Parse YAML frontmatter | De facto standard for frontmatter parsing in Node.js |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| marked | ^11.0.0 | Markdown parsing | If you need to process markdown programmatically (optional) |
| ajv | ^8.12.0 | JSON Schema validation | For validating .gsd-config.json against schema |
| fs-extra | ^11.2.0 | Enhanced file operations | Atomic writes, directory creation with mkdirp |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Template literals | Handlebars/Mustache | External library adds complexity; Handlebars is faster but requires compilation. Use only if logic (conditionals, loops) needed in templates. |
| YAML frontmatter | JSON frontmatter | JSON less human-readable; YAML is industry standard for markdown metadata |
| JSON Schema | Custom validation | Reinventing wheel; JSON Schema has editor integration and standard error formats |

**Installation:**
```bash
npm install gray-matter ajv fs-extra
# marked is optional - only if processing markdown programmatically
```

## Architecture Patterns

### Recommended Project Structure
```
gsd/
├── guidelines/           # Workflow instruction files
│   ├── new-project.md
│   ├── plan-phase.md
│   ├── execute-phase.md
│   └── verify-work.md
├── templates/            # Artifact templates
│   ├── PROJECT.md
│   ├── ROADMAP.md
│   ├── PLAN.md
│   ├── REQUIREMENTS.md
│   └── STATE.md
├── scripts/              # Node.js helpers (Phase 2)
│   └── (state-manager.js, etc.)
├── .gsd-config.json      # Configuration
└── README.md             # Installation guide
```

### Pattern 1: YAML Frontmatter for Metadata
**What:** YAML block at file start delimited by `---` containing metadata
**When to use:** All guidelines and templates for version tracking, validation schemas
**Example:**
```markdown
---
version: "1.0.0"
type: "guideline"
workflow: "new-project"
last_updated: "2026-01-18"
schema: "gsd-guideline-v1"
---

# New Project Workflow

[Content follows...]
```
**Source:** [GitHub YAML Frontmatter Docs](https://docs.github.com/en/contributing/writing-for-github-docs/using-yaml-frontmatter)

### Pattern 2: Structured Sections for Agent Instructions
**What:** Six core areas with clear headings and bullet lists
**When to use:** All workflow guideline files
**Example:**
```markdown
## Commands

Execute these exact commands:
- `node gsd/scripts/state-manager.js --update phase=1`
- `git add .planning/`
- `git commit -m "docs(phase-1): complete foundation"`

## Boundaries

✅ **Always do:**
- Validate artifacts before marking phase complete
- Update STATE.md after each step

⚠️ **Ask first:**
- Changing workflow structure
- Adding new guideline files

🚫 **Never do:**
- Skip validation steps
- Modify .gsd-config.json without user approval
```
**Source:** [GitHub Blog: How to write a great agents.md](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)

### Pattern 3: Template Literals for Variable Substitution
**What:** JavaScript template strings using `${expression}` syntax
**When to use:** Template rendering in template-renderer.js script
**Example:**
```javascript
// Template file content
const template = `# ${projectName}

**Created:** ${createdDate}
**Type:** ${projectType}

## What This Is

${description}
`;

// Substitution
const rendered = template
  .replace(/\$\{projectName\}/g, 'GSD for Tabnine')
  .replace(/\$\{createdDate\}/g, '2026-01-18')
  .replace(/\$\{projectType\}/g, 'Library')
  .replace(/\$\{description\}/g, 'A GSD workflow system...');
```
**Source:** [MDN Template Literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)

### Pattern 4: JSON Schema for Config Validation
**What:** Schema file defining structure and validation rules for .gsd-config.json
**When to use:** Config file validation during setup and resume
**Example:**
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://gsd.local/config-schema.json",
  "title": "GSD Configuration",
  "description": "Configuration for GSD workflow system",
  "type": "object",
  "required": ["version", "triggerPhrases", "paths"],
  "properties": {
    "version": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$"
    },
    "triggerPhrases": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1
    }
  }
}
```
**Source:** [JSON Schema Getting Started](https://json-schema.org/learn/getting-started-step-by-step)

### Anti-Patterns to Avoid

- **Negative instructions:** "Don't skip validation" → Use "Always validate before proceeding"
- **Vague personas:** "You are a helpful assistant" → Use "You are a phase planner who creates PLAN.md files"
- **Ambiguous conditions:** "If data is missing" and "If data is incomplete" → Use unique, distinct conditions
- **Missing command examples:** Describing what to do → Show exact command: `node script.js --flag`
- **Technical references in instructions:** "Invoke API XYZ" → Use business meaning: "Create a case"
- **Embedding logic in instructions:** Complex conditionals → Use deterministic scripts/Actions
- **Inconsistent terminology:** Mixing "case" and "ticket" → Pick one term and use consistently

**Source:** [Elements.cloud: Agent Instruction Patterns and Antipatterns](https://elements.cloud/blog/agent-instruction-patterns-and-antipatterns-how-to-build-smarter-agents/)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom regex parser | gray-matter | Handles edge cases (escaped delimiters, nested objects, arrays), validates YAML syntax |
| JSON validation | Manual if/else checks | ajv (JSON Schema) | Standard error formats, recursive validation, reusable schemas, editor integration |
| Template rendering | String concatenation | Template literals | Built-in, cleaner syntax, easier to read/maintain, supports expressions |
| File atomic writes | fs.writeFile directly | fs-extra with write-then-rename | Prevents corruption on crashes, handles permissions, creates directories |
| Cross-platform paths | String manipulation with '/' or '\\' | Node.js path module | Handles Windows vs Unix separators, normalizes paths, resolves relative paths |

**Key insight:** Documentation for AI agents has specific edge cases around ambiguity, terminology consistency, and instruction clarity that aren't obvious until agents misinterpret instructions. Use established patterns from AGENTS.md ecosystem rather than inventing ad-hoc structures.

## Common Pitfalls

### Pitfall 1: Ambiguous or Duplicate Instructions
**What goes wrong:** Agent receives semantically similar instructions ("if data is missing" and "if data is incomplete") and makes inconsistent choices or asks for clarification repeatedly.
**Why it happens:** Natural language has synonyms; what's obvious to humans creates ambiguity for agents.
**How to avoid:** Each instruction should represent a unique, verifiable condition. Use precise terms and define them once.
**Warning signs:** Agent asks "which do you mean?" or applies different logic each time; users report inconsistent behavior.

### Pitfall 2: Negative Phrasing in Instructions
**What goes wrong:** Instructions like "Do not send email if X" confuse agents because they focus on what NOT to do rather than the action to take.
**Why it happens:** Humans think in constraints; agents reason better about positive actions.
**How to avoid:** Rephrase as affirmative: "Send email only if Y" where Y is the opposite of X.
**Warning signs:** Agent misses edge cases; behavior is opposite of intended.

### Pitfall 3: Missing Command Examples
**What goes wrong:** Guideline says "update STATE.md" but agent guesses the syntax, leading to manual edits, wrong flags, or invoking wrong script.
**Why it happens:** Developers assume the "how" is obvious; agents need exact syntax.
**How to avoid:** Wrap all commands in backticks: `node gsd/scripts/state-manager.js --update phase=1`
**Warning signs:** Agent asks "how do I run this?" or produces incorrect commands.

### Pitfall 4: Vague Personas or Roles
**What goes wrong:** Guideline says "You are a helpful coding assistant" and agent doesn't know its scope, boundaries, or specialization.
**Why it happens:** Generic personas from LLM examples don't provide sufficient context.
**How to avoid:** Be specific: "You are a phase planner who reads CONTEXT.md and creates PLAN.md files with tasks, success criteria, and dependencies."
**Warning signs:** Agent asks overly broad questions; tries to do things outside its role.

### Pitfall 5: Version Drift Between Files
**What goes wrong:** Guideline updated but template not updated; agent uses old template with new guidelines, producing incompatible artifacts.
**Why it happens:** No version tracking; files updated independently.
**How to avoid:** YAML frontmatter with version field in all files; validation checks version compatibility.
**Warning signs:** Artifacts missing expected sections; validation failures after "successful" execution.

### Pitfall 6: Template Variables Not Defined
**What goes wrong:** Template has `${projectType}` but rendering script doesn't provide that variable; output has literal `${projectType}` string.
**Why it happens:** Templates and rendering logic maintained separately; no schema validation.
**How to avoid:** Define template schema in frontmatter listing all required variables; validate before rendering.
**Warning signs:** Rendered output contains `${...}` literals; users report "broken templates."

### Pitfall 7: Inconsistent Terminology
**What goes wrong:** Guideline uses "case" in one section, "ticket" in another; agent treats them as different concepts.
**Why it happens:** Multiple authors or editing over time without terminology review.
**How to avoid:** Define glossary in .gsd-config.json; use consistent terms throughout all guidelines.
**Warning signs:** Agent asks "is a case the same as a ticket?"; creates duplicate tracking.

### Pitfall 8: Hidden Assumptions in Success Criteria
**What goes wrong:** Success criteria says "validation passes" but doesn't specify WHICH validations; agent guesses.
**Why it happens:** Author knows implicitly what "validation" means in context.
**How to avoid:** Explicit, enumerated criteria: "1. JSON Schema validation passes, 2. All required sections exist, 3. No template literals remain in output."
**Warning signs:** Agent marks phase complete with incomplete work; validation inconsistent.

## Code Examples

Verified patterns from official sources:

### Reading YAML Frontmatter
```javascript
// Source: https://github.com/jonschlinkert/gray-matter
import matter from 'gray-matter';
import fs from 'fs';

const fileContent = fs.readFileSync('gsd/guidelines/new-project.md', 'utf8');
const { data, content } = matter(fileContent);

console.log(data.version);        // "1.0.0"
console.log(data.workflow);       // "new-project"
console.log(content);             // Markdown content without frontmatter
```

### Validating JSON with Schema
```javascript
// Source: https://json-schema.org/learn/getting-started-step-by-step
import Ajv from 'ajv';
import fs from 'fs';

const ajv = new Ajv();
const schema = JSON.parse(fs.readFileSync('gsd/config-schema.json', 'utf8'));
const config = JSON.parse(fs.readFileSync('gsd/.gsd-config.json', 'utf8'));

const validate = ajv.compile(schema);
const valid = validate(config);

if (!valid) {
  console.error('Validation errors:', validate.errors);
}
```

### Template Rendering with Literals
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
import fs from 'fs-extra';

// Read template
const template = fs.readFileSync('gsd/templates/PROJECT.md', 'utf8');

// Extract variables from frontmatter
const { data: meta, content: templateBody } = matter(template);
const requiredVars = meta.variables || [];

// Simple substitution (for templates without complex logic)
function renderTemplate(template, variables) {
  return template.replace(/\$\{(\w+)\}/g, (match, varName) => {
    if (!(varName in variables)) {
      throw new Error(`Missing required variable: ${varName}`);
    }
    return variables[varName];
  });
}

// Render
const output = renderTemplate(templateBody, {
  projectName: 'My Project',
  createdDate: new Date().toISOString().split('T')[0],
  description: 'A sample project'
});

fs.writeFileSync('.planning/PROJECT.md', output);
```

### Atomic File Writes
```javascript
// Source: https://www.npmjs.com/package/fs-extra
import fs from 'fs-extra';
import path from 'path';

async function atomicWrite(filePath, content) {
  const dir = path.dirname(filePath);
  await fs.ensureDir(dir);  // Create directory if it doesn't exist

  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, content, 'utf8');
  await fs.rename(tempPath, filePath);  // Atomic operation
}

// Usage
await atomicWrite('.planning/STATE.md', JSON.stringify(state, null, 2));
```

### Cross-Platform Path Handling
```javascript
// Source: Node.js path module documentation
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Build paths (works on Windows and Unix)
const guidelinePath = path.join(__dirname, '..', 'guidelines', 'new-project.md');
const templatePath = path.join(__dirname, '..', 'templates', 'PROJECT.md');

// Normalize paths (handles mixed separators)
const normalized = path.normalize(guidelinePath);

// Always use path.join or path.resolve, NEVER string concatenation
// ❌ const bad = dir + '/' + file;
// ✅ const good = path.join(dir, file);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| README-only docs | README + AGENTS.md | 2024-2025 | Separate human docs from agent instructions; agents get predictable structure |
| Handlebars/Mustache | Native template literals | ES6 (2015) | Simpler for basic substitution; use templating library only if logic needed |
| Manual JSON validation | JSON Schema | ~2010, adopted widely 2020+ | Editor integration, standard errors, reusable schemas |
| Markdown without metadata | YAML frontmatter | Jekyll (2008), widespread by 2015 | Version tracking, schema references, validation support |
| Exploratory instructions | Prescriptive patterns | 2025-2026 (agentic AI boom) | Agents need "do X" not "consider X or Y"; reduces hallucination |

**Deprecated/outdated:**
- **Embedding all instructions in single file:** Exceeds context limits for smaller agents like Tabnine; use modular guidelines loaded on-demand
- **Slash command references:** Tabnine doesn't support custom commands; use phrase triggers instead
- **Parallel agent patterns:** Tabnine can't spawn sub-agents; adapt to sequential execution
- **Vague success criteria:** Modern agent workflows require explicit, enumerated validation steps

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal guideline file size**
   - What we know: AGENTS.md best practice is ≤150 lines for performance
   - What's unclear: Whether this applies to Tabnine's context window specifically
   - Recommendation: Start with ≤150 lines per guideline; measure performance during Phase 3 validation; split if context issues arise

2. **Template literal escaping edge cases**
   - What we know: Template literals use `${var}` syntax which conflicts if templates need to show literal `${...}`
   - What's unclear: Best approach for templates that document template syntax itself
   - Recommendation: Use `\${var}` escaping in template files; document this in template authoring guide

3. **Version compatibility checking**
   - What we know: YAML frontmatter should contain version field
   - What's unclear: Schema for version compatibility (e.g., guideline v1.2 requires template v1.x)
   - Recommendation: Use semantic versioning; validate in resume-manager.js that major versions match; defer complex dependency checking to v2

4. **Phrase trigger fuzzy matching specificity**
   - What we know: Should support variations ("start GSD", "begin GSD")
   - What's unclear: How fuzzy before false positives ("start getting stuff done" → trigger?)
   - Recommendation: Phase 1 defines exact phrases; Phase 3 implements detection; validate against false positives during testing

## Sources

### Primary (HIGH confidence)
- [GitHub Blog: How to write a great agents.md](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/) - AGENTS.md structure, six core areas, boundaries pattern
- [Elements.cloud: Agent Instruction Patterns and Antipatterns](https://elements.cloud/blog/agent-instruction-patterns-and-antipatterns-how-to-build-smarter-agents/) - Anti-patterns, affirmative phrasing, unique conditions
- [JSON Schema Getting Started](https://json-schema.org/learn/getting-started-step-by-step) - Schema structure, validation patterns
- [MDN Template Literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) - Template literal syntax and usage
- [GitHub YAML Frontmatter Docs](https://docs.github.com/en/contributing/writing-for-github-docs/using-yaml-frontmatter) - Frontmatter format and metadata

### Secondary (MEDIUM confidence)
- [Prompt Engineering Guide: LLM Agents](https://www.promptingguide.ai/research/llm-agents) - Agent instruction principles
- [DEV Community: Making docs AI-friendly](https://dev.to/lingodotdev/how-to-serve-markdown-to-ai-agents-making-your-docs-more-ai-friendly-4pdn) - Markdown best practices
- [Anthropic: Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) - Success criteria definition
- [Medium: Mustache vs Handlebars comparison](https://medium.com/@JuaniGallo/mustache-vs-handlebars-42e531eca252) - Templating library tradeoffs
- [Python Packaging Guide: README Best Practices](https://www.pyopensci.org/python-package-guide/documentation/repository-files/readme-file-best-practices.html) - Installation instruction patterns

### Tertiary (LOW confidence - for context only)
- Various WebSearch results about documentation anti-patterns and agentic AI design patterns (2025-2026)
- Community discussions on template systems and markdown metadata

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Well-established libraries (gray-matter, ajv), ES6 template literals are standard
- Architecture: HIGH - AGENTS.md is industry standard (60k+ projects), YAML frontmatter widely adopted
- Pitfalls: HIGH - Documented by leading organizations (GitHub, Anthropic, Elements.cloud) based on real usage
- Code examples: HIGH - All from official documentation or library maintainers
- Open questions: MEDIUM - Identified gaps but provided reasonable recommendations

**Research date:** 2026-01-18
**Valid until:** ~60 days (2026-03-19) - Documentation patterns are stable; AGENTS.md standard is mature; JavaScript template literals unlikely to change

**Notes for planner:**
- Phase 1 is primarily documentation/template authoring, not coding
- Focus on unambiguous language, explicit examples, version metadata
- Defer complex logic (fuzzy matching, version compatibility checks) to Phase 3
- Use existing project templates (PROJECT.md, ROADMAP.md) as examples
- Test guidelines by having someone unfamiliar read and execute them
