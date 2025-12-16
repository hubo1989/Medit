#!/bin/bash

# Icon generation script using rsvg-convert
# Source SVG files
SVG_FILE="icons/icon.svg"              # No padding - for browser extension
SVG_FILE_MOBILE="icons/icon-mobile.svg" # With padding - for mobile apps

# Check if rsvg-convert is available
if ! command -v rsvg-convert &> /dev/null; then
    echo "Error: rsvg-convert not found. Install it with: brew install librsvg"
    exit 1
fi

# Check if source SVG exists
if [ ! -f "$SVG_FILE" ]; then
    echo "Error: Source SVG file not found: $SVG_FILE"
    exit 1
fi

if [ ! -f "$SVG_FILE_MOBILE" ]; then
    echo "Error: Mobile SVG file not found: $SVG_FILE_MOBILE"
    exit 1
fi

echo "Generating icons..."

# ============================================
# Browser Extension Icons (no padding)
# ============================================
echo "-> Browser extension icons..."
rsvg-convert -w 16 -h 16 "$SVG_FILE" -o icons/icon16.png
rsvg-convert -w 48 -h 48 "$SVG_FILE" -o icons/icon48.png
rsvg-convert -w 128 -h 128 "$SVG_FILE" -o icons/icon128.png

# ============================================
# Android App Icons (mipmap) - with padding
# ============================================
echo "-> Android app icons..."
# mdpi: 48x48, hdpi: 72x72, xhdpi: 96x96, xxhdpi: 144x144, xxxhdpi: 192x192
rsvg-convert -w 48 -h 48 "$SVG_FILE_MOBILE" -o android/app/src/main/res/mipmap-mdpi/ic_launcher.png
rsvg-convert -w 72 -h 72 "$SVG_FILE_MOBILE" -o android/app/src/main/res/mipmap-hdpi/ic_launcher.png
rsvg-convert -w 96 -h 96 "$SVG_FILE_MOBILE" -o android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
rsvg-convert -w 144 -h 144 "$SVG_FILE_MOBILE" -o android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
rsvg-convert -w 192 -h 192 "$SVG_FILE_MOBILE" -o android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png

# ============================================
# Android Adaptive Icon Foreground (drawable) - with padding
# ============================================
echo "-> Android adaptive icon foreground..."
# Foreground needs to be larger (108dp base, with safe zone)
# mdpi: 108x108, hdpi: 162x162, xhdpi: 216x216, xxhdpi: 324x324, xxxhdpi: 432x432
rsvg-convert -w 108 -h 108 "$SVG_FILE_MOBILE" -o android/app/src/main/res/drawable-mdpi/ic_launcher_foreground.png
rsvg-convert -w 162 -h 162 "$SVG_FILE_MOBILE" -o android/app/src/main/res/drawable-hdpi/ic_launcher_foreground.png
rsvg-convert -w 216 -h 216 "$SVG_FILE_MOBILE" -o android/app/src/main/res/drawable-xhdpi/ic_launcher_foreground.png
rsvg-convert -w 324 -h 324 "$SVG_FILE_MOBILE" -o android/app/src/main/res/drawable-xxhdpi/ic_launcher_foreground.png
rsvg-convert -w 432 -h 432 "$SVG_FILE_MOBILE" -o android/app/src/main/res/drawable-xxxhdpi/ic_launcher_foreground.png

# ============================================
# iOS App Icons - with padding
# ============================================
echo "-> iOS app icons..."
IOS_ICON_DIR="ios/Runner/Assets.xcassets/AppIcon.appiconset"
rsvg-convert -w 20 -h 20 "$SVG_FILE_MOBILE" -o "$IOS_ICON_DIR/Icon-App-20x20@1x.png"
rsvg-convert -w 40 -h 40 "$SVG_FILE_MOBILE" -o "$IOS_ICON_DIR/Icon-App-20x20@2x.png"
rsvg-convert -w 60 -h 60 "$SVG_FILE_MOBILE" -o "$IOS_ICON_DIR/Icon-App-20x20@3x.png"
rsvg-convert -w 29 -h 29 "$SVG_FILE_MOBILE" -o "$IOS_ICON_DIR/Icon-App-29x29@1x.png"
rsvg-convert -w 58 -h 58 "$SVG_FILE_MOBILE" -o "$IOS_ICON_DIR/Icon-App-29x29@2x.png"
rsvg-convert -w 87 -h 87 "$SVG_FILE_MOBILE" -o "$IOS_ICON_DIR/Icon-App-29x29@3x.png"
rsvg-convert -w 40 -h 40 "$SVG_FILE_MOBILE" -o "$IOS_ICON_DIR/Icon-App-40x40@1x.png"
rsvg-convert -w 80 -h 80 "$SVG_FILE_MOBILE" -o "$IOS_ICON_DIR/Icon-App-40x40@2x.png"
rsvg-convert -w 120 -h 120 "$SVG_FILE_MOBILE" -o "$IOS_ICON_DIR/Icon-App-40x40@3x.png"
rsvg-convert -w 50 -h 50 "$SVG_FILE_MOBILE" -o "$IOS_ICON_DIR/Icon-App-50x50@1x.png"
rsvg-convert -w 100 -h 100 "$SVG_FILE_MOBILE" -o "$IOS_ICON_DIR/Icon-App-50x50@2x.png"
rsvg-convert -w 57 -h 57 "$SVG_FILE_MOBILE" -o "$IOS_ICON_DIR/Icon-App-57x57@1x.png"
rsvg-convert -w 114 -h 114 "$SVG_FILE_MOBILE" -o "$IOS_ICON_DIR/Icon-App-57x57@2x.png"
rsvg-convert -w 120 -h 120 "$SVG_FILE_MOBILE" -o "$IOS_ICON_DIR/Icon-App-60x60@2x.png"
rsvg-convert -w 180 -h 180 "$SVG_FILE_MOBILE" -o "$IOS_ICON_DIR/Icon-App-60x60@3x.png"
rsvg-convert -w 72 -h 72 "$SVG_FILE_MOBILE" -o "$IOS_ICON_DIR/Icon-App-72x72@1x.png"
rsvg-convert -w 144 -h 144 "$SVG_FILE_MOBILE" -o "$IOS_ICON_DIR/Icon-App-72x72@2x.png"
rsvg-convert -w 76 -h 76 "$SVG_FILE_MOBILE" -o "$IOS_ICON_DIR/Icon-App-76x76@1x.png"
rsvg-convert -w 152 -h 152 "$SVG_FILE_MOBILE" -o "$IOS_ICON_DIR/Icon-App-76x76@2x.png"
rsvg-convert -w 167 -h 167 "$SVG_FILE_MOBILE" -o "$IOS_ICON_DIR/Icon-App-83.5x83.5@2x.png"
rsvg-convert -w 1024 -h 1024 "$SVG_FILE_MOBILE" -o "$IOS_ICON_DIR/Icon-App-1024x1024@1x.png"

# ============================================
# macOS App Icons - with padding
# ============================================
echo "-> macOS app icons..."
MACOS_ICON_DIR="macos/Runner/Assets.xcassets/AppIcon.appiconset"
rsvg-convert -w 16 -h 16 "$SVG_FILE_MOBILE" -o "$MACOS_ICON_DIR/app_icon_16.png"
rsvg-convert -w 32 -h 32 "$SVG_FILE_MOBILE" -o "$MACOS_ICON_DIR/app_icon_32.png"
rsvg-convert -w 64 -h 64 "$SVG_FILE_MOBILE" -o "$MACOS_ICON_DIR/app_icon_64.png"
rsvg-convert -w 128 -h 128 "$SVG_FILE_MOBILE" -o "$MACOS_ICON_DIR/app_icon_128.png"
rsvg-convert -w 256 -h 256 "$SVG_FILE_MOBILE" -o "$MACOS_ICON_DIR/app_icon_256.png"
rsvg-convert -w 512 -h 512 "$SVG_FILE_MOBILE" -o "$MACOS_ICON_DIR/app_icon_512.png"
rsvg-convert -w 1024 -h 1024 "$SVG_FILE_MOBILE" -o "$MACOS_ICON_DIR/app_icon_1024.png"

echo "Done! All icons generated successfully."
