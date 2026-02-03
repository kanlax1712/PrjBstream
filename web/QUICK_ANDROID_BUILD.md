# Quick Android APK Build Guide

## Prerequisites

1. **Install Android Studio**: https://developer.android.com/studio
2. **Install Java JDK 17+**: Usually comes with Android Studio
3. **Set up Android SDK**: Install Android SDK Platform 26+ (Android 8.0+)

## Quick Start

### Option 1: Using the Build Script (Easiest)

```bash
cd web

# First time setup (one-time)
npm run android:setup

# Build APK
npm run android:apk
```

The APK will be at: `web/android/app/build/outputs/apk/release/app-release.apk`

### Option 2: Manual Build

```bash
cd web

# Build Next.js app
npm run build

# Sync Capacitor
npm run cap:sync

# Build APK
cd android
chmod +x gradlew
./gradlew assembleRelease
```

## Configuration

### For Production (Load from Remote URL)

1. Edit `web/capacitor.config.ts`
2. Uncomment and set the production URL:
   ```typescript
   server: {
     url: 'https://your-production-url.com',
     // ...
   }
   ```

3. Build:
   ```bash
   export CAPACITOR_SERVER_URL=https://your-production-url.com
   npm run android:apk
   ```

### For Local Development

Keep the `url` commented in `capacitor.config.ts` and build normally.

## Install APK on Device

### Method 1: ADB (Android Debug Bridge)

```bash
adb install web/android/app/build/outputs/apk/release/app-release.apk
```

### Method 2: Manual Install

1. Transfer APK to your Android device
2. Enable "Install from Unknown Sources" in Settings
3. Open the APK file and install

## Troubleshooting

**"Command not found: gradlew"**
```bash
cd web/android
chmod +x gradlew
```

**"SDK location not found"**
```bash
cd web
npm run android:setup
```

**"Java not found"**
- Install JDK 17+ or Android Studio (includes JDK)

## Full Documentation

See `ANDROID_BUILD_GUIDE.md` for detailed instructions.

