import React from 'react';
import { ScrollView, View, TouchableOpacity } from 'react-native';
import { Text, useTheme } from '../theme';
import { GradientButton } from '../components/GradientButton';
import { useMemoriesStore } from '../state/useStore';
import { generateReport } from '../utils/report';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '../navigation/SimpleDrawer';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export default function ReportScreen() {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const navigation = useNavigation<NavigationProp>();
	const { profile, journal, milestones, appointmentNotes } = useMemoriesStore();
	const report = generateReport({ profile, journal, milestones, appointmentNotes });
	
	return (
		<LinearGradient
			colors={['#7C3AED', '#EC4899', '#FB923C']}
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
			style={{ flex: 1 }}
		>
			{/* Header */}
			<View style={{
				paddingTop: 60,
				paddingHorizontal: tokens.spacing.containerX,
				paddingBottom: tokens.spacing.gap.lg
			}}>
				<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
					{/* Left Side: Menu + Title */}
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.gap.md, flex: 1 }}>
						<TouchableOpacity onPress={openDrawer}>
							<Ionicons name="menu" size={24} color="white" />
						</TouchableOpacity>
						<Text style={{ color: 'white', fontSize: tokens.font.size.h3, fontWeight: '600' }}>
							Report
						</Text>
					</View>
					
					{/* Right Side Controls */}
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.gap.sm }}>
						{/* Settings Button */}
						<TouchableOpacity
							activeOpacity={0.7}
							style={{
								padding: 6
							}}
						>
							<Ionicons name="ellipsis-horizontal" size={18} color="white" />
						</TouchableOpacity>

						{/* Close Button */}
						<TouchableOpacity
							onPress={() => navigation.navigate('Dashboard')}
							activeOpacity={0.7}
							style={{
								padding: 6
							}}
						>
							<Ionicons name="close" size={18} color="white" />
						</TouchableOpacity>
					</View>
				</View>
			</View>

			{/* Content Container with curved top */}
			<View style={{ 
				flex: 1, 
				backgroundColor: 'white', 
				borderTopLeftRadius: 24, 
				borderTopRightRadius: 24
			}}>
				<ScrollView contentContainerStyle={{ padding: tokens.spacing.containerX, paddingBottom: 40 }}>
					<View style={{ 
						backgroundColor: tokens.color.surface,
						borderRadius: tokens.radius.lg,
						padding: tokens.spacing.gap.lg,
						marginBottom: tokens.spacing.gap.lg,
						marginTop: tokens.spacing.gap.lg
					}}>
						<Text weight="semibold" style={{ 
							fontSize: tokens.font.size.lg,
							marginBottom: tokens.spacing.gap.sm 
						}}>
							Progress Report
						</Text>
						<Text color="secondary" style={{ marginBottom: tokens.spacing.gap.md }}>
							A one-click summary to share with specialists or schools.
						</Text>
						
						<View style={{ 
							borderColor: tokens.color.border.default, 
							borderWidth: 1, 
							borderRadius: tokens.radius.lg, 
							padding: tokens.spacing.gap.md, 
							marginBottom: tokens.spacing.gap.md,
							backgroundColor: 'white'
						}}>
							{report.split('\n').map((line, idx) => (
								<Text key={idx} style={{ marginBottom: 2 }}>{line}</Text>
							))}
						</View>
						
						<GradientButton 
							title="Copy to Clipboard" 
							onPress={() => Clipboard.setStringAsync(report)} 
						/>
					</View>
				</ScrollView>
			</View>
		</LinearGradient>
	);
}