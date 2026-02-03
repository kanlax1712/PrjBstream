#!/bin/bash

# Setup script for Android build environment
# Run this once to configure your environment

echo "🔧 Setting up Android build environment..."
echo ""

# Check OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    DEFAULT_SDK_PATH="$HOME/Library/Android/sdk"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    DEFAULT_SDK_PATH="$HOME/Android/Sdk"
else
    echo "❌ Unsupported OS. Please set up Android SDK manually."
    exit 1
fi

# Check if Android SDK exists
if [ ! -d "$DEFAULT_SDK_PATH" ]; then
    echo "⚠️  Android SDK not found at $DEFAULT_SDK_PATH"
    echo "   Please install Android Studio and Android SDK first."
    echo "   Download from: https://developer.android.com/studio"
    exit 1
fi

# Create local.properties if it doesn't exist
if [ ! -f "android/local.properties" ]; then
    echo "📝 Creating android/local.properties..."
    echo "sdk.dir=$DEFAULT_SDK_PATH" > android/local.properties
    echo "✅ Created android/local.properties"
else
    echo "✅ android/local.properties already exists"
fi

# Check Java
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}')
    echo "✅ Java found: $JAVA_VERSION"
else
    echo "❌ Java not found. Please install JDK 17 or higher."
    exit 1
fi

# Check Android SDK tools
if [ -f "$DEFAULT_SDK_PATH/platform-tools/adb" ]; then
    echo "✅ Android SDK tools found"
else
    echo "⚠️  Android SDK tools not found. Make sure Android SDK is properly installed."
fi

# Add to shell config
SHELL_CONFIG=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
fi

if [ -n "$SHELL_CONFIG" ]; then
    if ! grep -q "ANDROID_HOME" "$SHELL_CONFIG"; then
        echo ""
        echo "📝 Add these lines to $SHELL_CONFIG:"
        echo ""
        echo "export ANDROID_HOME=$DEFAULT_SDK_PATH"
        echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
        echo "export PATH=\$PATH:\$ANDROID_HOME/tools"
        echo ""
        read -p "Do you want to add them automatically? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "" >> "$SHELL_CONFIG"
            echo "# Android SDK" >> "$SHELL_CONFIG"
            echo "export ANDROID_HOME=$DEFAULT_SDK_PATH" >> "$SHELL_CONFIG"
            echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools" >> "$SHELL_CONFIG"
            echo "export PATH=\$PATH:\$ANDROID_HOME/tools" >> "$SHELL_CONFIG"
            echo "✅ Added to $SHELL_CONFIG"
            echo "   Please run: source $SHELL_CONFIG"
        fi
    else
        echo "✅ Android environment variables already configured"
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure Android Studio is installed"
echo "2. Install Android SDK Platform 26+ (Android 8.0+)"
echo "3. Run: cd web && ./scripts/build-android-apk.sh"

