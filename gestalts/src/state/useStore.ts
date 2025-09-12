import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
// Use Firebase-enabled service instead of stub
import childProfileService from '../services/childProfileServiceFirebase';
import avatarStorageService from '../services/avatarStorageService';
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
export type UserProfile = { displayName?: string; firstName?: string; lastName?: string; email?: string; };

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
	userProfile: UserProfile | null;
	addJournal: (content: string, mood?: JournalEntry['mood'], type?: JournalEntry['type'], childName?: string, customDate?: string) => void;
	addMilestone: (title: string, dateISO?: string, notes?: string) => void;
	addAppointmentNote: (question: string, specialist?: string) => void;
	addAppointmentNoteFull: (data: Omit<AppointmentNote, 'id' | 'createdAtISO'> & { createdAtISO?: string }) => void;
	updateAppointmentNote: (id: string, updates: Partial<AppointmentNote>) => void;
	addPlaySession: (activity: string, notes?: string) => void;
	setProfile: (profile: ChildProfile) => void; // Legacy - will be deprecated
	updateUserProfile: (updates: Partial<UserProfile>) => void;
	getUserProfile: () => UserProfile | null;
} & ProfileState & {
	// Firebase profile operations
	loadUserProfiles: (userId: string) => Promise<void>;
	createProfile: (userId: string, profileData: CreateChildProfileData) => Promise<string>;
	updateProfile: (profileId: string, userId: string, updates: UpdateChildProfileData) => Promise<void>;
	deleteProfile: (profileId: string, userId: string) => Promise<void>;
	setCurrentProfile: (profile: FirebaseChildProfile | null) => void;
	clearProfileError: () => void;
	// Avatar operations for child profiles
	createChildAvatar: (profileId: string, userId: string, avatarDataUrl: string, mode?: 'animated' | 'real') => Promise<void>;
	removeChildAvatar: (profileId: string, userId: string, mode: 'animated' | 'real') => Promise<void>;
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
			userProfile: null,
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
			updateUserProfile: (updates) =>
				set((state) => ({ userProfile: { ...state.userProfile, ...updates } })),
			getUserProfile: () => get().userProfile,
			
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
			
			createChildAvatar: async (profileId: string, userId: string, avatarDataUrl: string, mode: 'animated' | 'real' = 'animated') => {
				set({ profileLoading: true, profileError: null });
				console.log(`🎭 Creating child avatar - Profile: ${profileId}, Mode: ${mode}`);
				
				try {
					// Get the current profile to extract name and existing avatars
					const currentProfiles = get().profiles;
					const targetProfile = currentProfiles.find(p => p.id === profileId);
					if (!targetProfile) {
						throw new Error('Profile not found');
					}
					console.log(`📋 Target profile found: ${targetProfile.childName}`);
					
					// Upload the generated avatar to Firebase Storage
					if (!avatarDataUrl) {
						throw new Error('No avatar data provided');
					}
					
					console.log(`📤 Uploading ${mode} avatar to Firebase Storage...`);
					const upload = await avatarStorageService.uploadAvatar(avatarDataUrl, {
						userId,
						type: mode as 'animated' | 'real',
						characterName: targetProfile.childName,
						childProfileId: profileId,
						createdAt: new Date().toISOString()
					});
					console.log(`✅ Avatar uploaded successfully: ${upload.url}`);
					
					// Prepare the existing avatars object, ensuring we preserve other modes
					const existingAvatars = (targetProfile as any).avatars || {};
					const updatedAvatars = {
						...existingAvatars,
						[mode]: upload.url // Set/update the specific mode
					};
					
					// Determine the primary avatar URL (prefer animated, fallback to real)
					const primaryAvatarUrl = updatedAvatars.animated || updatedAvatars.real || upload.url;
					
					// Update the profile with complete avatar information
					const updates: UpdateChildProfileData = {
						avatarUrl: primaryAvatarUrl, // Legacy field for backward compatibility
						avatarMode: mode, // Track which mode was just created/updated
					};
					
					// Add the complete avatars object
					(updates as any).avatars = updatedAvatars;
					
					console.log(`💾 Updating profile with avatar metadata:`, {
						avatarUrl: primaryAvatarUrl,
						avatarMode: mode,
						avatars: updatedAvatars
					});
					
					await get().updateProfile(profileId, userId, updates);
					console.log(`✅ Child avatar created successfully for ${targetProfile.childName} in ${mode} mode`);
					
					set({ profileLoading: false });
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Failed to create avatar';
					console.error('❌ Failed to create child avatar:', error);
					console.error('❌ Error details:', {
						profileId,
						userId,
						mode,
						hasAvatarData: !!avatarDataUrl,
						errorMessage
					});
					
					set({ profileError: errorMessage, profileLoading: false });
					throw error;
				}
			},

			removeChildAvatar: async (profileId: string, userId: string, mode: 'animated' | 'real') => {
				set({ profileLoading: true, profileError: null });
				try {
					const profiles = get().profiles;
					const targetProfile = profiles.find(p => p.id === profileId);
					if (!targetProfile) throw new Error('Profile not found');
					const avatars = { ...(targetProfile as any).avatars };
					delete avatars[mode];
					const updates: UpdateChildProfileData = {
						avatarUrl: avatars.animated || avatars.real,
					} as any;
					(updates as any).avatars = avatars;
					await get().updateProfile(profileId, userId, updates);
					set({ profileLoading: false });
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Failed to remove avatar';
					set({ profileError: errorMessage, profileLoading: false });
					throw error;
				}
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
				profile: state.profile, // Keep legacy profile for migration
				userProfile: state.userProfile
			}),
			storage: createJSONStorage(() => AsyncStorage),
		}
	)
);