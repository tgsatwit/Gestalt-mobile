#!/bin/bash

# Set up EAS environment variables for production
echo "Setting up EAS environment variables..."

# ElevenLabs
eas env:create --name ELEVENLABS_API_KEY --value "sk_85547fd02516d6dd30b819b6fed5708ae70521dfc774769b" --environment production
eas env:create --name LANGUAGE_COACH_AGENT_ID --value "va8wh90V9tqH3TSuqEky" --environment production
eas env:create --name PARENT_SUPPORT_AGENT_ID --value "Vh2JDkXXbSsD2sFbm9XG" --environment production
eas env:create --name CHILD_MODE_AGENT_ID --value "O9hZSxrfAjdWixrZTfk3" --environment production

# Gemini
eas env:create --name GEMINI_API_KEY --value "AIzaSyBWthPCLGAKUDVhZmEzY8Y76cfS2V7Y4FA" --environment production

# Firebase
eas env:create --name FIREBASE_API_KEY --value "AIzaSyACgFoLyTsEcxlE8odn36LjdhtdEW1ht34" --environment production
eas env:create --name FIREBASE_AUTH_DOMAIN --value "gestalts-mobile.firebaseapp.com" --environment production
eas env:create --name FIREBASE_PROJECT_ID --value "gestalts-mobile" --environment production
eas env:create --name FIREBASE_STORAGE_BUCKET --value "gestalts-mobile.firebasestorage.app" --environment production
eas env:create --name FIREBASE_MESSAGING_SENDER_ID --value "630723947096" --environment production
eas env:create --name FIREBASE_APP_ID --value "1:630723947096:web:6c564c1d9213c07375b82d" --environment production

echo "Done! Check with: eas env:list --environment production"