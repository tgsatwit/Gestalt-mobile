import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject
} from 'firebase/storage';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy
} from 'firebase/firestore';
import { Character, Story } from '../types/storybook';
import { getFirebaseServices } from './firebaseConfig';

// Firebase services are now initialized in firebaseConfig.ts

class FirebaseService {
  private app: any = null;
  private storage: any = null;
  private db: any = null;
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const services = getFirebaseServices();
    this.app = services.app;
    this.storage = services.storage;
    this.db = services.db;
    this.initialized = services.initialized;
  }

  private checkInitialized() {
    if (!this.initialized || !this.storage || !this.db) {
      // Try to reinitialize
      this.initialize();
      if (!this.initialized || !this.storage || !this.db) {
        throw new Error('Firebase service not initialized. Please configure Firebase in your .env file');
      }
    }
  }

  /**
   * Upload an image to Firebase Storage
   */
  async uploadImage(
    imageData: string, 
    path: string, 
    metadata?: { [key: string]: string }
  ): Promise<string> {
    this.checkInitialized();

    try {
      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();

      // Create storage reference
      const storageRef = ref(this.storage!, path);

      // Upload file with metadata
      const uploadMetadata = metadata ? { customMetadata: metadata } : undefined;
      const snapshot = await uploadBytes(storageRef, blob, uploadMetadata);

      // Get download URL
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  }

  /**
   * Delete an image from Firebase Storage
   */
  async deleteImage(path: string): Promise<void> {
    this.checkInitialized();

    try {
      const storageRef = ref(this.storage!, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Image deletion failed:', error);
      // Don't throw - image might already be deleted
    }
  }

  /**
   * Save a character to Firestore
   */
  async saveCharacter(character: Character): Promise<void> {
    this.checkInitialized();

    try {
      const characterRef = doc(this.db!, 'characters', character.id);
      await setDoc(characterRef, {
        ...character,
        createdAt: character.createdAt.toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save character:', error);
      throw error;
    }
  }

  /**
   * Get a character by ID
   */
  async getCharacter(characterId: string): Promise<Character | null> {
    this.checkInitialized();

    try {
      const characterRef = doc(this.db!, 'characters', characterId);
      const characterDoc = await getDoc(characterRef);

      if (!characterDoc.exists()) {
        return null;
      }

      const data = characterDoc.data();
      return {
        ...data,
        id: characterDoc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      } as Character;
    } catch (error) {
      console.error('Failed to get character:', error);
      throw error;
    }
  }

  /**
   * Get all characters
   */
  async getAllCharacters(): Promise<Character[]> {
    this.checkInitialized();

    try {
      const charactersRef = collection(this.db!, 'characters');
      const q = query(charactersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: new Date(doc.data().createdAt),
        updatedAt: new Date(doc.data().updatedAt)
      } as Character));
    } catch (error) {
      console.error('Failed to get characters:', error);
      throw error;
    }
  }

  /**
   * Delete a character
   */
  async deleteCharacter(characterId: string): Promise<void> {
    this.checkInitialized();

    try {
      const characterRef = doc(this.db!, 'characters', characterId);
      const character = await this.getCharacter(characterId);
      
      // Delete avatar image from storage if it exists
      if (character?.avatarUrl) {
        // Extract path from URL if it's a Firebase Storage URL
        const match = character.avatarUrl.match(/o\/(.*?)\?/);
        if (match) {
          await this.deleteImage(decodeURIComponent(match[1]));
        }
      }

      await deleteDoc(characterRef);
    } catch (error) {
      console.error('Failed to delete character:', error);
      throw error;
    }
  }

  /**
   * Save a story to Firestore
   */
  async saveStory(story: Story): Promise<void> {
    this.checkInitialized();

    try {
      const storyRef = doc(this.db!, 'stories', story.id);
      await setDoc(storyRef, {
        ...story,
        createdAt: story.createdAt.toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save story:', error);
      throw error;
    }
  }

  /**
   * Get a story by ID
   */
  async getStory(storyId: string): Promise<Story | null> {
    this.checkInitialized();

    try {
      const storyRef = doc(this.db!, 'stories', storyId);
      const storyDoc = await getDoc(storyRef);

      if (!storyDoc.exists()) {
        return null;
      }

      const data = storyDoc.data();
      return {
        ...data,
        id: storyDoc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      } as Story;
    } catch (error) {
      console.error('Failed to get story:', error);
      throw error;
    }
  }

  /**
   * Get all stories
   */
  async getAllStories(): Promise<Story[]> {
    this.checkInitialized();

    try {
      const storiesRef = collection(this.db!, 'stories');
      const q = query(storiesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: new Date(doc.data().createdAt),
        updatedAt: new Date(doc.data().updatedAt)
      } as Story));
    } catch (error) {
      console.error('Failed to get stories:', error);
      throw error;
    }
  }

  /**
   * Update story status and progress
   */
  async updateStoryProgress(
    storyId: string, 
    status: Story['status'], 
    progress?: number
  ): Promise<void> {
    this.checkInitialized();

    try {
      const storyRef = doc(this.db!, 'stories', storyId);
      const updateData: any = {
        status,
        updatedAt: new Date().toISOString()
      };

      if (progress !== undefined) {
        updateData.generationProgress = progress;
      }

      await updateDoc(storyRef, updateData);
    } catch (error) {
      console.error('Failed to update story progress:', error);
      throw error;
    }
  }

  /**
   * Delete a story
   */
  async deleteStory(storyId: string): Promise<void> {
    this.checkInitialized();

    try {
      const storyRef = doc(this.db!, 'stories', storyId);
      const story = await this.getStory(storyId);
      
      // Delete all story images from storage
      if (story) {
        // Delete cover image
        if (story.coverUrl) {
          const match = story.coverUrl.match(/o\/(.*?)\?/);
          if (match) {
            await this.deleteImage(decodeURIComponent(match[1]));
          }
        }

        // Delete page images
        for (const page of story.pages) {
          if (page.imageUrl) {
            const match = page.imageUrl.match(/o\/(.*?)\?/);
            if (match) {
              await this.deleteImage(decodeURIComponent(match[1]));
            }
          }
        }
      }

      await deleteDoc(storyRef);
    } catch (error) {
      console.error('Failed to delete story:', error);
      throw error;
    }
  }

  /**
   * Check if Firebase is properly configured and initialized
   */
  isConfigured(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export default new FirebaseService();