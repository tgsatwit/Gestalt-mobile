# Firebase Authentication Setup Guide

This guide covers setting up Firebase Authentication with Email/Password and Apple Sign-In for the Gestalts mobile app.

## Overview

The authentication system includes:
- Email/Password authentication
- Apple Sign-In for iOS
- User profile creation in Firestore
- Automatic user profile management

## Firebase Console Setup

### 1. Enable Authentication Methods

1. **Go to Firebase Console** → Your Project → Authentication → Sign-in method

2. **Enable Email/Password:**
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Save

3. **Enable Apple:**
   - Click on "Apple"
   - Toggle "Enable" to ON
   - You'll need to configure Apple Sign-In later (see Apple Developer Console section)

### 2. Configure Firestore Database

1. **Go to Firestore Database** → Rules
2. **Update Firestore Rules** to allow authenticated users to manage their profiles:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read and write their own child profiles
    match /childProfiles/{profileId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Users can read and write their own stories and memories
    match /stories/{storyId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /memories/{memoryId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

### 3. Authentication Domain Configuration

1. **Go to Authentication** → Settings → Authorized domains
2. **Ensure your domains are listed:**
   - Your production domain
   - localhost (for development)
   - Any staging domains

## Apple Developer Console Setup

### 1. Enable Apple Sign-In for Your App ID

1. **Go to Apple Developer Console** → Certificates, Identifiers & Profiles
2. **Select your App ID** (or create one if you don't have one)
3. **Enable "Sign In with Apple"** capability
4. **Configure the capability:**
   - Primary App ID: Your main app ID
   - Save the configuration

### 2. Create a Service ID (for Web/Firebase)

1. **Go to Identifiers** → Services IDs → Create new
2. **Configuration:**
   - Description: "Gestalts Apple Sign-In Service"
   - Identifier: `com.yourcompany.gestalts.signin` (must be different from your app ID)
   - Enable "Sign In with Apple"

3. **Configure Web Authentication:**
   - Primary App ID: Your main app ID
   - Return URLs: Add your Firebase Auth domain
   - Example: `https://your-project-id.firebaseapp.com/__/auth/handler`

### 3. Create a Key for Apple Sign-In

1. **Go to Keys** → Create new key
2. **Configuration:**
   - Key Name: "Apple Sign-In Key"
   - Enable "Sign In with Apple"
   - Configure with your Primary App ID
3. **Download the .p8 key file** (keep this secure!)
4. **Note the Key ID** and **Team ID** (you'll need these for Firebase)

### 4. Configure Firebase with Apple Credentials

1. **Back in Firebase Console** → Authentication → Sign-in method → Apple
2. **Enter the following:**
   - Service ID: The service ID you created
   - Apple Team ID: Your Apple Developer Team ID
   - Key ID: The Key ID from the key you created
   - Private Key: Copy the contents of the .p8 file

## Xcode Configuration

### 1. Add Sign In with Apple Capability

1. **Open your Xcode project**
2. **Select your target** → Signing & Capabilities
3. **Click "+ Capability"** and search for "Sign In with Apple"
4. **Add the capability** (this should update your entitlements file automatically)

### 2. Verify Entitlements

Your `gestalts.entitlements` file should contain:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>com.apple.developer.applesignin</key>
    <array>
      <string>Default</string>
    </array>
  </dict>
</plist>
```

### 3. Update Bundle Identifier

Make sure your bundle identifier matches the App ID you configured in Apple Developer Console.

## Environment Configuration

### 1. Firebase Configuration

Make sure your Firebase configuration is properly set in your `app.config.js`:

```javascript
export default {
  // ... other config
  extra: {
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    }
  }
};
```

### 2. Environment Variables

Create/update your `.env` file:

```
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
```

## Testing the Setup

### 1. Email/Password Authentication

1. **Build and run the app**
2. **Navigate to the Sign Up tab**
3. **Fill out the form** with valid information
4. **Submit the form** - you should be automatically signed in
5. **Check Firebase Console** → Authentication → Users to see the new user
6. **Check Firestore** → users collection for the user profile

### 2. Apple Sign-In

1. **Build and run on a physical iOS device** (Apple Sign-In doesn't work in simulator)
2. **Make sure you're signed into iCloud** on the device
3. **Tap "Continue with Apple"**
4. **Follow the Apple Sign-In flow**
5. **Verify the user is created** in Firebase Console

### 3. User Profile Creation

After successful authentication, verify:
- User document is created in Firestore `users` collection
- Profile contains: firstName, lastName, email, signUpDate, provider
- User can navigate to the main app interface

## Troubleshooting

### Common Issues

1. **Apple Sign-In not available**
   - Ensure you're testing on a physical device
   - Check that Apple Sign-In is enabled in device settings
   - Verify entitlements are correctly set

2. **Firebase Auth errors**
   - Check Firebase Console for authentication logs
   - Verify API keys and configuration
   - Ensure Firestore rules allow user document creation

3. **App crashes on authentication**
   - Check iOS logs in Xcode console
   - Verify all dependencies are properly installed
   - Check that Firebase services are initialized correctly

### Debug Steps

1. **Enable Firebase Debug Logging:**
   ```javascript
   import { getAuth, connectAuthEmulator } from 'firebase/auth';
   
   // Add this for development only
   if (__DEV__) {
     // Enable debug logging
     import('firebase/app').then(({ initializeApp }) => {
       // Firebase debug logging configuration
     });
   }
   ```

2. **Check Network Requests:**
   - Use iOS simulator network debugging
   - Verify Firebase API calls are successful

3. **Verify User Creation:**
   - Check Firebase Console → Authentication → Users
   - Check Firestore → users collection
   - Verify user profile fields are correctly populated

## Security Considerations

1. **Firestore Rules:** Ensure users can only access their own data
2. **API Keys:** Never commit Firebase API keys to public repositories
3. **Apple Keys:** Keep Apple Sign-In private keys secure
4. **User Data:** Only store necessary user information
5. **Testing:** Use separate Firebase projects for development and production

## Additional Configuration for Production

### 1. iOS App Store Configuration

1. **Update Privacy Policy** to mention authentication methods
2. **Add App Transport Security** exceptions if needed
3. **Configure push notifications** if using Firebase messaging

### 2. Firebase Security

1. **Enable App Check** for production
2. **Configure rate limiting** for authentication
3. **Set up monitoring** and alerts
4. **Regular security audits** of Firestore rules

---

## Summary

This authentication setup provides:
- ✅ Email/Password authentication
- ✅ Apple Sign-In for iOS
- ✅ Automatic user profile creation in Firestore
- ✅ Secure user data management
- ✅ Proper navigation flow based on authentication state

The system automatically handles user creation, profile management, and secure authentication state across app sessions.
