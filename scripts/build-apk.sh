#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$ROOT_DIR/android"
KEYSTORE="$ANDROID_DIR/app/upload-keystore.jks"
KEY_ALIAS="naba-upload"
GRADLE_USER_HOME="${GRADLE_USER_HOME:-$ROOT_DIR/../../.gradle-al-habwa-release}"
export GRADLE_USER_HOME
GRADLE_OPTS="${GRADLE_OPTS:-} -XX:+PerfDisableSharedMem -XX:MaxMetaspaceSize=512m"
export GRADLE_OPTS
NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
export NODE_OPTIONS

if [[ -z "${ANDROID_UPLOAD_KEYSTORE_PASSWORD:-}" || -z "${ANDROID_UPLOAD_KEY_PASSWORD:-}" ]]; then
  echo "Missing Android release signing secrets." >&2
  exit 1
fi

if [[ ! -f "$KEYSTORE" ]]; then
  echo "Generating the local upload keystore..."
  keytool -genkeypair \
    -v \
    -keystore "$KEYSTORE" \
    -storetype PKCS12 \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$ANDROID_UPLOAD_KEYSTORE_PASSWORD" \
    -keypass "$ANDROID_UPLOAD_KEY_PASSWORD" \
    -dname "CN=NABA, OU=Mobile, O=NABA, L=Riyadh, C=SA"
fi

if ! keytool -list \
  -keystore "$KEYSTORE" \
  -storepass "$ANDROID_UPLOAD_KEYSTORE_PASSWORD" \
  -alias "$KEY_ALIAS" >/dev/null 2>&1; then
  echo "The Android upload keystore does not contain the expected release key." >&2
  exit 1
fi

cd "$ANDROID_DIR"

echo "Cleaning stale APK deliverables..."
find "$ROOT_DIR" -maxdepth 1 -type f \( -name "*.apk" -o -name "*.idsig" \) -delete
find "$ANDROID_DIR" -maxdepth 1 -type f \( -name "*.apk" -o -name "*.idsig" \) -delete
find "$ANDROID_DIR/app/build/outputs" -type f \( -name "*.apk" -o -name "*.idsig" \) -delete 2>/dev/null || true

if [[ "${SKIP_CLEAN:-0}" == "1" ]]; then
  echo "Reusing cached native build intermediates..."
else
  echo "Preparing a clean release build..."
  ./gradlew --no-daemon --max-workers=1 clean
fi

for ABI in arm64-v8a armeabi-v7a; do
  echo "Building release APK for $ABI..."
  ./gradlew --no-daemon --max-workers=1 :app:assembleRelease \
    -PreactNativeArchitectures="$ABI" \
    -Pexpo.useLegacyPackaging=true \
    -x lintVitalAnalyzeRelease \
    -x lintVitalRelease

  OUTPUT="$ANDROID_DIR/naba-1.0.3-$ABI.apk"
  cp "$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk" "$OUTPUT"
  test -s "$OUTPUT"
  echo "Created $OUTPUT"
done

find "$ANDROID_DIR/app/build/outputs" -type f \( -name "*.apk" -o -name "*.idsig" \) -delete
echo "Release deliverables:"
find "$ANDROID_DIR" -maxdepth 1 -type f -name "*.apk" -printf "  %f (%s bytes)\n" | sort