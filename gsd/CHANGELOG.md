# Changelog

All notable changes to GSD for Tabnine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Upgrade system for seamless GSD updates (Phase 11)
- Version detection and update notification
- Dual-mode upgrade source (npm registry + local filesystem)
- Automatic fallback when npm unavailable
- Backup and rollback capabilities with validation
- File merge strategies preserving user customizations
- Migration runner for breaking changes
- "upgrade GSD" trigger phrase
- Dry-run preview before applying changes

## [1.0.0] - 2026-01-22

Initial release of GSD for Tabnine.

### Added
- Foundation & Templates (Phase 1)
  - Project structure and core templates
  - State management and progress tracking
  - Planning artifact scaffolding
- Core Infrastructure (Phase 2)
  - File operations and process runner
  - State manager with validation
  - Template renderer and guideline loader
  - Cross-platform compatibility (Windows, macOS, Linux)
- Workflow Orchestration (Phase 3)
  - Trigger detection system
  - Workflow orchestrator
  - Artifact validation
  - Resume and checkpoint support
- Advanced Features (Phase 4)
  - Approval gates
  - Research synthesis
  - Automated research capabilities
- Discussion & Context System (Phase 6)
  - Question bank for phase context gathering
  - Context loader and parser
  - CONTEXT.md template
- Enhanced Research Infrastructure (Phase 7)
  - Web scraping with Playwright fallback
  - Source validation and confidence scoring
  - Finding deduplication
  - Multi-domain research coordination
- Verification & Quality System (Phase 8)
  - Goal validator
  - Quality checker (linting, coverage)
  - Verification orchestrator
  - Report generation
- Improved Initialization Terminology (Phase 9)
  - Updated trigger phrases
  - Clearer user messaging
- Path Handling Bug Fixes (Phase 10)
  - Cross-platform path resolution
  - Robust file operations

---

## Upgrading

### Automatic Upgrade (npm)

If npm registry is available:

1. **Run upgrade:**
   Say "upgrade GSD" to Tabnine agent, or run manually:
   ```bash
   cd gsd
   node scripts/upgrade-manager.js
   ```

2. **Auto-detection:**
   - System checks npm registry connectivity
   - Downloads latest version automatically
   - Shows preview before applying
   - Requires confirmation

3. **The upgrade will:**
   - Create backup in `.gsd-backups/backup-<timestamp>/`
   - Preserve your `.gsd-config.json` customizations
   - Update templates, guidelines, scripts, and package.json
   - Run any migrations for breaking changes
   - Validate the upgrade

4. **Verify everything works:**
   Test your workflows. If issues occur:
   ```bash
   # Rollback to backup
   node scripts/backup-manager.js restore .gsd-backups/backup-<timestamp>/
   ```

5. **Clean up:**
   After verifying, remove backup:
   ```bash
   rm -rf .gsd-backups/backup-<timestamp>/
   ```

### Manual Upgrade (Local)

If npm unavailable or behind firewall:

1. **Download new version:**
   ```bash
   # From GitHub releases
   wget https://github.com/yourusername/gsd-for-tabnine/archive/v1.2.0.tar.gz
   tar -xzf v1.2.0.tar.gz
   mv gsd-for-tabnine-1.2.0 ../gsd-upgrade
   ```

2. **Run upgrade:**
   ```bash
   cd gsd
   node scripts/upgrade-manager.js
   ```
   The system will auto-detect the local source in `../gsd-upgrade/`

3. **Or specify path explicitly:**
   ```bash
   GSD_UPGRADE_PATH=../gsd-for-tabnine-1.2.0/gsd node scripts/upgrade-manager.js
   ```

### Dry-Run Preview

Test upgrade without applying changes:
```bash
node scripts/upgrade-manager.js --dry-run
```

Shows:
- Upgrade source (npm or local)
- Current and target versions
- Files to update/preserve/merge
- Migrations to run

### Safety Features

- ✅ Auto-detects best source (npm → local fallback)
- ✅ Automatic backup before upgrade
- ✅ Backup validation before proceeding
- ✅ Preserves `.gsd-config.json` customizations
- ✅ Dry-run preview available
- ✅ Automatic rollback on failure
- ✅ Works offline with local upgrades

### Migration Notes

#### 1.0.0 → 1.1.0 (Example - Future)
- No breaking changes
- New features: X, Y, Z
- Config changes: None

#### 1.1.0 → 2.0.0 (Example - Future)
- **BREAKING CHANGE:** Config format updated
- Migration script automatically updates `.gsd-config.json`
- New workflow: research-phase.md

### Versioning Policy

- **Major version (X.0.0):** Breaking changes requiring migration
- **Minor version (0.X.0):** New features, backward compatible
- **Patch version (0.0.X):** Bug fixes, no new features

### Troubleshooting

**"No upgrade source available"**
- Check internet connection for npm access
- Or download manually and place in `../gsd-upgrade/`
- Or set `GSD_UPGRADE_PATH` environment variable

**"Backup validation failed"**
- Upgrade will not proceed without valid backup
- Check disk space and permissions
- Review error messages for specific issues

**"Upgrade failed" (automatic rollback)**
- Your installation has been restored from backup
- Review error messages
- Report issue if it persists

**Manual recovery needed**
- If rollback fails, manually restore:
  ```bash
  rm -rf gsd/
  cp -r .gsd-backups/backup-<timestamp>/ gsd/
  ```

[Unreleased]: https://github.com/yourusername/gsd-for-tabnine/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/gsd-for-tabnine/releases/tag/v1.0.0
