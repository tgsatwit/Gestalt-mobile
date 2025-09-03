/**
 * Story Image Generation Utilities
 * Helper functions for creating consistent, narrative-driven images
 */

import { Character } from '../types/storybook';

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
 * Build character profiles optimized for visual consistency
 */
export function buildCharacterProfiles(
  characters: Character[],
  characterIds: string[],
  childProfile?: {
    id: string;
    name: string;
    includeAsCharacter: boolean;
  }
): Array<{
  name: string;
  appearance: string;
  style: string;
  keyFeatures: string[];
  avatarUrl?: string;
}> {
  console.log('buildCharacterProfiles called with:');
  console.log('  - Available characters:', characters.map(c => ({ id: c.id, name: c.name, type: c.type })));
  console.log('  - Character IDs to select:', characterIds);
  console.log('  - Child profile:', childProfile);
  
  const selectedCharacters = characters.filter(char => 
    characterIds.includes(char.id)
  );
  
  console.log('  - Selected characters:', selectedCharacters.map(c => ({ id: c.id, name: c.name, type: c.type })));

  const characterProfiles = selectedCharacters.map(char => ({
    name: char.name,
    appearance: char.visualProfile?.appearance || 
      `${char.name} has distinctive Pixar-style features with warm, expressive characteristics suitable for children's storytelling`,
    style: char.visualProfile?.style || 
      'Child-friendly design with consistent visual identity that maintains recognition across all story pages',
    keyFeatures: char.visualProfile?.keyFeatures || [
      'Memorable facial features',
      'Consistent color scheme',
      'Expressive personality',
      'Child-appropriate design'
    ],
    avatarUrl: char.avatarUrl
  }));

  // Add child profile if included as character
  if (childProfile?.includeAsCharacter) {
    console.log('  - Adding child profile:', childProfile.name);
    characterProfiles.push({
      name: childProfile.name,
      appearance: `${childProfile.name} has warm, child-friendly Pixar-style features that embody curiosity and joy`,
      style: 'Age-appropriate design that appeals to children and represents the learning journey',
      keyFeatures: [
        'Bright, curious eyes',
        'Friendly, approachable demeanor',
        'Expressive gestures',
        'Natural, engaging personality'
      ],
      avatarUrl: '' // Child profiles are generated from description
    });
  }
  
  console.log('  - Final character profiles:', characterProfiles.map(cp => ({ name: cp.name, hasAvatar: !!cp.avatarUrl })));
  return characterProfiles;
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
 * Determine optimal reference image processing based on character count and avatar availability
 */
export function optimizeReferenceImages(
  characterProfiles: Array<{
    name: string;
    appearance: string;
    style: string;
    keyFeatures: string[];
    avatarUrl?: string;
  }>
): {
  charactersWithAvatars: typeof characterProfiles;
  charactersWithoutAvatars: typeof characterProfiles;
  totalReferencesAvailable: number;
} {
  const charactersWithAvatars = characterProfiles.filter(char => 
    char.avatarUrl && char.avatarUrl.length > 0
  );
  
  const charactersWithoutAvatars = characterProfiles.filter(char => 
    !char.avatarUrl || char.avatarUrl.length === 0
  );

  return {
    charactersWithAvatars,
    charactersWithoutAvatars,
    totalReferencesAvailable: charactersWithAvatars.length
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