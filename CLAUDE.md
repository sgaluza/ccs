# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CCS (Claude Code Switch) is a lightweight CLI wrapper enabling instant switching between **multiple Claude subscription accounts** (work, personal, team) and alternative models (GLM 4.6, Kimi for Coding). Built on v3.0 login-per-profile architecture where each profile is an isolated Claude instance.

**Primary Installation Methods** (highest priority):
- **npm Package** (recommended): `npm install -g @kaitranntt/ccs` (cross-platform)
- macOS/Linux: `curl -fsSL ccs.kaitran.ca/install | bash`
- Windows: `irm ccs.kaitran.ca/install | iex`

## Core Design Principles

**YAGNI** (You Aren't Gonna Need It): No features "just in case"
**KISS** (Keep It Simple): Simple bash/PowerShell/Node.js, no complexity
**DRY** (Don't Repeat Yourself): One source of truth (config.json)
**CLI-First UX**: The primary user experience is through the command-line interface

The tool does ONE thing: enable instant switching between Claude accounts and alternative models. Never add features that violate these principles.

### CLI Documentation Requirement (CRITICAL)

**All functionality changes MUST update `--help` output across all implementations:**
- `bin/ccs.js` - handleHelpCommand() function
- `lib/ccs` - show_help() function (bash)
- `lib/ccs.ps1` - Show-Help function (PowerShell)

This is non-negotiable. The CLI help is the primary documentation users reference. If a feature exists but isn't documented in `--help`, it effectively doesn't exist for users.

## Key Constraints

1. **NO EMOJIS in terminal output** - Use ASCII symbols ([OK], [!], [X], [i]) for compatibility
2. **TTY-aware color output** - Colors only when output to terminal, respects NO_COLOR env var
3. **Unified install location** (v2.2.0+):
   - All Unix: `~/.local/bin` (auto PATH config, no sudo)
   - Windows: `%USERPROFILE%\.ccs`
4. **Auto PATH configuration** - Detects shell (bash/zsh/fish), adds to profile automatically
5. **Idempotent installations** - Running install scripts multiple times must be safe
6. **Non-invasive** - Never modify `~/.claude/settings.json`
7. **Cross-platform parity** - Identical behavior on Unix/Linux/macOS/Windows
8. **Edge case handling** - Handle all scenarios gracefully (see tests/edge-cases.sh)

## Architecture

### v3.0 Key Features

**Login-Per-Profile Model**: Each profile is an isolated Claude instance where users login directly via `ccs auth create <profile>`. No credential copying, no vault encryption.

**Two Profile Types**:
1. **Settings-based** (models): GLM, Kimi, default - uses `--settings` flag
2. **Account-based** (Claude accounts): work, personal, team - uses `CLAUDE_CONFIG_DIR`

**Concurrent Sessions**: Multiple profiles can run simultaneously in different terminals via isolated config directories.

### Implementation Variants

**npm package**: Pure Node.js (bin/ccs.js) using child_process.spawn
**Traditional install**: Platform-specific bash (lib/ccs) or PowerShell (lib/ccs.ps1)

### File Structure

**Key Files**:
- `package.json`: npm package manifest with bin field configuration and postinstall script
- `bin/ccs.js`: Cross-platform Node.js entry point (npm package)
- `scripts/postinstall.js`: Auto-creates config files during npm install (idempotent)
- `lib/ccs` (bash) / `lib/ccs.ps1` (PowerShell): Platform-specific executable wrappers
- `installers/install.sh` / `installers/install.ps1`: Traditional installation scripts
- `installers/uninstall.sh` / `installers/uninstall.ps1`: Removal scripts
- `VERSION`: Single source of truth for version (format: MAJOR.MINOR.PATCH)
- `.claude/`: Commands and skills for Claude Code integration

**Executable Locations**:
- macOS / Linux: `~/.local/bin/ccs` (symlink to `~/.ccs/ccs`)
- Windows: `%USERPROFILE%\.ccs\ccs.ps1`

**Configuration Directory**:
```
~/.ccs/
├── ccs                     # Main executable (or ccs.ps1 on Windows)
├── config.json             # Settings-based profile mappings
├── profiles.json           # Account-based profile registry (v3.0)
├── instances/              # Isolated Claude instances (v3.0)
│   ├── work/               # Each profile gets own directory
│   ├── personal/
│   └── team/
├── config.json.backup      # Single backup (overwrites on each install)
├── glm.settings.json       # GLM profile template
├── kimi.settings.json      # Kimi profile template
├── VERSION                 # Version file copy
├── uninstall.sh            # Uninstaller (or ccs-uninstall.ps1 on Windows)
└── .claude/                # Claude Code integration
    ├── commands/ccs.md
    └── skills/ccs-delegation/
```

### v3.0 Technical Implementation

**Account-Based Profiles** (v3.0):
```bash
# Create profile (opens Claude CLI for login)
ccs auth create work

# Creates ~/.ccs/instances/work/ with:
# - settings.json (Claude's config)
# - session files
# - todo lists
# - logs

# Usage: Set CLAUDE_CONFIG_DIR before spawning Claude CLI
CLAUDE_CONFIG_DIR=~/.ccs/instances/work claude [args]
```

**Settings-Based Profiles** (legacy, still supported):
```bash
# Usage: Pass --settings flag to Claude CLI
claude --settings ~/.ccs/glm.settings.json [args]
```

**Profile Detection Logic**:
1. Check if profile exists in `profiles.json` (account-based)
2. If yes → use `CLAUDE_CONFIG_DIR` method
3. If no → check `config.json` (settings-based)
4. If yes → use `--settings` method
5. If no → show error with available profiles

## Development Commands

### Version Management
```bash
# Bump version (updates VERSION, install.sh, install.ps1)
./scripts/bump-version.sh [major|minor|patch]

# Get current version
cat VERSION
# or
./scripts/get-version.sh
```

### Testing
```bash
# Comprehensive edge case testing (Unix)
./tests/edge-cases.sh

# Comprehensive edge case testing (Windows)
./tests/edge-cases.ps1
```

### Local Development
```bash
# Test local installation from git repo
./installers/install.sh

# Test with local executable
./ccs --version
./ccs glm --help

# Test npm package locally
npm pack                    # Creates @kaitranntt-ccs-X.Y.Z.tgz
npm install -g @kaitranntt-ccs-X.Y.Z.tgz  # Test installation
ccs --version               # Verify it works
npm uninstall -g @kaitranntt/ccs   # Cleanup
rm @kaitranntt-ccs-X.Y.Z.tgz        # Remove tarball

# Clean test environment
rm -rf ~/.ccs
```

### npm Package Publishing
```bash
# First-time setup (one-time)
npm login                   # Login to npm account
npm token create --type=granular --scope=publish  # Create token
# Add NPM_TOKEN to GitHub Secrets

# Publishing workflow
./scripts/bump-version.sh patch  # Bump version
git add VERSION package.json lib/ccs lib/ccs.ps1 installers/install.sh installers/install.ps1
git commit -m "chore: bump version to X.Y.Z"
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z  # Triggers GitHub Actions publish

# Manual publish (if needed)
npm publish --dry-run    # Test before publishing
npm publish --access public  # Publish to npm registry
```

## Code Standards

### Bash (Unix Systems)
- Compatibility: bash 3.2+ (macOS default)
- Always quote variables: `"$VAR"` not `$VAR`
- Use `[[ ]]` for tests, not `[ ]`
- Use `#!/usr/bin/env bash` shebang
- Set `set -euo pipefail` for safety
- Dependencies: Only `jq` for JSON parsing

### Terminal Output
- **TTY Detection**: Check `[[ -t 2 ]]` before using colors (stderr)
- **NO_COLOR Support**: Respect `${NO_COLOR:-}` environment variable
- **ASCII Symbols Only**: [OK], [!], [X], [i] - no emojis
- **Error Formatting**: Use box borders (╔═╗║╚╝) for critical messages
- **Color Codes**: RED, YELLOW, GREEN, CYAN, BOLD, RESET - disable when not TTY

### PowerShell (Windows)
- Compatibility: PowerShell 5.1+
- Use `$ErrorActionPreference = "Stop"`
- Native JSON parsing via `ConvertFrom-Json` / `ConvertTo-Json`
- No external dependencies required

### Node.js (npm package)
- Compatibility: Node.js 14+
- Use `child_process.spawn` for Claude CLI execution
- Handle SIGINT/SIGTERM for graceful shutdown
- Cross-platform path handling with `path` module

### Version Synchronization
When changing version, update ALL three locations:
1. `VERSION` file
2. `installers/install.sh` (CCS_VERSION variable)
3. `installers/install.ps1` ($CcsVersion variable)

Use `./scripts/bump-version.sh` to update all locations atomically.

## Critical Implementation Details

### Profile Detection Logic
The `ccs` wrapper uses smart detection:
- No args OR first arg starts with `-` → use default profile
- First arg doesn't start with `-` → treat as profile name
- Special flags handled BEFORE profile detection: `--version`, `-v`, `--help`, `-h`
- `ccs auth create <profile>` → create new account-based profile

### Installation Modes
- **Git mode**: Running from cloned repository (symlinks executables)
- **Standalone mode**: Running via curl/irm (downloads from GitHub)

Detection: Check if `ccs` executable exists in script directory or parent.

### Idempotency Requirements
Install scripts must be safe to run multiple times:
- Check existing files before creating
- Use single backup file (no timestamps): `config.json.backup`
- Skip existing `.claude/` folder installation
- Handle both clean and existing installations

### Settings File Format
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "your_api_key",
    "ANTHROPIC_MODEL": "glm-4.6",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.6",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.6",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.6"
  }
}
```

All values must be strings (not booleans/objects) to prevent PowerShell crashes.

### v3.0 Profile Files

**profiles.json** (account-based profiles):
```json
{
  "profiles": {
    "work": "~/.ccs/instances/work",
    "personal": "~/.ccs/instances/personal",
    "team": "~/.ccs/instances/team"
  }
}
```

**config.json** (settings-based profiles):
```json
{
  "profiles": {
    "glm": "~/.ccs/glm.settings.json",
    "kimi": "~/.ccs/kimi.settings.json",
    "default": "~/.claude/settings.json"
  }
}
```

## Common Tasks

### Adding a New Feature
1. Verify it aligns with YAGNI/KISS/DRY principles
2. Implement for both bash/PowerShell and Node.js if applicable
3. **Update `--help` output in ALL three implementations** (bin/ccs.js, lib/ccs, lib/ccs.ps1) - REQUIRED
4. Test on all platforms (macOS, Linux, Windows)
5. Update tests in `tests/edge-cases.sh` and `tests/edge-cases.ps1`
6. Update CONTRIBUTING.md if it affects contributors
7. Update README.md examples if user-facing

### Fixing Bugs
1. Add test case reproducing the bug
2. Fix in both bash/PowerShell and Node.js versions
3. Verify fix doesn't break existing tests
4. Test on all supported platforms

### Releasing New Version
1. Run `./scripts/bump-version.sh [major|minor|patch]`
2. Review changes to VERSION, install.sh, install.ps1
3. Test installation from both git and standalone modes
4. Run full edge case test suite
5. Commit and tag: `git tag v<VERSION>`
6. Push to trigger GitHub Actions: `git push origin main && git push origin v<VERSION>`

## Testing Requirements

Before any PR, verify:
- [ ] Works on macOS (bash)
- [ ] Works on Linux (bash)
- [ ] Works on Windows (PowerShell)
- [ ] Works on Windows (Git Bash)
- [ ] Handles all edge cases in test suite
- [ ] Installation is idempotent
- [ ] No emojis in terminal output (ASCII symbols only)
- [ ] Version displayed correctly with install location
- [ ] Colors work on TTY, disabled when piped
- [ ] NO_COLOR environment variable respected
- [ ] Auto PATH config works for bash, zsh, fish
- [ ] Shell reload instructions shown correctly
- [ ] PATH not duplicated on multiple installs
- [ ] Manual PATH setup instructions clear if auto fails
- [ ] v3.0 concurrent sessions work correctly
- [ ] Instance isolation works (no cross-profile contamination)
- [ ] **`--help` output updated in bin/ccs.js, lib/ccs, and lib/ccs.ps1** (if feature added/changed)
- [ ] **`--help` output consistent across all three implementations**

## Integration with Claude Code

The `.claude/` folder contains:
- `/ccs` command: Meta-command for delegating tasks to different models
- `ccs-delegation` skill: Intelligent task delegation patterns

## Error Handling Philosophy

- Validate early, fail fast with clear error messages
- Show available options when user makes mistake
- Suggest recovery steps (e.g., restore from backup)
- Never leave system in broken state
- For v3.0 profiles: Guide users through `ccs auth create` if profile missing
