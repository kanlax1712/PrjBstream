#!/bin/bash
# Simple icon generation using ImageMagick or sips (macOS)

if command -v convert &> /dev/null; then
  # ImageMagick
  convert -size 192x192 xc:'#020617' -fill '#06b6d4' -draw 'circle 96,96 96,20' -fill white -pointsize 80 -font Arial-Bold -gravity center -annotate +0+0 'B' icon-192.png
  convert -size 512x512 xc:'#020617' -fill '#06b6d4' -draw 'circle 256,256 256,50' -fill white -pointsize 210 -font Arial-Bold -gravity center -annotate +0+0 'B' icon-512.png
  echo "Icons generated with ImageMagick"
elif command -v sips &> /dev/null; then
  # macOS sips - create simple colored squares as fallback
  sips -c 192 192 --setProperty format png /System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericDocumentIcon.icns --out icon-192.png 2>/dev/null || echo "Note: Install ImageMagick for better icons"
  sips -c 512 512 --setProperty format png /System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericDocumentIcon.icns --out icon-512.png 2>/dev/null || echo "Note: Install ImageMagick for better icons"
  echo "Basic icons created. For better icons, install ImageMagick: brew install imagemagick"
else
  echo "Creating placeholder icons..."
  # Create minimal 1x1 PNG files as placeholders
  echo -e '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82' > icon-192.png
  cp icon-192.png icon-512.png
  echo "Placeholder icons created. Please replace with proper icons."
fi
