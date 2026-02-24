/**
 * Human Reaction Service
 * Inserts natural conversational reactions after candidate answers
 */

import { PanelMember } from './types';

// Natural micro-reactions
const REACTIONS = [
  "I see.",
  "Alright.",
  "Okay.",
  "Interesting.",
  "That's good.",
  "Hmm.",
  "Noted.",
  "Understood.",
  "Right.",
  "Okay, I hear you.",
  "I understand.",
  "Fair enough.",
];

// Personality-specific reactions
const PERSONALITY_REACTIONS: Record<string, string[]> = {
  strict: [
    "Hmm.",
    "I see.",
    "Alright.",
    "Understood.",
    "Noted.",
    "Continue.",
  ],
  supportive: [
    "That's good.",
    "I see.",
    "Okay.",
    "Interesting.",
    "Alright.",
    "Good point.",
    "Nice.",
  ],
  skeptical: [
    "Hmm.",
    "Interesting.",
    "I see.",
    "Alright.",
    "Is that so?",
  ],
  technical: [
    "I see.",
    "Understood.",
    "Alright.",
    "Noted.",
    "Go on.",
    "Continue.",
  ],
  direct: [
    "Alright.",
    "Okay.",
    "I see.",
    "Understood.",
    "Right.",
  ],
  analytical: [
    "Interesting.",
    "I see.",
    "Understood.",
    "Alright.",
    "Noted.",
  ],
};

// Track last reaction to avoid repetition
const lastReactions: Map<string, string> = new Map();

interface ReactionInput {
  panelist: PanelMember;
  candidateAnswer: string;
  conversationTurn: number;
}

interface ReactionOutput {
  reaction: string | null;
  shouldAddReaction: boolean;
}

/**
 * Generate human reaction after candidate answer
 * 
 * Rules:
 * - 70% probability of adding a reaction
 * - Do NOT use same reaction twice in a row
 * - Personality-specific reactions
 */
export function generateHumanReaction(input: ReactionInput): ReactionOutput {
  const { panelist, conversationTurn } = input;
  
  // Don't add reaction on first few turns (let interview warm up)
  if (conversationTurn < 2) {
    return { reaction: null, shouldAddReaction: false };
  }
  
  // 70% probability of reaction
  if (Math.random() > 0.7) {
    return { reaction: null, shouldAddReaction: false };
  }
  
  // Get reaction set based on personality
  const reactionSet = PERSONALITY_REACTIONS[panelist.personality] || REACTIONS;
  
  // Select reaction, avoiding last used one
  const lastReaction = lastReactions.get(panelist.id);
  let availableReactions = reactionSet;
  
  if (lastReaction) {
    availableReactions = reactionSet.filter(r => r !== lastReaction);
  }
  
  const reaction = availableReactions[Math.floor(Math.random() * availableReactions.length)];
  
  // Store this reaction
  lastReactions.set(panelist.id, reaction);
  
  return { reaction, shouldAddReaction: true };
}

/**
 * Generate a combined reaction + question opening
 */
export function generateReactionWithQuestion(
  reaction: string,
  question: string
): string {
  // Sometimes combine, sometimes separate
  if (Math.random() < 0.5) {
    return `${reaction} ${question}`;
  }
  return question;
}

/**
 * Clear reaction history (call at end of session)
 */
export function clearReactionHistory(): void {
  lastReactions.clear();
}

/**
 * Get reaction delay in milliseconds
 * Creates natural thinking pause
 */
export function getReactionDelay(): number {
  // Random delay between 400ms and 800ms for reactions
  return Math.floor(Math.random() * 400) + 400;
}
