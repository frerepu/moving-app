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
echo "📱 APK location:"
echo "   $(pwd)/app/build/outputs/apk/release/app-release-unsigned.apk"
echo ""
echo "📤 To sign and install:"
echo "   - Copy APK to your phone"
echo "   - Or use: adb install app/build/outputs/apk/release/app-release-unsigned.apk"
echo ""
