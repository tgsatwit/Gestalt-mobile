import React, { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Text, useTheme } from '../theme';
import { GradientButton } from '../components/GradientButton';
import { useMemoriesStore } from '../state/useStore';
import AppHeader from '../components/AppHeader';

export default function PlayScreen() {
	const { tokens } = useTheme();
	const { addPlaySession, playSessions } = useMemoriesStore();
	const [activity, setActivity] = useState('');
	const [notes, setNotes] = useState('');

	return (
		<>
			<AppHeader title="Play" showMenu={true} />
			<ScrollView contentContainerStyle={{ padding: tokens.spacing.containerX, paddingBottom: 40 }} style={{ backgroundColor: 'white' }}>
				<Text weight="semibold" style={{ fontSize: tokens.font.size.h2, marginBottom: tokens.spacing.gap.md }}>Play Analyzer</Text>
				<Text color="secondary" style={{ marginBottom: 12 }}>Record a play interaction to reflect on what worked and build language.</Text>
				<TextInput placeholder="Activity (e.g., Cars, Blocks, Pretend Kitchen)" value={activity} onChangeText={setActivity} style={{ borderColor: tokens.color.border.default, borderWidth: 1, borderRadius: tokens.radius.lg, padding: 12, marginBottom: 8 }} />
				<TextInput placeholder="Notes (optional)" value={notes} onChangeText={setNotes} style={{ borderColor: tokens.color.border.default, borderWidth: 1, borderRadius: tokens.radius.lg, padding: 12, minHeight: 80, textAlignVertical: 'top' }} multiline />
				<GradientButton title="Save Play Session" onPress={() => { if (!activity.trim()) return; addPlaySession(activity.trim(), notes.trim() || undefined); setActivity(''); setNotes(''); }} />
				<View style={{ height: 16 }} />
				{playSessions.map((p) => (
					<View key={p.id} style={{ borderColor: tokens.color.border.default, borderWidth: 1, borderRadius: tokens.radius.lg, padding: 12, marginBottom: 8 }}>
						<Text style={{ marginBottom: 4 }}>{p.activity}</Text>
						{p.notes ? <Text color="secondary">{p.notes}</Text> : null}
					</View>
				))}
			</ScrollView>
		</>
	);
}