# Technology Stack

**Project:** GSD for Tabnine
**Domain:** AI Agent Workflow Guidance System
**Researched:** 2026-01-18

## Executive Summary

Building a modular AI agent workflow framework requires lightweight, reliable Node.js tools for file operations, state management, and markdown processing. The stack prioritizes **native Node.js APIs** over heavy frameworks, with strategic use of battle-tested libraries for gaps in the standard library. All recommendations target **Node.js 24.x LTS (Krypton)** with **ESM modules** as the standard.

**Key Philosophy:** Use Node.js built-ins first, add minimal dependencies only when they provide clear value over native implementations.

---

## Recommended Stack

### Core Runtime

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Node.js** | 24.x LTS (Krypton) | Runtime environment | Current Active LTS with support until April 2028. Node 24 includes native ESM improvements and built-in utilities like `util.parseArgs()` |
| **ESM** | Native (ES Modules) | Module system | Industry standard for 2026. ESM is required for modern tooling, tree-shaking, and future compatibility. Use `"type": "module"` in package.json |

**Confidence:** HIGH (Official Node.js documentation)

**Rationale:** Node.js 24.x is the current Active LTS release, providing the longest support timeline. ESM is the default direction for the ecosystem, with frameworks and packages standardizing on ESM-first development.

---

### File System Operations

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **fs/promises** | Native (Node.js) | Primary file I/O API | Promise-based API is the current Node.js recommendation. Provides async/await syntax with good performance |
| **path** | Native (Node.js) | Path manipulation | Standard library for cross-platform path operations. Use `path.posix` for any URL manipulation to avoid Windows separator issues |
| **fs-extra** | 11.3.3 | Convenience methods | Adds critical utilities missing from native fs: `copy()`, `move()`, `ensureDir()`, `outputJson()`, `emptyDir()`. Drop-in replacement for fs/promises |

**Confidence:** HIGH (Node.js official docs, npm package registry)

**When to use each:**
- **Use `fs/promises` for:** Basic read/write/stat/mkdir/readdir operations
- **Use `fs-extra` for:** Copying directory trees, ensuring directories exist, JSON file operations, moving files
- **Avoid:** Synchronous fs methods (except for initialization code that runs before event loop starts)

**Installation:**
```bash
npm install fs-extra
```

**Example pattern:**
```javascript
import fs from 'node:fs/promises';
import fse from 'fs-extra';

// Basic operations: use native
const content = await fs.readFile('file.md', 'utf8');
await fs.writeFile('output.md', content);

// Complex operations: use fs-extra
await fse.copy('templates/', '.planning/templates/');
await fse.ensureDir('.planning/research');
await fse.outputJson('STATE.md.json', stateData, { spaces: 2 });
```

---

### Pattern Matching (File Discovery)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **fast-glob** | 3.3.3 | File pattern matching | Fastest glob implementation for Node.js. Provides sync, async, and stream APIs. Better performance than `glob` for large file trees (10-20% faster for 200k+ files) |

**Confidence:** HIGH (npm registry, performance comparisons)

**Alternatives considered:**
- **glob** (11.x): More correct Bash-compatible implementation, but slower. Choose if you need exact Bash glob semantics
- **globby**: Wrapper around fast-glob with .gitignore support. Unnecessary complexity for this use case
- **minimatch**: Pattern matching only (no file system access). Use for string matching, not file discovery

**Why fast-glob:** Speed matters when scanning project files for context loading. fast-glob's performance advantage (10-20% faster) compounds in AI agent workflows where file discovery happens repeatedly. The API is simpler than alternatives, and it handles edge cases well.

**Installation:**
```bash
npm install fast-glob
```

**Example usage:**
```javascript
import fg from 'fast-glob';

// Find all markdown guidelines
const guidelines = await fg(['guidelines/**/*.md'], {
  cwd: process.cwd(),
  absolute: true
});

// Find templates excluding node_modules
const templates = await fg(['templates/**/*'], {
  ignore: ['**/node_modules/**'],
  dot: false
});
```

---

### Markdown Processing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **marked** | 17.x | Markdown parsing | Fastest markdown parser. Light-weight, implements all CommonMark features, works in Node.js and browsers. Used by 10,425+ npm packages |
| **gray-matter** | 4.0.3 | Front-matter extraction | Battle-tested YAML/JSON/TOML front-matter parser. Used by Gatsby, Astro, Netlify, and 2,458+ packages. Parses metadata from markdown files |

**Confidence:** HIGH (npm registry, widespread adoption)

**Alternatives considered:**
- **markdown-it**: More extensible with plugins, but heavier and slower. Overkill for reading/parsing guidelines
- **remark**: Full unified ecosystem. Too complex for simple markdown parsing needs
- **showdown**: Bidirectional (MD ↔ HTML), but older API and less maintained

**Why marked + gray-matter:** This combination is the standard for parsing markdown files with metadata. Marked handles content conversion, gray-matter extracts front-matter. Both are lightweight, fast, and widely adopted.

**Installation:**
```bash
npm install marked gray-matter
```

**Example usage:**
```javascript
import { marked } from 'marked';
import matter from 'gray-matter';

// Parse markdown with front-matter
const fileContent = await fs.readFile('guideline.md', 'utf8');
const { data, content } = matter(fileContent);

// data = YAML front-matter object
// content = markdown content without front-matter

// Convert markdown to HTML (if needed)
const html = marked.parse(content);

// Or just work with markdown directly (for AI context)
console.log(content);
```

---

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Native JSON** | Built-in | State serialization | Native `JSON.parse()` and `JSON.stringify()` are sufficient for STATE.md persistence. No library needed |
| **Ajv** | 8.x | JSON Schema validation | Fastest and most compliant JSON Schema validator. Validates state structure before persisting. Supports draft 2019-09 and 2020-12 |

**Confidence:** HIGH (Native feature, npm registry)

**Alternatives considered:**
- **Zod**: TypeScript-first schema validation. Better DX with TypeScript, but requires TypeScript and adds runtime overhead
- **jsonschema**: Simpler API but slower performance
- **joi**: More ergonomic API but significantly slower than Ajv

**Why Ajv:** JSON Schema is the standard for validating JSON data structures. Ajv is the fastest validator (generates optimized validation functions) and supports all modern JSON Schema specs. Critical for validating STATE.md structure before file writes to prevent corruption.

**Installation:**
```bash
npm install ajv
```

**Example usage:**
```javascript
import Ajv from 'ajv';
import fs from 'node:fs/promises';

const ajv = new Ajv();

// Define state schema
const stateSchema = {
  type: 'object',
  required: ['currentPhase', 'milestones'],
  properties: {
    currentPhase: { type: 'string' },
    milestones: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'status'],
        properties: {
          id: { type: 'string' },
          status: { enum: ['not_started', 'in_progress', 'complete'] }
        }
      }
    }
  }
};

const validate = ajv.compile(stateSchema);

// Read and validate state
async function loadState() {
  const raw = await fs.readFile('.planning/STATE.md.json', 'utf8');
  const state = JSON.parse(raw);

  if (!validate(state)) {
    throw new Error(`Invalid state: ${JSON.stringify(validate.errors)}`);
  }

  return state;
}

// Validate and persist state
async function saveState(state) {
  if (!validate(state)) {
    throw new Error(`Invalid state: ${JSON.stringify(validate.errors)}`);
  }

  await fs.writeFile('.planning/STATE.md.json', JSON.stringify(state, null, 2));
}
```

---

### Command-Line Interface

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **util.parseArgs()** | Native (Node.js 18.3+) | Argument parsing | Built-in Node.js utility for parsing CLI arguments. Sufficient for simple scripts. No external dependency |
| **commander** | 12.x | Complex CLI (if needed) | Industry standard for building complex CLIs with subcommands. Use only if scripts need multi-level command structure |

**Confidence:** HIGH (Node.js official docs)

**When to use each:**
- **util.parseArgs()**: Simple scripts with flags/options (most GSD scripts)
- **commander**: Complex multi-command CLIs (unlikely needed for this project)
- **Avoid yargs**: More features but heavier than commander

**Why util.parseArgs():** Node.js 18+ includes native argument parsing, eliminating the need for external libraries in most cases. This keeps scripts lightweight and reduces dependencies. Reserve commander for genuinely complex CLIs with subcommands, help generation, and validation.

**Example usage:**
```javascript
import { parseArgs } from 'node:util';

// Simple flag-based script
const { values, positionals } = parseArgs({
  options: {
    force: { type: 'boolean', short: 'f' },
    phase: { type: 'string', short: 'p' },
    help: { type: 'boolean', short: 'h' }
  },
  allowPositionals: true
});

if (values.help) {
  console.log('Usage: node script.js [--force] [--phase=<name>] <file>');
  process.exit(0);
}

const targetFile = positionals[0];
console.log({ force: values.force, phase: values.phase, targetFile });
```

---

### Template Generation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Template Literals** | Native (ES6+) | String interpolation | Native JavaScript template literals are sufficient for generating markdown templates. No library needed |
| **(Optional) Handlebars** | 4.7.x | Complex templates | Only if templates need conditionals, loops, or helpers. Avoid unless absolutely necessary |

**Confidence:** HIGH (Native ES6 feature)

**Why template literals:** Native template literals handle 90% of template generation needs. They're fast, readable, and don't require dependencies. The pattern of reading template files and using template literals for variable substitution is simpler than learning a template engine.

**Anti-pattern:** Don't use template engines (Mustache, Handlebars, EJS) unless templates need significant logic. Template literals are faster, simpler, and more maintainable.

**Example pattern:**
```javascript
// templates/PROJECT.md.tmpl is a plain markdown file with placeholder variables

import fs from 'node:fs/promises';

async function generateFromTemplate(templatePath, variables) {
  const template = await fs.readFile(templatePath, 'utf8');

  // Use Function constructor to evaluate template with variables
  const generator = new Function(...Object.keys(variables), `return \`${template}\`;`);
  return generator(...Object.values(variables));
}

// Usage
const projectMd = await generateFromTemplate('templates/PROJECT.md.tmpl', {
  projectName: 'My Project',
  description: 'A project description',
  date: new Date().toISOString()
});

await fs.writeFile('PROJECT.md', projectMd);
```

**Alternative simple pattern (for basic templates):**
```javascript
// Just use string replacement for very simple templates
const template = await fs.readFile('template.md', 'utf8');
const output = template
  .replace(/{{projectName}}/g, 'My Project')
  .replace(/{{date}}/g, new Date().toISOString());
```

---

### Testing (Optional but Recommended)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vitest** | 2.x | Test runner | Fastest modern test runner. 10-20x faster than Jest in watch mode. ESM-native, TypeScript support out of the box. Drop-in Jest replacement |

**Confidence:** HIGH (Ecosystem momentum, performance benchmarks)

**Why Vitest over Jest:** Vitest is the 2026 standard for new Node.js projects. It's faster (30-70% faster in CI), has better ESM support (Jest's ESM support is still experimental), and offers a better developer experience with hot module reloading in watch mode. API is Jest-compatible, making migration trivial.

**Installation:**
```bash
npm install -D vitest
```

**Example test:**
```javascript
// scripts/__tests__/state-manager.test.js
import { describe, it, expect } from 'vitest';
import { loadState, saveState } from '../state-manager.js';

describe('State Manager', () => {
  it('should load and parse valid state', async () => {
    const state = await loadState('.planning/STATE.md.json');
    expect(state).toHaveProperty('currentPhase');
    expect(state.milestones).toBeInstanceOf(Array);
  });

  it('should reject invalid state structure', async () => {
    await expect(saveState({ invalid: 'structure' }))
      .rejects.toThrow('Invalid state');
  });
});
```

**package.json scripts:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

---

## Supporting Libraries (Use Sparingly)

### Optional Utilities

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **yaml** | 2.x | YAML parsing | Only if you need to read/write YAML files (not just front-matter). gray-matter handles front-matter YAML already |
| **chalk** | 5.x | Terminal colors | Only for complex CLI scripts with colored output. Avoid for simple scripts |
| **dotenv** | 16.x | Environment variables | Only if scripts need config from .env files. Avoid over-configuration |

**Confidence:** MEDIUM (Use case dependent)

**Anti-pattern:** Don't install these preemptively. Add them only when a specific need arises. Most GSD scripts should work without colored output or complex configuration.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Runtime | Node.js 24 LTS | Deno, Bun | Tabnine agent mode runs Node.js. Compatibility matters more than cutting-edge features |
| Module System | ESM | CommonJS | ESM is the 2026 standard. CJS is legacy |
| File Operations | fs/promises + fs-extra | fs with callbacks | Promises provide better async/await ergonomics |
| Glob Matching | fast-glob | glob, globby | fast-glob is faster and simpler for our use case |
| Markdown Parser | marked | markdown-it, remark | marked is faster and lighter. We don't need plugin ecosystem |
| Front-matter | gray-matter | remark-frontmatter | gray-matter is simpler and doesn't require unified/remark ecosystem |
| JSON Validation | Ajv | Zod, joi | Ajv is fastest and uses standard JSON Schema format |
| CLI Parsing | util.parseArgs() | commander, yargs | Native solution is sufficient for simple scripts |
| Templates | Template literals | Handlebars, Mustache | Native solution is faster and simpler |
| Testing | Vitest | Jest, Mocha | Vitest is faster and ESM-native |

---

## Installation Commands

### Minimal Stack (Required)
```bash
# Core dependencies
npm install fs-extra fast-glob marked gray-matter ajv

# TypeScript types (if using TypeScript)
npm install -D @types/node @types/fs-extra
```

### Full Stack (with Testing)
```bash
# Core dependencies
npm install fs-extra fast-glob marked gray-matter ajv

# Development dependencies
npm install -D vitest

# TypeScript types (if using TypeScript)
npm install -D @types/node @types/fs-extra
```

### Optional Additions (Add as Needed)
```bash
# Only if you need YAML file parsing beyond front-matter
npm install yaml

# Only if you need complex CLI with subcommands
npm install commander

# Only if you need colored terminal output
npm install chalk

# Only if you need .env file support
npm install dotenv
```

---

## Package.json Configuration

### ESM Configuration
```json
{
  "name": "gsd-for-tabnine",
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": ">=24.0.0"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "gsd:init": "node scripts/init.js",
    "gsd:new-milestone": "node scripts/new-milestone.js",
    "gsd:update-state": "node scripts/update-state.js"
  },
  "dependencies": {
    "ajv": "^8.12.0",
    "fast-glob": "^3.3.3",
    "fs-extra": "^11.3.3",
    "gray-matter": "^4.0.3",
    "marked": "^17.0.0"
  },
  "devDependencies": {
    "vitest": "^2.0.0"
  }
}
```

---

## Anti-Patterns to Avoid

### 1. Heavy Framework Dependencies
**Anti-pattern:** Installing full-featured frameworks (Express, Fastify) for simple file operations
**Why bad:** Adds unnecessary weight and complexity. GSD scripts are simple file operations, not web servers
**Instead:** Use native Node.js APIs and minimal libraries

### 2. Blocking the Event Loop
**Anti-pattern:** Using synchronous fs methods (fs.readFileSync, fs.writeFileSync) after initialization
**Why bad:** Blocks event loop, hurts performance if multiple operations run
**Instead:** Use fs/promises async methods with await
**Exception:** Synchronous methods are acceptable during initial script setup (before event loop starts)

### 3. Callback Hell
**Anti-pattern:** Nesting callbacks instead of using async/await
```javascript
// BAD
fs.readFile('file1.md', (err, data1) => {
  fs.readFile('file2.md', (err, data2) => {
    fs.writeFile('output.md', data1 + data2, (err) => {
      console.log('Done');
    });
  });
});
```
**Instead:** Use async/await
```javascript
// GOOD
const data1 = await fs.readFile('file1.md', 'utf8');
const data2 = await fs.readFile('file2.md', 'utf8');
await fs.writeFile('output.md', data1 + data2);
console.log('Done');
```

### 4. Mixing Path and URL Manipulation
**Anti-pattern:** Using `path.join()` for URLs
**Why bad:** Windows uses backslashes, breaking URLs (`https://example.com\api\v2`)
**Instead:** Use `path.posix` for URLs or native URL APIs
```javascript
// BAD (breaks on Windows)
const url = path.join('https://example.com', 'api', 'v2');

// GOOD
const url = path.posix.join('https://example.com', 'api', 'v2');
// Or better: use URL API
const url = new URL('/api/v2', 'https://example.com').href;
```

### 5. Hardcoding Paths
**Anti-pattern:** Using absolute paths or assuming Unix path separators
```javascript
// BAD
const filePath = '/Users/username/project/file.md'; // Unix only
const filePath2 = 'src\\utils\\helper.js'; // Windows only
```
**Instead:** Use path.join() and process.cwd()
```javascript
// GOOD
import path from 'node:path';
const filePath = path.join(process.cwd(), 'src', 'utils', 'helper.js');
```

### 6. Not Validating State Before Persistence
**Anti-pattern:** Blindly writing JSON without schema validation
**Why bad:** Corrupted state files break the entire workflow
**Instead:** Always validate with Ajv before writing STATE.md.json

### 7. Over-Engineering Templates
**Anti-pattern:** Using complex template engines (Handlebars, EJS) for simple variable substitution
**Why bad:** Adds dependency, slows down template rendering, harder to maintain
**Instead:** Use native template literals for simple cases

### 8. Installing Packages Without Need
**Anti-pattern:** Installing lodash, moment.js, or other utility libraries "just in case"
**Why bad:** Increases bundle size, adds attack surface, slows npm install
**Instead:** Use native JavaScript methods. Modern JS has Array methods, Date methods, etc.

### 9. Ignoring Error Handling
**Anti-pattern:** Not catching file operation errors
```javascript
// BAD
const data = await fs.readFile('might-not-exist.md', 'utf8');
```
**Instead:** Wrap in try/catch
```javascript
// GOOD
try {
  const data = await fs.readFile('might-not-exist.md', 'utf8');
} catch (err) {
  if (err.code === 'ENOENT') {
    console.error('File not found:', err.path);
  } else {
    throw err;
  }
}
```

### 10. Using Anonymous Functions in Production
**Anti-pattern:** Anonymous arrow functions everywhere
**Why bad:** Makes stack traces harder to debug in production
**Instead:** Use named functions for better profiling
```javascript
// BAD
const middleware = (req, res, next) => { /* ... */ };

// GOOD
function validateRequest(req, res, next) { /* ... */ }
```

---

## File Structure Pattern

Recommended directory structure for Node.js scripts:

```
/
├── scripts/
│   ├── init.js              # Initialize GSD in project
│   ├── new-milestone.js     # Create new milestone
│   ├── update-state.js      # Update STATE.md
│   ├── lib/
│   │   ├── state-manager.js # State persistence utilities
│   │   ├── file-ops.js      # Common file operations
│   │   └── template-gen.js  # Template generation utilities
│   └── __tests__/
│       ├── state-manager.test.js
│       └── template-gen.test.js
├── templates/               # Markdown templates
│   ├── PROJECT.md.tmpl
│   ├── ROADMAP.md.tmpl
│   └── MILESTONE.md.tmpl
├── guidelines/              # AI-readable guidelines
│   ├── core/
│   │   ├── workflow.md
│   │   └── principles.md
│   └── phases/
│       ├── research.md
│       └── implementation.md
├── package.json
└── .planning/               # Created during init
    ├── STATE.md.json
    ├── research/
    ├── templates/           # Copied from /templates
    └── archive/
```

---

## Markdown Conventions for AI Agents

### AGENTS.md Standard
The [AGENTS.md specification](https://agents.md) is the emerging standard for AI agent instructions. Place an AGENTS.md file at project root with:

- **Dev environment tips**: Setup and tooling
- **Testing instructions**: How to run tests
- **PR instructions**: Contribution guidelines
- **Build steps**: How to build/run the project

**Format:** Plain markdown, no strict template. Keep it concise and actionable.

### Modular Guidelines
AI agents with smaller context windows need modular loading. Structure guidelines as:

1. **Core guidelines** (always loaded): `guidelines/core/workflow.md`
2. **Phase-specific guidelines** (loaded on demand): `guidelines/phases/research.md`
3. **Cross-references**: Use markdown links between guidelines

**Pattern:**
```markdown
# Research Phase Guidelines

For general workflow context, see [Core Workflow](../core/workflow.md).

## This Phase

[Phase-specific content]

## Next Steps

After research completes, proceed to [Implementation Phase](./implementation.md).
```

### Front-Matter Convention
Use YAML front-matter for metadata:

```markdown
---
phase: research
priority: high
dependencies: [core-workflow]
---

# Research Phase Guidelines

[Content]
```

This enables scripts to parse metadata and make decisions (e.g., "load all guidelines with priority: high").

---

## Confidence Assessment

| Area | Confidence | Source | Notes |
|------|------------|--------|-------|
| Node.js 24 LTS | HIGH | Official Node.js docs | Current Active LTS, supported until April 2028 |
| ESM Recommendation | HIGH | Ecosystem adoption, official docs | Industry standard for 2026 |
| fs/promises | HIGH | Node.js v25.3.0 documentation | Official recommendation over callbacks |
| fs-extra | HIGH | npm registry (11.3.3, published 1 month ago) | Actively maintained, 77,203 dependents |
| fast-glob | HIGH | npm registry (3.3.3), performance comparisons | 10-20% faster than glob, widely adopted |
| marked | HIGH | npm registry (17.0.1, published 2 months ago) | 10,425+ dependents, actively maintained |
| gray-matter | MEDIUM | npm registry (4.0.3, published 5 years ago) | Stable but not recently updated. Still widely used (2,458 dependents) |
| Ajv | HIGH | npm registry, JSON Schema official docs | Most performant validator, 50M+ weekly downloads |
| Vitest | HIGH | Ecosystem adoption, performance data | Clear 2026 winner over Jest for new projects |
| AGENTS.md | MEDIUM | Linux Foundation adoption, 60k repos | Emerging standard, not yet universal |

---

## Version Update Strategy

**Check for updates:**
```bash
npm outdated
```

**Update dependencies:**
```bash
# Update to latest compatible versions
npm update

# Update to latest major versions (breaking changes possible)
npm install fs-extra@latest fast-glob@latest marked@latest gray-matter@latest ajv@latest
```

**Version pinning strategy:**
- **Caret ranges** (^11.2.0): Allow minor and patch updates
- **Exact versions** (11.2.0): Lock to specific version (not recommended unless stability issues)
- **Recommended:** Use caret ranges for flexibility while avoiding breaking changes

---

## Sources

### Official Documentation
- [Node.js v25.3.0 Documentation](https://nodejs.org/api/fs.html) - File System API
- [Node.js Releases](https://nodejs.org/en/about/previous-releases) - LTS release schedule
- [Node.js ESM Documentation](https://nodejs.org/api/esm.html) - ES Modules guide

### Package Registries and Repositories
- [fs-extra on npm](https://www.npmjs.com/package/fs-extra) - Version 11.3.3
- [fast-glob on GitHub](https://github.com/mrmlnc/fast-glob) - Performance comparisons
- [marked on npm](https://www.npmjs.com/package/marked) - Version 17.0.1
- [gray-matter on GitHub](https://github.com/jonschlinkert/gray-matter) - YAML front-matter parser
- [Ajv JSON Schema Validator](https://ajv.js.org/) - Official documentation
- [Vitest Documentation](https://vitest.dev/) - Modern testing framework

### Best Practices and Comparisons
- [Reading and Writing Files in Node.js - Node.js Design Patterns](https://nodejsdesignpatterns.com/blog/reading-writing-files-nodejs/) - File operations best practices
- [Building Modern Web Applications: Node.js 2026 Best Practices](https://www.technology.org/2025/12/22/building-modern-web-applications-node-js-innovations-and-best-practices-for-2026/) - ESM vs CommonJS
- [CommonJS vs. ESM in Node.js](https://betterstack.com/community/guides/scaling-nodejs/commonjs-vs-esm/) - Module system comparison
- [Vitest vs Jest 30: 2026 Browser-Native Testing](https://dev.to/dataformathub/vitest-vs-jest-30-why-2026-is-the-year-of-browser-native-testing-2fgb) - Testing framework comparison
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices) - Comprehensive best practices list
- [Patterns and Anti-patterns in Node.js - AppSignal Blog](https://blog.appsignal.com/2022/02/23/patterns-and-anti-patterns-in-nodejs.html)

### Standards and Specifications
- [AGENTS.md Specification](https://agents.md) - AI agent instruction standard
- [AGENTS.md GitHub Repository](https://github.com/agentsmd/agents.md) - Official spec repo
- [JSON Schema](https://json-schema.org/blog/posts/get-started-with-json-schema-in-node-js) - Validation standard

### Ecosystem Analysis
- [Understanding glob patterns in Node.js - LogRocket](https://blog.logrocket.com/understanding-using-globs-node-js/) - Glob pattern usage
- [File processing in Node.js - LogRocket](https://blog.logrocket.com/file-processing-node-js-comprehensive-guide/) - Comprehensive file operations guide
- [Top JavaScript Markdown Libraries](https://byby.dev/js-markdown-libs) - Markdown parser comparison

---

## Open Questions

1. **TypeScript adoption:** Should scripts use TypeScript or plain JavaScript?
   - **Lean toward JavaScript** for simplicity unless type safety becomes critical
   - TypeScript adds build step and complexity
   - Decision: Start with JavaScript, migrate to TypeScript if scripts grow complex

2. **Error logging strategy:** Should scripts use console.error or a logging library?
   - **Lean toward console.error** for simplicity
   - Add winston/pino only if structured logging needed
   - Decision: Use console for MVP, evaluate logging library later

3. **Configuration format:** .env file, JSON, or JavaScript?
   - **Lean toward no configuration file** initially
   - Use command-line args and STATE.md.json for persistence
   - Add config file only if needed
   - Decision: Avoid configuration complexity until proven necessary

---

## Summary for Roadmap

**Recommended Phase 1 Stack (MVP):**
- Node.js 24.x LTS with ESM
- fs/promises + fs-extra for file operations
- fast-glob for file discovery
- marked + gray-matter for markdown parsing
- Native JSON for state, Ajv for validation
- util.parseArgs() for CLI
- Native template literals for templates

**Defer to Later Phases:**
- Vitest (add in Phase 2 when scripts stabilize)
- Commander (only if CLI grows complex)
- YAML library (only if needed beyond front-matter)
- Colored output (chalk) - low priority

**Anti-patterns to avoid:**
- Heavy frameworks
- Blocking operations
- Hardcoded paths
- Over-engineered templates
- Unnecessary dependencies
