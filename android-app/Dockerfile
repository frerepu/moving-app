FROM eclipse-temurin:17-jdk

# Install required packages
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    git \
    gradle \
    imagemagick \
    && rm -rf /var/lib/apt/lists/*

# Set up Android SDK
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH="${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:${ANDROID_SDK_ROOT}/platform-tools:${PATH}"

# Download and install Android command line tools
RUN mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools && \
    cd ${ANDROID_SDK_ROOT}/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip && \
    unzip -q commandlinetools-linux-11076708_latest.zip && \
    rm commandlinetools-linux-11076708_latest.zip && \
    mv cmdline-tools latest

# Accept licenses and install required SDK components
RUN yes | sdkmanager --licenses
RUN sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

WORKDIR /build

# Copy project files
COPY . .

# Generate launcher icons from SVG
RUN mkdir -p app/src/main/res/mipmap-mdpi app/src/main/res/mipmap-hdpi \
             app/src/main/res/mipmap-xhdpi app/src/main/res/mipmap-xxhdpi \
             app/src/main/res/mipmap-xxxhdpi && \
    convert app/src/main/res/icon.svg -resize 48x48 app/src/main/res/mipmap-mdpi/ic_launcher.png && \
    convert app/src/main/res/icon.svg -resize 72x72 app/src/main/res/mipmap-hdpi/ic_launcher.png && \
    convert app/src/main/res/icon.svg -resize 96x96 app/src/main/res/mipmap-xhdpi/ic_launcher.png && \
    convert app/src/main/res/icon.svg -resize 144x144 app/src/main/res/mipmap-xxhdpi/ic_launcher.png && \
    convert app/src/main/res/icon.svg -resize 192x192 app/src/main/res/mipmap-xxxhdpi/ic_launcher.png && \
    cp app/src/main/res/mipmap-mdpi/ic_launcher.png app/src/main/res/mipmap-mdpi/ic_launcher_round.png && \
    cp app/src/main/res/mipmap-hdpi/ic_launcher.png app/src/main/res/mipmap-hdpi/ic_launcher_round.png && \
    cp app/src/main/res/mipmap-xhdpi/ic_launcher.png app/src/main/res/mipmap-xhdpi/ic_launcher_round.png && \
    cp app/src/main/res/mipmap-xxhdpi/ic_launcher.png app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png && \
    cp app/src/main/res/mipmap-xxxhdpi/ic_launcher.png app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png

# Download and set up Gradle wrapper
RUN gradle wrapper --gradle-version=8.2
RUN chmod +x ./gradlew

# Create debug keystore for signing
RUN keytool -genkey -v -keystore /build/debug.keystore \
    -storepass android \
    -alias androiddebugkey \
    -keypass android \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -dname "CN=Android Debug,O=Android,C=US"

# Build, sign and align APK
CMD ./gradlew assembleRelease --no-daemon && \
    ${ANDROID_SDK_ROOT}/build-tools/34.0.0/zipalign -v -p 4 \
        app/build/outputs/apk/release/app-release-unsigned.apk \
        app/build/outputs/apk/release/app-release-aligned.apk && \
    ${ANDROID_SDK_ROOT}/build-tools/34.0.0/apksigner sign \
        --ks /build/debug.keystore \
        --ks-key-alias androiddebugkey \
        --ks-pass pass:android \
        --key-pass pass:android \
        --out app/build/outputs/apk/release/app-release-signed.apk \
        app/build/outputs/apk/release/app-release-aligned.apk && \
    ${ANDROID_SDK_ROOT}/build-tools/34.0.0/apksigner verify \
        app/build/outputs/apk/release/app-release-signed.apk && \
    echo "" && \
    echo "✅ Build and signing complete!" && \
    echo "📱 Signed APK ready at: app/build/outputs/apk/release/app-release-signed.apk"
