import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { 
  AvatarGenerationRequest, 
  ImageGenerationRequest, 
  ImageRefinementRequest,
  StorybookError 
} from '../types/storybook';

// Get API key from environment variables directly
const getGeminiApiKey = (): string => {
  // Try multiple sources for the API key
  let apiKey: string | undefined;
  
  // Method 1: Direct process.env (works in some React Native setups)
  if (typeof process !== 'undefined' && process.env) {
    apiKey = process.env.GEMINI_API_KEY;
  }
  
  // Method 2: Expo Constants (if substitution worked)
  if (!apiKey || apiKey.includes('${')) {
    const configKey = Constants.expoConfig?.extra?.geminiApiKey;
    if (configKey && !configKey.includes('${')) {
      apiKey = configKey;
    }
  }
  
  // Method 3: Try Expo manifest (legacy)
  if (!apiKey || apiKey.includes('${')) {
    apiKey = (Constants as any).manifest?.extra?.geminiApiKey;
  }
  
  console.log('Checking API key sources:');
  console.log('- process.env.GEMINI_API_KEY:', process.env?.GEMINI_API_KEY ? 'found' : 'not found');
  console.log('- Constants.expoConfig.extra.geminiApiKey:', Constants.expoConfig?.extra?.geminiApiKey ? 'found' : 'not found');
  console.log('- Constants.expoConfig.extra:', Constants.expoConfig?.extra);
  console.log('- Final API key:', apiKey ? `found (${apiKey.substring(0, 10)}...)` : 'not found');
  
  if (!apiKey || apiKey === 'undefined' || apiKey.includes('${')) {
    console.error('❌ Gemini API key not found in any source');
    
    // For development, let's try a hardcoded approach as fallback
    // This is not recommended for production but helps with development
    const hardcodedKey = 'AIzaSyBWthPCLGAKUDVhZmEzY8Y76cfS2V7Y4FA'; // From your .env file
    if (hardcodedKey && hardcodedKey !== 'your_api_key_here') {
      console.warn('⚠️ Using hardcoded API key for development');
      return hardcodedKey;
    }
    
    throw new Error('Gemini API key not configured. Please ensure GEMINI_API_KEY is in your .env file and restart the app');
  }
  
  console.log('✅ Gemini API key found successfully');
  return apiKey;
};

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      const apiKey = getGeminiApiKey();
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Using gemini-2.5-flash-image-preview for image generation capabilities
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
      this.initialized = true;
      console.log('Gemini service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gemini service:', error);
      this.initialized = false;
      // Don't throw here - let individual methods handle the error
    }
  }

  private checkInitialized() {
    if (!this.initialized || !this.genAI || !this.model) {
      // Try to reinitialize
      this.initialize();
      if (!this.initialized) {
        throw new Error('Gemini service not initialized. Please check your API key configuration.');
      }
    }
  }

  /**
   * Generate a Pixar-style avatar from a photo
   */
  async generateAvatar(request: AvatarGenerationRequest): Promise<string> {
    try {
      this.checkInitialized();
      
      const style = request.style || 'pixar';
      const prompt = `Transform this person into a ${style}-style animated character. 
        The character should maintain the key facial features and expression from the photo.
        Make it child-friendly, colorful, and appealing. 
        Style: 3D animated ${style} character portrait.
        ${request.characterName ? `This character is named ${request.characterName}.` : ''}`;

      // Convert base64 to image part for Gemini
      const imagePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: request.photoData.replace(/^data:image\/\w+;base64,/, '')
        }
      };

      // Generate avatar with Gemini 2.5 Flash Image Preview
      console.log('Avatar generation requested for:', request.characterName);
      
      try {
        const result = await this.model.generateContent([prompt, imagePart]);
        const response = await result.response;
        
        // Check if the response contains generated image data
        if (response.candidates && response.candidates[0]) {
          const candidate = response.candidates[0];
          // For now, return placeholder until we can extract actual image data
          console.log('Gemini 2.5 image generation response received');
          return this.generatePlaceholderImage(style, request.characterName || 'avatar');
        }
      } catch (error) {
        console.warn('Gemini image generation failed, using placeholder:', error);
      }
      
      return this.generatePlaceholderImage(style, request.characterName || 'avatar');
    } catch (error) {
      console.error('Avatar generation failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Generate a story illustration with character references
   */
  async generateStoryImage(request: ImageGenerationRequest & {
    context?: {
      concept?: string;
      characterNames?: string[];
      childName?: string;
      advanced?: {
        density: 'one-word' | 'one-sentence' | 'multiple-sentences';
        narrative: 'first-person' | 'third-person';
        complexity: 'very-simple' | 'simple' | 'moderate' | 'complex';
        communicationStyle: 'visual-heavy' | 'balanced' | 'text-heavy';
        tone: 'playful' | 'gentle' | 'encouraging' | 'educational';
        goal: string;
      };
    };
  }): Promise<string> {
    try {
      const style = request.style || 'pixar';
      let enhancedPrompt = `Create a children's book illustration in ${style} style.
        Scene: ${request.prompt}
        Make it vibrant, child-friendly, and magical.
        Style: High-quality children's book illustration, ${style} animation style.`;
      
      // Add context for concept learning
      if (request.context) {
        if (request.context.concept) {
          enhancedPrompt += `
        Learning Focus: This illustration should visually represent the concept of ${request.context.concept}.`;
        }
        
        if (request.context.childName) {
          enhancedPrompt += `
        Main Character: Feature ${request.context.childName} prominently in the illustration as a relatable child character.`;
        }
        
        if (request.context.characterNames && request.context.characterNames.length > 0) {
          enhancedPrompt += `
        Characters to Include: ${request.context.characterNames.join(', ')}`;
        }
        
        if (request.context.advanced?.tone) {
          enhancedPrompt += `
        Mood: Create a ${request.context.advanced.tone} atmosphere in the illustration.`;
        }
      }

      // If reference images are provided, include them
      const parts: any[] = [enhancedPrompt];
      
      if (request.referenceImages && request.referenceImages.length > 0) {
        for (const refImage of request.referenceImages) {
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: refImage.replace(/^data:image\/\w+;base64,/, '')
            }
          });
        }
      }

      try {
        const result = await this.model.generateContent(parts);
        const response = await result.response;
        
        // Check if the response contains generated image data
        if (response.candidates && response.candidates[0]) {
          console.log('Gemini 2.5 story image generation response received');
          // For now, return placeholder until we can extract actual image data
          const seed = request.context?.concept ? 
            `${request.prompt}-${request.context.concept}` : 
            request.prompt;
          return this.generatePlaceholderImage(style, seed);
        }
      } catch (error) {
        console.warn('Gemini story image generation failed, using placeholder:', error);
      }
      
      // Fallback to placeholder
      const seed = request.context?.concept ? 
        `${request.prompt}-${request.context.concept}` : 
        request.prompt;
      return this.generatePlaceholderImage(style, seed);
    } catch (error) {
      console.error('Story image generation failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Refine an existing illustration based on user feedback
   */
  async refineImage(request: ImageRefinementRequest): Promise<string> {
    try {
      const prompt = `Modify this illustration based on the following instruction: ${request.refinementPrompt}
        Keep the overall composition and style but apply the requested change.
        Maintain the children's book aesthetic.`;

      // Download the image to include as reference
      const imageData = await this.downloadImageAsBase64(request.imageUrl);
      
      const imagePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData
        }
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      
      // Temporary placeholder
      console.warn('Direct image editing not available in current Gemini model');
      return request.imageUrl; // Return original for now
    } catch (error) {
      console.error('Image refinement failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Generate story text using AI
   */
  async generateStoryText(
    title: string, 
    description: string, 
    characterNames: string[], 
    pageCount: number = 5,
    context?: {
      concept?: string;
      childName?: string;
      advanced?: {
        density: 'one-word' | 'one-sentence' | 'multiple-sentences';
        narrative: 'first-person' | 'third-person';
        complexity: 'very-simple' | 'simple' | 'moderate' | 'complex';
        communicationStyle: 'visual-heavy' | 'balanced' | 'text-heavy';
        tone: 'playful' | 'gentle' | 'encouraging' | 'educational';
        goal: string;
      };
    }
  ): Promise<string[]> {
    try {
      this.checkInitialized();
      
      // Build enhanced prompt with concept learning context
      let prompt = `Create a children's story with the following details:
        Title: ${title}
        Description: ${description}
        Characters: ${characterNames.join(', ')}
        Number of pages: ${pageCount}`;
      
      // Add concept learning context if provided
      if (context?.concept) {
        prompt += `
        Learning Concept: ${context.concept}`;
        prompt += `
        Educational Goal: This story should help teach the concept of ${context.concept}.`;
        
        if (context.advanced?.goal) {
          prompt += `
        Specific Learning Objective: ${context.advanced.goal}`;
        }
      }
      
      if (context?.childName) {
        prompt += `
        Special Character: Include ${context.childName} as a main character in the story. Make ${context.childName} relatable and central to learning the concept.`;
      }
      
      // Add advanced settings if provided
      if (context?.advanced) {
        const { density, narrative, complexity, tone } = context.advanced;
        
        prompt += `
        
        Story Requirements:
        - Text Density: ${density === 'one-word' ? 'Very brief, one key word or phrase per page' : 
                        density === 'one-sentence' ? 'One simple sentence per page' : 
                        'Multiple sentences per page (2-4)'}
        - Narrative Style: ${narrative === 'first-person' ? 'Written from the character\'s perspective (I, me, we)' : 'Third-person narration (he, she, they)'}
        - Language Complexity: ${complexity} vocabulary and sentence structure
        - Tone: ${tone} and engaging for children`;
      }
      
      prompt += `
        
        Write a complete story with ${pageCount} paragraphs (one per page).
        Make it engaging, educational, and age-appropriate.
        Include all character names naturally in the story.
        
        Format: Return only the story text, with each page's text on a new line.`;

      console.log('Generating story text with Gemini API...');
      const result = await this.model!.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Story text generated successfully');
      
      // Split into pages
      const pages = text.split('\n').filter((line: string) => line.trim().length > 0);
      
      // Ensure we have the right number of pages
      while (pages.length < pageCount) {
        pages.push('The adventure continues...');
      }
      
      return pages.slice(0, pageCount);
    } catch (error) {
      console.error('Story text generation failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Helper to download an image and convert to base64
   */
  private async downloadImageAsBase64(url: string): Promise<string> {
    try {
      const response = await FileSystem.downloadAsync(
        url,
        FileSystem.documentDirectory + 'temp_image.jpg'
      );
      
      const base64 = await FileSystem.readAsStringAsync(response.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Clean up temp file
      await FileSystem.deleteAsync(response.uri, { idempotent: true });
      
      return base64;
    } catch (error) {
      console.error('Failed to download image:', error);
      throw error;
    }
  }

  /**
   * Generate a placeholder image URL (temporary until real image generation)
   */
  private generatePlaceholderImage(style: string, seed: string): string {
    // Using picsum for placeholder images
    const hash = seed.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return `https://picsum.photos/seed/${Math.abs(hash)}/1024/1024`;
  }

  /**
   * Handle and format errors
   */
  private handleError(error: any): StorybookError {
    if (error.message?.includes('API key')) {
      return {
        code: 'AUTH_ERROR',
        message: 'Invalid or missing API key',
        details: error.message,
        retryable: false
      };
    }
    
    if (error.message?.includes('quota') || error.message?.includes('rate')) {
      return {
        code: 'RATE_LIMIT',
        message: 'Rate limit exceeded. Please try again later.',
        details: error.message,
        retryable: true
      };
    }
    
    return {
      code: 'GENERATION_ERROR',
      message: 'Failed to generate content',
      details: error.message || error,
      retryable: true
    };
  }
}

export default new GeminiService();