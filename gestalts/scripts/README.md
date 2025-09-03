# Gestalts Characters Scripts

This directory contains scripts for generating and managing the Gestalts Characters (Alex and Emma).

## Scripts

### 1. deployRules.sh

**Purpose**: Deploys Firebase Firestore and Storage rules to fix permission errors.

**Usage**:
```bash
# Deploy both Firestore and Storage rules
npm run deploy-rules
# or
bash scripts/deployRules.sh
```

**What it does**:
- Validates Firebase CLI is installed and logged in
- Deploys updated Firestore rules with proper storybook permissions
- Deploys updated Storage rules with user-specific file access
- Provides links to Firebase Console for rule management

### 2. generateLocalCharacters.js

**Purpose**: Generates character data locally for immediate use in the app.

**Usage**:
```bash
# Generate character code (default)
npm run generate-characters
# or
node scripts/generateLocalCharacters.js generate

# Preview avatar URLs
npm run preview-characters
# or
node scripts/generateLocalCharacters.js preview

# Download avatars locally
npm run download-avatars-local

# Upload avatars to Firebase Storage
npm run upload-avatars

# Output as JSON
node scripts/generateLocalCharacters.js json
```

**Output**: TypeScript/JavaScript code that can be copied directly into the app.

### 2. generateGestaltsCharacters.js

**Purpose**: Creates characters in Firebase Firestore for centralized management.

**Prerequisites**:
- Firebase Admin SDK service account key
- Firebase project setup

**Usage**:
```bash
# Set environment variable
export FIREBASE_SERVICE_ACCOUNT_KEY=/path/to/serviceAccount.json

# Create characters in Firestore
node scripts/generateGestaltsCharacters.js create

# List existing characters
node scripts/generateGestaltsCharacters.js list

# Delete all characters
node scripts/generateGestaltsCharacters.js delete
```

## Characters

### Alex (Boy Character)
- **ID**: `gestalts-boy`
- **Personality**: Curious, brave, and kind-hearted
- **Appearance**: Warm brown hair, bright curious eyes, friendly smile
- **Style**: Casual, comfortable clothes in earth tones

### Emma (Girl Character)
- **ID**: `gestalts-girl`
- **Personality**: Creative, empathetic, and full of joy
- **Appearance**: Curly blonde hair, bright green eyes, infectious smile
- **Style**: Bright, cheerful colors with fun patterns

## Avatar Generation

The characters now use **Firebase Storage** for reliable, high-performance avatars:
- Direct JPEG images hosted on Firebase Storage
- CDN-backed for fast global delivery
- No dependency on external APIs
- Consistent with app infrastructure

**Current Avatar URLs**:
- Alex: `https://firebasestorage.googleapis.com/v0/b/gestalts-mobile.firebasestorage.app/o/avatars%2FAlex-Avatar.jpeg?alt=media&token=5ec35a3b-1ee4-45a1-a193-53f2c60300a0`
- Emma: `https://firebasestorage.googleapis.com/v0/b/gestalts-mobile.firebasestorage.app/o/avatars%2FEmma-Avatar.jpeg?alt=media&token=1721fb1c-5fa6-4cf0-9f09-08c8bb890d35`

## Integration

### Current Implementation
The characters are hardcoded in `useStorybookStore-firebase.ts` in the `loadGestaltsCharacters()` method.

### Future Enhancement
For dynamic management, characters could be stored in:
- Firebase Firestore (global collection)
- Local SQLite database
- Remote API endpoint

## Development Workflow

1. **Modify Characters**: Edit the character definitions in `generateLocalCharacters.js`
2. **Generate Code**: Run `npm run generate-characters`
3. **Update App**: Copy the generated code into `useStorybookStore-firebase.ts`
4. **Test**: Verify characters appear in the Storybook Characters tab
5. **Preview**: Use `npm run preview-characters` to see avatar URLs

## Avatar Customization

To modify character appearances, update the avatar URLs in the Firebase Storage:

1. **Upload new images** to Firebase Storage at the same paths
2. **Update URLs** in the `getCharacterAvatarUrl` function if paths change
3. **Clear app cache** to ensure new images load

**Current Storage Paths**:
- Alex: `avatars/generic/Alex-Avatar.jpeg`
- Emma: `avatars/generic/Emma-Avatar.jpeg`

## Troubleshooting

### Characters Not Appearing
1. Check that `loadGestaltsCharacters()` is called in the app
2. Verify the character array is properly formatted
3. Ensure avatar URLs are accessible

### Avatar Loading Issues
1. Test avatar URLs in browser
2. Check network connectivity
3. Verify Firebase Storage permissions
4. Clear app cache if images were recently updated

### Firebase Issues (if using Firestore)
1. Verify service account key path
2. Check Firebase project permissions
3. Ensure Firestore rules allow read access
