#!/bin/bash

# Complete Avatar Upload Solution
# This script provides multiple methods to upload character avatars

echo "🎭 Gestalts Character Avatar Upload"
echo "=================================="
echo ""

# Check if avatar files exist
ASSETS_DIR="assets/gestalts-characters"
ALEX_FILE="$ASSETS_DIR/gestalts-boy.svg"
EMMA_FILE="$ASSETS_DIR/gestalts-girl.svg"

if [ ! -f "$ALEX_FILE" ] || [ ! -f "$EMMA_FILE" ]; then
    echo "❌ Avatar files not found. Downloading them first..."
    echo ""
    node scripts/downloadAvatarsLocal.js download
    echo ""
fi

echo "📋 Available Upload Methods:"
echo ""
echo "1. 🌐 Manual Upload (Recommended - Most Reliable)"
echo "   • Go to: https://console.firebase.google.com/project/gestalts-mobile/storage"
echo "   • Create folder: public/gestalts-characters/"
echo "   • Upload files:"
echo "     - $ALEX_FILE → gestalts-boy.svg"
echo "     - $EMMA_FILE → gestalts-girl.svg"
echo "   • Make files public (add allUsers as Storage Object Viewer)"
echo ""

echo "2. 🛠️  Using gsutil (if Google Cloud SDK installed)"
if command -v gsutil &> /dev/null; then
    echo "   ✅ gsutil found - you can use this method"
    PROJECT_ID=$(firebase use --current 2>/dev/null || echo "gestalts-mobile")
    BUCKET="gs://${PROJECT_ID}.appspot.com"
    echo "   Commands:"
    echo "     gsutil cp $ALEX_FILE $BUCKET/public/gestalts-characters/gestalts-boy.svg"
    echo "     gsutil cp $EMMA_FILE $BUCKET/public/gestalts-characters/gestalts-girl.svg"
    echo "     gsutil acl ch -u AllUsers:R $BUCKET/public/gestalts-characters/gestalts-boy.svg"
    echo "     gsutil acl ch -u AllUsers:R $BUCKET/public/gestalts-characters/gestalts-girl.svg"
else
    echo "   ❌ gsutil not found - install Google Cloud SDK to use this method"
fi
echo ""

echo "3. 📱 Copy to App Assets (Alternative)"
echo "   • Files are already in: $ASSETS_DIR/"
echo "   • You can reference them directly in the app"
echo "   • Use: require('./assets/gestalts-characters/CHARACTER_ID.svg')"
echo ""

echo "🎯 Recommended Approach:"
echo "1. Use Method 1 (Manual Upload) - it's the most straightforward"
echo "2. After upload, the URLs will be:"
PROJECT_ID=$(firebase use --current 2>/dev/null || echo "gestalts-mobile")
echo "   • Alex: https://storage.googleapis.com/${PROJECT_ID}.appspot.com/public/gestalts-characters/gestalts-boy.svg"
echo "   • Emma: https://storage.googleapis.com/${PROJECT_ID}.appspot.com/public/gestalts-characters/gestalts-girl.svg"
echo ""

echo "📝 After Upload:"
echo "Update src/state/useStorybookStore-firebase.ts with the new URLs"
echo ""

# Ask user which method they want to use
read -p "Which method would you like to use? (1=manual, 2=gsutil, 3=local): " choice

case $choice in
    1)
        echo ""
        echo "🌐 Opening Firebase Console..."
        open "https://console.firebase.google.com/project/gestalts-mobile/storage"
        echo "📋 Manual upload instructions are above"
        ;;
    2)
        if command -v gsutil &> /dev/null; then
            echo ""
            echo "🛠️  Using gsutil..."
            PROJECT_ID=$(firebase use --current)
            BUCKET="gs://${PROJECT_ID}.appspot.com"
            
            echo "Uploading Alex..."
            gsutil cp "$ALEX_FILE" "$BUCKET/public/gestalts-characters/gestalts-boy.svg"
            gsutil acl ch -u AllUsers:R "$BUCKET/public/gestalts-characters/gestalts-boy.svg"
            
            echo "Uploading Emma..."
            gsutil cp "$EMMA_FILE" "$BUCKET/public/gestalts-characters/gestalts-girl.svg"
            gsutil acl ch -u AllUsers:R "$BUCKET/public/gestalts-characters/gestalts-girl.svg"
            
            echo "✅ Upload complete!"
        else
            echo "❌ gsutil not available"
        fi
        ;;
    3)
        echo ""
        echo "📱 Using local assets - no upload needed"
        echo "Files are available at: $ASSETS_DIR/"
        ;;
    *)
        echo ""
        echo "ℹ️  No method selected. Files are ready for manual upload."
        ;;
esac

echo ""
echo "🎉 Avatar setup complete!"
