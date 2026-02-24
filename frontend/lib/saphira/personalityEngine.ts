/**
 * Personality Engine
 * Makes each panelist behave consistently according to their personality
 */

import { PanelMember } from './types';
import { Country, getRandomFiller, getRandomReaction } from './datasetService';

export type PersonalityType = 'strict' | 'supportive' | 'technical' | 'skeptical' | 'direct' | 'analytical' | 'executive';

interface PersonalityProfile {
  type: PersonalityType;
  name: string;
  description: string;
  traits: string[];
  openingPhrases: string[];
  challengePhrases: string[];
  encouragingPhrases: string[];
  followUpStyle: string;
  questionStyle: string;
  tone: string;
}

const PERSONALITY_PROFILES: Record<PersonalityType, PersonalityProfile> = {
  strict: {
    type: 'strict',
    name: 'Strict Examiner',
    description: 'Challenges answers, demands rigor, hard to impress',
    traits: ['demanding', 'rigorous', 'critical', 'precise'],
    openingPhrases: [
      "Let's get straight to it.",
      "I'll be direct with you.",
      "I expect thorough answers.",
    ],
    challengePhrases: [
      "Are you sure about that?",
      "That's not entirely convincing.",
      "Can you justify that?",
      "I need more clarity on that point.",
      "That's questionable.",
      "I'm not sure I agree.",
      "Give me a better reason.",
    ],
    encouragingPhrases: [
      "That's better.",
      "Good. Continue.",
      "Acceptable.",
    ],
    followUpStyle: 'Probing and challenging - always asks for evidence or deeper reasoning',
    questionStyle: 'Direct, no-nonsense questions that test depth of knowledge',
    tone: 'Formal, serious, authoritative',
  },
  
  supportive: {
    type: 'supportive',
    name: 'Supportive Mentor',
    description: 'Encourages candidate, creates comfortable environment',
    traits: ['encouraging', 'warm', 'patient', 'understanding'],
    openingPhrases: [
      "Don't worry, take your time.",
      "We're here to have a conversation.",
      "Feel free to express yourself.",
    ],
    challengePhrases: [
      "That's interesting, but can you tell me more?",
      "I see what you mean. What about...?",
      "That's a start. Can we explore that further?",
    ],
    encouragingPhrases: [
      "Good!",
      "That's nice.",
      "You're on the right track.",
      "Well said!",
      "Excellent point.",
      "I like that.",
    ],
    followUpStyle: 'Gentle probing - asks for elaboration in a non-threatening way',
    questionStyle: 'Open-ended questions that allow candidate to shine',
    tone: 'Warm, friendly, conversational',
  },
  
  technical: {
    type: 'technical',
    name: 'Technical Expert',
    description: 'Focuses on implementation details and technical depth',
    traits: ['analytical', 'detail-oriented', 'precise', 'logical'],
    openingPhrases: [
      "Let's talk technical details.",
      "I'm interested in the implementation.",
      "Walk me through your approach.",
    ],
    challengePhrases: [
      "Explain the architecture.",
      "How does that scale?",
      "What's the technical stack?",
      "Can you be more specific?",
      "I need technical details.",
      "How would you implement that?",
    ],
    encouragingPhrases: [
      "Technically sound.",
      "That's accurate.",
      "Correct.",
      "Precisely.",
    ],
    followUpStyle: 'Deep technical dives - asks about architecture, scalability, edge cases',
    questionStyle: 'Technical questions focused on implementation and methodology',
    tone: 'Analytical, precise, methodical',
  },
  
  skeptical: {
    type: 'skeptical',
    name: 'Skeptical Evaluator',
    description: 'Questions assumptions, looks for weaknesses',
    traits: ['doubtful', 'cautious', 'testing', 'critical'],
    openingPhrases: [
      "I'm going to challenge you on this.",
      "Convince me.",
      "I'm not easily impressed.",
    ],
    challengePhrases: [
      "Is that really the case?",
      "What if that doesn't work?",
      "Have you considered the risks?",
      "That sounds too optimistic.",
      "Prove it.",
      "Why should I believe that?",
    ],
    encouragingPhrases: [
      "That's more convincing.",
      "Okay, I see your point.",
      "Fair enough.",
    ],
    followUpStyle: 'Devil\'s advocate - challenges assumptions and looks for flaws',
    questionStyle: 'Skeptical questions that test robustness of answers',
    tone: 'Questioning, cautious, probing',
  },
  
  direct: {
    type: 'direct',
    name: 'Direct Executive',
    description: 'Straight to the point, no time wasted',
    traits: ['blunt', 'efficient', 'focused', 'results-oriented'],
    openingPhrases: [
      "Let me be direct.",
      "I'll cut to the chase.",
      "Straight talk -",
    ],
    challengePhrases: [
      "Get to the point.",
      "What does that mean in practical terms?",
      "So what?",
      "Why does that matter?",
      "What's the bottom line?",
    ],
    encouragingPhrases: [
      "Alright.",
      "Good.",
      "That works.",
      "Fine.",
    ],
    followUpStyle: 'Direct and efficient - cuts through fluff to core issues',
    questionStyle: 'Short, direct questions focused on outcomes',
    tone: 'Blunt, efficient, no-nonsense',
  },
  
  analytical: {
    type: 'analytical',
    name: 'Analytical Thinker',
    description: 'Breaks down problems systematically, looks for patterns',
    traits: ['systematic', 'logical', 'thorough', 'methodical'],
    openingPhrases: [
      "Let's analyze this systematically.",
      "Break it down for me.",
      "Walk me through your reasoning.",
    ],
    challengePhrases: [
      "What are the variables?",
      "How do you measure that?",
      "What's your data?",
      "Help me understand the logic.",
      "What are the dependencies?",
    ],
    encouragingPhrases: [
      "Logical.",
      "That follows.",
      "Makes sense.",
      "Reasonable.",
    ],
    followUpStyle: 'Systematic analysis - asks about methodology and data',
    questionStyle: 'Questions that reveal analytical thinking process',
    tone: 'Methodical, logical, systematic',
  },
  
  executive: {
    type: 'executive',
    name: 'Business Executive',
    description: 'Focuses on business impact, ROI, and strategic value',
    traits: ['strategic', 'business-focused', 'results-driven', 'visionary'],
    openingPhrases: [
      "Let's talk business impact.",
      "Show me the value.",
      "From a business perspective...",
    ],
    challengePhrases: [
      "How does this affect revenue?",
      "What value does this bring?",
      "What's the ROI?",
      "How does this impact the bottom line?",
      "What's the business case?",
      "Who benefits from this?",
    ],
    encouragingPhrases: [
      "That's good business sense.",
      "Strategic thinking.",
      "That adds value.",
    ],
    followUpStyle: 'Business-focused - always ties back to value and impact',
    questionStyle: 'Questions about business strategy, ROI, and impact',
    tone: 'Strategic, business-like, results-focused',
  },
};

/**
 * Get personality profile for a panel member
 */
export function getPersonalityProfile(panelist: PanelMember): PersonalityProfile {
  return PERSONALITY_PROFILES[panelist.personality as PersonalityType] || PERSONALITY_PROFILES.direct;
}

/**
 * Generate personality-specific system prompt
 */
export function generatePersonalityPrompt(
  panelist: PanelMember,
  country: Country = 'nigeria'
): string {
  const profile = getPersonalityProfile(panelist);
  const filler = getRandomFiller(country);
  
  return `You are ${panelist.name}, ${panelist.role}.

PERSONALITY: ${profile.name}
${profile.description}

TRAITS: ${profile.traits.join(', ')}

TONE: ${profile.tone}

QUESTION STYLE: ${profile.questionStyle}

FOLLOW-UP STYLE: ${profile.followUpStyle}

BEHAVIOR RULES:
- Stay consistent with your ${panelist.personality} personality throughout
- Use phrases like: ${profile.challengePhrases.slice(0, 3).join(', ')}
- Occasionally use fillers like: "${filler}"
- Never break character
- Be authentic to ${country.replace('_', ' ')} corporate culture
- Be concise - 1-2 sentences max`;
}

/**
 * Get a random challenge phrase for personality
 */
export function getChallengePhrase(
  panelist: PanelMember,
  country: Country = 'nigeria'
): string {
  // Use country-specific skeptical reaction
  return getRandomReaction(country, 'skeptical');
}

/**
 * Get a random encouraging phrase for personality
 */
export function getEncouragingPhrase(
  panelist: PanelMember,
  country: Country = 'nigeria'
): string {
  // Use country-specific positive reaction
  return getRandomReaction(country, 'positive');
}

/**
 * Get opening phrase for personality
 */
export function getOpeningPhrase(panelist: PanelMember): string {
  const profile = getPersonalityProfile(panelist);
  const phrases = profile.openingPhrases;
  return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Check if answer should be challenged based on personality
 */
export function shouldChallengeAnswer(panelist: PanelMember, answerQuality: 'weak' | 'medium' | 'strong'): boolean {
  const challengingPersonalities = ['strict', 'skeptical', 'technical'];
  const isChallenging = challengingPersonalities.includes(panelist.personality);
  
  if (answerQuality === 'weak') return true;
  if (answerQuality === 'medium' && isChallenging) return Math.random() < 0.7;
  if (answerQuality === 'strong' && isChallenging) return Math.random() < 0.3;
  
  return false;
}
