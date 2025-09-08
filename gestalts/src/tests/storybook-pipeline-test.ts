/**
 * Test suite for the enhanced storybook image generation pipeline
 * Validates Gemini 2.5 Flash character consistency implementation
 */

import { buildCharacterMappings, buildCharacterIdentificationPrompts, buildReferenceImageContext } from '../utils/storyImageUtils.js';
import { Character, CharacterMapping } from '../types/storybook.js';

// Mock character data for testing
const mockCharacters: Character[] = [
  {
    id: '1',
    name: 'Alice',
    avatarUrl: 'https://example.com/alice-avatar.jpg',
    type: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    visualProfile: {
      appearance: 'Alice has bright blue eyes, curly brown hair, and a cheerful smile',
      style: 'Wears a red dress with white polka dots',
      personality: 'Curious and adventurous',
      keyFeatures: ['Curly brown hair', 'Blue eyes', 'Red polka dot dress', 'Cheerful smile'],
      characterRole: 'primary'
    }
  },
  {
    id: '2',
    name: 'Bob',
    avatarUrl: 'https://example.com/bob-avatar.jpg',
    type: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    visualProfile: {
      appearance: 'Bob has short blonde hair, green eyes, and freckles',
      style: 'Wears a blue t-shirt and jeans',
      personality: 'Friendly and helpful',
      keyFeatures: ['Blonde hair', 'Green eyes', 'Freckles', 'Blue t-shirt'],
      characterRole: 'secondary'
    }
  },
  {
    id: '3',
    name: 'Charlie',
    avatarUrl: '', // No avatar URL to test description-based generation
    type: 'gestalts',
    createdAt: new Date(),
    updatedAt: new Date(),
    visualProfile: {
      appearance: 'Charlie is a small orange cat with white paws',
      style: 'Natural cat appearance with bright orange fur',
      personality: 'Playful and mischievous',
      keyFeatures: ['Orange fur', 'White paws', 'Whiskers', 'Playful expression'],
      characterRole: 'supporting'
    }
  }
];

const mockChildProfile = {
  id: 'child-1',
  name: 'Emma',
  includeAsCharacter: true
};

/**
 * Test character mapping system with Gemini 3-image limit
 */
export function testCharacterMappings() {
  console.log('🧪 Testing character mapping system...');
  
  const characterIds = ['1', '2', '3'];
  const mappings = buildCharacterMappings(mockCharacters, characterIds, mockChildProfile);
  
  console.log('📊 Character mappings result:', mappings.map(m => ({
    name: m.name,
    role: m.role,
    avatarIndex: m.avatarIndex,
    hasAvatar: !!m.avatarUrl
  })));

  // Validate mapping results
  const assertions = [
    { test: mappings.length === 4, description: 'Should have 4 characters (3 + child)' },
    { test: mappings.filter(m => m.avatarIndex >= 0).length <= 3, description: 'Should respect Gemini 3-image limit' },
    { test: mappings.some(m => m.name === 'Emma' && m.role === 'primary'), description: 'Child should be primary character' },
    { test: mappings.filter(m => m.role === 'primary').length === 1, description: 'Should have exactly one primary character' }
  ];

  let passed = 0;
  assertions.forEach(({ test, description }, index) => {
    const result = test ? '✅' : '❌';
    console.log(`   ${index + 1}. ${result} ${description}`);
    if (test) passed++;
  });

  console.log(`📈 Character mapping tests: ${passed}/${assertions.length} passed\n`);
  return { passed, total: assertions.length };
}

/**
 * Test character identification prompt building
 */
export function testCharacterIdentificationPrompts() {
  console.log('🧪 Testing character identification prompts...');
  
  const characterIds = ['1', '2'];
  const mappings = buildCharacterMappings(mockCharacters, characterIds);
  
  // Test first page prompts
  const firstPagePrompts = buildCharacterIdentificationPrompts(mappings, true);
  console.log('📝 First page prompts:', {
    avatarReferences: firstPagePrompts.avatarReferences.length,
    characterInstructions: firstPagePrompts.characterInstructions.length,
    totalAvatarInputs: firstPagePrompts.totalAvatarInputs
  });

  // Test subsequent page prompts
  mappings.forEach(m => {
    m.positionInReference = `${m.name} appears in the ${m.role} position`;
  });
  const subsequentPrompts = buildCharacterIdentificationPrompts(mappings, false);
  console.log('📝 Subsequent page prompts:', {
    avatarReferences: subsequentPrompts.avatarReferences.length,
    characterInstructions: subsequentPrompts.characterInstructions.length,
    includesPositionInfo: subsequentPrompts.characterInstructions.some(i => i.includes('appears in the reference image'))
  });

  const assertions = [
    { test: firstPagePrompts.totalAvatarInputs <= 3, description: 'First page should respect 3-image limit' },
    { test: firstPagePrompts.avatarReferences.length > 0, description: 'Should generate avatar references for characters with URLs' },
    { test: subsequentPrompts.characterInstructions.some(i => i.includes('reference image')), description: 'Subsequent prompts should reference positions' }
  ];

  let passed = 0;
  assertions.forEach(({ test, description }, index) => {
    const result = test ? '✅' : '❌';
    console.log(`   ${index + 1}. ${result} ${description}`);
    if (test) passed++;
  });

  console.log(`📈 Prompt building tests: ${passed}/${assertions.length} passed\n`);
  return { passed, total: assertions.length };
}

/**
 * Test reference image context building
 */
export function testReferenceImageContext() {
  console.log('🧪 Testing reference image context building...');
  
  const characterIds = ['1', '2'];
  const mappings = buildCharacterMappings(mockCharacters, characterIds);
  const mockFirstPageImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  const context = buildReferenceImageContext(mockFirstPageImage, mappings);
  
  console.log('📊 Reference context result:', {
    hasReferenceDescription: !!context.referenceDescription,
    characterPositionsCount: Object.keys(context.characterPositionMappings).length,
    mappingsUpdated: mappings.every(m => !!m.positionInReference)
  });

  const assertions = [
    { test: !!context.referenceDescription, description: 'Should generate reference description' },
    { test: Object.keys(context.characterPositionMappings).length === mappings.length, description: 'Should map all characters' },
    { test: mappings.every(m => !!m.positionInReference), description: 'Should update character mappings with positions' },
    { test: context.referenceDescription.includes('page 1'), description: 'Reference description should mention first page' }
  ];

  let passed = 0;
  assertions.forEach(({ test, description }, index) => {
    const result = test ? '✅' : '❌';
    console.log(`   ${index + 1}. ${result} ${description}`);
    if (test) passed++;
  });

  console.log(`📈 Reference context tests: ${passed}/${assertions.length} passed\n`);
  return { passed, total: assertions.length };
}

/**
 * Run all pipeline tests
 */
export function runPipelineTests() {
  console.log('🚀 Running Storybook Pipeline Tests\n');
  
  const results = [
    testCharacterMappings(),
    testCharacterIdentificationPrompts(),
    testReferenceImageContext()
  ];
  
  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
  const totalTests = results.reduce((sum, r) => sum + r.total, 0);
  
  console.log(`🏆 Overall Results: ${totalPassed}/${totalTests} tests passed (${Math.round(totalPassed / totalTests * 100)}%)`);
  
  if (totalPassed === totalTests) {
    console.log('✅ All tests passed! Pipeline implementation is ready.');
  } else {
    console.log('⚠️ Some tests failed. Review implementation before using.');
  }
  
  return { passed: totalPassed, total: totalTests };
}

// Export for use in other files or direct execution
if (require.main === module) {
  runPipelineTests();
}