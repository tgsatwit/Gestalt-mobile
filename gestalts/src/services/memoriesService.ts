import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { getFirebaseServices } from './firebaseConfig';
import dayjs from 'dayjs';

// Helper to get current user ID
const getCurrentUserId = (): string => {
  const { auth } = getFirebaseServices();
  const user = auth?.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.uid;
};

// Types matching the existing store types
export interface JournalEntry {
  id: string;
  userId: string;
  childProfileId?: string;
  content: string;
  mood?: 'good' | 'tough' | 'neutral';
  type?: 'personal' | 'child';
  childName?: string;
  createdAtISO: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Milestone {
  id: string;
  userId: string;
  childProfileId?: string;
  title: string;
  dateISO: string;
  notes?: string;
  childName?: string;
  audioData?: {
    uri: string;
    recordedAt: string;
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AppointmentNote {
  id: string;
  userId: string;
  childProfileId?: string;
  question: string;
  specialist?: string;
  details?: string;
  imageUris?: string[];
  audioUri?: string;
  appointmentDateISO?: string;
  isClosed?: boolean;
  closedAtISO?: string;
  closureResponse?: string;
  createdAtISO: string;
  childName?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Gestalt {
  id: string;
  userId: string;
  childProfileId?: string;
  phrase: string;
  source: string;
  sourceType?: string;
  stage: string;
  contexts?: string[];
  dateStartedISO?: string;
  audioData?: {
    uri: string;
    recordedAt: string;
  };
  createdAtISO?: string;
  childName?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

class MemoriesService {
  isConfigured(): boolean {
    const { initialized } = getFirebaseServices();
    return initialized;
  }

  // Journal Methods
  async getUserJournalEntries(userId: string, childProfileId?: string): Promise<JournalEntry[]> {
    try {
      const { db } = getFirebaseServices();
      if (!db) throw new Error('Firestore not initialized');
      
      let journalsQuery;
      
      if (childProfileId) {
        journalsQuery = query(
          collection(db, 'journals'),
          where('userId', '==', userId),
          where('childProfileId', '==', childProfileId),
          orderBy('createdAt', 'desc')
        );
      } else {
        journalsQuery = query(
          collection(db, 'journals'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(journalsQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as JournalEntry));
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      throw error;
    }
  }

  async createJournalEntry(
    userId: string, 
    data: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const { db } = getFirebaseServices();
      if (!db) throw new Error('Firestore not initialized');
      
      const docRef = await addDoc(collection(db, 'journals'), {
        ...data,
        userId,
        createdAtISO: data.createdAtISO || dayjs().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  }

  async updateJournalEntry(entryId: string, userId: string, updates: Partial<JournalEntry>): Promise<void> {
    try {
      const { db } = getFirebaseServices();
      if (!db) throw new Error('Firestore not initialized');
      
      const docRef = doc(db, 'journals', entryId);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating journal entry:', error);
      throw error;
    }
  }

  async deleteJournalEntry(entryId: string, userId: string): Promise<void> {
    try {
      const { db } = getFirebaseServices();
      if (!db) throw new Error('Firestore not initialized');
      
      const docRef = doc(db, 'journals', entryId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw error;
    }
  }

  // Milestone Methods
  async getUserMilestones(userId: string, childProfileId?: string): Promise<Milestone[]> {
    try {
      const { db } = getFirebaseServices();
      if (!db) throw new Error('Firestore not initialized');
      
      let milestonesQuery;
      
      if (childProfileId) {
        milestonesQuery = query(
          collection(db, 'milestones'),
          where('userId', '==', userId),
          where('childProfileId', '==', childProfileId),
          orderBy('createdAt', 'desc')
        );
      } else {
        milestonesQuery = query(
          collection(db, 'milestones'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(milestonesQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Milestone));
    } catch (error) {
      console.error('Error fetching milestones:', error);
      throw error;
    }
  }

  async createMilestone(
    userId: string, 
    data: Omit<Milestone, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const { db } = getFirebaseServices();
      if (!db) throw new Error('Firestore not initialized');
      
      const docRef = await addDoc(collection(db, 'milestones'), {
        ...data,
        userId,
        dateISO: data.dateISO || dayjs().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating milestone:', error);
      throw error;
    }
  }

  async updateMilestone(milestoneId: string, userId: string, updates: Partial<Milestone>): Promise<void> {
    try {
      const { db } = getFirebaseServices();
      if (!db) throw new Error('Firestore not initialized');
      
      const docRef = doc(db, 'milestones', milestoneId);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating milestone:', error);
      throw error;
    }
  }

  async deleteMilestone(milestoneId: string, userId: string): Promise<void> {
    try {
      const { db } = getFirebaseServices();
      if (!db) throw new Error('Firestore not initialized');
      
      const docRef = doc(db, 'milestones', milestoneId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting milestone:', error);
      throw error;
    }
  }

  // Appointment Note Methods
  async getUserAppointmentNotes(userId: string, childProfileId?: string): Promise<AppointmentNote[]> {
    try {
      const { db } = getFirebaseServices();
      if (!db) throw new Error('Firestore not initialized');
      
      let appointmentNotesQuery;
      
      if (childProfileId) {
        appointmentNotesQuery = query(
          collection(db, 'appointmentNotes'),
          where('userId', '==', userId),
          where('childProfileId', '==', childProfileId),
          orderBy('createdAt', 'desc')
        );
      } else {
        appointmentNotesQuery = query(
          collection(db, 'appointmentNotes'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(appointmentNotesQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AppointmentNote));
    } catch (error) {
      console.error('Error fetching appointment notes:', error);
      throw error;
    }
  }

  async createAppointmentNote(
    userId: string, 
    data: Omit<AppointmentNote, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const { db } = getFirebaseServices();
      if (!db) throw new Error('Firestore not initialized');
      
      const docRef = await addDoc(collection(db, 'appointmentNotes'), {
        ...data,
        userId,
        createdAtISO: data.createdAtISO || dayjs().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating appointment note:', error);
      throw error;
    }
  }

  async updateAppointmentNote(noteId: string, userId: string, updates: Partial<AppointmentNote>): Promise<void> {
    try {
      const { db } = getFirebaseServices();
      if (!db) throw new Error('Firestore not initialized');
      
      const docRef = doc(db, 'appointmentNotes', noteId);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating appointment note:', error);
      throw error;
    }
  }

  async deleteAppointmentNote(noteId: string, userId: string): Promise<void> {
    try {
      const { db } = getFirebaseServices();
      if (!db) throw new Error('Firestore not initialized');
      
      const docRef = doc(db, 'appointmentNotes', noteId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting appointment note:', error);
      throw error;
    }
  }

  // Gestalt Methods
  async getUserGestalts(userId: string, childProfileId?: string): Promise<Gestalt[]> {
    try {
      const { db } = getFirebaseServices();
      if (!db) throw new Error('Firestore not initialized');
      
      let gestaltsQuery;
      
      if (childProfileId) {
        gestaltsQuery = query(
          collection(db, 'gestalts'),
          where('userId', '==', userId),
          where('childProfileId', '==', childProfileId),
          orderBy('createdAt', 'desc')
        );
      } else {
        gestaltsQuery = query(
          collection(db, 'gestalts'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(gestaltsQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Gestalt));
    } catch (error) {
      console.error('Error fetching gestalts:', error);
      throw error;
    }
  }

  async createGestalt(
    userId: string, 
    data: Omit<Gestalt, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const { db } = getFirebaseServices();
      if (!db) throw new Error('Firestore not initialized');
      
      const docRef = await addDoc(collection(db, 'gestalts'), {
        ...data,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating gestalt:', error);
      throw error;
    }
  }

  async updateGestalt(gestaltId: string, userId: string, updates: Partial<Gestalt>): Promise<void> {
    try {
      const { db } = getFirebaseServices();
      if (!db) throw new Error('Firestore not initialized');
      
      const docRef = doc(db, 'gestalts', gestaltId);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating gestalt:', error);
      throw error;
    }
  }

  async deleteGestalt(gestaltId: string, userId: string): Promise<void> {
    try {
      const { db } = getFirebaseServices();
      if (!db) throw new Error('Firestore not initialized');
      
      const docRef = doc(db, 'gestalts', gestaltId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting gestalt:', error);
      throw error;
    }
  }
}

const memoriesService = new MemoriesService();
export default memoriesService;