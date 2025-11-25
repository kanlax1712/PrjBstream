#!/bin/bash
# Script to push to GitHub

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
read -p "Enter your GitHub Personal Access Token: " GITHUB_TOKEN

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Token required. Exiting."
    exit 1
fi

# Set remote URL with token
git remote set-url origin https://${GITHUB_TOKEN}@github.com/kanlax1712/bstream.git

# Push
echo "📤 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo "🔗 View at: https://github.com/kanlax1712/bstream"
else
    echo "❌ Push failed. Check your token."
fi
