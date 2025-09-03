#!/usr/bin/env node

/**
 * Local Character Generator for Gestalts Characters
 * This script generates the character data that can be copy-pasted into the app
 */

// Define the Gestalts characters
const gestaltsCharacters = [
  {
    id: 'gestalts-boy',
    name: 'Alex',
    type: 'gestalts',
    avatarUrl: 'https://firebasestorage.googleapis.com/v0/b/gestalts-mobile.firebasestorage.app/o/avatars%2FAlex-Avatar.jpeg?alt=media&token=5ec35a3b-1ee4-45a1-a193-53f2c60300a0',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    visualProfile: {
      appearance: 'Alex is a friendly young boy with warm brown hair and bright, curious eyes. He has a cheerful face with a gentle smile that makes everyone feel welcome. His build is average for his age, with an energetic posture that shows he loves adventure.',
      style: 'Alex wears casual, comfortable clothes in earth tones - usually a navy blue t-shirt and dark pants. His style is practical and kid-friendly, perfect for outdoor adventures and learning new things.',
      personality: 'Alex is curious, brave, and kind-hearted. He approaches new situations with enthusiasm and always tries to help his friends. He loves exploring, asking questions, and sharing what he learns with others.',
      keyFeatures: ['Warm brown hair', 'Bright curious eyes', 'Friendly smile', 'Energetic posture', 'Navy blue clothing']
    }
  },
  {
    id: 'gestalts-girl',
    name: 'Emma',
    type: 'gestalts',
    avatarUrl: 'https://firebasestorage.googleapis.com/v0/b/gestalts-mobile.firebasestorage.app/o/avatars%2FEmma-Avatar.jpeg?alt=media&token=1721fb1c-5fa6-4cf0-9f09-08c8bb890d35',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    visualProfile: {
      appearance: 'Emma is a spirited young girl with beautiful curly blonde hair that bounces when she moves. She has bright green eyes full of wonder and a warm, infectious smile. Her posture shows confidence and readiness for any adventure.',
      style: 'Emma loves wearing bright, cheerful colors - often a sky blue top with fun patterns. Her style is vibrant and expressive, reflecting her joyful personality and love for creativity.',
      personality: 'Emma is creative, empathetic, and full of joy. She loves making new friends, solving problems with creative solutions, and spreading happiness wherever she goes. She\'s always ready to lend a helping hand.',
      keyFeatures: ['Curly blonde hair', 'Bright green eyes', 'Infectious smile', 'Confident posture', 'Sky blue clothing with patterns']
    }
  }
];

function generateCharacters() {
  console.log('🎭 Gestalts Characters Generator');
  console.log('===============================\n');
  
  console.log('📝 Generated Character Data:');
  console.log('Copy and paste this into your useStorybookStore-firebase.ts file:\n');
  
  console.log('const gestaltsCharacters: Character[] = [');
  
  gestaltsCharacters.forEach((char, index) => {
    console.log('  {');
    console.log(`    id: '${char.id}',`);
    console.log(`    name: '${char.name}',`);
    console.log(`    type: '${char.type}',`);
    console.log(`    avatarUrl: '${char.avatarUrl}',`);
    console.log(`    createdAt: new Date('${char.createdAt.toISOString()}'),`);
    console.log(`    updatedAt: new Date('${char.updatedAt.toISOString()}'),`);
    console.log('    visualProfile: {');
    console.log(`      appearance: '${char.visualProfile.appearance}',`);
    console.log(`      style: '${char.visualProfile.style}',`);
    console.log(`      personality: '${char.visualProfile.personality}',`);
    console.log(`      keyFeatures: ${JSON.stringify(char.visualProfile.keyFeatures)}`);
    console.log('    }');
    console.log(index < gestaltsCharacters.length - 1 ? '  },' : '  }');
  });
  
  console.log('];\n');
  
  console.log('✅ Character Details:');
  gestaltsCharacters.forEach(char => {
    console.log(`\n🎭 ${char.name} (${char.type})`);
    console.log(`   ID: ${char.id}`);
    console.log(`   Personality: ${char.visualProfile.personality.substring(0, 100)}...`);
    console.log(`   Key Features: ${char.visualProfile.keyFeatures.join(', ')}`);
  });
  
  console.log('\n📋 Usage Instructions:');
  console.log('1. Copy the generated character array above');
  console.log('2. Replace the gestaltsCharacters array in your loadGestaltsCharacters method');
  console.log('3. The characters will be available in your app immediately');
  console.log('\n🔗 Avatar URLs are generated using DiceBear API for consistent, high-quality avatars');
}

function generateJSON() {
  console.log('📄 JSON Format for External Use:');
  console.log(JSON.stringify(gestaltsCharacters, null, 2));
}

function generateAvatarPreview() {
  console.log('🖼️  Avatar Preview URLs:');
  gestaltsCharacters.forEach(char => {
    console.log(`\n${char.name}: ${char.avatarUrl}`);
  });
  console.log('\n💡 Open these URLs in your browser to preview the avatars!');
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'json':
    generateJSON();
    break;
  case 'preview':
    generateAvatarPreview();
    break;
  case 'generate':
  default:
    generateCharacters();
    break;
}

console.log('\n🚀 Available commands:');
console.log('  node generateLocalCharacters.js generate  - Generate character code (default)');
console.log('  node generateLocalCharacters.js json      - Output as JSON');
console.log('  node generateLocalCharacters.js preview   - Show avatar URLs for preview');
