#!/bin/bash

# Upload Character Avatars to Firebase Storage
# This script uploads the downloaded character avatars to Firebase Storage

echo "🎭 Uploading Character Avatars to Firebase Storage"
echo "================================================="

# Check if Firebase CLI is available
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if we're logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run:"
    echo "   firebase login"
    exit 1
fi

# Check if avatar files exist
ASSETS_DIR="assets/gestalts-characters"
ALEX_FILE="$ASSETS_DIR/gestalts-boy.svg"
EMMA_FILE="$ASSETS_DIR/gestalts-girl.svg"

if [ ! -f "$ALEX_FILE" ]; then
    echo "❌ Alex avatar not found: $ALEX_FILE"
    echo "   Run: npm run download-avatars-local"
    exit 1
fi

if [ ! -f "$EMMA_FILE" ]; then
    echo "❌ Emma avatar not found: $EMMA_FILE"
    echo "   Run: npm run download-avatars-local"
    exit 1
fi

echo "📋 Current project:"
firebase use

echo ""
echo "📤 Uploading Alex avatar..."
if firebase storage:upload "$ALEX_FILE" "public/gestalts-characters/gestalts-boy.svg"; then
    echo "✅ Alex avatar uploaded successfully!"
else
    echo "❌ Failed to upload Alex avatar"
    exit 1
fi

echo ""
echo "📤 Uploading Emma avatar..."
if firebase storage:upload "$EMMA_FILE" "public/gestalts-characters/gestalts-girl.svg"; then
    echo "✅ Emma avatar uploaded successfully!"
else
    echo "❌ Failed to upload Emma avatar"
    exit 1
fi

# Get the project ID for URL generation
PROJECT_ID=$(firebase use --current)
BUCKET_NAME="${PROJECT_ID}.appspot.com"

echo ""
echo "🎉 All avatars uploaded successfully!"
echo ""
echo "📊 Public URLs:"
echo "  Alex: https://storage.googleapis.com/$BUCKET_NAME/public/gestalts-characters/gestalts-boy.svg"
echo "  Emma: https://storage.googleapis.com/$BUCKET_NAME/public/gestalts-characters/gestalts-girl.svg"
echo ""
echo "📋 Next Steps:"
echo "1. Test the URLs in your browser to verify they work"
echo "2. Update the character definitions in src/state/useStorybookStore-firebase.ts"
echo "3. Replace the DiceBear URLs with the Firebase Storage URLs"
echo ""
echo "🔧 To update your app:"
echo "   Replace avatarUrl values with the Firebase Storage URLs shown above"
