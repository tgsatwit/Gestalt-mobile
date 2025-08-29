export interface UserProfile {
  id: string;
  userId: string; // Auth user ID
  email?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePicture?: string;
  
  // Subscription & Account
  subscriptionStatus: 'free' | 'premium' | 'trial';
  subscriptionExpiryDate?: Date;
  accountCreatedDate: Date;
  lastLoginDate?: Date;
  
  // Settings & Preferences
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderNotifications: boolean;
  weeklyReports: boolean;
  language: string;
  timezone: string;
  
  // App-specific settings
  defaultChildProfileId?: string;
  coachingPreferences: {
    preferredInteractionStyle: 'supportive' | 'direct' | 'conversational';
    reminderFrequency: 'daily' | 'weekly' | 'monthly' | 'none';
    reportFormat: 'detailed' | 'summary' | 'visual';
  };
  
  // Privacy & Security
  profileVisibility: 'private' | 'contacts' | 'public';
  dataExportRequested?: Date;
  accountDeletionRequested?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProfileData {
  email?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePicture?: string;
  subscriptionStatus?: 'free' | 'premium' | 'trial';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  reminderNotifications?: boolean;
  weeklyReports?: boolean;
  language?: string;
  timezone?: string;
  defaultChildProfileId?: string;
  coachingPreferences?: {
    preferredInteractionStyle?: 'supportive' | 'direct' | 'conversational';
    reminderFrequency?: 'daily' | 'weekly' | 'monthly' | 'none';
    reportFormat?: 'detailed' | 'summary' | 'visual';
  };
  profileVisibility?: 'private' | 'contacts' | 'public';
}

export interface UpdateUserProfileData extends Partial<CreateUserProfileData> {
  subscriptionExpiryDate?: Date;
  lastLoginDate?: Date;
  dataExportRequested?: Date;
  accountDeletionRequested?: Date;
}