import React, { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Text, useTheme } from '../theme';
import { GradientButton } from '../components/GradientButton';
import { useMemoriesStore } from '../state/useStore';
import dayjs from 'dayjs';
import AppHeader from '../components/AppHeader';

export default function MemoriesScreen() {
	const { tokens } = useTheme();
	const { journal, milestones, appointmentNotes, addJournal, addMilestone, addAppointmentNote } = useMemoriesStore();
	const [j, setJ] = useState('');
	const [m, setM] = useState('');
	const [q, setQ] = useState('');
	return (
		<>
			<AppHeader title="Memories" />
			<ScrollView contentContainerStyle={{ padding: tokens.spacing.containerX, paddingBottom: 40 }} style={{ backgroundColor: 'white' }}>
				<Text weight="semibold" style={{ fontSize: tokens.font.size.h2, marginBottom: tokens.spacing.gap.md }}>Memories</Text>
				<Text color="secondary" style={{ marginBottom: 12 }}>Journal</Text>
				<TextInput value={j} onChangeText={setJ} placeholder="Write a brief note…" style={{ borderColor: tokens.color.border.default, borderWidth: 1, borderRadius: tokens.radius.lg, padding: 12 }} />
				<GradientButton title="Add Journal" onPress={() => { if (!j.trim()) return; addJournal(j.trim()); setJ(''); }} />
				<View style={{ height: 12 }} />
				{journal.map((e) => (
					<View key={e.id} style={{ borderColor: tokens.color.border.default, borderWidth: 1, borderRadius: tokens.radius.lg, padding: 12, marginBottom: 8 }}>
						<Text style={{ marginBottom: 4 }}>{e.content}</Text>
						<Text color="secondary" style={{ fontSize: tokens.font.size.small }}>{dayjs(e.createdAtISO).format('YYYY-MM-DD HH:mm')}</Text>
					</View>
				))}

				<View style={{ height: 24 }} />
				<Text color="secondary" style={{ marginBottom: 12 }}>Milestones</Text>
				<TextInput value={m} onChangeText={setM} placeholder="E.g., First two-word sentence" style={{ borderColor: tokens.color.border.default, borderWidth: 1, borderRadius: tokens.radius.lg, padding: 12 }} />
				<GradientButton title="Add Milestone" onPress={() => { if (!m.trim()) return; addMilestone(m.trim()); setM(''); }} />
				<View style={{ height: 12 }} />
				{milestones.map((e) => (
					<View key={e.id} style={{ borderColor: tokens.color.border.default, borderWidth: 1, borderRadius: tokens.radius.lg, padding: 12, marginBottom: 8 }}>
						<Text style={{ marginBottom: 4 }}>{e.title}</Text>
						<Text color="secondary" style={{ fontSize: tokens.font.size.small }}>{dayjs(e.dateISO).format('YYYY-MM-DD')}</Text>
					</View>
				))}

				<View style={{ height: 24 }} />
				<Text color="secondary" style={{ marginBottom: 12 }}>Appointment Notes</Text>
				<TextInput value={q} onChangeText={setQ} placeholder="Add a question for your specialist…" style={{ borderColor: tokens.color.border.default, borderWidth: 1, borderRadius: tokens.radius.lg, padding: 12 }} />
				<GradientButton title="Add Appointment Note" onPress={() => { if (!q.trim()) return; addAppointmentNote(q.trim()); setQ(''); }} />
				<View style={{ height: 12 }} />
				{appointmentNotes.map((e) => (
					<View key={e.id} style={{ borderColor: tokens.color.border.default, borderWidth: 1, borderRadius: tokens.radius.lg, padding: 12, marginBottom: 8 }}>
						<Text style={{ marginBottom: 4 }}>{e.question}</Text>
						<Text color="secondary" style={{ fontSize: tokens.font.size.small }}>{dayjs(e.createdAtISO).format('YYYY-MM-DD')}</Text>
					</View>
				))}
			</ScrollView>
		</>
	);
}