// import storage from '@react-native-firebase/storage';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Character, Story } from '../types/storybook';
import { getFirebaseServices } from './firebaseConfig';

// Firebase services are now initialized in firebaseConfig.ts

class FirebaseService {
  /**
   * Check if Firebase is properly configured and initialized
   */
  isConfigured(): boolean {
    const { initialized } = getFirebaseServices();
    return initialized;
  }

  /**
   * Upload an image to Firebase Storage
   */
  async uploadImage(
    imageData: string, 
    path: string, 
    metadata?: { [key: string]: string }
  ): Promise<string> {
    try {
      // TODO: Implement with React Native Firebase Storage when needed
      // const storage = require('@react-native-firebase/storage').default;
      // const storageRef = storage().ref(path);
      // const uploadMetadata = metadata ? { customMetadata: metadata } : undefined;
      // const snapshot = await storageRef.putString(imageData, 'data_url', uploadMetadata);
      // const downloadUrl = await storageRef.getDownloadURL();
      // return downloadUrl;
      
      // For now, return the imageData as placeholder
      console.log('Firebase Storage upload not implemented yet');
      return imageData;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  }

  /**
   * Delete an image from Firebase Storage
   */
  async deleteImage(path: string): Promise<void> {
    try {
      // TODO: Implement with React Native Firebase Storage when needed
      // const storage = require('@react-native-firebase/storage').default;
      // const storageRef = storage().ref(path);
      // await storageRef.delete();
      
      console.log('Firebase Storage delete not implemented yet:', path);
    } catch (error) {
      console.error('Image deletion failed:', error);
      // Don't throw - image might already be deleted
    }
  }

  /**
   * Save a character to Firestore
   */
  async saveCharacter(character: Character): Promise<void> {
    try {
      const characterRef = firestore().collection('characters').doc(character.id);
      await characterRef.set({
        ...character,
        createdAt: firestore.Timestamp.fromDate(character.createdAt),
        updatedAt: firestore.FieldValue.serverTimestamp()
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
    try {
      const characterRef = firestore().collection('characters').doc(characterId);
      const characterDoc = await characterRef.get();

      if (!characterDoc.exists) {
        return null;
      }

      const data = characterDoc.data();
      return {
        ...data,
        id: characterDoc.id,
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate()
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
    try {
      const query = firestore().collection('characters').orderBy('createdAt', 'desc');
      const snapshot = await query.get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as Character;
      });
    } catch (error) {
      console.error('Failed to get characters:', error);
      throw error;
    }
  }

  /**
   * Delete a character
   */
  async deleteCharacter(characterId: string): Promise<void> {
    try {
      const characterRef = firestore().collection('characters').doc(characterId);
      const character = await this.getCharacter(characterId);
      
      // Delete avatar image from storage if it exists
      if (character?.avatarUrl) {
        // Extract path from URL if it's a Firebase Storage URL
        const match = character.avatarUrl.match(/o\/(.*?)\?/);
        if (match) {
          await this.deleteImage(decodeURIComponent(match[1]));
        }
      }

      await characterRef.delete();
    } catch (error) {
      console.error('Failed to delete character:', error);
      throw error;
    }
  }

  /**
   * Save a story to Firestore
   */
  async saveStory(story: Story): Promise<void> {
    try {
      const storyRef = firestore().collection('stories').doc(story.id);
      await storyRef.set({
        ...story,
        createdAt: firestore.Timestamp.fromDate(story.createdAt),
        updatedAt: firestore.FieldValue.serverTimestamp()
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
    try {
      const storyRef = firestore().collection('stories').doc(storyId);
      const storyDoc = await storyRef.get();

      if (!storyDoc.exists) {
        return null;
      }

      const data = storyDoc.data();
      return {
        ...data,
        id: storyDoc.id,
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate()
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
    try {
      const query = firestore().collection('stories').orderBy('createdAt', 'desc');
      const snapshot = await query.get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as Story;
      });
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
    try {
      const storyRef = firestore().collection('stories').doc(storyId);
      const updateData: any = {
        status,
        updatedAt: firestore.FieldValue.serverTimestamp()
      };

      if (progress !== undefined) {
        updateData.generationProgress = progress;
      }

      await storyRef.update(updateData);
    } catch (error) {
      console.error('Failed to update story progress:', error);
      throw error;
    }
  }

  /**
   * Delete a story
   */
  async deleteStory(storyId: string): Promise<void> {
    try {
      const storyRef = firestore().collection('stories').doc(storyId);
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

      await storyRef.delete();
    } catch (error) {
      console.error('Failed to delete story:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new FirebaseService();