#!/bin/bash

# Android APK Build Script for Bstream
# This script builds an Android APK that can be installed on Android 8.0+ devices

set -e  # Exit on error

echo "🚀 Building Android APK for Bstream..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the web/ directory${NC}"
    exit 1
fi

# Check for Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Error: Java is not installed. Please install JDK 17 or higher.${NC}"
    exit 1
fi

# Check for Android SDK
if [ -z "$ANDROID_HOME" ]; then
    echo -e "${YELLOW}⚠️  Warning: ANDROID_HOME is not set.${NC}"
    echo "   Please set it in your environment:"
    echo "   export ANDROID_HOME=\$HOME/Library/Android/sdk"
fi

# Check if production URL is set
if [ -z "$CAPACITOR_SERVER_URL" ]; then
    echo -e "${YELLOW}⚠️  Warning: CAPACITOR_SERVER_URL is not set.${NC}"
    echo "   The app will try to load from local build."
    echo "   To use a production URL, set:"
    echo "   export CAPACITOR_SERVER_URL=https://your-production-url.com"
    echo ""
    read -p "Do you want to continue with local build? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 1: Generate Prisma client
echo -e "${GREEN}📦 Step 1: Generating Prisma client...${NC}"
npm run postinstall || npx prisma generate

# Step 2: Build Next.js app
echo -e "${GREEN}🏗️  Step 2: Building Next.js app...${NC}"
npm run build

# Step 3: Create out directory (required by Capacitor, even if using remote URL)
echo -e "${GREEN}📁 Step 3: Preparing Capacitor build directory...${NC}"
if [ ! -d "out" ]; then
    mkdir -p out
    echo '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url='${CAPACITOR_SERVER_URL:-http://localhost:3000}'" /></head><body>Redirecting...</body></html>' > out/index.html
fi

# Step 4: Sync Capacitor
echo -e "${GREEN}🔄 Step 4: Syncing Capacitor...${NC}"
npx cap sync android

# Step 5: Build APK
echo -e "${GREEN}🔨 Step 5: Building Android APK...${NC}"
cd android

# Build release APK (sh gradlew works when ./gradlew gives "Operation not permitted" on macOS)
echo "Building release APK..."
sh gradlew clean assembleRelease --no-daemon

# Check if build was successful
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo ""
    echo -e "${GREEN}✅ APK built successfully!${NC}"
    echo ""
    echo "📱 APK Location:"
    echo "   $(pwd)/app/build/outputs/apk/release/app-release.apk"
    echo ""
    echo "📋 To install on your device:"
    echo "   1. Transfer the APK to your Android device"
    echo "   2. Enable 'Install from Unknown Sources' in Settings"
    echo "   3. Open the APK file and install"
    echo ""
    echo "   Or use ADB:"
    echo "   adb install app/build/outputs/apk/release/app-release.apk"
    echo ""
    
    # Get APK size
    APK_SIZE=$(du -h app/build/outputs/apk/release/app-release.apk | cut -f1)
    echo "📦 APK Size: $APK_SIZE"
    echo ""
else
    echo -e "${RED}❌ Error: APK build failed${NC}"
    exit 1
fi

cd ..

echo -e "${GREEN}🎉 Build complete!${NC}"

