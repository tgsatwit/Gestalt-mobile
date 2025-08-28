import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Image, FlatList, Modal, Alert, ActivityIndicator } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '../components/GradientButton';
import { useStorybookStore } from '../state/useStorybookStore-firebase';
import { useMemoriesStore } from '../state/useStore';
import { Character, ConceptLearningRequest, StoryWizardStep } from '../types/storybook';
import { useDrawer } from '../navigation/SimpleDrawer';
import { useNavigation } from '@react-navigation/native';
import type { MainStackParamList } from '../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Real data now comes from Zustand store

// --- Main Component ---
type StorybookScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Storybook'>;

export default function StorybookScreen() {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const navigation = useNavigation<StorybookScreenNavigationProp>();

	// --- Zustand Store ---
	const {
		characters,
		stories,
		currentStory,
		generationProgress,
		error,
		loadCharacters,
		loadStories,
		createCharacterFromPhoto,
		createStory,
		deleteStory,
		refineStoryImage,
		pickImageFromGallery,
		takePhoto,
		setCurrentStory,
		clearError,
		resetProgress
	} = useStorybookStore();

	// --- Local UI State ---
	const [activeTab, setActiveTab] = useState<'stories' | 'characters'>('stories');
	
	// Modal states for creation flows
	const [isAvatarModalVisible, setAvatarModalVisible] = useState(false);
	const [isStoryModalVisible, setStoryModalVisible] = useState(false);
	const [isStoryViewerVisible, setStoryViewerVisible] = useState(false);
	const [isRefineModalVisible, setRefineModalVisible] = useState(false);

	// Wizard states
	const [avatarStep, setAvatarStep] = useState('upload'); // upload, generating, review
	const [storyWizardStep, setStoryWizardStep] = useState<StoryWizardStep>('child-concept');
	// Get user's child profile from memories store
	const { profile } = useMemoriesStore();
	
	// Form states for GLP workflow
	const [conceptLearning, setConceptLearning] = useState<ConceptLearningRequest>({
		concept: '',
		includeChildAsCharacter: false,
		mode: 'simple',
		characterIds: [],
		advanced: {
			density: 'one-sentence',
			narrative: 'third-person',
			pageCount: 5,
			complexity: 'simple',
			communicationStyle: 'balanced',
			tone: 'gentle',
			goal: ''
		}
	});
	
	// Legacy form states (for existing functionality)
	const [pageToRefine, setPageToRefine] = useState(0);
	const [characterName, setCharacterName] = useState('');
	const [refinementPrompt, setRefinementPrompt] = useState('');
	const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
	
	// Suggested concepts for swipable cards
	const [suggestedConcepts] = useState([
		{ id: '1', concept: 'Sharing', description: 'Learning to share toys and take turns', message: 'Teach the importance of sharing toys with others' },
		{ id: '2', concept: 'Emotions', description: 'Understanding feelings and how to express them', message: 'Teach how to identify and express emotions in healthy ways' },
		{ id: '3', concept: 'Friendship', description: 'Making friends and being kind to others', message: 'Teach the value of kindness and how to be a good friend' },
		{ id: '4', concept: 'Patience', description: 'Learning to wait and be calm', message: 'Teach the importance of waiting patiently and staying calm' },
		{ id: '5', concept: 'Helping Others', description: 'Being helpful and caring for family and friends', message: 'Teach the joy of helping family and friends in need' },
		{ id: '6', concept: 'Counting', description: 'Numbers and basic math concepts', message: 'Teach basic counting and number recognition skills' },
		{ id: '7', concept: 'Colors', description: 'Learning about different colors and how to identify them', message: 'Teach color recognition and how colors make our world beautiful' },
		{ id: '8', concept: 'Animals', description: 'Different animals and their sounds or behaviors', message: 'Teach about different animals and their unique characteristics' }
	]);

	// --- Effects ---
	useEffect(() => {
		// Load data when component mounts
		loadCharacters();
		loadStories();
	}, []);

	// State for simulated progress
	const [simulatedProgress, setSimulatedProgress] = useState(0);

	// Simulate progress for text generation step and auto-advance
	useEffect(() => {
		if (storyWizardStep === 'text-generation') {
			// Reset and start progress simulation
			setSimulatedProgress(0);
			const interval = setInterval(() => {
				setSimulatedProgress(prev => {
					if (prev >= 100) {
						clearInterval(interval);
						// Auto-advance to text editing step after a short delay
						setTimeout(() => {
							// Initialize story pages draft for editing
							setConceptLearning(prevState => ({
								...prevState,
								storyPages: [
									{ pageNumber: 1, text: `Once upon a time, there was a little child who wanted to learn about ${prevState.concept.toLowerCase()}.`, isEdited: false },
									{ pageNumber: 2, text: `They discovered that ${prevState.concept.toLowerCase()} was all around them.`, isEdited: false },
									{ pageNumber: 3, text: `Through their adventures, they learned how to practice ${prevState.concept.toLowerCase()} every day.`, isEdited: false },
									{ pageNumber: 4, text: `Now they could share their knowledge about ${prevState.concept.toLowerCase()} with their friends.`, isEdited: false },
									{ pageNumber: 5, text: `And they lived happily, always remembering the importance of ${prevState.concept.toLowerCase()}.`, isEdited: false }
								]
							}));
							setStoryWizardStep('text-editing');
						}, 1000); // 1 second delay to show completion
						return 100;
					}
					return prev + 10;
				});
			}, 300);

			return () => clearInterval(interval);
		}
	}, [storyWizardStep]);

	// Show error alerts and handle error recovery
	useEffect(() => {
		if (error) {
			Alert.alert(
				'Error',
				error.message,
				[
					{ 
						text: 'OK', 
						onPress: () => {
							clearError();
							// If error occurred during story generation, revert to character selection
							if (storyWizardStep === 'text-generation' || storyWizardStep === 'image-generation') {
								setStoryWizardStep('character-selection');
								setSimulatedProgress(0);
							}
						}
					}
				]
			);
		}
	}, [error, storyWizardStep]);


	// --- Render Functions for UI sections ---

	const renderHeader = () => (
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
						Storybook
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
	);

	const renderSegmentedControl = () => (
		<View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', margin: tokens.spacing.containerX, borderRadius: tokens.radius.lg, padding: 4 }}>
			<TouchableOpacity 
				onPress={() => setActiveTab('stories')}
				style={{ flex: 1, paddingVertical: 10, backgroundColor: activeTab === 'stories' ? 'white' : 'transparent', borderRadius: tokens.radius.md }}>
				<Text weight="semibold" style={{ textAlign: 'center', color: activeTab === 'stories' ? tokens.color.primary.default : 'white' }}>My Stories</Text>
			</TouchableOpacity>
			<TouchableOpacity 
				onPress={() => setActiveTab('characters')}
				style={{ flex: 1, paddingVertical: 10, backgroundColor: activeTab === 'characters' ? 'white' : 'transparent', borderRadius: tokens.radius.md }}>
				<Text weight="semibold" style={{ textAlign: 'center', color: activeTab === 'characters' ? tokens.color.primary.default : 'white' }}>My Characters</Text>
			</TouchableOpacity>
		</View>
	);

	const renderStoriesTab = () => (
		<View style={{ flex: 1 }}>
			<ScrollView contentContainerStyle={{ padding: tokens.spacing.containerX, paddingBottom: 100 }}>
				<Text size="h2" weight="bold" style={{ marginBottom: tokens.spacing.gap.sm }}>Your Library</Text>
				<Text color="secondary" style={{ marginBottom: tokens.spacing.gap.lg }}>
					Revisit your magical adventures or create a new one.
				</Text>
				{stories.map(story => (
					<View key={story.id} style={{
						flexDirection: 'row',
						alignItems: 'center',
						backgroundColor: tokens.color.surface,
						borderRadius: tokens.radius.lg,
						padding: tokens.spacing.gap.md,
						marginBottom: tokens.spacing.gap.sm,
						borderColor: tokens.color.border.default,
						borderWidth: 1
					}}>
						<TouchableOpacity 
							onPress={() => { setCurrentStory(story); setStoryViewerVisible(true); }}
							style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
						>
							<Image source={{ uri: story.coverUrl }} style={{ width: 60, height: 60, borderRadius: tokens.radius.md, marginRight: tokens.spacing.gap.md }} />
							<View style={{ flex: 1 }}>
								<Text weight="semibold">{story.title}</Text>
								<Text color="secondary" size="sm">
									Created {story.createdAt instanceof Date ? 
										story.createdAt.toLocaleDateString('en-US', { 
											month: 'short', 
											day: 'numeric', 
											year: 'numeric' 
										}) : 
										'Recently'
									}
								</Text>
							</View>
							<Ionicons name="chevron-forward" size={20} color={tokens.color.text.secondary} />
						</TouchableOpacity>
						
						{/* Delete button */}
						<TouchableOpacity 
							onPress={() => {
								Alert.alert(
									'Delete Story',
									`Are you sure you want to delete "${story.title}"? This action cannot be undone.`,
									[
										{ text: 'Cancel', style: 'cancel' },
										{ 
											text: 'Delete', 
											style: 'destructive',
											onPress: async () => {
												try {
													await deleteStory(story.id);
												} catch (error) {
													console.error('Failed to delete story:', error);
												}
											}
										}
									]
								);
							}}
							style={{
								padding: 8,
								marginLeft: 8
							}}
						>
							<Ionicons name="trash-outline" size={20} color="#EF4444" />
						</TouchableOpacity>
					</View>
				))}
			</ScrollView>
			<View style={{ position: 'absolute', bottom: 30, right: 20 }}>
				<GradientButton
					title="Create New Story"
					onPress={() => {
						resetProgress();
						setConceptLearning({
							concept: '',
							includeChildAsCharacter: false,
							mode: 'simple',
							characterIds: []
						});
						setStoryWizardStep('child-concept');
						setStoryModalVisible(true);
					}}
				/>
			</View>
		</View>
	);

	const renderCharactersTab = () => (
		<View style={{ flex: 1 }}>
			<ScrollView contentContainerStyle={{ padding: tokens.spacing.containerX, paddingBottom: 100 }}>
				<Text size="h2" weight="bold" style={{ marginBottom: tokens.spacing.gap.sm }}>Character Library</Text>
				<Text color="secondary" style={{ marginBottom: tokens.spacing.gap.lg }}>
					Create and manage personalized avatars for your stories.
				</Text>
				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.gap.md }}>
					{characters.map((char: Character) => (
						<View key={char.id} style={{ alignItems: 'center', gap: tokens.spacing.gap.xs }}>
							<Image source={{ uri: char.avatarUrl }} style={{ width: 100, height: 100, borderRadius: 50 }} />
							<Text weight="medium">{char.name}</Text>
						</View>
					))}
					<TouchableOpacity onPress={() => {
						resetProgress();
						setCharacterName('');
						setSelectedPhoto(null);
						setAvatarStep('upload');
						setAvatarModalVisible(true);
					}} style={{
						width: 100,
						height: 100,
						borderRadius: 50,
						backgroundColor: tokens.color.surface,
						borderWidth: 2,
						borderColor: tokens.color.border.default,
						borderStyle: 'dashed',
						alignItems: 'center',
						justifyContent: 'center'
					}}>
						<Ionicons name="add" size={32} color={tokens.color.text.secondary} />
					</TouchableOpacity>
				</View>
			</ScrollView>
		</View>
	);

	// --- Modals for Flows ---

	const renderAvatarCreationModal = () => (
		<Modal visible={isAvatarModalVisible} animationType="slide" transparent>
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
				<View style={{ width: '90%', backgroundColor: 'white', borderRadius: tokens.radius.xl, padding: tokens.spacing.gap.lg }}>
					<TouchableOpacity onPress={() => setAvatarModalVisible(false)} style={{ alignSelf: 'flex-end' }}>
						<Ionicons name="close-circle" size={24} color={tokens.color.text.secondary} />
					</TouchableOpacity>
					<Text size="h2" weight="bold" style={{ textAlign: 'center', marginBottom: tokens.spacing.gap.md }}>Create Character</Text>
					
					{avatarStep === 'upload' && (
						<>
							<Text color="secondary" style={{ textAlign: 'center', marginBottom: tokens.spacing.gap.lg }}>Upload a clear, front-facing photo to generate a Pixar-style avatar.</Text>
							<TouchableOpacity style={{
								height: 150,
								borderWidth: 2,
								borderColor: tokens.color.border.default,
								borderStyle: 'dashed',
								borderRadius: tokens.radius.lg,
								alignItems: 'center',
								justifyContent: 'center',
								backgroundColor: tokens.color.surface,
								marginBottom: tokens.spacing.gap.lg
							}}>
								<Ionicons name="cloud-upload-outline" size={40} color={tokens.color.text.secondary} />
								<Text color="secondary">Tap to upload photo</Text>
							</TouchableOpacity>
							<GradientButton title="Generate Avatar" onPress={() => setAvatarStep('generating')} />
						</>
					)}

					{avatarStep === 'generating' && (
						<View style={{ alignItems: 'center', paddingVertical: 40 }}>
							<Image source={{ uri: 'https://picsum.photos/seed/logo1/100' }} style={{ width: 80, height: 80, marginBottom: 20 }} />
							<Text weight="semibold">Creating your avatar...</Text>
							<Text color="secondary">This may take a moment.</Text>
						</View>
					)}

					{avatarStep === 'review' && (
						<>
							<Image source={{ uri: 'https://picsum.photos/seed/new-avatar/300' }} style={{ width: 150, height: 150, borderRadius: 75, alignSelf: 'center', marginBottom: tokens.spacing.gap.lg }} />
							<TextInput placeholder="Enter character name" style={{ borderWidth: 1, borderColor: tokens.color.border.default, borderRadius: tokens.radius.md, padding: 12, marginBottom: tokens.spacing.gap.sm }} />
							<GradientButton title="Save Character" onPress={() => { setAvatarModalVisible(false); setAvatarStep('upload'); }} />
							<TouchableOpacity onPress={() => setAvatarStep('generating')} style={{ marginTop: 12 }}>
								<Text style={{ textAlign: 'center', color: tokens.color.primary.default }}>Regenerate</Text>
							</TouchableOpacity>
						</>
					)}
				</View>
			</View>
		</Modal>
	);

	const renderProgressSteps = () => {
		// Simplified steps - just numbers with fun colors
		const allSteps = ['child-concept', 'mode-selection', 'advanced-options', 'character-selection', 'text-generation', 'text-editing', 'review'];
		const activeSteps = conceptLearning.mode === 'simple' 
			? allSteps.filter(s => s !== 'advanced-options')
			: allSteps;
		
		const currentStepNumber = activeSteps.indexOf(storyWizardStep) + 1;
		const totalSteps = activeSteps.length;
		const progress = (currentStepNumber / totalSteps) * 100;

		return (
			<View style={{ paddingHorizontal: tokens.spacing.containerX, marginBottom: tokens.spacing.gap.lg }}>
				{/* Fun gradient progress bar */}
				<View style={{ 
					height: 8, 
					backgroundColor: tokens.color.surface, 
					borderRadius: 4,
					overflow: 'hidden',
					marginBottom: 12
				}}>
					<LinearGradient
						colors={['#7C3AED', '#EC4899']}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 0 }}
						style={{
							position: 'absolute',
							left: 0,
							top: 0,
							bottom: 0,
							width: `${progress}%`,
							borderRadius: 4
						}}
					/>
					{/* Animated sparkle at the end */}
					<View style={{
						position: 'absolute',
						left: `${Math.max(0, progress - 2)}%`,
						top: -4,
						width: 16,
						height: 16,
						borderRadius: 8,
						backgroundColor: 'white',
						shadowColor: '#EC4899',
						shadowOffset: { width: 0, height: 0 },
						shadowOpacity: 0.5,
						shadowRadius: 4
					}}>
						<Ionicons name="sparkles" size={10} color="#EC4899" style={{ position: 'absolute', top: 3, left: 3 }} />
					</View>
				</View>
				
				{/* Simple step counter */}
				<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
					<Text size="sm" weight="semibold" style={{ color: tokens.color.primary.default }}>
						Step {currentStepNumber} of {totalSteps}
					</Text>
					<Text size="xs" color="secondary">
						{getStepTitle(storyWizardStep)}
					</Text>
				</View>
			</View>
		);
	};
	
	const getStepTitle = (step: StoryWizardStep): string => {
		const titles: Record<StoryWizardStep, string> = {
			'child-concept': 'Choose Child & Concept',
			'mode-selection': 'Select Mode',
			'advanced-options': 'Customize Options',
			'character-selection': 'Add Characters',
			'text-generation': 'Creating Story',
			'text-editing': 'Edit Your Story',
			'image-generation': 'Generating Images',
			'review': 'Complete!'
		};
		return titles[step] || '';
	};

	const renderStoryCreationModal = () => (
		<Modal visible={isStoryModalVisible} animationType="slide">
			<View style={{ flex: 1, backgroundColor: 'white', paddingTop: 60 }}>
				<TouchableOpacity onPress={() => setStoryModalVisible(false)} style={{ position: 'absolute', top: 60, right: 20, zIndex: 1 }}>
					<Ionicons name="close-circle" size={24} color={tokens.color.text.secondary} />
				</TouchableOpacity>
				
				<ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
					<View style={{ padding: tokens.spacing.containerX }}>
						<Text size="h1" weight="bold" style={{ marginBottom: tokens.spacing.gap.sm }}>Create Learning Story</Text>
						<Text color="secondary" style={{ marginBottom: tokens.spacing.gap.lg }}>Help your child understand concepts through visual storytelling</Text>
					</View>
					
					{renderProgressSteps()}
					
					<View style={{ padding: tokens.spacing.containerX }}>
						{storyWizardStep === 'child-concept' && (
							<>
								<Text size="h2" weight="bold" style={{ marginBottom: tokens.spacing.gap.md }}>Select Child & Concept</Text>
								
								{profile ? (
									<>
										<Text weight="semibold" style={{ marginBottom: 8 }}>This story is for:</Text>
										<TouchableOpacity 
											onPress={() => setConceptLearning({...conceptLearning, childProfileId: profile.id})}
											style={{
												padding: 16,
												borderRadius: tokens.radius.lg,
												borderWidth: 2,
												borderColor: conceptLearning.childProfileId === profile.id ? tokens.color.primary.default : tokens.color.border.default,
												backgroundColor: conceptLearning.childProfileId === profile.id ? "#F3E8FF" : 'transparent',
												marginBottom: 20
											}}
										>
											<Text weight="semibold">{profile.childName}</Text>
											<Text size="sm" color="secondary">{profile.stage || 'Gestalt Language Processor'}</Text>
										</TouchableOpacity>

										<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30 }}>
											<TouchableOpacity 
												onPress={() => setConceptLearning({...conceptLearning, includeChildAsCharacter: !conceptLearning.includeChildAsCharacter})}
												style={{
													width: 24,
													height: 24,
													borderRadius: 4,
													borderWidth: 2,
													borderColor: conceptLearning.includeChildAsCharacter ? tokens.color.primary.default : tokens.color.border.default,
													backgroundColor: conceptLearning.includeChildAsCharacter ? tokens.color.primary.default : 'transparent',
													alignItems: 'center',
													justifyContent: 'center',
													marginRight: 12
												}}
											>
												{conceptLearning.includeChildAsCharacter && (
													<Ionicons name="checkmark" size={16} color="white" />
												)}
											</TouchableOpacity>
											<Text>Include child as a character in the story</Text>
										</View>
									</>
								) : (
									<View style={{
										padding: 16,
										borderRadius: tokens.radius.lg,
										borderWidth: 1,
										borderColor: tokens.color.border.default,
										backgroundColor: '#FEF3C7',
										marginBottom: 20
									}}>
										<Text weight="semibold" style={{ color: '#92400E', marginBottom: 4 }}>No child profile found</Text>
										<Text size="sm" style={{ color: '#92400E' }}>Please set up your child's profile in the app first</Text>
									</View>
								)}

								<Text weight="semibold" style={{ marginBottom: 8 }}>Suggested concepts:</Text>
								<FlatList
									data={suggestedConcepts}
									horizontal
									showsHorizontalScrollIndicator={false}
									keyExtractor={(item) => item.id}
									contentContainerStyle={{ paddingRight: 20 }}
									renderItem={({ item }) => (
										<TouchableOpacity
											onPress={() => setConceptLearning({...conceptLearning, concept: item.message})}
											style={{
												width: 140,
												padding: 12,
												marginRight: 12,
												borderRadius: tokens.radius.lg,
												borderWidth: 1,
												borderColor: conceptLearning.concept === item.message ? tokens.color.primary.default : tokens.color.border.default,
												backgroundColor: conceptLearning.concept === item.message ? "#F3E8FF" : tokens.color.surface
											}}
										>
											<Text weight="semibold" size="sm" style={{ textAlign: 'center', marginBottom: 4 }}>{item.concept}</Text>
											<Text size="xs" color="secondary" style={{ textAlign: 'center', lineHeight: 14 }}>{item.description}</Text>
										</TouchableOpacity>
									)}
									style={{ marginBottom: 20 }}
								/>

								<Text weight="semibold" style={{ marginBottom: 8 }}>What do you want the message to be?</Text>
								<TextInput 
									placeholder="e.g., sharing, emotions, counting, colors" 
									value={conceptLearning.concept}
									onChangeText={(text) => setConceptLearning({...conceptLearning, concept: text})}
									style={{ 
										borderWidth: 1, 
										borderColor: tokens.color.border.default, 
										borderRadius: tokens.radius.md, 
										padding: 12, 
										marginBottom: 20 
									}} 
								/>

								<GradientButton 
									title="Next: Choose Mode" 
									disabled={!conceptLearning.concept.trim() || (!profile && !conceptLearning.childProfileId)}
									onPress={() => {
										if (profile && !conceptLearning.childProfileId) {
											setConceptLearning({...conceptLearning, childProfileId: profile.id});
										}
										setStoryWizardStep('mode-selection');
									}} 
								/>
							</>
						)}

						{storyWizardStep === 'mode-selection' && (
							<>
								<Text size="h2" weight="bold" style={{ marginBottom: tokens.spacing.gap.md }}>Choose Creation Mode</Text>
								
								<TouchableOpacity 
									onPress={() => setConceptLearning({...conceptLearning, mode: 'simple'})}
									style={{
										padding: 20,
										borderRadius: tokens.radius.lg,
										borderWidth: 2,
										borderColor: conceptLearning.mode === 'simple' ? tokens.color.primary.default : tokens.color.border.default,
										backgroundColor: conceptLearning.mode === 'simple' ? "#F3E8FF" : tokens.color.surface,
										marginBottom: 16
									}}
								>
									<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
										<Ionicons name="flash" size={20} color={tokens.color.primary.default} style={{ marginRight: 8 }} />
										<Text weight="bold">Simple Mode</Text>
									</View>
									<Text color="secondary">Quick story generation with smart defaults. Perfect for getting started quickly.</Text>
								</TouchableOpacity>

								<TouchableOpacity 
									onPress={() => setConceptLearning({...conceptLearning, mode: 'advanced'})}
									style={{
										padding: 20,
										borderRadius: tokens.radius.lg,
										borderWidth: 2,
										borderColor: conceptLearning.mode === 'advanced' ? tokens.color.primary.default : tokens.color.border.default,
										backgroundColor: conceptLearning.mode === 'advanced' ? "#F3E8FF" : tokens.color.surface,
										marginBottom: 30
									}}
								>
									<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
										<Ionicons name="settings" size={20} color={tokens.color.primary.default} style={{ marginRight: 8 }} />
										<Text weight="bold">Advanced Mode</Text>
									</View>
									<Text color="secondary">Full customization with detailed options for complexity, tone, narrative style, and learning goals.</Text>
								</TouchableOpacity>

								<View style={{ flexDirection: 'row', gap: 12 }}>
									<TouchableOpacity 
										onPress={() => setStoryWizardStep('child-concept')}
										style={{ flex: 1, padding: 12, alignItems: 'center' }}
									>
										<Text style={{ color: tokens.color.text.secondary }}>Back</Text>
									</TouchableOpacity>
									<GradientButton 
										title={conceptLearning.mode === 'advanced' ? 'Next: Options' : 'Next: Characters'}
										onPress={() => setStoryWizardStep(conceptLearning.mode === 'advanced' ? 'advanced-options' : 'character-selection')}
										style={{ flex: 2 }}
									/>
								</View>
							</>
						)}

						{storyWizardStep === 'advanced-options' && conceptLearning.mode === 'advanced' && (
							<>
								<Text size="h2" weight="bold" style={{ marginBottom: tokens.spacing.gap.md }}>Advanced Options</Text>
								
								<Text color="secondary" style={{ marginBottom: 20 }}>Customize the story to match your child's learning style and needs.</Text>
								
								{/* Text Density */}
								<Text weight="semibold" style={{ marginBottom: 8 }}>Text Density</Text>
								<View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
									{(['one-word', 'one-sentence', 'multiple-sentences'] as const).map((density) => (
										<TouchableOpacity
											key={density}
											onPress={() => setConceptLearning({
												...conceptLearning,
												advanced: { 
													narrative: 'third-person',
													pageCount: 5,
													complexity: 'simple',
													communicationStyle: 'balanced',
													tone: 'gentle',
													goal: '',
													...conceptLearning.advanced, 
													density 
												}
											})}
											style={{
												flex: 1,
												padding: 10,
												borderRadius: tokens.radius.md,
												borderWidth: 1,
												borderColor: conceptLearning.advanced?.density === density ? tokens.color.primary.default : tokens.color.border.default,
												backgroundColor: conceptLearning.advanced?.density === density ? "#F3E8FF" : 'transparent'
											}}
										>
											<Text size="sm" style={{ textAlign: 'center' }}>
												{density.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
											</Text>
										</TouchableOpacity>
									))}
								</View>

								{/* Narrative Perspective */}
								<Text weight="semibold" style={{ marginBottom: 8 }}>Narrative Style</Text>
								<View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
									{(['first-person', 'third-person'] as const).map((narrative) => (
										<TouchableOpacity
											key={narrative}
											onPress={() => setConceptLearning({
												...conceptLearning,
												advanced: { 
													density: 'one-sentence',
													pageCount: 5,
													complexity: 'simple',
													communicationStyle: 'balanced',
													tone: 'gentle',
													goal: '',
													...conceptLearning.advanced, 
													narrative 
												}
											})}
											style={{
												flex: 1,
												padding: 12,
												borderRadius: tokens.radius.md,
												borderWidth: 1,
												borderColor: conceptLearning.advanced?.narrative === narrative ? tokens.color.primary.default : tokens.color.border.default,
												backgroundColor: conceptLearning.advanced?.narrative === narrative ? "#F3E8FF" : 'transparent'
											}}
										>
											<Text style={{ textAlign: 'center', fontWeight: '600' }}>
												{narrative.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-')}
											</Text>
											<Text size="xs" color="secondary" style={{ textAlign: 'center', marginTop: 4 }}>
												{narrative === 'first-person' ? 'I went to...' : 'Emma went to...'}
											</Text>
										</TouchableOpacity>
									))}
								</View>

								{/* Page Count */}
								<Text weight="semibold" style={{ marginBottom: 8 }}>Story Length</Text>
								<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
									<Text style={{ marginRight: 10 }}>{conceptLearning.advanced?.pageCount || 5} pages</Text>
									<View style={{ flex: 1, height: 4, backgroundColor: tokens.color.border.default, borderRadius: 2 }}>
										<View style={{ 
											width: `${((conceptLearning.advanced?.pageCount || 5) - 3) / (15 - 3) * 100}%`, 
											height: '100%', 
											backgroundColor: tokens.color.primary.default, 
											borderRadius: 2 
										}} />
									</View>
									<TouchableOpacity 
										onPress={() => setConceptLearning({
											...conceptLearning,
											advanced: { 
												density: 'one-sentence',
												narrative: 'third-person',
												complexity: 'simple',
												communicationStyle: 'balanced',
												tone: 'gentle',
												goal: '',
												...conceptLearning.advanced, 
												pageCount: Math.max(3, (conceptLearning.advanced?.pageCount || 5) - 1) 
											}
										})}
										style={{ marginLeft: 10, padding: 8 }}
									>
										<Ionicons name="remove" size={20} color={tokens.color.primary.default} />
									</TouchableOpacity>
									<TouchableOpacity 
										onPress={() => setConceptLearning({
											...conceptLearning,
											advanced: { 
												density: 'one-sentence',
												narrative: 'third-person',
												complexity: 'simple',
												communicationStyle: 'balanced',
												tone: 'gentle',
												goal: '',
												...conceptLearning.advanced, 
												pageCount: Math.min(15, (conceptLearning.advanced?.pageCount || 5) + 1) 
											}
										})}
										style={{ padding: 8 }}
									>
										<Ionicons name="add" size={20} color={tokens.color.primary.default} />
									</TouchableOpacity>
								</View>

								{/* Complexity */}
								<Text weight="semibold" style={{ marginBottom: 8 }}>Language Complexity</Text>
								<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
									{(['very-simple', 'simple', 'moderate', 'complex'] as const).map((complexity) => (
										<TouchableOpacity
											key={complexity}
											onPress={() => setConceptLearning({
												...conceptLearning,
												advanced: { 
													density: 'one-sentence',
													narrative: 'third-person',
													pageCount: 5,
													communicationStyle: 'balanced',
													tone: 'gentle',
													goal: '',
													...conceptLearning.advanced, 
													complexity 
												}
											})}
											style={{
												padding: 8,
												borderRadius: tokens.radius.md,
												borderWidth: 1,
												borderColor: conceptLearning.advanced?.complexity === complexity ? tokens.color.primary.default : tokens.color.border.default,
												backgroundColor: conceptLearning.advanced?.complexity === complexity ? "#F3E8FF" : 'transparent'
											}}
										>
											<Text size="sm">
												{complexity.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
											</Text>
										</TouchableOpacity>
									))}
								</View>

								{/* Tone */}
								<Text weight="semibold" style={{ marginBottom: 8 }}>Tone</Text>
								<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
									{(['playful', 'gentle', 'encouraging', 'educational'] as const).map((tone) => (
										<TouchableOpacity
											key={tone}
											onPress={() => setConceptLearning({
												...conceptLearning,
												advanced: { 
													density: 'one-sentence',
													narrative: 'third-person',
													pageCount: 5,
													complexity: 'simple',
													communicationStyle: 'balanced',
													goal: '',
													...conceptLearning.advanced, 
													tone 
												}
											})}
											style={{
												padding: 8,
												borderRadius: tokens.radius.md,
												borderWidth: 1,
												borderColor: conceptLearning.advanced?.tone === tone ? tokens.color.primary.default : tokens.color.border.default,
												backgroundColor: conceptLearning.advanced?.tone === tone ? "#F3E8FF" : 'transparent'
											}}
										>
											<Text size="sm" style={{ textTransform: 'capitalize' }}>{tone}</Text>
										</TouchableOpacity>
									))}
								</View>

								{/* Learning Goal */}
								<Text weight="semibold" style={{ marginBottom: 8 }}>Learning Goal</Text>
								<TextInput
									placeholder="What should your child learn from this story?"
									value={conceptLearning.advanced?.goal || ''}
									onChangeText={(goal) => setConceptLearning({
										...conceptLearning,
										advanced: { 
											density: 'one-sentence',
											narrative: 'third-person',
											pageCount: 5,
											complexity: 'simple',
											communicationStyle: 'balanced',
											tone: 'gentle',
											...conceptLearning.advanced, 
											goal 
										}
									})}
									multiline
									style={{
										borderWidth: 1,
										borderColor: tokens.color.border.default,
										borderRadius: tokens.radius.md,
										padding: 12,
										height: 80,
										marginBottom: 30
									}}
								/>

								<View style={{ flexDirection: 'row', gap: 12 }}>
									<TouchableOpacity 
										onPress={() => setStoryWizardStep('mode-selection')}
										style={{ flex: 1, padding: 12, alignItems: 'center' }}
									>
										<Text style={{ color: tokens.color.text.secondary }}>Back</Text>
									</TouchableOpacity>
									<GradientButton 
										title="Next: Characters"
										onPress={() => setStoryWizardStep('character-selection')}
										style={{ flex: 2 }}
									/>
								</View>
							</>
						)}

						{storyWizardStep === 'character-selection' && (
							<>
								<Text size="h2" weight="bold" style={{ marginBottom: tokens.spacing.gap.md }}>Choose Characters</Text>
								<Text color="secondary" style={{ marginBottom: 20 }}>Select characters for your story, create new ones, or skip this step.</Text>
								
								<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 30 }}>
									{characters.map((char: Character) => {
										const isSelected = conceptLearning.characterIds.includes(char.id);
										return (
											<TouchableOpacity 
												key={char.id} 
												onPress={() => {
													if (isSelected) {
														setConceptLearning({...conceptLearning, characterIds: conceptLearning.characterIds.filter(id => id !== char.id)});
													} else {
														setConceptLearning({...conceptLearning, characterIds: [...conceptLearning.characterIds, char.id]});
													}
												}}
											>
												<View style={{ alignItems: 'center', gap: 8 }}>
													<Image 
														source={{ uri: char.avatarUrl }} 
														style={{ 
															width: 80, 
															height: 80, 
															borderRadius: 40, 
															borderWidth: 3, 
															borderColor: isSelected ? tokens.color.primary.default : 'transparent' 
														}} 
													/>
													<Text weight="medium">{char.name}</Text>
												</View>
											</TouchableOpacity>
										);
									})}
									
									<TouchableOpacity 
										onPress={() => {
											setAvatarStep('upload');
											setCharacterName('');
											setSelectedPhoto(null);
											setAvatarModalVisible(true);
										}}
										style={{
											width: 80,
											height: 80,
											borderRadius: 40,
											backgroundColor: tokens.color.surface,
											borderWidth: 2,
											borderColor: tokens.color.border.default,
											borderStyle: 'dashed',
											alignItems: 'center',
											justifyContent: 'center'
										}}
									>
										<Ionicons name="add" size={32} color={tokens.color.text.secondary} />
									</TouchableOpacity>
								</View>
								
								{/* Option to skip characters */}
								{conceptLearning.characterIds.length === 0 && (
									<View style={{ 
										backgroundColor: "#F3E8FF", 
										borderRadius: tokens.radius.lg,
										padding: 16,
										marginBottom: 20,
										flexDirection: 'row',
										alignItems: 'center'
									}}>
										<Ionicons name="information-circle" size={20} color={tokens.color.primary.default} style={{ marginRight: 10 }} />
										<View style={{ flex: 1 }}>
											<Text size="sm" weight="semibold">No characters selected</Text>
											<Text size="xs" color="secondary">You can skip this step for a generic story</Text>
										</View>
									</View>
								)}

								<View style={{ flexDirection: 'row', gap: 12 }}>
									<TouchableOpacity 
										onPress={() => setStoryWizardStep(conceptLearning.mode === 'advanced' ? 'advanced-options' : 'mode-selection')}
										style={{ flex: 1, padding: 12, alignItems: 'center' }}
									>
										<Text style={{ color: tokens.color.text.secondary }}>Back</Text>
									</TouchableOpacity>
									<GradientButton 
										title={conceptLearning.characterIds.length === 0 ? "Skip & Continue" : "Generate Story"}
										onPress={() => setStoryWizardStep('text-generation')}
										style={{ flex: 2 }}
									/>
								</View>
							</>
						)}

						{storyWizardStep === 'text-generation' && (
							<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 }}>
								<ActivityIndicator size="large" color={tokens.color.primary.default} style={{ marginBottom: 20 }} />
								<Text size="h3" weight="bold">Creating Your Learning Story</Text>
								<Text color="secondary" style={{ textAlign: 'center', marginHorizontal: 20 }}>Generating a story about "{conceptLearning.concept}" for your child...</Text>
								<View style={{ width: 200, height: 4, backgroundColor: tokens.color.border.default, borderRadius: 2, marginTop: 20 }}>
									<View style={{ width: `${simulatedProgress}%`, height: '100%', backgroundColor: tokens.color.primary.default, borderRadius: 2 }} />
								</View>
								
								{/* Show completion message when progress is 100% */}
								{simulatedProgress >= 100 && (
									<View style={{ marginTop: 20, alignItems: 'center' }}>
										<View style={{ flexDirection: 'row', alignItems: 'center' }}>
											<Ionicons name="checkmark-circle" size={20} color={tokens.color.support.green} style={{ marginRight: 8 }} />
											<Text style={{ color: tokens.color.support.green, fontWeight: '600' }}>Story created! Moving to next step...</Text>
										</View>
									</View>
								)}
							</View>
						)}

						{storyWizardStep === 'text-editing' && (
							<>
								<Text size="h2" weight="bold" style={{ marginBottom: tokens.spacing.gap.md }}>Edit Your Story</Text>
								<Text color="secondary" style={{ marginBottom: 20 }}>Review and customize each page of your story. Tap any page to edit the text.</Text>
								
								<ScrollView style={{ maxHeight: 400, marginBottom: 20 }}>
									{conceptLearning.storyPages?.map((page, index) => (
										<View key={page.pageNumber} style={{
											backgroundColor: tokens.color.surface,
											borderRadius: tokens.radius.lg,
											padding: 16,
											marginBottom: 12,
											borderWidth: 1,
											borderColor: page.isEdited ? tokens.color.primary.default : tokens.color.border.default
										}}>
											<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
												<Text weight="semibold">Page {page.pageNumber}</Text>
												{page.isEdited && (
													<View style={{ flexDirection: 'row', alignItems: 'center' }}>
														<Ionicons name="checkmark-circle" size={16} color={tokens.color.primary.default} />
														<Text size="xs" color="primary" style={{ marginLeft: 4 }}>Edited</Text>
													</View>
												)}
											</View>
											<TextInput
												value={page.text}
												onChangeText={(text) => {
													const updatedPages = conceptLearning.storyPages?.map(p => 
														p.pageNumber === page.pageNumber 
															? { ...p, text, isEdited: true }
															: p
													) || [];
													setConceptLearning({ ...conceptLearning, storyPages: updatedPages });
												}}
												multiline
												style={{
													borderWidth: 1,
													borderColor: tokens.color.border.default,
													borderRadius: tokens.radius.md,
													padding: 12,
													minHeight: 60,
													fontSize: 14,
													lineHeight: 20
												}}
											/>
										</View>
									))}
								</ScrollView>

								<View style={{ flexDirection: 'row', gap: 12 }}>
									<TouchableOpacity 
										onPress={() => setStoryWizardStep('character-selection')}
										style={{ flex: 1, padding: 12, alignItems: 'center' }}
									>
										<Text style={{ color: tokens.color.text.secondary }}>Back</Text>
									</TouchableOpacity>
									<GradientButton 
										title="Generate Images"
										onPress={async () => {
											// Generate story summary and context
											const summary = `A learning story about ${conceptLearning.concept} for ${profile?.childName || 'a child'}`;
											const imageContext = `Child-friendly illustrations for a story teaching ${conceptLearning.concept}`;
											
											setConceptLearning({
												...conceptLearning,
												storySummary: summary,
												imageContext: imageContext
											});
											
											setStoryWizardStep('review');
											
											// Create the actual story using the existing createStory function
											const selectedCharacterNames = characters
												.filter(char => conceptLearning.characterIds.includes(char.id))
												.map(char => char.name);
											
											// Get child profile info if child is included as character
											let childProfile = undefined;
											if (conceptLearning.includeChildAsCharacter && conceptLearning.childProfileId) {
												const profile = useMemoriesStore.getState().profile;
												if (profile && profile.id === conceptLearning.childProfileId) {
													childProfile = {
														id: profile.id,
														name: profile.childName,
														includeAsCharacter: true
													};
												}
											}
											
											try {
												await createStory({
													title: `Learning About ${conceptLearning.concept}`,
													description: summary,
													characterIds: conceptLearning.characterIds,
													pageCount: conceptLearning.storyPages?.length || (conceptLearning.advanced?.pageCount || 5),
													concept: conceptLearning.concept,
													childProfile: childProfile,
													advanced: conceptLearning.advanced
												});
												setStoryModalVisible(false);
												setStoryViewerVisible(true);
											} catch (error) {
												console.error('Failed to create story:', error);
											}
										}}
										style={{ flex: 2 }}
									/>
								</View>
							</>
						)}

						{storyWizardStep === 'review' && (
							<>
								<Text size="h2" weight="bold" style={{ marginBottom: tokens.spacing.gap.md }}>Story Complete!</Text>
								<Text color="secondary" style={{ marginBottom: 20 }}>Your learning story has been created and is ready to view.</Text>
								
								<View style={{ 
									backgroundColor: tokens.color.surface, 
									borderRadius: tokens.radius.lg, 
									padding: 20, 
									marginBottom: 20,
									borderWidth: 1,
									borderColor: tokens.color.border.default
								}}>
									<Text weight="semibold" style={{ marginBottom: 8 }}>Story Summary</Text>
									<Text color="secondary" style={{ marginBottom: 12 }}>{conceptLearning.storySummary}</Text>
									
									<Text weight="semibold" style={{ marginBottom: 8 }}>Learning Focus</Text>
									<Text color="secondary" style={{ marginBottom: 12 }}>Teaching: {conceptLearning.concept}</Text>
									
									<Text weight="semibold" style={{ marginBottom: 8 }}>Characters</Text>
									<Text color="secondary">
										{characters
											.filter(char => conceptLearning.characterIds.includes(char.id))
											.map(char => char.name)
											.join(', ')}
									</Text>
								</View>

								<GradientButton 
									title="View Your Story"
									onPress={() => {
										setStoryModalVisible(false);
										// Story viewer will open automatically from the createStory success
									}}
								/>
							</>
						)}
					</View>
				</ScrollView>
			</View>
		</Modal>
	);

	const renderStoryViewerModal = () => {
		const { width: screenWidth, height: screenHeight } = require('react-native').Dimensions.get('window');
		const [currentPageIndex, setCurrentPageIndex] = useState(0);
		
		return (
			<Modal visible={isStoryViewerVisible} animationType="slide">
				<View style={{ flex: 1, backgroundColor: 'black' }}>
					{/* Header with close button and page indicator */}
					<View style={{ 
						position: 'absolute', 
						top: 60, 
						left: 20, 
						right: 20, 
						zIndex: 10, 
						flexDirection: 'row', 
						justifyContent: 'space-between', 
						alignItems: 'center' 
					}}>
						<View style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 15, padding: 8, paddingHorizontal: 12 }}>
							<Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
								{currentStory ? `${currentPageIndex + 1} / ${currentStory.pages.length}` : ''}
							</Text>
						</View>
						<TouchableOpacity 
							onPress={() => setStoryViewerVisible(false)} 
							style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 15, padding: 8 }}
						>
							<Ionicons name="close" size={24} color="white" />
						</TouchableOpacity>
					</View>
					
					{currentStory && currentStory.pages && currentStory.pages.length > 0 ? (
						<FlatList
							data={currentStory.pages}
							horizontal
							pagingEnabled
							showsHorizontalScrollIndicator={false}
							keyExtractor={(_, index) => index.toString()}
							style={{ flex: 1 }}
							onMomentumScrollEnd={(event) => {
								const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
								setCurrentPageIndex(index);
							}}
							renderItem={({ item, index }) => (
								<View style={{ width: screenWidth, height: screenHeight, alignItems: 'center', justifyContent: 'center' }}>
									{item.imageUrl ? (
										<Image 
											source={{ uri: item.imageUrl }} 
											style={{ 
												width: screenWidth, 
												height: screenHeight,
												resizeMode: 'cover'
											}} 
											onError={(error) => console.log('Image load error:', error)}
										/>
									) : (
										<View style={{ 
											width: screenWidth, 
											height: screenHeight, 
											backgroundColor: '#333', 
											alignItems: 'center', 
											justifyContent: 'center' 
										}}>
											<Ionicons name="image-outline" size={100} color="#666" />
											<Text style={{ color: '#666', marginTop: 20 }}>No image available</Text>
										</View>
									)}
									
									{/* Refine Image Button */}
									<TouchableOpacity 
										onPress={() => { 
											setPageToRefine(index); 
											setRefinementPrompt(''); 
											setRefineModalVisible(true); 
										}} 
										style={{ 
											position: 'absolute', 
											top: 120, 
											right: 20, 
											backgroundColor: 'rgba(0,0,0,0.7)', 
											padding: 10, 
											borderRadius: tokens.radius.lg, 
											flexDirection: 'row', 
											alignItems: 'center', 
											gap: 8 
										}}
									>
										<Ionicons name="color-wand" size={16} color="white" />
										<Text style={{ color: 'white', fontSize: 12 }}>Refine Image</Text>
									</TouchableOpacity>
									
									{/* Story Text Overlay */}
									<LinearGradient
										colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
										style={{ 
											position: 'absolute', 
											bottom: 0, 
											left: 0, 
											right: 0, 
											paddingTop: 60,
											paddingHorizontal: 40, 
											paddingBottom: 60
										}}
									>
										<Text style={{ 
											color: 'white', 
											fontSize: 18, 
											textAlign: 'center',
											lineHeight: 24,
											fontWeight: '500',
											textShadowColor: 'rgba(0,0,0,0.8)',
											textShadowOffset: { width: 0, height: 1 },
											textShadowRadius: 3
										}}>
											{item.text}
										</Text>
									</LinearGradient>
								</View>
							)}
						/>
					) : (
						<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
							<Text style={{ color: 'white', fontSize: 18 }}>No story pages to display</Text>
						</View>
					)}
				</View>
			</Modal>
		);
	};

	const renderRefineModal = () => (
		<Modal visible={isRefineModalVisible} animationType="fade" transparent>
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
				<View style={{ width: '90%', backgroundColor: 'white', borderRadius: tokens.radius.xl, padding: tokens.spacing.gap.lg }}>
					<TouchableOpacity onPress={() => setRefineModalVisible(false)} style={{ alignSelf: 'flex-end' }}>
						<Ionicons name="close-circle" size={24} color={tokens.color.text.secondary} />
					</TouchableOpacity>
					<Text size="h3" weight="bold" style={{ marginBottom: 8 }}>Refine Illustration</Text>
					{currentStory && currentStory.pages[pageToRefine] && (
						<>
							<Image source={{ uri: currentStory.pages[pageToRefine].imageUrl }} style={{ width: '100%', height: 200, borderRadius: tokens.radius.lg, marginBottom: 16 }} />
							<Text color="secondary" style={{ marginBottom: 16 }}>Describe the change you'd like to see. For example, "make the sky night-time" or "add a friendly dragon".</Text>
							<TextInput 
								placeholder="Your refinement request..." 
								value={refinementPrompt}
								onChangeText={setRefinementPrompt}
								style={{ borderWidth: 1, borderColor: tokens.color.border.default, borderRadius: tokens.radius.md, padding: 12, marginBottom: 16 }} 
							/>
							<GradientButton 
								title="Update Image" 
								disabled={!refinementPrompt.trim()}
								onPress={async () => {
									if (currentStory && refinementPrompt.trim()) {
										try {
											await refineStoryImage(currentStory.id, pageToRefine, refinementPrompt.trim());
											setRefineModalVisible(false);
											setRefinementPrompt('');
										} catch (error) {
											console.error('Failed to refine image:', error);
										}
									}
								}} 
							/>
						</>
					)}
				</View>
			</View>
		</Modal>
	);


	return (
		<LinearGradient
			colors={['#7C3AED', '#EC4899', '#FB923C']}
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
			style={{ flex: 1 }}
		>
			{renderHeader()}
			{renderSegmentedControl()}
			
			<View style={{ flex: 1, backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 20 }}>
				{activeTab === 'stories' ? renderStoriesTab() : renderCharactersTab()}
			</View>

			{/* --- Modals for creation flows --- */}
			{renderAvatarCreationModal()}
			{renderStoryCreationModal()}
			{renderStoryViewerModal()}
			{renderRefineModal()}
		</LinearGradient>
	);
}
