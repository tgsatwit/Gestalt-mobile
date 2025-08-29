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
}

export interface CreateChildProfileData {
  childName: string;
  parentName?: string;
  birthDate?: string;
  currentStage?: number;
  interests?: string[];
  challenges?: string;
  strengths?: string;
}

export interface UpdateChildProfileData extends Partial<CreateChildProfileData> {}