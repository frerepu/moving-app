#!/usr/bin/env bash
set -e

echo "========================================"
echo "Building Android APK with Docker"
echo "========================================"
echo ""

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t moving-app-builder .
echo ""

# Run the build
echo "🔨 Building APK..."
docker run --rm \
  -v "$(pwd)/app/build:/build/app/build" \
  moving-app-builder
echo ""

echo "========================================"
echo "✅ Build complete!"
echo "========================================"
echo ""
echo "📱 Signed APK location:"
echo "   $(pwd)/app/build/outputs/apk/release/app-release-signed.apk"
echo ""
echo "📤 To install:"
echo "   - Copy APK to your phone and install"
echo "   - Or use: adb install -r app/build/outputs/apk/release/app-release-signed.apk"
echo ""
