import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Specialist, ChildSpecialistView } from '../types/specialist';
import specialistService from '../services/specialistService';

interface SpecialistStore {
  // State
  specialists: Specialist[];
  childSpecialists: { [childId: string]: ChildSpecialistView[] };
  loading: boolean;
  error: string | null;
  
  // Actions
  loadSpecialists: (userId: string) => Promise<void>;
  loadChildSpecialists: (childId: string, userId: string) => Promise<void>;
  addSpecialist: (specialist: Specialist) => void;
  updateSpecialist: (specialistId: string, updates: Partial<Specialist>) => void;
  removeSpecialist: (specialistId: string) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  specialists: [],
  childSpecialists: {},
  loading: false,
  error: null,
};

export const useSpecialistStore = create<SpecialistStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      loadSpecialists: async (userId: string) => {
        set({ loading: true, error: null });
        
        try {
          const specialists = await specialistService.getUserSpecialists(userId);
          set({ specialists, loading: false });
        } catch (error) {
          console.error('Failed to load specialists:', error);
          set({ 
            error: 'Failed to load specialists', 
            loading: false 
          });
        }
      },
      
      loadChildSpecialists: async (childId: string, userId: string) => {
        set({ loading: true, error: null });
        
        try {
          const childSpecialists = await specialistService.getChildSpecialists(childId, userId);
          set((state) => ({ 
            childSpecialists: {
              ...state.childSpecialists,
              [childId]: childSpecialists
            },
            loading: false 
          }));
        } catch (error) {
          console.error('Failed to load child specialists:', error);
          set({ 
            error: 'Failed to load child specialists', 
            loading: false 
          });
        }
      },
      
      addSpecialist: (specialist: Specialist) => {
        set((state) => ({
          specialists: [...state.specialists, specialist].sort((a, b) => a.name.localeCompare(b.name))
        }));
      },
      
      updateSpecialist: (specialistId: string, updates: Partial<Specialist>) => {
        set((state) => ({
          specialists: state.specialists.map((specialist) =>
            specialist.id === specialistId 
              ? { ...specialist, ...updates, updatedAt: new Date() }
              : specialist
          )
        }));
        
        // Also update any child specialists that reference this specialist
        const state = get();
        const updatedChildSpecialists: { [childId: string]: ChildSpecialistView[] } = {};
        
        Object.entries(state.childSpecialists).forEach(([childId, childSpecs]) => {
          updatedChildSpecialists[childId] = childSpecs.map((spec) =>
            spec.id === specialistId
              ? { ...spec, ...updates, updatedAt: new Date() }
              : spec
          );
        });
        
        set({ childSpecialists: updatedChildSpecialists });
      },
      
      removeSpecialist: (specialistId: string) => {
        set((state) => ({
          specialists: state.specialists.filter((specialist) => specialist.id !== specialistId)
        }));
        
        // Also remove from child specialists
        const state = get();
        const updatedChildSpecialists: { [childId: string]: ChildSpecialistView[] } = {};
        
        Object.entries(state.childSpecialists).forEach(([childId, childSpecs]) => {
          updatedChildSpecialists[childId] = childSpecs.filter((spec) => spec.id !== specialistId);
        });
        
        set({ childSpecialists: updatedChildSpecialists });
      },
      
      clearError: () => {
        set({ error: null });
      },
      
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'specialist-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the data, not the loading/error states
      partialize: (state) => ({
        specialists: state.specialists,
        childSpecialists: state.childSpecialists,
      }),
    }
  )
);