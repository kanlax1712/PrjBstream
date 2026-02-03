# Bstream APK – Samsung S22 Ultra (Android 16) Install Guide

## Why installation was failing

On **Samsung S22 Ultra** (and most devices on **Android 16**), **unsigned** APKs are blocked. The previous build produced an **unsigned** release APK, which Android refuses to install.

## What was changed

The Android **release** build is now **signed** with the debug keystore so the APK is installable:

- **File:** `web/android/app/build.gradle`
- **Change:** `signingConfig signingConfigs.debug` added to the `release` build type.

The app already targets **Android 8.0–16** (minSdk 26, targetSdk 36), so it is compatible with your S22 Ultra.

---

## Build the signed APK on your machine

Run these commands **on your Mac** (in a normal terminal, not sandboxed):

```bash
# 1. Go to web project
cd /Users/laxmikanth/Documents/Bstream/web

# 2. Build Next.js (optional if you only need the same shell; required if you changed the app)
npm run build

# 3. Sync Capacitor
npx cap sync android

# 4. Build signed release APK

**Option A – from `web` (recommended if gradlew gives "Operation not permitted"):**
```bash
cd /Users/laxmikanth/Documents/Bstream/web
sh run-android-build.sh
```
This script runs the Gradle wrapper JAR via Java and does not execute `gradlew` in the android folder.

**Option B – from `android`:**
```bash
cd android
sh gradlew clean assembleRelease --no-daemon
```

**If you get "Operation not permitted"** (even with `sh gradlew`), use **Option A** (`sh run-android-build.sh` from `web`). If that also fails, remove macOS quarantine from the project and try again:
```bash
xattr -cr /Users/laxmikanth/Documents/Bstream
```
Then run Option A or B again.

The **signed** APK will be at:

```text
web/android/app/build/outputs/apk/release/app-release.apk
```

Copy it and rename to `Bstream.apk` if you like.

---

## Install on Samsung S22 Ultra

1. **Copy the APK** to your phone (USB, Google Drive, email, etc.).
2. **Allow installs from this source** (Android 16):
   - Open **Settings → Apps → Special app access** (or **Install unknown apps**).
   - Select the app you use to open the APK (e.g. **Files**, **Chrome**, **My Files**).
   - Turn on **Allow from this source**.
3. **Open the APK** (e.g. from Files or Downloads) and tap **Install**.
4. If asked, confirm **Install anyway** (for non-Play Store app).

The app loads your production site: **https://bstreamtest.vercel.app**

---

## If you still get “App not installed”

- **Uninstall any old Bstream build** (same package `com.bstream.app`) and try again.
- Ensure you are installing the **new** signed APK from `app-release.apk` (from the steps above), not an old unsigned one.
- On Samsung: **Settings → Battery → Background usage limits** – ensure nothing is blocking the installer.

---

## Optional: Debug APK (also signed)

If you prefer a debug build (also signed and installable):

```bash
cd /Users/laxmikanth/Documents/Bstream/web/android
sh gradlew assembleDebug
```

APK location: `web/android/app/build/outputs/apk/debug/app-debug.apk`
