#!/usr/bin/env node

/**
 * Simple Avatar Upload to Firebase Storage
 * Uses the existing Firebase config from the app
 */

const fs = require('fs');
const path = require('path');

// Import Firebase configuration
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');

// Firebase config (you may need to update this with your actual config)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "gestalts-mobile.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "gestalts-mobile",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "gestalts-mobile.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: process.env.FIREBASE_APP_ID || "your-app-id"
};

async function uploadAvatars() {
  console.log('🎭 Uploading Character Avatars to Firebase Storage');
  console.log('=================================================\n');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const storage = getStorage(app);
    
    const avatarsDir = path.join(__dirname, '..', 'assets', 'gestalts-characters');
    
    // Check if files exist
    const alexFile = path.join(avatarsDir, 'gestalts-boy.svg');
    const emmaFile = path.join(avatarsDir, 'gestalts-girl.svg');
    
    if (!fs.existsSync(alexFile)) {
      console.error('❌ Alex avatar not found:', alexFile);
      console.log('   Run: npm run download-avatars-local');
      return;
    }
    
    if (!fs.existsSync(emmaFile)) {
      console.error('❌ Emma avatar not found:', emmaFile);
      console.log('   Run: npm run download-avatars-local');
      return;
    }
    
    const uploads = [
      { name: 'Alex', file: alexFile, id: 'gestalts-boy' },
      { name: 'Emma', file: emmaFile, id: 'gestalts-girl' }
    ];
    
    const results = [];
    
    for (const upload of uploads) {
      console.log(`📤 Uploading ${upload.name} avatar...`);
      
      // Read file
      const fileBuffer = fs.readFileSync(upload.file);
      
      // Create storage reference
      const storageRef = ref(storage, `public/gestalts-characters/${upload.id}.svg`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, fileBuffer, {
        contentType: 'image/svg+xml',
        cacheControl: 'public, max-age=31536000'
      });
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log(`✅ ${upload.name} uploaded successfully!`);
      
      results.push({
        name: upload.name,
        id: upload.id,
        url: downloadURL
      });
    }
    
    console.log('\n🎉 All avatars uploaded successfully!\n');
    
    console.log('📊 Firebase Storage URLs:');
    results.forEach(result => {
      console.log(`  • ${result.name}: ${result.url}`);
    });
    
    console.log('\n📝 Updated Character Definitions:');
    console.log('Replace the avatarUrl values in src/state/useStorybookStore-firebase.ts:\n');
    
    results.forEach(result => {
      console.log(`// ${result.name}`);
      console.log(`avatarUrl: '${result.url}',`);
    });
    
    console.log('\n💡 Benefits:');
    console.log('  ✅ Faster loading with Firebase CDN');
    console.log('  ✅ Better reliability and offline support');
    console.log('  ✅ Consistent with your app infrastructure');
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('  1. Check your Firebase configuration');
    console.log('  2. Ensure you have Storage permissions');
    console.log('  3. Verify the avatar files exist');
    console.log('  4. Try the manual upload method instead');
  }
}

uploadAvatars();
