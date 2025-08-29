import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { getFirebaseServices } from './firebaseConfig';
import { ChildProfile, CreateChildProfileData, UpdateChildProfileData } from '../types/profile';

class ChildProfileService {
  private db: any = null;
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const services = getFirebaseServices();
    this.db = services.db;
    this.initialized = services.initialized;
  }

  private checkInitialized() {
    if (!this.initialized || !this.db) {
      this.initialize();
      if (!this.initialized || !this.db) {
        throw new Error('Firebase service not initialized. Please configure Firebase.');
      }
    }
  }

  /**
   * Create a new child profile
   */
  async createProfile(userId: string, profileData: CreateChildProfileData): Promise<string> {
    this.checkInitialized();

    try {
      const profileId = doc(collection(this.db!, 'childProfiles')).id;
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

      const profileRef = doc(this.db!, 'childProfiles', profileId);
      await setDoc(profileRef, {
        ...profile,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
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
    this.checkInitialized();

    try {
      const profileRef = doc(this.db!, 'childProfiles', profileId);
      const profileDoc = await getDoc(profileRef);

      if (!profileDoc.exists()) {
        return null;
      }

      const data = profileDoc.data();
      return {
        ...data,
        id: profileDoc.id,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
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
    this.checkInitialized();

    try {
      const profilesRef = collection(this.db!, 'childProfiles');
      const q = query(
        profilesRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as ChildProfile));
    } catch (error) {
      console.error('Failed to get user profiles:', error);
      throw error;
    }
  }

  /**
   * Update a child profile
   */
  async updateProfile(profileId: string, userId: string, updates: UpdateChildProfileData): Promise<void> {
    this.checkInitialized();

    try {
      const profileRef = doc(this.db!, 'childProfiles', profileId);
      
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

      await updateDoc(profileRef, {
        ...cleanUpdates,
        updatedAt: Timestamp.fromDate(new Date())
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
    this.checkInitialized();

    try {
      // First check if profile exists and belongs to user
      const existingProfile = await this.getProfile(profileId);
      if (!existingProfile) {
        throw new Error('Profile not found');
      }
      
      if (existingProfile.userId !== userId) {
        throw new Error('Unauthorized: Profile does not belong to this user');
      }

      const profileRef = doc(this.db!, 'childProfiles', profileId);
      await deleteDoc(profileRef);
    } catch (error) {
      console.error('Failed to delete child profile:', error);
      throw error;
    }
  }

  /**
   * Check if Firebase is properly configured and initialized
   */
  isConfigured(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export default new ChildProfileService();