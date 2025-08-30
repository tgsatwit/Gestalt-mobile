// NOTE: This service is temporarily disabled - should use Firebase Web SDK instead
// import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { getFirebaseServices } from './firebaseConfig';
import { ChildProfile, CreateChildProfileData, UpdateChildProfileData } from '../types/profile';

class ChildProfileService {
  /**
   * Check if Firebase is properly configured and initialized
   */
  isConfigured(): boolean {
    const { initialized } = getFirebaseServices();
    return initialized;
  }

  /**
   * Create a new child profile
   */
  async createProfile(userId: string, profileData: CreateChildProfileData): Promise<string> {
    console.warn('childProfileService: Using stub implementation - please use memoriesService instead');
    // Return a mock ID for now
    return `mock-profile-${Date.now()}`;
  }

  /**
   * Get a specific child profile by ID
   */
  async getProfile(profileId: string): Promise<ChildProfile | null> {
    console.warn('childProfileService: Using stub implementation - please use memoriesService instead');
    return null;
  }

  /**
   * Get all child profiles for a specific user
   */
  async getUserProfiles(userId: string): Promise<ChildProfile[]> {
    console.warn('childProfileService: Using stub implementation - please use memoriesService instead');
    return [];
  }

  /**
   * Update a child profile
   */
  async updateProfile(profileId: string, userId: string, updates: UpdateChildProfileData): Promise<void> {
    console.warn('childProfileService: Using stub implementation - please use memoriesService instead');
  }

  /**
   * Delete a child profile
   */
  async deleteProfile(profileId: string, userId: string): Promise<void> {
    console.warn('childProfileService: Using stub implementation - please use memoriesService instead');
  }
}

// Export singleton instance
export default new ChildProfileService();