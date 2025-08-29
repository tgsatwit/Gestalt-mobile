import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
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
    try {
      const profileRef = firestore().collection('childProfiles').doc();
      const profileId = profileRef.id;
      const now = new Date();
      
      // Filter out undefined values from profile data
      const cleanProfileData = Object.fromEntries(
        Object.entries(profileData).filter(([_, value]) => value !== undefined)
      );

      const profile: ChildProfile = {
        id: profileId,
        ...cleanProfileData,
        userId,
        createdAt: now,
        updatedAt: now
      };

      await profileRef.set({
        ...profile,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp()
      });

      return profileId;
    } catch (error) {
      console.error('Failed to create child profile:', error);
      throw error;
    }
  }

  /**
   * Get a specific child profile by ID
   */
  async getProfile(profileId: string): Promise<ChildProfile | null> {
    try {
      const profileRef = firestore().collection('childProfiles').doc(profileId);
      const profileDoc = await profileRef.get();

      if (!profileDoc.exists) {
        return null;
      }

      const data = profileDoc.data();
      return {
        ...data,
        id: profileDoc.id,
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate()
      } as ChildProfile;
    } catch (error) {
      console.error('Failed to get child profile:', error);
      throw error;
    }
  }

  /**
   * Get all child profiles for a specific user
   */
  async getUserProfiles(userId: string): Promise<ChildProfile[]> {
    try {
      const query = firestore().collection('childProfiles')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc');
      const snapshot = await query.get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as ChildProfile;
      });
    } catch (error) {
      console.error('Failed to get user profiles:', error);
      throw error;
    }
  }

  /**
   * Update a child profile
   */
  async updateProfile(profileId: string, userId: string, updates: UpdateChildProfileData): Promise<void> {
    try {
      const profileRef = firestore().collection('childProfiles').doc(profileId);
      
      // First check if profile exists and belongs to user
      const existingProfile = await this.getProfile(profileId);
      if (!existingProfile) {
        throw new Error('Profile not found');
      }
      
      if (existingProfile.userId !== userId) {
        throw new Error('Unauthorized: Profile does not belong to this user');
      }

      // Filter out undefined values from updates
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      await profileRef.update({
        ...cleanUpdates,
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to update child profile:', error);
      throw error;
    }
  }

  /**
   * Delete a child profile
   */
  async deleteProfile(profileId: string, userId: string): Promise<void> {
    try {
      // First check if profile exists and belongs to user
      const existingProfile = await this.getProfile(profileId);
      if (!existingProfile) {
        throw new Error('Profile not found');
      }
      
      if (existingProfile.userId !== userId) {
        throw new Error('Unauthorized: Profile does not belong to this user');
      }

      const profileRef = firestore().collection('childProfiles').doc(profileId);
      await profileRef.delete();
    } catch (error) {
      console.error('Failed to delete child profile:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new ChildProfileService();