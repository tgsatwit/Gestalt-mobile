import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '../components/GradientButton';
import { DatePickerField } from '../components/DatePickerField';
import { useMemoriesStore } from '../state/useStore';
import { useFirebaseMemoriesStore } from '../state/useFirebaseMemoriesStore';
import { getAuth } from 'firebase/auth';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { MainStackParamList } from '../navigation/types';
import { BottomNavigation } from '../navigation/BottomNavigation';
import { Audio } from 'expo-av';

type AddMilestoneScreenRouteProp = RouteProp<MainStackParamList, 'AddMilestone'>;

export default function AddMilestoneScreen() {
	const { tokens } = useTheme();
	const navigation = useNavigation();
	const route = useRoute<AddMilestoneScreenRouteProp>();
	const { id: editingId } = route.params || {};
	const { currentProfile } = useMemoriesStore((s) => ({ currentProfile: s.currentProfile }));
	const { addMilestone, updateMilestone, milestones } = useFirebaseMemoriesStore();
	
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [category, setCategory] = useState<string>('');
	
	// Date selection state
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	
	// Child selection state - support multiple children
	const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
	const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
	const [showChildrenDropdown, setShowChildrenDropdown] = useState(false);
	
	// Audio recording state
	const [recording, setRecording] = useState<Audio.Recording | null>(null);
	const [recordingUri, setRecordingUri] = useState<string | null>(null);
	const [isRecording, setIsRecording] = useState(false);
	const [recordingDuration, setRecordingDuration] = useState(0);
	const [playbackSound, setPlaybackSound] = useState<Audio.Sound | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	
	// Get available children from all profiles
	const { profiles } = useMemoriesStore((s) => ({ profiles: s.profiles }));
	const availableChildren = profiles.map(profile => ({
		id: profile.id,
		name: profile.childName
	}));
	
	// Find existing milestone if editing
	const existingMilestone = editingId ? milestones.find(m => m.id === editingId) : null;
	const isEditing = !!existingMilestone;

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

	// Audio recording functions
	const startRecording = async () => {
		try {
			// Request permissions
			const permission = await Audio.requestPermissionsAsync();
			if (permission.status !== 'granted') {
				Alert.alert('Permission needed', 'Please grant audio recording permission');
				return;
			}

			// Configure audio mode
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
			});

			// Start recording
			const { recording } = await Audio.Recording.createAsync(
				Audio.RecordingOptionsPresets.HIGH_QUALITY
			);
			setRecording(recording);
			setIsRecording(true);

			// Update duration every second
			recording.setOnRecordingStatusUpdate((status) => {
				if (status.isRecording) {
					setRecordingDuration(Math.floor(status.durationMillis / 1000));
				}
			});
		} catch (error) {
			console.error('Failed to start recording:', error);
			Alert.alert('Error', 'Failed to start recording');
		}
	};

	const stopRecording = async () => {
		if (!recording) return;

		try {
			setIsRecording(false);
			await recording.stopAndUnloadAsync();
			const uri = recording.getURI();
			setRecording(null);
			setRecordingUri(uri);
			setRecordingDuration(0);

			// Configure audio mode for playback
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: false,
				playsInSilentModeIOS: true,
			});
		} catch (error) {
			console.error('Failed to stop recording:', error);
			Alert.alert('Error', 'Failed to stop recording');
		}
	};

	const playRecording = async () => {
		if (!recordingUri) return;

		try {
			if (playbackSound) {
				// Stop current playback
				await playbackSound.stopAsync();
				await playbackSound.unloadAsync();
				setPlaybackSound(null);
				setIsPlaying(false);
				return;
			}

			// Start playback
			const { sound } = await Audio.Sound.createAsync(
				{ uri: recordingUri },
				{ shouldPlay: true }
			);
			setPlaybackSound(sound);
			setIsPlaying(true);

			sound.setOnPlaybackStatusUpdate((status) => {
				if (status.isLoaded && status.didJustFinish) {
					setIsPlaying(false);
					setPlaybackSound(null);
				}
			});
		} catch (error) {
			console.error('Failed to play recording:', error);
			Alert.alert('Error', 'Failed to play recording');
		}
	};

	const deleteRecording = () => {
		setRecordingUri(null);
		setIsPlaying(false);
		if (playbackSound) {
			playbackSound.unloadAsync();
			setPlaybackSound(null);
		}
	};

	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	const handleSave = async () => {
		if (!title.trim()) return;
		
		// Check authentication
		const auth = getAuth();
		const currentUser = auth.currentUser;
		if (!currentUser) {
			Alert.alert('Authentication Required', 'Please sign in to save milestones');
			return;
		}
		
		try {
			// Prepare audio data if recording exists
			let audioData: { uri: string; recordedAt: string } | undefined = undefined;
			if (recordingUri) {
				audioData = {
					uri: recordingUri,
					recordedAt: new Date().toISOString()
				};
			}

			if (isEditing && existingMilestone) {
				// Update existing milestone - for now, use first selected child
				const primaryChildName = selectedChildren.length > 0 ? selectedChildren[0] : undefined;
				const primaryChildId = selectedChildIds.length > 0 ? selectedChildIds[0] : undefined;
				await updateMilestone(existingMilestone.id, {
					title: title.trim(),
					dateISO: selectedDate.toISOString(),
					notes: description.trim() || undefined,
					childName: primaryChildName,
					childProfileId: primaryChildId,
					audioData
				});
			} else {
				// Create new milestone - for now, use first selected child
				const primaryChildName = selectedChildren.length > 0 ? selectedChildren[0] : undefined;
				const primaryChildId = selectedChildIds.length > 0 ? selectedChildIds[0] : undefined;
				await addMilestone(
					title.trim(),
					selectedDate.toISOString(),
					description.trim() || undefined,
					primaryChildName,
					primaryChildId,
					audioData
				);
			}
			navigation.goBack();
		} catch (error) {
			console.error('Failed to save milestone:', error);
			Alert.alert('Error', 'Failed to save milestone. Please try again.');
		}
	};

	// Initialize selected children when component mounts
	React.useEffect(() => {
		if (availableChildren.length > 0 && selectedChildren.length === 0) {
			// Default to first child if only one exists
			if (availableChildren.length === 1) {
				setSelectedChildren([availableChildren[0].name]);
				setSelectedChildIds([availableChildren[0].id]);
			}
		}
	}, [availableChildren.length, selectedChildren.length]);

	// Load existing milestone data when editing
	React.useEffect(() => {
		if (existingMilestone) {
			setTitle(existingMilestone.title);
			setDescription(existingMilestone.notes || '');
			// Set selected children based on existing milestone
			if (existingMilestone.childName) {
				setSelectedChildren([existingMilestone.childName]);
				if (existingMilestone.childProfileId) {
					setSelectedChildIds([existingMilestone.childProfileId]);
				}
			}
			setSelectedDate(new Date(existingMilestone.dateISO));
			// Note: Audio data from existing entries isn't loaded for editing
		}
	}, [existingMilestone]);


	// Child selection helper functions - support multiple selection
	const toggleChildSelection = (childName: string, childId: string) => {
		setSelectedChildren(prev => {
			if (prev.includes(childName)) {
				return prev.filter(name => name !== childName);
			} else {
				return [...prev, childName];
			}
		});
		setSelectedChildIds(prev => {
			if (prev.includes(childId)) {
				return prev.filter(id => id !== childId);
			} else {
				return [...prev, childId];
			}
		});
	};

	const getSelectedChildrenText = () => {
		if (selectedChildren.length === 0) {
			return 'Select Children';
		}
		if (selectedChildren.length === 1) {
			return selectedChildren[0];
		}
		return `${selectedChildren.length} Children Selected`;
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
							{isEditing ? 'Edit Milestone' : 'Add Milestone'}
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
				<ScrollView 
					contentContainerStyle={{ padding: tokens.spacing.containerX, paddingBottom: 150 }}
					onScrollBeginDrag={() => {
						setShowChildrenDropdown(false);
					}}
				>
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

				{/* Child Selection - Always show if children exist */}
				{availableChildren.length > 0 && (
					<View style={{ marginBottom: tokens.spacing.gap.lg, position: 'relative' }}>
						<Text weight="medium" style={{ 
							fontSize: tokens.font.size.sm,
							color: tokens.color.text.secondary,
							marginBottom: tokens.spacing.gap.sm 
						}}>
							Children (multiple selection allowed)
						</Text>
						<TouchableOpacity
							onPress={() => setShowChildrenDropdown(!showChildrenDropdown)}
							activeOpacity={0.7}
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								backgroundColor: tokens.color.bg.muted,
								paddingHorizontal: tokens.spacing.gap.sm,
								paddingVertical: tokens.spacing.gap.sm,
								borderRadius: tokens.radius.lg,
								borderWidth: 1,
								borderColor: tokens.color.border.default
							}}
						>
							<Text style={{
								fontSize: tokens.font.size.sm,
								color: tokens.color.text.secondary,
								marginRight: 4,
								fontWeight: '400',
								flex: 1
							}}>
								{getSelectedChildrenText()}
							</Text>
							<Ionicons 
								name={showChildrenDropdown ? "chevron-up" : "chevron-down"} 
								size={12} 
								color={tokens.color.text.secondary} 
							/>
						</TouchableOpacity>

						{/* Children Dropdown */}
						{showChildrenDropdown && (
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
								zIndex: 9999,
								maxHeight: 150
							}}>
								<ScrollView style={{ maxHeight: 150 }}>
									{availableChildren.map((child, index) => (
										<TouchableOpacity
											key={child.id}
											onPress={() => toggleChildSelection(child.name, child.id)}
											activeOpacity={0.7}
											style={{
												paddingVertical: tokens.spacing.gap.xs,
												paddingHorizontal: tokens.spacing.gap.sm,
												borderBottomWidth: index !== availableChildren.length - 1 ? 0.5 : 0,
												borderBottomColor: 'rgba(0,0,0,0.08)',
												backgroundColor: selectedChildren.includes(child.name) ? tokens.color.bg.muted : 'transparent',
												flexDirection: 'row',
												alignItems: 'center',
												justifyContent: 'space-between'
											}}
										>
											<Text style={{
												fontSize: tokens.font.size.sm,
												color: selectedChildren.includes(child.name) ? tokens.color.brand.gradient.start : tokens.color.text.secondary,
												fontWeight: '400'
											}}>
												{child.name}
											</Text>
											{selectedChildren.includes(child.name) && (
												<Ionicons name="checkmark" size={12} color={tokens.color.brand.gradient.start} />
											)}
										</TouchableOpacity>
									))}
								</ScrollView>
							</View>
						)}
					</View>
				)}

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
									backgroundColor: tokens.color.bg.muted,
									borderColor: tokens.color.border.default,
									borderWidth: 1,
									borderRadius: tokens.radius.pill,
									paddingHorizontal: 12,
									paddingVertical: 8,
									marginRight: tokens.spacing.gap.xs
								}}
							>
								<Text style={{ 
									color: tokens.color.text.secondary,
									fontSize: tokens.font.size.small,
									fontWeight: '500'
								}}>
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
					<DatePickerField
						selectedDate={selectedDate}
						onDateSelect={setSelectedDate}
						label="When did this happen?"
					/>
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

				{/* Audio Recording */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						Record Audio (Optional)
					</Text>
					
					{!recordingUri ? (
						<TouchableOpacity
							onPress={isRecording ? stopRecording : startRecording}
							style={{
								backgroundColor: isRecording ? '#EF4444' + '20' : tokens.color.surface,
								borderRadius: tokens.radius.lg,
								padding: tokens.spacing.gap.lg,
								alignItems: 'center',
								borderWidth: 1,
								borderColor: isRecording ? '#EF4444' : tokens.color.border.default
							}}
						>
							<View style={{
								width: 60,
								height: 60,
								borderRadius: 30,
								backgroundColor: isRecording ? '#EF4444' : tokens.color.brand.gradient.start,
								alignItems: 'center',
								justifyContent: 'center',
								marginBottom: tokens.spacing.gap.sm
							}}>
								<Ionicons 
									name={isRecording ? "stop" : "mic"} 
									size={28} 
									color="white" 
								/>
							</View>
							<Text style={{ 
								color: isRecording ? '#EF4444' : tokens.color.text.primary,
								fontWeight: '600',
								fontSize: tokens.font.size.body
							}}>
								{isRecording ? `Recording... ${formatDuration(recordingDuration)}` : 'Tap to Record'}
							</Text>
							{!isRecording && (
								<Text color="secondary" style={{ 
									fontSize: tokens.font.size.sm,
									textAlign: 'center',
									marginTop: tokens.spacing.gap.xs
								}}>
									Record your child's voice or add notes
								</Text>
							)}
						</TouchableOpacity>
					) : (
						<View style={{
							backgroundColor: tokens.color.surface,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.md,
							borderWidth: 1,
							borderColor: tokens.color.border.default
						}}>
							<View style={{
								flexDirection: 'row',
								alignItems: 'center',
								marginBottom: tokens.spacing.gap.sm
							}}>
								<View style={{
									width: 40,
									height: 40,
									borderRadius: 20,
									backgroundColor: tokens.color.brand.gradient.start + '20',
									alignItems: 'center',
									justifyContent: 'center',
									marginRight: tokens.spacing.gap.sm
								}}>
									<Ionicons name="musical-notes" size={20} color={tokens.color.brand.gradient.start} />
								</View>
								<View style={{ flex: 1 }}>
									<Text weight="semibold">Audio Recording</Text>
									<Text color="secondary" size="sm">Ready to save</Text>
								</View>
								<TouchableOpacity
									onPress={deleteRecording}
									style={{
										padding: tokens.spacing.gap.xs,
										borderRadius: tokens.radius.md
									}}
								>
									<Ionicons name="trash-outline" size={20} color="#EF4444" />
								</TouchableOpacity>
							</View>
							<TouchableOpacity
								onPress={playRecording}
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'center',
									backgroundColor: tokens.color.brand.gradient.start + '10',
									borderRadius: tokens.radius.md,
									padding: tokens.spacing.gap.sm
								}}
							>
								<Ionicons 
									name={isPlaying ? "pause" : "play"} 
									size={16} 
									color={tokens.color.brand.gradient.start} 
								/>
								<Text style={{
									marginLeft: tokens.spacing.gap.xs,
									color: tokens.color.brand.gradient.start,
									fontWeight: '600'
								}}>
									{isPlaying ? 'Pause' : 'Play'}
								</Text>
							</TouchableOpacity>
						</View>
					)}
				</View>

				{/* Save Button */}
				<GradientButton 
					title={isEditing ? "Update Milestone" : "Save Milestone"}
					onPress={handleSave}
				/>
				</ScrollView>
			</View>



			<BottomNavigation />
		</LinearGradient>
	);
}