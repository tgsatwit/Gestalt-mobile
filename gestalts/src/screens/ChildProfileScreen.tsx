import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '../navigation/SimpleDrawer';
import { GradientButton } from '../components/GradientButton';
import { useMemoriesStore } from '../state/useStore';
import { useNavigation } from '@react-navigation/native';
import { BottomNavigation } from '../components/BottomNavigation';

export default function ChildProfileScreen() {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const navigation = useNavigation();
	const { profile, updateProfile } = useMemoriesStore();
	
	const [childName, setChildName] = useState(profile?.childName || '');
	const [birthDate, setBirthDate] = useState(profile?.birthDate || '');
	const [currentStage, setCurrentStage] = useState(profile?.currentStage || 1);
	const [interests, setInterests] = useState<string[]>(['Cars', 'Books', 'Music']);
	const [challenges, setChallenges] = useState('');
	const [strengths, setStrengths] = useState('');

	const stages = [
		{ number: 1, title: 'Delayed Echolalia/Scripting', description: 'Using whole phrases from media or routines' },
		{ number: 2, title: 'Mitigation/Trimming', description: 'Starting to modify and combine scripts' },
		{ number: 3, title: 'Isolation of Units', description: 'Breaking down phrases into smaller parts' },
		{ number: 4, title: 'Recombination', description: 'Combining units in new ways' },
		{ number: 5, title: 'Spontaneous Language', description: 'Creating novel, flexible language' },
		{ number: 6, title: 'Advanced Language', description: 'Complex, nuanced communication' }
	];

	const handleSave = () => {
		updateProfile({
			childName,
			birthDate,
			currentStage,
			parentName: profile?.parentName || ''
		});
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
					{/* Left Side: Menu + Title */}
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.gap.md, flex: 1 }}>
						<TouchableOpacity onPress={openDrawer}>
							<Ionicons name="menu" size={24} color="white" />
						</TouchableOpacity>
						<Text style={{ color: 'white', fontSize: tokens.font.size.h3, fontWeight: '600' }}>
							Child Profile
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
				<ScrollView contentContainerStyle={{ padding: tokens.spacing.containerX, paddingBottom: 120 }}>
				{/* Profile Photo */}
				<TouchableOpacity style={{
					alignSelf: 'center',
					marginBottom: tokens.spacing.gap.lg
				}}>
					<View style={{
						width: 100,
						height: 100,
						borderRadius: 50,
						backgroundColor: tokens.color.surface,
						alignItems: 'center',
						justifyContent: 'center',
						borderWidth: 3,
						borderColor: tokens.color.brand.gradient.start
					}}>
						<Ionicons name="camera" size={32} color={tokens.color.text.secondary} />
					</View>
					<Text color="secondary" style={{ 
						textAlign: 'center',
						marginTop: tokens.spacing.gap.xs,
						fontSize: tokens.font.size.sm
					}}>
						Add Photo
					</Text>
				</TouchableOpacity>

				{/* Basic Information */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						Child's Name
					</Text>
					<TextInput
						placeholder="Enter child's name"
						value={childName}
						onChangeText={setChildName}
						style={{
							borderColor: tokens.color.border.default,
							borderWidth: 1,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.md,
							fontSize: tokens.font.size.body,
							marginBottom: tokens.spacing.gap.md
						}}
					/>

					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						Date of Birth
					</Text>
					<TouchableOpacity style={{
						borderColor: tokens.color.border.default,
						borderWidth: 1,
						borderRadius: tokens.radius.lg,
						padding: tokens.spacing.gap.md,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between'
					}}>
						<Text color={birthDate ? 'primary' : 'secondary'}>
							{birthDate || 'Select date of birth'}
						</Text>
						<Ionicons name="calendar-outline" size={20} color={tokens.color.text.secondary} />
					</TouchableOpacity>
				</View>

				{/* Current Gestalt Stage */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						Current Gestalt Stage
					</Text>
					
					{stages.map((stage) => (
						<TouchableOpacity
							key={stage.number}
							onPress={() => setCurrentStage(stage.number)}
							style={{
								backgroundColor: currentStage === stage.number ? tokens.color.brand.gradient.start + '20' : tokens.color.surface,
								borderColor: currentStage === stage.number ? tokens.color.brand.gradient.start : tokens.color.border.default,
								borderWidth: currentStage === stage.number ? 2 : 1,
								borderRadius: tokens.radius.lg,
								padding: tokens.spacing.gap.md,
								marginBottom: tokens.spacing.gap.sm,
								flexDirection: 'row',
								alignItems: 'center'
							}}
						>
							<View style={{
								width: 32,
								height: 32,
								borderRadius: 16,
								backgroundColor: currentStage === stage.number ? tokens.color.brand.gradient.start : tokens.color.surface,
								alignItems: 'center',
								justifyContent: 'center',
								marginRight: tokens.spacing.gap.md
							}}>
								<Text style={{
									color: currentStage === stage.number ? 'white' : tokens.color.text.secondary,
									fontWeight: '600'
								}}>
									{stage.number}
								</Text>
							</View>
							<View style={{ flex: 1 }}>
								<Text weight="medium" style={{
									color: currentStage === stage.number ? tokens.color.brand.gradient.start : tokens.color.text.primary,
									marginBottom: 2
								}}>
									Stage {stage.number}: {stage.title}
								</Text>
								<Text color="secondary" style={{ fontSize: tokens.font.size.sm }}>
									{stage.description}
								</Text>
							</View>
							{currentStage === stage.number && (
								<Ionicons name="checkmark-circle" size={24} color={tokens.color.brand.gradient.start} />
							)}
						</TouchableOpacity>
					))}
				</View>

				{/* Interests */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						Current Interests
					</Text>
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: tokens.spacing.gap.sm }}>
						{interests.map((interest, index) => (
							<View
								key={index}
								style={{
									backgroundColor: tokens.color.brand.gradient.start + '20',
									borderColor: tokens.color.brand.gradient.start,
									borderWidth: 1,
									borderRadius: tokens.radius.full,
									paddingHorizontal: tokens.spacing.gap.md,
									paddingVertical: tokens.spacing.gap.xs,
									marginRight: tokens.spacing.gap.xs,
									marginBottom: tokens.spacing.gap.xs
								}}
							>
								<Text style={{ 
									color: tokens.color.brand.gradient.start,
									fontSize: tokens.font.size.sm
								}}>
									{interest}
								</Text>
							</View>
						))}
					</View>
					<TouchableOpacity style={{
						backgroundColor: tokens.color.surface,
						borderColor: tokens.color.border.default,
						borderWidth: 1,
						borderRadius: tokens.radius.lg,
						padding: tokens.spacing.gap.sm,
						alignItems: 'center'
					}}>
						<Text color="secondary">+ Add Interest</Text>
					</TouchableOpacity>
				</View>

				{/* Strengths */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						Strengths
					</Text>
					<TextInput
						placeholder="What are your child's strengths?"
						value={strengths}
						onChangeText={setStrengths}
						style={{
							borderColor: tokens.color.border.default,
							borderWidth: 1,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.md,
							minHeight: 80,
							textAlignVertical: 'top',
							fontSize: tokens.font.size.body
						}}
						multiline
					/>
				</View>

				{/* Challenges */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						Current Challenges
					</Text>
					<TextInput
						placeholder="What areas need support?"
						value={challenges}
						onChangeText={setChallenges}
						style={{
							borderColor: tokens.color.border.default,
							borderWidth: 1,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.md,
							minHeight: 80,
							textAlignVertical: 'top',
							fontSize: tokens.font.size.body
						}}
						multiline
					/>
				</View>

				{/* Save Button */}
					{/* Save Button */}
					<GradientButton 
						title="Save Profile" 
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