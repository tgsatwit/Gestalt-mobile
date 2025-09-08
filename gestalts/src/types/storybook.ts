// Types for the Storybook feature

export interface Character {
  id: string;
  name: string;
  avatarUrl: string;
  type: 'user' | 'gestalts'; // Distinguish between user-created and Gestalts characters
  originalPhotoUrl?: string; // Optional, for privacy we may not store this
  createdAt: Date;
  updatedAt: Date;
  aiAttributes?: string; // Any AI-generated descriptors
  // Visual consistency fields for story generation
  visualProfile?: {
    appearance: string; // Detailed physical description for consistency
    style: string; // Clothing and visual style notes
    personality: string; // Visual personality traits
    keyFeatures: string[]; // Distinctive features to maintain
    // Enhanced for character mapping
    characterRole?: 'primary' | 'secondary' | 'supporting';
    referenceDescription?: string; // How this character appears in generated images
  };
}

export interface StoryPage {
  id: string;
  pageNumber: number;
  text: string;
  imageUrl?: string;
  imagePrompt?: string; // The prompt used to generate this image
  generationStatus: 'pending' | 'generating' | 'completed' | 'error';
  characterIds?: string[]; // Characters appearing in this page
  // Enhanced for sequential consistency
  visualConsistencyData?: {
    isReferenceImage?: boolean; // True for first page that serves as reference
    characterPositions?: Record<string, string>; // Character name -> position description
    visualStyle?: {
      lighting: string;
      colorPalette: string[];
      backgroundStyle: string;
    };
    generationAttempts?: number;
    refinementHistory?: string[];
  };
}

export interface Story {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  characterIds: string[]; // References to Character IDs
  pages: StoryPage[];
  status: 'draft' | 'generating' | 'complete' | 'error';
  generationProgress?: number; // 0-100 percentage
  createdAt: Date;
  updatedAt: Date;
  theme?: string; // Optional story theme/moral
  ageGroup?: string; // Target age group
  
  // GLP-specific fields
  concept?: string; // The concept being taught
  childProfileId?: string; // Which child this story is for
  mode?: 'simple' | 'advanced';
  goal?: string; // Learning objective
  storySummary?: string; // AI-generated summary
  imageContext?: string; // Context for image generation
}

export interface ImageGenerationRequest {
  prompt: string;
  style?: 'animated' | 'watercolor' | 'cartoon' | 'realistic';
  referenceImages?: string[]; // Base64 or URLs of reference images
  width?: number;
  height?: number;
  // Enhanced for sequential consistency
  isFirstPage?: boolean;
  referencePageImage?: string; // Base64 of first generated page for subsequent pages
  characterMappings?: CharacterMapping[];
}

// New interface for character mapping in image generation
export interface CharacterMapping {
  characterId: string;
  name: string;
  role: 'primary' | 'secondary' | 'supporting';
  avatarUrl?: string;
  avatarIndex: number; // Position in image input array (0-2, respecting Gemini's 3-image limit)
  visualDescription: string;
  positionInReference?: string; // How character appears in reference image
}

export interface AvatarGenerationRequest {
  photoData: string; // Base64 encoded photo
  style?: 'animated' | 'stylized' | 'anime';
  characterName?: string;
}

export interface ImageRefinementRequest {
  imageUrl: string;
  refinementPrompt: string;
  pageId?: number;
  // Enhanced for conversational editing
  previousRefinements?: string[]; // Track refinement history
  characterConsistencyRef?: string; // Reference image for character consistency
  characterMappings?: CharacterMapping[]; // Character identification for consistency
}

export interface ConceptLearningRequest {
  // Step 1: Child & Concept Selection
  childProfileId?: string; // Reference to child profile
  concept: string; // The concept to teach (e.g., "sharing", "emotions", "counting")
  includeChildAsCharacter: boolean;
  
  // Step 2: Mode Selection
  mode: 'simple' | 'advanced';
  
  // Step 3: Advanced Options (if advanced mode)
  advanced?: {
    density: 'one-word' | 'one-sentence' | 'multiple-sentences';
    narrative: 'first-person' | 'third-person';
    pageCount: number; // 3-15 pages
    complexity: 'very-simple' | 'simple' | 'moderate' | 'complex';
    communicationStyle: 'visual-heavy' | 'balanced' | 'text-heavy';
    tone: 'playful' | 'gentle' | 'encouraging' | 'educational';
    goal: string; // What should the child learn/understand?
  };
  
  // Step 4: Character Selection
  characterIds: string[];
  
  // Generated content
  title?: string; // AI-generated and user-editable title
  storyPages?: StoryPageDraft[];
  storySummary?: string;
  imageContext?: string;
  // Visual continuity tracking
  sceneContext?: {
    setting: string; // Primary location/environment
    mood: string; // Overall visual mood
    colorPalette: string[]; // Consistent color scheme
    visualStyle: string; // Art direction notes
  };
}

export interface StoryPageDraft {
  pageNumber: number;
  text: string;
  isEdited: boolean;
  imagePrompt?: string;
  notes?: string; // For context/guidance
  // Enhanced visual context for consistency
  visualContext?: {
    characters: string[]; // Characters present in this page
    setting: string; // Scene location/environment
    action: string; // Main action/event happening
    previousPageVisualNotes?: string; // Context from previous page
  };
}

export interface StoryGenerationRequest {
  title: string;
  description: string;
  characterIds: string[];
  pageCount?: number; // Default to 5-10 pages
  theme?: string;
  ageGroup?: string;
  
  // Concept learning information
  concept?: string; // The learning concept (e.g., "sharing", "emotions")
  childProfile?: {
    id: string;
    name: string;
    includeAsCharacter: boolean;
  };
  
  // Advanced story settings
  advanced?: {
    density: 'one-word' | 'one-sentence' | 'multiple-sentences';
    narrative: 'first-person' | 'third-person';
    complexity: 'very-simple' | 'simple' | 'moderate' | 'complex';
    communicationStyle: 'visual-heavy' | 'balanced' | 'text-heavy';
    tone: 'playful' | 'gentle' | 'encouraging' | 'educational';
    goal: string; // Learning objective
  };
  
  // Pre-generated/edited story pages from wizard
  customStoryPages?: string[];
}

export interface GenerationProgress {
  status: 'idle' | 'uploading' | 'generating' | 'processing' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
  currentPage?: number;
  totalPages?: number;
  currentStep?: number; // Current step in the workflow
  totalSteps?: number; // Total steps in the workflow
}

export interface StoryCreationStep {
  step: number;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}

export type StoryWizardStep = 
  | 'character-selection'
  | 'concept-selection'
  | 'child-concept' // Legacy support
  | 'mode-selection' 
  | 'advanced-options'
  | 'text-generation'
  | 'text-editing'
  | 'image-generation'
  | 'review';

export interface ChildProfile {
  id: string;
  name: string;
  age?: number;
  glpStage?: 'stage-1' | 'stage-2' | 'stage-3' | 'stage-4';
  learningGoals?: string[];
  preferredComplexity?: 'very-simple' | 'simple' | 'moderate';
}

export interface StorybookError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}