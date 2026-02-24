/**
 * Panel Interaction Module
 * Allows panelists to react to candidate answers AND occasionally to each other
 */

import { PanelMember, SaphiraMessage } from './types';
import { Country, getDataset } from './datasetService';

// Country-specific panel names
const PANEL_NAMES: Record<Country, string[]> = {
  nigeria: [
    'Chief Okafor',
    'Mrs. Adeyemi',
    'Engr. Nnamdi',
    'Dr. Okonkwo',
    'Mrs. Adebayo',
    'Prof. Nwosu',
  ],
  kenya: [
    'Mr. Mwangi',
    'Grace Wanjiku',
    'Dr. Ochieng',
    'James Kamau',
    'Sarah Otieno',
    'Peter Kimani',
  ],
  south_africa: [
    'David Nkosi',
    'Thabo Mbeki',
    'Nomsa Dlamini',
    'Johannes Pretorius',
    'Lerato Moloi',
    'Andre Van der Merwe',
  ],
};

// Country-specific panel roles
const PANEL_ROLES: Record<Country, string[]> = {
  nigeria: [
    'CEO',
    'HR Manager',
    'Technical Lead',
    'Department Head',
    'CFO',
    'CTO',
  ],
  kenya: [
    'Managing Director',
    'HR Business Partner',
    'Engineering Manager',
    'Operations Lead',
    'Finance Director',
    'Technical Architect',
  ],
  south_africa: [
    'Chief Executive',
    'Human Resources Director',
    'Technical Manager',
    'Department Manager',
    'Financial Controller',
    'Head of Engineering',
  ],
};

/**
 * Get panel names for a specific country
 */
export function getPanelNames(country: Country): string[] {
  return PANEL_NAMES[country] || PANEL_NAMES.nigeria;
}

/**
 * Get panel roles for a specific country
 */
export function getPanelRoles(country: Country): string[] {
  return PANEL_ROLES[country] || PANEL_ROLES.nigeria;
}

/**
 * Generate culturally appropriate panel for country
 */
export function generateCountryPanel(country: Country, count: number = 3): Array<{ name: string; role: string }> {
  const names = getPanelNames(country);
  const roles = getPanelRoles(country);
  
  const panel: Array<{ name: string; role: string }> = [];
  
  for (let i = 0; i < Math.min(count, names.length); i++) {
    panel.push({
      name: names[i],
      role: roles[i] || roles[0],
    });
  }
  
  return panel;
}

interface PanelInteractionInput {
  candidateAnswer: string;
  previousPanelist: PanelMember | null;
  nextPanelist: PanelMember;
  conversationHistory: SaphiraMessage[];
}

interface PanelInteractionOutput {
  reactionLine: string | null;
  reactionTarget: 'candidate' | 'panelist' | null;
}

// Reactions to candidate answers
const CANDIDATE_REACTIONS = {
  positive: [
    "That's a good point.",
    "I see.",
    "Interesting approach.",
    "That makes sense.",
    "Okay, I understand.",
    "Alright.",
    "Noted.",
  ],
  neutral: [
    "Hmm.",
    "Okay.",
    "I hear you.",
    "Understood.",
    "Right.",
  ],
  skeptical: [
    "Hmm. Are you sure?",
    "That's one perspective.",
    "I see. But...",
    "That's interesting.",
  ],
};

// Reactions to other panelists
const PANELIST_REACTIONS = [
  "I agree with {name}.",
  "That's a valid point, {name}, but I'd like to explore further.",
  "Yes, but from my perspective...",
  "Building on what {name} said...",
  "I see it differently from {name}.",
  "That's true, however...",
  "Good point, {name}. Let me add...",
];

/**
 * Generate panel interaction (reactions between panelists)
 * 
 * Probability:
 * - 60% → Next panelist asks question directly (no reaction)
 * - 25% → Next panelist reacts to candidate first, then asks
 * - 15% → Panelist reacts to previous panelist, then asks
 */
export function generatePanelInteraction(
  input: PanelInteractionInput
): PanelInteractionOutput {
  const { previousPanelist, nextPanelist, candidateAnswer } = input;
  
  const rand = Math.random();
  
  // 60% - No reaction, direct question
  if (rand < 0.6) {
    return { reactionLine: null, reactionTarget: null };
  }
  
  // 25% - React to candidate
  if (rand < 0.85) {
    const reaction = selectCandidateReaction(nextPanelist.personality, candidateAnswer);
    return { 
      reactionLine: reaction, 
      reactionTarget: 'candidate' 
    };
  }
  
  // 15% - React to previous panelist (only if there is one)
  if (previousPanelist && previousPanelist.id !== nextPanelist.id) {
    const reaction = selectPanelistReaction(previousPanelist.name);
    return { 
      reactionLine: reaction, 
      reactionTarget: 'panelist' 
    };
  }
  
  // Fallback - react to candidate
  const reaction = selectCandidateReaction(nextPanelist.personality, candidateAnswer);
  return { 
    reactionLine: reaction, 
    reactionTarget: 'candidate' 
  };
}

function selectCandidateReaction(personality: string, answer: string): string {
  const lowerAnswer = answer.toLowerCase();
  
  // Determine if answer is strong or weak based on length and content
  const isStrongAnswer = answer.length > 100 && 
    (lowerAnswer.includes('because') || 
     lowerAnswer.includes('example') || 
     lowerAnswer.includes('experience'));
  
  // Select reaction set based on personality
  let reactionSet: string[];
  
  switch (personality) {
    case 'supportive':
      reactionSet = isStrongAnswer 
        ? [...CANDIDATE_REACTIONS.positive, "Good!", "That's nice.", "You're on the right track."]
        : CANDIDATE_REACTIONS.positive;
      break;
    case 'strict':
    case 'skeptical':
      reactionSet = isStrongAnswer 
        ? CANDIDATE_REACTIONS.neutral 
        : [...CANDIDATE_REACTIONS.skeptical, "That's not entirely convincing."];
      break;
    case 'technical':
      reactionSet = isStrongAnswer 
        ? [...CANDIDATE_REACTIONS.positive, "Technically sound."]
        : ["I need more detail.", "Can you elaborate?"];
      break;
    case 'direct':
    case 'executive':
      reactionSet = ["Alright.", "Okay.", "I see.", "Understood."];
      break;
    default:
      reactionSet = CANDIDATE_REACTIONS.neutral;
  }
  
  return reactionSet[Math.floor(Math.random() * reactionSet.length)];
}

function selectPanelistReaction(previousPanelistName: string): string {
  const template = PANELIST_REACTIONS[Math.floor(Math.random() * PANELIST_REACTIONS.length)];
  return template.replace('{name}', previousPanelistName);
}

/**
 * Check if we should add a panelist-to-panelist interaction
 * Based on conversation flow and randomness
 */
export function shouldAddPanelInteraction(
  messages: SaphiraMessage[],
  currentPanelist: PanelMember
): boolean {
  // Only add panel interaction every 3-4 exchanges
  const panelMessages = messages.filter(m => m.sender === 'panel-member');
  if (panelMessages.length < 3) return false;
  if (panelMessages.length % 4 !== 0) return false;
  
  // 30% chance for panel interaction
  return Math.random() < 0.3;
}

/**
 * Generate a brief panel discussion between two panelists
 */
export function generateBriefPanelDiscussion(
  panelist1: PanelMember,
  panelist2: PanelMember,
  topic: string
): { speaker: PanelMember; text: string }[] {
  const discussions = [
    [
      { speaker: panelist1, text: `I think ${panelist2.name} raised an important point there.` },
      { speaker: panelist2, text: "Thank you. I believe we should explore this further." },
    ],
    [
      { speaker: panelist1, text: `I'm inclined to agree with ${panelist2.name} on this.` },
      { speaker: panelist2, text: "Appreciated. Shall we move forward?" },
    ],
    [
      { speaker: panelist1, text: "I have a slightly different view here." },
      { speaker: panelist2, text: "That's fair. Let's hear the candidate's thoughts." },
    ],
  ];
  
  return discussions[Math.floor(Math.random() * discussions.length)];
}
