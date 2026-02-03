# Android APK Build Guide

This guide explains how to build an Android APK for the Bstream app that supports Android 8.0 (API level 26) and above.

## Prerequisites

1. **Java Development Kit (JDK)**: Install JDK 17 or higher
   ```bash
   # Check if Java is installed
   java -version
   ```

2. **Android Studio**: Install Android Studio (includes Android SDK and Gradle)
   - Download from: https://developer.android.com/studio
   - During installation, make sure to install:
     - Android SDK
     - Android SDK Platform
     - Android Virtual Device (optional, for testing)

3. **Environment Variables**: Set up Android SDK path
   ```bash
   # Add to your ~/.zshrc or ~/.bashrc
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```

4. **Node.js and npm**: Already installed (required for Next.js)

## Configuration Options

### Option 1: Load from Production URL (Recommended)

Since this app uses server-side features (API routes, Prisma, etc.), the recommended approach is to configure the app to load from your production server.

1. **Update Capacitor Config**:
   Edit `web/capacitor.config.ts` and uncomment the `url` line:
   ```typescript
   server: {
     url: 'https://your-production-url.com', // Your deployed URL
     // ... rest of config
   }
   ```

2. **Build the APK**:
   ```bash
   cd web
   npm run android:build
   ```

### Option 2: Local Development Build

For local development and testing:

1. **Keep URL commented** in `capacitor.config.ts`:
   ```typescript
   server: {
     // url: 'https://your-production-url.com', // Commented for local
     // ... rest of config
   }
   ```

2. **Build Next.js app**:
   ```bash
   cd web
   npm run build
   ```

3. **Sync with Capacitor**:
   ```bash
   npm run cap:sync
   ```

4. **Build APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

## Building the APK

### Method 1: Command Line (Recommended)

1. **Navigate to web directory**:
   ```bash
   cd web
   ```

2. **Build the APK**:
   ```bash
   # For release build (signed APK)
   npm run android:build
   
   # For debug build (unsigned APK, faster)
   npm run android:build:debug
   ```

3. **Find the APK**:
   - Release APK: `web/android/app/build/outputs/apk/release/app-release.apk`
   - Debug APK: `web/android/app/build/outputs/apk/debug/app-debug.apk`

### Method 2: Using Android Studio

1. **Open Android Studio**:
   ```bash
   cd web
   npm run cap:open
   ```
   This will open the Android project in Android Studio.

2. **Build in Android Studio**:
   - Go to `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - Or use `Build` → `Generate Signed Bundle / APK` for a signed release

3. **Find the APK**:
   - The APK will be in `web/android/app/build/outputs/apk/`

## Signing the APK (For Release)

For production releases, you need to sign the APK:

1. **Generate a keystore** (first time only):
   ```bash
   keytool -genkey -v -keystore bstream-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias bstream
   ```

2. **Create `keystore.properties`** in `web/android/`:
   ```properties
   storePassword=your-store-password
   keyPassword=your-key-password
   keyAlias=bstream
   storeFile=../bstream-release-key.jks
   ```

3. **Update `web/android/app/build.gradle`** to use the keystore:
   ```gradle
   android {
       signingConfigs {
           release {
               def keystorePropertiesFile = rootProject.file("keystore.properties")
               def keystoreProperties = new Properties()
               if (keystorePropertiesFile.exists()) {
                   keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
                   storeFile file(keystoreProperties['storeFile'])
                   storePassword keystoreProperties['storePassword']
                   keyAlias keystoreProperties['keyAlias']
                   keyPassword keystoreProperties['keyPassword']
               }
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               // ... other config
           }
       }
   }
   ```

## Installing the APK

### On Android Device:

1. **Enable Developer Options**:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times

2. **Enable USB Debugging**:
   - Go to Settings → Developer Options
   - Enable "USB Debugging"

3. **Transfer APK to device**:
   ```bash
   # Using ADB
   adb install web/android/app/build/outputs/apk/release/app-release.apk
   
   # Or manually:
   # - Copy APK to device
   # - Open file manager on device
   # - Tap the APK file
   # - Allow installation from unknown sources if prompted
   ```

### Using ADB (Android Debug Bridge):

```bash
# Install APK
adb install web/android/app/build/outputs/apk/release/app-release.apk

# Or for debug build
adb install web/android/app/build/outputs/apk/debug/app-debug.apk
```

## Troubleshooting

### Issue: "Command not found: gradlew"

**Solution**: Make gradlew executable:
```bash
cd web/android
chmod +x gradlew
```

### Issue: "SDK location not found"

**Solution**: Create `local.properties` in `web/android/`:
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

### Issue: "Gradle sync failed"

**Solution**: 
1. Open Android Studio
2. Go to File → Sync Project with Gradle Files
3. Or run: `cd web/android && ./gradlew --refresh-dependencies`

### Issue: "minSdkVersion mismatch"

**Solution**: The app is configured for Android 8.0 (API 26). If you need to support older versions, update `web/android/variables.gradle`:
```gradle
minSdkVersion = 26  // Android 8.0
```

### Issue: Build fails with "out directory not found"

**Solution**: Since we're using a remote URL, the `out` directory isn't needed. However, if you want to use local build:
```bash
cd web
npm run build
# This creates the .next directory, but Capacitor expects 'out'
# For local builds, you may need to copy or configure differently
```

## Environment Variables

You can set the production URL via environment variable:

```bash
export CAPACITOR_SERVER_URL=https://your-production-url.com
npm run android:build
```

Or create a `.env.local` file in the `web/` directory:
```
CAPACITOR_SERVER_URL=https://your-production-url.com
```

## Notes

- **Minimum Android Version**: Android 8.0 (API level 26) as configured
- **Target Android Version**: Latest (API level 36)
- **App ID**: `com.bstream.app`
- **App Name**: Bstream

## Quick Reference

```bash
# Build release APK
cd web && npm run android:build

# Build debug APK (faster, unsigned)
cd web && npm run android:build:debug

# Sync Capacitor (after code changes)
cd web && npm run cap:sync

# Open in Android Studio
cd web && npm run cap:open

# Install via ADB
adb install web/android/app/build/outputs/apk/release/app-release.apk
```

