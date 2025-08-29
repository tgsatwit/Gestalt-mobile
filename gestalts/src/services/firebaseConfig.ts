import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
let auth: any = null;
let initialized = false;

export const initializeFirebase = () => {
  if (initialized) return { app, db, storage, auth, initialized };

  try {
    const config = getFirebaseConfig();
    if (!config) {
      return { app: null, db: null, storage: null, auth: null, initialized: false };
    }

    app = initializeApp(config);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // Initialize Auth with AsyncStorage persistence
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    } catch (e: any) {
      // If already initialized, get existing auth
      if (e.code === 'auth/already-initialized') {
        auth = getAuth(app);
      } else {
        throw e;
      }
    }
    
    initialized = true;
    
    console.log('Firebase initialized successfully');
    return { app, db, storage, auth, initialized };
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return { app: null, db: null, storage: null, auth: null, initialized: false };
  }
};

export const getFirebaseServices = () => {
  if (!initialized) {
    return initializeFirebase();
  }
  return { app, db, storage, auth, initialized };
};