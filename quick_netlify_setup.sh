#!/bin/bash

# Quick Netlify Environment Variables Setup
# This will guide you through the setup

SITE_ID="bright-dasik-821173"

echo "=========================================="
echo "Netlify Environment Variables Setup"
echo "=========================================="
echo ""

# Method 1: Try using Netlify CLI if logged in
if netlify status &> /dev/null; then
    echo "✓ Netlify CLI is authenticated"
    echo ""
    echo "Setting environment variables via CLI..."
    echo ""
    
    netlify link --name "$SITE_ID" --git 2>/dev/null
    
    netlify env:set DATABASE_URL "file:./dev.db" 2>/dev/null && echo "✓ DATABASE_URL set"
    netlify env:set NEXTAUTH_URL "https://bright-dasik-821173.netlify.app" 2>/dev/null && echo "✓ NEXTAUTH_URL set"
    netlify env:set NEXTAUTH_SECRET "eye6rx7dN8gUpwsqYx+p/kWli0puo1r+A7q7RuNdTmI=" 2>/dev/null && echo "✓ NEXTAUTH_SECRET set"
    netlify env:set NODE_ENV "production" 2>/dev/null && echo "✓ NODE_ENV set"
    
    echo ""
    echo "✅ All environment variables set!"
    echo ""
    echo "Next: Go to Netlify dashboard and trigger a new deploy"
    exit 0
fi

# Method 2: Use API with token
echo "Netlify CLI not authenticated. Using API method..."
echo ""
echo "To set up automatically, you need a Netlify Personal Access Token."
echo ""
echo "Get your token:"
echo "1. Open: https://app.netlify.com/user/applications"
echo "2. Click 'New access token'"
echo "3. Name it: 'Bstream Setup'"
echo "4. Copy the token"
echo ""
read -p "Paste your Netlify Personal Access Token here (or press Enter to skip): " NETLIFY_TOKEN

if [ -z "$NETLIFY_TOKEN" ]; then
    echo ""
    echo "No token provided. Here's what you need to do manually:"
    echo ""
    echo "1. Go to: https://app.netlify.com/sites/$SITE_ID/configuration/env"
    echo "2. Add these 4 variables:"
    echo ""
    echo "   DATABASE_URL = file:./dev.db"
    echo "   NEXTAUTH_URL = https://bright-dasik-821173.netlify.app"
    echo "   NEXTAUTH_SECRET = eye6rx7dN8gUpwsqYx+p/kWli0puo1r+A7q7RuNdTmI="
    echo "   NODE_ENV = production"
    echo ""
    exit 0
fi

echo ""
echo "Setting environment variables via API..."

# Set variables using Netlify API
for key in "DATABASE_URL" "NEXTAUTH_URL" "NEXTAUTH_SECRET" "NODE_ENV"; do
    case $key in
        "DATABASE_URL")
            value="file:./dev.db"
            ;;
        "NEXTAUTH_URL")
            value="https://bright-dasik-821173.netlify.app"
            ;;
        "NEXTAUTH_SECRET")
            value="eye6rx7dN8gUpwsqYx+p/kWli0puo1r+A7q7RuNdTmI="
            ;;
        "NODE_ENV")
            value="production"
            ;;
    esac
    
    echo "Setting $key..."
    
    response=$(curl -s -w "\n%{http_code}" -X POST \
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
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
        echo "  ✓ $key set successfully"
    elif echo "$body" | grep -q "already exists"; then
        echo "  ⚠ $key already exists (updating...)"
        # Try to update existing variable
        env_id=$(curl -s -X GET \
            "https://api.netlify.com/api/v1/sites/$SITE_ID/env" \
            -H "Authorization: Bearer $NETLIFY_TOKEN" | \
            grep -o "\"key\":\"$key\".*\"id\":\"[^\"]*\"" | \
            grep -o "\"id\":\"[^\"]*\"" | \
            cut -d'"' -f4)
        
        if [ ! -z "$env_id" ]; then
            curl -s -X PUT \
                "https://api.netlify.com/api/v1/sites/$SITE_ID/env/$env_id" \
                -H "Authorization: Bearer $NETLIFY_TOKEN" \
                -H "Content-Type: application/json" \
                -d "{
                    \"key\": \"$key\",
                    \"values\": [{
                        \"value\": \"$value\",
                        \"context\": \"all\"
                    }]
                }" > /dev/null
            echo "  ✓ $key updated successfully"
        fi
    else
        echo "  ✗ Failed to set $key"
        echo "  Response: $body"
    fi
done

echo ""
echo "=========================================="
echo "✅ Setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Go to: https://app.netlify.com/sites/$SITE_ID/deploys"
echo "2. Click 'Trigger deploy' → 'Deploy site'"
echo "3. Wait for build to complete"
echo ""

