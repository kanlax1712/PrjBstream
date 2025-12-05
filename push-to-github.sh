#!/bin/bash
# Script to push to GitHub (Secure version)
# This script uses git credential helper to securely store tokens

set -e  # Exit on error

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
read -sp "Enter your GitHub Personal Access Token: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Token required. Exiting."
    exit 1
fi

# Set remote URL without token (use HTTPS)
git remote set-url origin https://github.com/kanlax1712/bstream.git

# Use git credential helper to store token securely
# This stores the credential in git's credential store (not in shell history)
echo "https://${GITHUB_TOKEN}@github.com" | git credential approve

# Alternative: Use GIT_ASKPASS environment variable (more secure)
# This prevents token from appearing in process lists
export GIT_ASKPASS="echo"
export GIT_TERMINAL_PROMPT=0

# Push using credential helper
echo "📤 Pushing to GitHub..."
GIT_TERMINAL_PROMPT=0 git push origin main

# Clear the token from memory immediately after use
unset GITHUB_TOKEN
unset GIT_ASKPASS

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo "🔗 View at: https://github.com/kanlax1712/bstream"
    echo ""
    echo "💡 Tip: Your token is stored in git credential helper."
    echo "   To remove it later: git credential reject < https://github.com"
else
    echo "❌ Push failed. Check your token."
    # Clear credential on failure
    echo "https://github.com" | git credential reject
    exit 1
fi
