/**
 * Story Image Generation Utilities
 * Helper functions for creating consistent, narrative-driven images
 */

import { Character, CharacterMapping } from '../types/storybook';

export interface StoryImageContext {
  concept?: string;
  characterNames?: string[];
  childName?: string;
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
}

/**
 * Build character mappings optimized for Gemini 2.5 Flash (max 3 avatars)
 * Priority: Primary character -> Secondary characters -> Supporting characters
 */
export function buildCharacterMappings(
  characters: Character[],
  characterIds: string[],
  childProfile?: {
    id: string;
    name: string;
    includeAsCharacter: boolean;
  }
): CharacterMapping[] {
  console.log('buildCharacterMappings called with:');
  console.log('  - Available characters:', characters.map(c => ({ id: c.id, name: c.name, type: c.type })));
  console.log('  - Character IDs to select:', characterIds);
  console.log('  - Child profile:', childProfile);
  
  const selectedCharacters = characters.filter(char => 
    characterIds.includes(char.id)
  );
  
  console.log('  - Selected characters:', selectedCharacters.map(c => ({ id: c.id, name: c.name, type: c.type })));

  // Start building character mappings with priority system
  const characterMappings: CharacterMapping[] = [];
  let avatarIndex = 0;

  // Priority 1: Child profile (always primary if included)
  if (childProfile?.includeAsCharacter && avatarIndex < 3) {
    console.log('  - Adding child profile as primary character:', childProfile.name);
    characterMappings.push({
      characterId: childProfile.id,
      name: childProfile.name,
      role: 'primary',
      avatarIndex: avatarIndex++,
      visualDescription: `${childProfile.name} has warm, child-friendly Pixar-style features that embody curiosity and joy`,
      avatarUrl: undefined // Child profiles are description-based
    });
  }

  // Priority 2: Characters with avatars (visual references available)
  const charactersWithAvatars = selectedCharacters.filter(char => char.avatarUrl && char.avatarUrl.length > 0);
  const charactersWithoutAvatars = selectedCharacters.filter(char => !char.avatarUrl || char.avatarUrl.length === 0);

  // Add characters with avatars first (up to remaining slots)
  for (const char of charactersWithAvatars) {
    if (avatarIndex >= 3) break; // Gemini 2.5 Flash limit

    const role = avatarIndex === 0 ? 'primary' : avatarIndex === 1 ? 'secondary' : 'supporting';
    
    characterMappings.push({
      characterId: char.id,
      name: char.name,
      role,
      avatarUrl: char.avatarUrl,
      avatarIndex: avatarIndex++,
      visualDescription: char.visualProfile?.appearance || 
        `${char.name} has distinctive Pixar-style features with warm, expressive characteristics suitable for children's storytelling`
    });
  }

  // Priority 3: Characters without avatars (description-based, remaining slots)
  for (const char of charactersWithoutAvatars) {
    if (avatarIndex >= 3) {
      // Add as description-only characters (no avatar slot)
      characterMappings.push({
        characterId: char.id,
        name: char.name,
        role: 'supporting',
        avatarIndex: -1, // No avatar reference
        visualDescription: char.visualProfile?.appearance || 
          `${char.name} should be generated as a Pixar-style character with distinctive, child-friendly features`
      });
    } else {
      const role = avatarIndex === 0 ? 'primary' : avatarIndex === 1 ? 'secondary' : 'supporting';
      characterMappings.push({
        characterId: char.id,
        name: char.name,
        role,
        avatarIndex: avatarIndex++,
        visualDescription: char.visualProfile?.appearance || 
          `${char.name} should be generated as a Pixar-style character with distinctive, child-friendly features`
      });
    }
  }
  
  console.log('  - Final character mappings:', characterMappings.map(cm => ({ 
    name: cm.name, 
    role: cm.role,
    hasAvatar: !!cm.avatarUrl,
    avatarIndex: cm.avatarIndex
  })));
  
  return characterMappings;
}

/**
 * Generate scene context for visual continuity
 */
export function buildSceneContext(
  pageNumber: number,
  concept: string,
  tone?: string
): {
  setting: string;
  mood: string;
  colorPalette: string[];
  visualStyle: string;
} {
  // Determine story progression context
  let setting = 'Establishing the story world';
  if (pageNumber > 1) {
    setting = 'Continuing the narrative journey';
  }

  // Map tone to mood and colors
  const moodMapping = {
    'playful': {
      mood: 'joyful and energetic',
      colors: ['bright yellow', 'cheerful orange', 'vibrant blue', 'grass green']
    },
    'gentle': {
      mood: 'calm and nurturing',
      colors: ['soft pink', 'warm cream', 'gentle blue', 'sage green']
    },
    'encouraging': {
      mood: 'uplifting and confident',
      colors: ['sunny gold', 'sky blue', 'forest green', 'coral pink']
    },
    'educational': {
      mood: 'focused and engaging',
      colors: ['deep blue', 'warm red', 'natural green', 'golden yellow']
    }
  };

  const selectedTone = tone as keyof typeof moodMapping || 'gentle';
  const toneSettings = moodMapping[selectedTone];

  return {
    setting: `${setting} - A scene that naturally illustrates learning about ${concept}`,
    mood: toneSettings.mood,
    colorPalette: toneSettings.colors,
    visualStyle: 'Professional Pixar 3D animation with child-friendly appeal'
  };
}

/**
 * Create narrative context for better scene understanding
 */
export function buildNarrativeContext(
  allStoryPages: string[],
  currentPageIndex: number,
  storyTitle: string,
  concept: string
): {
  currentPageText: string;
  previousPage?: string;
  nextPage?: string;
  storyProgression: string;
  visualFlow: string;
} {
  const currentPageText = allStoryPages[currentPageIndex] || '';
  const previousPage = currentPageIndex > 0 ? allStoryPages[currentPageIndex - 1] : undefined;
  const nextPage = currentPageIndex < allStoryPages.length - 1 ? allStoryPages[currentPageIndex + 1] : undefined;

  // Determine story progression
  let storyProgression = 'middle';
  if (currentPageIndex === 0) {
    storyProgression = 'beginning';
  } else if (currentPageIndex === allStoryPages.length - 1) {
    storyProgression = 'conclusion';
  }

  // Create visual flow guidance
  let visualFlow = 'Maintain narrative continuity with previous scenes';
  if (currentPageIndex === 0) {
    visualFlow = 'Establish the story world and introduce main characters';
  } else if (currentPageIndex === allStoryPages.length - 1) {
    visualFlow = 'Conclude the story with resolution and positive messaging';
  }

  return {
    currentPageText,
    previousPage,
    nextPage,
    storyProgression,
    visualFlow: `${visualFlow} while naturally illustrating the learning concept of ${concept}`
  };
}

/**
 * Generate story context description for image generation
 */
export function buildStoryContextDescription(
  storyTitle: string,
  concept: string,
  characterNames: string[]
): string {
  return `Learning story: "${storyTitle}" - A visual narrative designed to teach ${concept} through engaging storytelling featuring ${characterNames.join(', ')}. Each illustration should support the educational goal while maintaining child-friendly Pixar animation quality.`;
}

/**
 * Build explicit character identification prompts for Gemini 2.5 Flash
 */
export function buildCharacterIdentificationPrompts(
  characterMappings: CharacterMapping[],
  isFirstPage: boolean = true
): {
  avatarReferences: string[];
  characterInstructions: string[];
  totalAvatarInputs: number;
} {
  const avatarReferences: string[] = [];
  const characterInstructions: string[] = [];
  
  // Get only characters with actual avatar references (≤3)
  const charactersWithAvatars = characterMappings
    .filter(cm => cm.avatarUrl && cm.avatarIndex >= 0)
    .sort((a, b) => a.avatarIndex - b.avatarIndex); // Ensure correct order

  charactersWithAvatars.forEach((char, index) => {
    avatarReferences.push(`AVATAR REFERENCE ${index + 1}: ${char.name} (${char.role} character)`);
    
    if (isFirstPage) {
      characterInstructions.push(
        `- The ${char.role} character is ${char.name}: ${char.visualDescription}`
      );
    } else {
      characterInstructions.push(
        `- ${char.name} appears in the reference image as: ${char.positionInReference || 'the ' + char.role + ' character'}`
      );
    }
  });

  // Add description-only characters
  const descriptionOnlyCharacters = characterMappings.filter(cm => cm.avatarIndex === -1);
  descriptionOnlyCharacters.forEach(char => {
    characterInstructions.push(
      `- ${char.name} (${char.role} character, generate from description): ${char.visualDescription}`
    );
  });

  return {
    avatarReferences,
    characterInstructions,
    totalAvatarInputs: charactersWithAvatars.length
  };
}

/**
 * Create reference image context for subsequent page generation
 */
export function buildReferenceImageContext(
  firstPageImageData: string,
  characterMappings: CharacterMapping[]
): {
  referenceDescription: string;
  characterPositionMappings: Record<string, string>;
} {
  // Update character mappings with positions from first image
  const characterPositionMappings: Record<string, string> = {};
  
  characterMappings.forEach(char => {
    // In production, this would be enhanced with actual character position detection
    // For now, provide basic position guidance based on role
    let position = '';
    switch (char.role) {
      case 'primary':
        position = 'the main character in the center or prominent position';
        break;
      case 'secondary':
        position = 'the secondary character, often positioned to the side or as a companion';
        break;
      case 'supporting':
        position = 'the supporting character in the background or scene context';
        break;
    }
    
    characterPositionMappings[char.name] = position;
    
    // Update the character mapping for future use
    char.positionInReference = position;
  });

  const referenceDescription = `This reference image from page 1 shows all characters in their established visual style. ` +
    `Use this as the template for character consistency: ${characterMappings.map(cm => 
      `${cm.name} (${cm.positionInReference})`
    ).join(', ')}.`;

  return {
    referenceDescription,
    characterPositionMappings
  };
}

/**
 * Generate page-specific visual context for sequential consistency
 */
export function generatePageVisualContext(
  pageNumber: number,
  totalPages: number,
  pageText: string,
  concept: string
): {
  pageRole: string;
  visualEmphasis: string;
  sceneTransition: string;
} {
  const progressPercentage = (pageNumber / totalPages) * 100;
  
  let pageRole = 'story development';
  let visualEmphasis = 'character interaction and concept exploration';
  let sceneTransition = 'smooth narrative flow';

  if (pageNumber === 1) {
    pageRole = 'story introduction';
    visualEmphasis = 'character introduction and setting establishment';
    sceneTransition = 'engaging opening that draws attention';
  } else if (pageNumber === totalPages) {
    pageRole = 'story conclusion';
    visualEmphasis = 'resolution and learning reinforcement';
    sceneTransition = 'satisfying conclusion that reinforces the lesson';
  } else if (progressPercentage <= 33) {
    pageRole = 'story setup and character development';
    visualEmphasis = 'establishing relationships and introducing the learning challenge';
  } else if (progressPercentage >= 67) {
    pageRole = 'resolution and learning application';
    visualEmphasis = 'demonstrating mastery of the concept and positive outcomes';
  }

  return {
    pageRole: `${pageRole} (page ${pageNumber} of ${totalPages})`,
    visualEmphasis: `${visualEmphasis} related to ${concept}`,
    sceneTransition
  };
}