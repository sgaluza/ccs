# CCS Test Suite

## Organization

- `native/` - Native installation tests only (curl|bash, irm|iex)
  - `unix/` - Unix/Linux/macOS native tests (37 tests)
  - `windows/` - Windows PowerShell tests
- `npm/` - npm package tests only (39 tests)
  - `postinstall.test.js` - Postinstall behavior tests (Section 10)
  - `cli.test.js` - CLI argument parsing tests
  - `cross-platform.test.js` - Cross-platform compatibility tests
  - `special-commands.test.js` - npm package integration tests
- `shared/` - Shared utilities, fixtures, and unit tests
  - `helpers.sh` - Bash test utilities and functions
  - `test-data.js` - Test data for npm tests
  - `fixtures/` - Test configuration files
  - `unit/` - Unit tests for helper functions (7 tests)

## Running Tests

- **All tests**: `npm test` (83 tests total)
- **npm package only**: `npm run test:npm` (39 tests)
- **Native installation only**: `npm run test:native` (37 tests)
- **Unit tests only**: `npm run test:unit` (7 tests)
- **Master orchestrator**: `npm run test:edge-cases` (backward compatible)

## Test Structure

### Native Tests (`native/`)
Test the traditional installation methods where CCS is installed via:
- Unix/Linux/macOS: `curl | bash` → tests `lib/ccs`
- Windows: `irm | iex` (PowerShell) → tests `lib/ccs.ps1`

These tests use bash/PowerShell scripts and cover Sections 1-9 from the original edge-cases.sh.

**Files**:
- `native/unix/edge-cases.sh` - 37 native Unix tests
- `native/windows/edge-cases.ps1` - Windows PowerShell tests
- `native/unix/install.sh` - Unix installation tests
- `native/windows/install.ps1` - Windows installation tests

### npm Tests (`npm/`)
Test the npm package installation where CCS is installed via:
- npm: `npm install -g @kaitranntt/ccs` → tests `bin/ccs.js`

These tests use Node.js/mocha framework and include Section 10 (postinstall) plus CLI tests.

**Files**:
- `npm/postinstall.test.js` - 6 postinstall behavior tests (Section 10)
- `npm/cli.test.js` - 15 CLI argument parsing tests
- `npm/cross-platform.test.js` - 13 cross-platform compatibility tests
- `npm/special-commands.test.js` - 5 integration tests for npm package

### Shared Resources (`shared/`)
Common test code, data, and helper functions shared across test suites to avoid duplication.

**Files**:
- `shared/helpers.sh` - Bash test utilities and functions
- `shared/test-data.js` - Test data for npm tests
- `shared/fixtures/` - Test configuration files
- `shared/unit/` - 7 unit tests for helper functions

## Test Counts

| Test Type | Count | Location |
|-----------|-------|----------|
| Native Unix | 37 | `native/unix/` |
| npm Package | 39 | `npm/` |
| Unit Tests | 7 | `shared/unit/` |
| **Total** | **83** | **All suites** |

## Backward Compatibility

All existing commands still work:
- `bash tests/edge-cases.sh` - Master orchestrator (runs all tests)
- `npm test` - Now runs comprehensive test suite
- No breaking changes to existing workflows

## Migration Notes

This restructure solves the original problem where Section 10 (npm postinstall tests) was buried in the native `edge-cases.sh` file. Now:
- ✅ Clear separation: npm tests in `npm/`, native in `native/`
- ✅ Targeted execution: `npm run test:npm` vs `npm run test:native`
- ✅ Better organization: Obvious where to add new tests
- ✅ DRY principle: Shared utilities in `shared/`
- ✅ Increased coverage: From 41 to 83 tests