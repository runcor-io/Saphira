/**
 * Saphira AI - Universal Nigerian Communication Practice Platform
 * Main exports
 */

// Types
export * from './types';

// Configuration
export { 
  USE_CASE_CONFIGS, 
  getUseCaseConfig, 
  getDefaultPanel, 
  getAllUseCases,
  detectUseCase,
} from './useCaseConfigs';

// Cultural Detection
export { 
  detectCulturalContext, 
  analyzeResponse, 
  getEvasionResponse,
  generateCulturalAdaptation,
} from './culturalDetector';

// Response Selection
export { 
  getResponsePattern, 
  selectCulturalResponse, 
  generateFollowUp,
  determineTone,
  selectResponseTemplate,
  buildSystemPrompt,
} from './responseSelector';

// Question Generation
export { 
  generateNextQuestion, 
  generateFeedback,
} from './questionGenerator';

// Dataset Utilities
export { 
  loadDataset, 
  getEntriesByUseCase, 
  getFewShotExamples,
  extractQuestionsByUseCase,
  getSuccessfulPatterns,
  findSimilarResponses,
  getDatasetStats,
} from './datasetUtils';

// Pan-African Dataset Service
export {
  type Country,
  type CountryDataset,
  getDataset,
  getRandomQuestion,
  getToneGuide,
  getRandomFiller,
  getRandomReaction,
  getCulturalContext,
  detectCountry,
} from './datasetService';

// Panel Interaction & Country Support
export {
  getPanelNames,
  getPanelRoles,
  generateCountryPanel,
  generatePanelInteraction,
  shouldAddPanelInteraction,
  generateBriefPanelDiscussion,
} from './panelInteraction';

// Voice Service
export {
  getCountryVoices,
  getVoiceForCountry,
  getVoiceByGender,
  getVoiceForPanelMember,
  getVoiceName,
  migrateVoiceToCountry,
} from './voiceService';

// Personality Engine
export {
  type PersonalityType,
  getPersonalityProfile,
  generatePersonalityPrompt,
  getChallengePhrase,
  getEncouragingPhrase,
  getOpeningPhrase,
  shouldChallengeAnswer,
} from './personalityEngine';

// Panel Engine
export { 
  createSession, 
  startSession, 
  processResponse,
  generateSessionSummary,
  getCurrentPanelMember,
  exportSession,
  importSession,
} from './panelEngine';

// Version
export const SAPHIRA_VERSION = '2.0.0';
