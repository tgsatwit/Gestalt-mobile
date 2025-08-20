import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

export type JournalEntry = { id: string; content: string; createdAtISO: string; mood?: 'good' | 'tough' | 'neutral' };
export type Milestone = { id: string; title: string; dateISO: string; notes?: string };
export type AppointmentNote = { id: string; specialist?: string; question: string; createdAtISO: string };
export type PlaySession = { id: string; activity: string; notes?: string; createdAtISO: string };
export type ChildProfile = { id: string; childName: string; parentName?: string; birthDateISO?: string; stage?: string };

export type MemoriesState = {
	journal: JournalEntry[];
	milestones: Milestone[];
	appointmentNotes: AppointmentNote[];
	playSessions: PlaySession[];
	profile: ChildProfile | null;
	addJournal: (content: string, mood?: JournalEntry['mood']) => void;
	addMilestone: (title: string, dateISO?: string, notes?: string) => void;
	addAppointmentNote: (question: string, specialist?: string) => void;
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
			addJournal: (content, mood) =>
				set((state) => ({ journal: [{ id: generateId(), content, mood, createdAtISO: dayjs().toISOString() }, ...state.journal] })),
			addMilestone: (title, dateISO, notes) =>
				set((state) => ({ milestones: [{ id: generateId(), title, notes, dateISO: dateISO ?? dayjs().toISOString() }, ...state.milestones] })),
			addAppointmentNote: (question, specialist) =>
				set((state) => ({ appointmentNotes: [{ id: generateId(), question, specialist, createdAtISO: dayjs().toISOString() }, ...state.appointmentNotes] })),
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