import { create } from 'zustand';
import memoriesService from '../services/memoriesService';
import { getFirebaseServices } from '../services/firebaseConfig';
import dayjs from 'dayjs';

// Types for Firebase-backed memories
export interface FirebaseJournalEntry {
  id: string;
  content: string;
  mood?: 'good' | 'tough' | 'neutral';
  type?: 'personal' | 'child';
  childName?: string;
  createdAtISO: string;
  childProfileId?: string;
}

export interface FirebaseMilestone {
  id: string;
  title: string;
  dateISO: string;
  notes?: string;
  childName?: string;
  childProfileId?: string;
}

export interface FirebaseAppointmentNote {
  id: string;
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
  childProfileId?: string;
}

export interface FirebaseGestalt {
  id: string;
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
  createdAtISO: string;
  childName?: string;
  childProfileId?: string;
}

interface FirebaseMemoriesState {
  // Data
  journal: FirebaseJournalEntry[];
  milestones: FirebaseMilestone[];
  appointmentNotes: FirebaseAppointmentNote[];
  gestalts: FirebaseGestalt[];
  
  // Loading states
  journalLoading: boolean;
  milestonesLoading: boolean;
  appointmentNotesLoading: boolean;
  gestaltsLoading: boolean;
  
  // Error states
  journalError: string | null;
  milestonesError: string | null;
  appointmentNotesError: string | null;
  gestaltsError: string | null;
  
  // Journal operations
  loadJournalEntries: (childProfileId?: string) => Promise<void>;
  addJournalEntry: (content: string, mood?: FirebaseJournalEntry['mood'], type?: FirebaseJournalEntry['type'], childName?: string, childProfileId?: string, customDate?: string) => Promise<void>;
  updateJournalEntry: (id: string, updates: Partial<FirebaseJournalEntry>) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  
  // Milestone operations
  loadMilestones: (childProfileId?: string) => Promise<void>;
  addMilestone: (title: string, dateISO?: string, notes?: string, childName?: string, childProfileId?: string) => Promise<void>;
  updateMilestone: (id: string, updates: Partial<FirebaseMilestone>) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;
  
  // Appointment note operations
  loadAppointmentNotes: (childProfileId?: string) => Promise<void>;
  addAppointmentNote: (question: string, specialist?: string, childProfileId?: string) => Promise<void>;
  addAppointmentNoteFull: (data: Omit<FirebaseAppointmentNote, 'id'>) => Promise<void>;
  updateAppointmentNote: (id: string, updates: Partial<FirebaseAppointmentNote>) => Promise<void>;
  deleteAppointmentNote: (id: string) => Promise<void>;
  
  // Gestalt operations
  loadGestalts: (childProfileId?: string) => Promise<void>;
  addGestalt: (phrase: string, source: string, sourceType: string, stage: string, contexts?: string[], dateStartedISO?: string, childName?: string, childProfileId?: string, audioData?: { uri: string; recordedAt: string }) => Promise<void>;
  updateGestalt: (id: string, updates: Partial<FirebaseGestalt>) => Promise<void>;
  deleteGestalt: (id: string) => Promise<void>;
  
  // Utility
  loadAllMemories: (childProfileId?: string) => Promise<void>;
  clearErrors: () => void;
}

const getCurrentUserId = (): string | null => {
  const { auth } = getFirebaseServices();
  const currentUser = auth?.currentUser;
  return currentUser?.uid || null;
};

export const useFirebaseMemoriesStore = create<FirebaseMemoriesState>((set, get) => ({
  // Initial state
  journal: [],
  milestones: [],
  appointmentNotes: [],
  gestalts: [],
  
  journalLoading: false,
  milestonesLoading: false,
  appointmentNotesLoading: false,
  gestaltsLoading: false,
  
  journalError: null,
  milestonesError: null,
  appointmentNotesError: null,
  gestaltsError: null,
  
  // Journal operations
  loadJournalEntries: async (childProfileId?: string) => {
    const userId = getCurrentUserId();
    if (!userId) {
      set({ journalError: 'User not authenticated' });
      return;
    }
    
    set({ journalLoading: true, journalError: null });
    try {
      const entries = await memoriesService.getUserJournalEntries(userId, childProfileId);
      set({ 
        journal: entries.map(entry => ({
          id: entry.id,
          content: entry.content,
          mood: entry.mood,
          type: entry.type,
          childName: entry.childName,
          createdAtISO: entry.createdAtISO,
          childProfileId: entry.childProfileId
        })),
        journalLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load journal entries';
      set({ journalError: errorMessage, journalLoading: false });
      console.error('Failed to load journal entries:', error);
    }
  },
  
  addJournalEntry: async (content, mood, type, childName, childProfileId, customDate) => {
    const userId = getCurrentUserId();
    if (!userId) {
      set({ journalError: 'User not authenticated' });
      return;
    }
    
    try {
      // Filter out undefined values for Firestore
      const entryData: any = {
        content,
        createdAtISO: customDate || dayjs().toISOString()
      };
      
      if (mood !== undefined) entryData.mood = mood;
      if (type !== undefined) entryData.type = type;
      if (childName !== undefined) entryData.childName = childName;
      if (childProfileId !== undefined) entryData.childProfileId = childProfileId;
      
      const entryId = await memoriesService.createJournalEntry(userId, entryData);
      
      // Add to local state optimistically
      const newEntry: FirebaseJournalEntry = {
        id: entryId,
        content,
        createdAtISO: customDate || dayjs().toISOString(),
        ...(mood !== undefined && { mood }),
        ...(type !== undefined && { type }),
        ...(childName !== undefined && { childName }),
        ...(childProfileId !== undefined && { childProfileId })
      };
      
      set(state => ({ 
        journal: [newEntry, ...state.journal],
        journalError: null 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add journal entry';
      set({ journalError: errorMessage });
      console.error('Failed to add journal entry:', error);
    }
  },
  
  updateJournalEntry: async (id, updates) => {
    const userId = getCurrentUserId();
    if (!userId) {
      set({ journalError: 'User not authenticated' });
      return;
    }
    
    try {
      await memoriesService.updateJournalEntry(id, userId, updates);
      set(state => ({
        journal: state.journal.map(entry => 
          entry.id === id ? { ...entry, ...updates } : entry
        ),
        journalError: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update journal entry';
      set({ journalError: errorMessage });
      console.error('Failed to update journal entry:', error);
    }
  },
  
  deleteJournalEntry: async (id) => {
    const userId = getCurrentUserId();
    if (!userId) {
      set({ journalError: 'User not authenticated' });
      return;
    }
    
    try {
      await memoriesService.deleteJournalEntry(id, userId);
      set(state => ({
        journal: state.journal.filter(entry => entry.id !== id),
        journalError: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete journal entry';
      set({ journalError: errorMessage });
      console.error('Failed to delete journal entry:', error);
    }
  },
  
  // Milestone operations
  loadMilestones: async (childProfileId?: string) => {
    const userId = getCurrentUserId();
    if (!userId) {
      set({ milestonesError: 'User not authenticated' });
      return;
    }
    
    set({ milestonesLoading: true, milestonesError: null });
    try {
      const milestones = await memoriesService.getUserMilestones(userId, childProfileId);
      set({ 
        milestones: milestones.map(milestone => ({
          id: milestone.id,
          title: milestone.title,
          dateISO: milestone.dateISO,
          notes: milestone.notes,
          childName: milestone.childName,
          childProfileId: milestone.childProfileId
        })),
        milestonesLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load milestones';
      set({ milestonesError: errorMessage, milestonesLoading: false });
      console.error('Failed to load milestones:', error);
    }
  },
  
  addMilestone: async (title, dateISO, notes, childName, childProfileId) => {
    const userId = getCurrentUserId();
    if (!userId) {
      set({ milestonesError: 'User not authenticated' });
      return;
    }
    
    try {
      // Filter out undefined values for Firestore
      const milestoneData: any = {
        title,
        dateISO: dateISO || dayjs().toISOString()
      };
      
      if (notes !== undefined) milestoneData.notes = notes;
      if (childName !== undefined) milestoneData.childName = childName;
      if (childProfileId !== undefined) milestoneData.childProfileId = childProfileId;
      
      const milestoneId = await memoriesService.createMilestone(userId, milestoneData);
      
      const newMilestone: FirebaseMilestone = {
        id: milestoneId,
        title,
        dateISO: dateISO || dayjs().toISOString(),
        ...(notes !== undefined && { notes }),
        ...(childName !== undefined && { childName }),
        ...(childProfileId !== undefined && { childProfileId })
      };
      
      set(state => ({ 
        milestones: [newMilestone, ...state.milestones],
        milestonesError: null 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add milestone';
      set({ milestonesError: errorMessage });
      console.error('Failed to add milestone:', error);
    }
  },
  
  updateMilestone: async (id, updates) => {
    const userId = getCurrentUserId();
    if (!userId) {
      set({ milestonesError: 'User not authenticated' });
      return;
    }
    
    try {
      await memoriesService.updateMilestone(id, userId, updates);
      set(state => ({
        milestones: state.milestones.map(milestone => 
          milestone.id === id ? { ...milestone, ...updates } : milestone
        ),
        milestonesError: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update milestone';
      set({ milestonesError: errorMessage });
      console.error('Failed to update milestone:', error);
    }
  },
  
  deleteMilestone: async (id) => {
    const userId = getCurrentUserId();
    if (!userId) {
      set({ milestonesError: 'User not authenticated' });
      return;
    }
    
    try {
      await memoriesService.deleteMilestone(id, userId);
      set(state => ({
        milestones: state.milestones.filter(milestone => milestone.id !== id),
        milestonesError: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete milestone';
      set({ milestonesError: errorMessage });
      console.error('Failed to delete milestone:', error);
    }
  },
  
  // Appointment note operations
  loadAppointmentNotes: async (childProfileId?: string) => {
    const userId = getCurrentUserId();
    if (!userId) {
      set({ appointmentNotesError: 'User not authenticated' });
      return;
    }
    
    set({ appointmentNotesLoading: true, appointmentNotesError: null });
    try {
      const notes = await memoriesService.getUserAppointmentNotes(userId, childProfileId);
      set({ 
        appointmentNotes: notes.map(note => ({
          id: note.id,
          question: note.question,
          specialist: note.specialist,
          details: note.details,
          imageUris: note.imageUris,
          audioUri: note.audioUri,
          appointmentDateISO: note.appointmentDateISO,
          isClosed: note.isClosed,
          closedAtISO: note.closedAtISO,
          closureResponse: note.closureResponse,
          createdAtISO: note.createdAtISO,
          childName: note.childName,
          childProfileId: note.childProfileId
        })),
        appointmentNotesLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load appointment notes';
      set({ appointmentNotesError: errorMessage, appointmentNotesLoading: false });
      console.error('Failed to load appointment notes:', error);
    }
  },
  
  addAppointmentNote: async (question, specialist, childProfileId) => {
    const userId = getCurrentUserId();
    if (!userId) {
      set({ appointmentNotesError: 'User not authenticated' });
      return;
    }
    
    try {
      // Filter out undefined values for Firestore
      const noteData: any = {
        question,
        createdAtISO: dayjs().toISOString()
      };
      
      if (specialist !== undefined) noteData.specialist = specialist;
      if (childProfileId !== undefined) noteData.childProfileId = childProfileId;
      
      const noteId = await memoriesService.createAppointmentNote(userId, noteData);
      
      const newNote: FirebaseAppointmentNote = {
        id: noteId,
        question,
        createdAtISO: dayjs().toISOString(),
        ...(specialist !== undefined && { specialist }),
        ...(childProfileId !== undefined && { childProfileId })
      };
      
      set(state => ({ 
        appointmentNotes: [newNote, ...state.appointmentNotes],
        appointmentNotesError: null 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add appointment note';
      set({ appointmentNotesError: errorMessage });
      console.error('Failed to add appointment note:', error);
    }
  },
  
  addAppointmentNoteFull: async (data) => {
    const userId = getCurrentUserId();
    if (!userId) {
      set({ appointmentNotesError: 'User not authenticated' });
      return;
    }
    
    try {
      // Filter out undefined values for Firestore
      const filteredData: any = {};
      Object.keys(data).forEach(key => {
        if ((data as any)[key] !== undefined) {
          filteredData[key] = (data as any)[key];
        }
      });
      
      const noteId = await memoriesService.createAppointmentNote(userId, filteredData);
      
      const newNote: FirebaseAppointmentNote = {
        ...filteredData,
        id: noteId
      };
      
      set(state => ({ 
        appointmentNotes: [newNote, ...state.appointmentNotes],
        appointmentNotesError: null 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add appointment note';
      set({ appointmentNotesError: errorMessage });
      console.error('Failed to add appointment note:', error);
    }
  },
  
  updateAppointmentNote: async (id, updates) => {
    const userId = getCurrentUserId();
    if (!userId) {
      set({ appointmentNotesError: 'User not authenticated' });
      return;
    }
    
    try {
      await memoriesService.updateAppointmentNote(id, userId, updates);
      set(state => ({
        appointmentNotes: state.appointmentNotes.map(note => 
          note.id === id ? { ...note, ...updates } : note
        ),
        appointmentNotesError: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update appointment note';
      set({ appointmentNotesError: errorMessage });
      console.error('Failed to update appointment note:', error);
    }
  },
  
  deleteAppointmentNote: async (id) => {
    const userId = getCurrentUserId();
    if (!userId) {
      set({ appointmentNotesError: 'User not authenticated' });
      return;
    }
    
    try {
      await memoriesService.deleteAppointmentNote(id, userId);
      set(state => ({
        appointmentNotes: state.appointmentNotes.filter(note => note.id !== id),
        appointmentNotesError: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete appointment note';
      set({ appointmentNotesError: errorMessage });
      console.error('Failed to delete appointment note:', error);
    }
  },
  
  // Gestalt operations
  loadGestalts: async (childProfileId?: string) => {
    const userId = getCurrentUserId();
    if (!userId) {
      set({ gestaltsError: 'User not authenticated' });
      return;
    }
    
    set({ gestaltsLoading: true, gestaltsError: null });
    try {
      const gestalts = await memoriesService.getUserGestalts(userId, childProfileId);
      set({ 
        gestalts: gestalts.map(gestalt => ({
          id: gestalt.id,
          phrase: gestalt.phrase,
          source: gestalt.source,
          sourceType: gestalt.sourceType,
          stage: gestalt.stage,
          contexts: gestalt.contexts,
          dateStartedISO: gestalt.dateStartedISO,
          audioData: gestalt.audioData,
          createdAtISO: gestalt.createdAtISO || dayjs().toISOString(),
          childName: gestalt.childName,
          childProfileId: gestalt.childProfileId
        })),
        gestaltsLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load gestalts';
      set({ gestaltsError: errorMessage, gestaltsLoading: false });
      console.error('Failed to load gestalts:', error);
    }
  },
  
  addGestalt: async (phrase, source, sourceType, stage, contexts, dateStartedISO, childName, childProfileId, audioData) => {
    const userId = getCurrentUserId();
    if (!userId) {
      set({ gestaltsError: 'User not authenticated' });
      return;
    }
    
    try {
      // Filter out undefined values for Firestore
      const gestaltData: any = {
        phrase,
        source,
        sourceType,
        stage,
        contexts,
        dateStartedISO,
        createdAtISO: dayjs().toISOString(),
        childName,
        childProfileId
      };

      // Only include audioData if it's not undefined
      if (audioData !== undefined) {
        gestaltData.audioData = audioData;
      }

      const gestaltId = await memoriesService.createGestalt(userId, gestaltData);
      
      const newGestalt: FirebaseGestalt = {
        id: gestaltId,
        ...gestaltData
      };
      
      set(state => ({ 
        gestalts: [newGestalt, ...state.gestalts],
        gestaltsError: null 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add gestalt';
      set({ gestaltsError: errorMessage });
      console.error('Failed to add gestalt:', error);
    }
  },
  
  updateGestalt: async (id, updates) => {
    const userId = getCurrentUserId();
    if (!userId) {
      set({ gestaltsError: 'User not authenticated' });
      return;
    }
    
    try {
      await memoriesService.updateGestalt(id, userId, updates);
      set(state => ({
        gestalts: state.gestalts.map(gestalt => 
          gestalt.id === id ? { ...gestalt, ...updates } : gestalt
        ),
        gestaltsError: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update gestalt';
      set({ gestaltsError: errorMessage });
      console.error('Failed to update gestalt:', error);
    }
  },
  
  deleteGestalt: async (id) => {
    const userId = getCurrentUserId();
    if (!userId) {
      set({ gestaltsError: 'User not authenticated' });
      return;
    }
    
    try {
      await memoriesService.deleteGestalt(id, userId);
      set(state => ({
        gestalts: state.gestalts.filter(gestalt => gestalt.id !== id),
        gestaltsError: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete gestalt';
      set({ gestaltsError: errorMessage });
      console.error('Failed to delete gestalt:', error);
    }
  },
  
  // Utility functions
  loadAllMemories: async (childProfileId?: string) => {
    await Promise.all([
      get().loadJournalEntries(childProfileId),
      get().loadMilestones(childProfileId),
      get().loadAppointmentNotes(childProfileId),
      get().loadGestalts(childProfileId)
    ]);
  },
  
  clearErrors: () => {
    set({
      journalError: null,
      milestonesError: null,
      appointmentNotesError: null,
      gestaltsError: null
    });
  }
}));