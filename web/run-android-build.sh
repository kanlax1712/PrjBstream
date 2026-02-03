#!/bin/sh
# Build Bstream release APK by calling the Gradle wrapper JAR directly.
# Use this if ./gradlew or "sh gradlew" gives "Operation not permitted" in the android folder.

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ANDROID_DIR="$SCRIPT_DIR/android"
JAR="$ANDROID_DIR/gradle/wrapper/gradle-wrapper.jar"

if [ ! -f "$JAR" ]; then
  echo "Error: Gradle wrapper JAR not found at $JAR"
  exit 1
fi

# Must run from android directory so Gradle finds build.gradle
cd "$ANDROID_DIR"
exec java -Dorg.gradle.appname=gradlew -Xmx64m -Xms64m -jar "$JAR" clean assembleRelease --no-daemon "$@"
