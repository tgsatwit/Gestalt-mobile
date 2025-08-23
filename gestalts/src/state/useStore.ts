import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

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

export type MemoriesState = {
	journal: JournalEntry[];
	milestones: Milestone[];
	appointmentNotes: AppointmentNote[];
	playSessions: PlaySession[];
	profile: ChildProfile | null;
	addJournal: (content: string, mood?: JournalEntry['mood'], type?: JournalEntry['type'], childName?: string, customDate?: string) => void;
	addMilestone: (title: string, dateISO?: string, notes?: string) => void;
	addAppointmentNote: (question: string, specialist?: string) => void;
	addAppointmentNoteFull: (data: Omit<AppointmentNote, 'id' | 'createdAtISO'> & { createdAtISO?: string }) => void;
	updateAppointmentNote: (id: string, updates: Partial<AppointmentNote>) => void;
	addPlaySession: (activity: string, notes?: string) => void;
	setProfile: (profile: ChildProfile) => void;
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
		}),
		{
			name: 'gestalts-memories',
			storage: createJSONStorage(() => AsyncStorage),
		}
	)
);