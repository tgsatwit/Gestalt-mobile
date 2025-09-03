#!/usr/bin/env node

/**
 * Download Character Avatars to Firebase Storage
 * This script downloads the DiceBear avatars and uploads them to Firebase Storage
 * for better performance and reliability
 */

const admin = require('firebase-admin');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Character definitions (same as in the app)
const gestaltsCharacters = [
  {
    id: 'gestalts-boy',
    name: 'Alex',
    avatarUrl: 'https://firebasestorage.googleapis.com/v0/b/gestalts-mobile.firebasestorage.app/o/avatars%2FAlex-Avatar.jpeg?alt=media&token=5ec35a3b-1ee4-45a1-a193-53f2c60300a0'
  },
  {
    id: 'gestalts-girl',
    name: 'Emma',
    avatarUrl: 'https://firebasestorage.googleapis.com/v0/b/gestalts-mobile.firebasestorage.app/o/avatars%2FEmma-Avatar.jpeg?alt=media&token=1721fb1c-5fa6-4cf0-9f09-08c8bb890d35'
  }
];

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountPath) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set');
  console.log('Please set the path to your Firebase service account JSON file');
  process.exit(1);
}

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

const bucket = admin.storage().bucket();

/**
 * Download a file from URL
 */
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(destination);
      });
      
      file.on('error', (err) => {
        fs.unlink(destination, () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Upload file to Firebase Storage
 */
async function uploadToStorage(localPath, storagePath) {
  try {
    const [file] = await bucket.upload(localPath, {
      destination: storagePath,
      metadata: {
        contentType: 'image/svg+xml',
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
    });
    
    // Make the file publicly readable
    await file.makePublic();
    
    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
    return publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

/**
 * Download and upload character avatars
 */
async function downloadCharacterAvatars() {
  console.log('🎭 Downloading Gestalts Character Avatars');
  console.log('========================================\n');
  
  const tempDir = path.join(__dirname, 'temp');
  
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  const results = [];
  
  try {
    for (const character of gestaltsCharacters) {
      console.log(`📥 Downloading ${character.name} avatar...`);
      
      // Download to temp file
      const tempFile = path.join(tempDir, `${character.id}.svg`);
      await downloadFile(character.avatarUrl, tempFile);
      console.log(`✅ Downloaded ${character.name} to temp file`);
      
      // Upload to Firebase Storage
      const storagePath = `public/gestalts-characters/${character.id}.svg`;
      console.log(`📤 Uploading ${character.name} to Firebase Storage...`);
      
      const publicUrl = await uploadToStorage(tempFile, storagePath);
      console.log(`✅ Uploaded ${character.name} to: ${publicUrl}`);
      
      results.push({
        id: character.id,
        name: character.name,
        originalUrl: character.avatarUrl,
        firebaseUrl: publicUrl,
        storagePath: storagePath
      });
      
      // Clean up temp file
      fs.unlinkSync(tempFile);
      console.log(`🧹 Cleaned up temp file for ${character.name}\n`);
    }
    
    // Clean up temp directory
    fs.rmdirSync(tempDir);
    
    console.log('🎉 All character avatars downloaded and uploaded successfully!\n');
    
    // Generate updated character definitions
    console.log('📝 Updated Character Definitions:');
    console.log('Copy this into your useStorybookStore-firebase.ts:\n');
    
    console.log('const gestaltsCharacters: Character[] = [');
    results.forEach((result, index) => {
      const character = gestaltsCharacters.find(c => c.id === result.id);
      console.log('  {');
      console.log(`    id: '${result.id}',`);
      console.log(`    name: '${result.name}',`);
      console.log(`    type: 'gestalts',`);
      console.log(`    avatarUrl: '${result.firebaseUrl}',`);
      console.log(`    createdAt: new Date('2024-01-01'),`);
      console.log(`    updatedAt: new Date('2024-01-01'),`);
      console.log('    visualProfile: {');
      console.log(`      appearance: 'Character appearance description...',`);
      console.log(`      style: 'Character style description...',`);
      console.log(`      personality: 'Character personality description...',`);
      console.log(`      keyFeatures: ['Feature 1', 'Feature 2', 'Feature 3']`);
      console.log('    }');
      console.log(index < results.length - 1 ? '  },' : '  }');
    });
    console.log('];\n');
    
    console.log('📊 Summary:');
    results.forEach(result => {
      console.log(`  • ${result.name}: ${result.firebaseUrl}`);
    });
    
    console.log('\n💡 Benefits of using Firebase Storage URLs:');
    console.log('  • Faster loading (cached by Firebase CDN)');
    console.log('  • More reliable (no dependency on external APIs)');
    console.log('  • Consistent with your app\'s infrastructure');
    console.log('  • Better offline support');
    
  } catch (error) {
    console.error('❌ Error during download/upload process:', error);
    
    // Clean up temp directory on error
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(tempDir, file));
      });
      fs.rmdirSync(tempDir);
    }
    
    process.exit(1);
  }
}

/**
 * List existing character assets in storage
 */
async function listCharacterAssets() {
  console.log('📋 Listing existing character assets in Firebase Storage...\n');
  
  try {
    const [files] = await bucket.getFiles({
      prefix: 'public/gestalts-characters/'
    });
    
    if (files.length === 0) {
      console.log('No character assets found in Firebase Storage.');
      return;
    }
    
    console.log('Existing character assets:');
    files.forEach(file => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
      console.log(`  • ${file.name} → ${publicUrl}`);
    });
    
  } catch (error) {
    console.error('❌ Error listing assets:', error);
  }
}

/**
 * Delete character assets from storage
 */
async function deleteCharacterAssets() {
  console.log('🗑️  Deleting character assets from Firebase Storage...\n');
  
  try {
    const [files] = await bucket.getFiles({
      prefix: 'public/gestalts-characters/'
    });
    
    if (files.length === 0) {
      console.log('No character assets found to delete.');
      return;
    }
    
    console.log('Deleting files:');
    for (const file of files) {
      await file.delete();
      console.log(`  ✅ Deleted ${file.name}`);
    }
    
    console.log('\n🎉 All character assets deleted successfully!');
    
  } catch (error) {
    console.error('❌ Error deleting assets:', error);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'download':
    downloadCharacterAvatars().then(() => process.exit(0));
    break;
  case 'list':
    listCharacterAssets().then(() => process.exit(0));
    break;
  case 'delete':
    deleteCharacterAssets().then(() => process.exit(0));
    break;
  default:
    console.log('Character Avatar Downloader for Firebase Storage');
    console.log('');
    console.log('Usage:');
    console.log('  node downloadCharacterAvatars.js download  - Download and upload character avatars');
    console.log('  node downloadCharacterAvatars.js list     - List existing character assets');
    console.log('  node downloadCharacterAvatars.js delete   - Delete all character assets');
    console.log('');
    console.log('Environment Variables:');
    console.log('  FIREBASE_SERVICE_ACCOUNT_KEY - Path to Firebase service account JSON file');
    console.log('  FIREBASE_STORAGE_BUCKET      - Firebase storage bucket name (optional)');
    console.log('');
    console.log('Example:');
    console.log('  FIREBASE_SERVICE_ACCOUNT_KEY=/path/to/serviceAccount.json node downloadCharacterAvatars.js download');
    process.exit(1);
}
