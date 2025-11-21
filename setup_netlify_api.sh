#!/bin/bash

# Alternative: Setup using Netlify API with Personal Access Token
# This method doesn't require CLI login

echo "=========================================="
echo "Netlify Environment Variables Setup (API)"
echo "=========================================="
echo ""

SITE_ID="bright-dasik-821173"

echo "This script uses Netlify API to set environment variables."
echo ""
echo "You need a Netlify Personal Access Token."
echo ""
echo "To get a token:"
echo "1. Go to: https://app.netlify.com/user/applications"
echo "2. Click 'New access token'"
echo "3. Give it a name (e.g., 'Bstream Setup')"
echo "4. Copy the token"
echo ""
read -p "Enter your Netlify Personal Access Token: " NETLIFY_TOKEN

if [ -z "$NETLIFY_TOKEN" ]; then
    echo "❌ Token is required"
    exit 1
fi

echo ""
echo "Setting environment variables..."

# Environment variables to set
declare -A ENV_VARS=(
    ["DATABASE_URL"]="file:./dev.db"
    ["NEXTAUTH_URL"]="https://bright-dasik-821173.netlify.app"
    ["NEXTAUTH_SECRET"]="eye6rx7dN8gUpwsqYx+p/kWli0puo1r+A7q7RuNdTmI="
    ["NODE_ENV"]="production"
)

# Set each variable
for key in "${!ENV_VARS[@]}"; do
    value="${ENV_VARS[$key]}"
    echo "Setting $key..."
    
    response=$(curl -s -X POST \
        "https://api.netlify.com/api/v1/sites/$SITE_ID/env" \
        -H "Authorization: Bearer $NETLIFY_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"$key\",
            \"values\": [{
                \"value\": \"$value\",
                \"context\": \"all\"
            }]
        }")
    
    if echo "$response" | grep -q "id"; then
        echo "  ✓ $key set successfully"
    else
        echo "  ✗ Failed to set $key"
        echo "  Response: $response"
    fi
done

echo ""
echo "=========================================="
echo "✅ Setup complete!"
echo "=========================================="
echo ""
echo "Next: Trigger a new deploy in Netlify dashboard"
echo ""

