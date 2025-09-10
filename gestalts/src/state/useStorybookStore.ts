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
import geminiService from '../services/geminiService';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

interface StorybookState {
  // Data
  characters: Character[];
  gestaltsCharacters: Character[];
  stories: Story[];
  
  // UI State
  currentStory: Story | null;
  generationProgress: GenerationProgress;
  error: StorybookError | null;
  
  // Actions - Characters
  loadCharacters: () => Promise<void>;
  loadGestaltsCharacters: () => Promise<void>;
  createCharacterFromPhoto: (photoUri: string, name: string, mode?: 'animated' | 'real' | 'both') => Promise<Character>;
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

export const useStorybookStore = create<StorybookState>()(
  persist(
    (set, get) => ({
      // Initial state
      characters: [],
      gestaltsCharacters: [],
      stories: [],
      currentStory: null,
      generationProgress: initialProgress,
      error: null,

      // Load characters (from local storage only for now)
      loadCharacters: async () => {
        try {
          console.log('Loading characters from local storage');
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

      // Load Gestalts characters (predefined characters)
      loadGestaltsCharacters: async () => {
        try {
          // Create predefined Gestalts characters
          const gestaltsChars: Character[] = [
            {
              id: 'alex-gestalts',
              name: 'Alex',
              avatarUrl: 'https://firebasestorage.googleapis.com/v0/b/gestalts-mobile.firebasestorage.app/o/avatars%2FAlex-Avatar.jpeg?alt=media&token=5ec35a3b-1ee4-45a1-a193-53f2c60300a0',
              type: 'gestalts' as const,
              createdAt: new Date(),
              updatedAt: new Date(),
              aiAttributes: 'Friendly and adventurous character who loves exploring and learning new things'
            },
            {
              id: 'emma-gestalts',
              name: 'Emma',
              avatarUrl: 'https://firebasestorage.googleapis.com/v0/b/gestalts-mobile.firebasestorage.app/o/avatars%2FEmma-Avatar.jpeg?alt=media&token=1721fb1c-5fa6-4cf0-9f09-08c8bb890d35',
              type: 'gestalts' as const,
              createdAt: new Date(),
              updatedAt: new Date(),
              aiAttributes: 'Kind and creative character who enjoys helping others and solving problems'
            }
          ];
          
          console.log('Loading Gestalts characters:', gestaltsChars);
          set({ gestaltsCharacters: gestaltsChars });
        } catch (error) {
          console.error('Failed to load Gestalts characters:', error);
          set({ 
            error: {
              code: 'LOAD_ERROR',
              message: 'Failed to load Gestalts characters',
              details: error,
              retryable: true
            }
          });
        }
      },

      // Create a character from a photo
      createCharacterFromPhoto: async (photoUri: string, name: string, mode: 'animated' | 'real' | 'both' = 'animated') => {
        set({ 
          generationProgress: {
            status: 'uploading',
            message: 'Processing photo...',
            progress: 10
          }
        });

        try {
          let avatarUrl: string;
          let realAvatarUrl: string | undefined;
          let animatedAvatarUrl: string | undefined;
          let visualProfile: any = undefined;
          
          // Check if photoUri is already a URL (from avatar generation) or a local file URI
          if (photoUri.startsWith('http://') || photoUri.startsWith('https://') || photoUri.startsWith('data:')) {
            // Already have a generated avatar URL, just use it directly
            avatarUrl = photoUri;
            animatedAvatarUrl = photoUri; // Assume it's animated since it's pre-generated
            console.log('Using provided avatar URL directly:', avatarUrl);
            
            set({ 
              generationProgress: {
                status: 'generating',
                message: 'Saving avatar...',
                progress: 80
              }
            });
          } else {
            // Local file URI - need to generate avatar(s)
            // Read photo as base64
            const photoData = await FileSystem.readAsStringAsync(photoUri, {
              encoding: FileSystem.EncodingType.Base64,
            });

            // Generate avatars based on mode
            if (mode === 'both') {
              set({ 
                generationProgress: {
                  status: 'generating',
                  message: 'Creating animated avatar...',
                  progress: 20
                }
              });

              // Generate animated avatar
              const animatedResult = await geminiService.generateAvatar({
                photoData: `data:image/jpeg;base64,${photoData}`,
                style: 'animated',
                mode: 'animated',
                characterName: name
              });

              set({ 
                generationProgress: {
                  status: 'generating',
                  message: 'Creating real-life avatar...',
                  progress: 60
                }
              });

              // Generate real-life avatar
              const realResult = await geminiService.generateAvatar({
                photoData: `data:image/jpeg;base64,${photoData}`,
                style: 'real',
                mode: 'real',
                characterName: name
              });

              // Handle both string and object return types
              animatedAvatarUrl = typeof animatedResult === 'string' ? animatedResult : animatedResult.imageUrl;
              realAvatarUrl = typeof realResult === 'string' ? realResult : realResult.imageUrl;
              avatarUrl = animatedAvatarUrl; // Default to animated for backwards compatibility
              visualProfile = typeof animatedResult === 'object' ? animatedResult.visualProfile : undefined;
            } else {
              set({ 
                generationProgress: {
                  status: 'generating',
                  message: `Creating ${mode} avatar...`,
                  progress: 30
                }
              });

              // Generate single avatar based on mode
              const avatarResult = await geminiService.generateAvatar({
                photoData: `data:image/jpeg;base64,${photoData}`,
                style: mode === 'real' ? 'real' : 'animated',
                mode: mode,
                characterName: name
              });

              // Handle both string and object return types
              const generatedUrl = typeof avatarResult === 'string' ? avatarResult : avatarResult.imageUrl;
              avatarUrl = generatedUrl;
              
              if (mode === 'real') {
                realAvatarUrl = generatedUrl;
              } else {
                animatedAvatarUrl = generatedUrl;
              }
              
              visualProfile = typeof avatarResult === 'object' ? avatarResult.visualProfile : undefined;
            }
          }

          // Create character object with dual avatar support
          const character: Character = {
            id: `char_${Date.now()}`,
            name,
            avatarUrl: avatarUrl, // Legacy field for backwards compatibility
            avatars: {
              animated: animatedAvatarUrl,
              real: realAvatarUrl
            },
            type: 'user', // User-created character
            visualProfile: visualProfile,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // Update local state (no Firebase for now)
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
          set(state => ({
            characters: state.characters.filter(c => c.id !== characterId)
          }));
        } catch (error) {
          console.error('Failed to delete character:', error);
          throw error;
        }
      },

      // Load stories (from local storage only for now)
      loadStories: async () => {
        try {
          console.log('Loading stories from local storage');
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
          // Get character names from both user and gestalts characters
          const allCharacters = [...get().characters, ...get().gestaltsCharacters];
          const selectedCharacters = allCharacters.filter(c => 
            request.characterIds.includes(c.id)
          );
          const characterNames = selectedCharacters.map(c => c.name);

          // Generate story text
          const storyTexts = await geminiService.generateStoryText(
            request.title,
            request.description,
            characterNames,
            request.pageCount || 5
          );

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
            storyMode: request.storyMode || 'animated'
          };

          // Generate images for each page (using placeholders for now)
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

            // Generate illustration with story mode support
            const storyMode = request.storyMode || 'animated';
            const imageUrl = await geminiService.generateStoryImage({
              prompt: storyTexts[i],
              style: storyMode === 'real' ? 'realistic' : 'animated',
              storyMode: storyMode
            });

            pages.push({
              pageNumber: i + 1,
              text: storyTexts[i],
              imageUrl: imageUrl
            });
          }

          // Set cover as first page image
          story.pages = pages;
          story.coverUrl = pages[0]?.imageUrl || '';
          story.status = 'complete';
          story.generationProgress = 100;

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
          set(state => ({
            stories: state.stories.filter(s => s.id !== storyId),
            currentStory: state.currentStory?.id === storyId ? null : state.currentStory
          }));
        } catch (error) {
          console.error('Failed to delete story:', error);
          throw error;
        }
      },

      // Refine a story image (placeholder for now)
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

          // For now, just keep the same image (refinement will work when Gemini 2.5 is available)
          const refinedImageUrl = page.imageUrl;

          // Update story
          const updatedStory = {
            ...story,
            pages: story.pages.map((p, idx) => 
              idx === pageIndex ? { ...p, imageUrl: refinedImageUrl } : p
            ),
            updatedAt: new Date()
          };

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