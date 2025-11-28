#!/bin/bash
# Script to set up local .env file with PostgreSQL database URL

echo "🔧 Setting up local .env file..."

# Vercel PostgreSQL database URL (for local development)
DATABASE_URL="postgres://fdebd3426db52b359b05762053703145b1382ff01e5f84e83c9f752de8b4fbda:sk_qQxvQYzBEANgApuBYBA6l@db.prisma.io:5432/postgres?sslmode=require"

# Check if .env exists
if [ -f .env ]; then
  echo "📝 Updating existing .env file..."
  # Remove old DATABASE_URL if it exists
  sed -i.bak '/^DATABASE_URL=/d' .env 2>/dev/null || sed -i '' '/^DATABASE_URL=/d' .env 2>/dev/null
else
  echo "📝 Creating new .env file..."
fi

# Add DATABASE_URL
echo "DATABASE_URL=\"$DATABASE_URL\"" >> .env

# Add other required variables if they don't exist
if ! grep -q "^NEXTAUTH_SECRET=" .env 2>/dev/null; then
  echo "NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env
fi

if ! grep -q "^NEXTAUTH_URL=" .env 2>/dev/null; then
  echo "NEXTAUTH_URL=\"http://localhost:3000\"" >> .env
fi

echo "✅ .env file configured!"
echo ""
echo "📋 Current DATABASE_URL:"
grep "^DATABASE_URL=" .env


