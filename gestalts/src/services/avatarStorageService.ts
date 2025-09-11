import { ref } from 'firebase/storage';
import { getFirebaseServices } from './firebaseConfig';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

export interface AvatarUploadResult {
  url: string;
  path: string;
  type: 'animated' | 'real';
}

export interface AvatarMetadata {
  characterId?: string;
  childProfileId?: string;
  userId: string;
  type: 'animated' | 'real';
  createdAt: string;
  characterName: string;
}

class AvatarStorageService {
  /**
   * Safely converts data URL to base64 string for React Native Firebase
   */
  private safeConvertDataURL(dataURL: string): string {
    try {
      // Validate input
      if (!dataURL || typeof dataURL !== 'string') {
        throw new Error('Invalid data URL: not a string');
      }
      
      console.log('🔍 Converting data URL, length:', dataURL.length, 'starts with:', dataURL.substring(0, 50));
      
      // Check if it's a proper data URL
      if (!dataURL.startsWith('data:')) {
        throw new Error('Invalid data URL: missing data: prefix');
      }
      
      // Split and extract base64 portion
      const parts = dataURL.split(',');
      if (parts.length !== 2) {
        throw new Error('Invalid data URL: malformed format');
      }
      
      const base64String = parts[1];
      if (!base64String || base64String.length === 0) {
        throw new Error('Invalid data URL: empty base64 data');
      }
      
      console.log('✅ Base64 extracted, length:', base64String.length);
      return base64String;
    } catch (error) {
      console.error('❌ Data URL conversion error:', error);
      throw new Error(`Data URL conversion failed: ${error.message}`);
    }
  }

  /**
   * Generates a storage path for avatar images
   */
  private generateAvatarPath(
    userId: string, 
    type: 'animated' | 'real',
    characterId?: string,
    childProfileId?: string
  ): string {
    const timestamp = Date.now();
    const typePrefix = type === 'animated' ? 'animated' : 'real';
    
    if (childProfileId) {
      return `avatars/profiles/${userId}/${childProfileId}/${typePrefix}_${timestamp}.png`;
    } else if (characterId) {
      return `avatars/characters/${userId}/${characterId}/${typePrefix}_${timestamp}.png`;
    } else {
      // Fallback for temporary uploads
      return `avatars/temp/${userId}/${typePrefix}_${timestamp}.png`;
    }
  }

  /**
   * Uploads an avatar image to Firebase Storage
   */
  async uploadAvatar(
    avatarDataURL: string,
    metadata: AvatarMetadata
  ): Promise<AvatarUploadResult> {
    try {
      const { auth } = getFirebaseServices();

      // Extract base64 string from data URL
      const base64String = this.safeConvertDataURL(avatarDataURL);

      // Generate storage path
      const storagePath = this.generateAvatarPath(
        metadata.userId,
        metadata.type,
        metadata.characterId,
        metadata.childProfileId
      );

      console.log(`📤 Uploading ${metadata.type} avatar to:`, storagePath);

      // Prepare REST upload (avoids Blob/ArrayBuffer in RN)
      const bucket =
        (Constants.expoConfig?.extra as any)?.firebase?.storageBucket ||
        'gestalts-mobile.firebasestorage.app';

      const idToken = await auth?.currentUser?.getIdToken?.();
      if (!idToken) {
        throw new Error('User not authenticated');
      }

      // Write base64 image to temp file
      const tmpFile = `${FileSystem.cacheDirectory}avatar_${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(tmpFile, base64String, {
        encoding: FileSystem.EncodingType.Base64,
      });

      try {
        const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(
          storagePath
        )}`;

        const response = await FileSystem.uploadAsync(url, tmpFile, {
          httpMethod: 'POST',
          headers: {
            'Content-Type': 'image/png',
            Authorization: `Firebase ${idToken}`,
          },
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        });

        if (response.status >= 400) {
          throw new Error(`HTTP ${response.status}: ${response.body?.slice?.(0, 200) || response.body}`);
        }

        const meta = JSON.parse(response.body || '{}');
        const downloadURL = meta.downloadTokens
          ? `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(
              meta.name || storagePath
            )}?alt=media&token=${meta.downloadTokens}`
          : `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(
              meta.name || storagePath
            )}?alt=media`;

        console.log(`✅ Avatar uploaded successfully:`, downloadURL);

        return {
          url: downloadURL,
          path: storagePath,
          type: metadata.type,
        };
      } finally {
        // Clean up temp file
        try {
          await FileSystem.deleteAsync(tmpFile, { idempotent: true });
        } catch {}
      }
    } catch (error) {
      console.error('❌ Failed to upload avatar to Firebase Storage (REST):', error);
      throw new Error(`Failed to upload avatar: ${error.message}`);
    }
  }

  /**
   * Uploads multiple avatar types (animated and real) for the same character
   */
  async uploadMultipleAvatars(
    avatars: { dataURL: string; type: 'animated' | 'real' }[],
    baseMetadata: Omit<AvatarMetadata, 'type'>
  ): Promise<AvatarUploadResult[]> {
    const uploadPromises = avatars.map(avatar =>
      this.uploadAvatar(avatar.dataURL, {
        ...baseMetadata,
        type: avatar.type
      })
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Deletes an avatar from Firebase Storage
   */
  async deleteAvatar(avatarPath: string): Promise<void> {
    try {
      const { storage } = getFirebaseServices();
      
      if (!storage) {
        throw new Error('Firebase Storage not initialized');
      }

      const storageRef = ref(storage, avatarPath);
      // Note: deleteObject is not available in the current Firebase SDK version
      // This would be implemented when needed for cleanup
      console.log(`🗑️ Avatar deletion requested for:`, avatarPath);
      
    } catch (error) {
      console.error('❌ Failed to delete avatar from Firebase Storage:', error);
      throw error;
    }
  }
}

export const avatarStorageService = new AvatarStorageService();
export default avatarStorageService;