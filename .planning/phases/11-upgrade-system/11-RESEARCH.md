# Phase 11: Upgrade System - Research

**Researched:** 2026-01-22
**Domain:** File-based library upgrade systems and version management
**Confidence:** MEDIUM

## Summary

Research investigated upgrade strategies for file-based development tools similar to GSD's architecture (copied into user projects). The standard approach combines npm package distribution with intelligent file merging to preserve user customizations. Key findings:

- **Version Detection**: npm's package.json is the de facto standard for versioning and update detection, with registry API queries for checking available updates.
- **Upgrade Delivery**: Three-tier approach is common: npm packages for automated distribution, git subtree for vendored dependencies, and manual copy with migration scripts as fallback.
- **File Preservation**: Three-way merge strategy (base, user-modified, new) is the gold standard, with deep merge for configuration files and explicit backup before destructive operations.
- **Migration Scripts**: migrations.json format from Nx/Angular provides battle-tested pattern for sequencing transformations based on semver ranges.
- **User Experience**: Dry-run preview, backup creation, fail-fast verification, and rollback mechanisms are table-stakes for production-grade upgrade systems.

**Primary recommendation:** Distribute GSD as npm package with npx-based upgrade command that: (1) detects current version from package.json, (2) backs up user customizations (.gsd-config.json), (3) performs three-way merge on updated files, (4) executes migration scripts for breaking changes, (5) validates result, (6) provides rollback if needed.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| npm registry API | - | Version checking | 50M+ packages, de facto JavaScript registry, built-in to npm/node ecosystem |
| package.json | - | Version storage | Standard for all npm packages, supports semver, readable by tooling |
| semver | ^7.6.0 | Version comparison | Official semantic versioning library, 100M+ weekly downloads |
| update-notifier | ^7.3.1 | Update alerts | Industry standard for CLI update notifications, non-intrusive background checks |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jscodeshift | ^0.15.1 | Code transformation | When needing automated code migrations (AST-based refactoring) |
| json-merge-patch | ^1.0.2 | JSON merging | Deep merge of configuration files preserving user customizations |
| fs-extra | ^11.2.0 | File operations | Enhanced file system methods (copy, remove, move with error handling) |
| write-file-atomic | ^5.0.1 | Atomic writes | Already in GSD - use for upgrade state management |
| ajv | ^8.12.0 | Schema validation | Already in GSD - validate config after merge |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| npm package | git subtree | More control but manual updates, no auto-notification |
| npm package | Manual copy | Simplest but zero automation, high friction |
| update-notifier | simple-update-notifier | Lighter weight but less mature ecosystem |
| jscodeshift | Custom regex | Simpler for basic cases but brittle for complex transformations |

**Installation:**
```bash
npm install semver update-notifier json-merge-patch fs-extra
# jscodeshift only if implementing AST-based migrations
npm install --save-dev jscodeshift
```

## Architecture Patterns

### Recommended Project Structure
```
gsd/
├── scripts/
│   ├── upgrade-manager.js      # Main upgrade orchestrator
│   ├── version-checker.js      # Detects current/available versions
│   ├── backup-manager.js       # Creates/restores backups
│   ├── file-merger.js          # Three-way merge logic
│   ├── migration-runner.js     # Executes migration scripts
│   └── migrations/
│       ├── migrations.json     # Migration registry (Nx pattern)
│       ├── 1.0.0-to-1.1.0.js   # Version-specific migrations
│       └── 2.0.0-to-2.1.0.js
├── templates/                  # Overwrite on upgrade (not customized)
├── guidelines/                 # Overwrite on upgrade (not customized)
├── .gsd-config.json           # PRESERVE - user customization
└── package.json               # Version source of truth
```

### Pattern 1: npm Package Distribution
**What:** Publish GSD to npm registry, users install via npm/npx
**When to use:** Standard approach for JavaScript tools
**Example:**
```javascript
// User installation
npm install -g gsd-for-tabnine
# OR run without install
npx gsd-for-tabnine init

// Upgrade check on every run (update-notifier pattern)
import updateNotifier from 'update-notifier';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const notifier = updateNotifier({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 }); // 24hr

if (notifier.update) {
  console.log(`Update available: ${notifier.update.latest}`);
  console.log(`Run: npm install -g gsd-for-tabnine@latest`);
}
```

### Pattern 2: Three-Way Merge for Config Files
**What:** Merge base (original), theirs (new version), ours (user modified)
**When to use:** For configuration files that users customize (.gsd-config.json)
**Example:**
```javascript
// Source: Git three-way merge strategy
// https://git-scm.com/docs/merge-strategies

import { merge } from 'json-merge-patch';

async function mergeConfig(basePath, userPath, newPath) {
  const base = await readJSON(basePath);     // Original v1.0 config
  const user = await readJSON(userPath);     // User's modified config
  const latest = await readJSON(newPath);    // New v1.1 config

  // Deep merge: latest + user changes
  // User modifications take precedence
  const merged = merge(latest, user);

  return merged;
}
```

### Pattern 3: migrations.json Registry (Nx/Angular Pattern)
**What:** Centralized migration registry with semver-based execution
**When to use:** For breaking changes requiring code/config transformations
**Example:**
```json
{
  "version": "2",
  "migrations": {
    "update-1.1": {
      "version": "1.1.0",
      "description": "Update trigger phrases structure",
      "implementation": "./migrations/1.0.0-to-1.1.0.js"
    },
    "update-2.0": {
      "version": "2.0.0",
      "description": "Migrate to new workflow format",
      "implementation": "./migrations/2.0.0-to-2.1.0.js",
      "type": "breaking"
    }
  }
}
```

### Pattern 4: Dry-Run Preview
**What:** Show what would change without applying changes
**When to use:** Always - best practice for any destructive operation
**Example:**
```javascript
// Source: Helm 3 three-way merge approach
// https://devtron.ai/blog/changes-introduced-in-helm3/

async function previewUpgrade(fromVersion, toVersion, options = {}) {
  const { dryRun = false } = options;

  const changes = await calculateChanges(fromVersion, toVersion);

  console.log('\n=== Upgrade Preview ===');
  console.log(`From: ${fromVersion} → To: ${toVersion}\n`);

  console.log('Files to update:');
  changes.updates.forEach(f => console.log(`  📝 ${f}`));

  console.log('\nFiles to preserve:');
  changes.preserves.forEach(f => console.log(`  ✅ ${f}`));

  console.log('\nMigrations to run:');
  changes.migrations.forEach(m => console.log(`  🔧 ${m.description}`));

  if (dryRun) {
    console.log('\n[DRY RUN] No changes applied.');
    return { applied: false, changes };
  }

  // Await user confirmation
  return { applied: false, changes };
}
```

### Pattern 5: Backup and Rollback
**What:** Create backup before upgrade, restore on failure
**When to use:** Always - safety net for upgrade failures
**Example:**
```javascript
// Source: Ubuntu config upgrades, Oracle database upgrade practices
// https://docs.oracle.com/middleware/1221/core/INFUP/GUID-47E53006-BA02-40F4-97EE-E8F1E7800C0C.htm

async function performUpgradeWithRollback(fromVersion, toVersion) {
  const backupId = Date.now();
  const backupPath = `.gsd-backup-${backupId}`;

  try {
    // Step 1: Backup
    console.log('Creating backup...');
    await fs.copy('gsd/', backupPath);

    // Step 2: Validate backup
    await validateBackup(backupPath);

    // Step 3: Perform upgrade
    console.log('Applying upgrade...');
    await applyUpgrade(fromVersion, toVersion);

    // Step 4: Verify upgrade
    await verifyUpgrade(toVersion);

    console.log(`✅ Upgrade complete. Backup: ${backupPath}`);
    console.log('Remove backup after verifying everything works.');

  } catch (error) {
    console.error('❌ Upgrade failed:', error.message);
    console.log('Rolling back...');

    await fs.remove('gsd/');
    await fs.copy(backupPath, 'gsd/');

    console.log('✅ Rollback complete. System restored.');
    throw error;
  }
}
```

### Anti-Patterns to Avoid
- **Overwrite without backup:** Always create backup before destructive operations
- **No dry-run option:** Users need to preview changes before applying
- **Silent upgrades:** Breaking changes must be communicated clearly
- **Single-step rollback:** Need granular rollback per migration step
- **Ignoring user edits:** Must preserve customizations during upgrade

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Version comparison | String comparison, regex parsing | `semver` package | Handles pre-release, build metadata, range matching (^1.0.0, ~1.2.3) correctly |
| Update checking | setInterval polling | `update-notifier` | Background checks, respects intervals, caches results, handles opt-out |
| JSON deep merge | Object.assign, spread operator | `json-merge-patch` or `lodash.merge` | Handles nested objects, arrays, null values, conflicts correctly |
| File copying | fs.readFile + fs.writeFile loops | `fs-extra.copy` | Recursive, atomic, preserves permissions, error handling |
| Config validation | Manual field checking | `ajv` (already in GSD) | Schema-based validation catches edge cases |
| AST transformations | String manipulation, regex | `jscodeshift` | Syntax-aware, handles edge cases, preserves formatting |

**Key insight:** Upgrade systems have many edge cases (partial failures, network issues, permission errors, concurrent modifications). Battle-tested libraries handle these; custom solutions will rediscover bugs the hard way.

## Common Pitfalls

### Pitfall 1: Overwriting User Customizations
**What goes wrong:** Upgrade blindly replaces all files, wiping out user's .gsd-config.json customizations
**Why it happens:** Simpler to copy all files than implement selective merging
**How to avoid:** Maintain explicit list of "preserve" vs "overwrite" files. Never overwrite user-editable files.
**Warning signs:** Users complaining about lost configuration after upgrade

**Prevention strategy:**
```javascript
const FILE_STRATEGIES = {
  OVERWRITE: ['templates/', 'guidelines/', 'scripts/'],
  PRESERVE: ['.gsd-config.json'],
  MERGE: [] // Three-way merge (future: if users can customize templates)
};
```

### Pitfall 2: Breaking Changes Without Migration Path
**What goes wrong:** v2.0 changes config format, old configs now invalid, users stuck
**Why it happens:** No migration script to transform old format to new format
**How to avoid:** For every breaking change, write migration script and document in CHANGELOG
**Warning signs:** GitHub issues "v2.0 broke my setup", "config not working after upgrade"

**Prevention strategy:**
- CHANGELOG section: "Breaking Changes" with migration instructions
- Migration script: Automatically transform old config to new format
- Validation: Detect old format, offer to migrate

### Pitfall 3: No Rollback After Failed Upgrade
**What goes wrong:** Upgrade partially applied, fails mid-process, system in broken state
**Why it happens:** No backup created, no atomic upgrade operation
**How to avoid:** Always backup before upgrade, test backup validity, provide rollback command
**Warning signs:** "Upgrade failed, now nothing works", "How do I undo?"

**Prevention strategy:**
```bash
# Upgrade creates backup automatically
gsd upgrade --to 2.0.0
# Creates .gsd-backup-<timestamp>/

# If upgrade fails, restore from backup
gsd rollback --backup .gsd-backup-<timestamp>/
```

### Pitfall 4: Silent Version Drift
**What goes wrong:** User's GSD version is 6 months old, doesn't know updates exist
**Why it happens:** No update notification system
**How to avoid:** Use `update-notifier` to check for updates on every run (with caching)
**Warning signs:** Users asking for features that already exist in newer versions

**Prevention strategy:**
```javascript
// Check once per day (cached), non-blocking
updateNotifier({
  pkg,
  updateCheckInterval: 1000 * 60 * 60 * 24
}).notify();
```

### Pitfall 5: Ignoring Semver for Breaking Changes
**What goes wrong:** Minor version bump (1.1 → 1.2) includes breaking changes, users auto-upgrade and break
**Why it happens:** Not following semantic versioning strictly
**How to avoid:** Major version for breaking changes, minor for features, patch for fixes
**Warning signs:** Bug reports after minor version bumps, "It was working yesterday"

**Prevention strategy:**
- Use Conventional Commits: `feat!:` or `BREAKING CHANGE:` → major bump
- Document versioning policy in CONTRIBUTING.md
- CI/CD enforces semver compliance

## Code Examples

Verified patterns from official sources:

### Version Detection and Comparison
```javascript
// Source: npm registry API, semver library
// https://www.npmjs.com/package/semver
// https://www.npmjs.com/package/latest-version

import semver from 'semver';
import { readFileSync } from 'fs';

async function checkForUpdates() {
  // Current version from local package.json
  const pkg = JSON.parse(readFileSync('./gsd/package.json', 'utf8'));
  const currentVersion = pkg.version; // "1.0.0"

  // Latest version from npm registry
  const response = await fetch('https://registry.npmjs.org/gsd-for-tabnine');
  const data = await response.json();
  const latestVersion = data['dist-tags'].latest; // "1.2.0"

  // Compare versions
  if (semver.gt(latestVersion, currentVersion)) {
    const updateType = semver.diff(latestVersion, currentVersion); // "minor"
    console.log(`Update available: ${currentVersion} → ${latestVersion} (${updateType})`);
    return { hasUpdate: true, current: currentVersion, latest: latestVersion, type: updateType };
  }

  return { hasUpdate: false, current: currentVersion };
}
```

### Migration Script Execution (Nx Pattern)
```javascript
// Source: Nx migrations documentation
// https://nx.dev/nx-api/nx/documents/migrate

import { readFileSync } from 'fs';
import semver from 'semver';

async function runMigrations(fromVersion, toVersion) {
  const migrationsFile = './gsd/scripts/migrations/migrations.json';
  const migrations = JSON.parse(readFileSync(migrationsFile, 'utf8'));

  // Find applicable migrations (fromVersion < migration.version <= toVersion)
  const applicableMigrations = Object.values(migrations.migrations)
    .filter(m => {
      return semver.gt(m.version, fromVersion) &&
             semver.lte(m.version, toVersion);
    })
    .sort((a, b) => semver.compare(a.version, b.version)); // Execute in order

  console.log(`\nRunning ${applicableMigrations.length} migrations:\n`);

  for (const migration of applicableMigrations) {
    console.log(`🔧 ${migration.description} (${migration.version})`);

    try {
      const migrationFn = await import(migration.implementation);
      await migrationFn.default();
      console.log(`   ✅ Complete`);
    } catch (error) {
      console.error(`   ❌ Failed:`, error.message);
      throw new Error(`Migration failed: ${migration.description}`);
    }
  }
}
```

### Three-Way Config Merge
```javascript
// Source: Git merge strategy, Drupal config merge
// https://www.drupal.org/project/config_merge

import { merge } from 'json-merge-patch';
import { readFileSync, writeFileSync } from 'fs';

async function mergeUserConfig(basePath, userPath, newPath, outputPath) {
  // base = original v1.0.0 config (from backup or git)
  // user = user's current config (may have customizations)
  // new = v1.1.0 config (from package)

  const base = JSON.parse(readFileSync(basePath, 'utf8'));
  const user = JSON.parse(readFileSync(userPath, 'utf8'));
  const latest = JSON.parse(readFileSync(newPath, 'utf8'));

  // Strategy: Start with latest, overlay user customizations
  // Deep merge preserves nested user settings
  const merged = merge(merge({}, latest), user);

  // Validate merged config against schema
  const valid = validateConfig(merged);
  if (!valid) {
    throw new Error('Merged config is invalid. Review conflicts manually.');
  }

  writeFileSync(outputPath, JSON.stringify(merged, null, 2));
  console.log(`✅ Config merged: ${outputPath}`);

  // Show what changed
  const userChanges = Object.keys(user).filter(k => {
    return JSON.stringify(user[k]) !== JSON.stringify(base[k]);
  });
  console.log(`   Preserved user changes: ${userChanges.join(', ')}`);
}
```

### Upgrade Command with Dry-Run
```javascript
// Source: Kubernetes kubectl apply --dry-run, npm update --dry-run
// https://kubernetes.io/docs/reference/kubectl/overview/

async function upgrade(options = {}) {
  const { dryRun = false, force = false, version = 'latest' } = options;

  // Step 1: Check current version
  const current = getCurrentVersion();

  // Step 2: Determine target version
  const target = version === 'latest' ? await getLatestVersion() : version;

  if (semver.eq(current, target)) {
    console.log(`✅ Already on version ${current}`);
    return;
  }

  // Step 3: Preview changes
  const preview = await previewUpgrade(current, target);

  console.log('\n=== Upgrade Preview ===');
  console.log(`${current} → ${target}\n`);
  console.log(`Files updated: ${preview.updates.length}`);
  console.log(`Files preserved: ${preview.preserves.length}`);
  console.log(`Migrations: ${preview.migrations.length}`);

  if (dryRun) {
    console.log('\n[DRY RUN] No changes applied.');
    console.log('Run without --dry-run to apply changes.');
    return;
  }

  // Step 4: Confirm (unless --force)
  if (!force) {
    const confirmed = await promptConfirm('Apply upgrade?');
    if (!confirmed) {
      console.log('Upgrade cancelled.');
      return;
    }
  }

  // Step 5: Backup + Upgrade + Verify
  await performUpgradeWithRollback(current, target);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual file copying | npm package distribution | 2015+ | Automated updates, version tracking, dependency management |
| String-based version comparison | semver library | 2013+ | Correct handling of pre-release, build metadata, ranges |
| Overwrite all files | Three-way merge | 2018+ (Helm 3) | Preserves user customizations during upgrades |
| No update notifications | Background update checking | 2016+ (update-notifier) | Users stay current without manual checking |
| Manual code refactoring | AST-based codemods | 2013+ (jscodeshift) | Automated migrations for breaking changes |
| Git submodules | npm + git subtree | 2020+ | Simpler workflow, better DX, fewer foot-guns |

**Deprecated/outdated:**
- **Git submodules for libraries:** npm packages now preferred for JavaScript tools (submodules still used for large assets/binaries)
- **Bower:** Deprecated 2017, replaced by npm for frontend packages
- **Global npm installs:** npx pattern (2017+) allows running without global install pollution
- **Manual changelog parsing:** Conventional Commits + semantic-release (2015+) automate versioning

## Open Questions

Things that couldn't be fully resolved:

1. **GSD Distribution Strategy**
   - What we know: GSD is currently copied into user projects (gsd/ directory), not installed globally
   - What's unclear: Should GSD remain as copied files (current), or migrate to global npm package with npx execution?
   - Recommendation: Hybrid approach - publish to npm for discovery/updates, but still copy files into user project (users may customize templates/guidelines in future). Upgrade command pulls from npm, merges into local gsd/.

2. **User Customization Scope**
   - What we know: Currently only .gsd-config.json is user-customizable
   - What's unclear: Will users eventually customize templates/ or guidelines/? If yes, need more sophisticated merge strategy.
   - Recommendation: Start with PRESERVE list containing only .gsd-config.json. Document "don't edit" warning in templates/guidelines/. If customization demand emerges, implement three-way merge for those files later.

3. **Breaking Change Frequency**
   - What we know: GSD is v1.0.0, no breaking changes yet
   - What's unclear: How often will breaking changes occur? Determines migration complexity.
   - Recommendation: Follow semver strictly. Plan for 1-2 major versions per year max. Bundle breaking changes into major releases. Provide migration guide + automated migration script for each major bump.

4. **Update Notification Timing**
   - What we know: update-notifier can check on every run, cached per interval
   - What's unclear: When should GSD notify? Every workflow start? Once per day? User configurable?
   - Recommendation: Check once per 24 hours (update-notifier default), display notification before workflow confirmation. Users can opt out via environment variable NO_UPDATE_NOTIFIER.

## Sources

### Primary (HIGH confidence)
- [npm registry API](https://registry.npmjs.org/) - Official npm registry for version queries
- [semver npm package](https://www.npmjs.com/package/semver) - Official semantic versioning library
- [update-notifier npm package](https://www.npmjs.com/package/update-notifier) - Sindre Sorhus's update notification library
- [Nx migrations documentation](https://nx.dev/nx-api/nx/documents/migrate) - Production-proven migration system
- [Angular CLI ng update](https://angular.dev/cli/update) - Schematics-based upgrade system
- [Git merge strategies](https://git-scm.com/docs/merge-strategies) - Official Git three-way merge documentation

### Secondary (MEDIUM confidence)
- [React codemods](https://github.com/reactjs/react-codemod) - Facebook's official migration scripts
- [Helm 3 three-way merge](https://devtron.ai/blog/changes-introduced-in-helm3/) - Kubernetes package manager upgrade approach
- [Oracle upgrade best practices](https://docs.oracle.com/middleware/1221/core/INFUP/GUID-47E53006-BA02-40F4-97EE-E8F1E7800C0C.htm) - Enterprise upgrade patterns (backup/rollback)
- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) - Industry standard changelog format
- [Semantic Versioning](https://semver.org/) - Official semver specification

### Tertiary (LOW confidence - WebSearch only)
- [Yeoman update-yeoman-generator](https://github.com/willmendesneto/update-yeoman-generator) - Community tool for generator updates
- [Ubuntu config upgrades](https://wiki.ubuntu.com/Configuration_files_upgrades_discussion) - Three-way merge discussion
- [Drupal config merge](https://www.drupal.org/project/config_merge) - Config merging patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - npm/semver/update-notifier are industry standards with official docs
- Architecture: MEDIUM - Patterns verified across multiple sources (Nx, Angular, Helm) but not GSD-specific
- Pitfalls: MEDIUM - Common issues documented in GitHub issues and blog posts, not all from official sources

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - stable domain, upgrade patterns change slowly)

**Key sources for verification:**
- npm registry API: Official, authoritative
- Nx/Angular migration systems: Production-proven, heavily documented
- Semantic versioning: Official specification, widely adopted
- Git three-way merge: Official Git documentation

**Research limitations:**
- No Context7 coverage for upgrade-specific libraries (update-notifier, json-merge-patch)
- WebSearch results not fully verified against official sources for tertiary items
- GSD-specific upgrade requirements may differ from general patterns

**Next steps for planning:**
1. Decide distribution strategy (npm package vs copied files vs hybrid)
2. Define file preservation rules (.gsd-config.json only vs more)
3. Design migration script format (adopt Nx migrations.json pattern)
4. Implement version checker + update notifier
5. Create backup/rollback mechanism
6. Build dry-run preview functionality
