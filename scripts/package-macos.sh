#!/bin/zsh

set -euo pipefail

SCRIPT_DIR="${0:A:h}"
PROJECT_DIR="${SCRIPT_DIR:h}"
OUTPUT_DIR="$PROJECT_DIR/dist"
STAGING_DIR="$(mktemp -d /private/tmp/timetimer-package.XXXXXX)"
APP_PATH="$STAGING_DIR/TimeTimer-darwin-arm64/TimeTimer.app"
FINAL_ZIP="$OUTPUT_DIR/TimeTimer-2.0.0-arm64.zip"
RAW_OUTPUT="$OUTPUT_DIR/TimeTimer-darwin-arm64"

cleanup() {
  rm -rf "$STAGING_DIR"
}
trap cleanup EXIT

mkdir -p "$OUTPUT_DIR"

"$PROJECT_DIR/node_modules/.bin/electron-packager" \
  "$PROJECT_DIR" \
  TimeTimer \
  --platform=darwin \
  --arch=arm64 \
  --out="$STAGING_DIR" \
  --overwrite \
  --asar \
  --app-bundle-id=ch.sylvainbovat.timetimer \
  --icon="$PROJECT_DIR/assets/timetimer" \
  --ignore='^/(dist|TimeTimer-darwin-arm64)(/|$)'

xattr -cr "$APP_PATH"
codesign --force --deep --sign - --timestamp=none "$APP_PATH"
codesign --verify --deep --strict --verbose=2 "$APP_PATH"

rm -rf "$RAW_OUTPUT"
rm -f "$FINAL_ZIP"
COPYFILE_DISABLE=1 ditto --norsrc -c -k --keepParent "$APP_PATH" "$FINAL_ZIP"

echo "Archive créée : $FINAL_ZIP"
