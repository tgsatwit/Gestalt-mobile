import { getFirebaseServices } from './firebaseConfig';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { 
  Specialist, 
  CreateSpecialistData, 
  UpdateSpecialistData,
  ChildSpecialistLink,
  CreateChildSpecialistLinkData,
  UpdateChildSpecialistLinkData,
  ChildSpecialistView
} from '../types/specialist';

class SpecialistService {
  /**
   * Check if Firebase is properly configured and initialized
   */
  isConfigured(): boolean {
    const { initialized } = getFirebaseServices();
    return initialized;
  }

  /**
   * Create a new specialist
   */
  async createSpecialist(userId: string, specialistData: CreateSpecialistData): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Firebase is not properly configured');
    }

    const { firestore } = getFirebaseServices();
    if (!firestore) {
      throw new Error('Firestore is not available');
    }

    try {
      // Build specialist data with only defined values to avoid Firestore errors
      const firestoreData: any = {
        name: specialistData.name,
        title: specialistData.title,
        userId,
        createdAtISO: new Date().toISOString(),
        updatedAtISO: new Date().toISOString()
      };

      // Only add optional fields if they have values
      if (specialistData.organization?.trim()) {
        firestoreData.organization = specialistData.organization;
      }
      if (specialistData.email?.trim()) {
        firestoreData.email = specialistData.email;
      }
      if (specialistData.phone?.trim()) {
        firestoreData.phone = specialistData.phone;
      }
      if (specialistData.address?.trim()) {
        firestoreData.address = specialistData.address;
      }
      if (specialistData.specialties && specialistData.specialties.length > 0) {
        firestoreData.specialties = specialistData.specialties.filter(s => s.trim());
      }
      if (specialistData.notes?.trim()) {
        firestoreData.notes = specialistData.notes;
      }

      const specialistsCollection = collection(firestore, 'specialists');
      const docRef = await addDoc(specialistsCollection, firestoreData);
      return docRef.id;
    } catch (error) {
      console.error('Failed to create specialist:', error);
      throw error;
    }
  }

  /**
   * Get all specialists for a specific user
   */
  async getUserSpecialists(userId: string): Promise<Specialist[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const { firestore } = getFirebaseServices();
    if (!firestore) {
      return [];
    }

    try {
      const specialistsCollection = collection(firestore, 'specialists');
      const q = query(
        specialistsCollection,
        where('userId', '==', userId),
        orderBy('name')
      );
      const snapshot = await getDocs(q);

      const specialists: Specialist[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        specialists.push({
          id: doc.id,
          name: data.name,
          title: data.title,
          organization: data.organization,
          email: data.email,
          phone: data.phone,
          address: data.address,
          specialties: data.specialties || [],
          notes: data.notes,
          userId: data.userId,
          createdAt: new Date(data.createdAtISO),
          updatedAt: new Date(data.updatedAtISO)
        });
      });

      return specialists;
    } catch (error) {
      console.error('Failed to get user specialists:', error);
      return [];
    }
  }

  /**
   * Get a specific specialist by ID
   */
  async getSpecialist(specialistId: string, userId: string): Promise<Specialist | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const { firestore } = getFirebaseServices();
    if (!firestore) {
      return null;
    }

    try {
      const docRef = doc(firestore, 'specialists', specialistId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      
      // Verify ownership
      if (data.userId !== userId) {
        return null;
      }

      return {
        id: docSnap.id,
        name: data.name,
        title: data.title,
        organization: data.organization,
        email: data.email,
        phone: data.phone,
        address: data.address,
        specialties: data.specialties || [],
        notes: data.notes,
        userId: data.userId,
        createdAt: new Date(data.createdAtISO),
        updatedAt: new Date(data.updatedAtISO)
      };
    } catch (error) {
      console.error('Failed to get specialist:', error);
      return null;
    }
  }

  /**
   * Update a specialist
   */
  async updateSpecialist(specialistId: string, userId: string, updates: UpdateSpecialistData): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Firebase is not properly configured');
    }

    const { firestore } = getFirebaseServices();
    if (!firestore) {
      throw new Error('Firestore is not available');
    }

    try {
      // Verify ownership first
      const specialist = await this.getSpecialist(specialistId, userId);
      if (!specialist) {
        throw new Error('Specialist not found or access denied');
      }

      // Build update data with only defined values
      const updateData: any = {
        updatedAtISO: new Date().toISOString()
      };

      if (updates.name?.trim()) {
        updateData.name = updates.name;
      }
      if (updates.title?.trim()) {
        updateData.title = updates.title;
      }
      if (updates.organization !== undefined) {
        if (updates.organization.trim()) {
          updateData.organization = updates.organization;
        } else {
          updateData.organization = null; // Clear the field
        }
      }
      if (updates.email !== undefined) {
        if (updates.email.trim()) {
          updateData.email = updates.email;
        } else {
          updateData.email = null;
        }
      }
      if (updates.phone !== undefined) {
        if (updates.phone.trim()) {
          updateData.phone = updates.phone;
        } else {
          updateData.phone = null;
        }
      }
      if (updates.address !== undefined) {
        if (updates.address.trim()) {
          updateData.address = updates.address;
        } else {
          updateData.address = null;
        }
      }
      if (updates.specialties !== undefined) {
        updateData.specialties = updates.specialties.filter(s => s.trim());
      }
      if (updates.notes !== undefined) {
        if (updates.notes.trim()) {
          updateData.notes = updates.notes;
        } else {
          updateData.notes = null;
        }
      }

      const docRef = doc(firestore, 'specialists', specialistId);
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Failed to update specialist:', error);
      throw error;
    }
  }

  /**
   * Delete a specialist
   */
  async deleteSpecialist(specialistId: string, userId: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Firebase is not properly configured');
    }

    const { firestore } = getFirebaseServices();
    if (!firestore) {
      throw new Error('Firestore is not available');
    }

    try {
      // Verify ownership first
      const specialist = await this.getSpecialist(specialistId, userId);
      if (!specialist) {
        throw new Error('Specialist not found or access denied');
      }

      // Also delete all child-specialist links for this specialist
      const linksCollection = collection(firestore, 'childSpecialistLinks');
      const q = query(
        linksCollection,
        where('specialistId', '==', specialistId),
        where('userId', '==', userId)
      );
      const linksSnapshot = await getDocs(q);

      // Use batch delete for efficiency
      const batch = writeBatch(firestore);
      
      // Delete the specialist
      const specialistRef = doc(firestore, 'specialists', specialistId);
      batch.delete(specialistRef);
      
      // Delete all links
      linksSnapshot.forEach((linkDoc) => {
        batch.delete(linkDoc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Failed to delete specialist:', error);
      throw error;
    }
  }

  // CHILD-SPECIALIST LINKING METHODS

  /**
   * Create a link between a child and specialist
   */
  async createChildSpecialistLink(userId: string, linkData: CreateChildSpecialistLinkData): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Firebase is not properly configured');
    }

    const { firestore } = getFirebaseServices();
    if (!firestore) {
      throw new Error('Firestore is not available');
    }

    try {
      const firestoreData: any = {
        childId: linkData.childId,
        specialistId: linkData.specialistId,
        relationshipType: linkData.relationshipType,
        userId,
        createdAtISO: new Date().toISOString(),
        updatedAtISO: new Date().toISOString()
      };

      if (linkData.startDate?.trim()) {
        firestoreData.startDate = linkData.startDate;
      }
      if (linkData.endDate?.trim()) {
        firestoreData.endDate = linkData.endDate;
      }
      if (linkData.notes?.trim()) {
        firestoreData.notes = linkData.notes;
      }

      const linksCollection = collection(firestore, 'childSpecialistLinks');
      const docRef = await addDoc(linksCollection, firestoreData);
      return docRef.id;
    } catch (error) {
      console.error('Failed to create child-specialist link:', error);
      throw error;
    }
  }

  /**
   * Get all specialists for a specific child
   */
  async getChildSpecialists(childId: string, userId: string): Promise<ChildSpecialistView[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const { firestore } = getFirebaseServices();
    if (!firestore) {
      return [];
    }

    try {
      // Get all links for this child
      const linksCollection = collection(firestore, 'childSpecialistLinks');
      const q = query(
        linksCollection,
        where('childId', '==', childId),
        where('userId', '==', userId)
      );
      const linksSnapshot = await getDocs(q);

      const specialists: ChildSpecialistView[] = [];
      
      // For each link, get the corresponding specialist
      for (const linkDoc of linksSnapshot.docs) {
        const linkData = linkDoc.data();
        const specialist = await this.getSpecialist(linkData.specialistId, userId);
        
        if (specialist) {
          specialists.push({
            ...specialist,
            relationship: {
              id: linkDoc.id,
              childId: linkData.childId,
              specialistId: linkData.specialistId,
              relationshipType: linkData.relationshipType,
              startDate: linkData.startDate,
              endDate: linkData.endDate,
              notes: linkData.notes,
              userId: linkData.userId,
              createdAt: new Date(linkData.createdAtISO),
              updatedAt: new Date(linkData.updatedAtISO)
            }
          });
        }
      }

      return specialists.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Failed to get child specialists:', error);
      return [];
    }
  }

  /**
   * Update a child-specialist link
   */
  async updateChildSpecialistLink(linkId: string, userId: string, updates: UpdateChildSpecialistLinkData): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Firebase is not properly configured');
    }

    const { firestore } = getFirebaseServices();
    if (!firestore) {
      throw new Error('Firestore is not available');
    }

    try {
      // Build update data
      const updateData: any = {
        updatedAtISO: new Date().toISOString()
      };

      if (updates.relationshipType) {
        updateData.relationshipType = updates.relationshipType;
      }
      if (updates.startDate !== undefined) {
        updateData.startDate = updates.startDate?.trim() || null;
      }
      if (updates.endDate !== undefined) {
        updateData.endDate = updates.endDate?.trim() || null;
      }
      if (updates.notes !== undefined) {
        updateData.notes = updates.notes?.trim() || null;
      }

      const docRef = doc(firestore, 'childSpecialistLinks', linkId);
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Failed to update child-specialist link:', error);
      throw error;
    }
  }

  /**
   * Delete a child-specialist link
   */
  async deleteChildSpecialistLink(linkId: string, userId: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Firebase is not properly configured');
    }

    const { firestore } = getFirebaseServices();
    if (!firestore) {
      throw new Error('Firestore is not available');
    }

    try {
      const docRef = doc(firestore, 'childSpecialistLinks', linkId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Failed to delete child-specialist link:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new SpecialistService();