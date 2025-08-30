// NOTE: This service is temporarily disabled - should use Firebase Web SDK instead
// import storage from '@react-native-firebase/storage';
// import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Stub implementation - this service should be replaced with memoriesService
export const uploadImage = async (uri: string, path: string): Promise<string> => {
  console.warn('firebaseService: Using stub implementation - please use memoriesService instead');
  return uri; // Return the original URI as a placeholder
};

export const deleteImage = async (path: string): Promise<void> => {
  console.warn('firebaseService: Using stub implementation - please use memoriesService instead');
};

export const uploadMultipleImages = async (uris: string[], basePath: string): Promise<string[]> => {
  console.warn('firebaseService: Using stub implementation - please use memoriesService instead');
  return uris; // Return the original URIs as placeholders
};

export default {
  uploadImage,
  deleteImage,
  uploadMultipleImages
};