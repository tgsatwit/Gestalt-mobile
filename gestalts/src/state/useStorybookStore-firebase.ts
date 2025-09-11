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
import {
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query as fsQuery,
  orderBy as fsOrderBy,
  serverTimestamp
} from 'firebase/firestore';
import { ref as storageRef, getDownloadURL, deleteObject } from 'firebase/storage';
// import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
// import storage from '@react-native-firebase/storage';
import geminiService from '../services/geminiService';
import avatarStorageService from '../services/avatarStorageService';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import authService from '../services/authService';
import {
  buildCharacterMappings,
  buildSceneContext,
  buildNarrativeContext,
  buildStoryContextDescription,
  generatePageVisualContext
} from '../utils/storyImageUtils';

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
  loadGestaltsCharacters: () => void;
  createCharacterFromPhoto: (photoUri: string, name: string, mode?: 'animated' | 'real', userId?: string) => Promise<Character>;
  deleteCharacter: (characterId: string) => Promise<void>;
  updateCharacterAvatar: (characterId: string, mode: 'animated' | 'real', dataUrl: string, userId?: string) => Promise<Character>;
  updateCharacterName: (characterId: string, newName: string) => Promise<void>;
  
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

// Helper to get user ID from Firebase Auth
const getUserId = (): string => {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    throw new Error('User not authenticated. Please sign in to use the storybook.');
  }
  // Return the actual Firebase Auth user ID
  return currentUser.uid;
};

// Helper to generate character avatar URLs with fallback
const getCharacterAvatarUrl = (characterId: string, fallbackUrl: string): string => {
  // Use the updated Firebase Storage URLs for specific characters with proper access tokens
  if (characterId === 'gestalts-boy') {
    return 'https://firebasestorage.googleapis.com/v0/b/gestalts-mobile.firebasestorage.app/o/avatars%2FAlex-Avatar.jpeg?alt=media&token=5ec35a3b-1ee4-45a1-a193-53f2c60300a0';
  }
  if (characterId === 'gestalts-girl') {
    return 'https://firebasestorage.googleapis.com/v0/b/gestalts-mobile.firebasestorage.app/o/avatars%2FEmma-Avatar.jpeg?alt=media&token=1721fb1c-5fa6-4cf0-9f09-08c8bb890d35';
  }
  
  // For other characters, try the old Firebase Storage URL format
  const firebaseUrl = `https://storage.googleapis.com/gestalts-mobile.appspot.com/public/gestalts-characters/${characterId}.svg`;
  
  // In a real app, you might want to test if the Firebase URL exists
  // For now, we'll use the Firebase URL if available, fallback to DiceBear
  return firebaseUrl; // Change this to fallbackUrl if you want to use DiceBear as primary
};

// NOTE: uploadImageToStorage function removed - now using avatarStorageService exclusively
// This eliminates all ArrayBuffer/blob issues in React Native production builds

// Helper to delete image from Firebase Storage
const deleteImageFromStorage = async (imageUrl: string) => {
  const { initialized, storage } = getFirebaseServices();
  if (!initialized || !storage) return;

  try {
    // Extract the path from Firebase Storage URL
    const pathMatch = imageUrl.match(/\/o\/(.+?)\?/);
    if (pathMatch) {
      const path = decodeURIComponent(pathMatch[1]);
      const imageRef = storageRef(storage, path);
      await deleteObject(imageRef);
      console.log('Successfully deleted from Firebase Storage:', path);
    }
  } catch (error) {
    console.warn('Failed to delete image from storage:', error);
  }
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

      // Load characters from Firebase
      loadCharacters: async () => {
        try {
          const { initialized, db } = getFirebaseServices();
          if (!initialized) {
            console.log('Firebase not initialized, skipping character load');
            return;
          }

          const userId = getUserId();
          if (!db) throw new Error('Firestore not initialized');

          const q = fsQuery(
            collection(db, 'users', userId, 'characters'),
            fsOrderBy('createdAt', 'desc')
          );
          const snapshot = await getDocs(q);

          const characters: Character[] = snapshot.docs.map((d) => {
            const data: any = d.data();
            const createdAt = (data.createdAt?.toDate ? data.createdAt.toDate() : new Date());
            const updatedAt = (data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date());
            return {
              id: d.id,
              name: data.name,
              type: data.type || 'user', // Default to 'user' for existing characters
              avatarUrl: data.avatarUrl,
              createdAt,
              updatedAt,
              visualProfile: data.visualProfile
            } as Character;
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

      // Load Gestalts characters (predefined characters)
      loadGestaltsCharacters: () => {
        // Define fallback URLs (now using updated Firebase Storage URLs with tokens)
        const alexFallbackUrl = 'https://firebasestorage.googleapis.com/v0/b/gestalts-mobile.firebasestorage.app/o/avatars%2FAlex-Avatar.jpeg?alt=media&token=5ec35a3b-1ee4-45a1-a193-53f2c60300a0';
        const emmaFallbackUrl = 'https://firebasestorage.googleapis.com/v0/b/gestalts-mobile.firebasestorage.app/o/avatars%2FEmma-Avatar.jpeg?alt=media&token=1721fb1c-5fa6-4cf0-9f09-08c8bb890d35';
        
        // Get the actual URLs that will be used
        const alexAvatarUrl = getCharacterAvatarUrl('gestalts-boy', alexFallbackUrl);
        const emmaAvatarUrl = getCharacterAvatarUrl('gestalts-girl', emmaFallbackUrl);
        
        console.log('Loading Gestalts Characters with URLs:');
        console.log('Alex (gestalts-boy):', alexAvatarUrl);
        console.log('Emma (gestalts-girl):', emmaAvatarUrl);
        
        const gestaltsCharacters: Character[] = [
          {
            id: 'gestalts-boy',
            name: 'Alex',
            type: 'gestalts',
            avatarUrl: alexAvatarUrl, // Legacy field for backwards compatibility
            avatars: {
              animated: alexAvatarUrl,
              real: alexAvatarUrl // For now, use same image for both modes - can be updated with real photos later
            },
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            visualProfile: {
              appearance: 'Alex is a friendly young boy with warm brown hair and bright, curious eyes. He has a cheerful face with a gentle smile that makes everyone feel welcome. His build is average for his age, with an energetic posture that shows he loves adventure.',
              style: 'Alex wears casual, comfortable clothes in earth tones - usually a navy blue t-shirt and dark pants. His style is practical and kid-friendly, perfect for outdoor adventures and learning new things.',
              personality: 'Alex is curious, brave, and kind-hearted. He approaches new situations with enthusiasm and always tries to help his friends. He loves exploring, asking questions, and sharing what he learns with others.',
              keyFeatures: ['Warm brown hair', 'Bright curious eyes', 'Friendly smile', 'Energetic posture', 'Navy blue clothing']
            }
          },
          {
            id: 'gestalts-girl',
            name: 'Emma',
            type: 'gestalts',
            avatarUrl: emmaAvatarUrl, // Legacy field for backwards compatibility
            avatars: {
              animated: emmaAvatarUrl,
              real: emmaAvatarUrl // For now, use same image for both modes - can be updated with real photos later
            },
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            visualProfile: {
              appearance: 'Emma is a spirited young girl with beautiful curly blonde hair that bounces when she moves. She has bright green eyes full of wonder and a warm, infectious smile. Her posture shows confidence and readiness for any adventure.',
              style: 'Emma loves wearing bright, cheerful colors - often a sky blue top with fun patterns. Her style is vibrant and expressive, reflecting her joyful personality and love for creativity.',
              personality: 'Emma is creative, empathetic, and full of joy. She loves making new friends, solving problems with creative solutions, and spreading happiness wherever she goes. She\'s always ready to lend a helping hand.',
              keyFeatures: ['Curly blonde hair', 'Bright green eyes', 'Infectious smile', 'Confident posture', 'Sky blue clothing with patterns']
            }
          }
        ];

        set({ gestaltsCharacters });
      },

      // Create a character from a photo or existing avatar URL
      createCharacterFromPhoto: async (photoUri: string, name: string, mode: 'animated' | 'real' = 'animated', userId?: string) => {
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

          // Check if this is already a generated avatar URL (starts with http or https) or needs to be uploaded
          if (photoUri.startsWith('http://') || photoUri.startsWith('https://')) {
            // This is already a public URL, just use it directly
            avatarUrl = photoUri;
            animatedAvatarUrl = photoUri; // Assume it's animated since it's pre-generated
            console.log('Using existing public URL directly:', avatarUrl);
            
            set({ 
              generationProgress: {
                status: 'generating',
                message: 'Saving avatar...',
                progress: 80
              }
            });
          } else if (photoUri.startsWith('data:')) {
            // This is a generated data URL that needs to be uploaded to Firebase Storage
            console.log('📤 Uploading generated avatar data URL to Firebase Storage');
            
            set({ 
              generationProgress: {
                status: 'uploading',
                message: 'Uploading avatar to cloud storage...',
                progress: 60
              }
            });

            if (userId) {
              const characterId = `char_${Date.now()}`;
              
              const upload = await avatarStorageService.uploadAvatar(photoUri, {
                userId,
                type: mode as 'animated' | 'real',
                characterName: name,
                characterId,
                createdAt: new Date().toISOString()
              });

              avatarUrl = upload.url;
              
              if (mode === 'real') {
                realAvatarUrl = upload.url;
              } else {
                animatedAvatarUrl = upload.url;
              }
            } else {
              // Fallback to data URL if no userId
              avatarUrl = photoUri;
              if (mode === 'real') {
                realAvatarUrl = photoUri;
              } else {
                animatedAvatarUrl = photoUri;
              }
            }
          } else {
            // This is a photo file URI, need to generate avatar
            console.log('📸 Processing photo file for avatar generation:', photoUri);
            
            // Read photo as base64
            const photoData = await FileSystem.readAsStringAsync(photoUri, {
              encoding: FileSystem.EncodingType.Base64,
            });

            // Generate single avatar based on mode
            set({ 
              generationProgress: {
                status: 'generating',
                message: `Creating ${mode} avatar for ${name}...`,
                progress: 30
              }
            });

            const avatarResult = await geminiService.generateAvatar({
              photoData: `data:image/jpeg;base64,${photoData}`,
              style: mode === 'real' ? 'real' : 'animated',
              mode: mode,
              characterName: name
            });

            // Handle both string and object return types
            const generatedDataUrl = typeof avatarResult === 'string' ? avatarResult : avatarResult.imageUrl;
            visualProfile = typeof avatarResult === 'object' ? avatarResult.visualProfile : undefined;
            
            // Upload avatar to Firebase Storage if userId is provided
            if (userId && generatedDataUrl) {
              set({ 
                generationProgress: {
                  status: 'uploading',
                  message: 'Uploading avatar to cloud storage...',
                  progress: 60
                }
              });

              const characterId = `char_${Date.now()}`;
              
              const upload = await avatarStorageService.uploadAvatar(generatedDataUrl, {
                userId,
                type: mode as 'animated' | 'real',
                characterName: name,
                characterId,
                createdAt: new Date().toISOString()
              });

              avatarUrl = upload.url;
              
              if (mode === 'real') {
                realAvatarUrl = upload.url;
              } else {
                animatedAvatarUrl = upload.url;
              }
            } else {
              // Fallback to data URL if no userId or upload fails
              avatarUrl = generatedDataUrl;
              
              if (mode === 'real') {
                realAvatarUrl = generatedDataUrl;
              } else {
                animatedAvatarUrl = generatedDataUrl;
              }
            }
          }

          // Create character object with dual avatar support (omit undefined avatar fields)
          const characterAvatars: any = {};
          if (animatedAvatarUrl) characterAvatars.animated = animatedAvatarUrl;
          if (realAvatarUrl) characterAvatars.real = realAvatarUrl;

          const character: Character = {
            id: `char_${Date.now()}`,
            name,
            avatarUrl: avatarUrl, // Legacy field for backwards compatibility
            avatars: characterAvatars,
            type: 'user', // User-created character
            visualProfile: visualProfile,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // Save to Firebase Firestore
          const { initialized, db } = getFirebaseServices();
          if (initialized && db) {
            const currentUserId = userId || getUserId();
            const docData: any = {
              name: character.name,
              type: character.type,
              avatarUrl: character.avatarUrl,
              visualProfile: character.visualProfile,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            if (character.avatars && Object.keys(character.avatars).length > 0) {
              docData.avatars = character.avatars;
            }
            await setDoc(doc(db, 'users', currentUserId, 'characters', character.id), docData);
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
          const { initialized, db } = getFirebaseServices();
          if (initialized) {
            // Get character to find avatar URL for deletion
            const character = get().characters.find(c => c.id === characterId);
            if (character?.avatarUrl) {
              await deleteImageFromStorage(character.avatarUrl);
            }
            
            // Delete from Firestore
            if (!db) throw new Error('Firestore not initialized');
            const userId = getUserId();
            await deleteDoc(doc(db, 'users', userId, 'characters', characterId));
          }
          
          set(state => ({
            characters: state.characters.filter(c => c.id !== characterId)
          }));
        } catch (error) {
          console.error('Failed to delete character:', error);
          throw error;
        }
      },

      // Update or add an avatar mode for an existing character
      updateCharacterAvatar: async (characterId: string, mode: 'animated' | 'real', dataUrl: string, userId?: string) => {
        try {
          const { initialized, db } = getFirebaseServices();
          const uid = userId || getUserId();
          if (!uid) throw new Error('User not authenticated');

          // Upload to Storage if dataUrl is data: scheme
          let finalUrl = dataUrl;
          if (dataUrl.startsWith('data:')) {
            const upload = await avatarStorageService.uploadAvatar(dataUrl, {
              userId: uid,
              type: mode,
              characterName: characterId,
              characterId,
              createdAt: new Date().toISOString()
            });
            finalUrl = upload.url;
          }

          // Update Firestore
          if (initialized && db) {
            const char = get().characters.find(c => c.id === characterId);
            const avatars: any = { ...(char?.avatars || {}) };
            avatars[mode] = finalUrl;
            const update: any = { avatars, updatedAt: serverTimestamp() };
            if (!char?.avatarUrl) {
              update.avatarUrl = finalUrl; // maintain legacy field if missing
            }
            await updateDoc(doc(db, 'users', uid, 'characters', characterId), update);
          }

          // Update local state
          const updated = get().characters.map(c => 
            c.id === characterId ? ({
              ...c,
              avatars: { ...(c.avatars || {}), [mode]: finalUrl },
              avatarUrl: c.avatarUrl || finalUrl,
              updatedAt: new Date()
            }) as Character : c
          );
          set({ characters: updated });
          const updatedChar = updated.find(c => c.id === characterId)!;
          return updatedChar;
        } catch (error) {
          console.error('Failed to update character avatar:', error);
          throw error;
        }
      },

      // Rename an existing character
      updateCharacterName: async (characterId: string, newName: string) => {
        try {
          const { initialized, db } = getFirebaseServices();
          const uid = getUserId();
          if (!uid) throw new Error('User not authenticated');
          if (initialized && db) {
            await updateDoc(doc(db, 'users', uid, 'characters', characterId), {
              name: newName,
              updatedAt: serverTimestamp()
            });
          }
          set(state => ({
            characters: state.characters.map(c => c.id === characterId ? { ...c, name: newName, updatedAt: new Date() } : c)
          }));
        } catch (error) {
          console.error('Failed to rename character:', error);
          throw error;
        }
      },

      // Load stories from Firebase
      loadStories: async () => {
        try {
          const { initialized, db } = getFirebaseServices();
          if (!initialized) {
            console.log('Firebase not initialized, skipping stories load');
            return;
          }

          const userId = getUserId();
          if (!db) throw new Error('Firestore not initialized');

          const q = fsQuery(
            collection(db, 'users', userId, 'stories'),
            fsOrderBy('createdAt', 'desc')
          );
          const snapshot = await getDocs(q);

          const stories: Story[] = snapshot.docs.map((d) => {
            const data: any = d.data();
            const createdAt = (data.createdAt?.toDate ? data.createdAt.toDate() : new Date());
            const updatedAt = (data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date());
            return {
              id: d.id,
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
              ageGroup: data.ageGroup,
              concept: data.concept,
              childProfileId: data.childProfileId,
              mode: data.mode,
              goal: data.goal
            } as Story;
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
        console.log('Starting story creation with:', {
          title: request.title,
          concept: request.concept,
          characterIds: request.characterIds,
          pageCount: request.pageCount,
          childProfile: request.childProfile
        });
        
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
          // Get all available characters (both user and Gestalts)
          const allAvailableCharacters = [...get().characters, ...get().gestaltsCharacters];
          console.log('All available characters:', allAvailableCharacters.map(c => ({ id: c.id, name: c.name })));
          console.log('Requested character IDs:', request.characterIds);
          
          // Handle profile-based character IDs specially
          const profileCharacterIds = request.characterIds.filter(id => id.startsWith('profile-'));
          const regularCharacterIds = request.characterIds.filter(id => !id.startsWith('profile-'));
          
          // Create temporary Character objects for child profiles
          const profileCharacters: Character[] = [];
          if (profileCharacterIds.length > 0 && request.childProfiles) {
            for (const profileId of profileCharacterIds) {
              const childProfileId = profileId.replace('profile-', '');
              const childProfile = request.childProfiles.find(p => p.id === childProfileId);
              if (childProfile) {
                // Get the appropriate avatar URL based on story mode
                const storyMode = request.storyMode || 'animated';
                let avatarUrl: string | undefined;
                
                if (childProfile.avatars) {
                  avatarUrl = storyMode === 'real' ? 
                    (childProfile.avatars.real || childProfile.avatars.animated || childProfile.avatarUrl) :
                    (childProfile.avatars.animated || childProfile.avatars.real || childProfile.avatarUrl);
                } else {
                  avatarUrl = childProfile.avatarUrl;
                }
                
                profileCharacters.push({
                  id: profileId,
                  name: childProfile.name,
                  type: 'user',
                  avatarUrl: avatarUrl || '', // Default to empty string if no avatar
                  createdAt: new Date(),
                  updatedAt: new Date()
                });
              }
            }
          }
          
          // Combine all characters for selection
          const allCharactersWithProfiles = [...allAvailableCharacters, ...profileCharacters];
          
          // Filter selected characters
          const selectedCharacters = allCharactersWithProfiles.filter(c => 
            request.characterIds.includes(c.id)
          );
          console.log('Selected characters:', selectedCharacters.map(c => ({ id: c.id, name: c.name })));
          
          const characterNames = selectedCharacters.map(c => c.name);
          
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
            goal: request.advanced?.goal,
            storyMode: request.storyMode || 'animated'
          };

          // Generate images for each page
          const pages = [];
          for (let i = 0; i < storyTexts.length; i++) {
            // Generate page-specific visual context first
            const pageContext = generatePageVisualContext(
              i + 1,
              storyTexts.length,
              storyTexts[i],
              request.concept || 'learning'
            );
            
            const pageProgress = Math.round(20 + (i * 60 / storyTexts.length));
            const storyMode = request.storyMode || 'animated';
            set({ 
              generationProgress: {
                status: 'generating',
                message: `Creating ${storyMode} illustration for page ${i + 1}... (${pageContext.pageRole})`,
                progress: pageProgress,
                currentPage: i + 1,
                totalPages: storyTexts.length
              }
            });
            
            console.log(`Starting image generation: Page ${i + 1}/${storyTexts.length} (${pageProgress}%)`);
            console.log(`- Characters: ${allCharacterNames.join(', ')}`);
            console.log(`- Concept: ${request.concept}`);
            console.log(`- Scene: ${pageContext.visualEmphasis}`);

            // Get character avatar URLs as references
            const referenceImages = selectedCharacters.map(c => c.avatarUrl).filter(url => url && url.length > 0);
            console.log(`Page ${i + 1} - Reference images:`, referenceImages.length);
            
            // Build optimized character profiles using utility functions
            // Pass the combined characters list that includes profile characters
            const characterProfiles = buildCharacterMappings(
              allCharactersWithProfiles,
              request.characterIds,
              request.childProfile
            );
            console.log(`Page ${i + 1} - Character profiles:`, characterProfiles.map(cp => cp.name));
            
            // Build scene context for visual continuity
            const sceneContext = buildSceneContext(
              i + 1,
              request.concept || 'learning',
              request.advanced?.tone
            );
            
            // Generate narrative context for better scene understanding
            const narrativeContext = buildNarrativeContext(
              storyTexts,
              i,
              request.title,
              request.concept || 'learning'
            );
            
            // Page context already generated above

            // Generate illustration with comprehensive context and narrative understanding
            const imageUrl = await geminiService.generateStoryImage({
              prompt: `${narrativeContext.currentPageText}`,
              style: storyMode === 'real' ? 'realistic' : 'animated',
              storyMode: storyMode,
              referenceImages,
              isFirstPage: i === 0, // First page flag for proper generation method
              characterMappings: characterProfiles, // Pass character mappings with avatar info
              referencePageImage: i > 0 && pages.length > 0 ? pages[0].imageUrl : undefined, // Use first page as reference
              context: {
                concept: request.concept,
                characterNames: allCharacterNames,
                childName: request.childProfile?.includeAsCharacter ? request.childProfile.name : undefined,
                pageNumber: i + 1,
                totalPages: storyTexts.length,
                previousPageContext: narrativeContext.previousPage ? `Previous page: "${narrativeContext.previousPage}"` : undefined,
                sceneContext,
                characterProfiles,
                storyContext: buildStoryContextDescription(
                  request.title,
                  request.concept || 'learning',
                  allCharacterNames
                ),
                advanced: request.advanced,
                allStoryPages: storyTexts // Provide complete story context for narrative consistency
              }
            });
            
            console.log(`Generated image for ${pageContext.pageRole}:`);
            console.log(`  - Text: "${narrativeContext.currentPageText.substring(0, 50)}..."`);
            console.log(`  - Characters: ${allCharacterNames.join(', ')}`);
            console.log(`  - Concept: ${request.concept}`);
            console.log(`  - Image URL: ${imageUrl.startsWith('data:') ? `${imageUrl.substring(0, 50)}... [base64 data truncated]` : imageUrl}`);
            console.log(`  - Character profiles count: ${characterProfiles.length}`);
            console.log(`  - Reference images count: ${referenceImages.length}`);

            // Upload to Firebase Storage if configured, otherwise use generated URL
            let finalImageUrl = imageUrl;
            const { initialized } = getFirebaseServices();
            if (initialized && imageUrl.startsWith('data:')) {
              try {
                set({ 
                  generationProgress: {
                    status: 'generating',
                    message: `Saving page ${i + 1} illustration...`,
                    progress: Math.round(20 + (i * 60 / storyTexts.length) + (10 / storyTexts.length)),
                    currentPage: i + 1,
                    totalPages: storyTexts.length
                  }
                });
                
                const userId = getUserId();
                
                // Use avatarStorageService for safe upload without ArrayBuffer issues
                const upload = await avatarStorageService.uploadAvatar(imageUrl, {
                  userId,
                  type: 'animated', // Story images are considered animated type
                  characterName: story.title,
                  characterId: `story_${story.id}_page_${i + 1}`,
                  createdAt: new Date().toISOString()
                });
                
                finalImageUrl = upload.url;
                console.log(`Successfully uploaded page ${i + 1} image to Firebase Storage`);
              } catch (error) {
                console.warn(`Failed to upload page ${i + 1} to Firebase Storage, using generated URL:`, error);
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
          const { initialized, db } = getFirebaseServices();
          if (initialized && db) {
            const userId = getUserId();
            const storyData: any = {
              title: story.title,
              description: story.description,
              coverUrl: story.coverUrl,
              characterIds: story.characterIds,
              pages: story.pages,
              status: story.status,
              generationProgress: story.generationProgress,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            if (story.theme) storyData.theme = story.theme;
            if (story.ageGroup) storyData.ageGroup = story.ageGroup;
            if (story.concept) storyData.concept = story.concept;
            if (story.childProfileId) storyData.childProfileId = story.childProfileId;
            if (story.mode) storyData.mode = story.mode;
            if (story.goal) storyData.goal = story.goal;

            await setDoc(doc(db, 'users', userId, 'stories', story.id), storyData);
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
          const { initialized, db } = getFirebaseServices();
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
            if (!db) throw new Error('Firestore not initialized');
            const userId = getUserId();
            await deleteDoc(doc(db, 'users', userId, 'stories', storyId));
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
          if (refinedImageUrl !== page.imageUrl && refinedImageUrl.startsWith('data:')) {
            const { initialized } = getFirebaseServices();
            if (initialized) {
              try {
                const userId = getUserId();
                
                // Use avatarStorageService for safe upload without ArrayBuffer issues
                const upload = await avatarStorageService.uploadAvatar(refinedImageUrl, {
                  userId,
                  type: 'animated', // Story images are considered animated type
                  characterName: `refined_${story.title}`,
                  characterId: `story_${storyId}_page_${pageIndex + 1}_refined_${Date.now()}`,
                  createdAt: new Date().toISOString()
                });
                
                finalImageUrl = upload.url;
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
          const { initialized, db } = getFirebaseServices();
          if (initialized && db) {
            const userId = getUserId();
            await updateDoc(doc(db, 'users', userId, 'stories', storyId), {
              pages: updatedStory.pages,
              updatedAt: serverTimestamp()
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