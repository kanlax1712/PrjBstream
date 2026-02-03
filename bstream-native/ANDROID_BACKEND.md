# Running Bstream Android app with your backend

The Android app needs the **Bstream web backend** (Next.js + API) to show the feed, search, and video streams. The **404 error** you see means the app could not reach the API.

## Fix 404: Use the correct backend

### Option A: Emulator + local web app (recommended for development)

1. **Start the web app on your Mac:**
   ```bash
   cd /Users/laxmikanth/Documents/Bstream/web
   npm install   # if not done already
   npm run dev
   ```
   Leave this running (you should see "Ready on http://localhost:3000").

2. **Install and run the Android app (debug build):**
   - The **debug** build is configured to use **http://10.0.2.2:3000/** (emulator → your Mac’s localhost).
   - Build and install:
     ```bash
     cd /Users/laxmikanth/Documents/Bstream/bstream-native
     ./gradlew installDebug
     ```
   - Open the **Bstream** app on the emulator. The feed should load from your local backend.

3. **If you still see 404:**
   - Confirm the web app is running: open http://localhost:3000 in a browser and check that the site and `/api/feed` work.
   - Ensure you’re using the **debug** APK (not release). Debug uses the local URL; release uses production.

### Option B: Production backend (bstreamtest.vercel.app)

- Use the **release** build. It uses **https://bstreamtest.vercel.app/**.
- The Bstream web app must be deployed at that URL and expose:
  - `GET /api/feed`
  - `GET /api/search?q=...`
  - `GET /api/video/{id}/stream`
  - `POST /api/track-view` (body: `{ "videoId": "..." }`)

If the project is deployed elsewhere, change the release `BASE_URL` in `app/build.gradle.kts` (inside `buildTypes.release.buildConfigField`) and rebuild.

## URL summary

| Build   | BASE_URL                        | Use case                    |
|---------|----------------------------------|-----------------------------|
| Debug   | http://10.0.2.2:3000/           | Emulator + local `npm run dev` |
| Release | https://bstreamtest.vercel.app/ | Production deployment       |

## Changing the backend URL

- **Debug (local):** `app/build.gradle.kts` → `buildTypes.debug.buildConfigField("BASE_URL", ...)`.  
  For a physical device on the same Wi‑Fi as your Mac, use your Mac’s LAN IP (e.g. `http://192.168.1.x:3000/`) instead of `10.0.2.2`.
- **Release:** `app/build.gradle.kts` → `buildTypes.release.buildConfigField("BASE_URL", ...)`.

After changing, rebuild: `./gradlew installDebug` or `./gradlew assembleRelease`.
