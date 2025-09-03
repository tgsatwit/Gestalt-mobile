#!/usr/bin/env node

/**
 * Download Character Avatars Locally
 * This script downloads the DiceBear avatars to local files
 * so you can manually upload them to Firebase Storage
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Character definitions with simplified URLs
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
 * Download character avatars locally
 */
async function downloadAvatarsLocal() {
  console.log('🎭 Downloading Gestalts Character Avatars Locally');
  console.log('===============================================\n');
  
  const outputDir = path.join(__dirname, '..', 'assets', 'gestalts-characters');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created directory: ${outputDir}`);
  }
  
  const results = [];
  
  try {
    for (const character of gestaltsCharacters) {
      console.log(`📥 Downloading ${character.name} avatar...`);
      
      // Download to assets folder
      const outputFile = path.join(outputDir, `${character.id}.svg`);
      await downloadFile(character.avatarUrl, outputFile);
      console.log(`✅ Downloaded ${character.name} to: ${outputFile}`);
      
      results.push({
        id: character.id,
        name: character.name,
        originalUrl: character.avatarUrl,
        localPath: outputFile,
        relativePath: `./assets/gestalts-characters/${character.id}.svg`
      });
    }
    
    console.log('\n🎉 All character avatars downloaded successfully!\n');
    
    console.log('📁 Downloaded files:');
    results.forEach(result => {
      const fileSize = fs.statSync(result.localPath).size;
      console.log(`  • ${result.name}: ${result.relativePath} (${Math.round(fileSize / 1024)}KB)`);
    });
    
    console.log('\n📋 Next Steps:');
    console.log('1. Manual Upload to Firebase Storage:');
    console.log('   - Go to Firebase Console → Storage');
    console.log('   - Create folder: public/gestalts-characters/');
    console.log('   - Upload the downloaded SVG files');
    console.log('   - Make them publicly readable');
    console.log('');
    console.log('2. Or use the Firebase Admin script:');
    console.log('   - Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
    console.log('   - Run: npm run download-avatars');
    console.log('');
    console.log('3. Update character URLs in your app:');
    console.log('   - Replace DiceBear URLs with Firebase Storage URLs');
    console.log('   - Format: https://storage.googleapis.com/your-bucket/public/gestalts-characters/CHARACTER_ID.svg');
    
    console.log('\n🔗 Original URLs for reference:');
    results.forEach(result => {
      console.log(`  • ${result.name}: ${result.originalUrl}`);
    });
    
  } catch (error) {
    console.error('❌ Error during download process:', error);
    process.exit(1);
  }
}

/**
 * Generate updated character definitions with local paths
 */
function generateLocalCharacterDefinitions() {
  console.log('📝 Character Definitions with Local Paths:\n');
  
  console.log('// For development - using local assets');
  console.log('const gestaltsCharacters: Character[] = [');
  
  gestaltsCharacters.forEach((char, index) => {
    console.log('  {');
    console.log(`    id: '${char.id}',`);
    console.log(`    name: '${char.name}',`);
    console.log(`    type: 'gestalts',`);
    console.log(`    avatarUrl: require('../../assets/gestalts-characters/${char.id}.svg'),`);
    console.log(`    createdAt: new Date('2024-01-01'),`);
    console.log(`    updatedAt: new Date('2024-01-01'),`);
    console.log('    visualProfile: {');
    console.log(`      appearance: 'Character appearance...',`);
    console.log(`      style: 'Character style...',`);
    console.log(`      personality: 'Character personality...',`);
    console.log(`      keyFeatures: ['Feature 1', 'Feature 2']`);
    console.log('    }');
    console.log(index < gestaltsCharacters.length - 1 ? '  },' : '  }');
  });
  
  console.log('];\n');
  
  console.log('💡 Note: This uses local require() for assets');
  console.log('For production, consider using Firebase Storage URLs instead');
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'local-paths':
    generateLocalCharacterDefinitions();
    break;
  case 'download':
  default:
    downloadAvatarsLocal();
    break;
}

console.log('\n🚀 Available commands:');
console.log('  node downloadAvatarsLocal.js download     - Download avatars to assets folder (default)');
console.log('  node downloadAvatarsLocal.js local-paths  - Generate code with local asset paths');
