#!/bin/bash
echo "🔍 Checking Google OAuth Configuration..."
echo ""
echo "Environment Variables:"
echo "======================"
[ -f .env.local ] && echo "✅ .env.local exists" || echo "❌ .env.local NOT FOUND"
echo ""

if [ -f .env.local ]; then
  echo "Checking variables in .env.local:"
  grep -q "GOOGLE_CLIENT_ID" .env.local && echo "✅ GOOGLE_CLIENT_ID is set" || echo "❌ GOOGLE_CLIENT_ID is MISSING"
  grep -q "GOOGLE_CLIENT_SECRET" .env.local && echo "✅ GOOGLE_CLIENT_SECRET is set" || echo "❌ GOOGLE_CLIENT_SECRET is MISSING"
  grep -q "NEXTAUTH_URL" .env.local && echo "✅ NEXTAUTH_URL is set" || echo "❌ NEXTAUTH_URL is MISSING"
  grep -q "NEXTAUTH_SECRET" .env.local && echo "✅ NEXTAUTH_SECRET is set" || echo "❌ NEXTAUTH_SECRET is MISSING"
  echo ""
  echo "Current values (first 20 chars):"
  grep "GOOGLE_CLIENT_ID" .env.local | head -1 | sed 's/=.*/=.../' 
  grep "NEXTAUTH_URL" .env.local | head -1
else
  echo "❌ Create .env.local file with:"
  echo "   GOOGLE_CLIENT_ID=..."
  echo "   GOOGLE_CLIENT_SECRET=..."
  echo "   NEXTAUTH_URL=http://localhost:3000"
  echo "   NEXTAUTH_SECRET=..."
fi
echo ""
echo "Next: Visit http://localhost:3000/api/auth/test-google to verify"
