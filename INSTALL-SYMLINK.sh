#!/bin/bash
# Create symlink for Tabnine guidelines
# Usage: Run from your project root (where gsd/ directory exists)

# Get absolute paths
PROJECT_ROOT="$(pwd)"
GSD_GUIDELINES="$PROJECT_ROOT/gsd/guidelines"
TABNINE_GUIDELINES="$PROJECT_ROOT/.tabnine/guidelines"

# Check if gsd/guidelines exists
if [ ! -d "$GSD_GUIDELINES" ]; then
  echo "❌ Error: gsd/guidelines not found at $GSD_GUIDELINES"
  echo "Make sure you're running from project root with gsd/ directory"
  exit 1
fi

# Create .tabnine directory if needed
mkdir -p .tabnine

# Remove existing symlink/directory if present
if [ -L "$TABNINE_GUIDELINES" ] || [ -d "$TABNINE_GUIDELINES" ]; then
  echo "Removing existing .tabnine/guidelines..."
  rm -rf "$TABNINE_GUIDELINES"
fi

# Create symlink with absolute paths (works better on Windows)
echo "Creating symlink..."
echo "  From: .tabnine/guidelines"
echo "  To:   $GSD_GUIDELINES"

ln -s "$GSD_GUIDELINES" "$TABNINE_GUIDELINES"

# Verify
if [ -L "$TABNINE_GUIDELINES" ]; then
  echo "✓ Symlink created successfully!"
  echo ""
  echo "Verification:"
  ls -l .tabnine/guidelines
  echo ""
  echo "Files in symlinked directory:"
  ls .tabnine/guidelines/
else
  echo "❌ Failed to create symlink"
  echo ""
  echo "Alternative: Copy files instead"
  echo "  mkdir -p .tabnine/guidelines"
  echo "  cp gsd/guidelines/*.md .tabnine/guidelines/"
  exit 1
fi
