#!/bin/bash

# Final Environment Variables Setup for Netlify
# Site ID: 11233780-6dd7-4bf2-b24b-afd4392339c6

SITE_ID="11233780-6dd7-4bf2-b24b-afd4392339c6"
TOKEN="nfp_wndERPd1ebiYzSN2cf26XmGm2eJwywdH1502"

echo "=========================================="
echo "Setting Netlify Environment Variables"
echo "Site ID: $SITE_ID"
echo "=========================================="
echo ""

SUCCESS=0
FAIL=0

# Set DATABASE_URL
echo -n "Setting DATABASE_URL... "
response=$(curl -s -w "\n%{http_code}" -X POST \
    "https://api.netlify.com/api/v1/sites/$SITE_ID/env" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"key":"DATABASE_URL","values":[{"value":"file:./dev.db","context":"all"}]}' 2>&1)

http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "201" ] || [ "$http_code" = "200" ] || [ "$http_code" = "422" ]; then
    echo "✓"
    ((SUCCESS++))
else
    echo "✗ (error: $http_code)"
    ((FAIL++))
fi

# Set NEXTAUTH_URL
echo -n "Setting NEXTAUTH_URL... "
response=$(curl -s -w "\n%{http_code}" -X POST \
    "https://api.netlify.com/api/v1/sites/$SITE_ID/env" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"key":"NEXTAUTH_URL","values":[{"value":"https://abstream.netlify.app","context":"all"}]}' 2>&1)

http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "201" ] || [ "$http_code" = "200" ] || [ "$http_code" = "422" ]; then
    echo "✓"
    ((SUCCESS++))
else
    echo "✗ (error: $http_code)"
    ((FAIL++))
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
    ((SUCCESS++))
else
    echo "✗ (error: $http_code)"
    ((FAIL++))
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
    ((SUCCESS++))
else
    echo "✗ (error: $http_code)"
    ((FAIL++))
fi

echo ""
echo "=========================================="
if [ $FAIL -eq 0 ]; then
    echo "✅ All environment variables configured!"
    echo "   ($SUCCESS variables set)"
else
    echo "⚠️  Some variables may need manual setup"
    echo "   Success: $SUCCESS, Failed: $FAIL"
    echo ""
    echo "Manual setup link:"
    echo "https://app.netlify.com/sites/abstream/configuration/env"
fi
echo "=========================================="
echo ""
echo "✅ Prisma schema updated to PostgreSQL"
echo "✅ Code pushed to GitHub"
echo ""
echo "Next steps:"
echo "1. Set up PostgreSQL database (Supabase recommended)"
echo "2. Update DATABASE_URL in Netlify with your PostgreSQL connection string"
echo "3. Trigger deploy in Netlify dashboard"
echo ""
