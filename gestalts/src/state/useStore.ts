import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import childProfileService from '../services/childProfileService';
import { ChildProfile as FirebaseChildProfile, CreateChildProfileData, UpdateChildProfileData } from '../types/profile';

export type JournalEntry = { id: string; content: string; createdAtISO: string; mood?: 'good' | 'tough' | 'neutral'; type?: 'personal' | 'child'; childName?: string };
export type Milestone = { id: string; title: string; dateISO: string; notes?: string };
export type AppointmentNote = {
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
};
export type PlaySession = { id: string; activity: string; notes?: string; createdAtISO: string };
export type ChildProfile = { id: string; childName: string; parentName?: string; birthDateISO?: string; stage?: string };

// Firebase-backed profile state
export type ProfileState = {
	profiles: FirebaseChildProfile[];
	currentProfile: FirebaseChildProfile | null;
	profileLoading: boolean;
	profileError: string | null;
};

export type MemoriesState = {
	journal: JournalEntry[];
	milestones: Milestone[];
	appointmentNotes: AppointmentNote[];
	playSessions: PlaySession[];
	profile: ChildProfile | null; // Legacy - will be deprecated
	addJournal: (content: string, mood?: JournalEntry['mood'], type?: JournalEntry['type'], childName?: string, customDate?: string) => void;
	addMilestone: (title: string, dateISO?: string, notes?: string) => void;
	addAppointmentNote: (question: string, specialist?: string) => void;
	addAppointmentNoteFull: (data: Omit<AppointmentNote, 'id' | 'createdAtISO'> & { createdAtISO?: string }) => void;
	updateAppointmentNote: (id: string, updates: Partial<AppointmentNote>) => void;
	addPlaySession: (activity: string, notes?: string) => void;
	setProfile: (profile: ChildProfile) => void; // Legacy - will be deprecated
} & ProfileState & {
	// Firebase profile operations
	loadUserProfiles: (userId: string) => Promise<void>;
	createProfile: (userId: string, profileData: CreateChildProfileData) => Promise<string>;
	updateProfile: (profileId: string, userId: string, updates: UpdateChildProfileData) => Promise<void>;
	deleteProfile: (profileId: string, userId: string) => Promise<void>;
	setCurrentProfile: (profile: FirebaseChildProfile | null) => void;
	clearProfileError: () => void;
};

const generateId = () => Math.random().toString(36).slice(2);

export const useMemoriesStore = create<MemoriesState>()(
	persist(
		(set, get) => ({
			journal: [],
			milestones: [],
			appointmentNotes: [],
			playSessions: [],
			profile: null,
			// Firebase profile state
			profiles: [],
			currentProfile: null,
			profileLoading: false,
			profileError: null,
			addJournal: (content, mood, type, childName, customDate) =>
				set((state) => ({ journal: [{ id: generateId(), content, mood, type, childName, createdAtISO: customDate || dayjs().toISOString() }, ...state.journal] })),
			addMilestone: (title, dateISO, notes) =>
				set((state) => ({ milestones: [{ id: generateId(), title, notes, dateISO: dateISO ?? dayjs().toISOString() }, ...state.milestones] })),
			addAppointmentNote: (question, specialist) =>
				set((state) => ({ appointmentNotes: [{ id: generateId(), question, specialist, createdAtISO: dayjs().toISOString() }, ...state.appointmentNotes] })),
			addAppointmentNoteFull: (data) =>
				set((state) => ({
					appointmentNotes: [
						{
							id: generateId(),
							question: data.question,
							specialist: data.specialist,
							details: data.details,
							imageUris: data.imageUris ?? [],
							audioUri: data.audioUri,
							appointmentDateISO: data.appointmentDateISO,
							isClosed: data.isClosed ?? false,
							closedAtISO: data.closedAtISO,
							closureResponse: data.closureResponse,
							createdAtISO: data.createdAtISO ?? dayjs().toISOString(),
						},
						...state.appointmentNotes,
					],
				})),
			updateAppointmentNote: (id, updates) =>
				set((state) => ({
					appointmentNotes: state.appointmentNotes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
				})),
			addPlaySession: (activity, notes) =>
				set((state) => ({ playSessions: [{ id: generateId(), activity, notes, createdAtISO: dayjs().toISOString() }, ...state.playSessions] })),
			setProfile: (profile) => set(() => ({ profile })),
			
			// Firebase profile operations
			loadUserProfiles: async (userId: string) => {
				set({ profileLoading: true, profileError: null });
				try {
					if (!childProfileService.isConfigured()) {
						throw new Error('Firebase not configured');
					}
					const profiles = await childProfileService.getUserProfiles(userId);
					set({ profiles, profileLoading: false });
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Failed to load profiles';
					set({ profileError: errorMessage, profileLoading: false });
					console.error('Failed to load user profiles:', error);
				}
			},
			
			createProfile: async (userId: string, profileData: CreateChildProfileData) => {
				set({ profileLoading: true, profileError: null });
				try {
					if (!childProfileService.isConfigured()) {
						throw new Error('Firebase not configured');
					}
					const profileId = await childProfileService.createProfile(userId, profileData);
					// Reload profiles to get the latest data
					const profiles = await childProfileService.getUserProfiles(userId);
					const newProfile = profiles.find(p => p.id === profileId);
					set({ 
						profiles, 
						currentProfile: newProfile || null,
						profileLoading: false 
					});
					return profileId;
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Failed to create profile';
					set({ profileError: errorMessage, profileLoading: false });
					console.error('Failed to create profile:', error);
					throw error;
				}
			},
			
			updateProfile: async (profileId: string, userId: string, updates: UpdateChildProfileData) => {
				set({ profileLoading: true, profileError: null });
				try {
					if (!childProfileService.isConfigured()) {
						throw new Error('Firebase not configured');
					}
					await childProfileService.updateProfile(profileId, userId, updates);
					// Reload profiles to get the latest data
					const profiles = await childProfileService.getUserProfiles(userId);
					const updatedProfile = profiles.find(p => p.id === profileId);
					set(state => ({ 
						profiles, 
						currentProfile: state.currentProfile?.id === profileId ? updatedProfile || null : state.currentProfile,
						profileLoading: false 
					}));
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
					set({ profileError: errorMessage, profileLoading: false });
					console.error('Failed to update profile:', error);
					throw error;
				}
			},
			
			deleteProfile: async (profileId: string, userId: string) => {
				set({ profileLoading: true, profileError: null });
				try {
					if (!childProfileService.isConfigured()) {
						throw new Error('Firebase not configured');
					}
					await childProfileService.deleteProfile(profileId, userId);
					set(state => ({ 
						profiles: state.profiles.filter(p => p.id !== profileId),
						currentProfile: state.currentProfile?.id === profileId ? null : state.currentProfile,
						profileLoading: false 
					}));
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Failed to delete profile';
					set({ profileError: errorMessage, profileLoading: false });
					console.error('Failed to delete profile:', error);
					throw error;
				}
			},
			
			setCurrentProfile: (profile: FirebaseChildProfile | null) => {
				set({ currentProfile: profile });
			},
			
			clearProfileError: () => {
				set({ profileError: null });
			},
		}),
		{
			name: 'gestalts-memories',
			// Don't persist Firebase profile data as it should be loaded fresh
			partialize: (state) => ({ 
				journal: state.journal,
				milestones: state.milestones,
				appointmentNotes: state.appointmentNotes,
				playSessions: state.playSessions,
				profile: state.profile // Keep legacy profile for migration
			}),
			storage: createJSONStorage(() => AsyncStorage),
		}
	)
);