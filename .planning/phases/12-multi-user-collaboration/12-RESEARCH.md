# Phase 12: Multi-User Collaboration - Research

**Researched:** 2026-01-23
**Domain:** Git-based distributed collaboration without central server
**Confidence:** HIGH

## Summary

Multi-user collaboration for file-based workflow systems like GSD requires Git-native patterns that work offline without central coordination servers. The research identified three proven architectural patterns used in production systems:

1. **Branch-per-developer isolation** using Git worktrees for workspace isolation while sharing the same repository history
2. **File-level conflict detection** using Git's three-way merge with pre-merge status checks to catch conflicts early
3. **Coordination through Git primitives** (branch protection, commit conventions, pre-commit hooks) rather than centralized state servers

The standard approach leverages Git's distributed nature: each developer works in isolated branches/worktrees, Git handles automatic conflict detection through its merge machinery, and coordination happens through commit conventions (Conventional Commits for traceability) and branch protection rules (status checks before merge).

**Key insight:** Tools like Terraform, monorepo systems (Nx, Turborepo), and collaborative Git workflows all converged on the same pattern: avoid file-based state conflicts by isolating work in branches, detect conflicts early through automated checks, and use atomic commits with semantic messages for traceability.

**Primary recommendation:** Implement branch-per-developer workflow with Git worktrees for workspace isolation, leverage Git's ort merge strategy for automatic conflict resolution, use pre-commit hooks for conflict detection, and adopt Conventional Commits with Co-authored-by trailers for attribution.

## Standard Stack

The established libraries/tools for distributed Git collaboration:

### Core
| Library/Tool | Version | Purpose | Why Standard |
|--------------|---------|---------|--------------|
| Git | 2.43+ | Distributed version control with worktree support | Universal VCS, built-in 3-way merge, worktrees for workspace isolation, offline-capable |
| Git worktree | Built-in | Multiple working directories for single repository | Official Git feature, shares .git directory, enables parallel branch development |
| Git merge (ort strategy) | Default since 2.33.0 | Automatic conflict detection and resolution | Fewer conflicts than recursive, handles renames, three-way merge algorithm |
| Conventional Commits | v1.0.0 | Standardized commit message format | Enables automation, provides traceability, machine-parseable format for tooling |

### Supporting
| Library/Tool | Version | Purpose | When to Use |
|--------------|---------|---------|-------------|
| pre-commit | 3.x+ | Git hook framework for validation | Conflict detection, linting, format checks before commit |
| semver | 7.6+ | Semantic versioning comparison | Version compatibility checks, upgrade detection |
| Co-authored-by trailers | Git built-in | Multi-author attribution | Pair programming, AI-assisted commits, contribution tracking |
| Branch protection rules | GitHub/GitLab/Bitbucket | Pre-merge validation gates | Enforce status checks, require reviews, prevent force pushes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Git worktree | Multiple clones | Worktree shares .git (saves disk space), multiple clones fully isolated (safer but slower) |
| Branch-per-developer | Shared branch with flock | Flock requires OS support, introduces complexity, branch isolation is simpler |
| Conventional Commits | Free-form messages | Conventional enables automation (changelog, versioning), free-form more flexible |
| ort merge strategy | recursive strategy | ort is default since Git 2.33.0, fewer conflicts, better performance |

**Installation:**
```bash
# Git (already installed in most environments)
git --version  # Verify 2.33.0+ for ort strategy

# pre-commit framework (optional but recommended)
npm install -g pre-commit  # or pip install pre-commit

# semver for Node.js scripts
npm install semver
```

## Architecture Patterns

### Recommended Project Structure
```
project/
├── .git/                    # Shared Git database
├── .planning/               # Main worktree planning artifacts
│   ├── STATE.md             # Single-user state (not shared)
│   └── phases/              # Phase directories (shared via Git)
├── worktrees/               # Sibling directory for additional worktrees
│   ├── alice-feature-x/     # Alice's isolated workspace
│   │   └── .planning/       # Alice's local STATE.md (not committed)
│   └── bob-feature-y/       # Bob's isolated workspace
│       └── .planning/       # Bob's local STATE.md (not committed)
└── gsd/                     # Shared GSD infrastructure (committed)
```

### Pattern 1: Branch-Per-Developer with Worktree Isolation

**What:** Each developer works in their own Git branch checked out in a separate worktree directory, with STATE.md kept as local working state (not committed).

**When to use:** When multiple developers work on different phases or plans simultaneously without coordinating work assignments.

**Example:**
```bash
# Source: https://git-scm.com/docs/git-worktree

# Alice starts work on phase 5
git worktree add ../worktrees/alice-phase-5 -b alice/phase-5
cd ../worktrees/alice-phase-5
# Alice's STATE.md reflects her local progress (not committed)

# Bob starts work on phase 6 independently
git worktree add ../worktrees/bob-phase-6 -b bob/phase-6
cd ../worktrees/bob-phase-6
# Bob's STATE.md reflects his local progress (not committed)

# List all active worktrees
git worktree list
# main         /path/to/project          [main]
# alice-phase-5  /path/to/worktrees/alice-phase-5  [alice/phase-5]
# bob-phase-6    /path/to/worktrees/bob-phase-6    [bob/phase-6]
```

**Key benefits:**
- Complete workspace isolation (no STATE.md conflicts)
- Shared Git history (all committed artifacts visible)
- No disk space duplication (.git directory shared)
- AI agent context preservation (each worktree maintains separate context)

### Pattern 2: Three-Way Merge for Artifact Conflict Resolution

**What:** Git's default ort merge strategy uses three-way merge (your branch, target branch, common ancestor) to automatically resolve non-overlapping changes and detect conflicts in overlapping changes.

**When to use:** When merging completed phase work from feature branches back to main branch.

**Example:**
```bash
# Source: https://git-scm.com/docs/merge-strategies

# Alice completes phase 5, merges to main
git checkout main
git pull origin main  # Ensure latest
git merge alice/phase-5  # Automatic three-way merge

# If conflicts occur in phase artifacts:
# Git marks conflicts in files with <<<<<<< ======= >>>>>>>
# Developer resolves conflicts manually
# Then completes merge:
git add .planning/phases/05-*/
git commit -m "Merge alice/phase-5

Completed Phase 5: Polish and Distribution Readiness
- Added MIT license
- Updated package.json for npm distribution
- Created documentation and examples

Co-authored-by: Alice Smith <alice@example.com>"
```

**Conflict resolution options:**
```bash
# Favor your version for conflicts
git merge -X ours alice/phase-5

# Favor their version for conflicts
git merge -X theirs alice/phase-5

# Detect and handle renames automatically (default in ort)
git merge --find-renames alice/phase-5
```

### Pattern 3: Pre-Commit Hooks for Early Conflict Detection

**What:** Git hooks that run before commit to detect potential conflicts, enforce commit message format, and validate file changes.

**When to use:** To catch issues before they reach shared branches and enforce collaboration conventions.

**Example:**
```yaml
# Source: https://pre-commit.com/
# .pre-commit-config.yaml

repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      # Detect merge conflict markers in files
      - id: check-merge-conflict

      # Prevent commits directly to protected branches
      - id: no-commit-to-branch
        args: ['--branch', 'main', '--branch', 'master']

      # Check for file name conflicts on case-insensitive filesystems
      - id: check-case-conflict

      # Validate YAML/JSON structure
      - id: check-yaml
      - id: check-json

  # Enforce Conventional Commits format
  - repo: https://github.com/compilerla/conventional-pre-commit
    rev: v3.0.0
    hooks:
      - id: conventional-pre-commit
        stages: [commit-msg]
```

**Installation:**
```bash
# Source: https://pre-commit.com/
npm install -g pre-commit
pre-commit install  # Sets up git hooks
pre-commit install --hook-type commit-msg  # For commit message validation
```

### Pattern 4: Conventional Commits for Traceability

**What:** Structured commit message format that enables automated changelog generation, version bumping, and clear attribution of changes.

**When to use:** All commits in collaborative workflows to maintain traceability and enable automation.

**Example:**
```bash
# Source: https://www.conventionalcommits.org/en/v1.0.0/

# Format: <type>[optional scope]: <description>
#
# [optional body]
#
# [optional footer(s)]

git commit -m "feat(phase-05): add MIT license and npm distribution metadata

- Created LICENSE file with MIT license text
- Updated package.json with distribution fields (keywords, repository, etc.)
- Added .npmignore to exclude dev files from npm package

Implements COLLAB-03 requirement for shared guideline library.

Co-authored-by: Bob Jones <bob@example.com>"
```

**Common types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code restructuring without behavior change
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Pattern 5: Branch Protection Rules for Pre-Merge Validation

**What:** Repository settings that enforce validation checks (tests, reviews, status checks) before allowing merges to protected branches.

**When to use:** On main branch and release branches to maintain quality and prevent breaking changes.

**Configuration:**
```yaml
# Source: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule

# GitHub branch protection settings (configured in repository settings)
protected_branches:
  main:
    # Require pull request before merging
    require_pull_request: true
    required_approving_review_count: 1

    # Require status checks to pass before merging
    require_status_checks: true
    required_status_checks:
      - "ci/test-suite"
      - "ci/lint"
      - "ci/integration-tests"

    # Require branches to be up to date before merging
    require_up_to_date_before_merge: true

    # Require conversation resolution before merging
    require_conversation_resolution: true

    # Enforce for administrators
    enforce_admins: true

    # Restrict who can push to matching branches
    restrict_pushes: true
```

**Benefits:**
- Prevents direct commits to main (forces review process)
- Ensures all tests pass before merge
- Catches conflicts early (require up-to-date check)
- Maintains code quality standards

### Pattern 6: Co-Authored Commits for Attribution

**What:** Git commit trailers that attribute commits to multiple authors, providing clear traceability for collaborative work.

**When to use:** Pair programming, AI-assisted development, or when multiple people contribute to same commit.

**Example:**
```bash
# Source: https://docs.github.com/articles/creating-a-commit-with-multiple-authors

git commit -m "feat(phase-12): implement multi-user collaboration system

Added branch-per-developer workflow with worktree isolation.
Implemented conflict detection using pre-commit hooks.
Created merge strategy for phase artifact integration.

Co-authored-by: Alice Smith <alice@example.com>
Co-authored-by: Bob Jones <bob@example.com>
Co-authored-by: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Requirements:**
- Blank line between commit description and Co-authored-by trailers
- Format: `Co-authored-by: Name <email@example.com>`
- Use GitHub-provided no-reply emails for privacy
- Multiple co-authors on separate lines

### Anti-Patterns to Avoid

- **Committing STATE.md to Git:** STATE.md is local working state, not shared artifact. Committing it causes conflicts. Each worktree has its own STATE.md.
- **Force-pushing shared branches:** Rewrites history, breaks other developers' work. Use `git push --force-with-lease` only on personal branches.
- **Long-lived feature branches:** Leads to merge conflicts. Rebase frequently against main, merge often.
- **Editing files outside worktree:** Confuses Git about which worktree owns changes. Always work inside correct worktree directory.
- **Sharing worktree directories:** Each developer should have their own worktrees. Don't share filesystem access to worktree directories.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Conflict detection | Custom file diff scanning | Git merge dry-run + ort strategy | Git's three-way merge is battle-tested, handles edge cases (renames, whitespace, binary files) |
| Workspace isolation | Directory namespacing + file locks | Git worktree | Native Git feature, shares .git directory, handles refs correctly, automatic cleanup |
| Commit attribution | Custom commit metadata in files | Co-authored-by trailers + Conventional Commits | GitHub/GitLab recognize Co-authored-by, Conventional Commits enable automation (changelog, versioning) |
| Pre-merge validation | Manual review checklist | Branch protection rules + pre-commit hooks | Automated enforcement, catches issues before push, integrates with CI/CD |
| Merge conflict resolution | Line-by-line manual editing | Git merge tools (vimdiff, meld, VS Code) | Visual diff tools, automatic resolution for non-overlapping changes, undo support |
| File locking | flock or custom lock files | Git's blob/tree object model | Git handles concurrent writes through object model, atomic operations, no lock files needed |

**Key insight:** Git was designed for distributed collaboration without central coordination. Its object model (blobs, trees, commits) is content-addressed and immutable, making concurrent work inherently safe. Conflicts only occur at merge time, when Git has full context to detect and flag overlapping changes.

## Common Pitfalls

### Pitfall 1: STATE.md Conflicts from Multiple Users

**What goes wrong:** Multiple developers commit STATE.md to Git, causing merge conflicts on every pull/push since STATE.md tracks local working state (current phase, plan number, status).

**Why it happens:** GSD's STATE.md was designed for single-user scenarios where it serves as workflow checkpoint. When multiple users work simultaneously, each modifies STATE.md independently, creating guaranteed conflicts.

**How to avoid:**
- Add STATE.md to .gitignore so it remains local working state
- Each developer tracks their own progress in their worktree's STATE.md
- Use Git branch names to encode phase/plan information (e.g., `alice/phase-05-plan-02`)
- After merge, each developer regenerates their local STATE.md based on completed work

**Warning signs:**
- Frequent merge conflicts in .planning/STATE.md
- STATE.md shows work from multiple developers with conflicting phase numbers
- Developers manually resolving STATE.md conflicts on every pull

**Alternative approach:** Create per-developer STATE files (`STATE-alice.md`, `STATE-bob.md`) that are committed, but this violates single-source-of-truth principle. Better to treat STATE.md as local cache that can be regenerated.

### Pitfall 2: Phase Directory Conflicts When Working on Same Phase

**What goes wrong:** Two developers work on the same phase simultaneously (e.g., both planning Phase 5), creating conflicting PLAN.md files or directory structures in `.planning/phases/05-*/`.

**Why it happens:** Phase directory structure assumes linear execution. When parallelized, multiple developers may create incompatible plan sequences or overwrite each other's work.

**How to avoid:**
- Use branch-per-developer workflow: each developer works in their own branch
- Adopt plan namespacing: `05-01-alice-PLAN.md` vs `05-01-bob-PLAN.md`
- Coordinate phase assignments: Alice owns phases 1-5, Bob owns phases 6-10
- Use pre-commit hooks to detect conflicting phase artifacts before push

**Warning signs:**
- Multiple XX-01-PLAN.md files with different content in history
- Merge conflicts in phase YAML frontmatter (different creators, timestamps)
- Lost work because one developer's plan was overwritten by another's

**Best practice:** Treat phase planning as single-threaded within a phase number, but allow parallel work on different phases. If both developers need to plan Phase 5, split into Phase 5a and 5b, or have one developer plan while the other reviews.

### Pitfall 3: Worktree Confusion with Submodules

**What goes wrong:** Using Git worktrees in repositories with submodules causes errors, corrupted submodule state, or inability to move worktrees.

**Why it happens:** Git documentation explicitly states: "Multiple checkout in general is still experimental, and the support for submodules is incomplete. It is NOT recommended to make multiple checkouts of a superproject."

**How to avoid:**
- Avoid Git submodules in projects using worktree-based collaboration
- If submodules required, use multiple clones instead of worktrees
- Use npm workspaces, pnpm workspaces, or Nx monorepos instead of Git submodules

**Warning signs:**
- Submodule directories missing or corrupted in worktrees
- `git submodule update` failing in worktrees
- Inability to move worktrees containing submodules

**Alternative:** Modern JavaScript projects should use npm/pnpm workspaces for multi-package management rather than Git submodules. This avoids the worktree-submodule compatibility issue entirely.

### Pitfall 4: Lockfile Conflicts in Distributed Teams

**What goes wrong:** Multiple developers working with different Node.js/npm versions generate incompatible package-lock.json files, causing merge conflicts and CI failures.

**Why it happens:** npm v7+ uses lockfileVersion 3, npm v6 uses lockfileVersion 1. Regenerating the lockfile with different npm versions creates conflicts even when dependencies haven't changed.

**How to avoid:**
- Pin npm version in .nvmrc or package.json engines field
- Add lockfileVersion check to pre-commit hooks
- Regenerate lockfile with consistent npm version in CI
- Use `npm ci` in CI instead of `npm install` (fails if lockfile inconsistent)

**Warning signs:**
- Frequent package-lock.json conflicts despite no dependency changes
- CI failures with "package-lock.json out of date" errors
- Developers using different npm versions locally

**Best practice:**
```json
// package.json
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

```bash
# .nvmrc
20.11.0
```

```yaml
# .github/workflows/ci.yml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version-file: '.nvmrc'
```

### Pitfall 5: Force-Push Destroying Other Developers' Work

**What goes wrong:** Developer force-pushes their branch after rebasing, destroying commits from other developers who pushed to the same branch.

**Why it happens:** Rebasing rewrites commit history. Force-pushing overwrites remote branch with rewritten history, discarding any commits not in local branch.

**How to avoid:**
- Never rebase branches others are working on (only rebase personal branches)
- Use `git push --force-with-lease` instead of `git push --force` (fails if remote has commits you don't have)
- Adopt branch-per-developer workflow (no shared feature branches)
- Protect main branch with branch protection rules (block force pushes)

**Warning signs:**
- Commits mysteriously disappearing from branch history
- Developers losing work after another developer's force-push
- Git showing "your branch and origin have diverged"

**Safe rebase workflow:**
```bash
# Only rebase your own branch that no one else is working on
git checkout alice/phase-5
git fetch origin
git rebase origin/main  # Update base, rewrite branch history
git push --force-with-lease origin alice/phase-5  # Safe force-push

# Never do this on shared branches:
git checkout main
git rebase ...  # DANGER: rewrites shared history
git push --force  # DANGER: destroys others' work
```

### Pitfall 6: Merge Conflicts in Binary Files or Generated Artifacts

**What goes wrong:** Git cannot automatically merge binary files (images, compiled files) or large generated artifacts, requiring manual resolution.

**Why it happens:** Three-way merge only works on text files where Git can compare line-by-line. Binary files must be resolved by choosing one version.

**How to avoid:**
- Don't commit generated artifacts to Git (add to .gitignore)
- Regenerate artifacts after merge instead of committing them
- For binary assets, use Git LFS (Large File Storage) with merge drivers
- Coordinate binary file changes through communication (Slack, PR comments)

**Warning signs:**
- Merge conflicts in node_modules/, dist/, build/ directories
- Conflicts in image files, PDFs, or other binaries
- Manual resolution required every time two developers change same binary

**Best practice:**
```gitignore
# .gitignore - Don't commit generated artifacts
node_modules/
dist/
build/
*.log
coverage/
.DS_Store

# But DO commit source files
!src/
!gsd/
!.planning/phases/
```

## Code Examples

Verified patterns from official sources:

### Creating Branch-Per-Developer Workflow

```bash
# Source: https://git-scm.com/docs/git-worktree

# Alice initializes her worktree for Phase 5
git worktree add ../worktrees/alice-phase-5 -b alice/phase-5

# Bob initializes his worktree for Phase 6
git worktree add ../worktrees/bob-phase-6 -b bob/phase-6

# List all active worktrees
git worktree list
# /path/to/project                [main]
# /path/to/worktrees/alice-phase-5  [alice/phase-5]
# /path/to/worktrees/bob-phase-6    [bob/phase-6]

# Alice completes Phase 5, cleans up worktree
cd /path/to/project
git worktree remove ../worktrees/alice-phase-5  # Deletes worktree directory
git branch -d alice/phase-5  # Optional: delete branch after merge
```

### Detecting Conflicts Before Merge

```bash
# Source: https://git-scm.com/docs/git-merge

# Check if merge would create conflicts (dry-run)
git merge --no-commit --no-ff alice/phase-5
git diff --cached  # Show what would be merged
git merge --abort  # Cancel dry-run merge

# Alternative: use merge-base to find common ancestor
MERGE_BASE=$(git merge-base main alice/phase-5)
git diff $MERGE_BASE..main  # Changes in main since branch point
git diff $MERGE_BASE..alice/phase-5  # Changes in alice's branch
```

### Safe Three-Way Merge with Conflict Resolution

```bash
# Source: https://git-scm.com/book/en/v2/Git-Tools-Advanced-Merging

# Merge alice's work with conflict resolution options
git checkout main
git pull origin main  # Ensure latest

# Merge with automatic conflict resolution favoring our version
git merge -X ours alice/phase-5

# Or favor their version
git merge -X theirs alice/phase-5

# Or merge with rename detection (default in ort)
git merge --strategy=ort alice/phase-5

# If conflicts occur, resolve manually:
git status  # Shows conflicted files
# Edit files to resolve conflicts
git add .planning/phases/05-*/
git commit  # Complete merge
```

### Conventional Commit with Multiple Authors

```bash
# Source: https://www.conventionalcommits.org/ and https://docs.github.com/articles/creating-a-commit-with-multiple-authors

git commit -m "feat(phase-12): implement worktree-based collaboration

Added support for multiple developers working in isolated worktrees.
Each developer has their own branch and workspace directory.
STATE.md kept as local working state (not committed).

Changes:
- Created collaboration-manager.js for worktree coordination
- Updated guidelines to recommend branch-per-developer workflow
- Added pre-commit hooks for conflict detection

BREAKING CHANGE: STATE.md no longer committed to Git. Each developer
maintains their own STATE.md in their worktree.

Co-authored-by: Alice Smith <alice@example.com>
Co-authored-by: Bob Jones <bob@example.com>"
```

### Pre-Commit Hook Configuration

```yaml
# Source: https://pre-commit.com/
# .pre-commit-config.yaml

repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      # Prevent merge conflict markers
      - id: check-merge-conflict

      # Prevent commits to protected branches
      - id: no-commit-to-branch
        args: ['--branch', 'main']

      # Validate JSON/YAML structure
      - id: check-json
        files: \.(json|jsonc)$
      - id: check-yaml
        files: \.(yml|yaml)$

      # Check for case-insensitive filename conflicts
      - id: check-case-conflict

  # Enforce Conventional Commits
  - repo: https://github.com/compilerla/conventional-pre-commit
    rev: v3.0.0
    hooks:
      - id: conventional-pre-commit
        stages: [commit-msg]
```

### Worktree Setup Script for New Developers

```javascript
// Source: Git worktree patterns adapted for GSD
// gsd/scripts/setup-worktree.js

import { spawn } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs/promises';

const execAsync = promisify(spawn);

/**
 * Set up a new worktree for a developer to work on a phase
 * @param {string} developerName - Developer's name for branch naming
 * @param {number} phaseNumber - Phase number to work on
 * @param {string} worktreesDir - Directory to create worktrees in
 */
export async function setupWorktree(developerName, phaseNumber, worktreesDir = '../worktrees') {
  const branchName = `${developerName}/phase-${String(phaseNumber).padStart(2, '0')}`;
  const worktreePath = path.join(worktreesDir, `${developerName}-phase-${phaseNumber}`);

  // Create worktree
  await execAsync('git', [
    'worktree', 'add',
    '-b', branchName,
    worktreePath
  ]);

  console.log(`✅ Created worktree: ${worktreePath}`);
  console.log(`   Branch: ${branchName}`);

  // Create local .planning directory with gitignored STATE.md
  const planningDir = path.join(worktreePath, '.planning');
  await fs.mkdir(planningDir, { recursive: true });

  // Create local .gitignore to exclude STATE.md
  const gitignorePath = path.join(planningDir, '.gitignore');
  await fs.writeFile(gitignorePath, 'STATE.md\n', 'utf-8');

  console.log(`✅ Initialized local .planning/ directory`);
  console.log(`   STATE.md will be kept as local working state`);

  // Instructions for developer
  console.log(`\nNext steps:`);
  console.log(`1. cd ${worktreePath}`);
  console.log(`2. Work on your phase`);
  console.log(`3. Commit phase artifacts (PLAN.md, code, etc.)`);
  console.log(`4. Push to ${branchName}`);
  console.log(`5. Create PR to merge into main`);
}

/**
 * List all active worktrees
 */
export async function listWorktrees() {
  const { stdout } = await execAsync('git', ['worktree', 'list']);
  return stdout.toString();
}

/**
 * Clean up completed worktree
 * @param {string} worktreePath - Path to worktree to remove
 */
export async function cleanupWorktree(worktreePath) {
  await execAsync('git', ['worktree', 'remove', worktreePath]);
  console.log(`✅ Removed worktree: ${worktreePath}`);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| recursive merge strategy | ort merge strategy | Git 2.33.0 (Aug 2021) | Fewer merge conflicts, better rename detection, faster performance |
| Multiple repository clones | Git worktrees | Git 2.5.0 (Jul 2015) | Saves disk space, faster switching, shared .git directory |
| Free-form commit messages | Conventional Commits | v1.0.0 (2019) | Enables automation (changelog, versioning), better traceability |
| Manual pre-commit checks | pre-commit framework | 2014+ | Automated validation, consistent across team, catches issues early |
| Single-author commits | Co-authored-by trailers | GitHub added 2018 | Clear attribution for pair programming, AI assistance tracking |
| Centralized state servers | Git-native distributed workflows | CRDT research 2020+ | Offline-capable, no single point of failure, automatic conflict resolution |

**Deprecated/outdated:**
- **recursive merge strategy:** Replaced by ort in Git 2.33.0. Using `git merge --strategy=recursive` now redirects to ort.
- **git-flow workflow:** Considered heavyweight for modern continuous deployment. Feature branch workflow with rebase is more common.
- **Committing lockfiles to .gitignore:** Modern practice is to commit lockfiles for reproducibility, but validate versions match.
- **Force-push without lease:** `git push --force` is dangerous. Use `git push --force-with-lease` to prevent destroying others' work.

## Open Questions

Things that couldn't be fully resolved:

1. **CRDT Integration for Real-Time Collaboration**
   - What we know: CRDTs (Conflict-free Replicated Data Types) like Yjs and Automerge provide automatic conflict resolution for real-time collaborative editing, similar to Google Docs
   - What's unclear: Whether CRDT overhead is worth it for GSD's use case (developers work in separate phases, not editing same files simultaneously)
   - Recommendation: Start with Git-native workflow (branch-per-developer). Consider CRDTs only if real-time collaborative planning becomes a requirement

2. **STATE.md Synchronization Across Worktrees**
   - What we know: Each worktree should have independent STATE.md for local progress tracking. STATE.md should not be committed to Git.
   - What's unclear: How developers discover what phases others are working on without committing STATE.md
   - Recommendation: Use Git branch names to encode phase information (`alice/phase-05`), use `git worktree list` to see active work, coordinate through external channels (Slack, PR descriptions)

3. **Phase Artifact Merge Conflicts in Non-Text Files**
   - What we know: Git's three-way merge only works on text files. Binary files (images, compiled artifacts) require manual resolution.
   - What's unclear: Whether GSD will generate any non-text artifacts that need merging
   - Recommendation: Keep all GSD artifacts as text (Markdown, YAML, JSON, JavaScript). If binary assets needed, use Git LFS with custom merge drivers or coordinate through communication

4. **Offline Conflict Detection**
   - What we know: Git handles offline work well (commit locally, push later). Conflicts detected at push/pull time.
   - What's unclear: Whether developers want earlier warning about potential conflicts before pushing
   - Recommendation: Implement optional `check-for-conflicts` script that developers can run manually to compare their local branch against latest main using `git merge --no-commit --no-ff` dry-run

5. **Workspace Quota Management**
   - What we know: Git worktrees share .git directory, saving disk space. Each worktree still requires full working directory copy.
   - What's unclear: How to manage disk space when many developers create many worktrees
   - Recommendation: Document worktree cleanup workflow (`git worktree prune`). Consider implementing automatic cleanup for merged branches using Git hooks or CI.

## Sources

### Primary (HIGH confidence)
- [Git worktree documentation](https://git-scm.com/docs/git-worktree) - Official Git documentation on worktree feature
- [Git merge strategies](https://git-scm.com/docs/merge-strategies) - Official documentation on ort strategy and conflict resolution
- [GitHub multiple authors](https://docs.github.com/articles/creating-a-commit-with-multiple-authors) - Official GitHub documentation on Co-authored-by trailers
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) - Official specification for commit message format
- [pre-commit framework](https://pre-commit.com/) - Official pre-commit hook framework documentation
- [Git Distributed Workflows](https://git-scm.com/book/en/v2/Distributed-Git-Distributed-Workflows) - Official Git Book on distributed collaboration patterns

### Secondary (MEDIUM confidence)
- [Atlassian Git Workflow tutorials](https://www.atlassian.com/git/tutorials/comparing-workflows) - Industry-standard Git workflow documentation (verified with official Git docs)
- [monorepo.tools](https://monorepo.tools/) - Monorepo coordination patterns (task orchestration, caching, atomic commits)
- [Using Git Worktrees for Multi-Feature Development with AI Agents](https://www.nrmitchi.com/2025/10/using-git-worktrees-for-multi-feature-development-with-ai-agents/) - 2025 article on worktrees with AI coding agents
- [GitHub branch protection rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule) - Official GitHub documentation
- [Terraform state management best practices](https://www.xavor.com/blog/terraform-state-management/) - File-based state conflict patterns (verified problem domain)

### Tertiary (LOW confidence - context only)
- [Hakia Git Workflows 2026](https://www.hakia.com/engineering/git-workflows/) - 2026 forward-looking article (not yet verified)
- [Best CRDT Libraries 2025](https://velt.dev/blog/best-crdt-libraries-real-time-data-sync) - CRDT overview (marked for validation)
- [Taskfile coordination](https://taskfile.dev/) - Task runner coordination (adjacent problem domain)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Git documentation, GitHub official docs, widely adopted standards (Conventional Commits)
- Architecture: HIGH - Verified patterns from Git official docs, Atlassian tutorials, monorepo tools documentation
- Pitfalls: HIGH - Based on official Git warnings (submodules + worktrees), common collaboration problems documented in multiple sources
- State of the art: HIGH - Git release notes, changelog documentation, official feature announcements
- Open questions: MEDIUM - CRDTs are established technology but unclear fit for GSD use case, STATE.md synchronization is novel problem

**Research date:** 2026-01-23
**Valid until:** 30 days (Git and collaboration patterns are stable, but tooling evolves)

**Key findings verified:**
- Git worktrees are official feature since Git 2.5.0 (2015), marked experimental for submodules
- ort merge strategy is default since Git 2.33.0 (2021), replaces recursive
- Conventional Commits v1.0.0 is stable standard (2019)
- Co-authored-by trailers officially supported by GitHub (2018), GitLab, Bitbucket
- pre-commit framework is de facto standard for Git hook automation
- Branch protection rules supported by all major Git hosting platforms (GitHub, GitLab, Bitbucket, Azure DevOps)
