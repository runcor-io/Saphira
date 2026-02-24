/**
 * Saphira AI - Core Type Definitions
 * Universal Nigerian Communication Practice Platform
 */

// Use case definitions based on filtered dataset
export type UseCase = 
  | 'job_interview' 
  | 'embassy_interview' 
  | 'scholarship_interview' 
  | 'business_pitch' 
  | 'academic_presentation'
  | 'board_presentation'
  | 'conference'
  | 'exhibition'
  | 'media_interview';

// Panel member personality types
export type PanelPersonality = 'strict' | 'supportive' | 'skeptical' | 'technical' | 'direct' | 'analytical' | 'executive';

// Formality levels
export type FormalityLevel = 'formal' | 'semi_formal' | 'informal';
export type DirectnessLevel = 'high' | 'medium' | 'low';

// Evasion types
export type EvasionType = 'circular_story' | 'vague_generalities' | 'excessive_context' | 'none';

// Confidence levels
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Dynamic Panel Member Configuration
 */
export interface PanelMember {
  id: string;
  name: string;
  role: string; // "CEO", "Visa Officer", "Department Head", etc.
  personality: PanelPersonality;
  voiceId?: string; // ElevenLabs voice ID
  focus?: string; // Specific focus area for questions
  gender?: 'male' | 'female';
}

/**
 * Use Case Configuration
 */
export interface UseCaseConfig {
  id: UseCase;
  displayName: string;
  description: string;
  formalityLevel: FormalityLevel;
  directnessLevel: DirectnessLevel;
  expectedDuration: number; // minutes
  minQuestions: number;
  maxQuestions: number;
  keyQuestions: string[];
  culturalMarkers: string[];
  defaultPanel: PanelMember[];
  icon: string; // Lucide icon name
}

/**
 * Cultural Context Detection Results
 */
export interface CulturalContext {
  usesPidgin: boolean;
  pidginPhrases: string[];
  religiousReferences: string[];
  hierarchyMarkers: string[]; // "sir", "ma", "with respect"
  familyObligations: boolean;
  mentionsGod: boolean;
  confidenceLevel: ConfidenceLevel;
  nervousness: boolean;
  overconfidence: boolean;
  evasiveness: {
    isEvasive: boolean;
    type: EvasionType;
    confidence: number;
  };
  excessiveRespect: boolean; // Too many "sir/ma"
}

/**
 * Response Analysis
 */
export interface ResponseAnalysis {
  cultural: CulturalContext;
  content: {
    hasSpecificExample: boolean;
    hasNumbers: boolean;
    wordCount: number;
    answeredDirectly: boolean;
    technicalJargon: boolean;
    relevantToQuestion: boolean;
  };
  tone: {
    defensive: boolean;
    apologetic: boolean;
    enthusiastic: boolean;
  };
}

/**
 * Interview/Presentation State
 */
export interface SaphiraSession {
  id: string;
  useCase: UseCase;
  topic?: string; // Job role, business idea, etc.
  company?: string; // For job interviews
  country: 'nigeria' | 'kenya' | 'south_africa'; // Country for cultural context
  panel: PanelMember[];
  currentPanelIndex: number;
  questionCount: number;
  maxQuestions: number;
  messages: SaphiraMessage[];
  questionsAsked: string[];
  culturalContexts: CulturalContext[];
  status: 'configuring' | 'in_progress' | 'completed';
  startTime: Date;
}

/**
 * Message in conversation
 */
export interface SaphiraMessage {
  id: string;
  sender: 'interviewer' | 'candidate' | 'panel-member';
  panelMemberId?: string; // If from specific panel member
  text: string;
  timestamp: Date;
  isQuestion: boolean;
  culturalContext?: CulturalContext; // For candidate messages
  feedback?: QuestionFeedback;
  // Enhanced interaction fields
  isReaction?: boolean; // Micro-reaction ("I see", "Alright")
  isPanelInteraction?: boolean; // Panelist reacting to another panelist
  isOpeningPhase?: boolean; // Part of opening comfort phase
  reactionTarget?: 'candidate' | 'panelist' | null; // Who is being reacted to
}

/**
 * Feedback for a question-answer pair
 */
export interface QuestionFeedback {
  score: number; // 1-10
  rating: string; // "Excellent", "Good", "Average", "Needs Improvement"
  strengths: string[];
  improvements: string[];
  suggestedAnswer: string;
  panelMemberSatisfied: boolean;
  culturalNotes?: string; // How well they handled Nigerian context
}

/**
 * Session Summary
 */
export interface SessionSummary {
  overallScore: number;
  overallRating: string;
  recommendation: string;
  keyStrengths: string[];
  areasToImprove: string[];
  culturalAdaptability: string;
  duration: number;
  questionsAnswered: number;
  panelFeedback: Record<string, string>; // Per panel member
}

/**
 * Dataset Entry (from saphira_filtered_dataset)
 */
export interface DatasetEntry {
  id: string;
  use_case: UseCase;
  speaker: 'candidate' | 'interviewer' | 'advisor' | 'audience';
  text: string;
  context_type?: string;
  communication_patterns?: string[];
  scenario_details?: {
    outcome?: 'success' | 'failure' | 'neutral';
    visa_type?: string;
    university?: string;
    company?: string;
  };
}

/**
 * Few-shot example for GPT-4 prompts
 */
export interface FewShotExample {
  context: string;
  candidateResponse: string;
  interviewerResponse: string;
  explanation?: string;
}

/**
 * Response Template Selection
 */
export interface ResponseTemplate {
  id: string;
  useCase: UseCase;
  trigger: string; // Condition for using this template
  patterns: string[];
  tone: string;
  formality: FormalityLevel;
}

/**
 * Dynamic Question Generation Request
 */
export interface QuestionGenerationRequest {
  useCase: UseCase;
  jobRole?: string;
  topic?: string;
  currentPanelMember: PanelMember;
  conversationHistory: SaphiraMessage[];
  candidateLastResponse: string;
  previousQuestions: string[];
  culturalContext: CulturalContext;
  responseAnalysis: ResponseAnalysis;
  personalityPrompt?: string; // Personality-specific system prompt
  country?: 'nigeria' | 'kenya' | 'south_africa'; // Country for cultural adaptation
}

/**
 * GPT-4 Response Structure
 */
export interface GeneratedResponse {
  text: string;
  isQuestion: boolean;
  suggestedFollowUp?: string;
  culturalAdaptation?: string;
  tone: string;
}
