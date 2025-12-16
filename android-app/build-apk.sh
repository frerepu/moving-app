#!/bin/bash
# Quick build script for the Android APK

echo "Building Moving App APK..."
echo ""

# Check if gradlew exists
if [ ! -f "./gradlew" ]; then
    echo "Error: gradlew not found. Please run this from the android-app directory."
    echo "If you just cloned the repo, you may need to download the Gradle wrapper:"
    echo ""
    echo "  gradle wrapper"
    echo ""
    exit 1
fi

# Make gradlew executable
chmod +x ./gradlew

# Clean and build
echo "Running clean build..."
./gradlew clean assembleRelease

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "APK location:"
    echo "  $(pwd)/app/build/outputs/apk/release/app-release-unsigned.apk"
    echo ""
    echo "To install on connected device:"
    echo "  adb install app/build/outputs/apk/release/app-release-unsigned.apk"
    echo ""
    echo "Note: This APK is unsigned. For production, create a signed APK using:"
    echo "  ./gradlew assembleRelease (with signing config)"
    echo "  or use Android Studio: Build → Generate Signed Bundle/APK"
    echo ""
else
    echo ""
    echo "❌ Build failed. Check the errors above."
    exit 1
fi
