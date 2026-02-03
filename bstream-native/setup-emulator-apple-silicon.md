# Android Emulator on Apple Silicon (MacBook Air M4)

**Already installed:** Command-line tools, emulator, ARM64 system image (API 34), and AVD **Bstream_Phone** (Pixel 7).

---

## How to give permission on MacBook Air M4 (for Cursor / terminal)

When Cursor (or another app) runs a command that needs full access:

1. **Permission prompt** – A popup may appear: *"Terminal wants to access files in your home folder"* or *"Cursor would like to run a command without sandbox"*.
2. **Click "OK" or "Allow"** so the command can run with full access.
3. **System Settings** – To allow Cursor or Terminal more broadly:
   - **System Settings** → **Privacy & Security** → **Full Disk Access** (or **Files and Folders**).
   - Add **Cursor** and/or **Terminal** if you want them to access your home folder / run without sandbox.
4. **Cursor approval** – When the AI runs a command, Cursor may show *"This command needs full access"*. Click **Run without sandbox** or **Allow** so it can use network and write outside the project.

---

## Step 1: Install Command-line Tools & Emulator (one-time) — DONE

In **Android Studio**:

1. Open **Settings** (⌘,) → **Languages & Frameworks** → **Android SDK**.
2. Open the **SDK Tools** tab.
3. Check:
   - **Android SDK Command-line Tools (latest)**
   - **Android Emulator**
4. Click **Apply** and wait for the install to finish.
5. Open the **SDK Platforms** tab and ensure **Android 14.0 (API 34)** is installed. If not, check it and **Apply**.

Then in **Terminal** run (copy-paste as one block):

```bash
export ANDROID_HOME=~/Library/Android/sdk

# Install emulator and ARM64 system image for Apple Silicon
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "emulator" "platform-tools" "system-images;android-34;google_apis;arm64-v8a"
```

Accept licenses when prompted (`y` + Enter).

---

## Step 2: Create a virtual device (one-time) — DONE (Bstream_Phone)

```bash
export ANDROID_HOME=~/Library/Android/sdk

$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager create avd -n Bstream_Phone -k "system-images;android-34;google_apis;arm64-v8a" -d "pixel_7"
```

When asked **Do you wish to create a custom hardware profile?** type `no` and Enter.

---

## Step 3: Start the emulator

```bash
export ANDROID_HOME=~/Library/Android/sdk
$ANDROID_HOME/emulator/emulator -avd Bstream_Phone
```

Or from **Android Studio**: **Tools** → **Device Manager** → ▶ next to **Bstream_Phone**.

---

## Step 4: Install Bstream app

With the emulator running, in a **new terminal**:

```bash
cd /Users/laxmikanth/Documents/Bstream/bstream-native
./gradlew installDebug
```

Open the **Bstream** app on the emulator.

---

## Optional: Add to shell profile

Add to `~/.zshrc` so you don’t need to set `ANDROID_HOME` each time:

```bash
export ANDROID_HOME=~/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin
```

Then run `source ~/.zshrc` or open a new terminal.
