import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyACgFoLyTsEcxlE8odn36LjdhtdEW1ht34",
  authDomain: "gestalts-mobile.firebaseapp.com",
  projectId: "gestalts-mobile",
  storageBucket: "gestalts-mobile.firebasestorage.app",
  messagingSenderId: "630723947096",
  appId: "1:630723947096:web:6c564c1d9213c07375b82d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;