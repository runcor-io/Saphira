/**
 * Saphira AI - Response Template Selector
 * Selects appropriate Nigerian interviewer responses based on context
 */

import { 
  UseCase, 
  FormalityLevel, 
  CulturalContext, 
  PanelPersonality,
  ResponseTemplate 
} from './types';
import { getUseCaseConfig } from './useCaseConfigs';
import { Country, getToneGuide } from './datasetService';

/**
 * Response patterns by use case and scenario
 * Based on saphira_response_patterns.md
 */
const RESPONSE_PATTERNS: Record<string, Record<string, string[]>> = {
  job_interview: {
    opening: [
      "Good morning/afternoon. Thank you for coming in today. Please, have a seat.",
      "Good morning! Welcome. How was your journey here?",
      "Good morning. Please sit down. Make yourself comfortable.",
    ],
    greeting_acknowledgment: [
      "I see you graduated from {university}. That's a good school.",
      "I see you're a graduate of {university}. Well done.",
      "Your background looks interesting. Tell me more about your experience at {company}.",
    ],
    nysc_questions: [
      "Are you currently serving, or have you completed your NYSC?",
      "Where were you posted for your service year?",
      "What did you learn during your NYSC that you think will help you here?",
    ],
    salary_discussion: [
      "What are your salary expectations?",
      "We have a budget of {amount} for this role. Is that acceptable?",
      "I understand you mentioned {amount}. Considering your experience, we can offer {counter}.",
    ],
    rapport_building: [
      "Relax, no wahala. Just be yourself.",
      "Ah, Lagos traffic. We understand. That's why we have flexible hours.",
      "By God's grace, we will find the right fit.",
    ],
    closing: [
      "Thank you for your time. We'll get back to you within two weeks.",
      "This was a good conversation. We'll be in touch soon.",
      "You did well today. We like what we heard.",
    ],
  },

  embassy_interview: {
    opening: [
      "Good morning. Passport and documents, please.",
      "State your full name and date of birth.",
      "Purpose of your trip to {country}?",
    ],
    probing: [
      "Who is sponsoring this trip?",
      "What ties do you have to Nigeria that will ensure your return?",
      "How long have you been working at your current job?",
    ],
    document_issues: [
      "Your bank statement shows recent large deposits. Explain.",
      "This employment letter looks recent. How long have you actually worked there?",
      "I need to see more evidence of your ties to Nigeria.",
    ],
    neutral: [
      "I understand. Next question.",
      "Please answer directly. Yes or no.",
      "I'm not asking about that. Focus on what I asked.",
    ],
    closing: [
      "Your application is under review. You'll be notified.",
      "Visa approved. Collect your passport in 3 days.",
      "I'm sorry, I cannot approve this visa at this time.",
    ],
  },

  scholarship_interview: {
    opening: [
      "Good morning. Welcome to the scholarship interview.",
      "I see you graduated top of your class. Congratulations.",
      "Tell us why you deserve this scholarship.",
    ],
    academic_focus: [
      "What are your research interests?",
      "How will this scholarship help you achieve your goals?",
      "What do you plan to do after your studies?",
    ],
    character_assessment: [
      "Tell us about a challenge you've overcome.",
      "How do you plan to give back to your community?",
      "Why did you choose this field of study?",
    ],
    encouraging: [
      "That's a commendable goal.",
      "We need more young people like you.",
      "Your passion for {field} is evident.",
    ],
  },

  business_pitch: {
    opening: [
      "You have 10 minutes. Go.",
      "What problem are you solving?",
      "Why should we invest in you?",
    ],
    challenging: [
      "What's your revenue so far?",
      "Who are your competitors?",
      "What if someone copies your idea?",
      "How do you handle Nepa issues with your operations?",
    ],
    skeptical: [
      "That sounds too good to be true.",
      "I've heard this before. What makes you different?",
      "Your projections seem optimistic.",
    ],
    interested: [
      "Interesting. Tell me more about {detail}.",
      "I like this. What's your timeline?",
      "We might be interested. Send us your deck.",
    ],
  },

  academic_presentation: {
    from_lecturer: [
      "Your introduction was clear. Proceed.",
      "I don't understand your methodology. Explain.",
      "This literature review is shallow. You need more sources.",
      "Good work. I'm impressed with your analysis.",
    ],
    from_panel: [
      "Question from the left: How does this apply in the Nigerian context?",
      "Your data seems limited. Did you consider {factor}?",
      "Well done. You may proceed to the next stage.",
    ],
  },

  board_presentation: {
    from_management: [
      "Get to the point. We don't have all day.",
      "What does this mean for the bottom line?",
      "Who approved this approach?",
      "This is impressive. Well done.",
    ],
    challenging: [
      "I've been in this industry 30 years. This won't work.",
      "Your numbers don't add up.",
      "Go back and do this properly.",
    ],
  },
};

/**
 * Cultural adaptation responses
 */
const CULTURAL_ADAPTATIONS: Record<string, Record<string, string[]>> = {
  pidgin: {
    acknowledgment: [
      "I understand. Take your time.",
      "No wahala. Let's break it down.",
      "I hear you. Let's continue.",
    ],
    redirect: [
      "Let's stick to English for this interview.",
      "I understand. Now, let's focus on your experience.",
    ],
  },
  religious: {
    acknowledgment: [
      "Amen. Now, tell me about your experience...",
      "I understand. What specific skills do you bring?",
      "We all need grace. Let's continue.",
    ],
  },
  nervous: {
    calming: [
      "Relax. You're doing fine.",
      "Take a breath. There's no rush.",
      "You were invited here because we saw potential.",
    ],
  },
  overconfident: {
    grounding: [
      "That's interesting. But let's talk about {weakness}.",
      "You seem very confident. What about {challenge}?",
      "Tell me about a time you failed.",
    ],
  },
  excessive_respect: {
    equalizing: [
      "Thank you for the respect, but please relax.",
      "You can be less formal. Just answer the question.",
      "You're welcome. Now, tell me about...",
    ],
  },
  family_obligation: {
    acknowledgment: [
      "I understand family is important. Tell me about your qualifications.",
      "Many people have families. What makes you the right candidate?",
      "That's commendable. Now, about your experience...",
    ],
  },
};

/**
 * Follow-up question patterns
 */
const FOLLOWUP_PATTERNS: Record<string, string[]> = {
  team_leadership: [
    "How many people were on your team?",
    "What was the most challenging part of leading them?",
    "Did you ever have to fire someone?",
  ],
  project_management: [
    "What was the budget for this project?",
    "How long did it take to complete?",
    "What would you do differently?",
  ],
  problem_solving: [
    "Walk me through your thought process.",
    "What alternatives did you consider?",
    "How did you measure success?",
  ],
  technical_implementation: [
    "What technology stack did you use?",
    "How did you handle {technical_challenge}?",
    "What was the performance impact?",
  ],
};

/**
 * Error correction patterns
 */
const ERROR_CORRECTIONS: Record<string, string[]> = {
  gentle: [
    "I think you misunderstood the question. Let me rephrase.",
    "Actually, I was asking about something else. Let me clarify.",
  ],
  direct: [
    "That's not what I asked. Listen carefully.",
    "You're not answering my question.",
  ],
  teaching: [
    "Actually, in this industry, we do it this way...",
    "That approach has some issues. Here's why...",
  ],
};

/**
 * Get response by use case and category
 */
export function getResponsePattern(
  useCase: UseCase,
  category: string,
  options?: { random?: boolean; index?: number }
): string {
  const patterns = RESPONSE_PATTERNS[useCase]?.[category] || 
                   RESPONSE_PATTERNS.job_interview[category] ||
                   ["Tell me more about that."];
  
  if (options?.random !== false) {
    return patterns[Math.floor(Math.random() * patterns.length)];
  }
  
  return patterns[options?.index || 0] || patterns[0];
}

/**
 * Select response based on cultural context
 */
export function selectCulturalResponse(
  context: CulturalContext,
  type: 'acknowledgment' | 'redirect' | 'response'
): string {
  if (context.usesPidgin && type === 'acknowledgment') {
    const options = CULTURAL_ADAPTATIONS.pidgin.acknowledgment;
    return options[Math.floor(Math.random() * options.length)];
  }
  
  if (context.religiousReferences.length > 0 && type === 'acknowledgment') {
    const options = CULTURAL_ADAPTATIONS.religious.acknowledgment;
    return options[Math.floor(Math.random() * options.length)];
  }
  
  if (context.nervousness && type === 'response') {
    const options = CULTURAL_ADAPTATIONS.nervous.calming;
    return options[Math.floor(Math.random() * options.length)];
  }
  
  if (context.overconfidence && type === 'redirect') {
    const options = CULTURAL_ADAPTATIONS.overconfident.grounding;
    return options[Math.floor(Math.random() * options.length)];
  }
  
  if (context.excessiveRespect && type === 'response') {
    const options = CULTURAL_ADAPTATIONS.excessive_respect.equalizing;
    return options[Math.floor(Math.random() * options.length)];
  }
  
  if (context.familyObligations && type === 'acknowledgment') {
    const options = CULTURAL_ADAPTATIONS.family_obligation.acknowledgment;
    return options[Math.floor(Math.random() * options.length)];
  }
  
  return "";
}

/**
 * Generate follow-up question based on candidate mention
 */
export function generateFollowUp(
  mention: string,
  category?: string
): string {
  const patterns = category && FOLLOWUP_PATTERNS[category] 
    ? FOLLOWUP_PATTERNS[category]
    : FOLLOWUP_PATTERNS.problem_solving;
  
  return patterns[Math.floor(Math.random() * patterns.length)];
}

/**
 * Determine response tone based on context
 */
export function determineTone(
  culturalContext: CulturalContext,
  useCase: UseCase
): {
  tone: string;
  formality: FormalityLevel;
  directness: 'high' | 'medium' | 'low';
} {
  const config = getUseCaseConfig(useCase);
  let formality = config.formalityLevel;
  let directness = config.directnessLevel;
  let tone = 'professional';
  
  // Adjust based on cultural context
  if (culturalContext.nervousness) {
    tone = 'encouraging';
    directness = 'low';
  }
  
  if (culturalContext.usesPidgin) {
    tone = 'warm_professional';
    formality = 'semi_formal';
  }
  
  if (culturalContext.evasiveness.isEvasive) {
    tone = 'redirecting';
    directness = 'high';
  }
  
  if (culturalContext.excessiveRespect) {
    tone = 'equalizing';
    formality = 'informal';
  }
  
  if (culturalContext.overconfidence) {
    tone = 'challenging';
    directness = 'high';
  }
  
  return { tone, formality, directness };
}

/**
 * Select appropriate response template
 */
export function selectResponseTemplate(
  useCase: UseCase,
  scenario: string,
  culturalContext: CulturalContext,
  personality?: PanelPersonality
): string {
  // Get base pattern
  let response = getResponsePattern(useCase, scenario);
  
  // Apply cultural adaptations
  const culturalResponse = selectCulturalResponse(culturalContext, 'acknowledgment');
  if (culturalResponse && scenario === 'opening') {
    response = culturalResponse + " " + response;
  }
  
  // Apply personality modifiers
  if (personality === 'strict' && culturalContext.nervousness) {
    // Strict interviewers don't coddle
    response = response.replace(/Relax|Take a breath/i, "Focus");
  }
  
  if (personality === 'supportive' && culturalContext.nervousness) {
    // Supportive interviewers are more encouraging
    response = response + " You're doing great.";
  }
  
  if (personality === 'direct' && !culturalContext.evasiveness.isEvasive) {
    // Direct interviewers get to the point
    response = response.replace(/Good morning.*\.\s*/, "");
  }
  
  return response;
}

/**
 * Build system prompt for GPT-4 based on context
 */
export function buildSystemPrompt(
  useCase: UseCase,
  panelMemberName: string,
  panelMemberRole: string,
  personality: PanelPersonality,
  culturalContext: CulturalContext,
  country: Country = 'nigeria'
): string {
  const config = getUseCaseConfig(useCase);
  const { tone, formality, directness } = determineTone(culturalContext, useCase);
  const toneGuide = getToneGuide(country);
  
  return `
You are ${panelMemberName}, a ${panelMemberRole} conducting a ${config.displayName}.

Your personality: ${personality}
Communication style:
- Formality: ${formality}
- Directness: ${directness}
- Current tone: ${tone}

CULTURAL TONE GUIDE:
${toneGuide}

Current Candidate Context:
- Uses Pidgin: ${culturalContext.usesPidgin}
- Religious references: ${culturalContext.religiousReferences.length > 0}
- Confidence level: ${culturalContext.confidenceLevel}
- Nervousness: ${culturalContext.nervousness}
- Evasiveness: ${culturalContext.evasiveness.isEvasive}

Respond as the interviewer would in a ${country.replace('_', ' ')} professional setting.
`;
}

export default {
  getResponsePattern,
  selectCulturalResponse,
  generateFollowUp,
  determineTone,
  selectResponseTemplate,
  buildSystemPrompt,
};
