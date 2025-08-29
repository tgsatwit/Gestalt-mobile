#!/bin/bash

# Build script for Gestalts iOS app
# This script builds and archives the iOS app for distribution

echo "🚀 Starting iOS build process for Gestalts app..."

# Navigate to project directory
cd "$(dirname "$0")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Not in the project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing npm dependencies...${NC}"
npm install

echo -e "${YELLOW}Step 2: Installing iOS dependencies...${NC}"
cd ios
pod install

echo -e "${YELLOW}Step 3: Cleaning build folder...${NC}"
xcodebuild clean -workspace gestalts.xcworkspace -scheme gestalts -configuration Release

echo -e "${YELLOW}Step 4: Building the app...${NC}"
xcodebuild build \
    -workspace gestalts.xcworkspace \
    -scheme gestalts \
    -configuration Release \
    -sdk iphoneos \
    -destination "generic/platform=iOS" \
    CODE_SIGN_IDENTITY="Apple Development: Tim Gillam (YKVUVWXC9Z)" \
    DEVELOPMENT_TEAM="YOUR_TEAM_ID"

echo -e "${YELLOW}Step 5: Archiving the app...${NC}"
xcodebuild archive \
    -workspace gestalts.xcworkspace \
    -scheme gestalts \
    -configuration Release \
    -sdk iphoneos \
    -archivePath ~/Desktop/gestalts.xcarchive \
    CODE_SIGN_IDENTITY="Apple Development: Tim Gillam (YKVUVWXC9Z)" \
    DEVELOPMENT_TEAM="YOUR_TEAM_ID"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Archive created successfully at ~/Desktop/gestalts.xcarchive${NC}"
    echo -e "${GREEN}You can now upload this to TestFlight using Xcode Organizer${NC}"
    
    # Open the archive in Organizer
    open ~/Desktop/gestalts.xcarchive
else
    echo -e "${RED}❌ Build failed. Please check the errors above.${NC}"
    exit 1
fi
