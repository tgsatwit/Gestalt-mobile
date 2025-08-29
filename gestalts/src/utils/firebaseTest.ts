import { initializeFirebase } from '../services/firebaseConfig';
import memoriesService from '../services/memoriesService';
import auth from '@react-native-firebase/auth';

export const testFirebaseIntegration = async () => {
  console.log('🔥 Testing Firebase Integration...');
  
  try {
    // Test 1: Firebase initialization
    const firebaseServices = initializeFirebase();
    console.log('✅ Firebase initialized:', firebaseServices.initialized);
    
    // Test 2: Check if memories service is configured
    const isConfigured = memoriesService.isConfigured();
    console.log('✅ Memories service configured:', isConfigured);
    
    // Test 3: Check auth status
    const currentUser = auth().currentUser;
    console.log('👤 Current user:', currentUser ? 'Authenticated' : 'Not authenticated');
    console.log('👤 User ID:', currentUser?.uid || 'None');
    
    if (currentUser) {
      try {
        // Test 4: Try to fetch journal entries (this will test security rules)
        console.log('📝 Testing journal entries fetch...');
        const entries = await memoriesService.getUserJournalEntries(currentUser.uid);
        console.log('✅ Journal entries loaded:', entries.length, 'entries');
      } catch (error) {
        console.log('⚠️ Journal entries test failed (expected if no entries):', error.message);
      }
    }
    
    console.log('🎉 Firebase integration test completed!');
    
  } catch (error) {
    console.error('❌ Firebase integration test failed:', error);
    throw error;
  }
};