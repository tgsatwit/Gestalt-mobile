import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
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

      const profileRef = firestore().collection('userProfiles').doc(userId);
      await profileRef.set({
        ...profile,
        accountCreatedDate: firestore.FieldValue.serverTimestamp(),
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        subscriptionExpiryDate: profile.subscriptionExpiryDate ? firestore.Timestamp.fromDate(profile.subscriptionExpiryDate) : null,
        lastLoginDate: profile.lastLoginDate ? firestore.Timestamp.fromDate(profile.lastLoginDate) : null,
        dataExportRequested: profile.dataExportRequested ? firestore.Timestamp.fromDate(profile.dataExportRequested) : null,
        accountDeletionRequested: profile.accountDeletionRequested ? firestore.Timestamp.fromDate(profile.accountDeletionRequested) : null
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
    try {
      const profileRef = firestore().collection('userProfiles').doc(userId);
      const profileDoc = await profileRef.get();

      if (!profileDoc.exists) {
        return null;
      }

      const data = profileDoc.data();
      return {
        ...data,
        id: profileDoc.id,
        accountCreatedDate: data?.accountCreatedDate?.toDate(),
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate(),
        subscriptionExpiryDate: data?.subscriptionExpiryDate?.toDate(),
        lastLoginDate: data?.lastLoginDate?.toDate(),
        dataExportRequested: data?.dataExportRequested?.toDate(),
        accountDeletionRequested: data?.accountDeletionRequested?.toDate()
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
    try {
      const profileRef = firestore().collection('userProfiles').doc(userId);
      
      // Filter out undefined values from updates
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      const updateData: any = {
        ...cleanUpdates,
        updatedAt: firestore.FieldValue.serverTimestamp()
      };

      // Convert Date objects to Timestamps
      if (cleanUpdates.subscriptionExpiryDate) {
        updateData.subscriptionExpiryDate = firestore.Timestamp.fromDate(cleanUpdates.subscriptionExpiryDate);
      }
      if (cleanUpdates.lastLoginDate) {
        updateData.lastLoginDate = firestore.Timestamp.fromDate(cleanUpdates.lastLoginDate);
      }
      if (cleanUpdates.dataExportRequested) {
        updateData.dataExportRequested = firestore.Timestamp.fromDate(cleanUpdates.dataExportRequested);
      }
      if (cleanUpdates.accountDeletionRequested) {
        updateData.accountDeletionRequested = firestore.Timestamp.fromDate(cleanUpdates.accountDeletionRequested);
      }

      await profileRef.update(updateData);
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }

  /**
   * Delete a user profile (soft delete by marking for deletion)
   */
  async markForDeletion(userId: string): Promise<void> {
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
    try {
      const profileRef = firestore().collection('userProfiles').doc(userId);
      await profileRef.delete();
    } catch (error) {
      console.error('Failed to delete user profile:', error);
      throw error;
    }
  }

  /**
   * Request data export
   */
  async requestDataExport(userId: string): Promise<void> {
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
    try {
      await this.updateProfile(userId, {
        lastLoginDate: new Date()
      });
    } catch (error) {
      console.error('Failed to update last login:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new UserProfileService();