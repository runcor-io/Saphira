/**
 * Nigerian Interviewer Persona
 * Generates professional but warm responses typical of Lagos corporate interviewers
 */

export interface NigerianInterviewerConfig {
  name: string;
  gender: 'male' | 'female';
  company: string;
  jobRole: string;
}

// Common Nigerian acknowledgment phrases
const ACKNOWLEDGMENTS = [
  'I understand.',
  'That is interesting.',
  'Alright, that is good to hear.',
  'I see what you mean.',
  'That makes sense.',
  'Very good.',
  'Excellent.',
  'I appreciate that.',
  'Thank you for sharing that.',
  'That is noted.',
  'I hear you.',
  'Alright, go on.',
  'Interesting perspective.',
  'I understand your point.',
  'That is clear.',
];

// Transitional phrases
const TRANSITIONS = [
  'Now,',
  'Moving on,',
  'Next,',
  'Let me ask you this:',
  'I would like to know:',
  'Can you tell me:',
];

// Probing phrases for more detail
const PROBES = [
  'Can you elaborate on that?',
  'Could you give me more details?',
  'Tell me more about that.',
  'How exactly did you do that?',
  'What was your specific role?',
  'Can you walk me through that process?',
];

/**
 * Generate a natural Nigerian interviewer's response
 */
export async function generateNigerianResponse({
  candidateMessage,
  context,
  needsAcknowledgment = true,
  needsQuestion = true,
}: {
  candidateMessage?: string;
  context: NigerianInterviewerConfig;
  needsAcknowledgment?: boolean;
  needsQuestion?: boolean;
}): Promise<string> {
  let response = '';
  
  // Add acknowledgment if there's a candidate message
  if (needsAcknowledgment && candidateMessage) {
    const acknowledgment = selectAcknowledgment(candidateMessage);
    response += acknowledgment;
  }
  
  // Add transition if we're moving to a question
  if (needsQuestion) {
    const transition = TRANSITIONS[Math.floor(Math.random() * TRANSITIONS.length)];
    
    if (response) {
      response += ' ' + transition.toLowerCase();
    } else {
      response = transition;
    }
  }
  
  return response;
}

/**
 * Select appropriate acknowledgment based on message content
 */
function selectAcknowledgment(message: string): string {
  const lowerMessage = message.toLowerCase();
  const length = message.length;
  
  // For detailed responses
  if (length > 100) {
    const detailedAcks = [
      'That is very comprehensive. Thank you for that detailed explanation.',
      'I appreciate you sharing all of that. It gives me a good picture.',
      'That is quite thorough. Thank you.',
      'You have given me a lot to consider. Thank you.',
    ];
    return detailedAcks[Math.floor(Math.random() * detailedAcks.length)];
  }
  
  // For positive/creative responses
  if (lowerMessage.includes('created') || 
      lowerMessage.includes('built') || 
      lowerMessage.includes('developed') ||
      lowerMessage.includes('achieved')) {
    return 'That is impressive work.';
  }
  
  // For challenge/overcoming responses
  if (lowerMessage.includes('difficult') || 
      lowerMessage.includes('challenge') || 
      lowerMessage.includes('problem') ||
      lowerMessage.includes('issue')) {
    return 'I can see you handled that situation well.';
  }
  
  // For leadership/management
  if (lowerMessage.includes('led') || 
      lowerMessage.includes('managed') || 
      lowerMessage.includes('team')) {
    return 'That shows good leadership.';
  }
  
  // For technical responses
  if (lowerMessage.includes('code') || 
      lowerMessage.includes('system') || 
      lowerMessage.includes('technical')) {
    return 'I see you have solid technical experience.';
  }
  
  // Default random acknowledgment
  return ACKNOWLEDGMENTS[Math.floor(Math.random() * ACKNOWLEDGMENTS.length)];
}

/**
 * Generate a probe for more information
 */
export function generateProbe(): string {
  return PROBES[Math.floor(Math.random() * PROBES.length)];
}

/**
 * Generate greeting based on time of day
 */
export function generateGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 17) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

/**
 * Generate introduction message
 */
export function generateIntroduction(config: NigerianInterviewerConfig): string {
  const greeting = generateGreeting();
  
  return `${greeting}. My name is ${config.name} and I will be conducting your interview today at ${config.company}.

Before we begin, can you please introduce yourself?`;
}

/**
 * Generate response to candidate introduction
 */
export function generateIntroductionResponse(
  candidateName: string,
  config: NigerianInterviewerConfig
): string {
  if (candidateName) {
    return `Thank you for that introduction, ${candidateName}. It is a pleasure to meet you.

Can you tell me about your educational background? Which schools did you attend and what did you study?`;
  }
  
  return `Thank you for that introduction. It is a pleasure to meet you.

Can you tell me about your educational background?`;
}

/**
 * Generate response to education background
 */
export function generateEducationResponse(config: NigerianInterviewerConfig): string {
  return `That is a solid educational foundation.

Now, tell me about your work experience. What roles have you held that prepared you for this ${config.jobRole} position?`;
}

/**
 * Generate response to experience
 */
export function generateExperienceResponse(config: NigerianInterviewerConfig): string {
  return `I can see you have relevant experience.

Let me ask you about a challenging situation. Tell me about a difficult problem you faced at work and how you handled it.`;
}

/**
 * Generate response to behavioral answer
 */
export function generateBehavioralResponse(config: NigerianInterviewerConfig): string {
  return `That shows good problem-solving skills.

Now, let us talk about your technical abilities. ${generateTechnicalQuestion(config.jobRole)}`;
}

/**
 * Generate technical question based on role
 */
function generateTechnicalQuestion(jobRole: string): string {
  const roleLower = jobRole.toLowerCase();
  
  if (roleLower.includes('software') || roleLower.includes('developer') || roleLower.includes('engineer')) {
    return 'Can you describe your most complex technical project and walk me through the architecture you used?';
  }
  
  if (roleLower.includes('manager') || roleLower.includes('lead')) {
    return 'How do you approach team management? Can you give me an example of how you have motivated a struggling team member?';
  }
  
  if (roleLower.includes('data') || roleLower.includes('analyst')) {
    return 'Can you walk me through a complex analysis you performed? What tools did you use and what was the outcome?';
  }
  
  if (roleLower.includes('product') || roleLower.includes('pm')) {
    return 'Tell me about how you prioritize features when resources are limited. How do you make those decisions?';
  }
  
  return `What specific technical skills do you bring to this ${jobRole} role?`;
}

/**
 * Generate closing message
 */
export function generateClosing(config: NigerianInterviewerConfig, hasCandidateQuestions: boolean): string {
  if (hasCandidateQuestions) {
    return `Thank you for those questions. We appreciate your interest in this position.

That brings us to the end of the interview. Thank you for your time today. We will be in touch with you regarding the next steps. Have a wonderful day.`;
  }
  
  return `That brings us to the end of the interview. Do you have any questions for me about the role or ${config.company}?

If not, thank you for your time today. We will be in touch with you regarding the next steps. Have a wonderful day.`;
}

/**
 * Generate hearing check response
 */
export function generateHearingCheckResponse(): string {
  return 'Yes, I can hear you clearly. Please go ahead.';
}

/**
 * Generate wait response
 */
export function generateWaitResponse(): string {
  return 'Of course, take your time. I will wait.';
}

/**
 * Generate repeat response
 */
export function generateRepeatResponse(lastQuestion: string): string {
  return `Certainly. ${lastQuestion}`;
}

/**
 * Check if a response needs follow-up probing
 */
export function needsFollowUp(message: string): boolean {
  const wordCount = message.split(' ').length;
  
  // If response is too short, probe for more
  if (wordCount < 15) return true;
  
  // If response is vague
  const vaguePhrases = ['okay', 'fine', 'good', 'nice', 'alright'];
  const lowerMessage = message.toLowerCase();
  if (vaguePhrases.some(p => lowerMessage.includes(p))) return true;
  
  return false;
}
