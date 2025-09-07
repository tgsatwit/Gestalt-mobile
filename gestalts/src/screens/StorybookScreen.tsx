import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Image, FlatList, Modal, Alert, ActivityIndicator, Text as RNText } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '../components/GradientButton';
import { useStorybookStore } from '../state/useStorybookStore';
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
	
	// Add mounting ref to prevent state updates on unmounted component
	const isMounted = useRef(true);
	
	useEffect(() => {
		return () => {
			isMounted.current = false;
		};
	}, []);

	// --- Zustand Store ---
	const {
		characters,
		gestaltsCharacters,
		stories,
		currentStory,
		generationProgress,
		error,
		loadCharacters,
		loadGestaltsCharacters,
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
	const [isRegenerateModalVisible, setRegenerateModalVisible] = useState(false);
	const [isPageRegenerateModalVisible, setPageRegenerateModalVisible] = useState(false);

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
			density: 'multiple-sentences',
			narrative: 'third-person',
			pageCount: 6,
			complexity: 'simple',
			communicationStyle: 'balanced',
			tone: 'playful',
			goal: 'Keep sentences to 10-12 words maximum, use simple vocabulary suitable for young children'
		}
	});
	
	// Legacy form states (for existing functionality)
	const [pageToRefine, setPageToRefine] = useState(0);
	const [characterName, setCharacterName] = useState('');
	const [refinementPrompt, setRefinementPrompt] = useState('');
	const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
	const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
	
	// Regeneration states
	const [regenerationPrompt, setRegenerationPrompt] = useState('');
	const [pageToRegenerate, setPageToRegenerate] = useState(0);
	const [isRegenerating, setIsRegenerating] = useState(false);
	
	// Story viewer state
	const [currentPageIndex, setCurrentPageIndex] = useState(0);
	
	// Menu state for story options
	const [openMenuId, setOpenMenuId] = useState<string | null>(null);
	
	// Story page component to avoid hook violations
	const StoryPageComponent = ({ item, index, screenWidth, screenHeight }: { item: any, index: number, screenWidth: number, screenHeight: number }) => {
		const [imageLoading, setImageLoading] = useState(true);
		const [imageError, setImageError] = useState(false);
		
		return (
			<View style={{ width: screenWidth, height: screenHeight, alignItems: 'center', justifyContent: 'center' }}>
				{item.imageUrl && !imageError ? (
					<>
						<Image 
							source={{ uri: item.imageUrl }} 
							style={{ 
								width: screenWidth, 
								height: screenHeight,
								resizeMode: 'cover'
							}} 
							onLoad={() => setImageLoading(false)}
							onError={(error) => {
								console.log('Image load error:', error);
								console.log('Failed image URL:', item.imageUrl);
								setImageError(true);
								setImageLoading(false);
							}}
						/>
						{imageLoading && (
							<View style={{ 
								position: 'absolute',
								width: screenWidth, 
								height: screenHeight, 
								backgroundColor: '#222', 
								alignItems: 'center', 
								justifyContent: 'center' 
							}}>
								<ActivityIndicator size="large" color="white" />
								<Text style={{ color: 'white', marginTop: 20 }}>Loading image...</Text>
							</View>
						)}
					</>
				) : (
					<View style={{ 
						width: screenWidth, 
						height: screenHeight, 
						backgroundColor: '#333', 
						alignItems: 'center', 
						justifyContent: 'center' 
					}}>
						<Ionicons name="image-outline" size={100} color="#666" />
						<Text style={{ color: '#666', marginTop: 20 }}>
							{imageError ? 'Failed to load image' : 'No image available'}
						</Text>
						{imageError && (
							<Text style={{ color: '#666', marginTop: 10, textAlign: 'center', paddingHorizontal: 20, fontSize: 12 }}>
								{item.imageUrl}
							</Text>
						)}
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
		);
	};
	
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

	// Generate avatar from photo using AI
	const generateAvatarFromPhoto = async () => {
		if (!selectedPhoto) return;
		
		try {
			console.log('🎨 Starting avatar generation...');
			
			// Convert photo to base64 for AI processing
			const base64Photo = await convertImageToBase64(selectedPhoto);
			console.log('📸 Photo converted to base64 successfully');
			
			// Import geminiService
			const geminiService = require('../services/geminiService').default;
			
			// Generate avatar using AI with enhanced prompt
			console.log('🤖 Calling AI service for avatar generation...');
			const avatarResult = await geminiService.generateAvatar({
				photoData: base64Photo,
				characterName: characterName || 'Character',
				style: 'pixar'
			});
			
			console.log('✅ Avatar generation completed:', typeof avatarResult);
			
			// Handle the result (could be string URL or object with imageUrl)
			const avatarUrl = typeof avatarResult === 'string' ? avatarResult : avatarResult.imageUrl;
			console.log('🖼️ Avatar URL generated:', avatarUrl);
			
			setGeneratedAvatar(avatarUrl);
			setAvatarStep('review');
		} catch (error) {
			console.error('❌ Avatar generation failed:', error);
			Alert.alert(
				'Avatar Generation Failed', 
				'Unable to create avatar at this time. This could be due to API limits or temporary service issues. The avatar feature is in development.',
				[{ text: 'OK' }]
			);
			setAvatarStep('upload');
		}
	};
	
	// Convert image URI to base64
	const convertImageToBase64 = async (imageUri: string): Promise<string> => {
		try {
			const base64 = await require('expo-file-system').readAsStringAsync(imageUri, {
				encoding: require('expo-file-system').EncodingType.Base64,
			});
			return `data:image/jpeg;base64,${base64}`;
		} catch (error) {
			console.error('Failed to convert image to base64:', error);
			throw error;
		}
	};

	// --- Effects ---
	useEffect(() => {
		// Load data when component mounts
		loadCharacters();
		loadGestaltsCharacters();
		loadStories();
	}, []);

	// Story regeneration functions
	const regenerateEntireStory = async (customPrompt?: string) => {
		try {
			setIsRegenerating(true);
			
			// Get character names for story generation (from both user and Gestalts characters)
			const allAvailableCharacters = [...characters, ...gestaltsCharacters];
			const selectedCharacters = allAvailableCharacters.filter(char => 
				conceptLearning.characterIds.includes(char.id)
			);
			const characterNames = selectedCharacters.map(char => char.name);

			// Include child as character if selected
			const allCharacterNames = [...characterNames];
			if (conceptLearning.includeChildAsCharacter && profile?.childName) {
				allCharacterNames.push(profile.childName);
			}

			// Generate unique contextual title based on story content
			let storyTitle = conceptLearning.title;
			if (!storyTitle) {
				const mainCharacter = profile?.childName || allCharacterNames[0] || 'a child';
				const conceptTitle = conceptLearning.concept.charAt(0).toUpperCase() + conceptLearning.concept.slice(1);
				
				// Create unique title variations based on concept and characters
				const titleVariations = [
					`${mainCharacter} and the ${conceptTitle} Adventure`,
					`${mainCharacter}'s ${conceptTitle} Journey`,
					`How ${mainCharacter} Discovered ${conceptTitle}`,
					`${mainCharacter} Learns About ${conceptTitle}`,
					`The Day ${mainCharacter} Found ${conceptTitle}`,
					`${mainCharacter}'s ${conceptTitle} Story`
				];
				
				// Use a simple hash of the concept + character names to pick a consistent but varied title
				const titleHash = (conceptLearning.concept + allCharacterNames.join('')).split('').reduce((a, b) => {
					a = ((a << 5) - a) + b.charCodeAt(0);
					return a & a;
				}, 0);
				
				storyTitle = titleVariations[Math.abs(titleHash) % titleVariations.length];
			}

			// Import geminiService
			const geminiService = require('../services/geminiService').default;
			
			// Regenerate story text using Gemini
			const storyTexts = await geminiService.regenerateEntireStory(
				storyTitle,
				`A learning story about ${conceptLearning.concept}`,
				allCharacterNames,
				conceptLearning.advanced?.pageCount || 5,
				customPrompt,
				{
					concept: conceptLearning.concept,
					childName: conceptLearning.includeChildAsCharacter ? profile?.childName : undefined,
					advanced: conceptLearning.advanced
				}
			);

			// Convert to StoryPageDraft format
			const storyPages: typeof conceptLearning.storyPages = storyTexts.map((text: string, index: number) => ({
				pageNumber: index + 1,
				text,
				isEdited: false, // Mark as not edited since this is a fresh generation
				visualContext: {
					characters: allCharacterNames,
					setting: `Scene ${index + 1}`,
					action: text.substring(0, 100) + '...',
					previousPageVisualNotes: index > 0 ? `Previous: ${storyTexts[index - 1].substring(0, 50)}...` : undefined
				}
			}));

			// Update concept learning with regenerated content
			setConceptLearning(prevState => ({
				...prevState,
				title: storyTitle,
				storyPages,
				storySummary: `A story about ${conceptLearning.concept} featuring ${allCharacterNames.join(', ')}`,
				sceneContext: {
					setting: 'A warm, child-friendly environment',
					mood: conceptLearning.advanced?.tone || 'gentle',
					colorPalette: ['warm', 'bright', 'friendly'],
					visualStyle: 'Pixar-style 3D animation'
				}
			}));

		} catch (error) {
			console.error('Story regeneration failed:', error);
			Alert.alert('Error', 'Failed to regenerate story. Please try again.');
		} finally {
			setIsRegenerating(false);
		}
	};

	const regenerateSinglePage = async (pageNumber: number, customPrompt?: string) => {
		try {
			setIsRegenerating(true);
			
			// Get character names
			const selectedCharacters = characters.filter(char => 
				conceptLearning.characterIds.includes(char.id)
			);
			const characterNames = selectedCharacters.map(char => char.name);

			// Include child as character if selected
			const allCharacterNames = [...characterNames];
			if (conceptLearning.includeChildAsCharacter && profile?.childName) {
				allCharacterNames.push(profile.childName);
			}

			const storyTitle = conceptLearning.title || 'Learning Story';
			const previousPages = conceptLearning.storyPages?.slice(0, pageNumber - 1).map(p => p.text) || [];
			
			// Import geminiService
			const geminiService = require('../services/geminiService').default;
			
			// Regenerate the specific page
			const newPageText = await geminiService.regenerateStoryPage(
				storyTitle,
				pageNumber,
				conceptLearning.storyPages?.length || 5,
				allCharacterNames,
				conceptLearning.concept,
				customPrompt,
				previousPages
			);

			// Update the specific page in conceptLearning
			if (conceptLearning.storyPages) {
				const updatedPages = conceptLearning.storyPages.map(page => 
					page.pageNumber === pageNumber 
						? { ...page, text: newPageText, isEdited: false } // Mark as not edited since this is a fresh generation
						: page
				);
				
				setConceptLearning(prevState => ({
					...prevState,
					storyPages: updatedPages
				}));
			}

		} catch (error) {
			console.error('Page regeneration failed:', error);
			Alert.alert('Error', 'Failed to regenerate page. Please try again.');
		} finally {
			setIsRegenerating(false);
		}
	};

	// Real story generation function
	const generateStoryContent = async () => {
		try {
			// Get character names for story generation (from both user and Gestalts characters)
			const allAvailableCharacters = [...characters, ...gestaltsCharacters];
			const selectedCharacters = allAvailableCharacters.filter(char => 
				conceptLearning.characterIds.includes(char.id)
			);
			const characterNames = selectedCharacters.map(char => char.name);

			// Include child as character if selected
			const allCharacterNames = [...characterNames];
			if (conceptLearning.includeChildAsCharacter && profile?.childName) {
				allCharacterNames.push(profile.childName);
			}

			// Generate unique contextual title based on story content
			let storyTitle = conceptLearning.title;
			if (!storyTitle) {
				const mainCharacter = profile?.childName || allCharacterNames[0] || 'a child';
				const conceptTitle = conceptLearning.concept.charAt(0).toUpperCase() + conceptLearning.concept.slice(1);
				
				// Create unique title variations based on concept and characters
				const titleVariations = [
					`${mainCharacter} and the ${conceptTitle} Adventure`,
					`${mainCharacter}'s ${conceptTitle} Journey`,
					`How ${mainCharacter} Discovered ${conceptTitle}`,
					`${mainCharacter} Learns About ${conceptTitle}`,
					`The Day ${mainCharacter} Found ${conceptTitle}`,
					`${mainCharacter}'s ${conceptTitle} Story`
				];
				
				// Use a simple hash of the concept + character names to pick a consistent but varied title
				const titleHash = (conceptLearning.concept + allCharacterNames.join('')).split('').reduce((a, b) => {
					a = ((a << 5) - a) + b.charCodeAt(0);
					return a & a;
				}, 0);
				
				storyTitle = titleVariations[Math.abs(titleHash) % titleVariations.length];
			}

			// Import geminiService
			const geminiService = require('../services/geminiService').default;
			
			// Generate story text using Gemini
			const storyTexts = await geminiService.generateStoryText(
				storyTitle,
				`A learning story about ${conceptLearning.concept}`,
				allCharacterNames,
				conceptLearning.advanced?.pageCount || 5,
				{
					concept: conceptLearning.concept,
					childName: conceptLearning.includeChildAsCharacter ? profile?.childName : undefined,
					advanced: conceptLearning.advanced
				}
			);

			// Convert to StoryPageDraft format
			const storyPages: typeof conceptLearning.storyPages = storyTexts.map((text: string, index: number) => ({
				pageNumber: index + 1,
				text,
				isEdited: false,
				visualContext: {
					characters: allCharacterNames,
					setting: `Scene ${index + 1}`,
					action: text.substring(0, 100) + '...',
					previousPageVisualNotes: index > 0 ? `Previous: ${storyTexts[index - 1].substring(0, 50)}...` : undefined
				}
			}));

			// Update concept learning with generated content
			setConceptLearning(prevState => ({
				...prevState,
				title: storyTitle,
				storyPages,
				storySummary: `A story about ${conceptLearning.concept} featuring ${allCharacterNames.join(', ')}`,
				sceneContext: {
					setting: 'A warm, child-friendly environment',
					mood: conceptLearning.advanced?.tone || 'gentle',
					colorPalette: ['warm', 'bright', 'friendly'],
					visualStyle: 'Pixar-style 3D animation'
				}
			}));

			// Advance to text editing step
			setStoryWizardStep('text-editing');
		} catch (error) {
			console.error('Story generation failed:', error);
			// Set error and revert to mode selection
			setStoryWizardStep('mode-selection');
		}
	};

	// Trigger real story generation when entering text-generation step
	useEffect(() => {
		if (storyWizardStep === 'text-generation') {
			generateStoryContent();
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
							// If error occurred during story generation, revert to mode selection
							if (storyWizardStep === 'text-generation' || storyWizardStep === 'image-generation') {
								setStoryWizardStep('mode-selection');
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
						onPress={() => navigation.goBack()}
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
			<ScrollView 
				contentContainerStyle={{ padding: tokens.spacing.containerX, paddingBottom: 100 }}
				onScrollBeginDrag={() => setOpenMenuId(null)}
			>
				<Text size="h2" weight="bold" style={{ marginBottom: tokens.spacing.gap.sm }}>Your Library</Text>
				<Text color="secondary" style={{ marginBottom: tokens.spacing.gap.lg }}>
					Revisit your magical adventures or create a new one.
				</Text>
				
				{/* Empty state when no stories exist */}
				{stories.length === 0 && (
					<View style={{
						alignItems: 'center',
						justifyContent: 'center',
						paddingVertical: 60,
						paddingHorizontal: tokens.spacing.gap.lg
					}}>
						<View style={{
							width: 80,
							height: 80,
							borderRadius: 40,
							backgroundColor: 'rgba(124, 58, 237, 0.1)',
							alignItems: 'center',
							justifyContent: 'center',
							marginBottom: tokens.spacing.gap.lg
						}}>
							<Ionicons name="library-outline" size={40} color={tokens.color.primary.default} />
						</View>
						<Text weight="semibold" size="h3" style={{ 
							textAlign: 'center', 
							marginBottom: tokens.spacing.gap.sm,
							color: tokens.color.text.primary
						}}>
							No stories yet
						</Text>
						<Text color="secondary" style={{ 
							textAlign: 'center', 
							marginBottom: tokens.spacing.gap.lg,
							maxWidth: 250
						}}>
							Create your first story and watch it come to life with magical illustrations!
						</Text>
						<GradientButton
							title="Create Your First Story"
							onPress={() => {
								resetProgress();
								setConceptLearning({
									concept: '',
									includeChildAsCharacter: false,
									mode: 'simple',
									characterIds: []
								});
								setStoryWizardStep('character-selection');
								setStoryModalVisible(true);
							}}
							style={{ paddingHorizontal: tokens.spacing.gap.lg }}
						/>
					</View>
				)}
				
				{/* Stories list */}
				{stories.map(story => {
					const isGenerating = story.status === 'generating' || story.status === 'draft';
					const isComplete = story.status === 'complete';
					const hasError = story.status === 'error';
					
					return (
						<View key={story.id} style={{
							flexDirection: 'row',
							alignItems: 'center',
							backgroundColor: isGenerating ? 'rgba(124, 58, 237, 0.05)' : tokens.color.surface,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.md,
							marginBottom: tokens.spacing.gap.sm,
							borderColor: isGenerating ? tokens.color.primary.default : tokens.color.border.default,
							borderWidth: isGenerating ? 1 : 1,
							borderStyle: isGenerating ? 'dashed' : 'solid',
							opacity: isGenerating ? 0.7 : 1
						}}>
							<TouchableOpacity 
								onPress={() => { 
									if (isComplete) {
										setCurrentStory(story); 
										setStoryViewerVisible(true);
									} else if (isGenerating) {
										// Show generating message
										Alert.alert(
											'Story Still Creating', 
											'This story is still being created with custom illustrations. Please check back in a few minutes!',
											[{ text: 'OK' }]
										);
									}
								}}
								style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
								disabled={isGenerating}
							>
								{/* Cover Image or Placeholder */}
								{isComplete && story.coverUrl ? (
									<Image source={{ uri: story.coverUrl }} style={{ width: 80, height: 80, borderRadius: tokens.radius.md, marginRight: tokens.spacing.gap.md }} />
								) : (
									<View style={{
										width: 80,
										height: 80,
										borderRadius: tokens.radius.md,
										marginRight: tokens.spacing.gap.md,
										backgroundColor: isGenerating ? 'rgba(124, 58, 237, 0.1)' : tokens.color.border.default,
										alignItems: 'center',
										justifyContent: 'center'
									}}>
										{isGenerating ? (
											<ActivityIndicator size="small" color={tokens.color.primary.default} />
										) : hasError ? (
											<Ionicons name="alert-circle" size={32} color="#EF4444" />
										) : (
											<Ionicons name="image-outline" size={32} color={tokens.color.text.secondary} />
										)}
									</View>
								)}
								
								<View style={{ flex: 1 }}>
									<Text weight="semibold" size="body" style={{ color: isGenerating ? tokens.color.primary.default : tokens.color.text.primary }}>
										{story.title}
									</Text>
									<Text color="secondary" size="sm">
										{isGenerating ? (
											<View style={{ flexDirection: 'row', alignItems: 'center' }}>
												<Text size="sm" style={{ color: tokens.color.primary.default }}>Generating story...</Text>
												{story.generationProgress && (
													<Text size="sm" style={{ color: tokens.color.primary.default, marginLeft: 4 }}>
														({Math.round(story.generationProgress)}%)
													</Text>
												)}
											</View>
										) : hasError ? (
											'Generation failed'
										) : (
											`Created ${story.createdAt instanceof Date ? 
												story.createdAt.toLocaleDateString('en-US', { 
													month: 'short', 
													day: 'numeric', 
													year: 'numeric' 
												}) : 
												'Recently'
											}`
										)}
									</Text>
								</View>
								
								{isGenerating ? (
									<View style={{ 
										width: 8, 
										height: 8, 
										borderRadius: 4, 
										backgroundColor: tokens.color.primary.default 
									}} />
								) : null}
							</TouchableOpacity>
							
							{/* Ellipsis menu - only show for completed or error stories */}
							{(isComplete || hasError) && (
								<View style={{ position: 'relative' }}>
									<TouchableOpacity 
										onPress={(e) => {
											e.stopPropagation();
											setOpenMenuId(openMenuId === story.id ? null : story.id);
										}}
										style={{
											padding: 8,
											marginLeft: 8
										}}
									>
										<Ionicons name="ellipsis-horizontal" size={20} color={tokens.color.text.secondary} />
									</TouchableOpacity>
									
									{/* Dropdown menu */}
									{openMenuId === story.id && (
										<View style={{
											position: 'absolute',
											top: 40,
											right: 0,
											backgroundColor: 'white',
											borderRadius: tokens.radius.md,
											shadowColor: '#000',
											shadowOffset: { width: 0, height: 2 },
											shadowOpacity: 0.1,
											shadowRadius: 8,
											elevation: 4,
											borderWidth: 1,
											borderColor: tokens.color.border.default,
											minWidth: 120,
											zIndex: 1000
										}}>
											{/* Edit option */}
											<TouchableOpacity 
												onPress={() => {
													setOpenMenuId(null);
													// TODO: Implement edit functionality
													Alert.alert('Edit Story', 'Edit functionality will be implemented soon.');
												}}
												style={{
													flexDirection: 'row',
													alignItems: 'center',
													padding: 12,
													gap: 8
												}}
											>
												<Ionicons name="pencil-outline" size={16} color={tokens.color.text.primary} />
												<Text>Edit</Text>
											</TouchableOpacity>
											
											{/* Separator */}
											<View style={{ height: 1, backgroundColor: tokens.color.border.default, marginHorizontal: 8 }} />
											
											{/* Delete option */}
											<TouchableOpacity 
												onPress={() => {
													setOpenMenuId(null);
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
													flexDirection: 'row',
													alignItems: 'center',
													padding: 12,
													gap: 8
												}}
											>
												<Ionicons name="trash-outline" size={16} color="#EF4444" />
												<Text style={{ color: '#EF4444' }}>Delete</Text>
											</TouchableOpacity>
										</View>
									)}
								</View>
							)}
						</View>
					);
				})}
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
						setStoryWizardStep('character-selection');
						setStoryModalVisible(true);
					}}
				/>
			</View>
		</View>
	);

	const renderCharactersTab = () => (
		<View style={{ flex: 1 }}>
			<ScrollView contentContainerStyle={{ padding: tokens.spacing.containerX, paddingBottom: 100 }}>
				{/* My Characters Section */}
				<Text size="h2" weight="bold" style={{ marginBottom: tokens.spacing.gap.sm }}>My Characters</Text>
				<Text color="secondary" style={{ marginBottom: tokens.spacing.gap.lg }}>
					Create and manage personalized avatars for your stories.
				</Text>
				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.gap.md, marginBottom: tokens.spacing.gap.lg * 2 }}>
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
						setGeneratedAvatar(null);
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

				{/* Gestalts Characters Section */}
				<Text size="h2" weight="bold" style={{ marginBottom: tokens.spacing.gap.sm }}>Gestalts Characters</Text>
				<Text color="secondary" style={{ marginBottom: tokens.spacing.gap.lg }}>
					Ready-to-use characters for your stories.
				</Text>
				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.gap.md }}>
					{gestaltsCharacters.map((char: Character) => (
						<View key={char.id} style={{ alignItems: 'center', gap: tokens.spacing.gap.xs }}>
							<View style={{ position: 'relative' }}>
								<Image 
									source={{ uri: char.avatarUrl }} 
									style={{ width: 100, height: 100, borderRadius: 50 }} 
									onError={(error) => {
										console.log('Gestalts character image load error:', error);
										console.log('Failed character image URL:', char.avatarUrl);
										console.log('Character:', char.name, 'ID:', char.id);
									}}
									onLoad={() => {
										console.log('Gestalts character image loaded successfully:', char.name, char.avatarUrl);
									}}
								/>
								<View style={{ 
									position: 'absolute', 
									bottom: -2, 
									right: -2, 
									backgroundColor: tokens.color.primary.default, 
									borderRadius: 10, 
									width: 20, 
									height: 20, 
									alignItems: 'center', 
									justifyContent: 'center',
									borderWidth: 2,
									borderColor: 'white'
								}}>
									<Ionicons name="star" size={12} color="white" />
								</View>
							</View>
							<Text weight="medium">{char.name}</Text>
						</View>
					))}
				</View>
			</ScrollView>
		</View>
	);

	// --- Modals for Flows ---

	const renderAvatarCreationModal = () => (
		<Modal visible={isAvatarModalVisible} animationType="slide" transparent>
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
				<View style={{ width: '90%', backgroundColor: 'white', borderRadius: tokens.radius.xl, padding: tokens.spacing.gap.lg }}>
					<TouchableOpacity onPress={() => isMounted.current && setAvatarModalVisible(false)} style={{ alignSelf: 'flex-end' }}>
						<Ionicons name="close-circle" size={24} color={tokens.color.text.secondary} />
					</TouchableOpacity>
					<RNText style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: tokens.spacing.gap.md, color: tokens.color.text.primary }}>Create Character</RNText>
					
					{avatarStep === 'upload' && (
						<>
							<RNText style={{ color: tokens.color.text.secondary, textAlign: 'center', marginBottom: tokens.spacing.gap.lg }}>Take a photo or select from your gallery to generate a Pixar-style avatar.</RNText>
							
							{/* Photo Selection Options */}
							<View style={{ flexDirection: 'row', gap: 12, marginBottom: tokens.spacing.gap.lg }}>
								<TouchableOpacity
									onPress={async () => {
										try {
											const photoUri = await takePhoto();
											if (photoUri) {
												setSelectedPhoto(photoUri);
											}
										} catch (error) {
											console.error('Failed to take photo:', error);
										}
									}}
									style={{
										flex: 1,
										height: 100,
										borderWidth: 2,
										borderColor: tokens.color.border.default,
										borderStyle: 'dashed',
										borderRadius: tokens.radius.lg,
										alignItems: 'center',
										justifyContent: 'center',
										backgroundColor: tokens.color.surface
									}}
								>
									<Ionicons name="camera-outline" size={32} color={tokens.color.text.secondary} />
									<Text color="secondary" size="sm" style={{ textAlign: 'center', marginTop: 4 }}>Take Photo</Text>
								</TouchableOpacity>
								
								<TouchableOpacity
									onPress={async () => {
										try {
											const photoUri = await pickImageFromGallery();
											if (photoUri) {
												setSelectedPhoto(photoUri);
											}
										} catch (error) {
											console.error('Failed to pick image:', error);
										}
									}}
									style={{
										flex: 1,
										height: 100,
										borderWidth: 2,
										borderColor: tokens.color.border.default,
										borderStyle: 'dashed',
										borderRadius: tokens.radius.lg,
										alignItems: 'center',
										justifyContent: 'center',
										backgroundColor: tokens.color.surface
									}}
								>
									<Ionicons name="images-outline" size={32} color={tokens.color.text.secondary} />
									<Text color="secondary" size="sm" style={{ textAlign: 'center', marginTop: 4 }}>Choose from Gallery</Text>
								</TouchableOpacity>
							</View>
							
							{/* Selected Photo Preview */}
							{selectedPhoto && (
								<View style={{ alignItems: 'center', marginBottom: tokens.spacing.gap.lg }}>
									<Image 
										source={{ uri: selectedPhoto }} 
										style={{ 
											width: 120, 
											height: 120, 
											borderRadius: 60, 
											marginBottom: 8,
											borderWidth: 2,
											borderColor: tokens.color.primary.default
										}} 
									/>
									<Text color="secondary" size="sm">Photo selected</Text>
								</View>
							)}
							
							<GradientButton 
								title="Generate Avatar" 
								disabled={!selectedPhoto}
								onPress={async () => {
									if (selectedPhoto) {
										setAvatarStep('generating');
										try {
											await generateAvatarFromPhoto();
										} catch (error) {
											console.error('Avatar generation failed:', error);
											setAvatarStep('upload');
										}
									}
								}} 
							/>
						</>
					)}

					{avatarStep === 'generating' && (
						<View style={{ alignItems: 'center', paddingVertical: 40 }}>
							{selectedPhoto && (
								<Image 
									source={{ uri: selectedPhoto }} 
									style={{ 
										width: 100, 
										height: 100, 
										borderRadius: 50, 
										marginBottom: 20,
										opacity: 0.7
									}} 
								/>
							)}
							<ActivityIndicator size="large" color={tokens.color.primary.default} style={{ marginBottom: 20 }} />
							<Text weight="semibold">Creating your avatar...</Text>
							<Text color="secondary" style={{ textAlign: 'center', marginTop: 8 }}>
								Transforming your photo into a magical character
							</Text>
						</View>
					)}

					{avatarStep === 'review' && (
						<>
							{generatedAvatar && (
								<Image 
									source={{ uri: generatedAvatar }} 
									style={{ 
										width: 150, 
										height: 150, 
										borderRadius: 75, 
										alignSelf: 'center', 
										marginBottom: tokens.spacing.gap.lg,
										borderWidth: 3,
										borderColor: tokens.color.primary.default
									}} 
								/>
							)}
							<TextInput 
								placeholder="Enter character name" 
								value={characterName}
								onChangeText={setCharacterName}
								style={{ 
									borderWidth: 1, 
									borderColor: tokens.color.border.default, 
									borderRadius: tokens.radius.md, 
									padding: 12, 
									marginBottom: tokens.spacing.gap.sm 
								}} 
							/>
							<GradientButton 
								title="Save Character" 
								disabled={!characterName.trim() || !generatedAvatar}
								onPress={async () => { 
									if (isMounted.current && characterName.trim() && generatedAvatar) {
										try {
											console.log('💾 Saving character to store:', characterName.trim());
											console.log('🖼️ Using avatar URL:', generatedAvatar);
											
											// Create character using the generated avatar URL directly
											const newCharacter = await createCharacterFromPhoto(generatedAvatar, characterName.trim());
											
											console.log('✅ Character created successfully:', newCharacter.name);
											
											// Reset state and close modal
											setAvatarModalVisible(false); 
											setAvatarStep('upload');
											setCharacterName('');
											setSelectedPhoto(null);
											setGeneratedAvatar(null);
											
											// Reload characters to show the new one
											await loadCharacters();
											
											// Show success message
											Alert.alert(
												'Character Created!', 
												`${newCharacter.name} is now ready to appear in your stories!`,
												[{ text: 'Great!' }]
											);
										} catch (error) {
											console.error('❌ Failed to save character:', error);
											Alert.alert(
												'Save Failed', 
												'Unable to save your character. Please try again.',
												[{ text: 'OK' }]
											);
										}
									}
								}} 
							/>
							<TouchableOpacity 
								onPress={async () => {
									setAvatarStep('generating');
									setGeneratedAvatar(null);
									// Regenerate with the same photo
									try {
										await generateAvatarFromPhoto();
									} catch (error) {
										console.error('Failed to regenerate avatar:', error);
										setAvatarStep('upload');
									}
								}} 
								style={{ marginTop: 12 }}
							>
								<Text style={{ textAlign: 'center', color: tokens.color.primary.default }}>Regenerate Avatar</Text>
							</TouchableOpacity>
						</>
					)}
				</View>
			</View>
		</Modal>
	);

	const renderProgressSteps = () => {
		// Simplified steps - just numbers with fun colors
		const allSteps = ['character-selection', 'concept-selection', 'mode-selection', 'advanced-options', 'text-generation', 'text-editing', 'review'];
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
			'concept-selection': 'Choose Learning Message',
			'mode-selection': 'Select Mode',
			'advanced-options': 'Customize Options',
			'character-selection': 'Add Characters',
			'text-generation': 'Creating Story',
			'text-editing': 'Edit Your Story',
			'image-generation': 'Generating Images',
			'review': 'Submitted!'
		};
		return titles[step] || '';
	};

	const renderStoryCreationModal = () => (
		<Modal visible={isStoryModalVisible} animationType="slide">
			<View style={{ flex: 1, backgroundColor: 'white', paddingTop: 60 }}>
				<TouchableOpacity onPress={() => isMounted.current && setStoryModalVisible(false)} style={{ position: 'absolute', top: 60, right: 20, zIndex: 1 }}>
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

						{storyWizardStep === 'concept-selection' && (
							<>
								<Text size="h2" weight="bold" style={{ marginBottom: tokens.spacing.gap.md }}>Choose Learning Message</Text>
								<Text color="secondary" style={{ marginBottom: 30 }}>What concept or value do you want your child to learn from this story?</Text>
								
								<Text weight="semibold" style={{ marginBottom: 16 }}>Popular Concepts</Text>
								<FlatList
									data={suggestedConcepts}
									horizontal
									showsHorizontalScrollIndicator={false}
									keyExtractor={(item) => item.id}
									contentContainerStyle={{ paddingRight: 20, paddingBottom: 20 }}
									renderItem={({ item }) => (
										<TouchableOpacity
											onPress={() => setConceptLearning({...conceptLearning, concept: item.message})}
											style={{
												width: 160,
												padding: 20,
												marginRight: 16,
												borderRadius: tokens.radius.lg,
												borderWidth: 2,
												borderColor: conceptLearning.concept === item.message ? tokens.color.primary.default : tokens.color.border.default,
												backgroundColor: conceptLearning.concept === item.message ? "#F3E8FF" : tokens.color.surface
											}}
										>
											<Text weight="bold" size="lg" style={{ textAlign: 'center', marginBottom: 8 }}>{item.concept}</Text>
											<Text size="sm" color="secondary" style={{ textAlign: 'center', lineHeight: 18 }}>{item.description}</Text>
										</TouchableOpacity>
									)}
									style={{ marginBottom: 30 }}
								/>

								<Text weight="semibold" style={{ marginBottom: 12 }}>Or Create Your Own</Text>
								<TextInput 
									placeholder="e.g., sharing toys, saying please and thank you, being brave" 
									value={conceptLearning.concept}
									onChangeText={(text) => setConceptLearning({...conceptLearning, concept: text})}
									style={{ 
										borderWidth: 1, 
										borderColor: tokens.color.border.default, 
										borderRadius: tokens.radius.md, 
										padding: 16, 
										marginBottom: 30,
										fontSize: 16
									}} 
								/>

								<View style={{ flexDirection: 'row', gap: 12 }}>
									<TouchableOpacity 
										onPress={() => setStoryWizardStep('character-selection')}
										style={{ flex: 1, padding: 12, alignItems: 'center' }}
									>
										<Text style={{ color: tokens.color.text.secondary }}>Back</Text>
									</TouchableOpacity>
									<GradientButton 
										title="Next: Choose Mode" 
										disabled={!conceptLearning.concept.trim()}
										onPress={() => {
											setStoryWizardStep('mode-selection');
										}} 
										style={{ flex: 2 }}
									/>
								</View>
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
										onPress={() => setStoryWizardStep('concept-selection')}
										style={{ flex: 1, padding: 12, alignItems: 'center' }}
									>
										<Text style={{ color: tokens.color.text.secondary }}>Back</Text>
									</TouchableOpacity>
									<GradientButton 
										title={conceptLearning.mode === 'advanced' ? 'Next: Options' : 'Create Story'}
										onPress={() => {
											if (conceptLearning.mode === 'simple') {
												// Set simple mode defaults - full sentences but simple language
												setConceptLearning({
													...conceptLearning,
													advanced: {
														density: 'multiple-sentences',
														narrative: 'third-person',
														pageCount: 6,
														complexity: 'simple',
														communicationStyle: 'balanced',
														tone: 'playful',
														goal: 'Keep sentences to 10-12 words maximum, use simple vocabulary suitable for young children'
													}
												});
												setStoryWizardStep('text-generation');
											} else {
												setStoryWizardStep('advanced-options');
											}
										}}
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
													tone: 'playful',
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
													tone: 'playful',
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
												tone: 'playful',
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
												tone: 'playful',
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
													tone: 'playful',
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
											tone: 'playful',
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
										title="Create Story"
										onPress={() => setStoryWizardStep('text-generation')}
										style={{ flex: 2 }}
									/>
								</View>
							</>
						)}

						{storyWizardStep === 'character-selection' && (
							<>
								<Text size="h2" weight="bold" style={{ marginBottom: tokens.spacing.gap.md }}>Choose Characters</Text>
								<Text color="secondary" style={{ marginBottom: 30 }}>Select who will be in your story. You can include your child and other family characters.</Text>
								
								{/* Child Selection Section */}
								{profile && (
									<>
										<Text weight="semibold" style={{ marginBottom: 12 }}>Your Child</Text>
										<TouchableOpacity 
											onPress={() => setConceptLearning({...conceptLearning, childProfileId: profile.id, includeChildAsCharacter: !conceptLearning.includeChildAsCharacter})}
											style={{
												width: 120,
												alignItems: 'center',
												padding: 16,
												borderRadius: tokens.radius.lg,
												borderWidth: 2,
												borderColor: conceptLearning.includeChildAsCharacter ? tokens.color.primary.default : tokens.color.border.default,
												backgroundColor: conceptLearning.includeChildAsCharacter ? "#F3E8FF" : tokens.color.surface,
												marginBottom: 30
											}}
										>
											{/* Child Avatar - we'll use a generic avatar for now */}
											<View style={{
												width: 60,
												height: 60,
												borderRadius: 30,
												backgroundColor: tokens.color.primary.default,
												alignItems: 'center',
												justifyContent: 'center',
												marginBottom: 8
											}}>
												<Ionicons name="person" size={30} color="white" />
											</View>
											<Text weight="semibold" size="sm" style={{ textAlign: 'center' }}>{profile.childName}</Text>
											<Text size="xs" color="secondary" style={{ textAlign: 'center' }}>Main Character</Text>
											{conceptLearning.includeChildAsCharacter && (
												<View style={{ position: 'absolute', top: 8, right: 8 }}>
													<Ionicons name="checkmark-circle" size={20} color={tokens.color.primary.default} />
												</View>
											)}
										</TouchableOpacity>
									</>
								)}
								
								{/* My Characters Section */}
								<Text weight="semibold" style={{ marginBottom: 12 }}>My Characters</Text>
								<Text color="secondary" size="sm" style={{ marginBottom: 16 }}>Add family members or friends to make the story more personal</Text>
								
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
											setGeneratedAvatar(null);
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

								{/* Gestalts Characters Section */}
								<Text weight="semibold" style={{ marginBottom: 12 }}>Gestalts Characters</Text>
								<Text color="secondary" size="sm" style={{ marginBottom: 16 }}>Ready-to-use characters for your stories</Text>
								
								<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 30 }}>
									{gestaltsCharacters.map((char: Character) => {
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
													<View style={{ position: 'relative' }}>
														<Image 
															source={{ uri: char.avatarUrl }} 
															style={{ 
																width: 80, 
																height: 80, 
																borderRadius: 40, 
																borderWidth: 3, 
																borderColor: isSelected ? tokens.color.primary.default : 'transparent' 
															}} 
															onError={(error) => {
																console.log('Wizard Gestalts character image load error:', error);
																console.log('Failed wizard character image URL:', char.avatarUrl);
																console.log('Wizard Character:', char.name, 'ID:', char.id);
															}}
															onLoad={() => {
																console.log('Wizard Gestalts character image loaded successfully:', char.name, char.avatarUrl);
															}}
														/>
														<View style={{ 
															position: 'absolute', 
															bottom: -2, 
															right: -2, 
															backgroundColor: tokens.color.primary.default, 
															borderRadius: 8, 
															width: 16, 
															height: 16, 
															alignItems: 'center', 
															justifyContent: 'center',
															borderWidth: 1,
															borderColor: 'white'
														}}>
															<Ionicons name="star" size={10} color="white" />
														</View>
													</View>
													<Text weight="medium">{char.name}</Text>
												</View>
											</TouchableOpacity>
										);
									})}
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

								<GradientButton 
									title="Next: Choose Message"
									disabled={!conceptLearning.includeChildAsCharacter && conceptLearning.characterIds.length === 0}
									onPress={() => {
										if (profile && !conceptLearning.childProfileId && conceptLearning.includeChildAsCharacter) {
											setConceptLearning({...conceptLearning, childProfileId: profile.id});
										}
										setStoryWizardStep('concept-selection');
									}} 
									style={{ marginTop: 20 }}
								/>
							</>
						)}

						{storyWizardStep === 'text-generation' && (
							<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 }}>
								<ActivityIndicator size="large" color={tokens.color.primary.default} style={{ marginBottom: 20 }} />
								<Text size="h3" weight="bold">Creating Your Learning Story</Text>
								<Text color="secondary" style={{ textAlign: 'center', marginHorizontal: 20 }}>Creating a personalised story about "{conceptLearning.concept}"...</Text>
								
								{generationProgress.status === 'generating' && (
									<>
										<View style={{ width: 200, height: 4, backgroundColor: tokens.color.border.default, borderRadius: 2, marginTop: 20 }}>
											<View style={{ width: `${generationProgress.progress}%`, height: '100%', backgroundColor: tokens.color.primary.default, borderRadius: 2 }} />
										</View>
										<Text size="sm" color="secondary" style={{ marginTop: 10, textAlign: 'center' }}>{generationProgress.message}</Text>
									</>
								)}
							</View>
						)}

						{storyWizardStep === 'text-editing' && (
							<>
								<Text size="h2" weight="bold" style={{ marginBottom: tokens.spacing.gap.md }}>Edit Your Story</Text>
								<Text color="secondary" style={{ marginBottom: 20 }}>Review and customize your story title and each page of text.</Text>
								
								{/* Title Editing */}
								<View style={{ marginBottom: 20 }}>
									<Text weight="semibold" style={{ marginBottom: 8 }}>Story Title</Text>
									<TextInput
										value={conceptLearning.title || ''}
										onChangeText={(text) => setConceptLearning({ ...conceptLearning, title: text })}
										placeholder="Enter your story title..."
										style={{
											borderWidth: 1,
											borderColor: tokens.color.border.default,
											borderRadius: tokens.radius.md,
											padding: 12,
											fontSize: 16,
											fontWeight: '600',
											backgroundColor: tokens.color.surface
										}}
									/>
								</View>
								
								<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
							<Text weight="semibold">Story Pages</Text>
							<TouchableOpacity
								onPress={() => {
									setRegenerationPrompt('');
									setRegenerateModalVisible(true);
								}}
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									gap: 6,
									padding: 8,
									borderRadius: tokens.radius.md,
									backgroundColor: 'rgba(124, 58, 237, 0.1)',
									borderWidth: 1,
									borderColor: tokens.color.primary.default
								}}
							>
								<Ionicons name="refresh" size={16} color={tokens.color.primary.default} />
								<Text size="sm" style={{ color: tokens.color.primary.default }}>Regenerate Story</Text>
							</TouchableOpacity>
						</View>
						
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
												<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
													{page.isEdited && (
														<View style={{ flexDirection: 'row', alignItems: 'center' }}>
															<Ionicons name="checkmark-circle" size={16} color={tokens.color.primary.default} />
															<Text size="xs" color="primary" style={{ marginLeft: 4 }}>Edited</Text>
														</View>
													)}
													<TouchableOpacity
														onPress={() => {
															setPageToRegenerate(page.pageNumber);
															setRegenerationPrompt('');
															setPageRegenerateModalVisible(true);
														}}
														style={{
															padding: 4,
															borderRadius: 4,
															backgroundColor: 'rgba(124, 58, 237, 0.1)'
														}}
													>
														<Ionicons name="refresh" size={14} color={tokens.color.primary.default} />
													</TouchableOpacity>
												</View>
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
										onPress={() => setStoryWizardStep(conceptLearning.mode === 'advanced' ? 'advanced-options' : 'mode-selection')}
										style={{ flex: 1, padding: 12, alignItems: 'center' }}
									>
										<Text style={{ color: tokens.color.text.secondary }}>Back</Text>
									</TouchableOpacity>
									<GradientButton 
										title="Generate Images"
										onPress={async () => {
											// Validate we have title and story pages
											if (!conceptLearning.title || !conceptLearning.storyPages || conceptLearning.storyPages.length === 0) {
												Alert.alert('Error', 'Please ensure you have a title and story pages before generating images.');
												return;
											}
											
											// Generate story summary and context from edited content
											const summary = `${conceptLearning.title}: A learning story about ${conceptLearning.concept} for ${profile?.childName || 'a child'}`;
											const imageContext = `Child-friendly Pixar-style illustrations for a story teaching ${conceptLearning.concept}`;
											
											setConceptLearning({
												...conceptLearning,
												storySummary: summary,
												imageContext: imageContext
											});
											
											setStoryWizardStep('review');
											
											// Create the actual story using edited content from wizard
											const allAvailableCharacters = [...characters, ...gestaltsCharacters];
											const selectedCharacterNames = allAvailableCharacters
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
												// Create story with the user-edited title and pages
												await createStory({
													title: conceptLearning.title, // Use the edited title
													description: summary,
													characterIds: conceptLearning.characterIds,
													pageCount: conceptLearning.storyPages.length,
													concept: conceptLearning.concept,
													childProfile: childProfile,
													advanced: conceptLearning.advanced,
													// Pass the edited story pages to preserve user changes
													customStoryPages: conceptLearning.storyPages.map(page => page.text)
												});
												
												// Only update state if component is still mounted
												if (isMounted.current) {
													// Go to review step to show submission confirmation
													setStoryWizardStep('review');
												}
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
								<Text size="h2" weight="bold" style={{ marginBottom: tokens.spacing.gap.md }}>Story Submitted!</Text>
								<Text color="secondary" style={{ marginBottom: 20 }}>Your learning story is being created with custom illustrations. You can close this wizard and it will appear in your library when ready.</Text>
								
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
										{[...characters, ...gestaltsCharacters]
											.filter(char => conceptLearning.characterIds.includes(char.id))
											.map(char => char.name)
											.join(', ')}
									</Text>
								</View>

								<View style={{ flexDirection: 'row', gap: 12 }}>
									<TouchableOpacity 
										onPress={() => {
											console.log('Close Wizard button pressed');
											setStoryModalVisible(false);
											// Reset wizard state for next time
											setStoryWizardStep('character-selection');
											setConceptLearning({
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
													tone: 'playful',
													goal: ''
												}
											});
										}}
										style={{ 
											flex: 1, 
											padding: 12, 
											alignItems: 'center',
											borderRadius: tokens.radius.md,
											borderWidth: 1,
											borderColor: tokens.color.border.default
										}}
									>
										<Text style={{ color: tokens.color.text.secondary }}>Close Wizard</Text>
									</TouchableOpacity>
									<GradientButton 
										title="Go to Library"
										onPress={() => {
											console.log('Go to Library button pressed');
											setStoryModalVisible(false);
											// Switch to stories tab to see the generating story
											setActiveTab('stories');
											// Reset wizard state for next time
											setStoryWizardStep('character-selection');
											setConceptLearning({
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
													tone: 'playful',
													goal: ''
												}
											});
										}}
										style={{ flex: 2 }}
									/>
								</View>
							</>
						)}
					</View>
				</ScrollView>
			</View>
		</Modal>
	);

	const renderStoryViewerModal = () => {
		const { width: screenWidth, height: screenHeight } = require('react-native').Dimensions.get('window');
		
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
								<StoryPageComponent 
									item={item} 
									index={index} 
									screenWidth={screenWidth} 
									screenHeight={screenHeight} 
								/>
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
					<TouchableOpacity onPress={() => isMounted.current && setRefineModalVisible(false)} style={{ alignSelf: 'flex-end' }}>
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
											if (isMounted.current) {
												setRefineModalVisible(false);
												setRefinementPrompt('');
											}
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

	const renderRegenerateModal = () => (
		<Modal visible={isRegenerateModalVisible} animationType="fade" transparent>
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
				<View style={{ width: '90%', backgroundColor: 'white', borderRadius: tokens.radius.xl, padding: tokens.spacing.gap.lg }}>
					<TouchableOpacity onPress={() => isMounted.current && setRegenerateModalVisible(false)} style={{ alignSelf: 'flex-end' }}>
						<Ionicons name="close-circle" size={24} color={tokens.color.text.secondary} />
					</TouchableOpacity>
					<Text size="h3" weight="bold" style={{ marginBottom: 8 }}>Regenerate Entire Story</Text>
					<Text color="secondary" style={{ marginBottom: 16 }}>Provide specific instructions to improve the story or leave blank for a fresh version.</Text>
					
					<TextInput 
						placeholder="e.g., 'Make it more exciting', 'Add more dialogue', 'Focus more on friendship'..." 
						value={regenerationPrompt}
						onChangeText={setRegenerationPrompt}
						multiline
						style={{ 
							borderWidth: 1, 
							borderColor: tokens.color.border.default, 
							borderRadius: tokens.radius.md, 
							padding: 12, 
							height: 80,
							marginBottom: 16,
							textAlignVertical: 'top'
						}} 
					/>
					
					<View style={{ flexDirection: 'row', gap: 12 }}>
						<TouchableOpacity 
							onPress={() => setRegenerateModalVisible(false)}
							style={{ 
								flex: 1, 
								padding: 12, 
								alignItems: 'center',
								borderRadius: tokens.radius.md,
								borderWidth: 1,
								borderColor: tokens.color.border.default
							}}
						>
							<Text style={{ color: tokens.color.text.secondary }}>Cancel</Text>
						</TouchableOpacity>
						<GradientButton 
							title={isRegenerating ? 'Regenerating...' : 'Regenerate Story'}
							disabled={isRegenerating}
							onPress={async () => {
								await regenerateEntireStory(regenerationPrompt.trim() || undefined);
								if (isMounted.current) {
									setRegenerateModalVisible(false);
									setRegenerationPrompt('');
								}
							}}
							style={{ flex: 2 }}
						/>
					</View>
				</View>
			</View>
		</Modal>
	);

	const renderPageRegenerateModal = () => (
		<Modal visible={isPageRegenerateModalVisible} animationType="fade" transparent>
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
				<View style={{ width: '90%', backgroundColor: 'white', borderRadius: tokens.radius.xl, padding: tokens.spacing.gap.lg }}>
					<TouchableOpacity onPress={() => isMounted.current && setPageRegenerateModalVisible(false)} style={{ alignSelf: 'flex-end' }}>
						<Ionicons name="close-circle" size={24} color={tokens.color.text.secondary} />
					</TouchableOpacity>
					<Text size="h3" weight="bold" style={{ marginBottom: 8 }}>Regenerate Page {pageToRegenerate}</Text>
					<Text color="secondary" style={{ marginBottom: 16 }}>Provide specific instructions for this page or leave blank for a fresh version.</Text>
					
					{conceptLearning.storyPages && conceptLearning.storyPages[pageToRegenerate - 1] && (
						<View style={{
							backgroundColor: tokens.color.surface,
							borderRadius: tokens.radius.md,
							padding: 12,
							marginBottom: 16
						}}>
							<Text size="sm" weight="semibold" style={{ marginBottom: 4 }}>Current Page {pageToRegenerate}:</Text>
							<Text size="sm" color="secondary">{conceptLearning.storyPages[pageToRegenerate - 1].text}</Text>
						</View>
					)}
					
					<TextInput 
						placeholder="e.g., 'Add more emotion', 'Include more action', 'Make it funnier'..." 
						value={regenerationPrompt}
						onChangeText={setRegenerationPrompt}
						multiline
						style={{ 
							borderWidth: 1, 
							borderColor: tokens.color.border.default, 
							borderRadius: tokens.radius.md, 
							padding: 12, 
							height: 80,
							marginBottom: 16,
							textAlignVertical: 'top'
						}} 
					/>
					
					<View style={{ flexDirection: 'row', gap: 12 }}>
						<TouchableOpacity 
							onPress={() => setPageRegenerateModalVisible(false)}
							style={{ 
								flex: 1, 
								padding: 12, 
								alignItems: 'center',
								borderRadius: tokens.radius.md,
								borderWidth: 1,
								borderColor: tokens.color.border.default
							}}
						>
							<Text style={{ color: tokens.color.text.secondary }}>Cancel</Text>
						</TouchableOpacity>
						<GradientButton 
							title={isRegenerating ? 'Regenerating...' : 'Regenerate Page'}
							disabled={isRegenerating}
							onPress={async () => {
								await regenerateSinglePage(pageToRegenerate, regenerationPrompt.trim() || undefined);
								if (isMounted.current) {
									setPageRegenerateModalVisible(false);
									setRegenerationPrompt('');
								}
							}}
							style={{ flex: 2 }}
						/>
					</View>
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
			{renderRegenerateModal()}
			{renderPageRegenerateModal()}
		</LinearGradient>
	);
}

