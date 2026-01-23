/**
 * GSD for Tabnine - Main entry point
 *
 * Exports commonly used functions from all modules.
 * For full module access, use subpath imports:
 *   import { readState } from 'gsd-for-tabnine/state-manager'
 */

// State management
export {
  readState,
  writeState,
  updateProgress,
  transitionPhase
} from './state-manager.js';

// Template rendering
export {
  renderTemplate,
  listTemplates
} from './template-renderer.js';

// Guideline loading
export {
  loadGuideline,
  listWorkflows
} from './guideline-loader.js';

// Validation
export {
  validateArtifact,
  validateRequirementCoverage,
  validateStateStructure
} from './validator.js';

// Research (automated)
export {
  performResearch,
  extractFindings,
  mergeManualFindings
} from './researcher.js';

// Research synthesis
export {
  synthesizeResearch,
  assignConfidenceLevel
} from './research-synthesizer.js';

// Version management
export {
  checkForUpdates,
  getCurrentVersion,
  getLatestVersion
} from './version-checker.js';

// Backup and restore
export {
  createBackup,
  restoreBackup,
  listBackups,
  validateBackup
} from './backup-manager.js';

// File merging and upgrade
export {
  mergeConfig,
  determineFileStrategy,
  applyUpgrade
} from './file-merger.js';

// Migration execution
export {
  runMigrations,
  getApplicableMigrations
} from './migration-runner.js';

// Upgrade orchestration
export {
  upgrade,
  previewUpgrade
} from './upgrade-manager.js';
