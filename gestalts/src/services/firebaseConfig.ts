import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import Constants from 'expo-constants';

// Get Firebase config from Expo config
const getFirebaseConfig = () => {
  const config = Constants.expoConfig?.extra?.firebase;
  if (!config || !config.apiKey) {
    console.warn('Firebase not configured. Please add Firebase configuration to your .env file');
    return null;
  }
  return config;
};

// Initialize Firebase
let app: any = null;
let db: any = null;
let storage: any = null;
let initialized = false;

export const initializeFirebase = () => {
  if (initialized) return { app, db, storage, initialized };

  try {
    const config = getFirebaseConfig();
    if (!config) {
      return { app: null, db: null, storage: null, initialized: false };
    }

    app = initializeApp(config);
    db = getFirestore(app);
    storage = getStorage(app);
    initialized = true;
    
    console.log('Firebase initialized successfully');
    return { app, db, storage, initialized };
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return { app: null, db: null, storage: null, initialized: false };
  }
};

export const getFirebaseServices = () => {
  if (!initialized) {
    return initializeFirebase();
  }
  return { app, db, storage, initialized };
};