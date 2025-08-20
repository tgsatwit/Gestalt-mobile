import React from 'react';
import { ScrollView, View } from 'react-native';
import { Text, useTheme } from '../theme';
import { GradientButton } from '../components/GradientButton';
import { useMemoriesStore } from '../state/useStore';
import { generateReport } from '../utils/report';
import * as Clipboard from 'expo-clipboard';
import AppHeader from '../components/AppHeader';

export default function ReportScreen() {
	const { tokens } = useTheme();
	const { profile, journal, milestones, appointmentNotes } = useMemoriesStore();
	const report = generateReport({ profile, journal, milestones, appointmentNotes });
	return (
		<>
			<AppHeader title="Report" showMenu={true} />
			<ScrollView contentContainerStyle={{ padding: tokens.spacing.containerX, paddingBottom: 40 }} style={{ backgroundColor: 'white' }}>
				<Text weight="semibold" style={{ fontSize: tokens.font.size.h2, marginBottom: tokens.spacing.gap.md }}>Report</Text>
				<Text color="secondary" style={{ marginBottom: 12 }}>A one-click summary to share with specialists or schools.</Text>
				<View style={{ borderColor: tokens.color.border.default, borderWidth: 1, borderRadius: tokens.radius.lg, padding: 12, marginBottom: 12 }}>
					{report.split('\n').map((line, idx) => (
						<Text key={idx} style={{ marginBottom: 2 }}>{line}</Text>
					))}
				</View>
				<GradientButton title="Copy to Clipboard" onPress={() => Clipboard.setStringAsync(report)} />
			</ScrollView>
		</>
	);
}