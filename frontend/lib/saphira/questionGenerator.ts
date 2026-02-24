/**
 * Saphira AI - Dynamic Question Generator
 * Uses GPT-4 to generate contextual, culturally-aware questions
 */

import { 
  QuestionGenerationRequest, 
  GeneratedResponse, 
  UseCase,
  CulturalContext,
  ResponseAnalysis 
} from './types';
import { getUseCaseConfig } from './useCaseConfigs';
import { buildSystemPrompt, selectCulturalResponse } from './responseSelector';
import { getFewShotExamples } from './datasetUtils';
import { Country, getRandomQuestion } from './datasetService';

/**
 * Generate next question or response using GPT-4
 */
export async function generateNextQuestion(
  request: QuestionGenerationRequest
): Promise<GeneratedResponse> {
  const {
    useCase,
    jobRole,
    topic,
    currentPanelMember,
    conversationHistory,
    candidateLastResponse,
    previousQuestions,
    culturalContext,
    responseAnalysis,
    personalityPrompt,
    country = 'nigeria',
  } = request;

  // Try to get question from dataset first (for common questions)
  const datasetQuestion = getRandomQuestion(country, 'personality');
  
  // If we have a dataset question and it's early in the conversation, use it
  const conversationLength = conversationHistory.filter(m => m.sender === 'panel-member').length;
  if (datasetQuestion && conversationLength < 3 && Math.random() < 0.5) {
    return {
      text: datasetQuestion,
      isQuestion: true,
      tone: 'professional',
    };
  }

  // Build comprehensive prompt (use personality prompt if provided)
  const systemPrompt = personalityPrompt || buildSystemPrompt(
    useCase,
    currentPanelMember.name,
    currentPanelMember.role,
    currentPanelMember.personality,
    culturalContext,
    country
  );

  // Get few-shot examples from dataset
  const fewShotExamples = await getFewShotExamples(useCase, 5);

  // Build conversation context
  const conversationContext = buildConversationContext(conversationHistory, 3);

  // Detect if we need to address evasiveness
  const evasionResponse = culturalContext.evasiveness.isEvasive
    ? selectCulturalResponse(culturalContext, 'redirect')
    : '';

  // Build user prompt
  const userPrompt = buildUserPrompt({
    useCase,
    jobRole,
    topic,
    candidateLastResponse,
    previousQuestions,
    culturalContext,
    responseAnalysis,
    conversationContext,
    fewShotExamples,
    evasionResponse,
  });

  try {
    // Call GPT-4
    const response = await fetch('/api/saphira/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt,
        userPrompt,
        useCase,
        panelMemberId: currentPanelMember.id,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate question');
    }

    const data = await response.json();
    
    return {
      text: data.text,
      isQuestion: data.isQuestion ?? true,
      suggestedFollowUp: data.suggestedFollowUp,
      culturalAdaptation: data.culturalAdaptation,
      tone: data.tone,
    };

  } catch (error) {
    console.error('[QuestionGenerator] Error:', error);
    
    // Fallback to template-based generation
    return generateFallbackQuestion(request);
  }
}

/**
 * Build user prompt for GPT-4
 */
function buildUserPrompt(params: {
  useCase: UseCase;
  jobRole?: string;
  topic?: string;
  candidateLastResponse: string;
  previousQuestions: string[];
  culturalContext: CulturalContext;
  responseAnalysis: ResponseAnalysis;
  conversationContext: string;
  fewShotExamples: any[];
  evasionResponse: string;
}): string {
  const {
    useCase,
    jobRole,
    topic,
    candidateLastResponse,
    previousQuestions,
    culturalContext,
    responseAnalysis,
    conversationContext,
    fewShotExamples,
    evasionResponse,
  } = params;

  const config = getUseCaseConfig(useCase);

  return `
Use Case: ${config.displayName}
${jobRole ? `Job Role: ${jobRole}` : ''}
${topic ? `Topic: ${topic}` : ''}

Candidate just said: "${candidateLastResponse}"

Previous questions asked: ${previousQuestions.slice(-5).join(', ') || 'None'}

Recent conversation:
${conversationContext}

Cultural Context Analysis:
- Uses Pidgin: ${culturalContext.usesPidgin} ${culturalContext.usesPidgin ? `(${culturalContext.pidginPhrases.join(', ')})` : ''}
- Religious references: ${culturalContext.religiousReferences.length > 0 ? culturalContext.religiousReferences.join(', ') : 'None'}
- Hierarchy markers: ${culturalContext.hierarchyMarkers.length > 0 ? culturalContext.hierarchyMarkers.join(', ') : 'None'}
- Confidence level: ${culturalContext.confidenceLevel}
- Nervousness: ${culturalContext.nervousness}
- Overconfidence: ${culturalContext.overconfidence}
- Evasiveness: ${culturalContext.evasiveness.isEvasive ? `${culturalContext.evasiveness.type} (${culturalContext.evasiveness.confidence})` : 'No'}
- Excessive respect: ${culturalContext.excessiveRespect}

Response Quality Analysis:
- Has specific example: ${responseAnalysis.content.hasSpecificExample}
- Has numbers/metrics: ${responseAnalysis.content.hasNumbers}
- Word count: ${responseAnalysis.content.wordCount}
- Answered directly: ${responseAnalysis.content.answeredDirectly}
- Relevant to question: ${responseAnalysis.content.relevantToQuestion}

${evasionResponse ? `\nEVASION DETECTED - Address this first: "${evasionResponse}"\n` : ''}

Few-shot examples from real Nigerian ${useCase}s:
${fewShotExamples.map((ex, i) => `
Example ${i + 1}:
Context: ${ex.context}
${ex.candidateResponse ? `Candidate: "${ex.candidateResponse}"` : ''}
${ex.interviewerResponse ? `Interviewer: "${ex.interviewerResponse}"` : ''}
`).join('\n')}

INSTRUCTIONS:
1. Generate the next question or response as the interviewer
2. ${culturalContext.evasiveness.isEvasive 
    ? 'Address the evasion directly and firmly, then ask for a specific answer' 
    : 'Dig deeper into one aspect of their answer or ask a follow-up question'}
3. ${culturalContext.usesPidgin 
    ? 'Respond warmly but maintain professionalism (light Pidgin touch is OK)' 
    : 'Use formal Nigerian professional English'}
4. ${culturalContext.religiousReferences.length > 0 
    ? 'Acknowledge religious reference briefly, then redirect to professional matters' 
    : ''}
5. ${culturalContext.nervousness 
    ? 'Use encouraging tone to build confidence' 
    : culturalContext.overconfidence 
      ? 'Challenge with a specific follow-up to test depth' 
      : ''}
6. Avoid questions similar to these already asked: ${previousQuestions.slice(-3).join(', ') || 'N/A'}
7. ${responseAnalysis.content.hasSpecificExample && !responseAnalysis.content.hasNumbers 
    ? 'Ask for specific numbers or metrics' 
    : !responseAnalysis.content.hasSpecificExample 
      ? 'Ask for a specific example with details' 
      : ''}

Respond with a JSON object:
{
  "text": "Your response as the interviewer (1-3 sentences)",
  "isQuestion": true,
  "suggestedFollowUp": "What to ask next if they give a good answer",
  "culturalAdaptation": "What cultural consideration you applied",
  "tone": "encouraging|challenging|neutral|warm"
}
`;
}

/**
 * Build conversation context from history
 */
function buildConversationContext(
  history: any[],
  maxMessages: number = 3
): string {
  const recentMessages = history.slice(-maxMessages);
  
  return recentMessages.map(msg => {
    const speaker = msg.sender === 'candidate' ? 'Candidate' : 'Interviewer';
    return `${speaker}: "${msg.text}"`;
  }).join('\n');
}

/**
 * Generate fallback question if GPT-4 fails
 */
function generateFallbackQuestion(
  request: QuestionGenerationRequest
): GeneratedResponse {
  const { useCase, culturalContext, previousQuestions, jobRole } = request;
  
  // Template-based fallback questions by use case
  const fallbacks: Record<UseCase, string[]> = {
    job_interview: [
      `Tell me more about your experience with ${jobRole || 'this field'}.`,
      `What challenges have you faced as a ${jobRole || 'professional'}?`,
      `How do you stay current with developments in ${jobRole || 'your industry'}?`,
      `Describe a project you're particularly proud of.`,
    ],
    embassy_interview: [
      `What ties do you have to Nigeria that will ensure your return?`,
      `Who is funding this trip and what is your relationship to them?`,
      `What will you do after completing your studies?`,
      `Have you traveled abroad before?`,
    ],
    scholarship_interview: [
      `How will this scholarship help you achieve your goals?`,
      `Tell us about your leadership experience.`,
      `How do you plan to give back to your community?`,
      `What sets you apart from other applicants?`,
    ],
    business_pitch: [
      `What is your customer acquisition strategy?`,
      `Who are your main competitors and how do you differentiate?`,
      `What is your monthly burn rate and runway?`,
      `Tell me about your team's background.`,
    ],
    academic_presentation: [
      `What is your main contribution to knowledge in this field?`,
      `How does your methodology address potential biases?`,
      `What are the practical implications of your findings?`,
      `How would you extend this research in the future?`,
    ],
    board_presentation: [
      `What is the projected ROI over 3 years?`,
      `What are the key risks and mitigation strategies?`,
      `How does this align with our strategic objectives?`,
      `What resources will this require?`,
    ],
    conference: [
      `What is the key takeaway for the audience?`,
      `How does this compare to previous approaches?`,
      `What are the limitations of this work?`,
    ],
    exhibition: [
      `What makes your product unique?`,
      `Who are your current customers?`,
      `What is your pricing model?`,
    ],
    media_interview: [
      `How do you respond to criticisms about this issue?`,
      `What is your vision for the next 5 years?`,
      `Why should the public trust you on this?`,
    ],
  };
  
  const useCaseFallbacks = fallbacks[useCase] || fallbacks.job_interview;
  
  // Cycle through based on previous questions count
  const index = previousQuestions.length % useCaseFallbacks.length;
  let question = useCaseFallbacks[index];
  
  // Add cultural adaptation
  let tone = 'neutral';
  
  if (culturalContext.nervousness) {
    question = "Don't worry, take your time. " + question;
    tone = 'encouraging';
  } else if (culturalContext.overconfidence) {
    question = "Let me push you on that. " + question;
    tone = 'challenging';
  }
  
  if (culturalContext.evasiveness.isEvasive) {
    question = "Let me stop you there. You didn't answer my question directly. " + question;
    tone = 'challenging';
  }
  
  return {
    text: question,
    isQuestion: true,
    culturalAdaptation: culturalContext.usesPidgin ? 'Acknowledged Pidgin, maintained professionalism' : '',
    tone,
  };
}

/**
 * Generate feedback for candidate response
 */
export async function generateFeedback(
  question: string,
  candidateResponse: string,
  useCase: UseCase,
  jobRole?: string,
  culturalContext?: CulturalContext
): Promise<{
  score: number;
  rating: string;
  strengths: string[];
  improvements: string[];
  suggestedAnswer: string;
  culturalNotes?: string;
  panelMemberSatisfied: boolean;
}> {
  const config = getUseCaseConfig(useCase);
  
  const prompt = `
You are evaluating a candidate's response in a ${config.displayName}.

Question: "${question}"

Candidate's Answer: "${candidateResponse}"

${jobRole ? `Job Role: ${jobRole}` : ''}

${culturalContext ? `
Cultural Context:
- Uses Pidgin: ${culturalContext.usesPidgin}
- Religious references: ${culturalContext.religiousReferences.length > 0}
- Confidence level: ${culturalContext.confidenceLevel}
- Evasiveness: ${culturalContext.evasiveness.isEvasive}
` : ''}

Evaluate based on:
1. Relevance to the question
2. Specificity (examples, numbers)
3. Clarity of communication
4. Professional tone
5. Cultural appropriateness for Nigerian context

Provide a JSON response:
{
  "score": <number 1-10>,
  "rating": "Excellent|Good|Average|Needs Improvement|Poor",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "suggestedAnswer": "A model answer the candidate could give",
  "culturalNotes": "How well they handled Nigerian cultural context"
}
`;

  try {
    const response = await fetch('/api/saphira/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, useCase }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate feedback');
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('[QuestionGenerator] Feedback error:', error);
    
    // Fallback feedback
    return generateFallbackFeedback(candidateResponse, culturalContext);
  }
}

/**
 * Generate fallback feedback
 */
function generateFallbackFeedback(
  response: string,
  culturalContext?: CulturalContext
): {
  score: number;
  rating: string;
  strengths: string[];
  improvements: string[];
  suggestedAnswer: string;
  culturalNotes?: string;
  panelMemberSatisfied: boolean;
} {
  const wordCount = response.split(/\s+/).length;
  const hasNumbers = /\d+/.test(response);
  const hasExample = /\b(i\s+(led|managed|created|built))\b/i.test(response);
  
  let score = 5;
  const strengths: string[] = [];
  const improvements: string[] = [];
  
  if (wordCount > 50) {
    strengths.push('Provided detailed response');
    score += 1;
  } else {
    improvements.push('Provide more detail in your answers');
    score -= 1;
  }
  
  if (hasNumbers) {
    strengths.push('Used specific numbers/metrics');
    score += 2;
  } else {
    improvements.push('Include specific numbers when possible');
  }
  
  if (hasExample) {
    strengths.push('Gave specific examples');
    score += 1;
  } else {
    improvements.push('Use concrete examples to illustrate your points');
  }
  
  if (culturalContext?.evasiveness.isEvasive) {
    improvements.push('Answer questions more directly');
    score -= 2;
  }
  
  score = Math.max(1, Math.min(10, score));
  
  const rating = score >= 8 ? 'Good' : score >= 6 ? 'Average' : 'Needs Improvement';
  
  return {
    score,
    rating,
    strengths,
    improvements,
    suggestedAnswer: 'A strong answer would include specific examples with numbers, be concise (1-2 minutes), and directly address the question asked.',
    culturalNotes: culturalContext?.usesPidgin 
      ? 'Using Pidgin shows authenticity but ensure professional clarity' 
      : undefined,
    panelMemberSatisfied: score >= 6,
  };
}

export default {
  generateNextQuestion,
  generateFeedback,
};
