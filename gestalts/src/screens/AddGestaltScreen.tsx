import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
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

type AddGestaltScreenRouteProp = RouteProp<MainStackParamList, 'AddGestalt'>;

export default function AddGestaltScreen() {
	const { tokens } = useTheme();
	const navigation = useNavigation();
	const route = useRoute<AddGestaltScreenRouteProp>();
	const { id: editingId } = route.params || {};
	const { profiles } = useMemoriesStore((s) => ({ profiles: s.profiles }));
	
	// Get available children from all profiles
	const availableChildren = profiles.map(profile => profile.childName);
	const { addGestalt, updateGestalt, gestalts } = useFirebaseMemoriesStore();
	
	const [phrase, setPhrase] = useState('');
	const [source, setSource] = useState('');
	const [sourceType, setSourceType] = useState<string>('');
	const [contexts, setContexts] = useState<string[]>([]);
	const [newContext, setNewContext] = useState('');
	const [isRandom, setIsRandom] = useState(false);
	
	// Date selection state
	const [dateStarted, setDateStarted] = useState<Date>(new Date());
	
	// Child selection state
	const [selectedChild, setSelectedChild] = useState<string>('');
	const [showChildrenDropdown, setShowChildrenDropdown] = useState(false);
	
	// Audio recording state
	const [recording, setRecording] = useState<Audio.Recording | null>(null);
	const [recordingUri, setRecordingUri] = useState<string | null>(null);
	const [isRecording, setIsRecording] = useState(false);
	const [recordingDuration, setRecordingDuration] = useState(0);
	const [playbackSound, setPlaybackSound] = useState<Audio.Sound | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	
	// Search state
	const [isSearching, setIsSearching] = useState(false);
	const [searchResults, setSearchResults] = useState<Array<{source: string, confidence: 'low' | 'medium' | 'high', reason?: string}> | null>(null);
	const [searchResultsExpanded, setSearchResultsExpanded] = useState(true);
	
	// Find existing gestalt if editing
	const existingGestalt = editingId ? gestalts.find(g => g.id === editingId) : null;
	const isEditing = !!existingGestalt;

	// Initialize selected child when component mounts
	React.useEffect(() => {
		if (availableChildren.length === 1 && selectedChild === '' && !isEditing) {
			setSelectedChild(availableChildren[0]);
		}
	}, [availableChildren.length, selectedChild, isEditing]);

	// Load existing gestalt data when editing
	React.useEffect(() => {
		if (existingGestalt) {
			setPhrase(existingGestalt.phrase);
			setSource(existingGestalt.source);
			setSourceType(existingGestalt.sourceType || '');
			setSelectedChild(existingGestalt.childName || '');
			setDateStarted(new Date(existingGestalt.dateStartedISO || new Date()));
		}
	}, [existingGestalt]);

	const sourceTypes = [
		{ name: 'TV/Movie', icon: 'tv', color: '#EC4899' },
		{ name: 'Book', icon: 'book', color: '#10B981' },
		{ name: 'Song', icon: 'musical-notes', color: '#F59E0B' },
		{ name: 'Game', icon: 'game-controller', color: '#EF4444' },
		{ name: 'Parent', icon: 'people', color: '#3B82F6' },
		{ name: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' }
	];


	const commonContexts = [
		'Playing', 'Requesting', 'Commenting', 'Protesting',
		'Self-soothing', 'Excitement', 'Routine', 'Social interaction'
	];

	// Initialize selected child when component mounts
	useEffect(() => {
		if (availableChildren.length > 0 && !selectedChild) {
			setSelectedChild(availableChildren[0]);
		}
	}, [availableChildren.length, selectedChild]);

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
			} else {
				// Start playback
				const { sound } = await Audio.Sound.createAsync(
					{ uri: recordingUri },
					{ shouldPlay: true }
				);
				setPlaybackSound(sound);
				setIsPlaying(true);

				// Listen for playback finish
				sound.setOnPlaybackStatusUpdate((status: any) => {
					if (status.didJustFinish) {
						setIsPlaying(false);
						setPlaybackSound(null);
					}
				});
			}
		} catch (error) {
			console.error('Failed to play recording:', error);
			Alert.alert('Error', 'Failed to play recording');
		}
	};

	const deleteRecording = () => {
		Alert.alert(
			'Delete Recording',
			'Are you sure you want to delete this recording?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						if (playbackSound) {
							await playbackSound.unloadAsync();
							setPlaybackSound(null);
						}
						setRecordingUri(null);
						setIsPlaying(false);
					}
				}
			]
		);
	};

	// Search for gestalt source using AI
	const searchGestaltSource = async () => {
		if (!phrase.trim()) {
			Alert.alert('Enter a phrase', 'Please enter the gestalt phrase first');
			return;
		}

		setIsSearching(true);
		try {
			// This is a placeholder for the actual AI search
			// In production, this would call your AI service
			const mockSearch = async () => {
				// Simulate API delay
				await new Promise(resolve => setTimeout(resolve, 2000));
				
				// Mock responses based on some common phrases
				const exactMatches: { [key: string]: {source: string, confidence: 'high'} } = {
					'to infinity and beyond': {source: 'Toy Story (Movie)', confidence: 'high'},
					'let it go': {source: 'Frozen (Movie)', confidence: 'high'},
					'may the force be with you': {source: 'Star Wars (Movie)', confidence: 'high'},
					'hakuna matata': {source: 'The Lion King (Movie)', confidence: 'high'},
					'just keep swimming': {source: 'Finding Nemo (Movie)', confidence: 'high'}
				};

				const lowerPhrase = phrase.toLowerCase();
				
				// Check for exact matches first
				for (const [key, match] of Object.entries(exactMatches)) {
					if (lowerPhrase.includes(key)) {
						return [match];
					}
				}

				// Generate potential matches with varying confidence for generic phrases
				const results = [];
				
				// Look for keywords that might indicate source type
				if (lowerPhrase.includes('mom') || lowerPhrase.includes('mommy') || lowerPhrase.includes('mama')) {
					results.push(
						{source: 'Parent/Caregiver', confidence: 'medium' as const, reason: 'Contains parent reference'},
						{source: 'Family conversation', confidence: 'low' as const, reason: 'Common in family settings'}
					);
				} else if (lowerPhrase.includes('go') || lowerPhrase.includes('come') || lowerPhrase.includes('stop')) {
					results.push(
						{source: 'Daily routine/Instructions', confidence: 'medium' as const, reason: 'Common directive language'},
						{source: 'Peppa Pig', confidence: 'low' as const, reason: 'Features simple directive language'},
						{source: 'Bluey', confidence: 'low' as const, reason: 'Common in play-based shows'}
					);
				} else if (lowerPhrase.includes('wow') || lowerPhrase.includes('oh') || lowerPhrase.includes('whoa')) {
					results.push(
						{source: 'Exclamatory expression', confidence: 'high' as const, reason: 'Common exclamation'},
						{source: 'YouTube Kids videos', confidence: 'medium' as const, reason: 'Frequent in children\'s content'},
						{source: 'Interactive play', confidence: 'low' as const, reason: 'Used during active play'}
					);
				} else if (lowerPhrase.length <= 10) {
					// Short phrases - likely from media or routine
					results.push(
						{source: 'Children\'s TV show', confidence: 'medium' as const, reason: 'Short phrases common in kids media'},
						{source: 'YouTube/Online video', confidence: 'medium' as const, reason: 'Repetitive phrases in digital content'},
						{source: 'Book or story', confidence: 'low' as const, reason: 'Could be from children\'s literature'}
					);
				} else {
					// Longer phrases - could be from various sources
					results.push(
						{source: 'Movie or TV show', confidence: 'medium' as const, reason: 'Longer dialogue suggests scripted content'},
						{source: 'Daily conversation', confidence: 'medium' as const, reason: 'Could be from family interactions'},
						{source: 'Educational content', confidence: 'low' as const, reason: 'Possible from learning videos/apps'}
					);
				}

				// Always include a generic option if no specific matches
				if (results.length === 0) {
					results.push(
						{source: 'Unknown source', confidence: 'low' as const, reason: 'Unable to identify likely sources'},
						{source: 'Daily conversation', confidence: 'low' as const, reason: 'May be from everyday interactions'},
						{source: 'Media content', confidence: 'low' as const, reason: 'Possibly from unidentified show/video'}
					);
				}

				return results;
			};

			const results = await mockSearch();
			setSearchResults(results);
			setSearchResultsExpanded(true);
		} catch (error) {
			console.error('Search failed:', error);
			Alert.alert('Search Error', 'Failed to search for gestalt source');
		} finally {
			setIsSearching(false);
		}
	};

	const handleSave = async () => {
		if (!phrase.trim()) {
			Alert.alert('Required Field', 'Please enter the gestalt phrase');
			return;
		}
		
		// Check authentication
		const auth = getAuth();
		const currentUser = auth.currentUser;
		if (!currentUser) {
			Alert.alert('Authentication Required', 'Please sign in to save gestalts');
			return;
		}
		
		try {
			// Prepare audio data if recording exists
			let audioData: { uri: string; recordedAt: string } | undefined = undefined;
			if (recordingUri) {
				// In production, upload to cloud storage and get URL
				// For now, we'll store the local URI (note: this won't persist across app restarts)
				audioData = {
					uri: recordingUri,
					recordedAt: new Date().toISOString()
				};
			}

			if (isEditing && existingGestalt) {
				// Update existing gestalt
				await updateGestalt(existingGestalt.id, {
					phrase: phrase.trim(),
					source: source.trim() || 'Unknown',
					sourceType: sourceType || 'Other',
					contexts: isRandom ? ['Random'] : contexts,
					dateStartedISO: dateStarted.toISOString(),
					childName: selectedChild || undefined,
					childProfileId: profiles.find(p => p.childName === selectedChild)?.id || undefined,
					audioData
				});
			} else {
				// Create new gestalt
				await addGestalt(
					phrase.trim(),
					source.trim() || 'Unknown',
					sourceType || 'Other',
					'', // stage - empty string as default
					isRandom ? ['Random'] : contexts,
					dateStarted.toISOString(),
					selectedChild || undefined,
					profiles.find(p => p.childName === selectedChild)?.id || undefined,
					audioData
				);
			}
			navigation.goBack();
		} catch (error) {
			console.error('Failed to save gestalt:', error);
			Alert.alert('Save Error', 'Failed to save gestalt. Please try again.');
		}
	};


	// Context management
	const addContext = (context: string) => {
		if (!contexts.includes(context) && contexts.length < 5) {
			setContexts([...contexts, context]);
		}
	};

	const removeContext = (context: string) => {
		setContexts(contexts.filter(c => c !== context));
	};

	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	// Load existing gestalt data when editing
	useEffect(() => {
		if (existingGestalt) {
			setPhrase(existingGestalt.phrase);
			setSource(existingGestalt.source);
			setSourceType(existingGestalt.sourceType || '');
			setContexts(existingGestalt.contexts || []);
			setSelectedChild(existingGestalt.childName || '');
			if (existingGestalt.dateStartedISO) {
				setDateStarted(new Date(existingGestalt.dateStartedISO));
			}
			// Check if this is a random gestalt
			setIsRandom(existingGestalt.contexts?.includes('Random') || false);
		}
	}, [existingGestalt]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (recording) {
				recording.stopAndUnloadAsync();
			}
			if (playbackSound) {
				playbackSound.unloadAsync();
			}
		};
	}, [recording, playbackSound]);

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
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.gap.md, flex: 1 }}>
						<TouchableOpacity onPress={() => navigation.goBack()}>
							<Ionicons name="arrow-back" size={24} color="white" />
						</TouchableOpacity>
						<Text style={{ color: 'white', fontSize: tokens.font.size.h3, fontWeight: '600' }}>
							{isEditing ? 'Edit Gestalt' : 'Add Gestalt'}
						</Text>
					</View>
				</View>
			</View>

			{/* Content Container */}
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
					{/* Gestalt Phrase */}
					<View style={{ marginBottom: tokens.spacing.gap.lg }}>
						<Text weight="medium" style={{ 
							fontSize: tokens.font.size.sm,
							color: tokens.color.text.secondary,
							marginBottom: tokens.spacing.gap.sm 
						}}>
							Gestalt Phrase *
						</Text>
						<TextInput
							placeholder="Enter the exact phrase or script"
							value={phrase}
							onChangeText={setPhrase}
							style={{
								borderColor: tokens.color.border.default,
								borderWidth: 1,
								borderRadius: tokens.radius.lg,
								padding: tokens.spacing.gap.md,
								fontSize: tokens.font.size.body
							}}
						/>
					</View>

					{/* AI Source Search */}
					<TouchableOpacity 
						onPress={searchGestaltSource}
						disabled={isSearching || !phrase.trim()}
						style={{
							backgroundColor: tokens.color.brand.gradient.start + '15',
							borderColor: tokens.color.brand.gradient.start + '30',
							borderWidth: 1,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.md,
							flexDirection: 'row',
							alignItems: 'center',
							marginBottom: tokens.spacing.gap.md
						}}
					>
						{isSearching ? (
							<>
								<Ionicons name="hourglass" size={20} color={tokens.color.brand.gradient.start} />
								<Text style={{
									marginLeft: tokens.spacing.gap.sm,
									color: tokens.color.brand.gradient.start,
									fontWeight: '500'
								}}>
									Searching for source...
								</Text>
							</>
						) : (
							<>
								<Ionicons name="search" size={20} color={tokens.color.brand.gradient.start} />
								<Text style={{
									marginLeft: tokens.spacing.gap.sm,
									color: tokens.color.brand.gradient.start,
									fontWeight: '500'
								}}>
									Search for source of the Gestalt
								</Text>
							</>
						)}
					</TouchableOpacity>

					{/* Search Results */}
					{searchResults && searchResults.length > 0 && (
						<View style={{
							marginBottom: tokens.spacing.gap.lg
						}}>
							<TouchableOpacity
								onPress={() => setSearchResultsExpanded(!searchResultsExpanded)}
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between',
									marginBottom: searchResultsExpanded ? tokens.spacing.gap.sm : 0
								}}
							>
								<Text style={{
									fontSize: tokens.font.size.sm,
									color: tokens.color.text.secondary,
									fontWeight: '600'
								}}>
									Possible Sources ({searchResults.length})
								</Text>
								<Ionicons 
									name={searchResultsExpanded ? "chevron-up" : "chevron-down"} 
									size={16} 
									color={tokens.color.text.secondary} 
								/>
							</TouchableOpacity>
							
							{searchResultsExpanded && (
								<View>
									{searchResults.map((result, index) => {
										const getConfidenceColor = (confidence: string) => {
											switch (confidence) {
												case 'high': return '#10B981'; // Green
												case 'medium': return '#F59E0B'; // Orange
												case 'low': return '#6B7280'; // Gray
												default: return '#6B7280';
											}
										};

										return (
											<TouchableOpacity
												key={index}
												onPress={() => {
													setSource(result.source);
													// Try to determine source type from result
													if (result.source.includes('Movie') || result.source.includes('TV')) setSourceType('TV/Movie');
													else if (result.source.includes('Book')) setSourceType('Book');
													else if (result.source.includes('Song')) setSourceType('Song');
													else if (result.source.includes('Parent') || result.source.includes('conversation')) setSourceType('Parent');
													else setSourceType('Other');
													// Collapse results after selection
													setSearchResultsExpanded(false);
												}}
												style={{
													backgroundColor: tokens.color.surface,
													borderRadius: tokens.radius.lg,
													padding: tokens.spacing.gap.sm,
													marginBottom: tokens.spacing.gap.xs,
													borderLeftWidth: 3,
													borderLeftColor: getConfidenceColor(result.confidence)
												}}
											>
												<View style={{
													flexDirection: 'row',
													justifyContent: 'space-between',
													alignItems: 'center'
												}}>
													<View style={{ flex: 1, marginRight: tokens.spacing.gap.sm }}>
														<Text style={{
															fontSize: tokens.font.size.body,
															color: tokens.color.text.primary,
															fontWeight: '600'
														}}>
															{result.source}
														</Text>
														{result.reason && (
															<Text style={{
																fontSize: tokens.font.size.xs,
																color: tokens.color.text.secondary,
																marginTop: 2
															}}>
																{result.reason}
															</Text>
														)}
													</View>
													<View style={{
														backgroundColor: getConfidenceColor(result.confidence) + '20',
														borderRadius: tokens.radius.pill,
														paddingHorizontal: 6,
														paddingVertical: 3
													}}>
														<Text style={{
															color: getConfidenceColor(result.confidence),
															fontSize: 10,
															fontWeight: '600',
															textTransform: 'uppercase'
														}}>
															{result.confidence}
														</Text>
													</View>
												</View>
											</TouchableOpacity>
										);
									})}
								</View>
							)}
						</View>
					)}

					{/* Source Type */}
					<View style={{ marginBottom: tokens.spacing.gap.lg }}>
						<Text weight="medium" style={{ 
							fontSize: tokens.font.size.sm,
							color: tokens.color.text.secondary,
							marginBottom: tokens.spacing.gap.sm 
						}}>
							Source Type
						</Text>
						<View style={{ 
							flexDirection: 'row',
							flexWrap: 'wrap',
							marginHorizontal: -tokens.spacing.gap.xs
						}}>
							{sourceTypes.map((type) => (
								<TouchableOpacity
									key={type.name}
									onPress={() => setSourceType(type.name)}
									style={{
										width: '33.33%',
										padding: tokens.spacing.gap.xs
									}}
								>
									<View style={{
										backgroundColor: sourceType === type.name ? type.color + '20' : tokens.color.surface,
										borderColor: sourceType === type.name ? type.color : tokens.color.border.default,
										borderWidth: sourceType === type.name ? 2 : 1,
										borderRadius: tokens.radius.lg,
										padding: tokens.spacing.gap.sm,
										alignItems: 'center',
										minHeight: 70
									}}>
										<Ionicons 
											name={type.icon as any} 
											size={20} 
											color={sourceType === type.name ? type.color : tokens.color.text.secondary} 
										/>
										<Text style={{ 
											marginTop: tokens.spacing.gap.xs,
											fontSize: tokens.font.size.xs,
											textAlign: 'center',
											color: sourceType === type.name ? type.color : tokens.color.text.primary,
											fontWeight: sourceType === type.name ? '600' : '400'
										}}>
											{type.name}
										</Text>
									</View>
								</TouchableOpacity>
							))}
						</View>
					</View>

					{/* Source Details */}
					<View style={{ marginBottom: tokens.spacing.gap.lg }}>
						<Text weight="medium" style={{ 
							fontSize: tokens.font.size.sm,
							color: tokens.color.text.secondary,
							marginBottom: tokens.spacing.gap.sm 
						}}>
							Source Details
						</Text>
						<TextInput
							placeholder="e.g., Toy Story, Mom, Bluey Season 2"
							value={source}
							onChangeText={setSource}
							style={{
								borderColor: tokens.color.border.default,
								borderWidth: 1,
								borderRadius: tokens.radius.lg,
								padding: tokens.spacing.gap.md,
								fontSize: tokens.font.size.body
							}}
						/>
					</View>

					{/* Child Selection - Only show if there are multiple children */}
					{availableChildren.length > 1 && (
						<View style={{ marginBottom: tokens.spacing.gap.lg, position: 'relative' }}>
							<Text weight="medium" style={{ 
								fontSize: tokens.font.size.sm,
								color: tokens.color.text.secondary,
								marginBottom: tokens.spacing.gap.sm 
							}}>
								Child
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
									{selectedChild || 'Select Child'}
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
												key={child}
												onPress={() => {
													setSelectedChild(child);
													setShowChildrenDropdown(false);
												}}
												activeOpacity={0.7}
												style={{
													paddingVertical: tokens.spacing.gap.xs,
													paddingHorizontal: tokens.spacing.gap.sm,
													borderBottomWidth: index !== availableChildren.length - 1 ? 0.5 : 0,
													borderBottomColor: 'rgba(0,0,0,0.08)',
													backgroundColor: selectedChild === child ? tokens.color.bg.muted : 'transparent',
													flexDirection: 'row',
													alignItems: 'center',
													justifyContent: 'space-between'
												}}
											>
												<Text style={{
													fontSize: tokens.font.size.sm,
													color: selectedChild === child ? tokens.color.brand.gradient.start : tokens.color.text.secondary,
													fontWeight: '400'
												}}>
													{child}
												</Text>
												{selectedChild === child && (
													<Ionicons name="checkmark" size={12} color={tokens.color.brand.gradient.start} />
												)}
											</TouchableOpacity>
										))}
									</ScrollView>
								</View>
							)}
						</View>
					)}


					{/* Date Started */}
					<View style={{ marginBottom: tokens.spacing.gap.lg }}>
						<DatePickerField
							selectedDate={dateStarted}
							onDateSelect={setDateStarted}
							label="When did they start using this?"
						/>
					</View>

					{/* Context of Use */}
					<View style={{ marginBottom: tokens.spacing.gap.lg }}>
						<Text weight="medium" style={{ 
							fontSize: tokens.font.size.sm,
							color: tokens.color.text.secondary,
							marginBottom: tokens.spacing.gap.sm 
						}}>
							When is it typically used?
						</Text>
						
						{/* Random Toggle */}
						<TouchableOpacity
							onPress={() => {
								setIsRandom(!isRandom);
								if (!isRandom) setContexts([]);
							}}
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								backgroundColor: isRandom ? tokens.color.brand.gradient.start + '20' : tokens.color.surface,
								borderColor: isRandom ? tokens.color.brand.gradient.start : tokens.color.border.default,
								borderWidth: isRandom ? 2 : 1,
								borderRadius: tokens.radius.lg,
								padding: tokens.spacing.gap.md,
								marginBottom: tokens.spacing.gap.sm
							}}
						>
							<View style={{
								width: 20,
								height: 20,
								borderRadius: 4,
								borderWidth: 2,
								borderColor: isRandom ? tokens.color.brand.gradient.start : tokens.color.border.default,
								backgroundColor: isRandom ? tokens.color.brand.gradient.start : 'transparent',
								alignItems: 'center',
								justifyContent: 'center',
								marginRight: tokens.spacing.gap.sm
							}}>
								{isRandom && (
									<Ionicons name="checkmark" size={14} color="white" />
								)}
							</View>
							<Text style={{
								color: isRandom ? tokens.color.brand.gradient.start : tokens.color.text.primary,
								fontWeight: isRandom ? '600' : '400'
							}}>
								Seems random / No clear pattern
							</Text>
						</TouchableOpacity>

						{!isRandom && (
							<>
								{/* Selected Contexts */}
								{contexts.length > 0 && (
									<View style={{ 
										flexDirection: 'row',
										flexWrap: 'wrap',
										marginBottom: tokens.spacing.gap.sm
									}}>
										{contexts.map((context) => (
											<TouchableOpacity
												key={context}
												onPress={() => removeContext(context)}
												style={{
													backgroundColor: tokens.color.brand.gradient.start + '15',
													borderColor: tokens.color.brand.gradient.start + '30',
													borderWidth: 1,
													borderRadius: tokens.radius.pill,
													paddingHorizontal: 12,
													paddingVertical: 8,
													marginRight: tokens.spacing.gap.xs,
													marginBottom: tokens.spacing.gap.xs,
													flexDirection: 'row',
													alignItems: 'center'
												}}
											>
												<Text style={{ 
													color: tokens.color.brand.gradient.start,
													fontSize: tokens.font.size.small,
													fontWeight: '500'
												}}>
													{context}
												</Text>
												<Ionicons 
													name="close" 
													size={14} 
													color={tokens.color.brand.gradient.start}
													style={{ marginLeft: 6 }}
												/>
											</TouchableOpacity>
										))}
									</View>
								)}

								{/* Common Contexts */}
								<ScrollView horizontal showsHorizontalScrollIndicator={false}>
									{commonContexts.filter(c => !contexts.includes(c)).map((context) => (
										<TouchableOpacity
											key={context}
											onPress={() => addContext(context)}
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
												+ {context}
											</Text>
										</TouchableOpacity>
									))}
								</ScrollView>

								{/* Custom Context Input */}
								<View style={{
									flexDirection: 'row',
									marginTop: tokens.spacing.gap.sm,
									gap: tokens.spacing.gap.sm
								}}>
									<TextInput
										placeholder="Add custom context..."
										value={newContext}
										onChangeText={setNewContext}
										style={{
											flex: 1,
											borderColor: tokens.color.border.default,
											borderWidth: 1,
											borderRadius: tokens.radius.lg,
											paddingHorizontal: tokens.spacing.gap.md,
											paddingVertical: tokens.spacing.gap.sm,
											fontSize: tokens.font.size.sm
										}}
									/>
									<TouchableOpacity
										onPress={() => {
											if (newContext.trim()) {
												addContext(newContext.trim());
												setNewContext('');
											}
										}}
										style={{
											backgroundColor: tokens.color.brand.gradient.start,
											borderRadius: tokens.radius.lg,
											paddingHorizontal: tokens.spacing.gap.md,
											paddingVertical: tokens.spacing.gap.sm,
											justifyContent: 'center'
										}}
									>
										<Text style={{ color: 'white', fontWeight: '600' }}>Add</Text>
									</TouchableOpacity>
								</View>
							</>
						)}
					</View>

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
									<Text style={{ 
										color: tokens.color.text.secondary,
										fontSize: tokens.font.size.sm,
										marginTop: 4
									}}>
										Record your child saying the gestalt
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
									justifyContent: 'space-between'
								}}>
									<View style={{ flex: 1 }}>
										<Text style={{
											fontSize: tokens.font.size.body,
											fontWeight: '600',
											marginBottom: 4
										}}>
											Audio Recording
										</Text>
										<Text style={{
											fontSize: tokens.font.size.sm,
											color: tokens.color.text.secondary
										}}>
											Tap play to listen
										</Text>
									</View>
									<View style={{
										flexDirection: 'row',
										gap: tokens.spacing.gap.sm
									}}>
										<TouchableOpacity
											onPress={playRecording}
											style={{
												width: 40,
												height: 40,
												borderRadius: 20,
												backgroundColor: tokens.color.brand.gradient.start,
												alignItems: 'center',
												justifyContent: 'center'
											}}
										>
											<Ionicons 
												name={isPlaying ? "pause" : "play"} 
												size={20} 
												color="white" 
											/>
										</TouchableOpacity>
										<TouchableOpacity
											onPress={deleteRecording}
											style={{
												width: 40,
												height: 40,
												borderRadius: 20,
												backgroundColor: '#EF4444',
												alignItems: 'center',
												justifyContent: 'center'
											}}
										>
											<Ionicons name="trash" size={20} color="white" />
										</TouchableOpacity>
									</View>
								</View>
							</View>
						)}
					</View>

					{/* Save Button */}
					<GradientButton 
						title={isEditing ? "Update Gestalt" : "Save Gestalt"} 
						onPress={handleSave}
					/>
				</ScrollView>
			</View>

			<BottomNavigation />
		</LinearGradient>
	);
}