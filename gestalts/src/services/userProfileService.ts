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
  Timestamp
} from 'firebase/firestore';
import { getFirebaseServices } from './firebaseConfig';
import { UserProfile, CreateUserProfileData, UpdateUserProfileData } from '../types/userProfile';

class UserProfileService {
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
   * Create a new user profile
   */
  async createProfile(userId: string, profileData: CreateUserProfileData): Promise<string> {
    this.checkInitialized();

    try {
      const now = new Date();
      
      // Filter out undefined values from profile data
      const cleanProfileData = Object.fromEntries(
        Object.entries(profileData).filter(([_, value]) => value !== undefined)
      );

      // Set defaults for required fields
      const profile: UserProfile = {
        id: userId, // Use userId as profile ID for 1:1 mapping
        userId,
        name: cleanProfileData.name || 'User',
        subscriptionStatus: cleanProfileData.subscriptionStatus || 'free',
        emailNotifications: cleanProfileData.emailNotifications ?? true,
        pushNotifications: cleanProfileData.pushNotifications ?? true,
        reminderNotifications: cleanProfileData.reminderNotifications ?? true,
        weeklyReports: cleanProfileData.weeklyReports ?? true,
        language: cleanProfileData.language || 'en',
        timezone: cleanProfileData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        coachingPreferences: {
          preferredInteractionStyle: 'supportive',
          reminderFrequency: 'weekly',
          reportFormat: 'detailed',
          ...cleanProfileData.coachingPreferences
        },
        profileVisibility: cleanProfileData.profileVisibility || 'private',
        accountCreatedDate: now,
        createdAt: now,
        updatedAt: now,
        ...cleanProfileData
      };

      const profileRef = doc(this.db!, 'userProfiles', userId);
      await setDoc(profileRef, {
        ...profile,
        accountCreatedDate: Timestamp.fromDate(now),
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        subscriptionExpiryDate: profile.subscriptionExpiryDate ? Timestamp.fromDate(profile.subscriptionExpiryDate) : null,
        lastLoginDate: profile.lastLoginDate ? Timestamp.fromDate(profile.lastLoginDate) : null,
        dataExportRequested: profile.dataExportRequested ? Timestamp.fromDate(profile.dataExportRequested) : null,
        accountDeletionRequested: profile.accountDeletionRequested ? Timestamp.fromDate(profile.accountDeletionRequested) : null
      });

      return userId;
    } catch (error) {
      console.error('Failed to create user profile:', error);
      throw error;
    }
  }

  /**
   * Get a user profile by user ID
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    this.checkInitialized();

    try {
      const profileRef = doc(this.db!, 'userProfiles', userId);
      const profileDoc = await getDoc(profileRef);

      if (!profileDoc.exists()) {
        return null;
      }

      const data = profileDoc.data();
      return {
        ...data,
        id: profileDoc.id,
        accountCreatedDate: data.accountCreatedDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        subscriptionExpiryDate: data.subscriptionExpiryDate?.toDate(),
        lastLoginDate: data.lastLoginDate?.toDate(),
        dataExportRequested: data.dataExportRequested?.toDate(),
        accountDeletionRequested: data.accountDeletionRequested?.toDate()
      } as UserProfile;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  /**
   * Update a user profile
   */
  async updateProfile(userId: string, updates: UpdateUserProfileData): Promise<void> {
    this.checkInitialized();

    try {
      const profileRef = doc(this.db!, 'userProfiles', userId);
      
      // Filter out undefined values from updates
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      const updateData: any = {
        ...cleanUpdates,
        updatedAt: Timestamp.fromDate(new Date())
      };

      // Convert Date objects to Timestamps
      if (cleanUpdates.subscriptionExpiryDate) {
        updateData.subscriptionExpiryDate = Timestamp.fromDate(cleanUpdates.subscriptionExpiryDate);
      }
      if (cleanUpdates.lastLoginDate) {
        updateData.lastLoginDate = Timestamp.fromDate(cleanUpdates.lastLoginDate);
      }
      if (cleanUpdates.dataExportRequested) {
        updateData.dataExportRequested = Timestamp.fromDate(cleanUpdates.dataExportRequested);
      }
      if (cleanUpdates.accountDeletionRequested) {
        updateData.accountDeletionRequested = Timestamp.fromDate(cleanUpdates.accountDeletionRequested);
      }

      await updateDoc(profileRef, updateData);
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }

  /**
   * Delete a user profile (soft delete by marking for deletion)
   */
  async markForDeletion(userId: string): Promise<void> {
    this.checkInitialized();

    try {
      await this.updateProfile(userId, {
        accountDeletionRequested: new Date()
      });
    } catch (error) {
      console.error('Failed to mark profile for deletion:', error);
      throw error;
    }
  }

  /**
   * Permanently delete a user profile (hard delete)
   */
  async deleteProfile(userId: string): Promise<void> {
    this.checkInitialized();

    try {
      const profileRef = doc(this.db!, 'userProfiles', userId);
      await deleteDoc(profileRef);
    } catch (error) {
      console.error('Failed to delete user profile:', error);
      throw error;
    }
  }

  /**
   * Request data export
   */
  async requestDataExport(userId: string): Promise<void> {
    this.checkInitialized();

    try {
      await this.updateProfile(userId, {
        dataExportRequested: new Date()
      });
    } catch (error) {
      console.error('Failed to request data export:', error);
      throw error;
    }
  }

  /**
   * Update last login date
   */
  async updateLastLogin(userId: string): Promise<void> {
    this.checkInitialized();

    try {
      await this.updateProfile(userId, {
        lastLoginDate: new Date()
      });
    } catch (error) {
      console.error('Failed to update last login:', error);
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
export default new UserProfileService();