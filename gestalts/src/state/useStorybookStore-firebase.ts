import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Character, 
  Story, 
  GenerationProgress, 
  StorybookError,
  StoryGenerationRequest,
  AvatarGenerationRequest
} from '../types/storybook';
import { getFirebaseServices } from '../services/firebaseConfig';
// import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
// import storage from '@react-native-firebase/storage';
import geminiService from '../services/geminiService';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useMemoriesStore } from './useStore';

interface StorybookState {
  // Data
  characters: Character[];
  stories: Story[];
  
  // UI State
  currentStory: Story | null;
  generationProgress: GenerationProgress;
  error: StorybookError | null;
  
  // Actions - Characters
  loadCharacters: () => Promise<void>;
  createCharacterFromPhoto: (photoUri: string, name: string) => Promise<Character>;
  deleteCharacter: (characterId: string) => Promise<void>;
  
  // Actions - Stories
  loadStories: () => Promise<void>;
  createStory: (request: StoryGenerationRequest) => Promise<Story>;
  deleteStory: (storyId: string) => Promise<void>;
  refineStoryImage: (storyId: string, pageIndex: number, refinementPrompt: string) => Promise<void>;
  
  // Actions - Image Picker
  pickImageFromGallery: () => Promise<string | null>;
  takePhoto: () => Promise<string | null>;
  
  // Actions - UI
  setCurrentStory: (story: Story | null) => void;
  setError: (error: StorybookError | null) => void;
  clearError: () => void;
  resetProgress: () => void;
}

const initialProgress: GenerationProgress = {
  status: 'idle',
  message: '',
  progress: 0
};

// Helper to get user ID from profile
const getUserId = () => {
  const profile = useMemoriesStore.getState().profile;
  // Use a more consistent user ID format for Firebase paths
  const userId = profile?.id || 'default-user';
  // Ensure the user ID is safe for Firebase paths (no special characters)
  return userId.replace(/[^a-zA-Z0-9_-]/g, '_');
};

// Helper to upload image to Firebase Storage
const uploadImageToStorage = async (imageUri: string, path: string): Promise<string> => {
  const { initialized } = getFirebaseServices();
  if (!initialized) {
    throw new Error('Firebase Storage not initialized');
  }

  // TODO: Implement with React Native Firebase Storage when needed
  // const storage = require('@react-native-firebase/storage').default;
  // const storageRef = storage().ref(path);
  // const snapshot = await storageRef.putFile(imageUri);
  // const downloadURL = await storageRef.getDownloadURL();
  
  console.log('Firebase Storage upload not implemented yet:', path);
  return imageUri; // Return original URI as placeholder
};

// Helper to delete image from Firebase Storage
const deleteImageFromStorage = async (imageUrl: string) => {
  const { initialized } = getFirebaseServices();
  if (!initialized) return;

  try {
    // TODO: Implement with React Native Firebase Storage when needed
    // const storage = require('@react-native-firebase/storage').default;
    // const pathMatch = imageUrl.match(/\/o\/(.+?)\?/);
    // if (pathMatch) {
    //   const path = decodeURIComponent(pathMatch[1]);
    //   const storageRef = storage().ref(path);
    //   await storageRef.delete();
    // }
    
    console.log('Firebase Storage delete not implemented yet:', imageUrl);
  } catch (error) {
    console.warn('Failed to delete image from storage:', error);
  }
};

export const useStorybookStore = create<StorybookState>()(
  persist(
    (set, get) => ({
      // Initial state
      characters: [],
      stories: [],
      currentStory: null,
      generationProgress: initialProgress,
      error: null,

      // Load characters from Firebase
      loadCharacters: async () => {
        try {
          const { initialized } = getFirebaseServices();
          if (!initialized) {
            console.log('Firebase not initialized, skipping character load');
            return;
          }

          const userId = getUserId();
          // TODO: Replace with Firebase Web SDK
          // const query = firestore().collection('users').doc(userId).collection('characters').orderBy('createdAt', 'desc');
          // const snapshot = await query.get();
          const snapshot = { docs: [] };
          
          const characters: Character[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Ensure dates are properly converted
            let createdAt: Date;
            let updatedAt: Date;
            
            try {
              createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
            } catch {
              createdAt = new Date();
            }
            
            try {
              updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date();
            } catch {
              updatedAt = new Date();
            }
            
            characters.push({
              id: doc.id,
              name: data.name,
              avatarUrl: data.avatarUrl,
              createdAt,
              updatedAt
            });
          });
          
          set({ characters });
        } catch (error) {
          console.error('Failed to load characters:', error);
          set({ 
            error: {
              code: 'LOAD_ERROR',
              message: 'Failed to load characters',
              details: error,
              retryable: true
            }
          });
        }
      },

      // Create a character from a photo
      createCharacterFromPhoto: async (photoUri: string, name: string) => {
        set({ 
          generationProgress: {
            status: 'uploading',
            message: 'Processing photo...',
            progress: 10
          }
        });

        try {
          // Read photo as base64
          const photoData = await FileSystem.readAsStringAsync(photoUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          set({ 
            generationProgress: {
              status: 'generating',
              message: 'Creating avatar...',
              progress: 30
            }
          });

          // Generate avatar using Gemini with visual profile extraction
          const avatarResult = await geminiService.generateAvatar({
            photoData: `data:image/jpeg;base64,${photoData}`,
            style: 'pixar',
            characterName: name
          });
          
          const avatarUrl = typeof avatarResult === 'string' ? avatarResult : avatarResult.imageUrl;

          // Upload to Firebase Storage if configured, otherwise use generated URL
          let finalAvatarUrl = avatarUrl;
          const { initialized } = getFirebaseServices();
          if (initialized) {
            try {
              const userId = getUserId();
              const timestamp = Date.now();
              const path = `users/${userId}/avatars/${timestamp}_${name.replace(/\s+/g, '_')}.jpg`;
              finalAvatarUrl = await uploadImageToStorage(avatarUrl, path);
            } catch (error) {
              console.warn('Failed to upload avatar to Firebase Storage, using generated URL:', error);
              finalAvatarUrl = avatarUrl;
            }
          }

          // Create character object with visual profile
          const character: Character = {
            id: `char_${Date.now()}`,
            name,
            avatarUrl: finalAvatarUrl,
            createdAt: new Date(),
            updatedAt: new Date(),
            visualProfile: typeof avatarResult === 'string' ? undefined : avatarResult.visualProfile
          };

          // Save to Firebase Firestore
          const firebaseDb = getFirebaseServices();
          if (firebaseDb.initialized) {
            const userId = getUserId();
            const charactersRef = firestore().collection('users').doc(userId).collection('characters');
            await charactersRef.add({
              name: character.name,
              avatarUrl: character.avatarUrl,
              createdAt: firestore.FieldValue.serverTimestamp(),
              updatedAt: firestore.FieldValue.serverTimestamp()
            });
          }

          // Update local state
          set(state => ({
            characters: [...state.characters, character],
            generationProgress: {
              status: 'complete',
              message: 'Avatar created successfully!',
              progress: 100
            }
          }));

          // Reset progress after delay
          setTimeout(() => {
            set({ generationProgress: initialProgress });
          }, 2000);

          return character;
        } catch (error: any) {
          set({ 
            error: error,
            generationProgress: {
              status: 'error',
              message: 'Failed to create avatar',
              progress: 0
            }
          });
          throw error;
        }
      },

      // Delete a character
      deleteCharacter: async (characterId: string) => {
        try {
          const { initialized } = getFirebaseServices();
          if (initialized) {
            // Get character to find avatar URL for deletion
            const character = get().characters.find(c => c.id === characterId);
            if (character?.avatarUrl) {
              await deleteImageFromStorage(character.avatarUrl);
            }
            
            // Delete from Firestore
            const userId = getUserId();
            const characterDoc = firestore().collection('users').doc(userId).collection('characters').doc(characterId);
            await characterDoc.delete();
          }
          
          set(state => ({
            characters: state.characters.filter(c => c.id !== characterId)
          }));
        } catch (error) {
          console.error('Failed to delete character:', error);
          throw error;
        }
      },

      // Load stories from Firebase
      loadStories: async () => {
        try {
          const { initialized } = getFirebaseServices();
          if (!initialized) {
            console.log('Firebase not initialized, skipping stories load');
            return;
          }

          const userId = getUserId();
          const query = firestore().collection('users').doc(userId).collection('stories').orderBy('createdAt', 'desc');
          const snapshot = await query.get();
          
          const stories: Story[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            // Ensure dates are properly converted
            let createdAt: Date;
            let updatedAt: Date;
            
            try {
              createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
            } catch {
              createdAt = new Date();
            }
            
            try {
              updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date();
            } catch {
              updatedAt = new Date();
            }
            
            stories.push({
              id: doc.id,
              title: data.title,
              description: data.description,
              coverUrl: data.coverUrl,
              characterIds: data.characterIds || [],
              pages: data.pages || [],
              status: data.status || 'complete',
              generationProgress: data.generationProgress || 100,
              createdAt,
              updatedAt,
              theme: data.theme,
              ageGroup: data.ageGroup
            });
          });
          
          set({ stories });
        } catch (error) {
          console.error('Failed to load stories:', error);
          set({ 
            error: {
              code: 'LOAD_ERROR',
              message: 'Failed to load stories',
              details: error,
              retryable: true
            }
          });
        }
      },

      // Create a new story
      createStory: async (request: StoryGenerationRequest) => {
        set({ 
          generationProgress: {
            status: 'generating',
            message: 'Creating story text...',
            progress: 10,
            currentPage: 0,
            totalPages: request.pageCount || 5
          }
        });

        try {
          // Get character names
          const characters = get().characters.filter(c => 
            request.characterIds.includes(c.id)
          );
          const characterNames = characters.map(c => c.name);
          
          // Include child as character if selected
          const allCharacterNames = [...characterNames];
          if (request.childProfile?.includeAsCharacter) {
            allCharacterNames.push(request.childProfile.name);
          }

          // Use custom story pages if provided, otherwise generate new ones
          let storyTexts: string[];
          
          if (request.customStoryPages && request.customStoryPages.length > 0) {
            // Use the edited story pages from the wizard
            storyTexts = request.customStoryPages;
            console.log('Using custom story pages from wizard:', storyTexts.length, 'pages');
          } else {
            // Generate new story text with concept learning context
            storyTexts = await geminiService.generateStoryText(
              request.title,
              request.description,
              allCharacterNames,
              request.pageCount || 5,
              {
                concept: request.concept,
                childName: request.childProfile?.includeAsCharacter ? request.childProfile.name : undefined,
                advanced: request.advanced
              }
            );
            console.log('Generated new story text:', storyTexts.length, 'pages');
          }

          // Create story object
          const story: Story = {
            id: `story_${Date.now()}`,
            title: request.title,
            description: request.description,
            coverUrl: '',
            characterIds: request.characterIds,
            pages: [],
            status: 'generating',
            generationProgress: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            theme: request.theme,
            ageGroup: request.ageGroup,
            concept: request.concept,
            childProfileId: request.childProfile?.id,
            mode: request.advanced ? 'advanced' : 'simple',
            goal: request.advanced?.goal
          };

          // Generate images for each page
          const pages = [];
          for (let i = 0; i < storyTexts.length; i++) {
            set({ 
              generationProgress: {
                status: 'generating',
                message: `Illustrating page ${i + 1}...`,
                progress: 20 + (i * 60 / storyTexts.length),
                currentPage: i + 1,
                totalPages: storyTexts.length
              }
            });

            // Get character avatar URLs as references
            const referenceImages = characters.map(c => c.avatarUrl);
            
            // Build character profiles for visual consistency
            const characterProfiles = characters.map(char => ({
              name: char.name,
              appearance: char.visualProfile?.appearance || `${char.name} has distinctive Pixar-style features`,
              style: char.visualProfile?.style || 'Child-friendly design with consistent visual identity',
              keyFeatures: char.visualProfile?.keyFeatures || ['Memorable appearance', 'Consistent design']
            }));
            
            // Add child profile if included as character
            if (request.childProfile?.includeAsCharacter) {
              characterProfiles.push({
                name: request.childProfile.name,
                appearance: `${request.childProfile.name} has warm, child-friendly Pixar-style features`,
                style: 'Age-appropriate design that appeals to children',
                keyFeatures: ['Friendly demeanor', 'Expressive eyes', 'Engaging personality']
              });
            }
            
            // Build scene context for visual continuity
            const sceneContext = {
              setting: i === 0 ? 'Establishing the story world' : `Continuing from previous scene`,
              mood: request.advanced?.tone || 'gentle',
              colorPalette: ['warm', 'bright', 'friendly', 'inviting'],
              visualStyle: 'Professional Pixar 3D animation style'
            };

            // Generate illustration with enhanced character and scene context
            const imageUrl = await geminiService.generateStoryImage({
              prompt: storyTexts[i],
              style: 'pixar',
              referenceImages,
              context: {
                concept: request.concept,
                characterNames: allCharacterNames,
                childName: request.childProfile?.includeAsCharacter ? request.childProfile.name : undefined,
                pageNumber: i + 1,
                totalPages: storyTexts.length,
                previousPageContext: i > 0 ? `Previous page showed: ${storyTexts[i - 1].substring(0, 100)}...` : undefined,
                sceneContext,
                characterProfiles,
                storyContext: `This is part of a learning story about ${request.concept} featuring ${allCharacterNames.join(', ')}`,
                advanced: request.advanced
              }
            });

            // Upload to Firebase Storage if configured, otherwise use generated URL
            let finalImageUrl = imageUrl;
            const { initialized } = getFirebaseServices();
            if (initialized) {
              try {
                const userId = getUserId();
                const path = `users/${userId}/stories/${story.id}/page_${i + 1}.jpg`;
                finalImageUrl = await uploadImageToStorage(imageUrl, path);
              } catch (error) {
                console.warn('Failed to upload to Firebase Storage, using generated URL:', error);
                finalImageUrl = imageUrl;
              }
            }

            pages.push({
              pageNumber: i + 1,
              text: storyTexts[i],
              imageUrl: finalImageUrl
            });
          }

          // Set cover as first page image
          story.pages = pages;
          story.coverUrl = pages[0]?.imageUrl || '';
          story.status = 'complete';
          story.generationProgress = 100;

          // Save to Firebase Firestore
          const firebaseStoryDb = getFirebaseServices();
          if (firebaseStoryDb.initialized) {
            const userId = getUserId();
            const storiesRef = firestore().collection('users').doc(userId).collection('stories');
            // Filter out undefined values for Firestore
            const storyData: any = {
              title: story.title,
              description: story.description,
              coverUrl: story.coverUrl,
              characterIds: story.characterIds,
              pages: story.pages,
              status: story.status,
              generationProgress: story.generationProgress,
              createdAt: firestore.FieldValue.serverTimestamp(),
              updatedAt: firestore.FieldValue.serverTimestamp()
            };
            
            // Only add optional fields if they have values
            if (story.theme) storyData.theme = story.theme;
            if (story.ageGroup) storyData.ageGroup = story.ageGroup;
            if (story.concept) storyData.concept = story.concept;
            if (story.childProfileId) storyData.childProfileId = story.childProfileId;
            if (story.mode) storyData.mode = story.mode;
            if (story.goal) storyData.goal = story.goal;
            
            await storiesRef.add(storyData);
          }

          // Update local state
          set(state => ({
            stories: [...state.stories, story],
            currentStory: story,
            generationProgress: {
              status: 'complete',
              message: 'Story created successfully!',
              progress: 100,
              currentPage: storyTexts.length,
              totalPages: storyTexts.length
            }
          }));

          // Reset progress after delay
          setTimeout(() => {
            set({ generationProgress: initialProgress });
          }, 3000);

          return story;
        } catch (error: any) {
          set({ 
            error: error,
            generationProgress: {
              status: 'error',
              message: 'Failed to create story',
              progress: 0
            }
          });
          throw error;
        }
      },

      // Delete a story
      deleteStory: async (storyId: string) => {
        try {
          const { initialized } = getFirebaseServices();
          if (initialized) {
            // Get story to find image URLs for deletion
            const story = get().stories.find(s => s.id === storyId);
            if (story) {
              // Delete cover image
              if (story.coverUrl) {
                await deleteImageFromStorage(story.coverUrl);
              }
              // Delete page images
              for (const page of story.pages) {
                if (page.imageUrl) {
                  await deleteImageFromStorage(page.imageUrl);
                }
              }
            }
            
            // Delete from Firestore
            const userId = getUserId();
            const storyDoc = firestore().collection('users').doc(userId).collection('stories').doc(storyId);
            await storyDoc.delete();
          }
          
          set(state => ({
            stories: state.stories.filter(s => s.id !== storyId),
            currentStory: state.currentStory?.id === storyId ? null : state.currentStory
          }));
        } catch (error) {
          console.error('Failed to delete story:', error);
          throw error;
        }
      },

      // Refine a story image
      refineStoryImage: async (storyId: string, pageIndex: number, refinementPrompt: string) => {
        set({ 
          generationProgress: {
            status: 'processing',
            message: 'Refining image...',
            progress: 50
          }
        });

        try {
          const story = get().stories.find(s => s.id === storyId);
          if (!story) throw new Error('Story not found');

          const page = story.pages[pageIndex];
          if (!page) throw new Error('Page not found');

          // Refine the image
          const refinedImageUrl = await geminiService.refineImage({
            imageUrl: page.imageUrl,
            refinementPrompt,
            pageId: pageIndex
          });

          // Upload refined image to Firebase Storage if configured
          let finalImageUrl = refinedImageUrl;
          if (refinedImageUrl !== page.imageUrl) {
            const { initialized } = getFirebaseServices();
            if (initialized) {
              try {
                const userId = getUserId();
                const path = `users/${userId}/stories/${storyId}/page_${pageIndex + 1}_refined_${Date.now()}.jpg`;
                finalImageUrl = await uploadImageToStorage(refinedImageUrl, path);
              } catch (error) {
                console.warn('Failed to upload refined image to Firebase Storage, using generated URL:', error);
                finalImageUrl = refinedImageUrl;
              }
            }
          }

          // Update story
          const updatedStory = {
            ...story,
            pages: story.pages.map((p, idx) => 
              idx === pageIndex ? { ...p, imageUrl: finalImageUrl } : p
            ),
            updatedAt: new Date()
          };

          // Save to Firebase Firestore
          const firebaseRefineDb = getFirebaseServices();
          if (firebaseRefineDb.initialized) {
            const userId = getUserId();
            const storyDoc = firestore().collection('users').doc(userId).collection('stories').doc(storyId);
            await storyDoc.update({
              pages: updatedStory.pages,
              updatedAt: firestore.FieldValue.serverTimestamp()
            });
          }

          // Update local state
          set(state => ({
            stories: state.stories.map(s => 
              s.id === storyId ? updatedStory : s
            ),
            currentStory: state.currentStory?.id === storyId ? updatedStory : state.currentStory,
            generationProgress: {
              status: 'complete',
              message: 'Image refined successfully!',
              progress: 100
            }
          }));

          // Reset progress
          setTimeout(() => {
            set({ generationProgress: initialProgress });
          }, 2000);
        } catch (error: any) {
          set({ 
            error: error,
            generationProgress: {
              status: 'error',
              message: 'Failed to refine image',
              progress: 0
            }
          });
          throw error;
        }
      },

      // Pick image from gallery
      pickImageFromGallery: async () => {
        try {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

          if (!result.canceled && result.assets[0]) {
            return result.assets[0].uri;
          }
          return null;
        } catch (error) {
          console.error('Failed to pick image:', error);
          return null;
        }
      },

      // Take photo with camera
      takePhoto: async () => {
        try {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            set({ 
              error: {
                code: 'PERMISSION_DENIED',
                message: 'Camera permission is required to take photos',
                details: null,
                retryable: false
              }
            });
            return null;
          }

          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

          if (!result.canceled && result.assets[0]) {
            return result.assets[0].uri;
          }
          return null;
        } catch (error) {
          console.error('Failed to take photo:', error);
          return null;
        }
      },

      // UI Actions
      setCurrentStory: (story) => set({ currentStory: story }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      resetProgress: () => set({ generationProgress: initialProgress })
    }),
    {
      name: 'storybook-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        characters: state.characters,
        stories: state.stories 
      })
    }
  )
);