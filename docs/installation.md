# CCS Installation Guide

## npm Package Installation (Recommended)

### Cross-Platform Installation

**macOS / Linux / Windows**
```bash
npm install -g @kaitranntt/ccs
```

**Compatible with all package managers:**
- `npm install -g @kaitranntt/ccs`
- `yarn global add @kaitranntt/ccs`
- `pnpm add -g @kaitranntt/ccs`
- `bun add -g @kaitranntt/ccs`

**Benefits of npm installation:**
- ✅ Cross-platform compatibility
- ✅ Automatic PATH configuration
- ✅ Easy updates: `npm update -g @kaitranntt/ccs`
- ✅ Clean uninstall: `npm uninstall -g @kaitranntt/ccs`
- ✅ Version pinning support
- ✅ Dependency management

## One-Liner Installation (Traditional)

### macOS / Linux

```bash
# Short URL (via CloudFlare)
curl -fsSL ccs.kaitran.ca/install | bash

# Or direct from GitHub
curl -fsSL https://raw.githubusercontent.com/kaitranntt/ccs/main/installers/install.sh | bash
```

**Install Location**:
- **All Unix Systems**: `~/.local/bin/ccs` (auto-configures PATH for bash, zsh, fish)

### Windows PowerShell

```powershell
# Short URL (via CloudFlare)
irm ccs.kaitran.ca/install.ps1 | iex

# Or direct from GitHub
irm https://raw.githubusercontent.com/kaitranntt/ccs/main/installers/install.ps1 | iex
```

**Auto PATH Configuration**:
- Installer detects your shell (bash, zsh, fish) automatically
- Adds `~/.local/bin` to PATH in shell profile if needed
- Idempotent: safe to run multiple times
- Shows reload instructions after install

**Notes**:
- Unix installer supports both direct execution (`./install.sh`) and piped installation (`curl | bash`)
- Windows installer requires PowerShell 5.1+ (pre-installed on Windows 10+)
- No sudo required on any platform

## Git Clone Installation

### macOS / Linux

```bash
git clone https://github.com/kaitranntt/ccs.git
cd ccs
./installers/install.sh
```

### Windows PowerShell

```powershell
git clone https://github.com/kaitranntt/ccs.git
cd ccs
.\installers\install.ps1
```

**Note**: Works with git worktrees and submodules - the installer detects both `.git` directory and `.git` file.

## Manual Installation

### macOS / Linux

```bash
# Create directory
mkdir -p ~/.local/bin

# Download script
curl -fsSL https://raw.githubusercontent.com/kaitranntt/ccs/main/ccs -o ~/.local/bin/ccs
chmod +x ~/.local/bin/ccs

# Add to PATH (choose your shell)
# For bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# For zsh
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# For fish
echo 'set -gx PATH $HOME/.local/bin $PATH' >> ~/.config/fish/config.fish
```

### Windows PowerShell

```powershell
# Create directory
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.ccs"

# Download script
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/kaitranntt/ccs/main/ccs.ps1" -OutFile "$env:USERPROFILE\.ccs\ccs.ps1"

# Add to PATH (restart terminal after)
$Path = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$Path;$env:USERPROFILE\.ccs", "User")
```

## What Gets Installed

**Executable Location**:
- macOS / Linux: `~/.local/bin/ccs` (symlink to `~/.ccs/ccs`)
- Windows: `%USERPROFILE%\.ccs\ccs.ps1`

**Configuration Directory** (`~/.ccs/`):
```bash
~/.ccs/
├── ccs                     # Main executable (symlink target)
├── config.json             # Profile configuration
├── config.json.backup      # Single backup (overwrites each install)
├── glm.settings.json       # GLM profile
├── VERSION                 # Version file
├── uninstall.sh            # Uninstaller
└── .claude/                # Claude Code integration
    ├── commands/ccs.md     # /ccs meta-command
    └── skills/             # Delegation skills
```

## Upgrade CCS

### macOS / Linux

```bash
# From git clone
cd ccs && git pull && ./install.sh

# From curl install
curl -fsSL ccs.kaitran.ca/install | bash
```

### Windows PowerShell

```powershell
# From git clone
cd ccs
git pull
.\install.ps1

# From irm install
irm ccs.kaitran.ca/install.ps1 | iex
```

## Auto PATH Configuration

The installer automatically configures your shell PATH:

**Supported Shells**:
- bash (`.bashrc` or `.bash_profile`)
- zsh (`.zshrc`)
- fish (`.config/fish/config.fish`)

**How It Works**:
1. Detects your current shell from `$SHELL` environment variable
2. Checks if `~/.local/bin` already in PATH
3. If not, adds appropriate export to shell profile
4. Shows reload instructions

**Idempotent**:
- Safe to run multiple times
- Checks for existing CCS PATH entry before adding
- Won't create duplicate entries

**Manual PATH Setup** (if auto-config fails):

Bash/Zsh:
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc  # or ~/.zshrc
source ~/.bashrc  # or source ~/.zshrc
```

Fish:
```fish
echo 'set -gx PATH $HOME/.local/bin $PATH' >> ~/.config/fish/config.fish
```

## Requirements

### macOS / Linux
- `bash` 3.2+
- `jq` (JSON processor, optional for enhanced features)
- [Claude CLI](https://docs.claude.com/en/docs/claude-code/installation)

### Windows
- PowerShell 5.1+ (pre-installed on Windows 10+)
- [Claude CLI](https://docs.claude.com/en/docs/claude-code/installation)

### Installing jq (macOS / Linux, optional)

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

**Note**:
- jq enhances GLM profile creation but is not required
- Windows uses PowerShell's built-in JSON support - no jq needed
- Installer creates basic templates without jq