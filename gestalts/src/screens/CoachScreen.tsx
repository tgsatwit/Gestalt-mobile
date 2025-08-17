import React, { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Text, useTheme } from '../theme';
import { GradientButton } from '../components/GradientButton';
import { useMemoriesStore } from '../state/useStore';
import AppHeader from '../components/AppHeader';

const MODES = ['Language Coach', 'Parent Support', 'Child Mode'] as const;

type Mode = typeof MODES[number];

export default function CoachScreen() {
	const { tokens } = useTheme();
	const addJournal = useMemoriesStore((s) => s.addJournal);
	const addAppointmentNote = useMemoriesStore((s) => s.addAppointmentNote);
	const [mode, setMode] = useState<Mode>('Language Coach');
	const [input, setInput] = useState('');

	return (
		<>
			<AppHeader title="Coach" />
			<ScrollView contentContainerStyle={{ padding: tokens.spacing.containerX, paddingBottom: 40 }} style={{ backgroundColor: 'white' }}>
				<Text weight="semibold" style={{ fontSize: tokens.font.size.h2, marginBottom: tokens.spacing.gap.md }}>AI Coach</Text>
				<View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
					{MODES.map((m) => (
						<GradientButton key={m} title={m} onPress={() => setMode(m)} style={{ flex: 1 }} />
					))}
				</View>
				<Text color="secondary" style={{ marginBottom: 12 }}>
					Mode: {mode} — {mode === 'Language Coach' ? 'Ask about GLP strategies and everyday language support.' : mode === 'Parent Support' ? 'Share how you feel; receive empathetic guidance.' : 'Use short, engaging prompts to invite language during play.'}
				</Text>
				<TextInput
					placeholder={mode === 'Parent Support' ? 'Share how you are feeling today…' : mode === 'Child Mode' ? 'Prompt for a play chat…' : 'Ask about GLP, strategies, or next steps…'}
					value={input}
					onChangeText={setInput}
					style={{ borderColor: tokens.color.border.default, borderWidth: 1, borderRadius: tokens.radius.lg, padding: 14, minHeight: 80, textAlignVertical: 'top' }}
					multiline
				/>
				<View style={{ height: 12 }} />
				<View style={{ flexDirection: 'row', gap: 8 }}>
					<GradientButton title="Save as Journal" onPress={() => { if (!input.trim()) return; addJournal(input.trim()); setInput(''); }} />
					<GradientButton title="Add Appointment Note" onPress={() => { if (!input.trim()) return; addAppointmentNote(input.trim()); setInput(''); }} />
				</View>
				<View style={{ height: 24 }} />
				<Text color="secondary">
					Note: AI integration placeholder. This area will host chat UI and suggestions to create journal, milestone, or appointment notes based on conversation.
				</Text>
			</ScrollView>
		</>
	);
}