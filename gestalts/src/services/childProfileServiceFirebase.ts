import { getFirebaseServices } from './firebaseConfig';
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
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { ChildProfile, CreateChildProfileData, UpdateChildProfileData } from '../types/profile';

class ChildProfileServiceFirebase {
  /**
   * Check if Firebase is properly configured and initialized
   */
  isConfigured(): boolean {
    const { initialized } = getFirebaseServices();
    return initialized;
  }

  /**
   * Create a new child profile using Firebase Auth UID
   */
  async createProfile(userId: string, profileData: CreateChildProfileData): Promise<string> {
    const { db } = getFirebaseServices();
    if (!db) throw new Error('Firestore not initialized');
    
    // Generate a unique profile ID
    const profileId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create the profile document with the correct Firebase Auth UID
    const docData: any = {
      id: profileId,
      userId: userId, // This is the Firebase Auth UID from getCurrentUserId()
      childName: profileData.childName,
      parentName: profileData.parentName || '',
      birthDate: profileData.birthDate || '',
      currentStage: profileData.currentStage || 1,
      interests: profileData.interests || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Only add optional fields if they have values (not undefined or null)
    if (profileData.avatarUrl) docData.avatarUrl = profileData.avatarUrl;
    if ((profileData as any).avatarMode) docData.avatarMode = (profileData as any).avatarMode;
    if ((profileData as any).avatars) docData.avatars = (profileData as any).avatars;
    if (profileData.visualProfile) docData.visualProfile = profileData.visualProfile;
    
    await setDoc(doc(db, 'childProfiles', profileId), docData);
    
    return profileId;
  }

  /**
   * Get a specific child profile by ID
   */
  async getProfile(profileId: string): Promise<ChildProfile | null> {
    const { db } = getFirebaseServices();
    if (!db) throw new Error('Firestore not initialized');
    
    const docSnap = await getDoc(doc(db, 'childProfiles', profileId));
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    return this.convertFirestoreToChildProfile(profileId, data);
  }

  /**
   * Get all child profiles for a specific user using Firebase Auth UID
   */
  async getUserProfiles(userId: string): Promise<ChildProfile[]> {
    const { db } = getFirebaseServices();
    if (!db) throw new Error('Firestore not initialized');
    
    // Query using the Firebase Auth UID
    const q = query(collection(db, 'childProfiles'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const profiles: ChildProfile[] = [];
    querySnapshot.forEach((doc) => {
      const profile = this.convertFirestoreToChildProfile(doc.id, doc.data());
      if (profile) {
        profiles.push(profile);
      }
    });
    
    return profiles;
  }

  /**
   * Update a child profile
   */
  async updateProfile(profileId: string, userId: string, updates: UpdateChildProfileData): Promise<void> {
    const { db } = getFirebaseServices();
    if (!db) throw new Error('Firestore not initialized');
    
    const updateData: any = {
      updatedAt: serverTimestamp()
    };
    
    // Only add fields that are defined to avoid Firestore errors
    if (updates.childName !== undefined) updateData.childName = updates.childName;
    if (updates.parentName !== undefined) updateData.parentName = updates.parentName;
    if (updates.birthDate !== undefined) updateData.birthDate = updates.birthDate;
    if (updates.currentStage !== undefined) updateData.currentStage = updates.currentStage;
    if (updates.interests !== undefined) updateData.interests = updates.interests;
    if (updates.avatarUrl !== undefined) updateData.avatarUrl = updates.avatarUrl;
    if (updates.visualProfile !== undefined) updateData.visualProfile = updates.visualProfile;
    
    // Add support for new avatar metadata fields
    if ((updates as any).avatarMode !== undefined) updateData.avatarMode = (updates as any).avatarMode;
    if ((updates as any).avatars !== undefined) updateData.avatars = (updates as any).avatars;
    
    await updateDoc(doc(db, 'childProfiles', profileId), updateData);
  }

  /**
   * Delete a child profile
   */
  async deleteProfile(profileId: string, userId: string): Promise<void> {
    const { db } = getFirebaseServices();
    if (!db) throw new Error('Firestore not initialized');
    
    // Verify the profile belongs to this user before deleting
    const profile = await this.getProfile(profileId);
    if (!profile || profile.userId !== userId) {
      throw new Error('Profile not found or unauthorized');
    }
    
    await deleteDoc(doc(db, 'childProfiles', profileId));
  }

  /**
   * Convert Firestore document to ChildProfile type
   */
  private convertFirestoreToChildProfile(id: string, data: any): ChildProfile | null {
    if (!data) return null;
    
    return {
      id: id,
      userId: data.userId,
      childName: data.childName || '',
      parentName: data.parentName || '',
      birthDate: data.birthDate || undefined,
      currentStage: data.currentStage || undefined,
      interests: data.interests || [],
      avatarUrl: data.avatarUrl || undefined,
      avatarMode: data.avatarMode || undefined,
      avatars: data.avatars || undefined,
      visualProfile: data.visualProfile || undefined,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now())
    };
  }
}

// Export singleton instance
export default new ChildProfileServiceFirebase();