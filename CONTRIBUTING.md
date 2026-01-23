# Contributing to GSD for Tabnine

Thank you for your interest in contributing! This document provides guidelines for contributions.

## Ways to Contribute

- 🐛 Report bugs via [GitHub Issues](https://github.com/(replace-with-your-username)/gsd-for-tabnine/issues)
- 💡 Suggest features or improvements
- 📝 Improve documentation
- 🔧 Submit pull requests

## Development Setup

1. **Fork and clone:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/gsd-for-tabnine.git
   cd gsd-for-tabnine/gsd
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) for automated versioning:

- `feat: add new feature` → minor version bump (1.1.0)
- `fix: resolve bug` → patch version bump (1.0.1)
- `BREAKING CHANGE: ...` → major version bump (2.0.0)

**Format:** `type(scope): description`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test additions/changes
- `refactor`: Code refactoring
- `chore`: Maintenance tasks

**Examples:**
```
feat(state-manager): add resume from checkpoint
fix(template-renderer): handle missing variables
docs(readme): update installation instructions
test(validator): add artifact validation tests
```

## Pull Request Process

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes with descriptive commits
3. Run tests: `npm test`
4. Ensure all tests pass
5. Push and create pull request
6. Wait for CI to pass and review

## Testing Guidelines

- All new features require tests
- Bug fixes should include regression tests
- Integration tests live in `gsd/scripts/integration-test.js`
- Run full test suite before submitting PR

## Code Style

- Use ESM modules (`import`/`export`, not `require`)
- Follow existing code patterns
- Use async/await, not callbacks
- Cross-platform compatible (use `path` module)
- Add JSDoc comments for exported functions

## Questions?

Open a [GitHub Discussion](https://github.com/(replace-with-your-username)/gsd-for-tabnine/discussions) for questions.

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions.

---

By contributing, you agree that your contributions will be licensed under the MIT License.
