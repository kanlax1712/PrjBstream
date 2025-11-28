#!/bin/bash

# 🚀 Vercel Deployment Script
# This script prepares and deploys the application to Vercel

set -e

echo "🚀 Starting Vercel Deployment Process..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the web directory."
    exit 1
fi

echo -e "${BLUE}Step 1: Checking Git status...${NC}"
git status

echo ""
echo -e "${BLUE}Step 2: Building locally to check for errors...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Build successful!${NC}"
echo ""

echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the changes: git status"
echo "2. Add changes: git add ."
echo "3. Commit: git commit -m 'feat: Enhanced video player controls'"
echo "4. Push to GitHub: git push origin main"
echo ""
echo "5. Configure Vercel Environment Variables:"
echo "   - DATABASE_URL"
echo "   - NEXTAUTH_URL"
echo "   - NEXTAUTH_SECRET"
echo "   - BLOB_READ_WRITE_TOKEN"
echo "   - GOOGLE_CLIENT_ID"
echo "   - GOOGLE_CLIENT_SECRET"
echo ""
echo "6. Deploy will happen automatically when you push to main branch"
echo ""
echo -e "${GREEN}Ready to deploy! 🚀${NC}"
