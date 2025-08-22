import React, { useState } from 'react';
import { ScrollView, TextInput, View, TouchableOpacity } from 'react-native';
import { Text, useTheme } from '../theme';
import { GradientButton } from '../components/GradientButton';
import { useMemoriesStore } from '../state/useStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '../navigation/SimpleDrawer';
import { useNavigation } from '@react-navigation/native';

export default function PlayScreen() {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const navigation = useNavigation();
	const { addPlaySession, playSessions } = useMemoriesStore();
	const [activity, setActivity] = useState('');
	const [notes, setNotes] = useState('');

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
							Play Analyzer
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
				{/* New Play Session Section */}
				<View style={{ 
					backgroundColor: tokens.color.surface,
					borderRadius: tokens.radius.lg,
					padding: tokens.spacing.gap.lg,
					marginBottom: tokens.spacing.gap.lg,
					marginTop: tokens.spacing.gap.lg
				}}>
					<Text weight="semibold" style={{ 
						fontSize: tokens.font.size.lg,
						marginBottom: tokens.spacing.gap.md 
					}}>
						New Play Session
					</Text>
					<TextInput 
						placeholder="Activity (e.g., Cars, Blocks, Pretend Kitchen)" 
						value={activity} 
						onChangeText={setActivity} 
						style={{ 
							borderColor: tokens.color.border.default, 
							borderWidth: 1, 
							borderRadius: tokens.radius.lg, 
							padding: 12, 
							marginBottom: tokens.spacing.gap.sm,
							fontSize: tokens.font.size.body
						}} 
					/>
					<TextInput 
						placeholder="Notes (optional)" 
						value={notes} 
						onChangeText={setNotes} 
						style={{ 
							borderColor: tokens.color.border.default, 
							borderWidth: 1, 
							borderRadius: tokens.radius.lg, 
							padding: 12, 
							minHeight: 100, 
							textAlignVertical: 'top',
							fontSize: tokens.font.size.body,
							marginBottom: tokens.spacing.gap.md
						}} 
						multiline 
					/>
					<GradientButton 
						title="Save Play Session" 
						onPress={() => { 
							if (!activity.trim()) return; 
							addPlaySession(activity.trim(), notes.trim() || undefined); 
							setActivity(''); 
							setNotes(''); 
						}} 
					/>
				</View>

				{/* Recent Sessions */}
				{playSessions.length > 0 && (
					<View>
						<Text weight="semibold" style={{ 
							fontSize: tokens.font.size.lg,
							marginBottom: tokens.spacing.gap.md 
						}}>
							Recent Sessions
						</Text>
						{playSessions.slice(0, 5).map((session) => (
							<View key={session.id} style={{ 
								borderColor: tokens.color.border.default, 
								borderWidth: 1, 
								borderRadius: tokens.radius.lg, 
								padding: tokens.spacing.gap.md, 
								marginBottom: tokens.spacing.gap.sm 
							}}>
								<Text weight="medium" style={{ marginBottom: 4 }}>
									{session.activity}
								</Text>
								<Text color="secondary" style={{ fontSize: tokens.font.size.sm }}>
									{new Date(session.createdAtISO).toLocaleDateString()}
								</Text>
								{session.notes && (
									<Text color="secondary" style={{ 
										marginTop: tokens.spacing.gap.xs,
										fontSize: tokens.font.size.sm 
									}}>
										{session.notes}
									</Text>
								)}
							</View>
						))}
					</View>
				)}
				</ScrollView>
			</View>
		</LinearGradient>
	);
}