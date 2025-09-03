#!/usr/bin/env node

/**
 * Script to generate Gestalts Characters (Alex and Emma)
 * This script creates the generic boy and girl characters for the Gestalts app
 */

const admin = require('firebase-admin');
const path = require('path');

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
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://your-project.firebaseio.com'
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();

// Define the Gestalts characters
const gestaltsCharacters = [
  {
    id: 'gestalts-boy',
    name: 'Alex',
    type: 'gestalts',
    avatarUrl: 'https://firebasestorage.googleapis.com/v0/b/gestalts-mobile.firebasestorage.app/o/avatars%2FAlex-Avatar.jpeg?alt=media&token=5ec35a3b-1ee4-45a1-a193-53f2c60300a0',
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-01')),
    updatedAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-01')),
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
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-01')),
    updatedAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-01')),
    visualProfile: {
      appearance: 'Emma is a spirited young girl with beautiful curly blonde hair that bounces when she moves. She has bright green eyes full of wonder and a warm, infectious smile. Her posture shows confidence and readiness for any adventure.',
      style: 'Emma loves wearing bright, cheerful colors - often a sky blue top with fun patterns. Her style is vibrant and expressive, reflecting her joyful personality and love for creativity.',
      personality: 'Emma is creative, empathetic, and full of joy. She loves making new friends, solving problems with creative solutions, and spreading happiness wherever she goes. She\'s always ready to lend a helping hand.',
      keyFeatures: ['Curly blonde hair', 'Bright green eyes', 'Infectious smile', 'Confident posture', 'Sky blue clothing with patterns']
    }
  }
];

async function createGestaltsCharacters() {
  console.log('🚀 Starting Gestalts Characters generation...\n');
  
  try {
    // Create a global collection for Gestalts characters
    const gestaltsCollection = db.collection('gestalts-characters');
    
    for (const character of gestaltsCharacters) {
      console.log(`📝 Creating character: ${character.name} (${character.id})`);
      
      // Check if character already exists
      const existingDoc = await gestaltsCollection.doc(character.id).get();
      
      if (existingDoc.exists) {
        console.log(`⚠️  Character ${character.name} already exists, updating...`);
        await gestaltsCollection.doc(character.id).update(character);
        console.log(`✅ Updated ${character.name}`);
      } else {
        await gestaltsCollection.doc(character.id).set(character);
        console.log(`✅ Created ${character.name}`);
      }
    }
    
    console.log('\n🎉 All Gestalts Characters created successfully!');
    console.log('\nCharacters created:');
    gestaltsCharacters.forEach(char => {
      console.log(`  • ${char.name} (${char.type}): ${char.id}`);
    });
    
    console.log('\n📋 Next steps:');
    console.log('1. The characters are now available in the global Firestore collection');
    console.log('2. Update your app to read from the "gestalts-characters" collection');
    console.log('3. Test the character selection in the Storybook feature');
    
  } catch (error) {
    console.error('❌ Error creating Gestalts Characters:', error);
    process.exit(1);
  }
}

async function listExistingCharacters() {
  console.log('📋 Listing existing Gestalts Characters...\n');
  
  try {
    const snapshot = await db.collection('gestalts-characters').get();
    
    if (snapshot.empty) {
      console.log('No Gestalts Characters found in the database.');
      return;
    }
    
    console.log('Existing Gestalts Characters:');
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  • ${data.name} (${data.type}): ${doc.id}`);
      console.log(`    Avatar: ${data.avatarUrl.substring(0, 50)}...`);
    });
    
  } catch (error) {
    console.error('❌ Error listing characters:', error);
  }
}

async function deleteGestaltsCharacters() {
  console.log('🗑️  Deleting all Gestalts Characters...\n');
  
  try {
    const snapshot = await db.collection('gestalts-characters').get();
    
    if (snapshot.empty) {
      console.log('No Gestalts Characters found to delete.');
      return;
    }
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log('✅ All Gestalts Characters deleted successfully!');
    
  } catch (error) {
    console.error('❌ Error deleting characters:', error);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'create':
    createGestaltsCharacters().then(() => process.exit(0));
    break;
  case 'list':
    listExistingCharacters().then(() => process.exit(0));
    break;
  case 'delete':
    deleteGestaltsCharacters().then(() => process.exit(0));
    break;
  default:
    console.log('Gestalts Characters Generator');
    console.log('');
    console.log('Usage:');
    console.log('  node generateGestaltsCharacters.js create  - Create Alex and Emma characters');
    console.log('  node generateGestaltsCharacters.js list    - List existing Gestalts characters');
    console.log('  node generateGestaltsCharacters.js delete  - Delete all Gestalts characters');
    console.log('');
    console.log('Environment Variables:');
    console.log('  FIREBASE_SERVICE_ACCOUNT_KEY - Path to Firebase service account JSON file');
    console.log('  FIREBASE_DATABASE_URL        - Firebase database URL (optional)');
    console.log('');
    console.log('Example:');
    console.log('  FIREBASE_SERVICE_ACCOUNT_KEY=/path/to/serviceAccount.json node generateGestaltsCharacters.js create');
    process.exit(1);
}
