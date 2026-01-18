# Phase 2: Core Infrastructure - Research

**Researched:** 2026-01-18
**Domain:** Node.js scripting, file operations, child process management, ESM modules
**Confidence:** HIGH

## Summary

Phase 2 builds the Node.js scripts that enable workflow execution through atomic file operations, cross-platform child process management, and template rendering. The research reveals that:

1. **Atomic file writes** require the `write-file-atomic` library since native `fs.promises.writeFile()` is NOT atomic and can leave files corrupted on interruption
2. **Cross-platform compatibility** is achieved through the `path` module (never hardcode separators), `spawn()` for child processes (not `exec()` for security), and careful Windows path handling
3. **ESM modules** are the standard in Node.js 24 LTS with `"type": "module"` in package.json, mandatory file extensions, and `import.meta.dirname`/`import.meta.filename` replacing `__dirname`/`__filename`
4. **Template rendering** uses native JavaScript template literals with `${variable}` syntax—no external templating library needed
5. **JSON Schema validation** uses Ajv (50% faster than alternatives, 50M+ weekly downloads)

**Primary recommendation:** Use write-file-atomic for STATE.md persistence, spawn() for all child processes, ESM with explicit file extensions, and native template literals for rendering. Avoid exec() and synchronous fs operations.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| write-file-atomic | 5.x | Atomic file writes | Prevents corrupted STATE.md; temp-file-then-rename pattern; cross-platform; used by npm itself |
| ajv | 8.x | JSON Schema validation | Fastest validator (50% faster than #2); 50M+ weekly downloads; supports draft 2020-12 |
| Node.js | 24.x LTS | Runtime | Active LTS until April 2028; first-class ESM support; import.meta.dirname/filename stable |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| front-matter | 4.x | Parse YAML frontmatter from templates | Extract template metadata and variables from template files |
| chalk | 5.x (ESM) | Terminal colors for CLI output | Optional: color-code error messages and status output |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| write-file-atomic | Manual temp-file-rename | More code, harder to test, Windows edge cases |
| ajv | joi, zod | Slower (ajv is 50% faster), larger bundle size |
| Template literals | handlebars, mustache | External dependency, overkill for simple ${var} substitution |
| spawn() | exec() | exec() spawns shell (security risk with user input), buffers output (memory issues) |

**Installation:**
```bash
npm install write-file-atomic ajv front-matter
```

## Architecture Patterns

### Recommended Project Structure
```
gsd/
├── scripts/
│   ├── state-manager.js       # Atomic STATE.md read/write
│   ├── guideline-loader.js    # Load single workflow guideline
│   ├── template-renderer.js   # Populate templates with data
│   └── utils/
│       ├── file-ops.js        # Shared file operation utilities
│       └── process-runner.js  # Child process wrapper
├── templates/                  # Template files (from Phase 1)
├── guidelines/                 # Workflow guidelines (from Phase 1)
├── .gsd-config.json           # Config file
└── package.json               # "type": "module"
```

### Pattern 1: Atomic State Management
**What:** Write-then-rename pattern for STATE.md persistence
**When to use:** Any state-changing operation (phase transitions, step updates)
**Example:**
```javascript
// Source: https://github.com/npm/write-file-atomic
import { writeFile } from 'write-file-atomic';

async function updateState(stateData) {
  const stateContent = JSON.stringify(stateData, null, 2);
  const statePath = '.planning/STATE.md';

  // Atomic write: temp file → rename
  await writeFile(statePath, stateContent, 'utf8');

  // Multiple concurrent writes are automatically queued
}
```

### Pattern 2: Template Rendering with Frontmatter
**What:** Parse YAML frontmatter, extract variables, render with template literals
**When to use:** Generating artifacts from templates
**Example:**
```javascript
// Source: https://www.npmjs.com/package/front-matter
import fm from 'front-matter';
import { readFile } from 'fs/promises';

async function renderTemplate(templatePath, variables) {
  const templateContent = await readFile(templatePath, 'utf8');
  const { attributes, body } = fm(templateContent);

  // Verify all required variables present
  const requiredVars = attributes.variables || [];
  const missing = requiredVars.filter(v => !(v in variables));
  if (missing.length > 0) {
    throw new Error(`Missing template variables: ${missing.join(', ')}`);
  }

  // Render using template literal
  const rendered = new Function(...Object.keys(variables), `return \`${body}\`;`)
    (...Object.values(variables));

  return rendered;
}
```

### Pattern 3: Safe Child Process Execution
**What:** Use spawn() with explicit arguments array, never exec() with string concatenation
**When to use:** Running git, npm, or other commands
**Example:**
```javascript
// Source: https://nodejs.org/api/child_process.html
import { spawn } from 'node:child_process';

async function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    // spawn() doesn't invoke shell—safer
    const proc = spawn(command, args);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data; });
    proc.stderr.on('data', (data) => { stderr += data; });

    proc.on('error', (err) => {
      // Process failed to start
      reject(new Error(`Failed to start ${command}: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${command} exited with code ${code}\n${stderr}`));
      } else {
        resolve({ stdout, stderr, code });
      }
    });
  });
}

// Usage: spawn with args array (not string)
await runCommand('git', ['add', '.planning/STATE.md']);
await runCommand('npm', ['install', '--production']);
```

### Pattern 4: Cross-Platform Path Handling
**What:** Use path.join(), path.resolve(), never hardcode separators
**When to use:** All file path construction
**Example:**
```javascript
// Source: https://nodejs.org/api/path.html
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ CORRECT: Cross-platform
const statePath = path.join('.planning', 'STATE.md');
const templatePath = path.resolve(__dirname, '..', 'templates', 'PROJECT.md');

// ❌ WRONG: Windows breaks
const badPath = '.planning/STATE.md'; // Works on Unix, might work on Windows
const worsePath = '.planning\\STATE.md'; // Breaks on Unix
```

### Pattern 5: ESM Module Organization
**What:** Use named exports, mandatory .js extensions, node: protocol for built-ins
**When to use:** All script modules
**Example:**
```javascript
// Source: https://nodejs.org/api/esm.html

// state-manager.js
import { readFile } from 'node:fs/promises';
import { writeFile } from 'write-file-atomic';
import path from 'node:path';

// Named exports (better than default)
export async function readState(projectRoot) {
  const statePath = path.join(projectRoot, '.planning', 'STATE.md');
  const content = await readFile(statePath, 'utf8');
  return parseStateContent(content);
}

export async function writeState(projectRoot, stateData) {
  const statePath = path.join(projectRoot, '.planning', 'STATE.md');
  const content = formatStateContent(stateData);
  await writeFile(statePath, content, 'utf8');
}

// Import with explicit .js extension
// import { readState, writeState } from './state-manager.js';
```

### Anti-Patterns to Avoid
- **Using exec() for commands:** Shell injection risk, buffers all output in memory
- **Hardcoded path separators:** `'gsd\\scripts\\state-manager.js'` breaks on Unix
- **Synchronous fs operations:** `fs.readFileSync()` blocks event loop, kills performance
- **Missing file extensions in imports:** `import x from './module'` fails in ESM
- **Assuming writeFile is atomic:** Native `fs.writeFile()` can corrupt files on interruption
- **Template libraries for simple substitution:** Handlebars/Mustache are overkill for `${var}`

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic file writes | Temp file + rename + error cleanup | `write-file-atomic` | Handles race conditions, thread IDs, cleanup on error, Windows quirks |
| JSON Schema validation | Manual schema checking | `ajv` | Pre-compiles schemas to JS, 50% faster, handles all draft versions |
| YAML frontmatter parsing | Regex + string splitting | `front-matter` | Handles edge cases (nested YAML, multi-doc, comments) |
| Child process output streaming | Manual chunk buffering | spawn() with .on('data') | Handles backpressure, encoding, race conditions |
| Cross-platform paths | String replace('/', '\\') | `path.join()` / `path.resolve()` | Handles UNC paths, drive letters, relative paths, normalization |
| Template variable substitution | String.replace() loops | Template literals + Function() | Native, fast, supports expressions not just variables |

**Key insight:** Node.js core modules (fs, path, child_process) are NOT batteries-included for production use. Atomic writes, schema validation, and frontmatter parsing require libraries because the edge cases are subtle and platform-specific.

## Common Pitfalls

### Pitfall 1: Assuming fs.writeFile is Atomic
**What goes wrong:** STATE.md gets corrupted when script is interrupted during write (Ctrl+C, system crash, process kill)
**Why it happens:** `fs.promises.writeFile()` performs multiple write calls internally, leaving partial content if interrupted
**How to avoid:** Use `write-file-atomic` which writes to temp file first, then atomically renames
**Warning signs:** Empty STATE.md files, truncated JSON, "unexpected end of input" parse errors

**Evidence:**
> "The native `fsPromises.writeFile()` is unsafe to use multiple times on the same file without waiting for the promise to be settled, and it performs multiple write calls internally to write the buffer passed to it. This means **the native writeFile is not atomic**." — [Node.js documentation via WebSearch](https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/)

### Pitfall 2: Using exec() Instead of spawn()
**What goes wrong:** Security vulnerability when passing user-controlled data; memory issues with large outputs
**Why it happens:** exec() spawns a shell and interprets metacharacters; buffers entire output before callback
**How to avoid:** Always use spawn() with arguments array; never concatenate strings into commands
**Warning signs:** Commands fail with "command not found" on Windows; out-of-memory errors with git output

**Code comparison:**
```javascript
// ❌ DANGEROUS: Shell injection, buffered output
import { exec } from 'node:child_process';
exec(`git commit -m "${userMessage}"`, callback); // Exploitable!

// ✅ SAFE: No shell, streaming output
import { spawn } from 'node:child_process';
spawn('git', ['commit', '-m', userMessage]); // Arguments escaped
```

### Pitfall 3: Hardcoding Path Separators
**What goes wrong:** Scripts fail on Windows with "ENOENT: no such file or directory"
**Why it happens:** Unix uses `/`, Windows uses `\`, hardcoding either breaks cross-platform
**How to avoid:** Always use `path.join()`, `path.resolve()`, never concatenate strings with `/` or `\`
**Warning signs:** Works on dev machine (macOS), fails in CI (Windows runners)

**Example:**
```javascript
// ❌ WRONG: Breaks on Windows
const configPath = 'gsd/templates/STATE.md';

// ✅ CORRECT: Cross-platform
import path from 'node:path';
const configPath = path.join('gsd', 'templates', 'STATE.md');
```

### Pitfall 4: Missing File Extensions in ESM Imports
**What goes wrong:** `Error [ERR_MODULE_NOT_FOUND]: Cannot find module`
**Why it happens:** ESM requires explicit file extensions; CommonJS auto-resolved .js
**How to avoid:** Always include `.js` extension in relative imports
**Warning signs:** Script works with `node --loader` but fails in production

**Example:**
```javascript
// ❌ FAILS in ESM
import { readState } from './state-manager';

// ✅ WORKS in ESM
import { readState } from './state-manager.js';
```

### Pitfall 5: Synchronous File Operations Blocking Event Loop
**What goes wrong:** Entire process freezes during file read; unresponsive to signals
**Why it happens:** `fs.readFileSync()` blocks event loop until I/O completes
**How to avoid:** Use `fs.promises` API exclusively; never use `*Sync` methods except in startup code
**Warning signs:** Script hangs when reading large files; Ctrl+C doesn't work immediately

**Performance impact:**
> "Synchronous file system calls (fs.readFileSync) are a common cause of blocking the event loop. If the event loop is blocked, the whole application is unresponsive, causing your application to slow down or crash under load." — [Common Node.js Mistakes](https://www.toptal.com/nodejs/top-10-common-nodejs-developer-mistakes)

### Pitfall 6: Not Handling Child Process 'error' Event
**What goes wrong:** Unhandled error crashes entire script with no useful message
**Why it happens:** spawn() emits 'error' event if process fails to start (command not found); must attach listener before 'close'
**How to avoid:** Always attach 'error' listener before 'close' listener
**Warning signs:** Script crashes with "Unhandled 'error' event"; no stack trace pointing to command

**Example:**
```javascript
// ❌ WRONG: Missing error handler
const proc = spawn('git', ['status']);
proc.on('close', (code) => { /* ... */ });

// ✅ CORRECT: Handle both error and close
const proc = spawn('git', ['status']);
proc.on('error', (err) => {
  console.error('Failed to start process:', err.message);
});
proc.on('close', (code) => {
  if (code !== 0) console.error('Process failed with code', code);
});
```

### Pitfall 7: __dirname and __filename Don't Exist in ESM
**What goes wrong:** `ReferenceError: __dirname is not defined`
**Why it happens:** ESM modules don't have CommonJS globals; use `import.meta.dirname` instead (Node 20.11+) or `fileURLToPath(import.meta.url)`
**How to avoid:** Use `import.meta.dirname` (Node 24 LTS supports this) or polyfill with `fileURLToPath`
**Warning signs:** Script crashes immediately with ReferenceError on Node 24

**Solution for Node 24 LTS:**
```javascript
// ✅ Node 20.11+ (including Node 24 LTS)
const __dirname = import.meta.dirname;
const __filename = import.meta.filename;

// ✅ Older versions (fallback)
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

## Code Examples

Verified patterns from official sources:

### Reading State File with Error Handling
```javascript
// Source: https://nodejs.org/api/fs.html
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function readState(projectRoot) {
  const statePath = path.join(projectRoot, '.planning', 'STATE.md');

  try {
    const content = await readFile(statePath, 'utf8');
    return parseStateMarkdown(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`STATE.md not found at ${statePath}. Run 'start GSD' first.`);
    }
    throw new Error(`Failed to read STATE.md: ${err.message}`);
  }
}
```

### Atomic State Write with write-file-atomic
```javascript
// Source: https://github.com/npm/write-file-atomic
import { writeFile } from 'write-file-atomic';
import path from 'node:path';

export async function writeState(projectRoot, stateData) {
  const statePath = path.join(projectRoot, '.planning', 'STATE.md');
  const content = formatStateMarkdown(stateData);

  // Atomic: writes to temp file, then renames
  // Automatically handles concurrent writes (queued)
  await writeFile(statePath, content, 'utf8');
}
```

### Loading Single Guideline File (Modular Loading)
```javascript
// Source: Node.js fs.promises documentation
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function loadGuideline(workflowName, configPath) {
  // Load config to get guidelines path
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  const guidelineFile = config.workflows[workflowName];

  if (!guidelineFile) {
    throw new Error(`Unknown workflow: ${workflowName}`);
  }

  const guidelinePath = path.join(
    path.dirname(configPath),
    config.paths.guidelines,
    guidelineFile
  );

  return await readFile(guidelinePath, 'utf8');
}

// Usage: Load only the guideline needed
const guideline = await loadGuideline('planPhase', 'gsd/.gsd-config.json');
```

### Template Rendering with Variable Validation
```javascript
// Source: https://www.npmjs.com/package/front-matter
import fm from 'front-matter';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function renderTemplate(templateName, variables, templatesDir) {
  const templatePath = path.join(templatesDir, `${templateName}.md`);
  const templateContent = await readFile(templatePath, 'utf8');

  // Parse frontmatter (YAML)
  const { attributes, body } = fm(templateContent);

  // Validate required variables
  const requiredVars = attributes.variables || [];
  const missing = requiredVars.filter(v => !(v in variables));
  if (missing.length > 0) {
    throw new Error(
      `Template ${templateName} requires: ${missing.join(', ')}`
    );
  }

  // Render using template literal via Function constructor
  // Safer than eval(); variables are in controlled scope
  const varNames = Object.keys(variables);
  const varValues = Object.values(variables);
  const renderFn = new Function(...varNames, `return \`${body}\`;`);

  return renderFn(...varValues);
}

// Usage
const rendered = await renderTemplate('STATE', {
  projectName: 'My Project',
  lastUpdated: new Date().toISOString(),
  currentPhase: 'Phase 1: Foundation'
}, 'gsd/templates');
```

### Safe Child Process Execution (git, npm)
```javascript
// Source: https://nodejs.org/api/child_process.html
import { spawn } from 'node:child_process';

export function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'], // stdin, stdout, stderr
      ...options
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    // Critical: handle 'error' before 'close'
    proc.on('error', (err) => {
      reject(new Error(`Failed to start ${command}: ${err.message}`));
    });

    proc.on('close', (code, signal) => {
      if (signal) {
        reject(new Error(`${command} killed by signal ${signal}`));
      } else if (code !== 0) {
        reject(new Error(
          `${command} failed with code ${code}\nstderr: ${stderr}`
        ));
      } else {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code });
      }
    });
  });
}

// Usage examples
await runCommand('git', ['add', '.planning/STATE.md']);
await runCommand('git', ['commit', '-m', 'Update state']);
await runCommand('npm', ['install', 'write-file-atomic']);
```

### JSON Schema Validation with Ajv
```javascript
// Source: https://ajv.js.org/guide/getting-started.html
import Ajv from 'ajv';
import { readFile } from 'node:fs/promises';

// Create validator instance (reuse across validations)
const ajv = new Ajv({ allErrors: true });

export async function validateConfig(configPath, schemaPath) {
  const [configData, schemaData] = await Promise.all([
    readFile(configPath, 'utf8').then(JSON.parse),
    readFile(schemaPath, 'utf8').then(JSON.parse)
  ]);

  // Compile schema to validation function (cached by Ajv)
  const validate = ajv.compile(schemaData);

  const valid = validate(configData);
  if (!valid) {
    const errors = validate.errors.map(err =>
      `${err.instancePath} ${err.message}`
    ).join('\n');
    throw new Error(`Config validation failed:\n${errors}`);
  }

  return configData;
}

// Usage
const config = await validateConfig(
  'gsd/.gsd-config.json',
  'gsd/config-schema.json'
);
```

### Cross-Platform Path Resolution
```javascript
// Source: https://nodejs.org/api/path.html
import path from 'node:path';

// Get directories relative to script location
const __dirname = import.meta.dirname; // Node 24 LTS

export function getProjectPaths(projectRoot) {
  return {
    planning: path.join(projectRoot, '.planning'),
    state: path.join(projectRoot, '.planning', 'STATE.md'),
    templates: path.join(projectRoot, 'gsd', 'templates'),
    guidelines: path.join(projectRoot, 'gsd', 'guidelines'),
    config: path.join(projectRoot, 'gsd', '.gsd-config.json')
  };
}

// Resolve relative to current script
export function resolveTemplatePath(templateName) {
  return path.resolve(__dirname, '..', 'templates', `${templateName}.md`);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CommonJS (require/module.exports) | ESM (import/export) | Node 12+ (2019) | Mandatory file extensions; import.meta instead of __dirname |
| __dirname / __filename | import.meta.dirname / import.meta.filename | Node 20.11 (2024) | Simpler ESM; no fileURLToPath boilerplate |
| exec() for all commands | spawn() for programmatic use | Always preferred | Security: no shell injection; Performance: streaming not buffering |
| Callback-based fs | fs.promises with async/await | Node 10+ (2018) | Cleaner error handling; standard async pattern |
| Manual temp-file-rename | write-file-atomic library | Package available since 2015 | Handles race conditions, Windows quirks, cleanup |
| JSON Schema draft-04 | JSON Schema 2020-12 | Draft 2020-12 (Dec 2020) | Better type definitions, improved validation |

**Deprecated/outdated:**
- **exec() for user input:** Use spawn() to avoid shell injection; exec() still fine for trusted static commands
- **Synchronous fs operations in production:** Use fs.promises API; *Sync methods block event loop
- **Missing file extensions in imports:** ESM requires explicit `.js`; CommonJS auto-resolved
- **fileURLToPath boilerplate for __dirname:** Node 24 LTS has import.meta.dirname built-in

## Open Questions

Things that couldn't be fully resolved:

1. **Windows-specific spawn() issues**
   - What we know: GitHub issues show Windows spawn failures with certain commands in Node 20+ (e.g., commands requiring .cmd extension)
   - What's unclear: Whether Node 24 LTS resolves these issues; whether .cmd/.bat handling is automatic
   - Recommendation: Test git, npm commands on Windows in Phase 2 execution; add explicit .cmd extension if needed

2. **Optimal buffer size for streaming large template files**
   - What we know: STATE.md templates are small (<10KB); streaming only needed for large files
   - What's unclear: At what file size threshold streaming becomes necessary vs. reading entire file
   - Recommendation: Use simple readFile() for Phase 2 (all templates <10KB); defer streaming optimization to future if templates grow

3. **Template literal security with untrusted variables**
   - What we know: Function() constructor evaluates template literals; could execute code if variables contain malicious template syntax
   - What's unclear: Whether GSD workflow ever uses untrusted input in template variables
   - Recommendation: Since templates are controlled (not user-provided), Function() approach is safe; if future phases accept user input, sanitize by escaping `${}` syntax

## Sources

### Primary (HIGH confidence)
- [Node.js File System API v25.3.0](https://nodejs.org/api/fs.html) - fs.promises methods, writeFile non-atomicity
- [Node.js Child Process API v25.3.0](https://nodejs.org/api/child_process.html) - spawn vs exec vs execFile, error handling, security
- [Node.js ESM API v25.3.0](https://nodejs.org/api/esm.html) - import.meta.dirname/filename, mandatory extensions, ESM interop
- [Node.js Path API](https://nodejs.org/api/path.html) - Cross-platform path handling
- [Ajv Getting Started Guide](https://ajv.js.org/guide/getting-started.html) - JSON Schema validation installation and usage

### Secondary (MEDIUM confidence)
- [write-file-atomic npm package](https://www.npmjs.com/package/write-file-atomic) - Atomic write patterns (WebSearch verified with GitHub repo)
- [front-matter npm package](https://www.npmjs.com/package/front-matter) - YAML frontmatter parsing (WebSearch verified with code examples)
- [Node.js 24 LTS announcement](https://nodesource.com/blog/nodejs-24-becomes-lts) - ESM features, LTS timeline
- [MDN Template Literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) - Native template syntax

### Tertiary (LOW confidence)
- [Common Node.js Mistakes - Toptal](https://www.toptal.com/nodejs/top-10-common-nodejs-developer-mistakes) - Pitfalls (synchronous operations, callback errors)
- [Node.js Buffer vs Stream - Medium](https://medium.com/globant/node-js-buffer-vs-stream-e2c23df543c1) - When to use streaming vs buffering
- [Node.js Best Practices GitHub](https://github.com/goldbergyoni/nodebestpractices) - Error handling, async/await patterns
- [Alternatives to __dirname in ESM - LogRocket](https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/) - import.meta solutions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Node.js documentation confirms all API behaviors; npm download stats verify library popularity
- Architecture: HIGH - Patterns sourced from official Node.js docs and library documentation
- Pitfalls: MEDIUM - Based on authoritative sources (Node.js docs, established blogs) but some WebSearch-only findings

**Research date:** 2026-01-18
**Valid until:** 2026-04-18 (90 days - Node.js ecosystem is stable; LTS version changes slowly)
