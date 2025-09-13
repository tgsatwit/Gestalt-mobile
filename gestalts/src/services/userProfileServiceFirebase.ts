import { getFirebaseServices } from './firebaseConfig';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { UserProfile, CreateUserProfileData, UpdateUserProfileData } from '../types/userProfile';

class UserProfileServiceFirebase {
  /**
   * Check if Firebase is properly configured and initialized
   */
  isConfigured(): boolean {
    const { initialized } = getFirebaseServices();
    return initialized;
  }

  /**
   * Create or update user profile in the 'users' collection
   * This extends the basic auth profile with additional user preferences
   */
  async createProfile(userId: string, profileData: CreateUserProfileData): Promise<string> {
    const { db } = getFirebaseServices();
    if (!db) throw new Error('Firestore not initialized');
    
    // Merge profile data with existing auth data in 'users' collection
    await setDoc(doc(db, 'users', userId), {
      // Basic info (may already exist from auth)
      id: userId,
      email: profileData.email,
      firstName: profileData.firstName || '',
      lastName: profileData.lastName || '',
      
      // Extended profile info
      name: profileData.name || '',
      phoneNumber: profileData.phoneNumber || '',
      
      // Notification preferences
      emailNotifications: profileData.emailNotifications ?? true,
      pushNotifications: profileData.pushNotifications ?? true,
      reminderNotifications: profileData.reminderNotifications ?? true,
      weeklyReports: profileData.weeklyReports ?? true,
      
      // Coaching preferences
      coachingPreferences: {
        preferredInteractionStyle: profileData.coachingPreferences?.preferredInteractionStyle || 'supportive',
        reminderFrequency: profileData.coachingPreferences?.reminderFrequency || 'weekly',
        reportFormat: profileData.coachingPreferences?.reportFormat || 'detailed'
      },
      
      // Privacy settings
      profileVisibility: profileData.profileVisibility || 'private',
      
      // Subscription info
      subscriptionStatus: profileData.subscriptionStatus || 'free',
      subscriptionExpiryDate: null,
      
      // Other preferences
      language: profileData.language || 'en',
      timezone: profileData.timezone || 'UTC',
      
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true }); // Merge to preserve existing auth data
    
    return userId;
  }

  /**
   * Get user profile from 'users' collection
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { db } = getFirebaseServices();
    if (!db) throw new Error('Firestore not initialized');
    
    const docSnap = await getDoc(doc(db, 'users', userId));
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    return this.convertFirestoreToUserProfile(userId, data);
  }

  /**
   * Update user profile in 'users' collection
   */
  async updateProfile(userId: string, updates: UpdateUserProfileData): Promise<void> {
    const { db } = getFirebaseServices();
    if (!db) throw new Error('Firestore not initialized');
    
    const updateData: any = {
      updatedAt: serverTimestamp()
    };
    
    // Basic info - always update if provided (including empty strings)
    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }
    if (updates.firstName !== undefined) {
      updateData.firstName = updates.firstName;
    }
    if (updates.lastName !== undefined) {
      updateData.lastName = updates.lastName;
    }
    if (updates.email !== undefined) {
      updateData.email = updates.email;
    }
    if (updates.phoneNumber !== undefined) {
      updateData.phoneNumber = updates.phoneNumber;
    }
    
    // Notification preferences
    if (updates.emailNotifications !== undefined) updateData.emailNotifications = updates.emailNotifications;
    if (updates.pushNotifications !== undefined) updateData.pushNotifications = updates.pushNotifications;
    if (updates.reminderNotifications !== undefined) updateData.reminderNotifications = updates.reminderNotifications;
    if (updates.weeklyReports !== undefined) updateData.weeklyReports = updates.weeklyReports;
    
    // Coaching preferences - need to handle nested object
    if (updates.coachingPreferences !== undefined) {
      // Get existing preferences first
      const existingDoc = await getDoc(doc(db, 'users', userId));
      const existingPrefs = existingDoc.data()?.coachingPreferences || {};
      
      updateData.coachingPreferences = {
        ...existingPrefs,
        ...updates.coachingPreferences
      };
    }
    
    // Privacy settings
    if (updates.profileVisibility !== undefined) updateData.profileVisibility = updates.profileVisibility;
    
    // Subscription info
    if (updates.subscriptionStatus !== undefined) updateData.subscriptionStatus = updates.subscriptionStatus;
    if (updates.subscriptionExpiryDate !== undefined) updateData.subscriptionExpiryDate = updates.subscriptionExpiryDate;
    
    // Other preferences
    if (updates.language !== undefined) updateData.language = updates.language;
    if (updates.timezone !== undefined) updateData.timezone = updates.timezone;
    
    console.log('Updating user profile with:', updateData);
    await updateDoc(doc(db, 'users', userId), updateData);
    console.log('User profile updated successfully');
  }

  /**
   * Delete user profile (not recommended - usually handled by auth deletion)
   */
  async deleteProfile(userId: string): Promise<void> {
    // Note: We typically don't delete from users collection directly
    // This should be handled by auth service when deleting account
    console.warn('Profile deletion should be handled through auth service');
    throw new Error('Please use auth service to delete account');
  }

  /**
   * Request data export - marks the request in the user profile
   */
  async requestDataExport(userId: string): Promise<void> {
    const { db } = getFirebaseServices();
    if (!db) throw new Error('Firestore not initialized');
    
    await updateDoc(doc(db, 'users', userId), {
      dataExportRequested: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Mark account for deletion - sets a flag for scheduled deletion
   */
  async markForDeletion(userId: string): Promise<void> {
    const { db } = getFirebaseServices();
    if (!db) throw new Error('Firestore not initialized');
    
    await updateDoc(doc(db, 'users', userId), {
      accountDeletionRequested: serverTimestamp(),
      accountStatus: 'pending_deletion',
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Convert Firestore document to UserProfile type
   */
  private convertFirestoreToUserProfile(id: string, data: any): UserProfile | null {
    if (!data) return null;
    
    return {
      id: id,
      userId: id, // Auth user ID
      email: data.email || '',
      name: data.firstName || '',
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      phoneNumber: data.phoneNumber || '',
      profilePicture: data.profilePicture || '',
      
      // Subscription & Account
      subscriptionStatus: data.subscriptionStatus || 'free',
      subscriptionExpiryDate: data.subscriptionExpiryDate instanceof Timestamp ? data.subscriptionExpiryDate.toDate() : (data.subscriptionExpiryDate ? new Date(data.subscriptionExpiryDate) : undefined),
      accountCreatedDate: data.accountCreatedDate instanceof Timestamp ? data.accountCreatedDate.toDate() : (data.accountCreatedDate ? new Date(data.accountCreatedDate) : new Date()),
      lastLoginDate: data.lastLoginDate instanceof Timestamp ? data.lastLoginDate.toDate() : (data.lastLoginDate ? new Date(data.lastLoginDate) : undefined),
      
      // Settings & Preferences
      emailNotifications: data.emailNotifications ?? true,
      pushNotifications: data.pushNotifications ?? true,
      reminderNotifications: data.reminderNotifications ?? true,
      weeklyReports: data.weeklyReports ?? true,
      language: data.language || 'en',
      timezone: data.timezone || 'UTC',
      
      // App-specific settings
      defaultChildProfileId: data.defaultChildProfileId,
      coachingPreferences: {
        preferredInteractionStyle: data.coachingPreferences?.preferredInteractionStyle || 'supportive',
        reminderFrequency: data.coachingPreferences?.reminderFrequency || 'weekly',
        reportFormat: data.coachingPreferences?.reportFormat || 'detailed'
      },
      
      // Privacy & Security
      profileVisibility: data.profileVisibility || 'private',
      dataExportRequested: data.dataExportRequested instanceof Timestamp ? data.dataExportRequested.toDate() : (data.dataExportRequested ? new Date(data.dataExportRequested) : undefined),
      accountDeletionRequested: data.accountDeletionRequested instanceof Timestamp ? data.accountDeletionRequested.toDate() : (data.accountDeletionRequested ? new Date(data.accountDeletionRequested) : undefined),
      
      // Metadata
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now())
    };
  }
}

// Export singleton instance
export default new UserProfileServiceFirebase();