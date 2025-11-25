#!/bin/bash
# Script to prepare Prisma schema for Vercel deployment

echo "🔧 Preparing Prisma schema for Vercel (PostgreSQL)..."

# Backup current schema
cp prisma/schema.prisma prisma/schema.sqlite.backup

# Update datasource to PostgreSQL
sed -i.bak 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
sed -i.bak 's|url      = "file:./dev.db"|url      = env("DATABASE_URL")|' prisma/schema.prisma

echo "✅ Prisma schema updated for PostgreSQL"
echo "📝 Remember to set DATABASE_URL in Vercel environment variables"
echo "📝 Original schema backed up to prisma/schema.sqlite.backup"

