import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '../navigation/SimpleDrawer';
import { GradientButton } from '../components/GradientButton';
import { useMemoriesStore } from '../state/useStore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BottomNavigation } from '../components/BottomNavigation';
import { useAuth } from '../contexts/AuthContext';
import { ChildProfile as FirebaseChildProfile } from '../types/profile';
import childProfileService from '../services/childProfileService';

export default function ChildProfileScreen() {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const navigation = useNavigation();
	const route = useRoute();
	const { getCurrentUserId, user } = useAuth();
	
	// Get profileId from route params if editing existing profile
	const profileId = route.params?.profileId;
	const { 
		currentProfile, 
		profileLoading, 
		profileError,
		createProfile, 
		updateProfile: updateFirebaseProfile,
		clearProfileError
	} = useMemoriesStore();
	
	const [childName, setChildName] = useState('');
	const [parentName, setParentName] = useState('');
	const [birthDate, setBirthDate] = useState('');
	const [selectedBirthDate, setSelectedBirthDate] = useState<Date | null>(null);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
	const [knowsStage, setKnowsStage] = useState(false);
	const [currentStage, setCurrentStage] = useState(1);
	const [interests, setInterests] = useState<string[]>(['Cars', 'Books', 'Music']);
	const [challenges, setChallenges] = useState('');
	const [strengths, setStrengths] = useState('');
	const [isEditing, setIsEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [loadingProfile, setLoadingProfile] = useState(false);
	const [profileData, setProfileData] = useState<FirebaseChildProfile | null>(null);

	// Load specific profile if profileId is provided
	useEffect(() => {
		if (profileId) {
			loadProfileData();
		}
	}, [profileId]);

	const loadProfileData = async () => {
		if (!profileId) return;
		
		setLoadingProfile(true);
		try {
			const profile = await childProfileService.getProfile(profileId);
			if (profile) {
				setProfileData(profile);
				populateFormFromProfile(profile);
			}
		} catch (error) {
			console.error('Failed to load profile:', error);
			Alert.alert('Error', 'Failed to load profile data');
		} finally {
			setLoadingProfile(false);
		}
	};

	const populateFormFromProfile = (profile: FirebaseChildProfile) => {
		setChildName(profile.childName || '');
		setParentName(profile.parentName || '');
		if (profile.birthDate) {
			try {
				const parsedDate = new Date(profile.birthDate);
				if (!isNaN(parsedDate.getTime())) {
					setSelectedBirthDate(parsedDate);
					setCurrentCalendarMonth(parsedDate);
				}
			} catch (error) {
				console.log('Error parsing birth date:', error);
			}
		}
		setCurrentStage(profile.currentStage || 1);
		setKnowsStage(profile.currentStage ? true : false);
		setInterests(profile.interests || ['Cars', 'Books', 'Music']);
		setChallenges(profile.challenges || '');
		setStrengths(profile.strengths || '');
		setIsEditing(true);
	};

	// Load current profile data when component mounts or profile changes (for backward compatibility)
	useEffect(() => {
		if (currentProfile) {
			setChildName(currentProfile.childName || '');
			setParentName(currentProfile.parentName || '');
			setBirthDate(currentProfile.birthDate || '');
			// Parse birth date if available
			if (currentProfile.birthDate) {
				try {
					const parsedDate = new Date(currentProfile.birthDate);
					if (!isNaN(parsedDate.getTime())) {
						setSelectedBirthDate(parsedDate);
						setCurrentCalendarMonth(parsedDate);
					}
				} catch (error) {
					console.log('Error parsing birth date:', error);
				}
			}
			setCurrentStage(currentProfile.currentStage || 1);
			setKnowsStage(currentProfile.currentStage ? true : false);
			setInterests(currentProfile.interests || ['Cars', 'Books', 'Music']);
			setChallenges(currentProfile.challenges || '');
			setStrengths(currentProfile.strengths || '');
			setIsEditing(true);
		} else {
			// Reset form for new profile
			setChildName('');
			setParentName('');
			setBirthDate('');
			setSelectedBirthDate(null);
			setCurrentCalendarMonth(new Date());
			setKnowsStage(false);
			setCurrentStage(1);
			setInterests(['Cars', 'Books', 'Music']);
			setChallenges('');
			setStrengths('');
			setIsEditing(false);
		}
	}, [currentProfile]);

	// Clear errors when component mounts
	useEffect(() => {
		clearProfileError();
	}, [clearProfileError]);

	// Auto-populate parent name from current user
	useEffect(() => {
		if (user?.name && !parentName) {
			setParentName(user.name);
		}
	}, [user?.name, parentName]);

	const stages = [
		{ number: 1, title: 'Delayed Echolalia/Scripting', description: 'Using whole phrases from media or routines' },
		{ number: 2, title: 'Mitigation/Trimming', description: 'Starting to modify and combine scripts' },
		{ number: 3, title: 'Isolation of Units', description: 'Breaking down phrases into smaller parts' },
		{ number: 4, title: 'Recombination', description: 'Combining units in new ways' },
		{ number: 5, title: 'Spontaneous Language', description: 'Creating novel, flexible language' },
		{ number: 6, title: 'Advanced Language', description: 'Complex, nuanced communication' }
	];

	const handleSave = async () => {
		const userId = getCurrentUserId();
		if (!userId) {
			Alert.alert('Error', 'User not authenticated');
			return;
		}

		if (!childName.trim()) {
			Alert.alert('Validation Error', 'Please enter the child\'s name');
			return;
		}

		setSaving(true);
		try {
			const saveData = {
				childName: childName.trim(),
				parentName: parentName.trim() || undefined,
				birthDate: selectedBirthDate ? selectedBirthDate.toISOString().split('T')[0] : undefined,
				currentStage: knowsStage ? currentStage : undefined,
				interests: interests.length > 0 ? interests : undefined,
				challenges: challenges.trim() || undefined,
				strengths: strengths.trim() || undefined
			};

			if (profileId && profileData) {
				// Update existing profile (direct Firebase service call)
				await childProfileService.updateProfile(profileId, userId, saveData);
				Alert.alert('Success', 'Profile updated successfully!');
			} else if (isEditing && currentProfile) {
				// Update existing profile (through store for backward compatibility)
				await updateFirebaseProfile(currentProfile.id, userId, saveData);
				Alert.alert('Success', 'Profile updated successfully!');
			} else {
				// Create new profile
				if (createProfile) {
					await createProfile(userId, saveData);
				} else {
					// Direct Firebase service call if store method not available
					await childProfileService.createProfile(userId, saveData);
				}
				Alert.alert('Success', 'Profile created successfully!');
			}
			
			// Navigate back to child profiles list if we came from there, otherwise to dashboard
			if (profileId) {
				navigation.navigate('ChildProfilesList');
			} else {
				navigation.navigate('Dashboard');
			}
		} catch (error) {
			console.error('Save profile error:', error);
			Alert.alert('Error', 'Failed to save profile. Please try again.');
		} finally {
			setSaving(false);
		}
	};

	const addInterest = () => {
		// Simple add interest functionality - can be enhanced with a modal
		Alert.prompt(
			'Add Interest',
			'Enter a new interest:',
			(text) => {
				if (text && text.trim() && !interests.includes(text.trim())) {
					setInterests([...interests, text.trim()]);
				}
			}
		);
	};

	const removeInterest = (index: number) => {
		setInterests(interests.filter((_, i) => i !== index));
	};

	// Calendar helper functions
	const getDaysInMonth = (date: Date) => {
		return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	};

	const getFirstDayOfMonth = (date: Date) => {
		return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
	};

	const generateCalendarDays = () => {
		const daysInMonth = getDaysInMonth(currentCalendarMonth);
		const firstDay = getFirstDayOfMonth(currentCalendarMonth);
		const days = [];

		// Add empty cells for days before the first day of the month
		for (let i = 0; i < firstDay; i++) {
			days.push(null);
		}

		// Add all days of the month
		for (let day = 1; day <= daysInMonth; day++) {
			days.push(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), day));
		}

		return days;
	};

	const navigateMonth = (direction: 'prev' | 'next') => {
		const newMonth = new Date(currentCalendarMonth);
		if (direction === 'prev') {
			newMonth.setMonth(newMonth.getMonth() - 1);
		} else {
			newMonth.setMonth(newMonth.getMonth() + 1);
		}
		setCurrentCalendarMonth(newMonth);
	};

	const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
							{profileId || isEditing ? 'Edit Profile' : 'Create Profile'}
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
				<ScrollView 
					contentContainerStyle={{ padding: tokens.spacing.containerX, paddingBottom: 120 }}
					onScrollBeginDrag={() => setShowDatePicker(false)}
				>

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


					{/* Date of Birth */}
					<View style={{ marginBottom: tokens.spacing.gap.lg, position: 'relative' }}>
						<Text weight="medium" style={{ 
							fontSize: tokens.font.size.sm,
							color: tokens.color.text.secondary,
							marginBottom: tokens.spacing.gap.sm 
						}}>
							Date of Birth (Optional)
						</Text>
						<TouchableOpacity
							onPress={() => setShowDatePicker(!showDatePicker)}
							style={{
								backgroundColor: tokens.color.surface,
								borderRadius: tokens.radius.lg,
								padding: tokens.spacing.gap.md,
								flexDirection: 'row',
								alignItems: 'center',
								borderWidth: 1,
								borderColor: showDatePicker ? tokens.color.brand.gradient.start + '30' : tokens.color.border.default
							}}
						>
							<Ionicons name="calendar" size={20} color={tokens.color.text.secondary} />
							<Text style={{ marginLeft: tokens.spacing.gap.sm, flex: 1, color: selectedBirthDate ? tokens.color.text.primary : tokens.color.text.secondary }}>
								{selectedBirthDate ? selectedBirthDate.toLocaleDateString('en-US', { 
									weekday: 'long', 
									year: 'numeric', 
									month: 'long', 
									day: 'numeric' 
								}) : 'Select date of birth'}
							</Text>
							<Ionicons 
								name={showDatePicker ? "chevron-up" : "chevron-down"} 
								size={16} 
								color={tokens.color.text.secondary} 
							/>
						</TouchableOpacity>

						{/* Calendar Picker Dropdown */}
						{showDatePicker && (
							<View style={{
								position: 'absolute',
								top: '100%',
								left: 0,
								right: 0,
								marginTop: 4,
								backgroundColor: 'white',
								borderRadius: tokens.radius.lg,
								shadowColor: '#000',
								shadowOffset: { width: 0, height: 2 },
								shadowOpacity: 0.08,
								shadowRadius: 12,
								elevation: 6,
								zIndex: 1000,
								padding: tokens.spacing.gap.md
							}}>
								{/* Calendar Header */}
								<View style={{
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between',
									marginBottom: tokens.spacing.gap.md
								}}>
									<TouchableOpacity
										onPress={() => navigateMonth('prev')}
										style={{
											padding: tokens.spacing.gap.xs,
											borderRadius: tokens.radius.lg / 2
										}}
									>
										<Ionicons name="chevron-back" size={20} color={tokens.color.text.primary} />
									</TouchableOpacity>
									
									<Text style={{
										fontSize: tokens.font.size.body,
										fontWeight: '600',
										color: tokens.color.text.primary
									}}>
										{currentCalendarMonth.toLocaleDateString('en-US', { 
											month: 'long', 
											year: 'numeric' 
										})}
									</Text>
									
									<TouchableOpacity
										onPress={() => navigateMonth('next')}
										style={{
											padding: tokens.spacing.gap.xs,
											borderRadius: tokens.radius.lg / 2
										}}
									>
										<Ionicons name="chevron-forward" size={20} color={tokens.color.text.primary} />
									</TouchableOpacity>
								</View>

								{/* Day Names Header */}
								<View style={{
									flexDirection: 'row',
									marginBottom: tokens.spacing.gap.xs
								}}>
									{dayNames.map((dayName) => (
										<View key={dayName} style={{ flex: 1, alignItems: 'center' }}>
											<Text style={{
												fontSize: tokens.font.size.xs,
												fontWeight: '600',
												color: tokens.color.text.secondary
											}}>
												{dayName}
											</Text>
										</View>
									))}
								</View>

								{/* Calendar Grid */}
								<View style={{
									flexDirection: 'row',
									flexWrap: 'wrap'
								}}>
									{generateCalendarDays().map((date, index) => {
										if (!date) {
											// Empty cell for days before the first day of the month
											return <View key={`empty-${index}`} style={{ width: '14.28%', height: 40 }} />;
										}

										const isSelected = selectedBirthDate && date.toDateString() === selectedBirthDate.toDateString();
										const isToday = date.toDateString() === new Date().toDateString();
										const isPastMonth = date.getMonth() !== currentCalendarMonth.getMonth();

										return (
											<TouchableOpacity
												key={date.toISOString()}
												onPress={() => {
													setSelectedBirthDate(date);
													setShowDatePicker(false);
												}}
												style={{
													width: '14.28%',
													height: 40,
													alignItems: 'center',
													justifyContent: 'center',
													borderRadius: tokens.radius.lg / 2,
													backgroundColor: isSelected ? tokens.color.brand.gradient.start : 'transparent',
													marginBottom: 2
												}}
											>
												<Text style={{
													fontSize: tokens.font.size.sm,
													fontWeight: isSelected ? '600' : '400',
													color: isSelected ? 'white' : 
														   isToday ? tokens.color.brand.gradient.start :
														   isPastMonth ? tokens.color.text.secondary + '60' :
														   tokens.color.text.primary
												}}>
													{date.getDate()}
												</Text>
												{isToday && !isSelected && (
													<View style={{
														position: 'absolute',
														bottom: 4,
														width: 4,
														height: 4,
														borderRadius: 2,
														backgroundColor: tokens.color.brand.gradient.start
													}} />
												)}
											</TouchableOpacity>
										);
									})}
								</View>
							</View>
						)}
					</View>
				</View>

				{/* Gestalt Stage Selection */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						Gestalt Language Processing Stage
					</Text>

					{/* Question: Do you know the stage? */}
					<View style={{ 
						flexDirection: 'row', 
						marginBottom: tokens.spacing.gap.md,
						backgroundColor: tokens.color.bg.muted,
						borderRadius: tokens.radius.lg,
						borderWidth: 1,
						borderColor: tokens.color.border.default,
						padding: 4
					}}>
						{/* Yes Tab */}
						<TouchableOpacity
							onPress={() => setKnowsStage(true)}
							style={{
								flex: 1,
								paddingVertical: tokens.spacing.gap.sm,
								paddingHorizontal: tokens.spacing.gap.sm,
								borderRadius: tokens.radius.lg - 4,
								backgroundColor: knowsStage ? 'white' : 'transparent',
								alignItems: 'center'
							}}
						>
							<Text style={{
								fontSize: tokens.font.size.sm,
								fontWeight: '400',
								color: knowsStage ? tokens.color.text.primary : tokens.color.text.secondary
							}}>
								Yes, I know the stage
							</Text>
						</TouchableOpacity>
						
						{/* No Tab */}
						<TouchableOpacity
							onPress={() => setKnowsStage(false)}
							style={{
								flex: 1,
								paddingVertical: tokens.spacing.gap.sm,
								paddingHorizontal: tokens.spacing.gap.sm,
								borderRadius: tokens.radius.lg - 4,
								backgroundColor: !knowsStage ? 'white' : 'transparent',
								alignItems: 'center'
							}}
						>
							<Text style={{
								fontSize: tokens.font.size.sm,
								fontWeight: '400',
								color: !knowsStage ? tokens.color.text.primary : tokens.color.text.secondary
							}}>
								Not sure yet
							</Text>
						</TouchableOpacity>
					</View>

					{/* Stage Selection - Only show if user knows the stage */}
					{knowsStage && (
						<ScrollView 
							horizontal 
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{ paddingHorizontal: 4 }}
						>
							{stages.map((stage) => (
								<TouchableOpacity
									key={stage.number}
									onPress={() => setCurrentStage(stage.number)}
									style={{
										width: 200,
										marginRight: tokens.spacing.gap.sm,
										backgroundColor: currentStage === stage.number ? tokens.color.brand.gradient.start + '20' : tokens.color.surface,
										borderColor: currentStage === stage.number ? tokens.color.brand.gradient.start : tokens.color.border.default,
										borderWidth: currentStage === stage.number ? 2 : 1,
										borderRadius: tokens.radius.lg,
										padding: tokens.spacing.gap.md,
										minHeight: 120
									}}
								>
									<View style={{
										flexDirection: 'row',
										alignItems: 'center',
										marginBottom: tokens.spacing.gap.sm
									}}>
										<View style={{
											width: 32,
											height: 32,
											borderRadius: 16,
											backgroundColor: currentStage === stage.number ? tokens.color.brand.gradient.start : tokens.color.surface,
											alignItems: 'center',
											justifyContent: 'center',
											marginRight: tokens.spacing.gap.sm
										}}>
											<Text style={{
												color: currentStage === stage.number ? 'white' : tokens.color.text.secondary,
												fontWeight: '600',
												fontSize: tokens.font.size.sm
											}}>
												{stage.number}
											</Text>
										</View>
										{currentStage === stage.number && (
											<View style={{ marginLeft: 'auto' }}>
												<Ionicons name="checkmark-circle" size={20} color={tokens.color.brand.gradient.start} />
											</View>
										)}
									</View>
									<Text weight="medium" style={{
										color: currentStage === stage.number ? tokens.color.brand.gradient.start : tokens.color.text.primary,
										marginBottom: tokens.spacing.gap.xs,
										fontSize: tokens.font.size.sm
									}}>
										{stage.title}
									</Text>
									<Text color="secondary" style={{ 
										fontSize: tokens.font.size.xs,
										lineHeight: 16
									}}>
										{stage.description}
									</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					)}
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
							<TouchableOpacity
								key={index}
								onPress={() => removeInterest(index)}
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
									marginRight: tokens.spacing.gap.xs
								}}>
									{interest}
								</Text>
								<Ionicons name="close" size={14} color={tokens.color.brand.gradient.start} />
							</TouchableOpacity>
						))}
					</View>
					<TouchableOpacity 
						onPress={addInterest}
						style={{
							backgroundColor: tokens.color.surface,
							borderColor: tokens.color.border.default,
							borderWidth: 1,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.sm,
							alignItems: 'center'
						}}
					>
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

				{/* Error Display */}
				{profileError && (
					<View style={{
						backgroundColor: '#FEE2E2',
						borderColor: '#EF4444',
						borderWidth: 1,
						borderRadius: tokens.radius.lg,
						padding: tokens.spacing.gap.md,
						marginBottom: tokens.spacing.gap.md
					}}>
						<Text style={{ color: '#EF4444', textAlign: 'center' }}>
							{profileError}
						</Text>
					</View>
				)}

				{/* Save Button */}
				<GradientButton 
					title={saving ? 'Saving...' : (isEditing ? 'Update Profile' : 'Create Profile')}
					onPress={handleSave}
					disabled={saving || profileLoading || loadingProfile}
				/>

				{/* Loading Overlay */}
				{(profileLoading || saving || loadingProfile) && (
					<View style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(255,255,255,0.8)',
						justifyContent: 'center',
						alignItems: 'center',
						zIndex: 1000
					}}>
						<ActivityIndicator size="large" color={tokens.color.brand.gradient.start} />
						<Text style={{ marginTop: tokens.spacing.gap.sm, color: tokens.color.text.secondary }}>
							{saving ? 'Saving Profile...' : loadingProfile ? 'Loading Profile...' : 'Loading...'}
						</Text>
					</View>
				)}
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