# Manual Avatar Upload Guide

The character avatars have been downloaded to `assets/gestalts-characters/`. Here's how to upload them to Firebase Storage:

## Files Downloaded
- `gestalts-boy.svg` (Alex - 4KB)
- `gestalts-girl.svg` (Emma - 5KB)

## Option 1: Firebase Console Upload (Recommended)

1. **Go to Firebase Console**
   - Open https://console.firebase.google.com/project/gestalts-mobile/storage
   - Navigate to your Storage bucket

2. **Create Directory Structure**
   - Click "Create folder"
   - Name: `public`
   - Inside `public`, create folder: `gestalts-characters`

3. **Upload Files**
   - Navigate to `public/gestalts-characters/`
   - Click "Upload files"
   - Select both SVG files:
     - `gestalts-boy.svg`
     - `gestalts-girl.svg`

4. **Make Files Public**
   - Click on each uploaded file
   - Go to "Permissions" tab
   - Click "Add member"
   - Add: `allUsers`
   - Role: `Storage Object Viewer`
   - Click "Save"

5. **Get Public URLs**
   - The new public URLs are:
   - Alex: `https://firebasestorage.googleapis.com/v0/b/gestalts-mobile.firebasestorage.app/o/avatars%2FAlex-Avatar.jpeg?alt=media&token=5ec35a3b-1ee4-45a1-a193-53f2c60300a0`
   - Emma: `https://firebasestorage.googleapis.com/v0/b/gestalts-mobile.firebasestorage.app/o/avatars%2FEmma-Avatar.jpeg?alt=media&token=1721fb1c-5fa6-4cf0-9f09-08c8bb890d35`

## Option 2: Firebase CLI Upload

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Upload files
firebase storage:upload assets/gestalts-characters/gestalts-boy.svg public/gestalts-characters/gestalts-boy.svg
firebase storage:upload assets/gestalts-characters/gestalts-girl.svg public/gestalts-characters/gestalts-girl.svg
```

## Option 3: Use the Admin Script

If you have a Firebase service account key:

```bash
# Set environment variable
export FIREBASE_SERVICE_ACCOUNT_KEY=/path/to/your/serviceAccount.json

# Run the upload script
npm run download-avatars
```

## Update Character URLs

After uploading, update the character definitions in `src/state/useStorybookStore-firebase.ts`:

```javascript
const gestaltsCharacters: Character[] = [
  {
    id: 'gestalts-boy',
    name: 'Alex',
    type: 'gestalts',
    avatarUrl: 'https://firebasestorage.googleapis.com/v0/b/gestalts-mobile.firebasestorage.app/o/avatars%2FAlex-Avatar.jpeg?alt=media&token=5ec35a3b-1ee4-45a1-a193-53f2c60300a0',
    // ... rest of character definition
  },
  {
    id: 'gestalts-girl',
    name: 'Emma',
    type: 'gestalts',
    avatarUrl: 'https://firebasestorage.googleapis.com/v0/b/gestalts-mobile.firebasestorage.app/o/avatars%2FEmma-Avatar.jpeg?alt=media&token=1721fb1c-5fa6-4cf0-9f09-08c8bb890d35',
    // ... rest of character definition
  }
];
```

## Benefits

✅ **Faster Loading**: Firebase CDN is faster than external APIs  
✅ **More Reliable**: No dependency on third-party services  
✅ **Offline Support**: Better caching and offline availability  
✅ **Consistent Infrastructure**: All assets in one place  
✅ **Version Control**: You control when avatars change  

## Verification

After uploading, test the URLs in your browser:
- https://firebasestorage.googleapis.com/v0/b/gestalts-mobile.firebasestorage.app/o/avatars%2FAlex-Avatar.jpeg?alt=media&token=5ec35a3b-1ee4-45a1-a193-53f2c60300a0
- https://firebasestorage.googleapis.com/v0/b/gestalts-mobile.firebasestorage.app/o/avatars%2FEmma-Avatar.jpeg?alt=media&token=1721fb1c-5fa6-4cf0-9f09-08c8bb890d35

Both should display the character avatars.
