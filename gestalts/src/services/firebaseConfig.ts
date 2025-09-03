import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Firebase config from Expo extra with fallback to defaults
const extra: any = Constants.expoConfig?.extra || {};
const extraFirebase: any = extra.firebase || {};

const firebaseConfig = {
  apiKey: extraFirebase.apiKey || "AIzaSyACgFoLyTsEcxlE8odn36LjdhtdEW1ht34",
  authDomain: extraFirebase.authDomain || "gestalts-mobile.firebaseapp.com",
  projectId: extraFirebase.projectId || "gestalts-mobile",
  storageBucket: extraFirebase.storageBucket || "gestalts-mobile.firebasestorage.app",
  messagingSenderId: extraFirebase.messagingSenderId || "630723947096",
  appId: extraFirebase.appId || "1:630723947096:web:6c564c1d9213c07375b82d"
};

// Initialize Firebase
let firebaseApp: any = null;
let db: any = null;
let auth: any = null;
let initialized = false;

export const initializeFirebase = () => {
  if (initialized) return { app: firebaseApp, db, auth, initialized };

  try {
    // Initialize Firebase App
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApp();
    }

    // Initialize Auth with AsyncStorage persistence
    try {
      auth = initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    } catch (error) {
      // If auth is already initialized, get the existing instance
      auth = getAuth(firebaseApp);
    }
    
    // Initialize Firestore
    db = getFirestore(firebaseApp);
    
    initialized = true;
    
    console.log('Firebase initialized successfully with Web SDK');
    return { app: firebaseApp, db, auth, initialized };
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return { app: null, db: null, auth: null, initialized: false };
  }
};

export const getFirebaseServices = () => {
  if (!initialized) {
    return initializeFirebase();
  }
  return { app: firebaseApp, db, auth, initialized };
};