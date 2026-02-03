#!/bin/sh
# Build Bstream Android app using JDK 17 (required; JDK 21 causes JdkImageTransform/jlink errors).

set -e
cd "$(dirname "$0")"

# Prefer JDK 17 from Homebrew or system
if [ -n "$JAVA_HOME" ] && java -version 2>&1 | grep -q '"17'; then
  echo "Using existing JAVA_HOME (JDK 17): $JAVA_HOME"
elif [ -d "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" ]; then
  export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
  echo "Using Homebrew OpenJDK 17: $JAVA_HOME"
elif [ -d "/usr/libexec/java_home" ]; then
  JAVA_17=$(/usr/libexec/java_home -v 17 2>/dev/null || true)
  if [ -n "$JAVA_17" ]; then
    export JAVA_HOME="$JAVA_17"
    echo "Using JDK 17: $JAVA_HOME"
  fi
fi

if ! java -version 2>&1 | grep -q '"17'; then
  echo "JDK 17 is required. Install with: brew install openjdk@17"
  echo "Then run: export JAVA_HOME=\"/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home\""
  exit 1
fi

./gradlew assembleDebug "$@"
