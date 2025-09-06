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
    // Create a new profile and store it in the legacy memoriesService for now
    const { useMemoriesStore } = await import('../state/useStore');
    const profileId = `profile-${Date.now()}`;
    
    const legacyProfile = {
      id: profileId,
      childName: profileData.childName,
      parentName: profileData.parentName,
      birthDateISO: profileData.birthDate,
      stage: profileData.currentStage?.toString()
    };
    
    useMemoriesStore.getState().setProfile(legacyProfile);
    return profileId;
  }

  /**
   * Get a specific child profile by ID
   */
  async getProfile(profileId: string): Promise<ChildProfile | null> {
    const profiles = await this.getUserProfiles('');
    return profiles.find(p => p.id === profileId) || null;
  }

  /**
   * Get all child profiles for a specific user
   */
  async getUserProfiles(userId: string): Promise<ChildProfile[]> {
    // For now, return the legacy profile from memoriesService as a ChildProfile if it exists
    const { useMemoriesStore } = await import('../state/useStore');
    const legacyProfile = useMemoriesStore.getState().profile;
    
    if (legacyProfile) {
      const childProfile: ChildProfile = {
        id: legacyProfile.id,
        childName: legacyProfile.childName,
        parentName: legacyProfile.parentName,
        birthDate: legacyProfile.birthDateISO,
        currentStage: legacyProfile.stage ? parseInt(legacyProfile.stage) : undefined,
        interests: [],
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return [childProfile];
    }
    
    return [];
  }

  /**
   * Update a child profile
   */
  async updateProfile(profileId: string, userId: string, updates: UpdateChildProfileData): Promise<void> {
    const { useMemoriesStore } = await import('../state/useStore');
    const currentProfile = useMemoriesStore.getState().profile;
    
    if (currentProfile && currentProfile.id === profileId) {
      const updatedProfile = {
        ...currentProfile,
        childName: updates.childName ?? currentProfile.childName,
        parentName: updates.parentName ?? currentProfile.parentName,
        birthDateISO: updates.birthDate ?? currentProfile.birthDateISO,
        stage: updates.currentStage?.toString() ?? currentProfile.stage
      };
      
      useMemoriesStore.getState().setProfile(updatedProfile);
    }
  }

  /**
   * Delete a child profile
   */
  async deleteProfile(profileId: string, userId: string): Promise<void> {
    const { useMemoriesStore } = await import('../state/useStore');
    const currentProfile = useMemoriesStore.getState().profile;
    
    if (currentProfile && currentProfile.id === profileId) {
      useMemoriesStore.getState().setProfile(null);
    }
  }
}

// Export singleton instance
export default new ChildProfileService();