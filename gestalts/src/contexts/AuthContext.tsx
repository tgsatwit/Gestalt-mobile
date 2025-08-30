import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import authService, { UserProfile, SignUpData, SignInData } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (signUpData: SignUpData) => Promise<void>;
  signIn: (signInData: SignInData) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  isAppleSignInAvailable: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);

  useEffect(() => {
    // Check Apple Sign In availability
    checkAppleSignInAvailability();

    // Listen to Firebase auth state changes
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Get user profile from Firestore
          const userProfile = await getUserProfileFromFirestore(firebaseUser.uid);
          setUser(userProfile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const checkAppleSignInAvailability = async () => {
    try {
      const available = await authService.isAppleSignInAvailable();
      setIsAppleSignInAvailable(available);
    } catch (error) {
      console.error('Error checking Apple Sign In availability:', error);
      setIsAppleSignInAvailable(false);
    }
  };

  const getUserProfileFromFirestore = async (userId: string): Promise<UserProfile | null> => {
    try {
      // TODO: Replace with Firebase Web SDK
      // const firestore = require('@react-native-firebase/firestore').default;
      // const docSnap = await firestore().collection('users').doc(userId).get();
      
      // For now, return a mock user profile
      const docSnap = { exists: false, data: () => null };
      
      if (docSnap.exists) {
        const data = docSnap.data();
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
      console.error('Error getting user profile from Firestore:', error);
      return null;
    }
  };

  const signUp = async (signUpData: SignUpData) => {
    try {
      setLoading(true);
      const userProfile = await authService.signUpWithEmail(signUpData);
      setUser(userProfile);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (signInData: SignInData) => {
    try {
      setLoading(true);
      const userProfile = await authService.signInWithEmail(signInData);
      setUser(userProfile);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async () => {
    try {
      setLoading(true);
      const userProfile = await authService.signInWithApple();
      setUser(userProfile);
    } catch (error) {
      console.error('Apple sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOutUser();
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !loading && !!user && !!firebaseUser;

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      loading,
      isAuthenticated,
      signUp,
      signIn,
      signInWithApple,
      signOut,
      isAppleSignInAvailable
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}