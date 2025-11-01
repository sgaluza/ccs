# CCS - Claude Code Switch

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bash](https://img.shields.io/badge/bash-3.2%2B-blue.svg)](https://www.gnu.org/software/bash/)
[![GitHub Stars](https://img.shields.io/github/stars/kaitranntt/ccs.svg)](https://github.com/kaitranntt/ccs/stargazers)

> Ultra-simple Claude CLI profile switcher. One command instead of long paths.

**Before**: `claude --settings ~/.claude/glm.settings.json --verbose`
**After**: `ccs glm --verbose`

## Quick Start

**Install** (one-liner):
```bash
curl -fsSL https://raw.githubusercontent.com/kaitranntt/ccs/main/install.sh | bash
```

**Configure**:
```bash
# Edit with your profiles
cat > ~/.ccs.json << 'EOF'
{
  "profiles": {
    "glm": "~/.claude/glm.settings.json",
    "sonnet": "~/.claude/sonnet.settings.json",
    "default": "~/.claude/settings.json"
  }
}
EOF
```

**Use**:
```bash
ccs          # Use default profile
ccs glm      # Use GLM profile
ccs sonnet   # Use Sonnet profile
```

## Why CCS?

Claude CLI's `--settings` flag is powerful but verbose. CCS gives you friendly aliases.

**Features**:
- Single command profile switching
- Pass-through all Claude CLI args
- Zero configuration complexity
- No proxies, no magic—just bash + jq

## Installation

### One-Liner (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/kaitranntt/ccs/main/install.sh | bash
```

### Git Clone

```bash
git clone https://github.com/kaitranntt/ccs.git
cd ccs
./install.sh
```

### Manual

```bash
# Download script
curl -fsSL https://raw.githubusercontent.com/kaitranntt/ccs/main/ccs -o ~/.local/bin/ccs
chmod +x ~/.local/bin/ccs

# Ensure ~/.local/bin in PATH
export PATH="$HOME/.local/bin:$PATH"
```

## Configuration

Create `~/.ccs.json` with profile mappings:

```json
{
  "profiles": {
    "glm": "~/.claude/glm.settings.json",
    "sonnet": "~/.claude/sonnet.settings.json",
    "default": "~/.claude/settings.json"
  }
}
```

Each profile points to a Claude settings JSON file. Create settings files per [Claude CLI docs](https://docs.claude.com/en/docs/claude-code/installation).

## Usage

### Basic

```bash
ccs           # Use default profile (no args)
ccs glm       # Use GLM profile
ccs sonnet    # Use Sonnet profile
```

### With Arguments

All args after profile name pass directly to Claude CLI:

```bash
ccs glm --verbose
ccs sonnet /plan "add feature"
ccs default --model claude-sonnet-4
```

### Custom Config Location

```bash
export CCS_CONFIG=~/my-custom-ccs.json
ccs glm
```

## Use Cases

### Claude Subscription + GLM Coding Plan

Switch between Claude sub and GLM plan:

```json
{
  "profiles": {
    "claude": "~/.claude/claude-sub.settings.json",
    "glm": "~/.claude/glm.settings.json",
    "default": "~/.claude/settings.json"
  }
}
```

```bash
ccs claude   # Use Claude subscription
ccs glm      # Use GLM coding plan
```

### Different Models

```json
{
  "profiles": {
    "sonnet": "~/.claude/sonnet.settings.json",
    "haiku": "~/.claude/haiku.settings.json",
    "default": "~/.claude/settings.json"
  }
}
```

## How It Works

1. Reads profile name (defaults to "default" if omitted)
2. Looks up settings file path in `~/.ccs.json`
3. Executes `claude --settings <path> [remaining-args]`

No magic. No file modification. Pure delegation.

## Requirements

- `bash` 3.2+
- `jq` (JSON processor)
- [Claude CLI](https://docs.claude.com/en/docs/claude-code/installation)

### Installing jq

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt install jq

# Fedora
sudo dnf install jq

# Arch
sudo pacman -S jq
```

## Troubleshooting

### Profile not found

```
Error: Profile 'foo' not found in ~/.ccs.json
```

**Fix**: Add profile to `~/.ccs.json`:
```json
{
  "profiles": {
    "foo": "~/.claude/foo.settings.json"
  }
}
```

### Settings file missing

```
Error: Settings file not found: ~/.claude/foo.settings.json
```

**Fix**: Create settings file or fix path in config.

### jq not installed

```
Error: jq is required but not installed
```

**Fix**: Install jq (see Requirements).

### PATH not set

```
⚠️  Warning: ~/.local/bin is not in PATH
```

**Fix**: Add to `~/.bashrc` or `~/.zshrc`:
```bash
export PATH="$HOME/.local/bin:$PATH"
```
Then `source ~/.bashrc` or restart shell.

### Default profile missing

```
Error: Profile 'default' not found in ~/.ccs.json
```

**Fix**: Add "default" profile or always specify profile name:
```json
{
  "profiles": {
    "default": "~/.claude/settings.json"
  }
}
```

## Uninstallation

```bash
ccs-uninstall
```

Or manual:
```bash
rm ~/.local/bin/ccs
rm ~/.local/bin/ccs-uninstall
rm ~/.ccs.json  # If you want to remove config
```

## Contributing

PRs welcome! Keep it simple (KISS principle).

**Guidelines**:
- Maintain bash 3.2+ compatibility
- No dependencies beyond jq
- Test on macOS and Linux
- Follow existing code style

## Philosophy

- **YAGNI**: No features "just in case"
- **KISS**: Simple bash, no complexity
- **DRY**: One source of truth (config)

This tool does ONE thing well: map profile names to settings files.

## License

MIT © [Kai Tran](https://github.com/kaitranntt)

## Links

- [Claude CLI Docs](https://docs.claude.com/en/docs/claude-code/installation)
- [Report Issues](https://github.com/kaitranntt/ccs/issues)
- [Changelog](https://github.com/kaitranntt/ccs/releases)
