#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARE_DIR="$HOME/.local/share/ccs"

# Determine if running from git clone or curl
if [[ -d "$SCRIPT_DIR/.git" ]]; then
  INSTALL_METHOD="git"
else
  INSTALL_METHOD="standalone"
fi

echo "Installing ccs to $INSTALL_DIR..."
echo ""

# Create install dir if needed
mkdir -p "$INSTALL_DIR"
mkdir -p "$SHARE_DIR"

# Make executable first
chmod +x "$SCRIPT_DIR/ccs"

# Symlink ccs script
ln -sf "$SCRIPT_DIR/ccs" "$INSTALL_DIR/ccs"

# Verify installation
if [[ ! -L "$INSTALL_DIR/ccs" ]]; then
  echo "❌ Error: Failed to create symlink at $INSTALL_DIR/ccs"
  echo "Check directory permissions and try again."
  exit 1
fi

# Install uninstall script
if [[ -f "$SCRIPT_DIR/uninstall.sh" ]]; then
  cp "$SCRIPT_DIR/uninstall.sh" "$SHARE_DIR/uninstall.sh"
  chmod +x "$SHARE_DIR/uninstall.sh"
  ln -sf "$SHARE_DIR/uninstall.sh" "$INSTALL_DIR/ccs-uninstall"
elif [[ "$INSTALL_METHOD" == "standalone" ]]; then
  # Fetch uninstall script for curl installs
  echo "Fetching uninstall script..."
  if command -v curl &> /dev/null; then
    curl -fsSL https://raw.githubusercontent.com/kaitranntt/ccs/main/uninstall.sh -o "$SHARE_DIR/uninstall.sh"
    chmod +x "$SHARE_DIR/uninstall.sh"
    ln -sf "$SHARE_DIR/uninstall.sh" "$INSTALL_DIR/ccs-uninstall"
  else
    echo "⚠️  Warning: curl not found, skipping uninstall script"
  fi
fi

# Check if in PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
  echo "⚠️  Warning: $INSTALL_DIR is not in PATH"
  echo ""
  echo "Add to your shell profile (~/.bashrc or ~/.zshrc):"
  echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
  echo ""
fi

echo "✅ Installation complete!"
echo ""
echo "Next steps:"
if [[ ! -f "$HOME/.ccs.json" ]]; then
  if [[ -f "$SCRIPT_DIR/.ccs.example.json" ]]; then
    echo "1. Copy example config: cp $SCRIPT_DIR/.ccs.example.json ~/.ccs.json"
  else
    echo "1. Create config at ~/.ccs.json:"
    echo "   {"
    echo "     \"profiles\": {"
    echo "       \"glm\": \"~/.claude/glm.settings.json\","
    echo "       \"sonnet\": \"~/.claude/sonnet.settings.json\","
    echo "       \"default\": \"~/.claude/settings.json\""
    echo "     }"
    echo "   }"
  fi
  echo "2. Edit ~/.ccs.json with your profile mappings"
  echo "3. Run: ccs [profile]"
else
  echo "1. Config already exists at ~/.ccs.json"
  echo "2. Run: ccs [profile]"
fi
echo ""
echo "Example:"
echo "  ccs           # Uses default profile"
echo "  ccs glm       # Uses glm profile"
echo "  ccs sonnet --verbose"
echo ""
echo "To uninstall: ccs-uninstall"
