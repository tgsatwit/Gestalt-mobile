export interface ChildProfile {
  id: string;
  childName: string;
  parentName?: string;
  birthDate?: string; // ISO string
  currentStage?: number; // Gestalt stage 1-6
  interests?: string[];
  challenges?: string;
  strengths?: string;
  userId: string; // Link to user who created the profile
  createdAt: Date;
  updatedAt: Date;
  // Avatar information
  avatarUrl?: string; // Legacy field for backwards compatibility
  avatarMode?: 'animated' | 'real'; // Track which mode was last created/updated
  avatars?: {
    animated?: string; // Animated/cartoon style avatar URL
    real?: string; // Real-life photo with background removed URL
  };
  visualProfile?: {
    appearance: string;
    style: string;
    personality: string;
    keyFeatures: string[];
  };
}

export interface CreateChildProfileData {
  childName: string;
  parentName?: string;
  birthDate?: string;
  currentStage?: number;
  interests?: string[];
  challenges?: string;
  strengths?: string;
  // Avatar information
  avatarUrl?: string; // Legacy field for backwards compatibility
  avatarMode?: 'animated' | 'real'; // Track which mode was last created/updated
  avatars?: {
    animated?: string; // Animated/cartoon style avatar URL
    real?: string; // Real-life photo with background removed URL
  };
  visualProfile?: {
    appearance: string;
    style: string;
    personality: string;
    keyFeatures: string[];
  };
}

export interface UpdateChildProfileData extends Partial<CreateChildProfileData> {}