# Moving App - Android Client

Native Android app for the Moving Decisions platform. This app allows your family members to install an APK directly on their Android phones to vote on items during your move.

## Features

- ✅ Native Android app with modern Material Design 3 UI
- ✅ Login with username/password
- ✅ View and vote on items (Move/Toss/Give/Sell/Other)
- ✅ Add new items with camera or gallery photos
- ✅ See everyone's votes and comments
- ✅ Admin controls for finalizing decisions
- ✅ Offline support with automatic reconnection
- ✅ Server URL configuration

## Requirements

- Android 7.0 (API 24) or higher
- Camera permission (for taking photos)
- Internet connection
- Backend server running (see main README.md)

## Building the APK

### Option 1: Using Android Studio (Recommended)

1. **Install Android Studio**
   - Download from: https://developer.android.com/studio
   - Install with default settings

2. **Open the project**
   - Open Android Studio
   - Click "Open an Existing Project"
   - Navigate to `android-app` folder

3. **Build the APK**
   - Go to Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Wait for build to complete
   - APK will be in: `app/build/outputs/apk/release/app-release-unsigned.apk`

4. **Create a signed APK (for distribution)**
   - Go to Build → Generate Signed Bundle / APK
   - Select APK → Next
   - Create a new keystore or use existing
   - Fill in the keystore details
   - Select "release" build variant
   - Click Finish
   - Signed APK will be in: `app/release/app-release.apk`

### Option 2: Using Command Line

1. **Install Java Development Kit (JDK)**
   ```bash
   # On Ubuntu/Debian
   sudo apt update
   sudo apt install openjdk-17-jdk

   # On macOS (using Homebrew)
   brew install openjdk@17

   # Verify installation
   java -version
   ```

2. **Install Android SDK Command Line Tools**
   - Download from: https://developer.android.com/studio#command-tools
   - Extract to a location (e.g., `~/android-sdk`)
   - Set environment variables:
     ```bash
     export ANDROID_HOME=~/android-sdk
     export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
     export PATH=$PATH:$ANDROID_HOME/platform-tools
     ```

3. **Accept SDK licenses**
   ```bash
   sdkmanager --licenses
   ```

4. **Build the APK**
   ```bash
   cd android-app
   ./gradlew assembleRelease
   ```

5. **Find your APK**
   - Unsigned APK: `app/build/outputs/apk/release/app-release-unsigned.apk`
   - To sign it, use `jarsigner` or Android Studio

### Quick Build Script

For convenience, you can use this one-liner (requires Android SDK):

```bash
cd android-app && ./gradlew assembleRelease && cd ..
```

## Installing the APK

### Method 1: Direct Transfer

1. Connect phone to computer via USB
2. Enable "Developer Options" and "USB Debugging" on your Android phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → System → Developer Options
   - Enable "USB Debugging"
3. Copy APK to phone:
   ```bash
   adb install app/build/outputs/apk/release/app-release.apk
   ```

### Method 2: Share via Cloud/Email

1. Upload the APK to Google Drive, Dropbox, or email it
2. On the phone:
   - Download the APK
   - Open the file
   - Allow "Install from Unknown Sources" when prompted
   - Click Install

### Method 3: Local Web Server

1. Start a simple web server:
   ```bash
   cd android-app/app/build/outputs/apk/release
   python3 -m http.server 8000
   ```
2. On the phone:
   - Open browser to `http://YOUR_COMPUTER_IP:8000`
   - Download the APK
   - Install as above

## First Time Setup

1. **Find your server IP address**
   ```bash
   # On Linux/Mac
   ifconfig | grep "inet "

   # On Windows
   ipconfig
   ```

2. **Launch the app**
   - Open "Moving App" on your phone
   - Click "Server Settings"
   - Enter your server URL: `http://YOUR_SERVER_IP:8080`
   - Click Save

3. **Login**
   - Enter username and password (created via backend)
   - Click Sign In

## Configuring the Server URL

The app defaults to `http://10.0.2.2:8080` (Android emulator localhost).

For real devices, you need to set your server's IP address:
- Local network: `http://192.168.1.100:8080`
- Public domain: `http://moving.yourdomain.com`

The server URL is saved in the app and persists across restarts.

## Troubleshooting

### "Cannot connect to server"
- Verify the backend is running: `docker-compose ps`
- Check server URL is correct
- Ensure phone is on same network (for local servers)
- Try accessing the server in phone's browser first

### "Login failed"
- Verify username/password are correct
- Check backend logs: `docker-compose logs backend`

### "Failed to load items"
- Check auth token is valid
- Try logging out and back in
- Verify backend is accessible

### "Camera not working"
- Grant camera permission in Settings → Apps → Moving App → Permissions
- Try using "Choose from Gallery" instead

### APK won't install
- Enable "Install from Unknown Sources" in Settings → Security
- Try uninstalling old version first
- Verify APK downloaded completely

## Development

### Running in Android Emulator

1. Open Android Studio
2. Create a virtual device (AVD Manager)
3. Click Run (green play button)
4. App will install and launch in emulator

### Making Changes

1. Edit Kotlin files in `app/src/main/java/com/movingapp/`
2. UI is in `app/src/main/java/com/movingapp/ui/`
3. Rebuild and reinstall

### Debug Logs

View logs with:
```bash
adb logcat | grep MovingApp
```

## Architecture

- **Language**: Kotlin
- **UI Framework**: Jetpack Compose (Material Design 3)
- **Networking**: Retrofit + OkHttp
- **Image Loading**: Coil
- **Camera**: CameraX
- **State Management**: ViewModel + Compose State
- **Storage**: DataStore (encrypted preferences)

## File Structure

```
android-app/
├── app/
│   ├── src/main/
│   │   ├── java/com/movingapp/
│   │   │   ├── data/           # API client, models, repository
│   │   │   ├── ui/             # Compose screens
│   │   │   ├── MainActivity.kt
│   │   │   └── MovingApplication.kt
│   │   ├── res/                # Resources
│   │   └── AndroidManifest.xml
│   └── build.gradle.kts
├── build.gradle.kts
└── settings.gradle.kts
```

## Security Notes

- App uses HTTPS when configured with https:// URL
- Auth tokens stored securely in DataStore
- Passwords never stored locally
- Supports HTTP for local development (set in manifest)

## License

MIT - Same as parent project
