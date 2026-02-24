/**
 * Interview Flow State Machine
 * Manages the structured conversational interview flow with role-specific questions and GPT-4 follow-ups
 */

import { InterviewMemory, createMemory, updateMemory } from './interviewMemory';

export enum InterviewStage {
  INTRODUCTION = 'INTRODUCTION',
  RAPPORT = 'RAPPORT',
  BACKGROUND = 'BACKGROUND',
  BEHAVIORAL = 'BEHAVIORAL',
  TECHNICAL = 'TECHNICAL',
  CLOSING = 'CLOSING',
  COMPLETE = 'COMPLETE',
}

export interface InterviewContext {
  stage: InterviewStage;
  jobRole: string;
  company: string;
  candidateName: string;
  interviewerName: string;
  interviewerGender: 'male' | 'female';
  memory: InterviewMemory;
  questionCount: number;
  maxQuestions: number;
  questionsAsked: string[];
  useAIFollowUp: boolean; // Enable GPT-4 follow-ups
}

export interface InterviewerMessage {
  text: string;
  stage: InterviewStage;
  isQuestion: boolean;
  nextStage?: InterviewStage;
  isAIGenerated?: boolean;
}

// Nigerian interviewer names
const NIGERIAN_NAMES = {
  male: ['Tunde', 'Ibrahim', 'Bayo', 'Emeka', 'Chidi'],
  female: ['Chioma', 'Aisha', 'Ngozi', 'Funmi', 'Amaka'],
};

// Voice IDs mapped to names
const NIGERIAN_VOICES: Record<string, string> = {
  Tunde: 'tj0Lij6AHHeCO5FylYzu', // Authoritative male
  Ibrahim: '77aEIu0qStu8Jwv1EdhX',
  Bayo: '9hEb6p6ZCFsloAWErEvE',
  Emeka: 'U7wWSnxIJwCjioxt86mk',
  Chidi: '77aEIu0qStu8Jwv1EdhX',
  Chioma: 'Y4Xi1YBz9HedbrvzwylK', // Nigerian female
  Aisha: 'Y4Xi1YBz9HedbrvzwylK', // Nigerian female
  Ngozi: 'Y4Xi1YBz9HedbrvzwylK', // Nigerian female
  Funmi: 'Y4Xi1YBz9HedbrvzwylK', // Nigerian female
  Amaka: 'Y4Xi1YBz9HedbrvzwylK', // Nigerian female
};

// Static question banks as fallback
const ROLE_QUESTIONS: Record<string, Record<string, string[]>> = {
  accounting: {
    background: [
      'Tell me about your experience with financial statement preparation.',
      'Walk me through your experience with bank reconciliations.',
      'What accounting software are you proficient in?',
    ],
    behavioral: [
      'Tell me about a time you explained complex financial information to a non-accountant.',
      'Describe meeting a tight deadline for financial reporting.',
    ],
  },
  banking: {
    background: [
      'What experience do you have with customer financial data?',
      'Describe any experience with risk assessment.',
    ],
    behavioral: [
      'Tell me about handling a difficult customer complaint.',
      'How do you ensure accuracy with large cash transactions?',
    ],
  },
  software: {
    background: [
      'Walk me through your most complex technical project.',
      'What programming languages do you specialize in?',
    ],
    behavioral: [
      'Describe a technical disagreement with a teammate.',
      'Tell me about learning a new technology quickly.',
    ],
  },
  default: {
    background: [
      'Tell me about your work experience.',
      'Walk me through your professional journey.',
    ],
    behavioral: [
      'Tell me about a challenging situation.',
      'How do you handle tight deadlines?',
    ],
  },
};

/**
 * Detect job role category
 */
function detectRoleCategory(jobRole: string): string {
  const lower = jobRole.toLowerCase();
  if (lower.includes('account') || lower.includes('audit') || lower.includes('finance')) return 'accounting';
  if (lower.includes('bank') || lower.includes('credit') || lower.includes('teller')) return 'banking';
  if (lower.includes('software') || lower.includes('developer') || lower.includes('engineer')) return 'software';
  return 'default';
}

/**
 * Create initial interview context
 */
export function createInterviewContext(
  jobRole: string,
  company: string
): InterviewContext {
  const isMale = Math.random() > 0.5;
  const names = isMale ? NIGERIAN_NAMES.male : NIGERIAN_NAMES.female;
  const interviewerName = names[Math.floor(Math.random() * names.length)];
  
  return {
    stage: InterviewStage.INTRODUCTION,
    jobRole,
    company,
    candidateName: '',
    interviewerName,
    interviewerGender: isMale ? 'male' : 'female',
    memory: createMemory(),
    questionCount: 0,
    maxQuestions: 8,
    questionsAsked: [],
    useAIFollowUp: true, // Enable AI follow-ups by default
  };
}

/**
 * Get voice ID for interviewer
 */
export function getInterviewerVoiceId(context: InterviewContext): string {
  return NIGERIAN_VOICES[context.interviewerName] || NIGERIAN_VOICES.Tunde;
}

/**
 * Generate question hash for duplicate detection
 */
function getQuestionHash(question: string): string {
  return question.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
}

function wasQuestionAsked(context: InterviewContext, question: string): boolean {
  return context.questionsAsked.includes(getQuestionHash(question));
}

function markQuestionAsked(context: InterviewContext, question: string): InterviewContext {
  return {
    ...context,
    questionsAsked: [...context.questionsAsked, getQuestionHash(question)],
  };
}

/**
 * Generate intelligent follow-up using GPT-4
 */
async function generateAIFollowUp(
  context: InterviewContext,
  candidateAnswer: string
): Promise<{ response: string; error?: string }> {
  try {
    const response = await fetch('/api/interview/followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateAnswer,
        jobRole: context.jobRole,
        company: context.company,
        interviewerName: context.interviewerName,
        candidateName: context.candidateName,
        previousQuestions: context.questionsAsked.slice(-5),
        stage: context.stage,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate follow-up');
    }

    const data = await response.json();
    return { response: data.fullResponse };

  } catch (error: any) {
    console.error('[AI Follow-up] Error:', error);
    return { response: '', error: error.message };
  }
}

/**
 * Get static fallback question
 */
function getStaticQuestion(context: InterviewContext, stage: string): string {
  const category = detectRoleCategory(context.jobRole);
  const questions = ROLE_QUESTIONS[category]?.[stage] || ROLE_QUESTIONS.default.behavioral;
  const available = questions.filter(q => !wasQuestionAsked(context, q));
  
  if (available.length === 0) {
    // Generate a contextual fallback instead of repeating the same question
    return generateContextualFallback(context, stage);
  }
  
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Generate a unique contextual fallback question when all static questions are exhausted
 */
function generateContextualFallback(context: InterviewContext, stage: string): string {
  const roleCategory = detectRoleCategory(context.jobRole);
  const roleName = context.jobRole;
  const questionNumber = context.questionCount;
  
  // Generate different questions based on stage and role - cycle through these
  const fallbacks: Record<string, string[]> = {
    background: [
      `What inspired you to pursue a career in ${roleName}?`,
      `Walk me through your journey into ${roleName}.`,
      `What do you find most rewarding about working in ${roleName}?`,
      `How has your approach to ${roleName} evolved over time?`,
      `What skills have you developed that make you stand out as a ${roleName}?`,
    ],
    behavioral: [
      `Describe a situation in your ${roleName} role where you had to adapt quickly.`,
      `Tell me about a time you received constructive feedback as a ${roleName}.`,
      `Share an example of how you handled pressure in your ${roleName} work.`,
      `What's the most challenging project you've tackled as a ${roleName}?`,
      `Describe how you collaborate with others in your ${roleName} position.`,
    ],
    technical: [
      `What ${roleCategory === 'software' ? 'technical tools' : 'methodologies'} do you prefer and why?`,
      `How do you stay current with developments in ${roleName}?`,
      `What's your approach to problem-solving in ${roleName}?`,
      `Describe a complex problem you solved in your ${roleName} work.`,
      `What technical achievement are you most proud of as a ${roleName}?`,
    ],
  };
  
  const stageFallbacks = fallbacks[stage] || fallbacks.behavioral;
  // Use question number to cycle through different fallbacks (ensures variety)
  const index = questionNumber % stageFallbacks.length;
  return stageFallbacks[index];
}

/**
 * Extract candidate name
 */
function extractName(message: string): string {
  const patterns = [
    /my name is (\w+)/i,
    /i am (\w+)/i,
    /i'm (\w+)/i,
    /call me (\w+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1];
  }
  
  const firstWord = message.trim().split(' ')[0];
  if (firstWord && firstWord.length > 2) {
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
  }
  
  return '';
}

/**
 * Detect interruptions and special requests
 */
function detectInterruption(message: string): {
  isInterruption: boolean;
  type: 'hearing_check' | 'repeat' | 'wait' | 'redirect' | 'none';
} {
  const lower = message.toLowerCase().trim();
  
  if (lower.includes('can you hear me') || lower.includes('are you there')) {
    return { isInterruption: true, type: 'hearing_check' };
  }
  
  if (lower.includes('repeat') || lower.includes('say that again')) {
    return { isInterruption: true, type: 'repeat' };
  }
  
  if (lower.includes('wait') || lower.includes('hold on')) {
    return { isInterruption: true, type: 'wait' };
  }
  
  if (lower.includes('not an engineer') || lower.includes('wrong question') || 
      lower.includes('already asked') || lower.includes('irrelevant')) {
    return { isInterruption: true, type: 'redirect' };
  }
  
  return { isInterruption: false, type: 'none' };
}

/**
 * Main function to get next interviewer message
 */
export async function getNextInterviewerMessage({
  context,
  candidateMessage,
}: {
  context: InterviewContext;
  candidateMessage?: string;
}): Promise<{ message: InterviewerMessage; updatedContext: InterviewContext }> {
  let updatedContext = { ...context };

  // Handle interruptions
  if (candidateMessage) {
    const interruption = detectInterruption(candidateMessage);

    if (interruption.type === 'hearing_check') {
      return {
        message: {
          text: 'Yes, I can hear you clearly. Please go ahead.',
          stage: context.stage,
          isQuestion: false,
        },
        updatedContext,
      };
    }

    if (interruption.type === 'repeat') {
      const lastQuestion = context.memory.lastQuestion;
      return {
        message: {
          text: lastQuestion ? `Sure. ${lastQuestion}` : "I apologize, let me repeat that.",
          stage: context.stage,
          isQuestion: true,
        },
        updatedContext,
      };
    }

    if (interruption.type === 'wait') {
      return {
        message: {
          text: 'Of course, take your time.',
          stage: context.stage,
          isQuestion: false,
        },
        updatedContext,
      };
    }

    if (interruption.type === 'redirect') {
      // Acknowledge and use AI to generate better question if enabled
      if (context.useAIFollowUp) {
        const aiResponse = await generateAIFollowUp(context, candidateMessage);
        if (aiResponse.response) {
          const question = aiResponse.response;
          updatedContext = markQuestionAsked(updatedContext, question);
          updatedContext.memory = updateMemory(updatedContext.memory, { lastQuestion: question });
          
          return {
            message: {
              text: aiResponse.response,
              stage: context.stage,
              isQuestion: true,
              isAIGenerated: true,
            },
            updatedContext,
          };
        }
      }
      
      // Fallback to static
      const fallbackQuestion = getStaticQuestion(updatedContext, 'background');
      updatedContext = markQuestionAsked(updatedContext, fallbackQuestion);
      
      return {
        message: {
          text: `I apologize. Let me ask you something more relevant.\n\n${fallbackQuestion}`,
          stage: context.stage,
          isQuestion: true,
        },
        updatedContext,
      };
    }
  }

  // Handle different stages
  switch (context.stage) {
    case InterviewStage.INTRODUCTION:
      if (!candidateMessage) {
        const hour = new Date().getHours();
        let greeting = 'Good morning';
        if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
        if (hour >= 17) greeting = 'Good evening';
        
        return {
          message: {
            text: `${greeting}. My name is ${context.interviewerName} and I will be conducting your interview today at ${context.company}.\n\nBefore we begin, can you please introduce yourself?`,
            stage: InterviewStage.INTRODUCTION,
            isQuestion: true,
          },
          updatedContext,
        };
      }

      // Extract name and move to next stage
      const candidateName = extractName(candidateMessage);
      if (candidateName) {
        updatedContext.candidateName = candidateName;
        updatedContext.memory = updateMemory(context.memory, { candidateName });
      }

      updatedContext.stage = InterviewStage.BACKGROUND;
      updatedContext.questionCount += 1;

      // Use AI for first substantive question if enabled
      if (updatedContext.useAIFollowUp) {
        const aiResponse = await generateAIFollowUp(updatedContext, candidateMessage);
        if (aiResponse.response) {
          const question = aiResponse.response;
          updatedContext = markQuestionAsked(updatedContext, question);
          updatedContext.memory = updateMemory(updatedContext.memory, { lastQuestion: question });
          
          return {
            message: {
              text: question,
              stage: InterviewStage.BACKGROUND,
              isQuestion: true,
              isAIGenerated: true,
            },
            updatedContext,
          };
        }
      }

      // Fallback to static question
      const backgroundQuestion = getStaticQuestion(updatedContext, 'background');
      updatedContext = markQuestionAsked(updatedContext, backgroundQuestion);
      updatedContext.memory = updateMemory(updatedContext.memory, { lastQuestion: backgroundQuestion });

      return {
        message: {
          text: `Thank you for that introduction${candidateName ? ', ' + candidateName : ''}. It is a pleasure to meet you.\n\n${backgroundQuestion}`,
          stage: InterviewStage.BACKGROUND,
          isQuestion: true,
        },
        updatedContext,
      };

    case InterviewStage.BACKGROUND:
      // Move to BEHAVIORAL stage after background
      updatedContext.stage = InterviewStage.BEHAVIORAL;
      updatedContext.questionCount += 1;

      // Try AI-generated follow-up first
      if (candidateMessage && updatedContext.useAIFollowUp) {
        console.log('[Interview] Generating AI follow-up for:', candidateMessage.substring(0, 50));
        const aiResponse = await generateAIFollowUp(updatedContext, candidateMessage);
        
        if (aiResponse.response && !aiResponse.error) {
          const question = aiResponse.response;
          updatedContext = markQuestionAsked(updatedContext, question);
          updatedContext.memory = updateMemory(updatedContext.memory, { lastQuestion: question });
          
          return {
            message: {
              text: question,
              stage: InterviewStage.BEHAVIORAL,
              isQuestion: true,
              isAIGenerated: true,
            },
            updatedContext,
          };
        }
        
        console.log('[Interview] AI follow-up failed, using fallback:', aiResponse.error);
      }

      // Fallback to static question - use behavioral for second question
      const behavioralQuestion = getStaticQuestion(updatedContext, 'behavioral');
      updatedContext = markQuestionAsked(updatedContext, behavioralQuestion);
      updatedContext.memory = updateMemory(updatedContext.memory, { lastQuestion: behavioralQuestion });

      return {
        message: {
          text: behavioralQuestion,
          stage: InterviewStage.BEHAVIORAL,
          isQuestion: true,
        },
        updatedContext,
      };

    case InterviewStage.BEHAVIORAL:
      // Move to TECHNICAL stage after behavioral
      updatedContext.stage = InterviewStage.TECHNICAL;
      updatedContext.questionCount += 1;

      // Try AI-generated follow-up first
      if (candidateMessage && updatedContext.useAIFollowUp) {
        console.log('[Interview] Generating AI follow-up for:', candidateMessage.substring(0, 50));
        const aiResponse = await generateAIFollowUp(updatedContext, candidateMessage);
        
        if (aiResponse.response && !aiResponse.error) {
          const question = aiResponse.response;
          updatedContext = markQuestionAsked(updatedContext, question);
          updatedContext.memory = updateMemory(updatedContext.memory, { lastQuestion: question });
          
          return {
            message: {
              text: question,
              stage: InterviewStage.TECHNICAL,
              isQuestion: true,
              isAIGenerated: true,
            },
            updatedContext,
          };
        }
        
        console.log('[Interview] AI follow-up failed, using fallback:', aiResponse.error);
      }

      // Fallback to static question - use technical for third question
      const technicalQuestion = getStaticQuestion(updatedContext, 'technical');
      updatedContext = markQuestionAsked(updatedContext, technicalQuestion);
      updatedContext.memory = updateMemory(updatedContext.memory, { lastQuestion: technicalQuestion });

      return {
        message: {
          text: technicalQuestion,
          stage: InterviewStage.TECHNICAL,
          isQuestion: true,
        },
        updatedContext,
      };

    case InterviewStage.TECHNICAL:
      // Continue with more questions or move to closing
      if (context.questionCount >= context.maxQuestions - 1) {
        updatedContext.stage = InterviewStage.CLOSING;
      } else {
        updatedContext.questionCount += 1;

        // Try AI follow-up
        if (candidateMessage && updatedContext.useAIFollowUp) {
          const aiResponse = await generateAIFollowUp(updatedContext, candidateMessage);
          if (aiResponse.response) {
            const question = aiResponse.response;
            updatedContext = markQuestionAsked(updatedContext, question);
            updatedContext.memory = updateMemory(updatedContext.memory, { lastQuestion: question });
            
            return {
              message: {
                text: question,
                stage: InterviewStage.TECHNICAL,
                isQuestion: true,
                isAIGenerated: true,
              },
              updatedContext,
            };
          }
        }

        // Fallback - use technical questions for technical stage
        const followUp = getStaticQuestion(updatedContext, 'technical');
        updatedContext = markQuestionAsked(updatedContext, followUp);
        updatedContext.memory = updateMemory(updatedContext.memory, { lastQuestion: followUp });

        return {
          message: {
            text: followUp,
            stage: InterviewStage.TECHNICAL,
            isQuestion: true,
          },
          updatedContext,
        };
      }

      updatedContext.stage = InterviewStage.CLOSING;

      return {
        message: {
          text: `That brings us to the end of the interview. Do you have any questions for me about the role or ${context.company}?`,
          stage: InterviewStage.CLOSING,
          isQuestion: true,
        },
        updatedContext,
      };

    case InterviewStage.CLOSING:
      updatedContext.stage = InterviewStage.COMPLETE;

      return {
        message: {
          text: candidateMessage 
            ? "Thank you for asking. We appreciate your interest.\n\nThank you for your time today. We will be in touch. Have a wonderful day."
            : "Thank you for your time today. We will be in touch. Have a wonderful day.",
          stage: InterviewStage.COMPLETE,
          isQuestion: false,
        },
        updatedContext,
      };

    case InterviewStage.COMPLETE:
      return {
        message: {
          text: 'The interview has concluded. Thank you for your time.',
          stage: InterviewStage.COMPLETE,
          isQuestion: false,
        },
        updatedContext,
      };

    default:
      return {
        message: {
          text: 'I apologize, could you please repeat that?',
          stage: context.stage,
          isQuestion: false,
        },
        updatedContext,
      };
  }
}
