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

# Determine which remote to use (check if prjbstream exists, otherwise use origin)
if git remote get-url prjbstream >/dev/null 2>&1; then
    REMOTE_NAME="prjbstream"
    REMOTE_URL="https://github.com/kanlax1712/PrjBstream.git"
else
    REMOTE_NAME="origin"
    REMOTE_URL="https://github.com/kanlax1712/bstream.git"
fi

# Set remote URL without token (use HTTPS)
# This removes any embedded tokens that might be expired
git remote set-url "$REMOTE_NAME" "$REMOTE_URL"

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
echo "📤 Pushing to GitHub (remote: $REMOTE_NAME)..."

# Capture exit code immediately after git push
# This must be done before any other commands to preserve the exit status
# With set -e, we need to temporarily disable it to capture the exit code
set +e
git push "$REMOTE_NAME" main
PUSH_EXIT_CODE=$?
set -e

# Check the captured exit code (not $? which could be affected by other commands)
if [ $PUSH_EXIT_CODE -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo "🔗 View at: $REMOTE_URL"
    exit 0
else
    echo "❌ Push failed. Check your token and permissions."
    echo "   Remote: $REMOTE_NAME"
    echo "   URL: $REMOTE_URL"
    echo ""
    echo "💡 Troubleshooting:"
    echo "   1. Verify your token has 'repo' scope"
    echo "   2. Check if token is expired"
    echo "   3. Ensure you have push access to the repository"
    exit $PUSH_EXIT_CODE
fi

# Cleanup is handled by trap function above (runs on exit)
