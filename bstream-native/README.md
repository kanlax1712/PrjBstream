# Bstream – Native Android App

Native Android app for Bstream video streaming, built with **Kotlin**, **Jetpack Compose**, and **ExoPlayer (Media3)**. It uses the same backend as the web app (`https://bstreamtest.vercel.app`).

## Features

- **Home feed** – List of public videos and playlists from the Bstream API
- **Search** – Search videos with **voice search** (microphone) and debounced text input
- **Bottom navigation** – Home, Search, Live, Studio, Account
- **Studio** – Placeholder (sign in to manage videos)
- **Go Live** – Placeholder (sign in to stream)
- **Account** – Sign-in placeholder, **Insights** and **Upload video** entries
- **Insights** – Placeholder (sign in to see analytics)
- **Video playback** – ExoPlayer with:
  - **Quality/resolution** – Auto, 480p, 720p, 1080p, original (settings icon)
  - **Volume mute** – Mute/unmute button
  - **Picture-in-picture (PiP)** – PiP button
  - Full-screen player with title, channel, description
- **Dark theme** – Slate background and cyan accent

## Requirements

- Android Studio Hedgehog (2023.1.1) or newer
- JDK 17
- Android SDK 34
- Min SDK 26 (Android 8.0+)

## Setup

1. **Open in Android Studio**  
   File → Open → select the `bstream-native` folder. Let Gradle sync.

2. **Launcher icon (optional)**  
   If the project has no launcher icons, copy from the Capacitor app:
   - From `web/android/app/src/main/res/` copy `mipmap-*` and `drawable/` (and optionally `drawable-v24/`, `mipmap-anydpi-v26/`) into `bstream-native/app/src/main/res/`.

3. **Backend URL**  
   The app is set to `https://bstreamtest.vercel.app`. To change it, edit:
   - `app/src/main/java/com/bstream/app/android/data/ApiModule.kt` → `BASE_URL`

## Build & Run

- **Use JDK 17.** Building with JDK 21 can fail with `JdkImageTransform` / `jlink` errors. Use JDK 17:
  - **Option A:** `./build-with-jdk17.sh` (script picks JDK 17 if installed)
  - **Option B:** Install JDK 17 and set it before running Gradle:
    ```bash
    brew install openjdk@17
    export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
    ./gradlew assembleDebug
    ```
- **Debug:** Run → Run 'app' in Android Studio, or from the `bstream-native` directory:
  - `./gradlew assembleDebug` — builds the debug APK (`app/build/outputs/apk/debug/app-debug.apk`)
  - `./gradlew installDebug` — builds and installs on a connected device/emulator  
  First run requires JDK 17, Android SDK, and network.
- **Release APK:**  
  `./gradlew assembleRelease`  
  Output: `app/build/outputs/apk/release/app-release-unsigned.apk`

## Project structure

- `app/src/main/java/com/bstream/app/android/`
  - `MainActivity.kt` – Compose scaffold with bottom nav and NavHost (Home, Search, Account, Video player)
  - `data/` – Retrofit API (`FeedApi` with feed + search), feed/search models, `ApiModule` (base URL, stream URL helper)
  - `ui/screens/` – `HomeScreen`, `HomeViewModel`, `SearchScreen`, `SearchViewModel`, `AccountScreen`, `VideoPlayerScreen`

## API used

- **GET** `https://bstreamtest.vercel.app/api/feed` – Home feed (hero, secondary videos, playlists, counts)
- **GET** `https://bstreamtest.vercel.app/api/search?q=...&limit=20` – Search videos and channels
- **GET** `https://bstreamtest.vercel.app/api/video/{videoId}/stream` – Video stream URL (redirect or stream)

The web app must expose these endpoints (the feed API was added for the native app).
