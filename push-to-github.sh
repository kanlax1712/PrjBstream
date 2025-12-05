#!/bin/bash
# Script to push to GitHub (Secure version)
# This script securely handles GitHub tokens without exposing them in shell history

set -e  # Exit on error

# Cleanup function to ensure temporary files are removed even on interruption
cleanup() {
    if [ -n "$TEMP_ASKPASS" ] && [ -f "$TEMP_ASKPASS" ]; then
        rm -f "$TEMP_ASKPASS"
    fi
    unset GITHUB_TOKEN
    unset GIT_ASKPASS
    unset GIT_TERMINAL_PROMPT
}

# Register cleanup function to run on exit or interruption
trap cleanup EXIT INT TERM

echo "🚀 Pushing to GitHub..."
echo ""
echo "GitHub requires a Personal Access Token (not password)"
echo ""
echo "Quick steps:"
echo "1. Go to: https://github.com/settings/tokens"
echo "2. Generate new token (classic)"
echo "3. Select 'repo' scope"
echo "4. Copy the token"
echo ""

# Read token silently (won't appear in terminal or history)
# -s flag prevents echo, so token won't be visible while typing
read -sp "Enter your GitHub Personal Access Token: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Token required. Exiting."
    exit 1
fi

# Set remote URL without token (use HTTPS)
git remote set-url origin https://github.com/kanlax1712/bstream.git

# Create a temporary credential helper script
# This prevents token from appearing in process lists or command history
TEMP_ASKPASS=$(mktemp)
cat > "$TEMP_ASKPASS" <<EOF
#!/bin/bash
echo "$GITHUB_TOKEN"
EOF
chmod +x "$TEMP_ASKPASS"

# Use GIT_ASKPASS to provide credentials securely
# This method prevents token from appearing in:
# - Shell history (.bash_history, .zsh_history)
# - Process lists (ps command)
# - System logs
export GIT_ASKPASS="$TEMP_ASKPASS"
export GIT_TERMINAL_PROMPT=0

# Push using credential helper
echo "📤 Pushing to GitHub..."
git push origin main

# Cleanup is handled by trap function above

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo "🔗 View at: https://github.com/kanlax1712/bstream"
else
    echo "❌ Push failed. Check your token."
    exit 1
fi
