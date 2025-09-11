// Core imports for Google Generative AI integration
import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

// Type definitions for storybook functionality
import { 
  AvatarGenerationRequest, 
  ImageGenerationRequest, 
  ImageRefinementRequest,
  StorybookError,
  CharacterMapping
} from '../types/storybook';

// Utility functions for story image generation
import { 
  buildCharacterIdentificationPrompts, 
  buildReferenceImageContext 
} from '../utils/storyImageUtils';

/**
 * Retrieves the Gemini API key from multiple potential sources
 * Tries process.env, Expo Constants, and legacy manifest in order
 * @returns {string} The API key
 * @throws {Error} If no valid API key is found
 */
const getGeminiApiKey = (): string => {
  // Try multiple sources for the API key to handle different deployment scenarios
  let apiKey: string | undefined;
  
  // Method 1: Direct process.env access (works in some React Native setups)
  if (typeof process !== 'undefined' && process.env) {
    apiKey = process.env.GEMINI_API_KEY;
  }
  
  // Method 2: Expo Constants with environment variable substitution
  // Check if substitution worked by looking for template syntax
  if (!apiKey || apiKey.includes('${')) {
    const configKey = Constants.expoConfig?.extra?.geminiApiKey;
    if (configKey && !configKey.includes('${')) {
      apiKey = configKey;
    }
  }
  
  // Method 3: Legacy Expo manifest support for older versions
  if (!apiKey || apiKey.includes('${')) {
    apiKey = (Constants as any).manifest?.extra?.geminiApiKey;
  }
  
  // Debug logging to help troubleshoot API key configuration issues
  console.log('Checking API key sources:');
  console.log('- process.env.GEMINI_API_KEY:', process.env?.GEMINI_API_KEY ? 'found' : 'not found');
  console.log('- Constants.expoConfig.extra.geminiApiKey:', Constants.expoConfig?.extra?.geminiApiKey ? 'found' : 'not found');
  console.log('- Constants.expoConfig.extra:', Constants.expoConfig?.extra);
  console.log('- Final API key:', apiKey ? `found (${apiKey.substring(0, 10)}...)` : 'not found');
  
  // Validate that we have a usable API key (not undefined, empty, or template syntax)
  if (!apiKey || apiKey === 'undefined' || apiKey.includes('${')) {
    console.error('❌ Gemini API key not found in any source');
    throw new Error('Gemini API key not configured. Please ensure GEMINI_API_KEY is in your .env file and restart the app');
  }
  
  console.log('✅ Gemini API key found successfully');
  return apiKey;
};

/**
 * Service class for integrating with Google's Gemini AI models
 * Handles text generation, image generation, and vision analysis for storybook creation
 * 
 * Features:
 * - Avatar generation from photos using Gemini 2.5 Flash
 * - Story image generation with character consistency
 * - Story text generation with personalized character names
 * - Image refinement and editing capabilities
 * - Vision analysis for character identification
 */
class GeminiService {
  // Core Gemini AI client instance
  private genAI: GoogleGenerativeAI | null = null;
  
  // Specialized model instances for different tasks
  private textModel: any = null;    // For story text generation (gemini-1.5-pro)
  private imageModel: any = null;   // For image generation (gemini-2.5-flash-image-preview)
  private visionModel: any = null;  // For image analysis (gemini-1.5-pro-vision-latest)
  
  // Service initialization state
  private initialized: boolean = false;

  /**
   * Constructor - automatically initializes the service
   */
  constructor() {
    this.initialize();
  }

  /**
   * Initialize the Gemini service with API key and model instances
   * Sets up specialized models for different AI tasks:
   * - Text model for story generation
   * - Image model for visual content creation
   * - Vision model for image analysis
   */
  private initialize() {
    try {
      console.log('Initializing Gemini service...');
      const apiKey = getGeminiApiKey();
      console.log('API key retrieved, initializing GoogleGenerativeAI...');
      
      // Create the main Gemini AI client
      this.genAI = new GoogleGenerativeAI(apiKey);
      
      // Initialize specialized models for different AI tasks
      this.textModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      
      // Use Gemini 2.5 Flash with image preview for advanced image generation
      this.imageModel = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash-image-preview'
      });
      
      // Vision model for analyzing and understanding images
      this.visionModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro-vision-latest' });
      
      this.initialized = true;
      console.log('Gemini service initialized successfully');
      console.log('Image generation model: gemini-2.5-flash-image-preview');
      console.log('Text generation model: gemini-1.5-pro');
      console.log('Vision model: gemini-1.5-pro-vision-latest');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini service:', error);
      console.error('Initialization error details:', (error as Error).message || error);
      this.initialized = false;
      // Don't throw here - let individual methods handle the error gracefully
    }
  }

  /**
   * Checks if the service is properly initialized and attempts reinitialization if needed
   * Validates that all required model instances are available
   * @throws {Error} If reinitialization fails
   */
  private checkInitialized() {
    // Check if service and all required models are initialized
    if (!this.initialized || !this.genAI || !this.textModel || !this.imageModel || !this.visionModel) {
      console.log('🔄 Service not initialized, attempting to reinitialize...');
      
      // Attempt to reinitialize the service
      this.initialize();
      
      // Verify reinitialization was successful
      if (!this.initialized) {
        console.error('❌ Failed to initialize Gemini service');
        throw new Error('Gemini service not initialized. Please check your API key configuration.');
      }
      console.log('✅ Service reinitialized successfully');
    }
  }

  /**
   * Generate a Pixar-style avatar from a user photo using direct image editing
   * 
   * Process:
   * 1. Sends the input photo directly to Gemini 2.5 Flash Image model
   * 2. Uses image editing prompt to transform photo into Pixar-style avatar
   * 3. Returns the generated avatar or falls back to stylized avatar service
   * 
   * @param request - Avatar generation request containing photo data and character name
   * @returns Promise resolving to image URL or object with URL and visual profile
   */
  async generateAvatar(request: AvatarGenerationRequest): Promise<string | {
    imageUrl: string;
    visualProfile?: {
      appearance: string;
      style: string;
      personality: string;
      keyFeatures: string[];
    };
  }> {
    try {
      this.checkInitialized();
      
      const mode = request.mode || 'animated';
      console.log(`Starting avatar generation in ${mode} mode for:`, request.characterName);
      
      // Prepare the photo data for direct image editing
      // Remove data URL prefix to get clean base64 data
      const imagePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: request.photoData.replace(/^data:image\/\w+;base64,/, '')
        }
      };
      
      try {
        let imageEditPrompt: string;
        let logMessage: string;
        
        if (mode === 'real') {
          console.log('Processing photo for real-mode with background removal...');
          logMessage = '✅ Real-mode avatar generated successfully with background removal';
          
          // Real-mode prompt: remove background, keep person natural, enhance with studio lighting
          imageEditPrompt = `Remove the background from this image while keeping the person exactly as they are in real life, and enhance with professional studio lighting.

CRITICAL REQUIREMENTS:
- Keep the person EXACTLY as they appear in the original photo
- Do NOT change facial features, proportions, or characteristics
- Do NOT stylize or cartoon the person
- Maintain realistic skin texture and appearance
- Preserve all distinctive features (glasses, facial hair, accessories, clothing, etc.)
- Keep natural hair color, style, and texture
- Maintain natural eye color and shape
- Keep realistic skin tone and texture

BACKGROUND SPECIFICATIONS:
- Remove all background completely
- Replace with a clean, solid neutral background (white, light gray, or soft pastel)
- Make sure the background is completely plain and uniform
- No patterns, textures, or distracting elements
- Character should be cleanly separated from background
- Professional photo-style background removal

LIGHTING ENHANCEMENTS:
- Apply professional studio lighting to enhance the photo quality
- Add soft, even key lighting from the front to eliminate harsh shadows
- Include subtle fill lighting to brighten any darker areas naturally
- Add a gentle rim light or hair light to create depth and separation
- Ensure lighting looks natural and professional, as if taken in a high-end portrait studio
- Maintain natural skin tone while improving overall illumination
- Create a polished, professional headshot appearance
- Keep lighting consistent with the person's natural features and skin tone

${request.characterName ? `Character name: ${request.characterName}` : ''}

Remove the background and enhance with studio-quality lighting while keeping the person completely natural and realistic.`;
        } else {
          console.log('Transforming photo to Pixar-style using Gemini 2.5 Flash Image...');
          logMessage = '✅ Pixar avatar generated successfully with Gemini 2.5 Flash Image';
          
          // Animated mode prompt: Pixar transformation
          imageEditPrompt = `Transform this image into a high-quality Pixar-style 3D animated character while maintaining exact likeness and all distinctive features.

CRITICAL REQUIREMENTS:
- Keep EXACT facial features, proportions, and characteristics from the original photo
- Maintain the person's actual age appearance and body proportions  
- Preserve all distinctive features (glasses, facial hair, accessories, clothing style, etc.)
- Keep the same hair color, style, and texture
- Maintain eye color and shape
- Preserve skin tone

STYLE SPECIFICATIONS:
- High-quality Pixar/Disney 3D animation style
- Smooth, polished surfaces with soft directional lighting
- Clean, plain background (solid pastel color or subtle gradient)
- Character facing forward, shoulders visible
- Professional Pixar-quality animation with attention to detail
- Round, soft features suitable for children's content
- Warm, friendly expression

${request.characterName ? `Character name: ${request.characterName}` : ''}

Transform this person into their Pixar animated version while keeping everything else exactly the same.`;
        }
        
        console.log('Image editing prompt prepared');
        
        // Call Gemini 2.5 Flash Image model with photo and editing prompt
        const imageResult = await this.imageModel.generateContent([imageEditPrompt, imagePart]);
        const imageResponse = await imageResult.response;
        
        console.log('Gemini 2.5 Flash Image response received');
        
        // Process the response to extract generated image data
        if (imageResponse.candidates && imageResponse.candidates[0]) {
          const candidate = imageResponse.candidates[0];
          
          // Search through response parts for image data
          if (candidate.content?.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData?.data) {
                console.log(`${mode === 'real' ? 'Real-mode' : 'Pixar'} avatar image data found!`);
                
                // Convert base64 image data to usable data URL
                const mimeType = part.inlineData.mimeType || 'image/png';
                const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
                
                console.log(logMessage);
                
                // Return successful result with visual profile metadata
                return {
                  imageUrl: imageUrl,
                  visualProfile: {
                    appearance: mode === 'real' ? 'Real-life photo with background removed' : 'Pixar-style transformation of original photo',
                    style: mode === 'real' ? 'Real Photography' : 'Pixar 3D Animation',
                    personality: 'Friendly and approachable',
                    keyFeatures: mode === 'real' ? ['Exact likeness preserved', 'Background removed', 'Natural appearance'] : ['Exact likeness preserved', 'Pixar animation style', 'Child-friendly design']
                  }
                };
              }
            }
          }
        }
        
        console.warn('⚠️ No image data in Gemini response');
        throw new Error('No image data returned from Gemini 2.5 Flash Image model');
        
      } catch (error) {
        console.error('⚠️ Gemini 2.5 Flash Image generation failed:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Avatar generation failed:', error);
      throw this.handleError(error as Error);
    }
  }





  /**
   * Generate a story illustration with Gemini 2.5 Flash optimized character consistency
   * Implements two-stage pipeline: First page (character initialization) + Subsequent pages (reference-based)
   */
  async generateStoryImage(request: ImageGenerationRequest & {
    storyMode?: 'animated' | 'real'; // Story visual mode
    context?: {
      concept?: string;
      characterNames?: string[];
      childName?: string;
      storyContext?: string;
      pageNumber?: number;
      totalPages?: number;
      previousPageContext?: string;
      sceneContext?: {
        setting: string;
        mood: string;
        colorPalette: string[];
        visualStyle: string;
      };
      characterProfiles?: Array<{
        name: string;
        appearance: string;
        style: string;
        keyFeatures: string[];
        avatarUrl?: string;
      }>;
      advanced?: {
        density: 'one-word' | 'one-sentence' | 'multiple-sentences';
        narrative: 'first-person' | 'third-person';
        complexity: 'very-simple' | 'simple' | 'moderate' | 'complex';
        communicationStyle: 'visual-heavy' | 'balanced' | 'text-heavy';
        tone: 'playful' | 'gentle' | 'encouraging' | 'educational';
        goal: string;
      };
      allStoryPages?: string[];
    };
  }): Promise<string> {
    try {
      console.log('Starting Gemini 2.5 Flash story image generation');
      console.log('   - Is first page:', request.isFirstPage || false);
      console.log('   - Character mappings:', request.characterMappings?.length || 0);
      console.log('   - Has reference image:', !!request.referencePageImage);

      // Determine generation strategy based on page type
      if (request.isFirstPage) {
        return await this.generateFirstPageWithCharacterInitialization(request);
      } else {
        return await this.generateSubsequentPageWithReference(request);
      }
    } catch (error) {
      console.error('❌ Story image generation failed:', error);
      throw this.handleError(error as Error);
    }
  }

  /**
   * Generate first page with explicit character labeling (Gemini 2.5 Flash optimized)
   */
  private async generateFirstPageWithCharacterInitialization(request: ImageGenerationRequest & {
    storyMode?: 'animated' | 'real';
    context?: any;
  }): Promise<string> {
    try {
      console.log('🎭 Generating FIRST PAGE with character initialization');
      
      const characterMappings = request.characterMappings || [];
      const mainCharacter = request.context?.childName || request.context?.characterNames?.[0] || 'the child';
      
      // Build character identification prompts using Gemini best practices
      const { avatarReferences, characterInstructions, totalAvatarInputs } = 
        buildCharacterIdentificationPrompts(characterMappings, true);

      console.log(`   - Avatar inputs: ${totalAvatarInputs}/3 (Gemini limit)`);
      console.log(`   - Total characters: ${characterMappings.length}`);

      // Determine visual style based on story mode
      const storyMode = request.storyMode || 'animated';
      const isRealMode = storyMode === 'real';
      
      console.log(`   - Story mode: ${storyMode}`);
      
      // Build hyper-specific prompt for character consistency
      let enhancedPrompt = `Create a high-quality ${isRealMode ? 'photorealistic' : 'Pixar 3D animation style'} children's storybook illustration.

SCENE TO ILLUSTRATE: ${request.prompt}

CRITICAL CHARACTER REQUIREMENTS:
${avatarReferences.join('\n')}

CHARACTER IDENTIFICATION AND CONSISTENCY:
${characterInstructions.join('\n')}

VISUAL STYLE REQUIREMENTS:
${isRealMode ? 
  `- Photorealistic style with natural lighting and textures
- Real-life photography aesthetic with proper depth of field
- Natural skin textures, hair, and clothing materials
- Realistic environmental details and backgrounds
- Professional photography composition and lighting` :
  `- Professional Pixar 3D animation aesthetic (Toy Story, Finding Nemo quality level)
- Vibrant, saturated colors with soft directional lighting from upper left
- Rounded, child-friendly character designs with smooth surfaces
- Rich environmental details supporting the narrative`}
- Clear focal hierarchy with ${mainCharacter} as the primary focus

CONSISTENCY ESTABLISHMENT (CRITICAL FOR SUBSEQUENT PAGES):
- Each character must have distinctive, memorable visual features
- Consistent color schemes for each character's clothing and appearance  
- Clear positioning that establishes character relationships
- Lighting and background style that can be maintained across story pages

CHARACTER INTERACTION REQUIREMENTS:
- ${mainCharacter} should be prominently positioned as the main character
- All characters should interact naturally within the scene
- Facial expressions and body language should reflect the story moment
- Preserve all distinctive features from avatar references exactly

STORY CONTEXT:
- This is ${request.context?.pageNumber ? `page ${request.context.pageNumber} of ${request.context.totalPages}` : 'the first page'} in the story ${request.context?.concept ? `about learning ${request.context.concept}` : ''}
- Educational focus: ${request.context?.concept || 'character development and storytelling'}
- Target audience: Children (age-appropriate content and visual style)

- High resolution, publication-quality children's book illustration
- Safe, appropriate content for young children
- Clear composition that supports the narrative
- Colors and lighting that can be consistently maintained across subsequent pages`;
      
      // Add story context if available
      if (request.context) {
        if (request.context.advanced?.tone) {
          const toneMapping = {
            'playful': 'bright, energetic scene with joyful expressions and dynamic poses',
            'gentle': 'soft, calm atmosphere with nurturing expressions and peaceful composition',
            'encouraging': 'uplifting scene with confident poses and hopeful lighting',
            'educational': 'clear, focused composition highlighting learning elements'
          };
          
          enhancedPrompt += `\n\nMOOD AND TONE: ${request.context.advanced.tone}
- Visual approach: ${toneMapping[request.context.advanced.tone as keyof typeof toneMapping] || 'engaging and age-appropriate'}`;
        }

        // Add page progression context
        if (request.context.pageNumber && request.context.totalPages) {
          const progressPercentage = Math.round((request.context.pageNumber / request.context.totalPages) * 100);
          enhancedPrompt += `\n\nSTORY PROGRESSION:
- Story phase: ${request.context.pageNumber === 1 ? 'Introduction/Setup' : 'Development'}
- Visual pacing: Establish characters and setting for future page consistency`;
        }
      }

      // Prepare parts array for Gemini request
      const parts: any[] = [enhancedPrompt];
      
      // Add character avatars (respecting 3-image Gemini limit)
      const charactersWithAvatars = characterMappings
        .filter(cm => cm.avatarUrl && cm.avatarIndex >= 0 && cm.avatarIndex < 3)
        .sort((a, b) => a.avatarIndex - b.avatarIndex);

      console.log('   - Processing avatar references:', charactersWithAvatars.map(c => ({
        name: c.name,
        role: c.role,
        avatarIndex: c.avatarIndex,
        hasUrl: !!c.avatarUrl
      })));

      // Add avatar image data to request parts
      for (const character of charactersWithAvatars) {
        if (character.avatarUrl) {
          try {
            console.log(`   - Loading avatar for ${character.name} (index ${character.avatarIndex})`);
            const avatarData = await this.downloadImageAsBase64(character.avatarUrl);
            
            parts.push({
              inlineData: {
                mimeType: 'image/jpeg',
                data: avatarData
              }
            });
            
            console.log(`   - Added avatar reference ${character.avatarIndex + 1}: ${character.name}`);
          } catch (error) {
            console.warn(`   - Failed to load avatar for ${character.name}:`, (error as Error).message);
          }
        }
      }

      try {
        console.log('Calling Gemini 2.5 Flash for first page generation');
        console.log(`   - Total parts: ${parts.length} (1 text + ${parts.length - 1} images)`);
        
        // Generate image using Gemini 2.5 Flash
        const imageResult = await this.imageModel.generateContent(parts);
        const imageResponse = await imageResult.response;
        
        console.log('📥 Gemini 2.5 Flash response received for first page');
        
        // Extract generated image
        if (imageResponse.candidates && imageResponse.candidates[0]) {
          const candidate = imageResponse.candidates[0];
          
          if (candidate.content?.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData?.data) {
                console.log('First page image data found!');
                
                const mimeType = part.inlineData.mimeType || 'image/png';
                const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
                
                console.log('✅ First page with character initialization generated successfully');
                return imageUrl;
              }
            }
          }
        }
        
        console.warn('⚠️ No image data in Gemini response for first page, using fallback');
        
      } catch (imagenError) {
        console.error('⚠️ Gemini 2.5 Flash failed for first page:', imagenError);
      }
      
      // Fallback for first page
      return await this.generateStylizedStoryIllustration(
        request.prompt,
        request.context?.pageNumber || 1,
        request.context?.characterNames || [],
        null,
        mainCharacter
      );
      
    } catch (error) {
      console.error('❌ First page generation failed:', error);
      throw this.handleError(error as Error);
    }
  }

  /**
   * Generate subsequent pages with reference image for character consistency
   */
  private async generateSubsequentPageWithReference(request: ImageGenerationRequest & {
    storyMode?: 'animated' | 'real';
    context?: any;
  }): Promise<string> {
    try {
      console.log('Generating SUBSEQUENT PAGE with reference consistency');
      
      const characterMappings = request.characterMappings || [];
      const mainCharacter = request.context?.childName || request.context?.characterNames?.[0] || 'the child';
      
      // Build character identification prompts using Gemini best practices
      const { avatarReferences, characterInstructions, totalAvatarInputs } = 
        buildCharacterIdentificationPrompts(characterMappings, false);

      console.log(`   - Avatar inputs: ${totalAvatarInputs}/2 (leaving 1 slot for reference image)`);
      console.log(`   - Total characters: ${characterMappings.length}`);
      console.log(`   - Has reference page image: ${!!request.referencePageImage}`);

      // Determine visual style based on story mode
      const storyMode = request.storyMode || 'animated';
      const isRealMode = storyMode === 'real';
      
      console.log(`   - Story mode: ${storyMode}`);
      
      // Build hyper-specific prompt for character consistency with reference
      let enhancedPrompt = `Create a high-quality ${isRealMode ? 'photorealistic' : 'Pixar 3D animation style'} children's storybook illustration that maintains perfect character consistency with the provided reference page.

SCENE TO ILLUSTRATE: ${request.prompt}

CRITICAL CHARACTER CONSISTENCY REQUIREMENTS:
- Use the REFERENCE PAGE IMAGE as the definitive guide for character appearances
- ALL characters must look identical to how they appear in the reference image
- Maintain exact facial features, hair styles, clothing, and proportions
- Preserve character color schemes and distinctive visual features
${avatarReferences.join('\n')}

CHARACTER IDENTIFICATION AND CONSISTENCY:
${characterInstructions.join('\n')}

VISUAL STYLE REQUIREMENTS:
${isRealMode ? 
  `- Exact same photorealistic aesthetic as the reference page
- Match natural lighting direction, intensity, and color temperature from reference
- Consistent realistic environmental style and textures
- Same level of photographic detail and quality
- Natural depth of field and composition` :
  `- Exact same Pixar 3D animation aesthetic as the reference page
- Match lighting direction, intensity, and color temperature from reference
- Consistent environmental style and color palette
- Same level of detail and rendering quality`}
- Clear focal hierarchy with ${mainCharacter} as the primary focus

REFERENCE CONSISTENCY (CRITICAL):
- Characters must be visually identical to their appearance in the reference image
- Maintain the same artistic style, lighting approach, and visual quality
- Preserve character relationships and scale established in previous pages
- Use consistent color grading and atmospheric effects

CHARACTER INTERACTION REQUIREMENTS:
- ${mainCharacter} should maintain prominence as established in previous pages
- All characters should interact naturally within the new scene
- Facial expressions and body language should reflect this story moment
- Preserve all distinctive features from both avatar references and the reference page

STORY CONTEXT:
- This is ${request.context?.pageNumber ? `page ${request.context.pageNumber} of ${request.context.totalPages}` : 'a subsequent page'} in the story ${request.context?.concept ? `about learning ${request.context.concept}` : ''}
- Educational focus: ${request.context?.concept || 'character development and storytelling'}
- Target audience: Children (age-appropriate content and visual style)
- Story progression: Build upon the established visual narrative from previous pages

- High resolution, publication-quality children's book illustration
- Safe, appropriate content for young children
- Clear composition that supports the narrative progression
- Perfect visual continuity with previous pages`;
      
      // Add story context if available
      if (request.context) {
        if (request.context.advanced?.tone) {
          const toneMapping = {
            'playful': 'bright, energetic scene with joyful expressions and dynamic poses',
            'gentle': 'soft, calm atmosphere with nurturing expressions and peaceful composition',
            'encouraging': 'uplifting scene with confident poses and hopeful lighting',
            'educational': 'clear, focused composition highlighting learning elements'
          };
          
          enhancedPrompt += `\n\nMOOD AND TONE: ${request.context.advanced.tone}
- Visual approach: ${toneMapping[request.context.advanced.tone as keyof typeof toneMapping] || 'engaging and age-appropriate'}
- Maintain consistency with the emotional tone established in previous pages`;
        }

        // Add page progression context
        if (request.context.pageNumber && request.context.totalPages) {
          const progressPercentage = Math.round((request.context.pageNumber / request.context.totalPages) * 100);
          enhancedPrompt += `\n\nSTORY PROGRESSION:
- Story phase: ${progressPercentage < 30 ? 'Early Development' : progressPercentage < 70 ? 'Middle Development' : 'Resolution'}
- Visual continuity: Maintain character consistency while advancing the narrative
- Page progression: Build upon established visual elements and character relationships`;
        }
      }

      // Prepare parts array for Gemini request
      const parts: any[] = [enhancedPrompt];
      
      // Add reference page image first (highest priority)
      if (request.referencePageImage) {
        try {
          console.log('   - Adding reference page image for consistency');
          let refImageData: string;
          
          if (request.referencePageImage.startsWith('data:')) {
            // Already base64 encoded
            refImageData = request.referencePageImage.split(',')[1];
          } else {
            // URL - download and convert
            refImageData = await this.downloadImageAsBase64(request.referencePageImage);
          }
          
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: refImageData
            }
          });
          
          console.log('   - Reference page image added successfully');
        } catch (error) {
          console.warn('   - Failed to load reference page image:', (error as Error).message);
        }
      }
      
      // Add character avatars (respecting 3-image Gemini limit, with 1 slot used for reference)
      const maxAvatars = request.referencePageImage ? 2 : 3;
      const charactersWithAvatars = characterMappings
        .filter(cm => cm.avatarUrl && cm.avatarIndex >= 0 && cm.avatarIndex < maxAvatars)
        .sort((a, b) => a.avatarIndex - b.avatarIndex);

      console.log('   - Processing avatar references:', charactersWithAvatars.map(c => ({
        name: c.name,
        role: c.role,
        avatarIndex: c.avatarIndex,
        hasUrl: !!c.avatarUrl
      })));

      // Add avatar image data to request parts
      for (const character of charactersWithAvatars) {
        if (character.avatarUrl) {
          try {
            console.log(`   - Loading avatar for ${character.name} (index ${character.avatarIndex})`);
            const avatarData = await this.downloadImageAsBase64(character.avatarUrl);
            
            parts.push({
              inlineData: {
                mimeType: 'image/jpeg',
                data: avatarData
              }
            });
            
            console.log(`   - Added avatar reference ${character.avatarIndex + 1}: ${character.name}`);
          } catch (error) {
            console.warn(`   - Failed to load avatar for ${character.name}:`, (error as Error).message);
          }
        }
      }

      try {
        console.log('Calling Gemini 2.5 Flash for subsequent page generation');
        console.log(`   - Total parts: ${parts.length} (1 text + ${parts.length - 1} images)`);
        
        // Generate image using Gemini 2.5 Flash
        const imageResult = await this.imageModel.generateContent(parts);
        const imageResponse = await imageResult.response;
        
        console.log('Gemini 2.5 Flash response received for subsequent page');
        
        // Extract generated image
        if (imageResponse.candidates && imageResponse.candidates[0]) {
          const candidate = imageResponse.candidates[0];
          
          if (candidate.content?.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData?.data) {
                console.log('Subsequent page image data found!');
                
                const mimeType = part.inlineData.mimeType || 'image/png';
                const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
                
                console.log('✅ Subsequent page with reference consistency generated successfully');
                return imageUrl;
              }
            }
          }
        }
        
        console.warn('⚠️ No image data in Gemini response for subsequent page, using fallback');
        
      } catch (imagenError) {
        console.error('⚠️ Gemini 2.5 Flash failed for subsequent page:', imagenError);
      }
      
      // Fallback for subsequent page
      return await this.generateStylizedStoryIllustration(
        request.prompt,
        request.context?.pageNumber || 2,
        request.context?.characterNames || [],
        null,
        mainCharacter
      );
      
    } catch (error) {
      console.error('❌ Subsequent page generation failed:', error);
      throw this.handleError(error as Error);
    }
  }

  /**
   * Refine an existing illustration using Gemini 2.5 Flash conversational editing
   */
  async refineImage(request: ImageRefinementRequest): Promise<string> {
    try {
      console.log('Starting conversational image refinement with Gemini 2.5 Flash');
      console.log('   - Refinement prompt:', request.refinementPrompt);
      console.log('   - Previous refinements:', request.previousRefinements?.length || 0);
      console.log('   - Character consistency ref:', !!request.characterConsistencyRef);

      this.checkInitialized();

      // Build conversational refinement prompt
      let refinementPrompt = `Please modify this illustration based on the following instruction: ${request.refinementPrompt}

CRITICAL REQUIREMENTS:
- Make ONLY the requested changes - preserve everything else exactly
- Maintain the same Pixar 3D animation style and quality
- Keep all character appearances identical (facial features, clothing, proportions)
- Preserve the overall composition, lighting, and color scheme
- Ensure the result remains appropriate for children's storybooks`;

      // Add character consistency context if available
      if (request.characterMappings && request.characterMappings.length > 0) {
        refinementPrompt += `\n\nCHARACTER CONSISTENCY REQUIREMENTS:
- Maintain exact character appearances: ${request.characterMappings.map(cm => cm.name).join(', ')}
- Preserve character visual identities while making the requested changes
- Any character adjustments must maintain their established look from previous pages`;

        // Add character descriptions for reference
        request.characterMappings.forEach(char => {
          refinementPrompt += `\n- ${char.name}: ${char.visualDescription}`;
        });
      }

      // Add refinement history context for conversational flow
      if (request.previousRefinements && request.previousRefinements.length > 0) {
        refinementPrompt += `\n\nPREVIOUS REFINEMENTS APPLIED:
${request.previousRefinements.map((ref, index) => `${index + 1}. ${ref}`).join('\n')}

CURRENT REFINEMENT:
- Build upon previous changes while applying: ${request.refinementPrompt}`;
      }

      refinementPrompt += `\n\nTECHNICAL SPECIFICATIONS:
- Use conversational image editing approach for precise modifications
- Maintain professional children's book illustration quality
- Preserve all positive elements while addressing the specific request
- Result should feel natural and cohesive, not edited`;

      // Prepare parts array with current image
      const parts: any[] = [refinementPrompt];
      
      try {
        console.log('   - Processing current image for refinement');
        let imageData: string;
        
        if (request.imageUrl.startsWith('data:image')) {
          // Extract base64 data from data URL
          imageData = request.imageUrl.replace(/^data:image\/\w+;base64,/, '');
        } else {
          // Download image from URL
          imageData = await this.downloadImageAsBase64(request.imageUrl);
        }
        
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageData
          }
        });
        
        console.log('   - Current image added to refinement request');
      } catch (error) {
        console.error('   - Failed to process current image:', error);
        throw new Error('Failed to process current image for refinement');
      }

      // Add character consistency reference if available
      if (request.characterConsistencyRef) {
        try {
          console.log('   - Adding character consistency reference image');
          let refImageData: string;
          
          if (request.characterConsistencyRef.startsWith('data:image')) {
            refImageData = request.characterConsistencyRef.replace(/^data:image\/\w+;base64,/, '');
          } else {
            refImageData = await this.downloadImageAsBase64(request.characterConsistencyRef);
          }
          
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: refImageData
            }
          });
          
          refinementPrompt += `\n\nCHARACTER REFERENCE IMAGE PROVIDED:
- Use this reference to ensure character consistency during refinement
- Characters should match their appearance in this reference image exactly
- Apply the requested change while preserving character visual identity`;
          
          // Update the prompt in parts array
          parts[0] = refinementPrompt;
          
          console.log('   - Character consistency reference added');
        } catch (error) {
          console.warn('   - Failed to add consistency reference, continuing without it:', error);
        }
      }

      try {
        console.log('Calling Gemini 2.5 Flash for conversational image editing');
        console.log(`   - Total parts: ${parts.length} (1 text + ${parts.length - 1} images)`);
        
        // Use Gemini 2.5 Flash for conversational editing
        const refinementResult = await this.imageModel.generateContent(parts);
        const refinementResponse = await refinementResult.response;
        
        console.log('Gemini 2.5 Flash refinement response received');
        
        // Extract refined image
        if (refinementResponse.candidates && refinementResponse.candidates[0]) {
          const candidate = refinementResponse.candidates[0];
          
          if (candidate.content?.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData?.data) {
                console.log('Refined image data found!');
                
                const mimeType = part.inlineData.mimeType || 'image/png';
                const refinedImageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
                
                console.log('✅ Image refinement completed successfully');
                return refinedImageUrl;
              }
            }
          }
        }
        
        console.warn('⚠️ No image data in Gemini refinement response');
        
        // If no refined image is returned, the API may not support editing yet
        throw new Error('Gemini 2.5 Flash image editing not available - no image data returned');
        
      } catch (refinementError) {
        console.error('⚠️ Gemini 2.5 Flash refinement failed:', refinementError);
        
        // For now, return original image since conversational editing may not be fully available
        console.log('Returning original image - refinement feature not yet available');
        return request.imageUrl;
      }
      
    } catch (error) {
      console.error('❌ Image refinement failed:', error);
      throw this.handleError(error as Error);
    }
  }

  /**
   * Generate personalized story text using AI with character names woven throughout
   * 
   * Creates engaging children's stories that:
   * - Use actual character names instead of generic terms
   * - Incorporate educational concepts naturally
   * - Support various narrative styles and complexity levels
   * - Generate exactly the requested number of pages
   * - Include visual descriptions suitable for illustration
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
      
      // Determine main character and build character list for story personalization
      const mainCharacter = context?.childName || characterNames[0] || 'the main character';
      const allCharacters = characterNames.length > 0 ? characterNames : [mainCharacter];
      
      // Build comprehensive story generation prompt with character requirements
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
      
      // Add educational context if learning concept is specified
      if (context?.concept) {
        prompt += `
        
        Learning Focus: ${context.concept}
        Educational Goal: Naturally teach the concept of "${context.concept}" through ${mainCharacter}'s adventure
        Integration: The concept should be woven into the story naturally, not forced`;
        
        // Include specific learning objectives if provided
        if (context.advanced?.goal) {
          prompt += `
        Specific Learning Objective: ${context.advanced.goal}`;
        }
      }
      
      // Apply advanced story customization settings
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
      // Generate story using Gemini text model
      const result = await this.textModel!.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Story text generated successfully');
      
      // Parse generated text into individual story pages with robust handling
      let pages: string[] = [];
      
      // Strategy 1: Look for explicit "Page X:" format markers
      const pageMatches = text.match(/Page\s+\d+:?\s*[^\n]+/gi);
      
      if (pageMatches && pageMatches.length >= pageCount) {
        // Found explicit page markers - extract content after markers
        pages = pageMatches.map((match: string) => {
          // Remove "Page X:" prefix and clean up whitespace
          return match.replace(/^Page\s+\d+:?\s*/i, '').trim();
        });
      } else {
        // Strategy 2: Split by line breaks and filter content
        const lines = text.split(/\n+/)
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0);
        
        // Filter out common non-story elements and metadata
        const filteredLines = lines.filter((line: string) => {
          // Skip lines that are just titles, page numbers, or too short to be story content
          const lowerLine = line.toLowerCase();
          if (lowerLine.startsWith('title:') || 
              lowerLine.startsWith('story:') ||
              lowerLine === 'page 1' ||
              lowerLine === 'page 2' ||
              lowerLine === 'page 3' ||
              lowerLine === 'page 4' ||
              lowerLine === 'page 5' ||
              line.match(/^Page\s+\d+$/i) ||
              line.match(/^\d+\.?\s*$/) ||
              line.length < 20) { // Skip very short lines that might be labels
            return false;
          }
          return true;
        });
        
        // Skip potential story title at the beginning if present
        let startIndex = 0;
        if (filteredLines.length > 0 && 
            filteredLines[0].toLowerCase().includes('learns about') && 
            filteredLines[0].length < 100) {
          startIndex = 1;
        }
        
        pages = filteredLines.slice(startIndex);
      }
      
      // Clean up and normalize each page text
      pages = pages.map(page => {
        // Remove any remaining "Page X:" prefixes that might have been missed
        page = page.replace(/^Page\s+\d+:?\s*/i, '');
        // Remove surrounding quotes if the entire page is quoted
        if (page.startsWith('"') && page.endsWith('"')) {
          page = page.slice(1, -1);
        }
        return page.trim();
      }).filter(page => page.length > 0);
      
      // Validate and adjust page count to match requirements
      if (pages.length > pageCount) {
        // Trim excess pages if we generated too many
        pages = pages.slice(0, pageCount);
      } else if (pages.length < pageCount) {
        // Generate missing pages if we have too few
        console.warn(`Only found ${pages.length} pages, expected ${pageCount}. Attempting to generate missing pages...`);
        
        const missingPages = pageCount - pages.length;
        for (let i = 0; i < missingPages; i++) {
          const pageNum = pages.length + 1;
          const continuePrompt = `Continue the story of "${title}" featuring ${allCharacters.join(', ')}. Write page ${pageNum} of ${pageCount}. This should be a complete scene that continues naturally from the previous pages. Make sure to use character names (especially ${mainCharacter}) and not generic terms. Write only the story text for this page:`;
          
          try {
            const continueResult = await this.textModel!.generateContent(continuePrompt);
            const continueResponse = await continueResult.response;
            let pageText = continueResponse.text().trim();
            
            // Clean up the generated page
            pageText = pageText.replace(/^Page\s+\d+:?\s*/i, '');
            if (pageText.startsWith('"') && pageText.endsWith('"')) {
              pageText = pageText.slice(1, -1);
            }
            
            pages.push(pageText);
          } catch (error) {
            console.error(`Failed to generate page ${pageNum}:`, error);
            // Only as last resort, add a meaningful continuation
            pages.push(`${mainCharacter} continued their journey, discovering new things and learning important lessons along the way.`);
          }
        }
      }
      
      // Verify character names are included
      const storyText = pages.join(' ');
      if (mainCharacter !== 'the main character' && !storyText.includes(mainCharacter)) {
        console.warn('Generated story may not include main character name properly');
        // Try to inject the character name if missing
        pages = pages.map(page => {
          if (!page.includes(mainCharacter) && page.includes('the child')) {
            return page.replace(/the child/gi, mainCharacter);
          }
          return page;
        });
      }
      
      console.log(`Parsed ${pages.length} story pages`);
      return pages;
    } catch (error) {
      console.error('Story text generation failed:', error);
      throw this.handleError(error as Error);
    }
  }

  /**
   * Regenerate a single page of story text
   */
  async regenerateStoryPage(
    storyTitle: string,
    pageNumber: number,
    totalPages: number,
    characterNames: string[],
    concept?: string,
    regenerationPrompt?: string,
    previousPages?: string[]
  ): Promise<string> {
    try {
      this.checkInitialized();
      
      const mainCharacter = characterNames[0] || 'the main character';
      
      let prompt = `Regenerate page ${pageNumber} of ${totalPages} for the story "${storyTitle}".
      
Characters: ${characterNames.join(', ')}
Main character: ${mainCharacter}`;
      
      if (concept) {
        prompt += `\nLearning concept: ${concept}`;
      }
      
      if (previousPages && previousPages.length > 0) {
        prompt += `\n\nPrevious pages for context:\n${previousPages.map((page, i) => `Page ${i + 1}: ${page}`).join('\n\n')}`;
      }
      
      if (regenerationPrompt) {
        prompt += `\n\nSpecific instructions: ${regenerationPrompt}`;
      }
      
      prompt += `\n\nWrite only the story text for page ${pageNumber}. Use the character names (especially ${mainCharacter}) and make it engaging for children. Do not include "Page ${pageNumber}:" in your response.`;
      
      const result = await this.textModel!.generateContent(prompt);
      const response = await result.response;
      let pageText = response.text().trim();
      
      // Clean up the response
      pageText = pageText.replace(/^Page\s+\d+:?\s*/i, '');
      if (pageText.startsWith('"') && pageText.endsWith('"')) {
        pageText = pageText.slice(1, -1);
      }
      
      return pageText;
    } catch (error) {
      console.error('Page regeneration failed:', error);
      throw this.handleError(error as Error);
    }
  }

  /**
   * Regenerate entire story with optional instructions
   */
  async regenerateEntireStory(
    title: string,
    description: string,
    characterNames: string[],
    pageCount: number = 5,
    regenerationPrompt?: string,
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
      // Use the existing generateStoryText method but with additional regeneration instructions
      let enhancedDescription = description;
      if (regenerationPrompt) {
        enhancedDescription += `\n\nAdditional instructions: ${regenerationPrompt}`;
      }
      
      return await this.generateStoryText(title, enhancedDescription, characterNames, pageCount, context);
    } catch (error) {
      console.error('Story regeneration failed:', error);
      throw this.handleError(error as Error);
    }
  }

  /**
   * Extract visual context from first page for subsequent page consistency
   */
  async extractVisualContextFromFirstPage(
    firstPageImageUrl: string,
    characterMappings: CharacterMapping[]
  ): Promise<{
    visualStyle: {
      lighting: string;
      colorPalette: string[];
      backgroundStyle: string;
    };
    characterPositions: Record<string, string>;
    sceneDescription: string;
  }> {
    try {
      console.log('🔍 Extracting visual context from first page for consistency');
      
      this.checkInitialized();
      
      // Build analysis prompt
      const analysisPrompt = `Analyze this children's storybook illustration and provide detailed visual context for maintaining consistency across subsequent pages.

CHARACTERS TO IDENTIFY:
${characterMappings.map(cm => `- ${cm.name} (${cm.role} character): ${cm.visualDescription}`).join('\n')}

Please provide:
1. LIGHTING: Describe the lighting direction, warmth, and overall illumination style
2. COLOR PALETTE: List the primary colors used throughout the scene
3. BACKGROUND STYLE: Describe the environmental style, setting, and artistic approach
4. CHARACTER POSITIONS: For each character listed above, describe how they appear in this image
5. SCENE DESCRIPTION: Overall composition and visual mood

Format your response as:
LIGHTING: [description]
COLOR_PALETTE: [color1, color2, color3, etc.]
BACKGROUND_STYLE: [description]
CHARACTER_POSITIONS:
- [Character Name]: [position and appearance description]
SCENE_DESCRIPTION: [overall description]`;

      // Prepare image for analysis
      let imageData: string;
      if (firstPageImageUrl.startsWith('data:image')) {
        imageData = firstPageImageUrl.replace(/^data:image\/\w+;base64,/, '');
      } else {
        imageData = await this.downloadImageAsBase64(firstPageImageUrl);
      }

      const imagePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData
        }
      };

      // Analyze with vision model
      const result = await this.visionModel.generateContent([analysisPrompt, imagePart]);
      const response = await result.response;
      const analysisText = response.text();

      console.log('🎨 First page visual analysis completed');

      // Parse the response
      const visualStyle = {
        lighting: this.extractSection(analysisText, 'LIGHTING') || 'Soft, warm lighting from upper left',
        colorPalette: this.extractColorPalette(analysisText) || ['warm blue', 'soft yellow', 'natural green'],
        backgroundStyle: this.extractSection(analysisText, 'BACKGROUND_STYLE') || 'Pixar-style 3D environment with child-friendly details'
      };

      const characterPositions: Record<string, string> = {};
      characterMappings.forEach(char => {
        const positionDescription = this.extractCharacterPosition(analysisText, char.name);
        characterPositions[char.name] = positionDescription || `${char.name} appears as the ${char.role} character in the scene`;
        
        // Update character mapping with position info
        char.positionInReference = characterPositions[char.name];
      });

      const sceneDescription = this.extractSection(analysisText, 'SCENE_DESCRIPTION') || 'Pixar-style children\'s storybook scene with engaging character interactions';

      console.log('✅ Visual context extracted:', {
        lighting: visualStyle.lighting,
        colorCount: visualStyle.colorPalette.length,
        characterCount: Object.keys(characterPositions).length
      });

      return {
        visualStyle,
        characterPositions,
        sceneDescription
      };

    } catch (error) {
      console.warn('⚠️ Failed to extract visual context, using defaults:', error);
      
      // Return default context
      const defaultCharacterPositions: Record<string, string> = {};
      characterMappings.forEach(char => {
        defaultCharacterPositions[char.name] = `${char.name} appears as the ${char.role} character`;
        char.positionInReference = defaultCharacterPositions[char.name];
      });

      return {
        visualStyle: {
          lighting: 'Soft, warm lighting suitable for children\'s books',
          colorPalette: ['warm blue', 'soft yellow', 'natural green', 'gentle pink'],
          backgroundStyle: 'Child-friendly Pixar-style environment'
        },
        characterPositions: defaultCharacterPositions,
        sceneDescription: 'Engaging Pixar-style children\'s storybook illustration'
      };
    }
  }

  /**
   * Extract color palette from analysis text
   */
  private extractColorPalette(text: string): string[] | null {
    const colorSection = this.extractSection(text, 'COLOR_PALETTE');
    if (colorSection) {
      // Split by commas and clean up
      return colorSection
        .split(/[,;]/)
        .map(color => color.trim())
        .filter(color => color.length > 0)
        .slice(0, 6); // Limit to 6 colors
    }
    return null;
  }

  /**
   * Extract character position from analysis text
   */
  private extractCharacterPosition(text: string, characterName: string): string | null {
    // Look for character positions section
    const positionsSection = this.extractSection(text, 'CHARACTER_POSITIONS');
    if (positionsSection) {
      // Find the line that mentions this character
      const lines = positionsSection.split('\n');
      for (const line of lines) {
        if (line.toLowerCase().includes(characterName.toLowerCase())) {
          // Extract description after the character name
          const colonIndex = line.indexOf(':');
          if (colonIndex >= 0) {
            return line.substring(colonIndex + 1).trim();
          }
        }
      }
    }
    return null;
  }

  /**
   * Save generated image data to filesystem and return URL
   */
  private async saveGeneratedImage(
    imageData: string, 
    mimeType: string, 
    request: ImageGenerationRequest & { context?: any }
  ): Promise<string> {
    try {
      console.log('💾 Saving generated image to filesystem...');
      
      // Create a unique filename based on request context
      const timestamp = Date.now();
      const pageId = request.context?.pageNumber ? `page${request.context.pageNumber}` : 'img';
      const storyId = request.context?.concept?.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '') || 'story';
      const filename = `${storyId}_${pageId}_${timestamp}.png`;
      const filePath = `${FileSystem.documentDirectory}storybook_images/${filename}`;
      
      // Ensure the directory exists
      const dirPath = `${FileSystem.documentDirectory}storybook_images/`;
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
        console.log('📁 Created storybook_images directory');
      }
      
      // Write the base64 image data to file
      await FileSystem.writeAsStringAsync(filePath, imageData, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('✅ Image saved successfully:', filePath);
      return filePath;
    } catch (error) {
      console.error('❌ Failed to save generated image:', error);
      // Return a fallback placeholder instead of throwing
      const fallbackSeed = `error-${Date.now()}`;
      return this.generatePlaceholderImage('pixar-sequential', fallbackSeed, 'Image save failed');
    }
  }

  /**
   * Download an image from URL and convert to base64 format for Gemini API
   * Uses Expo FileSystem to handle the download and conversion process
   * 
   * @param url - Image URL to download
   * @returns Promise resolving to base64 string data
   * @throws Error if download or conversion fails
   */
  private async downloadImageAsBase64(url: string): Promise<string> {
    try {
      // Download image to temporary location
      const response = await FileSystem.downloadAsync(
        url,
        FileSystem.documentDirectory + 'temp_image.jpg'
      );
      
      // Read downloaded file as base64 string
      const base64 = await FileSystem.readAsStringAsync(response.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Clean up temporary file to prevent storage bloat
      await FileSystem.deleteAsync(response.uri, { idempotent: true });
      
      return base64;
    } catch (error) {
      console.error('Failed to download image:', error);
      throw error;
    }
  }

  /**
   * Generate an SVG error placeholder image with custom message
   * Used when image generation fails to provide visual feedback to users
   * 
   * @param message - Error message to display in the placeholder
   * @returns Data URL containing SVG placeholder image
   */
  private generateErrorPlaceholder(message: string): string {
    // Create an inline SVG with error styling and custom message
    const svg = `
      <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="200" fill="#f5f5f5" stroke="#ddd" stroke-width="2" rx="10"/>
        <circle cx="150" cy="80" r="30" fill="#ff6b6b" opacity="0.2"/>
        <text x="150" y="85" text-anchor="middle" font-family="Arial" font-size="16" fill="#666">⚠️</text>
        <text x="150" y="120" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">
          ${message}
        </text>
      </svg>
    `.trim();
    
    // Convert SVG to base64 data URL for use in React Native
    const base64svg = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64svg}`;
  }
  
  /**
   * Generate a fallback story illustration using external avatar service
   * Used when Gemini image generation fails or is unavailable
   * 
   * @param prompt - Story scene description
   * @param pageNumber - Current page number for seed variation
   * @param characterNames - Array of character names
   * @param visualDesc - Visual description object (unused in current implementation)
   * @param mainCharacter - Main character name for seed generation
   * @returns Promise resolving to illustration URL
   */
  private async generateStylizedStoryIllustration(
    prompt: string,
    pageNumber: number,
    characterNames: string[],
    visualDesc: any,
    mainCharacter: string
  ): Promise<string> {
    try {
      // Create consistent seed for reproducible page illustrations
      const pageSeed = `${mainCharacter.replace(/\s+/g, '')}-page${pageNumber}-${prompt.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '')}`;
      
      // Define mood-based background colors for visual variety
      const moodBackgrounds: { [key: string]: string } = {
        'happy': 'ffeb3b,fff9c4',
        'exciting': 'ff6b6b,feca57',
        'peaceful': '81c784,aed581',
        'mysterious': '9575cd,7e57c2',
        'adventurous': '4fc3f7,29b6f6',
        'warm': 'ffb74d,ffa726',
        'playful': 'f06292,ec407a',
        'gentle': 'b39ddb,9575cd',
        'night': '5c6bc0,3f51b5',
        'morning': 'ffcc80,ffb74d'
      };
      
      // Select appropriate background color based on mood or page progression
      let backgroundColor = 'b6e3f4,c3b1e1'; // Default soft blue/purple gradient
      if (visualDesc?.mood) {
        // Use mood-specific colors if available
        const moodKey = Object.keys(moodBackgrounds).find(key => 
          visualDesc.mood.toLowerCase().includes(key)
        );
        if (moodKey) {
          backgroundColor = moodBackgrounds[moodKey];
        }
      } else {
        // Cycle through different backgrounds for visual variety across pages
        const backgrounds = Object.values(moodBackgrounds);
        backgroundColor = backgrounds[pageNumber % backgrounds.length];
      }
      
      // Build DiceBear API URL with customization parameters
      const params = new URLSearchParams();
      params.append('seed', pageSeed);
      params.append('backgroundColor', backgroundColor);
      params.append('scale', '110');  // Slightly larger scale for better visibility
      params.append('radius', '20');   // Rounded corners for child-friendly appearance
      
      // Use fun-emoji style for colorful, child-friendly illustrations
      const illustrationUrl = `https://api.dicebear.com/7.x/fun-emoji/svg?${params.toString()}`;
      
      console.log(`🎨 Story illustration created for page ${pageNumber}`);
      console.log(`   Seed: ${pageSeed}`);
      console.log(`   Background: ${backgroundColor}`);
      
      // Add brief delay to simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return illustrationUrl;
    } catch (error) {
      console.error('Failed to generate story illustration:', error);
      // Return a simple fallback illustration if generation fails
      return `https://api.dicebear.com/7.x/shapes/svg?seed=page${pageNumber}&backgroundColor=b6e3f4`;
    }
  }
  
  /**
   * Generate contextual placeholder images with narrative awareness
   * Creates intelligent placeholders that reflect story context and page progression
   * 
   * @param style - Placeholder style (e.g., 'cartoon', 'animated', 'pixar-sequential')
   * @param seed - Seed string containing character and page information
   * @param sceneDescription - Optional scene description for mood detection
   * @returns URL to generated placeholder image
   */
  private generatePlaceholderImage(style: string, seed: string, sceneDescription?: string): string {
    console.log(`🖼️  Generating placeholder image: style="${style}", seed="${seed}"`);
    if (sceneDescription) {
      console.log(`   Scene context: "${sceneDescription.substring(0, 100)}..."`);
    }
    
    // Generate avatar-specific placeholders for character generation
    if ((style === 'cartoon' || style === 'animated') && !seed.includes('page') && !seed.includes('story')) {
      const avatarSeed = seed.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      
      // Use different avatar styles for variety and better cartoon aesthetics
      const avatarStyles = [
        'big-smile',     // Friendly cartoon style
        'avataaars',     // Classic avatar style  
        'fun-emoji',     // Fun emoji-like style
        'lorelei'        // Stylized cartoon style
      ];
      
      // Select style based on character name for consistency across generations
      const styleIndex = avatarSeed.length % avatarStyles.length;
      const selectedStyle = avatarStyles[styleIndex];
      
      // Generate with clean white background and child-friendly settings
      const avatarUrl = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${avatarSeed}&backgroundColor=ffffff&radius=50&scale=85&flip=false`;
      
      console.log(`👤 Generated enhanced avatar placeholder (${selectedStyle}): ${avatarUrl}`);
      return avatarUrl;
    }
    
    // Generate story-specific placeholders with contextual information
    let label = 'Pixar Story';
    let backgroundColor = '7C3AED'; // Primary purple theme
    let textColor = 'FFFFFF';       // White text for contrast
    
    // Parse seed string to extract contextual information
    const pageMatch = seed.match(/page(\d+)/);
    const conceptMatch = seed.match(/story-([^-]+)/);
    const characterMatch = seed.match(/-([a-zA-Z]+)-/);
    
    if (pageMatch) {
      const pageNum = pageMatch[1];
      label = `Story Page ${pageNum}`;
      
      // Use different colors for different pages to show story progression
      const pageColors = {
        '01': '7C3AED', // Purple - Introduction/Setup
        '02': '3B82F6', // Blue - Development  
        '03': '10B981', // Green - Action/Adventure
        '04': 'F59E0B', // Yellow - Climax/Challenge
        '05': 'EF4444'  // Red - Resolution/Ending
      };
      
      backgroundColor = pageColors[pageNum as keyof typeof pageColors] || '7C3AED';
    }
    
    if (conceptMatch) {
      const concept = conceptMatch[1];
      label += `\n${concept.charAt(0).toUpperCase() + concept.slice(1)} Story`;
    }
    
    if (characterMatch) {
      const character = characterMatch[1];
      label += `\nwith ${character.charAt(0).toUpperCase() + character.slice(1)}`;
    }
    
    // Enhance label with scene context if available
    if (sceneDescription && sceneDescription.length > 20) {
      // Extract emotional keywords from scene description for mood detection
      const keywords = sceneDescription
        .toLowerCase()
        .match(/\b(happy|sad|excited|learning|playing|sharing|helping|exploring|discovering|smiling|laughing|colorful|bright|magical|adventure|friendship|kind|gentle|brave|curious)\b/g);
      
      if (keywords && keywords.length > 0) {
        const mood = keywords[0];
        label += `\n(${mood} scene)`;
      }
    }
    
    // Handle different error states with appropriate visual indicators
    if (seed.includes('error')) {
      backgroundColor = '6B7280'; // Gray for general errors
      label = 'Image Generation\nTemporarily Unavailable';
    } else if (seed.includes('quota')) {
      backgroundColor = 'F97316'; // Orange for quota/rate limit issues
      label += '\n(Processing...)';
    }
    
    // Generate placeholder using external service with custom styling
    const placeholderUrl = `https://placehold.co/1024x1024/${backgroundColor}/${textColor}/png?text=${encodeURIComponent(label)}&font=raleway`;
    console.log(`🎨 Generated contextual story placeholder: ${placeholderUrl}`);
    return placeholderUrl;
  }

  /**
   * Extract character visual profile from AI response text
   * Parses unstructured AI response to create character profile objects
   * 
   * @param responseText - Raw AI response text
   * @param characterName - Character name for fallback descriptions
   * @returns Structured character profile object
   */
  private extractCharacterProfile(responseText: string, characterName: string): {
    appearance: string;
    style: string;
    personality: string;
    keyFeatures: string[];
  } {
    // Parse AI response for character details (basic implementation)
    // In real implementation, this would use structured AI response parsing
    
    const appearance = this.extractSection(responseText, 'appearance') || 
      `Pixar-style 3D animated character with friendly, approachable features`;
    
    const style = this.extractSection(responseText, 'style') || 
      `Colorful, child-friendly clothing with rounded, soft design elements`;
    
    const personality = this.extractSection(responseText, 'personality') || 
      `Warm, expressive, and engaging personality suitable for children's stories`;
    
    const keyFeatures = this.extractFeaturesList(responseText) || [
      'Distinctive facial features',
      'Memorable color scheme',
      'Expressive eyes',
      'Friendly demeanor'
    ];

    return {
      appearance,
      style,
      personality,
      keyFeatures
    };
  }

  /**
   * Generate basic character profile for consistency
   */
  private generateBasicCharacterProfile(characterName: string): {
    appearance: string;
    style: string;
    personality: string;
    keyFeatures: string[];
  } {
    return {
      appearance: `${characterName} has a friendly Pixar-style appearance with warm, expressive features suitable for children's storytelling`,
      style: `Colorful, age-appropriate clothing with a consistent design aesthetic that maintains visual identity across story pages`,
      personality: `Warm, engaging, and child-friendly personality that comes through in poses and expressions`,
      keyFeatures: [
        'Consistent facial structure',
        'Distinctive color palette',
        'Expressive eyes and smile',
        'Memorable silhouette',
        'Child-appropriate design'
      ]
    };
  }

  /**
   * Extract specific sections from AI response text
   */
  private extractSection(text: string, sectionName: string): string | null {
    // Enhanced text parsing for structured responses
    const patterns = {
      'appearance': /APPEARANCE[:\s]*(.*?)(?=\n[A-Z_]+:|$)/i,
      'APPEARANCE': /APPEARANCE[:\s]*(.*?)(?=\n[A-Z_]+:|$)/i,
      'style': /STYLE[:\s]*(.*?)(?=\n[A-Z_]+:|$)/i,
      'STYLE': /STYLE[:\s]*(.*?)(?=\n[A-Z_]+:|$)/i,
      'personality': /PERSONALITY[:\s]*(.*?)(?=\n[A-Z_]+:|$)/i,
      'PERSONALITY': /PERSONALITY[:\s]*(.*?)(?=\n[A-Z_]+:|$)/i,
      'KEY_FEATURES': /KEY_FEATURES[:\s]*(.*?)(?=\n[A-Z_]+:|$)/i,
      'key_features': /KEY_FEATURES[:\s]*(.*?)(?=\n[A-Z_]+:|$)/i
    };
    
    const pattern = patterns[sectionName as keyof typeof patterns];
    if (pattern) {
      const match = text.match(pattern);
      return match?.[1]?.trim() || null;
    }
    
    return null;
  }

  /**
   * Extract list of key features from AI response
   */
  private extractFeaturesList(text: string): string[] | null {
    // Look for bullet points or listed features
    const listPattern = /[-•*]\s*([^\n]+)/g;
    const matches = text.match(listPattern);
    
    if (matches && matches.length > 0) {
      return matches.map((match: string) => match.replace(/^[-•*]\s*/, '').trim()).slice(0, 5);
    }
    
    return null;
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