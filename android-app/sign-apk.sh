#!/usr/bin/env bash
set -e

echo "========================================"
echo "Signing Android APK"
echo "========================================"
echo ""

KEYSTORE_FILE="./debug.keystore"
KEYSTORE_PASS="android"
KEY_ALIAS="androiddebugkey"
KEY_PASS="android"

UNSIGNED_APK="./app/build/outputs/apk/release/app-release-unsigned.apk"
ALIGNED_APK="./app/build/outputs/apk/release/app-release-unsigned-aligned.apk"
SIGNED_APK="./app/build/outputs/apk/release/app-release-signed.apk"

# Check if unsigned APK exists
if [ ! -f "$UNSIGNED_APK" ]; then
    echo "❌ Error: Unsigned APK not found at $UNSIGNED_APK"
    echo "Please run ./build-docker.sh first"
    exit 1
fi

# Create debug keystore if it doesn't exist
if [ ! -f "$KEYSTORE_FILE" ]; then
    echo "🔑 Creating debug keystore..."
    keytool -genkey -v -keystore "$KEYSTORE_FILE" \
        -storepass "$KEYSTORE_PASS" \
        -alias "$KEY_ALIAS" \
        -keypass "$KEY_PASS" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -dname "CN=Android Debug,O=Android,C=US"
    echo ""
fi

# Align the APK
echo "📏 Aligning APK..."
zipalign -v -p 4 "$UNSIGNED_APK" "$ALIGNED_APK"
echo ""

# Sign the APK
echo "✍️  Signing APK..."
apksigner sign \
    --ks "$KEYSTORE_FILE" \
    --ks-key-alias "$KEY_ALIAS" \
    --ks-pass pass:"$KEYSTORE_PASS" \
    --key-pass pass:"$KEY_PASS" \
    --out "$SIGNED_APK" \
    "$ALIGNED_APK"
echo ""

# Verify the signature
echo "✅ Verifying signature..."
apksigner verify "$SIGNED_APK"
echo ""

# Clean up aligned APK
rm -f "$ALIGNED_APK"

echo "========================================"
echo "✅ APK signed successfully!"
echo "========================================"
echo ""
echo "📱 Signed APK location:"
echo "   $(pwd)/app/build/outputs/apk/release/app-release-signed.apk"
echo ""
echo "📤 To install:"
echo "   adb install -r app/build/outputs/apk/release/app-release-signed.apk"
echo "   Or copy to your phone and install manually"
echo ""
