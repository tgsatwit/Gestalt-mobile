# Firebase Setup Guide

To enable cloud storage for your storybook feature, you need to configure Firebase. Without Firebase, the app will still work but will only use local storage.

## Quick Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Name your project (e.g., "gestalts-app")
   - Follow the setup wizard

2. **Enable Firestore Database**
   - In Firebase Console, go to "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" for development
   - Select your region

3. **Enable Storage**
   - In Firebase Console, go to "Storage"
   - Click "Get started"
   - Choose "Start in test mode" for development

4. **Get Your Configuration**
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Click "Add app" > Web (</> icon)
   - Register your app
   - Copy the configuration values

5. **Add to .env File**
   Add these values to your `.env` file in the project root:

   ```bash
   # Firebase Configuration
   FIREBASE_API_KEY=your-api-key-here
   FIREBASE_AUTH_DOMAIN=your-auth-domain.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-storage-bucket.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   FIREBASE_APP_ID=your-app-id
   ```

6. **Deploy Security Rules**
   ```bash
   # Install Firebase CLI if you haven't already
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase in your project
   firebase init
   
   # Deploy the security rules
   firebase deploy --only firestore:rules,storage:rules
   ```

## What Works Without Firebase

Even without Firebase configured, the app will:
- ✅ Generate stories using AI
- ✅ Create character avatars
- ✅ Save data locally on your device
- ✅ Include your child as a character in stories
- ✅ Apply all wizard selections to story generation

## What Firebase Adds

With Firebase configured:
- ☁️ Cloud backup of all stories and characters
- 🔄 Sync across multiple devices
- 🖼️ Permanent storage of generated images
- 👥 Multi-user support with data isolation
- 🔒 Secure data storage with authentication

## Troubleshooting

If you see warnings about Firebase not being configured:
- This is normal if you haven't set up Firebase yet
- The app will continue to work with local storage
- Your stories and characters are still saved locally

To verify Firebase is working:
1. Check the console for "Firebase initialized successfully"
2. Create a character or story
3. Check Firebase Console > Firestore Database to see if data appears

## Security Note

The provided security rules ensure:
- Users can only access their own data
- Data structure validation
- Proper authentication requirements

For production, consider:
- Enabling Firebase Authentication
- Updating security rules for stricter access
- Setting up backup policies