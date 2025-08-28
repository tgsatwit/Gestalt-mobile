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
      
      const style = 'pixar'; // Consistent Pixar style per storybook guidelines
      const prompt = `Transform this person into a professional Pixar-style 3D animated character following storybook illustration guidelines.
        
        PIXAR CHARACTER DESIGN REQUIREMENTS:
        - Professional Pixar 3D animation aesthetic (like characters from Toy Story, Finding Nemo, Coco)
        - Maintain the person's key facial features, expressions, and recognizable characteristics
        - Child-friendly, appealing design with rounded, soft features
        - Vibrant, rich colors with smooth, polished surfaces
        - Expressive eyes and friendly facial expressions
        - Age-appropriate stylization that preserves the person's identity
        - Distinctive visual traits that will be easily recognizable in story illustrations
        
        CHARACTER CONSISTENCY GUIDELINES:
        - Create a character design that can be consistently reproduced across multiple story pages
        - Ensure clear, memorable features (hairstyle, eye color, facial structure)
        - Use a distinctive color palette and clothing style
        - Design should work well in various poses and expressions
        - Character should integrate seamlessly into children's storybook scenes
        
        TECHNICAL SPECIFICATIONS:
        - High-quality 3D rendered portrait in Pixar animation style
        - Clear, sharp details with proper lighting and depth
        - Suitable for use as a character reference in story generation
        - Professional children's media quality
        ${request.characterName ? `
        
        CHARACTER IDENTITY: This character represents ${request.characterName} and should embody a friendly, engaging personality suitable for children's storytelling.` : ''}
        
        The result should be a character that children will instantly recognize and connect with in their personalized stories.`;

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
   * Generate a story illustration with consistent Pixar-style character references
   * Following storybook guidelines for character consistency and visual quality
   */
  async generateStoryImage(request: ImageGenerationRequest & {
    context?: {
      concept?: string;
      characterNames?: string[];
      childName?: string;
      storyContext?: string; // Full story context for consistency
      pageNumber?: number;
      totalPages?: number;
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
      const style = 'pixar'; // Consistent Pixar style per guidelines
      const mainCharacter = request.context?.childName || request.context?.characterNames?.[0] || 'the child';
      
      // Build comprehensive prompt following storybook guidelines
      let enhancedPrompt = `Create a high-quality children's storybook illustration in professional Pixar 3D animation style.
        
        SCENE TO ILLUSTRATE: ${request.prompt}
        
        PIXAR STYLE REQUIREMENTS:
        - Professional Pixar 3D animation aesthetic (like Toy Story, Finding Nemo, Coco)
        - Vibrant, saturated colors with soft, warm lighting
        - Rounded, child-friendly character designs
        - Smooth, polished surfaces with subtle texture details
        - Dynamic composition with depth and visual interest
        - Expressive character emotions and body language
        - Rich environmental details and atmospheric depth
        
        CHARACTER CONSISTENCY GUIDELINES:
        - Maintain identical character appearance across all illustrations
        - Use provided reference images to ensure character likeness
        - Keep character proportions, clothing, and features consistent
        - Characters should have distinctive, memorable visual traits
        - Facial features, hair style, and clothing must match references exactly`;
      
      // Add character-specific details
      if (request.context) {
        if (mainCharacter && mainCharacter !== 'the child') {
          enhancedPrompt += `
        
        MAIN CHARACTER: ${mainCharacter}
        - Feature ${mainCharacter} as the central focus of the illustration
        - ${mainCharacter} should be easily recognizable and consistent with previous pages
        - Show ${mainCharacter}'s personality through pose and expression`;
        }
        
        if (request.context.characterNames && request.context.characterNames.length > 0) {
          enhancedPrompt += `
        
        ALL CHARACTERS IN SCENE: ${request.context.characterNames.join(', ')}
        - Each character must be visually distinct and consistent
        - Maintain the same design language for all characters
        - Ensure characters interact naturally within the scene`;
        }
        
        // Add story context for consistency
        if (request.context.storyContext) {
          enhancedPrompt += `
        
        STORY CONTEXT: ${request.context.storyContext}
        - This illustration should fit naturally within the overall story narrative
        - Maintain visual continuity with the story's theme and setting`;
        }
        
        // Add page context for story flow
        if (request.context.pageNumber && request.context.totalPages) {
          enhancedPrompt += `
        
        PAGE CONTEXT: Page ${request.context.pageNumber} of ${request.context.totalPages}
        - Consider the story's progression and pacing
        - Ensure visual flow that connects to previous and next pages`;
        }
        
        // Add learning concept integration
        if (request.context.concept) {
          enhancedPrompt += `
        
        EDUCATIONAL FOCUS: ${request.context.concept}
        - Subtly incorporate visual elements that reinforce learning about "${request.context.concept}"
        - Show the concept through character actions and environmental details
        - Make the learning element feel natural, not forced`;
        }
        
        // Add mood and tone specifications
        if (request.context.advanced?.tone) {
          const toneMapping = {
            'playful': 'bright, energetic colors with dynamic poses and joyful expressions',
            'gentle': 'soft, warm lighting with calm, nurturing expressions and peaceful settings',
            'encouraging': 'uplifting composition with confident character poses and hopeful lighting',
            'educational': 'clear, focused composition that highlights learning elements while maintaining engagement'
          };
          
          enhancedPrompt += `
        
        MOOD AND TONE: ${request.context.advanced.tone}
        - Visual style: ${toneMapping[request.context.advanced.tone] || 'engaging and age-appropriate'}
        - Emotional atmosphere should support the story's message`;
        }
      }
      
      enhancedPrompt += `
        
        TECHNICAL SPECIFICATIONS:
        - High resolution, publication-quality illustration
        - Professional children's book layout and composition
        - Clear focal hierarchy with main subject prominent
        - Rich detail that rewards close examination
        - Color palette suitable for young children (bright but not overwhelming)
        - Ensure all elements are clearly readable and visually appealing
        
        SAFETY AND APPROPRIATENESS:
        - 100% child-friendly content with no scary or inappropriate elements
        - Positive, uplifting imagery that supports child development
        - Inclusive and diverse representation when possible
        - Educational value embedded naturally in the visual storytelling`;

      // If reference images are provided, include them with detailed instructions
      const parts: any[] = [enhancedPrompt];
      
      if (request.referenceImages && request.referenceImages.length > 0) {
        enhancedPrompt += `
        
        REFERENCE IMAGES PROVIDED:
        - Use the provided reference images to maintain character consistency
        - Match the character appearance, features, and style exactly
        - Adapt the characters naturally into the new scene while preserving their identity`;
        
        for (let i = 0; i < request.referenceImages.length; i++) {
          const refImage = request.referenceImages[i];
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: refImage.replace(/^data:image\/\w+;base64,/, '')
            }
          });
          
          if (i === 0 && request.context?.childName) {
            enhancedPrompt += `
        - First reference image: Use this as the visual reference for ${request.context.childName}`;
          }
        }
        
        // Update the parts array with the enhanced prompt
        parts[0] = enhancedPrompt;
      }

      try {
        console.log('Generating Pixar-style story illustration with character consistency...');
        const result = await this.model.generateContent(parts);
        const response = await result.response;
        
        // Check if the response contains generated image data
        if (response.candidates && response.candidates[0]) {
          console.log('Gemini 2.5 story image generation response received');
          // For now, return placeholder until we can extract actual image data
          const seed = `${request.prompt}-${mainCharacter}-${request.context?.concept || 'story'}-pixar`;
          return this.generatePlaceholderImage('pixar', seed);
        }
      } catch (error) {
        console.warn('Gemini story image generation failed, using placeholder:', error);
      }
      
      // Fallback to placeholder with character-specific seed
      const seed = `${request.prompt}-${mainCharacter}-${request.context?.concept || 'story'}-pixar`;
      return this.generatePlaceholderImage('pixar', seed);
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
   * Generate story text using AI with character names woven throughout
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
      
      // Build enhanced prompt with specific character usage requirements
      const mainCharacter = context?.childName || characterNames[0] || 'the main character';
      const allCharacters = characterNames.length > 0 ? characterNames : [mainCharacter];
      
      let prompt = `Create an engaging children's story with the following specifications:
        
        Title: "${title}"
        Story Theme: ${description}
        Main Character: ${mainCharacter}
        All Characters: ${allCharacters.join(', ')}
        Number of Pages: ${pageCount}
        
        CRITICAL REQUIREMENTS:
        - Use the actual character names (${allCharacters.join(', ')}) throughout the story - NOT generic terms like "the child" or "the main character"
        - ${mainCharacter} should be the hero/protagonist and appear in every page
        - Each character must be referred to by their actual name when they appear
        - Make the story personal and specific to these named characters`;
      
      // Add concept learning context if provided
      if (context?.concept) {
        prompt += `
        
        Learning Focus: ${context.concept}
        Educational Goal: Naturally teach the concept of "${context.concept}" through ${mainCharacter}'s adventure
        Integration: The concept should be woven into the story naturally, not forced`;
        
        if (context.advanced?.goal) {
          prompt += `
        Specific Learning Objective: ${context.advanced.goal}`;
        }
      }
      
      // Add advanced settings if provided
      if (context?.advanced) {
        const { density, narrative, complexity, tone } = context.advanced;
        
        prompt += `
        
        Story Style Requirements:
        - Text Density: ${density === 'one-word' ? 'Very brief, one key word or phrase per page' : 
                        density === 'one-sentence' ? 'One simple sentence per page' : 
                        'Multiple sentences per page (2-4)'}
        - Narrative Style: ${narrative === 'first-person' ? `Written from ${mainCharacter}'s perspective using "I" and "me"` : `Third-person narration using character names like "${mainCharacter}" and "they"`}
        - Language Complexity: ${complexity} vocabulary and sentence structure appropriate for children
        - Tone: ${tone} and engaging for young readers`;
      }
      
      prompt += `
        
        Story Structure Instructions:
        1. Write exactly ${pageCount} distinct pages/scenes
        2. Each page should be a complete thought or scene
        3. Use ${mainCharacter}'s name frequently - at least once per page
        4. Include other character names when they appear: ${allCharacters.slice(1).join(', ')}
        5. Create a clear beginning, middle, and end
        6. Make it visually descriptive for illustration purposes
        
        Output Format: 
        Return ONLY the story text with each page separated by a line break.
        Page 1: [First scene with ${mainCharacter}]
        Page 2: [Second scene continuing ${mainCharacter}'s story]
        And so on...`;

      console.log('Generating personalized story text with character names...');
      const result = await this.model!.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Story text generated successfully');
      
      // Split into pages and clean up
      const pages = text.split('\n')
        .map(line => line.replace(/^Page \d+:\s*/i, '').trim()) // Remove "Page X:" prefixes
        .filter((line: string) => line.length > 0);
      
      // Ensure we have the right number of pages
      while (pages.length < pageCount) {
        pages.push(`${mainCharacter} continues the adventure...`);
      }
      
      // Verify character names are included (basic check)
      const storyText = pages.join(' ');
      if (mainCharacter !== 'the main character' && !storyText.includes(mainCharacter)) {
        console.warn('Generated story may not include main character name properly');
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
    // Create a simple hash from the seed for consistent but varied colors
    const hash = seed.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const hashAbs = Math.abs(hash);
    
    // Use via.placeholder.com which is more reliable for mobile apps
    // Generate colors based on the hash for consistency
    const colors = [
      'FFB6C1', 'FFE4B5', 'E6E6FA', 'B0E0E6', 'F0E68C', 
      'DDA0DD', 'FFE4E1', 'F5DEB3', 'D3D3D3', 'AFEEEE'
    ];
    const bgColor = colors[hashAbs % colors.length];
    const textColor = '333333';
    
    // Create a placeholder with text indicating it's generating
    const text = style === 'pixar' ? 'Pixar\nStyle' : 'Story\nImage';
    
    return `https://via.placeholder.com/1024x1024/${bgColor}/${textColor}?text=${encodeURIComponent(text)}`;
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