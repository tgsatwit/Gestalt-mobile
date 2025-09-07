import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
  onAuthStateChanged,
  signInWithCredential,
  OAuthProvider
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { getFirebaseServices } from './firebaseConfig';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  name: string;
  signUpDate: Date;
  provider: 'email' | 'apple';
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

class AuthService {
  
  constructor() {
    // Firebase services will be accessed via getFirebaseServices()
  }

  // Sign up with email and password
  async signUpWithEmail(signUpData: SignUpData): Promise<UserProfile> {
    try {
      const { auth, db } = getFirebaseServices();
      if (!auth || !db) throw new Error('Firebase not initialized');
      
      const { email, password, firstName, lastName, displayName } = signUpData;
      
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: displayName
      });

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        id: user.uid,
        email,
        firstName,
        lastName,
        displayName,
        signUpDate: new Date(),
        provider: 'email'
      };

      await this.createUserProfile(userProfile);
      return userProfile;
    } catch (error) {
      console.error('Sign up error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Sign in with email and password
  async signInWithEmail(signInData: SignInData): Promise<UserProfile> {
    try {
      const { auth } = getFirebaseServices();
      if (!auth) throw new Error('Firebase not initialized');
      
      const { email, password } = signInData;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user profile from Firestore, create if missing
      let userProfile = await this.getUserProfile(user.uid);
      if (!userProfile) {
        const displayName = user.displayName || (user.email?.split('@')[0] || 'User');
        const [firstName, ...rest] = displayName.split(' ');
        const lastName = rest.join(' ');
        userProfile = {
          id: user.uid,
          email: user.email || '',
          firstName: firstName || '',
          lastName: lastName || '',
          displayName,
          signUpDate: new Date(),
          provider: 'email'
        };
        await this.createUserProfile(userProfile);
      }
      return userProfile;
    } catch (error) {
      console.error('Sign in error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Sign in with Apple
  async signInWithApple(): Promise<UserProfile> {
    try {
      // Generate nonce for security
      const rawNonce = Math.random().toString(36).substring(2, 15);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      // Request Apple authentication
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      // Create Firebase credential and sign in using Web SDK
      const { auth } = getFirebaseServices();
      if (!auth) throw new Error('Firebase not initialized');

      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: appleCredential.identityToken!,
        rawNonce
      });

      // Sign in to Firebase
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      // Check if user profile exists
      let userProfile = await this.getUserProfile(user.uid);
      
      if (!userProfile) {
        // Create new profile for Apple sign-in user
        const firstName = appleCredential.fullName?.givenName || '';
        const lastName = appleCredential.fullName?.familyName || '';
        const displayName = user.displayName || `${firstName} ${lastName}`.trim() || user.email?.split('@')[0] || 'User';
        
        userProfile = {
          id: user.uid,
          email: user.email || appleCredential.email || '',
          firstName,
          lastName,
          displayName,
          signUpDate: new Date(),
          provider: 'apple'
        };

        await this.createUserProfile(userProfile);
      }

      return userProfile;
    } catch (error) {
      console.error('Apple sign in error:', error);
      const err: any = error as any;
      if (err?.code === 'ERR_REQUEST_CANCELED') {
        throw new Error('Apple sign-in was cancelled');
      }
      throw this.handleAuthError(err);
    }
  }

  // Create user profile in Firestore
  private async createUserProfile(userProfile: UserProfile): Promise<void> {
    try {
      const { db } = getFirebaseServices();
      if (!db) throw new Error('Firestore not initialized');
      
      await setDoc(doc(db, 'users', userProfile.id), {
        ...userProfile,
        signUpDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  // Get user profile from Firestore
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { db } = getFirebaseServices();
      if (!db) throw new Error('Firestore not initialized');
      
      const docSnap = await getDoc(doc(db, 'users', userId));
      
      if (docSnap.exists()) {
        const data = docSnap.data()!;
        return {
          id: data.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          displayName: data.displayName,
          signUpDate: data.signUpDate?.toDate() || new Date(),
          provider: data.provider
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Sign out
  async signOutUser(): Promise<void> {
    try {
      const { auth } = getFirebaseServices();
      if (!auth) throw new Error('Firebase not initialized');
      
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    const { auth } = getFirebaseServices();
    return auth?.currentUser || null;
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void) {
    const { auth } = getFirebaseServices();
    if (!auth) return () => {};
    
    return onAuthStateChanged(auth, callback);
  }

  // Check if Apple Sign In is available
  async isAppleSignInAvailable(): Promise<boolean> {
    try {
      return await AppleAuthentication.isAvailableAsync();
    } catch (error) {
      console.error('Error checking Apple Sign In availability:', error);
      return false;
    }
  }

  // Handle Firebase Auth errors
  private handleAuthError(error: any): Error {
    let message = 'An authentication error occurred';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'This email is already registered. Please sign in instead.';
        break;
      case 'auth/invalid-email':
        message = 'Please enter a valid email address.';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters long.';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email address.';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password. Please try again.';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection.';
        break;
      default:
        message = error.message || message;
    }
    
    return new Error(message);
  }
}

// Export singleton instance
export default new AuthService();
