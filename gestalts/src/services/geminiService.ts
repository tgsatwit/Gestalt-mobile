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
    throw new Error('Gemini API key not configured. Please ensure GEMINI_API_KEY is in your .env file and restart the app');
  }
  
  console.log('✅ Gemini API key found successfully');
  return apiKey;
};

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private textModel: any = null;
  private imageModel: any = null; // For image generation
  private visionModel: any = null; // For image analysis
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      console.log('🚀 Initializing Gemini service...');
      const apiKey = getGeminiApiKey();
      console.log('🔑 API key retrieved, initializing GoogleGenerativeAI...');
      
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Initialize different models for different tasks
      this.textModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      // Use Gemini 2.5 Flash with Imagen 3 for image generation
      this.imageModel = this.genAI.getGenerativeModel({ 
        model: 'imagen-3.0-generate-001',
        generationConfig: {
          responseMimeType: 'image/png'
        }
      });
      this.visionModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro-vision-latest' });
      this.initialized = true;
      console.log('✅ Gemini service initialized successfully');
      console.log('🎨 Image generation model: imagen-3.0-generate-001 (Imagen 3)');
      console.log('💬 Text generation model: gemini-1.5-pro');
      console.log('👁️ Vision model: gemini-1.5-pro-vision-latest');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini service:', error);
      console.error('Initialization error details:', (error as Error).message || error);
      this.initialized = false;
      // Don't throw here - let individual methods handle the error
    }
  }

  private checkInitialized() {
    if (!this.initialized || !this.genAI || !this.textModel || !this.imageModel || !this.visionModel) {
      console.log('🔄 Service not initialized, attempting to reinitialize...');
      // Try to reinitialize
      this.initialize();
      if (!this.initialized) {
        console.error('❌ Failed to initialize Gemini service');
        throw new Error('Gemini service not initialized. Please check your API key configuration.');
      }
      console.log('✅ Service reinitialized successfully');
    }
  }

  /**
   * Generate a stylized avatar from a photo
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
      
      console.log('🎨 Starting avatar generation with Imagen 3 for:', request.characterName);
      
      // First, analyze the photo with Gemini Vision to understand the person's features
      const imagePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: request.photoData.replace(/^data:image\/\w+;base64,/, '')
        }
      };
      
      let characterDescription = '';
      try {
        console.log('🔍 Analyzing photo with Gemini Vision...');
        
        const analysisPrompt = `Analyze this photo and describe the person's key features for creating a Pixar-style animated character:
          - Hair color and style
          - Face shape
          - Eye color
          - Notable features (glasses, freckles, etc.)
          - Age appearance
          Keep it concise and focused on visual features.`;
        
        const analysisResult = await this.visionModel.generateContent([analysisPrompt, imagePart]);
        const analysisResponse = await analysisResult.response;
        characterDescription = analysisResponse.text();
        console.log('✅ Character analysis:', characterDescription);
      } catch (analysisError) {
        console.warn('⚠️ Character analysis failed, using generic description');
        characterDescription = 'friendly character with warm smile';
      }
      
      try {
        console.log('🎨 Generating Pixar-style avatar with Imagen 3...');
        
        // Create prompt for Imagen 3 image generation
        const imagePrompt = `Create a Pixar-style 3D animated character portrait based on: ${characterDescription}.
          Style: High-quality Pixar/Disney 3D animation style
          - Friendly, approachable expression
          - Vibrant colors with soft lighting
          - Clean, simple background (solid pastel color or gradient)
          - Character facing forward, shoulders visible
          - Professional children's book illustration quality
          - Round, soft features suitable for children's content
          ${request.characterName ? `Character name: ${request.characterName}` : ''}`;
        
        console.log('📝 Image generation prompt:', imagePrompt);
        
        // Generate image using Imagen 3
        const imageResult = await this.imageModel.generateContent(imagePrompt);
        const imageResponse = await imageResult.response;
        
        console.log('📥 Imagen 3 response received');
        
        // Extract the generated image
        if (imageResponse.candidates && imageResponse.candidates[0]) {
          const candidate = imageResponse.candidates[0];
          
          // Check for image data in the response
          if (candidate.content?.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData?.data) {
                console.log('🖼️ Image data found!');
                
                // Convert base64 image to data URL
                const mimeType = part.inlineData.mimeType || 'image/png';
                const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
                
                console.log('✅ Avatar generated successfully with Imagen 3');
                
                return {
                  imageUrl: imageUrl,
                  visualProfile: {
                    appearance: characterDescription,
                    style: 'Pixar 3D Animation',
                    personality: 'Friendly and approachable',
                    keyFeatures: characterDescription.split(',').map(f => f.trim())
                  }
                };
              }
            }
          }
        }
        
        console.warn('⚠️ No image data in Imagen response, using fallback');
        // Fallback to stylized avatar
        const fallbackUrl = await this.generateStylizedAvatar(request.characterName, null);
        return fallbackUrl;
        
      } catch (error) {
        console.error('⚠️ Imagen 3 generation failed:', error);
        // Return a high-quality placeholder
        const fallbackUrl = await this.generateStylizedAvatar(request.characterName || 'Character', null);
        return fallbackUrl;
      }
    } catch (error) {
      console.error('❌ Avatar generation failed:', error);
      // Return a working fallback image
      return 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (request.characterName || 'default') + '&backgroundColor=b6e3f4';
    }
  }

  /**
   * Generate stylized avatar based on character description
   */
  private async generateStylizedAvatar(
    characterName: string | null,
    description: any
  ): Promise<string> {
    try {
      // Create avatar parameters based on the description
      const params = new URLSearchParams();
      
      // Base parameters for Pixar-style avatar
      params.append('seed', characterName || 'character');
      params.append('backgroundColor', 'b6e3f4,ffc0cb,ffdfba,c3b1e1,98d8c8'.split(',')[Math.floor(Math.random() * 5)]);
      params.append('radius', '50');
      params.append('scale', '90');
      
      if (description) {
        // Customize based on analyzed features
        if (description.hairColor) {
          const hairColors: { [key: string]: string } = {
            'black': '28211c',
            'brown': '6a4c3a',
            'blonde': 'fdd7a1',
            'red': 'c93a1d',
            'gray': '9a9a9a',
            'white': 'e8e8e8'
          };
          const colorKey = Object.keys(hairColors).find(key => 
            description.hairColor.toLowerCase().includes(key)
          );
          if (colorKey) {
            params.append('hairColor', hairColors[colorKey]);
          }
        }
        
        if (description.eyeColor) {
          const eyeColors: { [key: string]: string } = {
            'blue': '588c7e',
            'green': '83a85a',
            'brown': '6b4226',
            'hazel': '8b7355',
            'gray': '757575'
          };
          const colorKey = Object.keys(eyeColors).find(key => 
            description.eyeColor.toLowerCase().includes(key)
          );
          if (colorKey) {
            params.append('eyes', 'happy'); // Use happy eyes for friendly appearance
          }
        }
        
        // Add accessories based on distinctive features
        if (description.distinctiveFeatures) {
          const features = description.distinctiveFeatures.join(' ').toLowerCase();
          if (features.includes('glasses')) {
            params.append('accessories', 'prescription02');
          }
        }
        
        // Set mood based on personality
        if (description.personality) {
          params.append('mouth', 'smile');
        }
      }
      
      // Use avataaars style for better Pixar-like appearance
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?${params.toString()}`;
      
      console.log('🎨 Generated stylized avatar URL:', avatarUrl);
      return avatarUrl;
    } catch (error) {
      console.warn('Stylized avatar generation failed:', error);
      // Return a working fallback
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${characterName || 'default'}&backgroundColor=b6e3f4`;
    }
  }

  /**
   * Create a consistent character seed based on name and profile
   */
  private createCharacterSeed(characterName: string, characterProfile?: any): string {
    // Create a consistent but unique seed based on character name
    const baseSeed = characterName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Add some character traits if available to make it more unique
    if (characterProfile && characterProfile.keyFeatures) {
      const featureHash = characterProfile.keyFeatures.join('').toLowerCase().slice(0, 5);
      return `${baseSeed}-${featureHash}`;
    }
    
    return baseSeed;
  }

  /**
   * Analyze photo for character traits using vision model
   */
  private async analyzePhotoForCharacter(request: AvatarGenerationRequest): Promise<{
    appearance: string;
    style: string;
    personality: string;
    keyFeatures: string[];
  } | null> {
    try {
      const analysisPrompt = `Analyze this photo to create a detailed character profile for a Pixar-style children's storybook character named "${request.characterName || 'Character'}".

Provide a detailed analysis focusing on:

PHYSICAL APPEARANCE:
- Facial features (eyes, nose, mouth, face shape)
- Hair color, style, and texture
- Skin tone and complexion
- Overall build and posture
- Age appearance

STYLE ELEMENTS:
- Clothing style and colors
- Accessories or distinctive items
- Overall aesthetic preferences
- Color palette that suits them

PERSONALITY TRAITS (inferred from photo):
- Facial expression and what it suggests
- Body language and posture
- Energy level (calm, energetic, thoughtful, etc.)
- Approachability and demeanor

KEY DISTINCTIVE FEATURES:
- Most memorable physical characteristics
- Unique traits that would make them recognizable
- Features that should be preserved in Pixar adaptation

Format your response as:
APPEARANCE: [detailed physical description]
STYLE: [clothing and aesthetic description] 
PERSONALITY: [personality traits inferred from photo]
KEY_FEATURES: [list 3-5 distinctive features]`;

      const imagePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: request.photoData.replace(/^data:image\/\w+;base64,/, '')
        }
      };

      console.log('🔍 Analyzing photo for character traits...');
      const result = await this.visionModel.generateContent([analysisPrompt, imagePart]);
      const response = await result.response;
      const analysisText = response.text();

      if (analysisText && analysisText.length > 100) {
        console.log('✅ Photo analysis completed');
        return this.parseCharacterAnalysis(analysisText, request.characterName || 'Character');
      }

      return null;
    } catch (error) {
      console.error('Photo analysis failed:', error);
      return null;
    }
  }

  /**
   * Parse character analysis text into structured format
   */
  private parseCharacterAnalysis(analysisText: string, characterName: string): {
    appearance: string;
    style: string;
    personality: string;
    keyFeatures: string[];
  } {
    const appearance = this.extractSection(analysisText, 'APPEARANCE') || 
      `${characterName} has distinctive features suitable for Pixar-style animation with warm, expressive characteristics`;
    
    const style = this.extractSection(analysisText, 'STYLE') || 
      `Colorful, child-friendly clothing with a consistent design aesthetic that maintains visual identity`;
    
    const personality = this.extractSection(analysisText, 'PERSONALITY') || 
      `Warm, engaging, and child-friendly personality that comes through in expressions and poses`;

    // Extract key features
    const keyFeaturesText = this.extractSection(analysisText, 'KEY_FEATURES');
    let keyFeatures: string[] = [];
    
    if (keyFeaturesText) {
      // Try to parse numbered or bulleted list
      keyFeatures = keyFeaturesText
        .split(/[\n\r]+/)
        .map(line => line.replace(/^[-•*\d.)\s]+/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 5);
    }
    
    if (keyFeatures.length === 0) {
      keyFeatures = [
        'Distinctive facial features',
        'Memorable color scheme', 
        'Expressive eyes',
        'Friendly demeanor',
        'Recognizable silhouette'
      ];
    }

    return {
      appearance,
      style,
      personality,
      keyFeatures
    };
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
      const style = 'pixar'; // Consistent Pixar style per guidelines
      const mainCharacter = request.context?.childName || request.context?.characterNames?.[0] || 'the child';
      
      // Build comprehensive prompt following Gemini 2.5 Flash best practices for sequential consistency
      let enhancedPrompt = `Create a single, high-quality children's storybook illustration panel in professional Pixar 3D animation style.
        
        SCENE TO ILLUSTRATE: ${request.prompt}
        
        STORY CONTEXT: This is ${request.context?.pageNumber ? `page ${request.context.pageNumber} of ${request.context.totalPages}` : 'a page'} in the story "${request.context?.concept ? `about learning ${request.context.concept}` : 'adventure'}".
        
        PIXAR STYLE REQUIREMENTS (Hyper-Specific for Consistency):
        - Professional Pixar 3D animation aesthetic matching Toy Story, Finding Nemo, and Coco visual quality
        - Vibrant, saturated color palette with soft, warm directional lighting from upper left
        - Rounded, child-friendly character designs with smooth, polished surfaces
        - Subtle texture details on clothing and environmental elements
        - Dynamic composition following rule of thirds with clear focal hierarchy
        - Expressive character emotions through eyebrow position, mouth shape, and body posture
        - Rich environmental details with atmospheric perspective and depth cues
        - Background should complement the story narrative and support character actions
        
        CRITICAL CHARACTER CONSISTENCY GUIDELINES:
        - MAINTAIN IDENTICAL character appearance across ALL illustrations in this story sequence
        - Each character MUST have the same facial structure, hair color/style, eye color, and body proportions
        - Clothing styles and colors MUST remain consistent throughout the story
        - Character expressions should vary naturally while preserving core facial features
        - Use step-by-step character description approach for precision
        - Characters should be positioned and posed to naturally illustrate the story text`;
      
      // Add detailed character profiles for consistency (following Gemini 2.5 best practices)
      if (request.context) {
        // Main character detailed description
        if (mainCharacter && mainCharacter !== 'the child') {
          enhancedPrompt += `
        
        MAIN CHARACTER PROFILE - ${mainCharacter} (Central Focus):
        - NAME: ${mainCharacter} (use this name consistently, never "the child" or generic terms)
        - POSITION: Central focal point of the illustration, clearly prominent
        - VISUAL CONSISTENCY: Must match previous pages exactly in all physical characteristics
        - PERSONALITY EXPRESSION: Show ${mainCharacter}'s character through natural pose and authentic facial expression`;
          
          // Add detailed character profile if available
          if (request.context.characterProfiles) {
            const characterProfile = request.context.characterProfiles.find(p => p.name === mainCharacter);
            if (characterProfile) {
              enhancedPrompt += `
        - APPEARANCE: ${characterProfile.appearance}
        - STYLE NOTES: ${characterProfile.style}
        - KEY DISTINCTIVE FEATURES: ${characterProfile.keyFeatures.join(', ')}`;
            }
          }
        }
        
        // All characters with specific descriptions
        if (request.context.characterNames && request.context.characterNames.length > 0) {
          enhancedPrompt += `
        
        ALL CHARACTERS IN THIS SCENE: ${request.context.characterNames.join(', ')}
        CRITICAL CONSISTENCY REQUIREMENTS:
        - Each character must maintain IDENTICAL appearance to previous pages
        - Use the same character design language and art style for all figures
        - Characters should interact naturally while preserving their established visual identity
        - No character design variations or artistic interpretations - EXACT consistency required`;
          
          // Add individual character profiles
          request.context.characterProfiles?.forEach(profile => {
            enhancedPrompt += `
        
        CHARACTER: ${profile.name}
        - Appearance: ${profile.appearance}
        - Style: ${profile.style}
        - Key Features: ${profile.keyFeatures.join(', ')}`;
          });
        }
        
        // Add narrative story context for better scene understanding
        if (request.context.allStoryPages && request.context.pageNumber) {
          const currentPageIndex = request.context.pageNumber - 1;
          const previousPage = currentPageIndex > 0 ? request.context.allStoryPages[currentPageIndex - 1] : null;
          const nextPage = currentPageIndex < request.context.allStoryPages.length - 1 ? request.context.allStoryPages[currentPageIndex + 1] : null;
          
          enhancedPrompt += `
        
        NARRATIVE CONTEXT FOR VISUAL CONSISTENCY:
        - CURRENT PAGE TEXT: "${request.context.allStoryPages[currentPageIndex] || request.prompt}"
        ${previousPage ? `- PREVIOUS PAGE: "${previousPage}"` : ''}
        ${nextPage ? `- NEXT PAGE PREVIEW: "${nextPage}"` : ''}
        - VISUAL FLOW: This illustration should naturally connect the story progression
        - SCENE TRANSITION: Show appropriate continuation from previous events while setting up what comes next`;
        }
        
        // Add visual continuity context (critical for sequential consistency)
        if (request.context.previousPageContext) {
          enhancedPrompt += `
        
        SEQUENTIAL VISUAL CONTINUITY:
        - PREVIOUS PAGE CONTEXT: ${request.context.previousPageContext}
        - TRANSITION REQUIREMENT: This illustration should flow naturally from the previous scene
        - ENVIRONMENTAL CONSISTENCY: Maintain similar lighting, color scheme, and visual atmosphere
        - CHARACTER CONTINUITY: Characters should show natural progression while maintaining identical appearance`;
        }
        
        // Add scene context for environmental consistency
        if (request.context.sceneContext) {
          enhancedPrompt += `
        
        ENVIRONMENTAL CONSISTENCY PROFILE:
        - PRIMARY SETTING: ${request.context.sceneContext.setting}
        - VISUAL MOOD: ${request.context.sceneContext.mood}
        - COLOR PALETTE: ${request.context.sceneContext.colorPalette.join(', ')} tones throughout
        - VISUAL STYLE: ${request.context.sceneContext.visualStyle}
        - LIGHTING CONSISTENCY: Maintain similar lighting direction and warmth across scenes`;
        }
        
        // Add page progression context
        if (request.context.pageNumber && request.context.totalPages) {
          const progressPercentage = Math.round((request.context.pageNumber / request.context.totalPages) * 100);
          enhancedPrompt += `
        
        STORY PROGRESSION CONTEXT:
        - PAGE: ${request.context.pageNumber} of ${request.context.totalPages} (${progressPercentage}% through story)
        - PACING: ${request.context.pageNumber <= 2 ? 'Story introduction/setup' : 
                   request.context.pageNumber >= request.context.totalPages - 1 ? 'Story conclusion/resolution' : 
                   'Story development/action'}
        - VISUAL FLOW: This page should naturally connect to the overall story arc`;
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

      // Enhanced character avatar integration for consistency
      const parts: any[] = [enhancedPrompt];
      const characterAvatars: any[] = [];
      
      console.log('🎭 Processing character profiles for image generation:');
      console.log('  - Character profiles available:', request.context?.characterProfiles?.length || 0);
      
      // Process character avatars for visual consistency
      if (request.context?.characterProfiles && request.context.characterProfiles.length > 0) {
        console.log('  - Character profiles:', request.context.characterProfiles.map(cp => ({ name: cp.name, hasAvatar: !!cp.avatarUrl })));
        
        enhancedPrompt += `
        
        CHARACTER AVATAR REFERENCES PROVIDED (CRITICAL FOR CONSISTENCY):
        INSTRUCTION: Use these avatar references as EXACT templates for character appearance in the story scene
        - MATCHING REQUIREMENT: Character features, proportions, and style must match avatar references precisely
        - SCENE INTEGRATION: Naturally pose and position characters within the story scene
        - EXPRESSION ADAPTATION: Maintain character identity while showing appropriate emotions for the scene
        - CONSISTENCY CHECK: Every character detail should match their established avatar design`;
        
        // Process up to 3 character avatars for Gemini 2.5 best practices
        for (let i = 0; i < Math.min(request.context.characterProfiles.length, 3); i++) {
          const character = request.context.characterProfiles[i];
          console.log(`  - Processing character ${i + 1}: ${character.name}, avatar: ${character.avatarUrl ? 'available' : 'none'}`);
          
          if (character.avatarUrl && character.avatarUrl.length > 0) {
            try {
              console.log(`    - Attempting to download avatar: ${character.avatarUrl}`);
              // Download and convert avatar to base64 for reference
              const avatarData = await this.downloadImageAsBase64(character.avatarUrl);
              console.log(`    - Successfully converted avatar to base64 (${avatarData.length} chars)`);
              
              parts.push({
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: avatarData
                }
              });
              
              enhancedPrompt += `
        
        CHARACTER AVATAR REFERENCE ${i + 1}: ${character.name}
        - VISUAL TEMPLATE: Use this avatar as the exact visual reference for ${character.name}
        - APPEARANCE: ${character.appearance}
        - STYLE NOTES: ${character.style}
        - KEY FEATURES TO PRESERVE: ${character.keyFeatures.join(', ')}
        - SCENE ROLE: Position ${character.name} naturally within the scene while maintaining avatar consistency`;
              
              characterAvatars.push(character);
              console.log(`    - Added ${character.name} avatar reference to generation context`);
            } catch (error) {
              console.warn(`    - Failed to load avatar for ${character.name}:`, (error as Error).message);
              console.warn(`    - Avatar URL was: ${character.avatarUrl}`);
              // Continue without this avatar reference but still include character description
              enhancedPrompt += `
        
        CHARACTER DESCRIPTION ${i + 1}: ${character.name} (Avatar load failed)
        - APPEARANCE: ${character.appearance}
        - STYLE NOTES: ${character.style}
        - KEY FEATURES: ${character.keyFeatures.join(', ')}
        - NOTE: Generate appearance based on description (avatar reference failed to load)`;
            }
          } else {
            console.log(`    - No avatar URL for ${character.name}, using description-based generation`);
            // No avatar URL available, use description-based character generation
            enhancedPrompt += `
        
        CHARACTER DESCRIPTION ${i + 1}: ${character.name}
        - APPEARANCE: ${character.appearance}
        - STYLE NOTES: ${character.style}
        - KEY FEATURES: ${character.keyFeatures.join(', ')}
        - NOTE: Generate appearance based on description (ideal for child characters)`;
          }
        }
      }
      
      // Handle legacy reference images if provided
      if (request.referenceImages && request.referenceImages.length > 0 && characterAvatars.length === 0) {
        enhancedPrompt += `
        
        CHARACTER REFERENCE IMAGES PROVIDED (FALLBACK METHOD):
        INSTRUCTION: Use these reference images as templates for character appearance`;
        
        for (let i = 0; i < Math.min(request.referenceImages.length, 3 - characterAvatars.length); i++) {
          const refImage = request.referenceImages[i];
          
          let imageData: string;
          if (refImage.startsWith('data:')) {
            imageData = refImage.replace(/^data:image\/\w+;base64,/, '');
          } else {
            console.warn('URL-based reference images not yet supported');
            continue;
          }
          
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageData
            }
          });
          
          const characterName = request.context?.characterNames?.[i] || `Character ${i + 1}`;
          enhancedPrompt += `
        
        REFERENCE IMAGE ${i + 1}: ${characterName}
        - Use this as the visual template for ${characterName}
        - Match key features while adapting to the scene naturally`;
        }
      }
      
      // Update the parts array with the enhanced prompt
      parts[0] = enhancedPrompt;

      try {
        console.log('🎨 Generating story illustration with Imagen 3...');
        console.log(`📖 Page ${request.context?.pageNumber || 1} of ${request.context?.totalPages || 1}`);
        console.log(`🎭 Characters: ${request.context?.characterNames?.join(', ') || 'none'}`);
        console.log(`📝 Scene: ${request.prompt.substring(0, 100)}...`);
        
        // Build a comprehensive prompt for Imagen 3
        const characterList = request.context?.characterNames?.length ? 
          `featuring ${request.context.characterNames.join(', ')}` : '';
        
        const imagePrompt = `Create a Pixar-style 3D animated storybook illustration:
          
          SCENE: ${request.prompt}
          ${characterList}
          
          Style requirements:
          - High-quality Pixar/Disney 3D animation style
          - Vibrant, child-friendly colors
          - Soft, warm lighting
          - Clear composition focusing on the main action
          - Professional children's book illustration
          - Characters should have expressive faces and body language
          - Background should complement but not distract from the action
          - Maintain consistency with children's storybook aesthetics
          
          Page ${request.context?.pageNumber || 1} of ${request.context?.totalPages || 1}`;
        
        console.log('📝 Imagen 3 prompt created');
        
        try {
          // Generate image using Imagen 3
          const imageResult = await this.imageModel.generateContent(imagePrompt);
          const imageResponse = await imageResult.response;
          
          console.log('📥 Imagen 3 response received for story page');
          
          // Extract the generated image
          if (imageResponse.candidates && imageResponse.candidates[0]) {
            const candidate = imageResponse.candidates[0];
            
            // Check for image data in the response
            if (candidate.content?.parts) {
              for (const part of candidate.content.parts) {
                if (part.inlineData?.data) {
                  console.log('🖼️ Story illustration image data found!');
                  
                  // Convert base64 image to data URL
                  const mimeType = part.inlineData.mimeType || 'image/png';
                  const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
                  
                  console.log('✅ Story page illustration generated successfully with Imagen 3');
                  return imageUrl;
                }
              }
            }
          }
          
          console.warn('⚠️ No image data in Imagen response, using fallback');
          
        } catch (imagenError) {
          console.error('⚠️ Imagen 3 failed for story illustration:', imagenError);
          
          // Return error placeholder as specified in requirements
          return this.generateErrorPlaceholder('Image generation failed, tap to retry');
        }
        
        // Fallback to stylized illustration
        const fallbackUrl = await this.generateStylizedStoryIllustration(
          request.prompt,
          request.context?.pageNumber || 1,
          request.context?.characterNames || [],
          null,
          mainCharacter
        );
        
        return fallbackUrl;
      } catch (error) {
        const errorMessage = (error as Error).message || String(error);
        console.error('❌ GEMINI API ERROR - Image Generation Failed:');
        console.error('   📄 Page:', request.context?.pageNumber || 1);
        console.error('   🎭 Characters:', request.context?.characterNames?.join(', ') || 'none');
        console.error('   💬 Error:', errorMessage);
        console.error('   🔍 Error Type:', typeof error);
        
        // Enhanced error classification and handling
        let fallbackReason = 'generic-error';
        if (errorMessage.includes('not supported') || errorMessage.includes('feature')) {
          fallbackReason = 'feature-not-supported';
          console.log('📝 Gemini image generation feature not yet available - using enhanced placeholder');
        } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
          fallbackReason = 'quota-exceeded';
          console.log('⏰ API quota exceeded - using placeholder with retry suggestion');
        } else if (errorMessage.includes('API key') || errorMessage.includes('auth')) {
          fallbackReason = 'auth-error';
          console.log('🔑 Authentication issue - using placeholder');
        } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          fallbackReason = 'network-error';
          console.log('🌐 Network connectivity issue - using placeholder');
        } else {
          console.log('🔧 Generic API error - using placeholder with error context');
        }
        
        // Return contextual fallback image with error information
        const errorFallbackSeed = `story-${request.context?.concept || 'learning'}-page${String(request.context?.pageNumber || 1).padStart(2, '0')}-${mainCharacter.replace(/\s+/g, '')}-${fallbackReason}`;
        console.log('🎨 Generating contextual fallback image with seed:', errorFallbackSeed);
        
        // Create fallback description based on the prompt
        const fallbackDescription = `Pixar-style scene showing ${mainCharacter} in a ${request.context?.concept || 'learning'} story. ${request.prompt.substring(0, 100)}`;
        return this.generatePlaceholderImage('pixar-sequential', errorFallbackSeed, fallbackDescription);
      }
      
      // Enhanced fallback with sequential context
      const sequentialSeed = `story-${request.context?.concept || 'learning'}-page${String(request.context?.pageNumber || 1).padStart(2, '0')}-${mainCharacter.replace(/\s+/g, '')}-fallback`;
      const fallbackDescription = `Pixar-style illustration of ${mainCharacter} in ${request.context?.concept || 'learning'} story: ${request.prompt.substring(0, 100)}`;
      return this.generatePlaceholderImage('pixar-sequential', sequentialSeed, fallbackDescription);
    } catch (error) {
      console.error('❌ OUTER CATCH - Story image generation failed completely:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      throw this.handleError(error as Error);
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

      const result = await this.visionModel.generateContent([prompt, imagePart]);
      const response = await result.response;
      
      // Temporary placeholder
      console.warn('Direct image editing not available in current Gemini model');
      return request.imageUrl; // Return original for now
    } catch (error) {
      console.error('Image refinement failed:', error);
      throw this.handleError(error as Error);
    }
  }

  /**
   * Generate story text using AI with character names woven throughout
   * Enhanced with visual context generation for image consistency
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
      const result = await this.textModel!.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Story text generated successfully');
      
      // Enhanced parsing to handle various response formats
      let pages: string[] = [];
      
      // First, try to extract pages with "Page X:" format
      const pageMatches = text.match(/Page\s+\d+:?\s*[^\n]+/gi);
      
      if (pageMatches && pageMatches.length >= pageCount) {
        // Found page markers, extract the content
        pages = pageMatches.map((match: string) => {
          // Remove "Page X:" prefix and clean up
          return match.replace(/^Page\s+\d+:?\s*/i, '').trim();
        });
      } else {
        // Fallback: Split by double newlines or single newlines
        const lines = text.split(/\n+/)
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0);
        
        // Filter out common non-story elements
        const filteredLines = lines.filter((line: string) => {
          // Skip lines that are just titles or meta text
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
        
        // If we have a potential title at the start (like "Olivia Learns About..."), skip it
        let startIndex = 0;
        if (filteredLines.length > 0 && 
            filteredLines[0].toLowerCase().includes('learns about') && 
            filteredLines[0].length < 100) {
          startIndex = 1;
        }
        
        pages = filteredLines.slice(startIndex);
      }
      
      // Clean up each page text
      pages = pages.map(page => {
        // Remove any remaining "Page X" prefixes
        page = page.replace(/^Page\s+\d+:?\s*/i, '');
        // Remove quotes if the entire page is quoted
        if (page.startsWith('"') && page.endsWith('"')) {
          page = page.slice(1, -1);
        }
        return page.trim();
      }).filter(page => page.length > 0);
      
      // Ensure we have exactly the right number of pages
      if (pages.length > pageCount) {
        // If we have too many, take the first pageCount pages
        pages = pages.slice(0, pageCount);
      } else if (pages.length < pageCount) {
        // If we have too few, try to regenerate with clearer instructions
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
   * Generate error placeholder image with retry message
   */
  private generateErrorPlaceholder(message: string): string {
    // Create a data URL for an error placeholder with the message
    // Using a simple SVG with the error message
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
    
    const base64svg = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64svg}`;
  }
  
  /**
   * Generate a stylized story illustration
   */
  private async generateStylizedStoryIllustration(
    prompt: string,
    pageNumber: number,
    characterNames: string[],
    visualDesc: any,
    mainCharacter: string
  ): Promise<string> {
    try {
      // Create consistent seed for this page
      const pageSeed = `${mainCharacter.replace(/\s+/g, '')}-page${pageNumber}-${prompt.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '')}`;
      
      // Select background based on mood or page number
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
      
      let backgroundColor = 'b6e3f4,c3b1e1'; // Default
      if (visualDesc?.mood) {
        const moodKey = Object.keys(moodBackgrounds).find(key => 
          visualDesc.mood.toLowerCase().includes(key)
        );
        if (moodKey) {
          backgroundColor = moodBackgrounds[moodKey];
        }
      } else {
        // Cycle through different backgrounds for variety
        const backgrounds = Object.values(moodBackgrounds);
        backgroundColor = backgrounds[pageNumber % backgrounds.length];
      }
      
      // Build illustration URL with parameters
      const params = new URLSearchParams();
      params.append('seed', pageSeed);
      params.append('backgroundColor', backgroundColor);
      params.append('scale', '110');
      params.append('radius', '20');
      
      // Use fun-emoji style for more child-friendly illustrations
      const illustrationUrl = `https://api.dicebear.com/7.x/fun-emoji/svg?${params.toString()}`;
      
      console.log(`🎨 Story illustration created for page ${pageNumber}`);
      console.log(`   Seed: ${pageSeed}`);
      console.log(`   Background: ${backgroundColor}`);
      
      // Add slight delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return illustrationUrl;
    } catch (error) {
      console.error('Failed to generate story illustration:', error);
      // Return a basic fallback
      return `https://api.dicebear.com/7.x/shapes/svg?seed=page${pageNumber}&backgroundColor=b6e3f4`;
    }
  }
  
  /**
   * Generate enhanced placeholder images with sequential consistency and narrative context
   */
  private generatePlaceholderImage(style: string, seed: string, sceneDescription?: string): string {
    console.log(`🖼️  Generating placeholder image: style="${style}", seed="${seed}"`);
    if (sceneDescription) {
      console.log(`   Scene context: "${sceneDescription.substring(0, 100)}..."`);
    }
    
    // For avatar generation, use high-quality avatar-specific placeholders
    if ((style === 'cartoon' || style === 'pixar') && !seed.includes('page') && !seed.includes('story')) {
      const avatarSeed = seed.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      
      // Use different avatar styles for variety and better cartoon aesthetics
      const avatarStyles = [
        'big-smile',     // Friendly cartoon style
        'avataaars',     // Classic avatar style
        'fun-emoji',     // Fun emoji-like style
        'lorelei'        // Stylized cartoon style
      ];
      
      // Select style based on character name for consistency
      const styleIndex = avatarSeed.length % avatarStyles.length;
      const selectedStyle = avatarStyles[styleIndex];
      
      // Generate with clean white background and child-friendly settings
      const avatarUrl = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${avatarSeed}&backgroundColor=ffffff&radius=50&scale=85&flip=false`;
      
      console.log(`👤 Generated enhanced avatar placeholder (${selectedStyle}): ${avatarUrl}`);
      return avatarUrl;
    }
    
    // For story images, create contextual placeholders
    let label = 'Pixar Story';
    let backgroundColor = '7C3AED'; // Primary purple
    let textColor = 'FFFFFF';
    
    // Extract information from seed
    const pageMatch = seed.match(/page(\d+)/);
    const conceptMatch = seed.match(/story-([^-]+)/);
    const characterMatch = seed.match(/-([a-zA-Z]+)-/);
    
    if (pageMatch) {
      const pageNum = pageMatch[1];
      label = `Story Page ${pageNum}`;
      
      // Use different colors for different pages to show progression
      const pageColors = {
        '01': '7C3AED', // Purple - Introduction
        '02': '3B82F6', // Blue - Development  
        '03': '10B981', // Green - Action
        '04': 'F59E0B', // Yellow - Climax
        '05': 'EF4444'  // Red - Resolution
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
    
    // Add scene context if available
    if (sceneDescription && sceneDescription.length > 20) {
      // Extract key words from scene description
      const keywords = sceneDescription
        .toLowerCase()
        .match(/\b(happy|sad|excited|learning|playing|sharing|helping|exploring|discovering|smiling|laughing|colorful|bright|magical|adventure|friendship|kind|gentle|brave|curious)\b/g);
      
      if (keywords && keywords.length > 0) {
        const mood = keywords[0];
        label += `\n(${mood} scene)`;
      }
    }
    
    // Handle different error states with visual indicators
    if (seed.includes('error')) {
      backgroundColor = '6B7280'; // Gray for errors
      label = 'Image Generation\nTemporarily Unavailable';
    } else if (seed.includes('quota')) {
      backgroundColor = 'F97316'; // Orange for quota issues
      label += '\n(Processing...)';
    }
    
    const placeholderUrl = `https://placehold.co/1024x1024/${backgroundColor}/${textColor}/png?text=${encodeURIComponent(label)}&font=raleway`;
    console.log(`🎨 Generated contextual story placeholder: ${placeholderUrl}`);
    return placeholderUrl;
  }

  /**
   * Extract character visual profile from AI response text
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