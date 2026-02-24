/**
 * Saphira AI - Universal Panel Engine
 * Orchestrates dynamic panel interactions across all use cases
 * Enhanced with: Opening Phase, Human Reactions, Panel Interactions, Natural Pacing
 */

import {
  SaphiraSession,
  SaphiraMessage,
  PanelMember,
  UseCase,
  CulturalContext,
  ResponseAnalysis,
  SessionSummary,
  QuestionFeedback,
} from './types';
import { getUseCaseConfig, getDefaultPanel } from './useCaseConfigs';
import { analyzeResponse, generateCulturalAdaptation } from './culturalDetector';
import { generateNextQuestion, generateFeedback } from './questionGenerator';
import { generateHumanReaction, getReactionDelay, clearReactionHistory } from './humanReactionService';
import { generatePanelInteraction, shouldAddPanelInteraction, generateBriefPanelDiscussion } from './panelInteraction';
import { generatePersonalityPrompt, getOpeningPhrase, getChallengePhrase } from './personalityEngine';

/**
 * Create a new Saphira session
 */
export function createSession(
  useCase: UseCase,
  options?: {
    topic?: string;
    jobRole?: string;
    company?: string;
    customPanel?: PanelMember[];
    maxQuestions?: number;
    country?: 'nigeria' | 'kenya' | 'south_africa';
  }
): SaphiraSession {
  const config = getUseCaseConfig(useCase);
  const panel = options?.customPanel || getDefaultPanel(useCase);
  
  return {
    id: generateSessionId(),
    useCase,
    topic: options?.topic,
    company: options?.company,
    country: options?.country || 'nigeria',
    panel,
    currentPanelIndex: 0,
    questionCount: 0,
    maxQuestions: options?.maxQuestions || config.maxQuestions,
    messages: [],
    questionsAsked: [],
    culturalContexts: [],
    status: 'configuring',
    startTime: new Date(),
  };
}

/**
 * Generate panel introduction messages with Opening Comfort Phase
 * Proper interview start: intros → thank you → introduce yourself
 */
function generatePanelIntroductions(session: SaphiraSession): SaphiraMessage[] {
  const messages: SaphiraMessage[] = [];
  
  // === PHASE 1: Panel Introductions ===
  session.panel.forEach((member, index) => {
    let introText = '';
    
    if (index === 0) {
      // First panelist leads with personality-specific opening
      const openingPhrase = getOpeningPhrase(member);
      
      switch (session.useCase) {
        case 'job_interview':
          introText = `Good morning. ${openingPhrase} My name is ${member.name}, ${member.role}. I'll be leading your interview today${session.company ? ' at ' + session.company : ''}.`;
          break;
        case 'embassy_interview':
          introText = `Good morning. I'm ${member.name}, ${member.role}. Please have your passport and documents ready.`;
          break;
        case 'scholarship_interview':
          introText = `Good morning. Welcome to the scholarship interview. I'm ${member.name}, ${member.role}, and I'll be chairing this panel.`;
          break;
        case 'business_pitch':
          introText = `Good morning. You have ${session.maxQuestions} minutes for your pitch. I'm ${member.name}, ${member.role}.`;
          break;
        case 'board_presentation':
          introText = `Good morning. Thank you for joining us today. I'm ${member.name}, ${member.role}. We have limited time, so please be concise.`;
          break;
        default:
          introText = `Good morning. ${openingPhrase} I'm ${member.name}, ${member.role}.`;
      }
    } else {
      // Other panelists introduce themselves briefly
      introText = `I'm ${member.name}, ${member.role}.`;
    }
    
    messages.push({
      id: generateMessageId(),
      sender: 'panel-member',
      panelMemberId: member.id,
      text: introText,
      timestamp: new Date(),
      isQuestion: false,
    });
  });
  
  // === PHASE 2: Opening Comfort Phase ===
  // Add transition message before first question
  const firstMember = session.panel[0];
  let comfortMessage = '';
  
  switch (session.useCase) {
    case 'job_interview':
      comfortMessage = `Alright, thank you for joining us today.`;
      break;
    case 'embassy_interview':
      comfortMessage = `Alright. Let's proceed with the interview.`;
      break;
    case 'scholarship_interview':
      comfortMessage = `Thank you for coming. We appreciate your interest.`;
      break;
    case 'business_pitch':
      comfortMessage = `Alright. We're ready to hear your pitch.`;
      break;
    case 'board_presentation':
      comfortMessage = `Alright. Let's hear what you have for us.`;
      break;
    default:
      comfortMessage = `Alright. Let's begin.`;
  }
  
  messages.push({
    id: generateMessageId(),
    sender: 'panel-member',
    panelMemberId: firstMember.id,
    text: comfortMessage,
    timestamp: new Date(),
    isQuestion: false,
    isOpeningPhase: true,
  });
  
  // === PHASE 3: Opening Question (NOT technical) ===
  let openingQuestion = '';
  
  switch (session.useCase) {
    case 'job_interview':
      openingQuestion = `Please start by introducing yourself.`;
      break;
    case 'embassy_interview':
      openingQuestion = `Please introduce yourself and state the purpose of your trip.`;
      break;
    case 'scholarship_interview':
      openingQuestion = `Please introduce yourself and tell us briefly about your academic background.`;
      break;
    case 'business_pitch':
      openingQuestion = `Please start by telling us about yourself and your team.`;
      break;
    case 'academic_presentation':
      openingQuestion = `Please begin with a brief introduction of yourself and your research area.`;
      break;
    case 'board_presentation':
      openingQuestion = `Please introduce yourself and your role in this proposal.`;
      break;
    default:
      openingQuestion = `Please introduce yourself.`;
  }
  
  messages.push({
    id: generateMessageId(),
    sender: 'panel-member',
    panelMemberId: firstMember.id,
    text: openingQuestion,
    timestamp: new Date(),
    isQuestion: true,
    isOpeningPhase: true,
  });
  
  return messages;
}

/**
 * Start the session - returns opening messages with all panel introductions
 */
export async function startSession(
  session: SaphiraSession
): Promise<{ messages: SaphiraMessage[]; updatedSession: SaphiraSession }> {
  const introMessages = generatePanelIntroductions(session);
  
  const updatedSession: SaphiraSession = {
    ...session,
    status: 'in_progress',
    messages: introMessages,
    questionsAsked: [extractQuestion(introMessages[introMessages.length - 1].text)],
  };
  
  return { messages: introMessages, updatedSession };
}

/**
 * Process candidate response with Human Reactions + Panel Interactions + Natural Pacing
 */
export async function processResponse(
  session: SaphiraSession,
  candidateResponse: string
): Promise<{
  feedback?: QuestionFeedback;
  responseMessage: SaphiraMessage;
  updatedSession: SaphiraSession;
  isComplete?: boolean;
  // New: Additional messages for reactions/interactions
  reactionMessage?: SaphiraMessage;
  panelInteractionMessage?: SaphiraMessage;
  // New: Timing delays for natural pacing
  reactionDelay?: number;
  thinkingDelay?: number;
}> {
  // Analyze response
  const lastQuestion = getLastQuestion(session);
  const responseAnalysis = analyzeResponse(candidateResponse, lastQuestion);
  const culturalContext = responseAnalysis.cultural;
  
  // Store cultural context
  const updatedCulturalContexts = [...session.culturalContexts, culturalContext];
  
  // Create candidate message
  const candidateMessage: SaphiraMessage = {
    id: generateMessageId(),
    sender: 'candidate',
    text: candidateResponse,
    timestamp: new Date(),
    isQuestion: false,
    culturalContext,
  };
  
  // Check if interview should end
  if (session.questionCount >= session.maxQuestions - 1) {
    const closingMessage = generateClosingMessage(session);
    
    const updatedSession: SaphiraSession = {
      ...session,
      messages: [...session.messages, candidateMessage, closingMessage],
      culturalContexts: updatedCulturalContexts,
      status: 'completed',
    };
    
    // Clear reaction history at end
    clearReactionHistory();
    
    return {
      responseMessage: closingMessage,
      updatedSession,
      isComplete: true,
    };
  }
  
  // Get current and next panel members
  const currentPanelMember = session.panel[session.currentPanelIndex];
  const nextPanelIndex = (session.currentPanelIndex + 1) % session.panel.length;
  const nextPanelMember = session.panel[nextPanelIndex];
  
  // Generate feedback for the answer
  const feedback = await generateFeedback(
    lastQuestion,
    candidateResponse,
    session.useCase,
    session.topic,
    culturalContext
  );
  
  // === STEP 1: Generate Human Reaction (70% probability) ===
  const reactionResult = generateHumanReaction({
    panelist: nextPanelMember,
    candidateAnswer: candidateResponse,
    conversationTurn: session.questionCount,
  });
  
  let reactionMessage: SaphiraMessage | undefined;
  let reactionDelay = 0;
  
  if (reactionResult.shouldAddReaction && reactionResult.reaction) {
    reactionMessage = {
      id: generateMessageId(),
      sender: 'panel-member',
      panelMemberId: nextPanelMember.id,
      text: reactionResult.reaction,
      timestamp: new Date(),
      isQuestion: false,
      isReaction: true,
    };
    reactionDelay = getReactionDelay();
  }
  
  // === STEP 2: Generate Panel Interaction (25% to candidate, 15% to panelist) ===
  const panelInteractionResult = generatePanelInteraction({
    candidateAnswer: candidateResponse,
    previousPanelist: currentPanelMember,
    nextPanelist: nextPanelMember,
    conversationHistory: session.messages,
  });
  
  let panelInteractionMessage: SaphiraMessage | undefined;
  
  // If we have a panel interaction that's different from human reaction
  if (panelInteractionResult.reactionLine && !reactionMessage) {
    panelInteractionMessage = {
      id: generateMessageId(),
      sender: 'panel-member',
      panelMemberId: nextPanelMember.id,
      text: panelInteractionResult.reactionLine,
      timestamp: new Date(),
      isQuestion: false,
      isPanelInteraction: true,
      reactionTarget: panelInteractionResult.reactionTarget,
    };
    reactionDelay = getReactionDelay();
  }
  
  // === STEP 3: Generate Next Question with Personality & Country ===
  const personalityPrompt = generatePersonalityPrompt(nextPanelMember, session.country);
  
  const generatedResponse = await generateNextQuestion({
    useCase: session.useCase,
    jobRole: session.topic,
    topic: session.topic,
    currentPanelMember: nextPanelMember,
    conversationHistory: session.messages,
    candidateLastResponse: candidateResponse,
    previousQuestions: session.questionsAsked,
    culturalContext,
    responseAnalysis,
    personalityPrompt, // NEW: Pass personality context
    country: session.country, // NEW: Pass country for cultural adaptation
  });
  
  // === STEP 4: Add Thinking Delay (natural pacing) ===
  const thinkingDelay = Math.floor(Math.random() * 700) + 800; // 800ms - 1500ms
  
  // Create response message
  const responseMessage: SaphiraMessage = {
    id: generateMessageId(),
    sender: 'panel-member',
    panelMemberId: nextPanelMember.id,
    text: generatedResponse.text,
    timestamp: new Date(),
    isQuestion: generatedResponse.isQuestion,
    feedback,
  };
  
  // Build messages array
  const allMessages: SaphiraMessage[] = [candidateMessage];
  if (reactionMessage) allMessages.push(reactionMessage);
  if (panelInteractionMessage) allMessages.push(panelInteractionMessage);
  allMessages.push(responseMessage);
  
  // Update session
  const updatedSession: SaphiraSession = {
    ...session,
    messages: [...session.messages, ...allMessages],
    currentPanelIndex: nextPanelIndex,
    questionCount: session.questionCount + 1,
    questionsAsked: [...session.questionsAsked, extractQuestion(generatedResponse.text)],
    culturalContexts: updatedCulturalContexts,
  };
  
  return {
    feedback,
    responseMessage,
    updatedSession,
    isComplete: false,
    reactionMessage,
    panelInteractionMessage,
    reactionDelay,
    thinkingDelay,
  };
}

/**
 * Generate closing message based on use case
 */
function generateClosingMessage(session: SaphiraSession): SaphiraMessage {
  const config = getUseCaseConfig(session.useCase);
  const currentPanelMember = session.panel[session.currentPanelIndex];
  
  let closingText = '';
  
  switch (session.useCase) {
    case 'job_interview':
      closingText = `Thank you for your time today. That brings us to the end of the interview. Do you have any questions for me about the role or ${session.company || 'the company'}?`;
      break;
      
    case 'embassy_interview':
      closingText = "Your application is under review. You'll be notified of the decision within 5 business days. Next applicant, please.";
      break;
      
    case 'scholarship_interview':
      closingText = "Thank you for presenting your case. The committee will review all applications and notify successful candidates within two weeks. We wish you the best.";
      break;
      
    case 'business_pitch':
      closingText = "Thank you for the presentation. We'll discuss internally and get back to you. Please send your detailed financial projections to our office.";
      break;
      
    case 'academic_presentation':
      closingText = "Thank you for your presentation. The panel will now deliberate. You may wait outside.";
      break;
      
    case 'board_presentation':
      closingText = "Thank you. The board will discuss this proposal. We'll communicate our decision by end of week.";
      break;
      
    default:
      closingText = "Thank you for your time. That concludes our session.";
  }
  
  return {
    id: generateMessageId(),
    sender: 'panel-member',
    panelMemberId: currentPanelMember.id,
    text: closingText,
    timestamp: new Date(),
    isQuestion: session.useCase === 'job_interview', // Only job interview asks for questions
  };
}

/**
 * Generate session summary
 */
export function generateSessionSummary(session: SaphiraSession): SessionSummary {
  const feedbacks = session.messages
    .filter(m => m.feedback)
    .map(m => m.feedback!);
  
  const averageScore = feedbacks.length > 0
    ? Math.round(feedbacks.reduce((sum, f) => sum + f.score, 0) / feedbacks.length)
    : 5;
  
  // Generate overall rating
  const rating = averageScore >= 8 ? 'Excellent' :
                 averageScore >= 6 ? 'Good' :
                 averageScore >= 4 ? 'Average' : 'Needs Improvement';
  
  // Generate recommendation
  const recommendation = averageScore >= 8 ? 'Strongly Recommend' :
                        averageScore >= 6 ? 'Recommend' :
                        averageScore >= 4 ? 'Consider with Reservations' : 'Not Recommended';
  
  // Collect key strengths
  const allStrengths = feedbacks.flatMap(f => f.strengths);
  const keyStrengths = Array.from(new Set(allStrengths)).slice(0, 3);
  
  // Collect areas to improve
  const allImprovements = feedbacks.flatMap(f => f.improvements);
  const areasToImprove = Array.from(new Set(allImprovements)).slice(0, 3);
  
  // Assess cultural adaptability
  const culturalScore = assessCulturalAdaptability(session.culturalContexts);
  
  // Calculate duration
  const duration = Math.round((new Date().getTime() - session.startTime.getTime()) / 60000);
  
  // Collect panel feedback
  const panelFeedback: Record<string, string> = {};
  session.panel.forEach(member => {
    const memberFeedback = feedbacks.find(f => 
      session.messages.some(m => 
        m.panelMemberId === member.id && m.feedback === f
      )
    );
    if (memberFeedback) {
      panelFeedback[member.name] = `${memberFeedback.rating} - ${memberFeedback.strengths[0] || 'No specific feedback'}`;
    }
  });
  
  return {
    overallScore: averageScore,
    overallRating: rating,
    recommendation,
    keyStrengths,
    areasToImprove,
    culturalAdaptability: culturalScore,
    duration,
    questionsAnswered: session.questionCount,
    panelFeedback,
  };
}

/**
 * Assess cultural adaptability based on interactions
 */
function assessCulturalAdaptability(contexts: CulturalContext[]): string {
  if (contexts.length === 0) return 'Not assessed';
  
  let score = 5;
  
  contexts.forEach(ctx => {
    if (ctx.usesPidgin && !ctx.excessiveRespect) score += 1;
    if (!ctx.nervousness) score += 1;
    if (!ctx.evasiveness.isEvasive) score += 1;
    if (ctx.confidenceLevel === 'high') score += 1;
    if (ctx.religiousReferences.length > 0 && !ctx.excessiveRespect) score += 0.5;
  });
  
  const averageScore = score / contexts.length;
  
  if (averageScore >= 7) return 'Excellent - Natural and confident in Nigerian professional context';
  if (averageScore >= 5) return 'Good - Comfortable with cultural norms';
  if (averageScore >= 3) return 'Average - Some awareness of cultural context';
  return 'Needs Development - Work on cultural fluency';
}

/**
 * Get current panel member
 */
export function getCurrentPanelMember(session: SaphiraSession): PanelMember {
  return session.panel[session.currentPanelIndex];
}

/**
 * Get last question asked
 */
function getLastQuestion(session: SaphiraSession): string {
  const lastInterviewerMsg = [...session.messages]
    .reverse()
    .find(m => m.sender === 'panel-member' && m.isQuestion);
  
  return lastInterviewerMsg?.text || '';
}

/**
 * Extract question text from message
 */
function extractQuestion(text: string): string {
  // Simple extraction - take first sentence or up to question mark
  const questionMatch = text.match(/[^.!?]*\?/);
  if (questionMatch) {
    return questionMatch[0].trim();
  }
  
  // If no question mark, take first sentence
  const firstSentence = text.split(/[.!?]/)[0];
  return firstSentence.trim();
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Export session to JSON
 */
export function exportSession(session: SaphiraSession): string {
  return JSON.stringify(session, null, 2);
}

/**
 * Import session from JSON
 */
export function importSession(json: string): SaphiraSession {
  return JSON.parse(json);
}

export default {
  createSession,
  startSession,
  processResponse,
  generateSessionSummary,
  getCurrentPanelMember,
  exportSession,
  importSession,
};
