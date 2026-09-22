#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/build"
ARCHIVE_PATH="$BUILD_DIR/NABA-unsigned.xcarchive"
PAYLOAD_DIR="$BUILD_DIR/Payload"
IPA_PATH="$BUILD_DIR/NABA-unsigned.ipa"

rm -rf "$ARCHIVE_PATH" "$PAYLOAD_DIR" "$IPA_PATH"
mkdir -p "$BUILD_DIR" "$PAYLOAD_DIR"

cd "$ROOT_DIR"
xcodebuild \
  -workspace ios/NABA.xcworkspace \
  -scheme NABA \
  -configuration Release \
  -sdk iphoneos \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH" \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  archive

APP_PATH="$ARCHIVE_PATH/Products/Applications/NABA.app"
if [[ ! -d "$APP_PATH" ]]; then
  echo "Build completed without producing NABA.app" >&2
  exit 1
fi

cp -R "$APP_PATH" "$PAYLOAD_DIR/NABA.app"
(cd "$BUILD_DIR" && zip -qry "$IPA_PATH" Payload)
echo "Unsigned IPA created at $IPA_PATH"