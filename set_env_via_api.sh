#!/bin/bash

# Direct API method to set environment variables
# Usage: ./set_env_via_api.sh YOUR_TOKEN

SITE_ID="11233780-6dd7-4bf2-b24b-afd4392339c6"
TOKEN="$1"

if [ -z "$TOKEN" ]; then
    echo "Usage: ./set_env_via_api.sh YOUR_TOKEN"
    exit 1
fi

echo "=========================================="
echo "Setting Netlify Environment Variables"
echo "=========================================="
echo ""

echo "Setting environment variables..."

SUCCESS_COUNT=0
FAIL_COUNT=0

# Set DATABASE_URL
echo -n "Setting DATABASE_URL... "
response=$(curl -s -w "\n%{http_code}" -X POST \
    "https://api.netlify.com/api/v1/sites/$SITE_ID/env" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"key":"DATABASE_URL","values":[{"value":"file:./dev.db","context":"all"}]}' 2>&1)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
    echo "✓"
    ((SUCCESS_COUNT++))
elif echo "$body" | grep -q "already exists" || [ "$http_code" = "422" ]; then
    echo "✓ (already exists)"
    ((SUCCESS_COUNT++))
elif [ "$http_code" = "404" ]; then
    echo "✗ (site not found - check site ID)"
    ((FAIL_COUNT++))
else
    echo "✗ (error: $http_code)"
    ((FAIL_COUNT++))
fi

# Set NEXTAUTH_URL
echo -n "Setting NEXTAUTH_URL... "
response=$(curl -s -w "\n%{http_code}" -X POST \
    "https://api.netlify.com/api/v1/sites/$SITE_ID/env" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"key":"NEXTAUTH_URL","values":[{"value":"https://bright-dasik-821173.netlify.app","context":"all"}]}' 2>&1)

http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "201" ] || [ "$http_code" = "200" ] || [ "$http_code" = "422" ]; then
    echo "✓"
    ((SUCCESS_COUNT++))
else
    echo "✗ (error: $http_code)"
    ((FAIL_COUNT++))
fi

# Set NEXTAUTH_SECRET
echo -n "Setting NEXTAUTH_SECRET... "
response=$(curl -s -w "\n%{http_code}" -X POST \
    "https://api.netlify.com/api/v1/sites/$SITE_ID/env" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"key":"NEXTAUTH_SECRET","values":[{"value":"eye6rx7dN8gUpwsqYx+p/kWli0puo1r+A7q7RuNdTmI=","context":"all"}]}' 2>&1)

http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "201" ] || [ "$http_code" = "200" ] || [ "$http_code" = "422" ]; then
    echo "✓"
    ((SUCCESS_COUNT++))
else
    echo "✗ (error: $http_code)"
    ((FAIL_COUNT++))
fi

# Set NODE_ENV
echo -n "Setting NODE_ENV... "
response=$(curl -s -w "\n%{http_code}" -X POST \
    "https://api.netlify.com/api/v1/sites/$SITE_ID/env" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"key":"NODE_ENV","values":[{"value":"production","context":"all"}]}' 2>&1)

http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "201" ] || [ "$http_code" = "200" ] || [ "$http_code" = "422" ]; then
    echo "✓"
    ((SUCCESS_COUNT++))
else
    echo "✗ (error: $http_code)"
    ((FAIL_COUNT++))
fi

echo ""
echo "=========================================="
if [ $FAIL_COUNT -eq 0 ]; then
    echo "✅ All environment variables set successfully!"
    echo "   ($SUCCESS_COUNT variables configured)"
else
    echo "⚠️  Setup completed with some issues"
    echo "   Success: $SUCCESS_COUNT, Failed: $FAIL_COUNT"
fi
echo "=========================================="
echo ""
echo "Verify at: https://app.netlify.com/sites/$SITE_ID/configuration/env"
echo ""
echo "Next steps:"
echo "1. Go to: https://app.netlify.com/sites/$SITE_ID/deploys"
echo "2. Click 'Trigger deploy' → 'Deploy site'"
echo "3. Wait for build to complete"
echo ""
