import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyACgFoLyTsEcxlE8odn36LjdhtdEW1ht34",
  authDomain: "gestalts-mobile.firebaseapp.com",
  projectId: "gestalts-mobile",
  storageBucket: "gestalts-mobile.firebasestorage.app",
  messagingSenderId: "630723947096",
  appId: "1:630723947096:web:6c564c1d9213c07375b82d"
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

    // Initialize Auth with persistence
    auth = getAuth(firebaseApp);
    
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
  return { app, db, auth, initialized };
};