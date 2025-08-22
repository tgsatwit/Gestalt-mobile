import React, { useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '../components/GradientButton';
import { useMemoriesStore } from '../state/useStore';
import { useNavigation } from '@react-navigation/native';
import { BottomNavigation } from '../components/BottomNavigation';

export default function AddJournalScreen() {
	const { tokens } = useTheme();
	const navigation = useNavigation();
	const addJournal = useMemoriesStore((s) => s.addJournal);
	
	const [entry, setEntry] = useState('');
	const [mood, setMood] = useState<'happy' | 'neutral' | 'sad' | null>(null);
	const [tags, setTags] = useState<string[]>([]);
	const [newTag, setNewTag] = useState('');

	const moods = [
		{ type: 'happy' as const, icon: 'happy', color: '#10B981', label: 'Happy' },
		{ type: 'neutral' as const, icon: 'remove-circle', color: '#F59E0B', label: 'Neutral' },
		{ type: 'sad' as const, icon: 'sad', color: '#EF4444', label: 'Sad' }
	];

	const suggestedTags = [
		'milestone', 'breakthrough', 'challenge', 'progress', 
		'communication', 'play', 'social', 'sensory'
	];

	const handleSave = () => {
		if (!entry.trim()) return;
		addJournal(entry.trim(), mood || undefined);
		navigation.goBack();
	};

	const addTag = (tag: string) => {
		if (!tags.includes(tag)) {
			setTags([...tags, tag]);
		}
	};

	const removeTag = (tag: string) => {
		setTags(tags.filter(t => t !== tag));
	};

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
					{/* Left Side: Back Arrow + Title */}
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.gap.md, flex: 1 }}>
						<TouchableOpacity onPress={() => navigation.goBack()}>
							<Ionicons name="arrow-back" size={24} color="white" />
						</TouchableOpacity>
						<Text style={{ color: 'white', fontSize: tokens.font.size.h3, fontWeight: '600' }}>
							Add Journal Entry
						</Text>
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
				<ScrollView contentContainerStyle={{ padding: tokens.spacing.containerX, paddingBottom: 120 }}>
				{/* Date */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.xs 
					}}>
						Date
					</Text>
					<View style={{
						backgroundColor: tokens.color.surface,
						borderRadius: tokens.radius.lg,
						padding: tokens.spacing.gap.md,
						flexDirection: 'row',
						alignItems: 'center'
					}}>
						<Ionicons name="calendar" size={20} color={tokens.color.text.secondary} />
						<Text style={{ marginLeft: tokens.spacing.gap.sm }}>
							{new Date().toLocaleDateString('en-US', { 
								weekday: 'long', 
								year: 'numeric', 
								month: 'long', 
								day: 'numeric' 
							})}
						</Text>
					</View>
				</View>

				{/* Mood Selection */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						How was today?
					</Text>
					<View style={{ 
						flexDirection: 'row',
						justifyContent: 'space-around'
					}}>
						{moods.map((m) => (
							<TouchableOpacity
								key={m.type}
								onPress={() => setMood(m.type)}
								style={{
									alignItems: 'center',
									padding: tokens.spacing.gap.md,
									borderRadius: tokens.radius.lg,
									backgroundColor: mood === m.type ? m.color + '20' : tokens.color.surface,
									borderWidth: mood === m.type ? 2 : 1,
									borderColor: mood === m.type ? m.color : tokens.color.border.default,
									flex: 1,
									marginHorizontal: tokens.spacing.gap.xs
								}}
							>
								<Ionicons 
									name={m.icon as any} 
									size={32} 
									color={mood === m.type ? m.color : tokens.color.text.secondary} 
								/>
								<Text style={{ 
									marginTop: tokens.spacing.gap.xs,
									color: mood === m.type ? m.color : tokens.color.text.secondary,
									fontWeight: mood === m.type ? '600' : '400'
								}}>
									{m.label}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Journal Entry */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						Today's Observations
					</Text>
					<TextInput
						placeholder="What happened today? Any progress, challenges, or special moments?"
						value={entry}
						onChangeText={setEntry}
						style={{
							borderColor: tokens.color.border.default,
							borderWidth: 1,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.md,
							minHeight: 150,
							textAlignVertical: 'top',
							fontSize: tokens.font.size.body
						}}
						multiline
					/>
					<Text style={{ 
						fontSize: tokens.font.size.xs,
						color: tokens.color.text.tertiary,
						marginTop: tokens.spacing.gap.xs,
						textAlign: 'right'
					}}>
						{entry.length} characters
					</Text>
				</View>

				{/* Tags */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						Tags
					</Text>
					
					{/* Selected Tags */}
					{tags.length > 0 && (
						<View style={{ 
							flexDirection: 'row',
							flexWrap: 'wrap',
							marginBottom: tokens.spacing.gap.sm
						}}>
							{tags.map((tag) => (
								<TouchableOpacity
									key={tag}
									onPress={() => removeTag(tag)}
									style={{
										backgroundColor: tokens.color.brand.gradient.start + '20',
										borderColor: tokens.color.brand.gradient.start,
										borderWidth: 1,
										borderRadius: tokens.radius.full,
										paddingHorizontal: tokens.spacing.gap.md,
										paddingVertical: tokens.spacing.gap.xs,
										marginRight: tokens.spacing.gap.xs,
										marginBottom: tokens.spacing.gap.xs,
										flexDirection: 'row',
										alignItems: 'center'
									}}
								>
									<Text style={{ 
										color: tokens.color.brand.gradient.start,
										fontSize: tokens.font.size.sm,
										fontWeight: '500'
									}}>
										{tag}
									</Text>
									<Ionicons 
										name="close-circle" 
										size={16} 
										color={tokens.color.brand.gradient.start}
										style={{ marginLeft: 4 }}
									/>
								</TouchableOpacity>
							))}
						</View>
					)}

					{/* Suggested Tags */}
					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						{suggestedTags.filter(t => !tags.includes(t)).map((tag) => (
							<TouchableOpacity
								key={tag}
								onPress={() => addTag(tag)}
								style={{
									backgroundColor: tokens.color.surface,
									borderRadius: tokens.radius.full,
									paddingHorizontal: tokens.spacing.gap.md,
									paddingVertical: tokens.spacing.gap.xs,
									marginRight: tokens.spacing.gap.xs
								}}
							>
								<Text style={{ 
									color: tokens.color.text.secondary,
									fontSize: tokens.font.size.sm
								}}>
									+ {tag}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{/* Attachments */}
				<TouchableOpacity style={{
					backgroundColor: tokens.color.surface,
					borderRadius: tokens.radius.lg,
					padding: tokens.spacing.gap.lg,
					alignItems: 'center',
					marginBottom: tokens.spacing.gap.lg,
					borderWidth: 1,
					borderColor: tokens.color.border.default,
					borderStyle: 'dashed'
				}}>
					<Ionicons name="camera-outline" size={32} color={tokens.color.text.secondary} />
					<Text color="secondary" style={{ 
						marginTop: tokens.spacing.gap.sm,
						fontSize: tokens.font.size.sm 
					}}>
						Add photos or videos
					</Text>
				</TouchableOpacity>

				{/* Save Button */}
				<GradientButton 
					title="Save Entry" 
					onPress={handleSave}
				/>
				</ScrollView>
			</View>

			{/* Center Microphone Button */}
			<TouchableOpacity style={{ 
				position: 'absolute',
				bottom: 42,
				left: '50%',
				marginLeft: -32,
				zIndex: 1000
			}}>
				<View style={{
					width: 64,
					height: 64,
					borderRadius: 32,
					overflow: 'hidden',
					shadowColor: tokens.color.brand.gradient.start,
					shadowOffset: { width: 0, height: 8 },
					shadowOpacity: 0.5,
					shadowRadius: 16,
					elevation: 12
				}}>
					<LinearGradient
						colors={['#4C1D95', '#5B21B6', '#6D28D9', '#7C3AED']}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={{
							width: '100%',
							height: '100%',
							alignItems: 'center',
							justifyContent: 'center'
						}}
					>
						{/* Glass overlay for mic button */}
						<View style={{
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							height: '50%',
							backgroundColor: 'rgba(255,255,255,0.2)',
							borderRadius: 28
						}} />
						
						<Ionicons name="mic" size={28} color="white" style={{ zIndex: 1 }} />
					</LinearGradient>
				</View>
			</TouchableOpacity>

			<BottomNavigation />
		</LinearGradient>
	);
}