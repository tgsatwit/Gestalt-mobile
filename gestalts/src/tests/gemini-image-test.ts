/**
 * Test script to verify Gemini image generation functionality
 * This verifies that the service is properly configured for real image generation
 */

import GeminiService from '../services/geminiService';
import type { ImageGenerationRequest } from '../types/storybook';

export async function testGeminiImageGeneration(): Promise<boolean> {
  try {
    console.log('🧪 Testing Gemini image generation...');
    
    // Mock request for testing
    const testRequest: ImageGenerationRequest & { context?: any } = {
      prompt: 'A friendly Pixar-style character waving hello in a sunny playground',
      context: {
        concept: 'friendship',
        characterNames: ['Alex'],
        childName: 'Alex', 
        pageNumber: 1,
        totalPages: 5,
        characterProfiles: [{
          name: 'Alex',
          appearance: 'A cheerful child with brown hair and bright eyes',
          style: 'Colorful t-shirt and comfortable jeans',
          keyFeatures: ['Friendly smile', 'Expressive eyes', 'Energetic posture'],
          avatarUrl: undefined // Test without avatar first
        }],
        sceneContext: {
          setting: 'Playground scene for friendship story',
          mood: 'happy and welcoming',
          colorPalette: ['bright yellow', 'sky blue', 'grass green'],
          visualStyle: 'Professional Pixar 3D animation'
        }
      }
    };

    // Test the image generation
    const result = await GeminiService.generateStoryImage(testRequest);
    
    console.log('✅ Image generation test completed');
    console.log('📄 Result:', result.startsWith('data:') ? `${result.substring(0, 50)}... [base64 data truncated]` : result);
    
    // Check if we got a real file path vs placeholder
    const isRealImage = result.includes('documentDirectory') || result.includes('storybook_images');
    const isPlaceholder = result.includes('placehold.co') || result.includes('dicebear.com');
    
    console.log(`🖼️ Image type: ${isRealImage ? 'Real Generated Image' : isPlaceholder ? 'Placeholder' : 'Unknown'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Gemini image generation test failed:', error);
    return false;
  }
}

// Export for potential use in debugging
export default testGeminiImageGeneration;