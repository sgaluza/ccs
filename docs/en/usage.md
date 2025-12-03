# CCS Usage Guide

## Why CCS?

**Built for developers with both Claude subscription and GLM Coding Plan.**

### Two Real Use Cases

#### 1. Task-Appropriate Model Selection

**Claude Sonnet 4.5** excels at:
- Complex architectural decisions
- System design and planning
- Debugging tricky issues
- Code reviews requiring deep reasoning

**GLM 4.6** works great for:
- Simple bug fixes
- Straightforward implementations
- Routine refactoring
- Documentation writing

**With CCS**: Switch models based on task complexity, maximize quality while managing costs.

```bash
ccs           # Planning new feature architecture
# Got the plan? Implement with GLM:
ccs glm       # Write the straightforward code
```

#### 2. Rate Limit Management

If you have both Claude subscription and GLM Coding Plan, you know the pain:
- Claude hits rate limit mid-project
- You manually copy GLM config to `~/.claude/settings.json`
- 5 minutes later, need to switch back
- Repeat 10x per day

**CCS solves this**:
- One command to switch: `ccs` (default) or `ccs glm` (fallback)
- Keep both configs saved as profiles
- Switch in <1 second
- No file editing, no copy-paste, no mistakes

### Features

- Instant profile switching (Claude ↔ GLM)
- Pass-through all Claude CLI args
- Smart setup: detects your current provider
- Auto-creates configs during install
- **Simplified architecture**: 35% code reduction with optimized performance
- **Unified spawn logic**: Consolidated process execution for reliability
- **Streamlined error handling**: Clear, direct error messages
- No proxies, no magic—just efficient Node.js implementation

## Basic Usage

### Switching Profiles

```bash
# Works on macOS, Linux, and Windows
ccs           # Use Claude subscription (default)
ccs glm       # Use GLM fallback
```

**Windows Note**: Commands work identically in PowerShell, CMD, and Git Bash.

### With Arguments

All args after profile name pass directly to Claude CLI:

```bash
ccs glm --verbose
ccs /plan "add feature"
ccs glm /code "implement feature"
```

### Utility Commands

```bash
ccs --version    # Show enhanced version info with installation details
ccs --help       # Show CCS-specific help documentation
ccs update       # Check for and install updates
ccs update --force    # Force reinstall from latest (skip update checks)
ccs update --beta     # Install from beta channel (npm only)
```

**Example `--version` Output**:
```
CCS (Claude Code Switch) v2.4.4

Installation:
  Location: /home/user/.local/bin/ccs -> /home/user/.ccs/ccs
  Config: ~/.ccs/config.json

Documentation: https://github.com/kaitranntt/ccs
License: MIT

Run 'ccs --help' for usage information
```

**Enhanced `--help` Features**:
- CCS-specific documentation (no longer delegates to Claude CLI)
- Comprehensive usage examples and flag descriptions
- Installation and uninstallation instructions
- Platform-specific guidance
- Configuration file location and troubleshooting

### Update Command Details

The `ccs update` command provides flexible update management with beta channel support:

**Standard Update**:
```bash
ccs update
```
- Checks for updates using cached results (24-hour cache)
- Only updates if a newer version is available
- Preserves package manager preference (npm, yarn, pnpm, bun)

**Force Reinstall**:
```bash
ccs update --force
```
- Skips all update checks and cache validation
- Reinstalls from the target channel immediately
- Useful for:
  - Troubleshooting installation issues
  - Ensuring clean installation
  - Switching between channels without waiting
- Automatically clears package manager cache before reinstalling

**Beta Channel** (npm installation only):
```bash
ccs update --beta
```
- Installs from the `@dev` npm tag instead of `@latest`
- Access to cutting-edge features and fixes before stable release
- **Shows stability warnings**:
  ```
  [!] Installing from @dev channel (unstable)
  [!] Not recommended for production use
  [!] Use `ccs update` (without --beta) to return to stable
  ```
- Can be combined with `--force`: `ccs update --force --beta`
- Switches to dev channel for future standard updates until reverted

**Installation Method Detection**:
- **npm installations**: Full support for all flags (`--force`, `--beta`)
  - Fetches versions from npm registry with tag-specific queries
  - Installs from `@kaitranntt/ccs@latest` or `@kaitranntt/ccs@dev`
- **Direct installer installations**: Limited support
  - Only supports `--force` flag
  - Shows error for `--beta` with migration guidance:
    ```
    [X] --beta flag requires npm installation

    Current installation method: direct installer
    To use beta releases, install via npm:

      npm install -g @kaitranntt/ccs
      ccs update --beta

    Or continue using stable releases via direct installer.
    ```

**Uninstall (Recommended)**:
```bash
# npm (recommended)
npm uninstall -g @kaitranntt/ccs

# Legacy uninstallers (for native installs only)
# macOS/Linux: curl -fsSL ccs.kaitran.ca/uninstall | bash
# Windows: irm ccs.kaitran.ca/uninstall | iex
```

**Platform-Specific Locations**:
- macOS: `/usr/local/bin/ccs`
- Linux: `~/.local/bin/ccs`
- Windows: `%USERPROFILE%\.ccs\ccs.ps1`

### 🚧 Features in Development

#### .claude/ Integration

Task delegation via `--install` / `--uninstall` flags currently under development.

**Status**: Testing incomplete, not available in current release

**Implementation**: Core functionality exists but disabled pending testing

**Timeline**: No ETA - follow GitHub issues for updates

**For Now**: Use direct profile switching (`ccs glm`) for model selection

**Output Example**:
```
┌─ Installing CCS Commands & Skills
│  Source: /path/to/ccs/.claude
│  Target: /home/user/.claude
│
│  Installing commands...
│  │  [OK]  Installed command: ccs.md
│
│  Installing skills...
│  │  [OK]  Installed skill: ccs-delegation
└─

[OK] Installation complete!
  Installed: 2 items
  Skipped: 0 items (already exist)

You can now use the /ccs command in Claude CLI for task delegation.
Example: /ccs glm /plan 'add user authentication'
```

**Notes**:
- Output uses ASCII symbols ([OK], [i], [X]) instead of emojis
- Colored output on TTY terminals (disable with `NO_COLOR=1`)
- Existing files skipped automatically (safe to re-run)

## Task Delegation

**CCS includes intelligent task delegation** via the `/ccs` meta-command:

```bash
# Delegate planning to GLM (saves Sonnet tokens)
/ccs glm /plan "add user authentication"

# Delegate coding to GLM
/ccs glm /code "implement auth endpoints"

# Quick questions with Haiku
/ccs haiku /ask "explain this error"
```

**Benefits**:
- ✅ Save tokens by delegating simple tasks to cheaper models
- ✅ Use right model for each task automatically
- ✅ Reusable commands across all projects (user-scope)
- ✅ Seamless integration with existing workflows

## Real Workflows

### Task-Based Model Selection

**Scenario**: Building a new payment integration feature

```bash
# Step 1: Architecture & Planning (needs Claude's intelligence)
ccs
/plan "Design payment integration with Stripe, handle webhooks, errors, retries"
# → Claude Sonnet 4.5 thinks deeply about edge cases, security, architecture

# Step 2: Implementation (straightforward coding, use GLM)
ccs glm
/code "implement the payment webhook handler from the plan"
# → GLM 4.6 writes the code efficiently, saves Claude usage

# Step 3: Code Review (needs deep analysis)
ccs
/review "check the payment handler for security issues"
# → Claude Sonnet 4.5 catches subtle vulnerabilities

# Step 4: Bug Fixes (simple)
ccs glm
/fix "update error message formatting"
# → GLM 4.6 handles routine fixes
```

**Result**: Best model for each task, lower costs, better quality.

### Rate Limit Management

```bash
# Working on complex refactoring with Claude
ccs
/plan "refactor authentication system"

# Claude hits rate limit mid-task
# → Error: Rate limit exceeded

# Switch to GLM instantly
ccs glm
# Continue working without interruption

# Rate limit resets? Switch back
ccs
```

## How It Works

The simplified CCS architecture provides efficient profile switching:

1. **Argument parsing**: Smart detection of profile vs CLI flags
2. **Configuration lookup**: Reads settings path from `~/.ccs/config.json`
3. **Claude detection**: Optimized executable discovery across platforms
4. **Unified execution**: Single `execClaude()` function spawns process with `--settings <path> [args]`

### Recent Optimizations

- **Consolidated spawn logic**: Single function eliminates code duplication
- **Removed redundant validation**: Streamlined security while maintaining safety
- **Simplified error handling**: Direct console.error for clarity and performance
- **Optimized platform detection**: Centralized cross-platform logic

No magic. No file modification. Efficient delegation. Works identically across all platforms with improved performance and maintainability.

## API Reference

### Update Command API

The `ccs update` command provides comprehensive update management with the following API:

#### Syntax
```bash
ccs update [options]
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--force` | flag | false | Skip update checks and force reinstall |
| `--beta` | flag | false | Install from beta channel (`@dev` tag) |

#### Return Codes

| Code | Meaning |
|------|---------|
| 0 | Success (no update needed or update installed) |
| 1 | Error (update failed, network issues, or invalid flags) |

#### Examples

```bash
# Standard update check
ccs update

# Force reinstall from latest stable
ccs update --force

# Switch to beta channel
ccs update --beta

# Force reinstall from beta channel
ccs update --force --beta
```

#### Implementation Details

**Version Fetching**:
- npm installations: Queries `https://registry.npmjs.org/@kaitranntt/ccs/{tag}`
- Direct installations: Queries GitHub API releases endpoint
- Cache: 24-hour cache to avoid excessive API calls

**Error Handling**:
- Network timeouts: 5-second timeout for all HTTP requests
- Missing npm tag: Graceful fallback with informative error
- Installation conflicts: Clear guidance for resolution

**Platform Support**:
- npm: Full feature support (all flags and channels)
- yarn/pnpm/bun: Full npm compatibility
- Direct installers: Limited to `--force` flag only