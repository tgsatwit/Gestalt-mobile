import React, { useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '../components/GradientButton';
import { useMemoriesStore } from '../state/useStore';
import { useNavigation } from '@react-navigation/native';
import { BottomNavigation } from '../components/BottomNavigation';

export default function AddMilestoneScreen() {
	const { tokens } = useTheme();
	const navigation = useNavigation();
	const addMilestone = useMemoriesStore((s) => s.addMilestone);
	
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [category, setCategory] = useState<string>('');

	const milestoneCategories = [
		{ name: 'First Words', icon: 'chatbubble', color: '#7C3AED' },
		{ name: 'Communication', icon: 'people', color: '#7C3AED' },
		{ name: 'Social Skills', icon: 'heart', color: '#7C3AED' },
		{ name: 'Stage Progress', icon: 'trophy', color: '#7C3AED' },
		{ name: 'Independence', icon: 'person', color: '#7C3AED' },
		{ name: 'Learning', icon: 'school', color: '#7C3AED' }
	];

	const milestoneExamples = [
		'First spontaneous phrase',
		'Used a gestalt in new context',
		'Asked for help independently',
		'Started combining gestalts',
		'Showed understanding of emotions',
		'Initiated conversation'
	];

	const handleSave = () => {
		if (!title.trim()) return;
		addMilestone(title.trim(), description.trim() || undefined);
		navigation.goBack();
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
							Add Milestone
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
				{/* Celebration Header */}
				<View style={{
					backgroundColor: 'rgba(124, 58, 237, 0.1)',
					borderRadius: tokens.radius.lg,
					padding: tokens.spacing.gap.md,
					marginBottom: tokens.spacing.gap.lg,
					alignItems: 'center'
				}}>
					<Ionicons name="trophy" size={32} color="#7C3AED" />
					<Text style={{ 
						fontSize: tokens.font.size.lg,
						fontWeight: '600',
						marginTop: tokens.spacing.gap.xs
					}}>
						Celebrate Progress!
					</Text>
				</View>

				{/* Milestone Category */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						Milestone Category
					</Text>
					<View style={{ 
						flexDirection: 'row',
						flexWrap: 'wrap',
						marginHorizontal: -tokens.spacing.gap.xs
					}}>
						{milestoneCategories.map((cat) => (
							<TouchableOpacity
								key={cat.name}
								onPress={() => setCategory(cat.name)}
								style={{
									width: '50%',
									padding: tokens.spacing.gap.xs
								}}
							>
								<View style={{
									backgroundColor: category === cat.name ? cat.color + '20' : tokens.color.surface,
									borderColor: category === cat.name ? cat.color : tokens.color.border.default,
									borderWidth: category === cat.name ? 2 : 1,
									borderRadius: tokens.radius.lg,
									padding: tokens.spacing.gap.md,
									alignItems: 'center',
									minHeight: 80
								}}>
									<Ionicons 
										name={cat.icon as any} 
										size={24} 
										color={category === cat.name ? cat.color : tokens.color.text.secondary} 
									/>
									<Text style={{ 
										marginTop: tokens.spacing.gap.xs,
										fontSize: tokens.font.size.sm,
										textAlign: 'center',
										color: category === cat.name ? cat.color : tokens.color.text.primary,
										fontWeight: category === cat.name ? '600' : '400'
									}}>
										{cat.name}
									</Text>
								</View>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Milestone Title */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						What did they achieve?
					</Text>
					<TextInput
						placeholder="e.g., Said first spontaneous phrase"
						value={title}
						onChangeText={setTitle}
						style={{
							borderColor: tokens.color.border.default,
							borderWidth: 1,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.md,
							fontSize: tokens.font.size.body
						}}
					/>
				</View>

				{/* Quick Examples */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						Common Milestones (tap to use)
					</Text>
					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						{milestoneExamples.map((example, index) => (
							<TouchableOpacity
								key={index}
								onPress={() => setTitle(example)}
								style={{
									backgroundColor: tokens.color.surface,
									borderRadius: tokens.radius.pill,
									paddingHorizontal: tokens.spacing.gap.md,
									paddingVertical: tokens.spacing.gap.sm,
									marginRight: tokens.spacing.gap.sm
								}}
							>
								<Text style={{ fontSize: tokens.font.size.sm }}>
									{example}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{/* Description */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						Details (optional)
					</Text>
					<TextInput
						placeholder="Tell us more about this milestone. What happened? How did it make you feel?"
						value={description}
						onChangeText={setDescription}
						style={{
							borderColor: tokens.color.border.default,
							borderWidth: 1,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.md,
							minHeight: 100,
							textAlignVertical: 'top',
							fontSize: tokens.font.size.body
						}}
						multiline
					/>
				</View>

				{/* Date */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						When did this happen?
					</Text>
					<TouchableOpacity style={{
						backgroundColor: tokens.color.surface,
						borderColor: tokens.color.border.default,
						borderWidth: 1,
						borderRadius: tokens.radius.lg,
						padding: tokens.spacing.gap.md,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between'
					}}>
						<View style={{ flexDirection: 'row', alignItems: 'center' }}>
							<Ionicons name="calendar" size={20} color={tokens.color.text.secondary} />
							<Text style={{ marginLeft: tokens.spacing.gap.sm }}>
								{new Date().toLocaleDateString()}
							</Text>
						</View>
						<Text color="secondary" style={{ fontSize: tokens.font.size.sm }}>
							Change
						</Text>
					</TouchableOpacity>
				</View>

				{/* Photo Attachment */}
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
					title="Save Milestone" 
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