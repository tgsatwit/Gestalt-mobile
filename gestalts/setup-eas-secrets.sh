#!/bin/bash

# Script to set up EAS secrets for production builds
# Run this script once to configure your secrets in EAS

echo "Setting up EAS secrets for Gestalts app..."
echo "Make sure you have your API keys ready from your .env file"
echo ""

# Set ElevenLabs secrets
eas secret:create --scope project --name ELEVENLABS_API_KEY --value "YOUR_VALUE" --type string
eas secret:create --scope project --name LANGUAGE_COACH_AGENT_ID --value "YOUR_VALUE" --type string
eas secret:create --scope project --name PARENT_SUPPORT_AGENT_ID --value "YOUR_VALUE" --type string
eas secret:create --scope project --name CHILD_MODE_AGENT_ID --value "YOUR_VALUE" --type string

# Set Gemini API key
eas secret:create --scope project --name GEMINI_API_KEY --value "YOUR_VALUE" --type string

# Set Firebase secrets
eas secret:create --scope project --name FIREBASE_API_KEY --value "YOUR_VALUE" --type string
eas secret:create --scope project --name FIREBASE_AUTH_DOMAIN --value "YOUR_VALUE" --type string
eas secret:create --scope project --name FIREBASE_PROJECT_ID --value "YOUR_VALUE" --type string
eas secret:create --scope project --name FIREBASE_STORAGE_BUCKET --value "YOUR_VALUE" --type string
eas secret:create --scope project --name FIREBASE_MESSAGING_SENDER_ID --value "YOUR_VALUE" --type string
eas secret:create --scope project --name FIREBASE_APP_ID --value "YOUR_VALUE" --type string

echo ""
echo "Secrets configured! You can list them with: eas secret:list"
echo "To update a secret: eas secret:update --name SECRET_NAME --value NEW_VALUE"