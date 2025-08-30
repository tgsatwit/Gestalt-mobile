// NOTE: This service is temporarily disabled - should use Firebase Web SDK instead
// import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { getFirebaseServices } from './firebaseConfig';
import { UserProfile, CreateUserProfileData, UpdateUserProfileData } from '../types/userProfile';

class UserProfileService {
  /**
   * Check if Firebase is properly configured and initialized
   */
  isConfigured(): boolean {
    const { initialized } = getFirebaseServices();
    return initialized;
  }

  /**
   * Create a new user profile
   */
  async createProfile(userId: string, profileData: CreateUserProfileData): Promise<string> {
    console.warn('userProfileService: Using stub implementation - please use memoriesService instead');
    // Return a mock ID for now
    return `mock-user-profile-${Date.now()}`;
  }

  /**
   * Get a specific user profile
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    console.warn('userProfileService: Using stub implementation - please use memoriesService instead');
    return null;
  }

  /**
   * Update a user profile
   */
  async updateProfile(userId: string, updates: UpdateUserProfileData): Promise<void> {
    console.warn('userProfileService: Using stub implementation - please use memoriesService instead');
  }

  /**
   * Delete a user profile
   */
  async deleteProfile(userId: string): Promise<void> {
    console.warn('userProfileService: Using stub implementation - please use memoriesService instead');
  }
}

// Export singleton instance
export default new UserProfileService();