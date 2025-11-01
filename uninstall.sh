#!/usr/bin/env bash
set -euo pipefail

echo "Uninstalling ccs..."
echo ""

# Remove symlink
if [[ -L "$HOME/.local/bin/ccs" ]]; then
  rm "$HOME/.local/bin/ccs"
  echo "✅ Removed: $HOME/.local/bin/ccs"
elif [[ -f "$HOME/.local/bin/ccs" ]]; then
  rm "$HOME/.local/bin/ccs"
  echo "✅ Removed: $HOME/.local/bin/ccs"
else
  echo "ℹ️  No ccs binary found at $HOME/.local/bin/ccs"
fi

# Remove uninstall symlink
if [[ -L "$HOME/.local/bin/ccs-uninstall" ]]; then
  rm "$HOME/.local/bin/ccs-uninstall"
  echo "✅ Removed: $HOME/.local/bin/ccs-uninstall"
fi

# Remove share directory
if [[ -d "$HOME/.local/share/ccs" ]]; then
  rm -rf "$HOME/.local/share/ccs"
  echo "✅ Removed: $HOME/.local/share/ccs"
fi

# Ask about config
if [[ -f "$HOME/.ccs.json" ]]; then
  read -p "Remove config file ~/.ccs.json? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm "$HOME/.ccs.json"
    echo "✅ Removed: $HOME/.ccs.json"
  else
    echo "ℹ️  Kept: $HOME/.ccs.json"
  fi
else
  echo "ℹ️  No config file found at $HOME/.ccs.json"
fi

echo ""
echo "✅ Uninstall complete!"
