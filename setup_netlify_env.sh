#!/bin/bash

# Netlify Environment Variables Setup Script
# This script sets up all required environment variables in Netlify

echo "=========================================="
echo "Netlify Environment Variables Setup"
echo "=========================================="
echo ""

SITE_ID="bright-dasik-821173"

# Check if Netlify CLI is available
if ! command -v netlify &> /dev/null; then
    echo "Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Check if logged in
if ! netlify status &> /dev/null; then
    echo "⚠️  Not logged in to Netlify"
    echo ""
    echo "Please complete the login process:"
    echo "1. Run: netlify login"
    echo "2. Complete authentication in browser"
    echo "3. Then run this script again"
    echo ""
    exit 1
fi

echo "✓ Logged in to Netlify"
echo ""

# Link to site
echo "Linking to site: $SITE_ID"
netlify link --name "$SITE_ID" --git

echo ""
echo "Setting environment variables..."
echo ""

# Set environment variables
netlify env:set DATABASE_URL "file:./dev.db" --context production
netlify env:set NEXTAUTH_URL "https://bright-dasik-821173.netlify.app" --context production
netlify env:set NEXTAUTH_SECRET "eye6rx7dN8gUpwsqYx+p/kWli0puo1r+A7q7RuNdTmI=" --context production
netlify env:set NODE_ENV "production" --context production

# Also set for all contexts
netlify env:set DATABASE_URL "file:./dev.db"
netlify env:set NEXTAUTH_URL "https://bright-dasik-821173.netlify.app"
netlify env:set NEXTAUTH_SECRET "eye6rx7dN8gUpwsqYx+p/kWli0puo1r+A7q7RuNdTmI="
netlify env:set NODE_ENV "production"

echo ""
echo "=========================================="
echo "✅ Environment variables set successfully!"
echo "=========================================="
echo ""
echo "Variables set:"
echo "  - DATABASE_URL"
echo "  - NEXTAUTH_URL"
echo "  - NEXTAUTH_SECRET"
echo "  - NODE_ENV"
echo ""
echo "Next step: Trigger a new deploy in Netlify dashboard"
echo "Or run: netlify deploy --prod"
echo ""

