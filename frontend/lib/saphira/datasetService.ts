/**
 * Pan-African Dataset Service
 * Manages interview datasets for Nigeria, Kenya, and South Africa
 */

import { UseCase } from './types';

export type Country = 'nigeria' | 'kenya' | 'south_africa';

// Dataset interfaces
export interface CountryDataset {
  questions: {
    pressure?: string[];
    personality?: string[];
    technical?: string[];
    behavioral?: string[];
    opening?: string[];
    closing?: string[];
    byUseCase?: Record<UseCase, string[]>;
  };
  tone: string;
  fillers: string[];
  reactions: {
    positive: string[];
    neutral: string[];
    skeptical: string[];
  };
  culturalContext: string[];
}

// Nigeria Dataset (Default)
const NIGERIA_DATASET: CountryDataset = {
  questions: {
    pressure: [
      "Are you sure about that?",
      "Can you justify that answer?",
      "That doesn't sound convincing. Tell me more.",
      "Give me a specific example.",
      "How do I know you're telling the truth?",
    ],
    personality: [
      "Tell me about yourself.",
      "Why should we hire you?",
      "What is your biggest weakness?",
      "Where do you see yourself in 5 years?",
      "Why do you want to leave your current job?",
    ],
    technical: [
      "Walk me through your technical process.",
      "How would you handle [specific technical scenario]?",
      "Explain [technical concept] to me.",
    ],
    behavioral: [
      "Tell me about a time you failed.",
      "Describe a conflict you resolved.",
      "Give me an example of leadership.",
    ],
    opening: [
      "Good morning. Thank you for coming in today. Please, have a seat.",
      "Welcome. How was your journey here?",
      "Good morning. Please sit down. Make yourself comfortable.",
    ],
    closing: [
      "Thank you for your time. We'll get back to you within two weeks.",
      "This was a good conversation. We'll be in touch soon.",
      "You did well today. We like what we heard.",
    ],
  },
  tone: `
Nigerian Professional Tone Guide:
- Use "Good morning/afternoon" as standard greeting
- Address senior people with "sir" or "ma" / "madam"
- Code-switch to Pidgin for rapport: "No wahala", "I hear you", "Oya"
- Reference local context: NYSC, Nepa/PHCN, Lagos traffic, fuel scarcity
- Be direct about money, salary, and timelines
- Religious references are common: "By God's grace", "Amen"
- Show warmth but maintain professionalism
- Use phrases like: "Let me be direct with you", "The bottom line is"
- Family obligations matter: acknowledge them briefly
`,
  fillers: ["You see", "Actually", "The thing is", "Let me tell you", "Honestly"],
  reactions: {
    positive: ["Good!", "That's nice.", "Well done.", "I like that.", "Excellent."],
    neutral: ["I see.", "Alright.", "Okay.", "Hmm.", "Continue."],
    skeptical: ["Are you sure?", "Hmm.", "Is that so?", "I need more clarity."],
  },
  culturalContext: [
    "Respect for hierarchy and age",
    "Direct communication about salary",
    "Religious tolerance and references",
    "Understanding of NYSC and national service",
    "Awareness of infrastructure challenges (power, traffic)",
  ],
};

// Kenya Dataset
const KENYA_DATASET: CountryDataset = {
  questions: {
    pressure: [
      "Are you certain about that?",
      "Can you elaborate on that point?",
      "That seems unclear. Please clarify.",
      "Give me concrete evidence.",
      "How can we verify this?",
    ],
    personality: [
      "Tell us about yourself.",
      "Why should we consider you?",
      "What would you say is your area of improvement?",
      "Where do you envision yourself in five years?",
      "What motivates you to seek this opportunity?",
    ],
    technical: [
      "Walk us through your technical approach.",
      "How would you handle [specific scenario]?",
      "Kindly explain [technical concept].",
    ],
    behavioral: [
      "Tell us about a challenge you overcame.",
      "Describe how you handled a disagreement.",
      "Share an example of leading a team.",
    ],
    opening: [
      "Karibu. Thank you for coming. Please have a seat.",
      "Good morning. Welcome. I hope you found us easily.",
      "Thank you for being punctual. Shall we begin?",
    ],
    closing: [
      "Thank you for your time. We will communicate the next steps.",
      "This has been insightful. We shall be in touch.",
      "We appreciate you coming in. We will revert soon.",
    ],
  },
  tone: `
Kenyan Professional Tone Guide:
- Use "Karibu" (welcome) to create warmth
- Polite and diplomatic communication style
- Use "Please" and "Kindly" frequently
- Address people respectfully: "Mr/Mrs", "Sir/Madam"
- Reference local context: Matatu culture, Nairobi traffic, M-Pesa
- Be professional but warm and welcoming
- Use phrases like: "Let us discuss", "Kindly elaborate", "If you don't mind"
- Less direct about money initially - ease into it
- Education and qualifications are highly valued
- Community and teamwork emphasized
`,
  fillers: ["You know", "Actually", "Kindly", "Let us see", "If I may"],
  reactions: {
    positive: ["Good.", "Well done.", "Excellent.", "That is impressive.", "Very good."],
    neutral: ["I see.", "Alright.", "Okay.", "Hmm.", "Continue."],
    skeptical: ["Are you certain?", "Hmm.", "Is that accurate?", "Kindly clarify."],
  },
  culturalContext: [
    "Respect for education and credentials",
    "Diplomatic communication style",
    "Community and ubuntu philosophy",
    "M-Pesa and mobile money familiarity",
    "Nairobi vs upcountry dynamics",
  ],
};

// South Africa Dataset
const SOUTH_AFRICA_DATASET: CountryDataset = {
  questions: {
    pressure: [
      "Can you substantiate that claim?",
      "Please provide evidence for that statement.",
      "That seems unclear. Please clarify.",
      "How can we verify this information?",
      "Are you certain about that?",
    ],
    personality: [
      "Can you tell us about yourself?",
      "Why do you believe you're suitable for this role?",
      "What would you consider your developmental area?",
      "Where do you see yourself in the next five years?",
      "What attracted you to this position?",
    ],
    technical: [
      "Please walk us through your technical methodology.",
      "How would you approach [specific scenario]?",
      "Kindly explain [technical concept] in detail.",
    ],
    behavioral: [
      "Tell us about a significant challenge you overcame.",
      "Describe how you managed a workplace conflict.",
      "Share an example of effective leadership.",
    ],
    opening: [
      "Good morning. Thank you for coming in. Please, have a seat.",
      "Welcome. We appreciate you making the time today.",
      "Thank you for your punctuality. Let's begin.",
    ],
    closing: [
      "Thank you for your time. We will be in touch regarding next steps.",
      "This has been most informative. We shall communicate our decision.",
      "We appreciate your interest. We will revert within the week.",
    ],
  },
  tone: `
South African Professional Tone Guide:
- Professional and structured communication
- Use "Please" and "Thank you" liberally
- Address as "Mr/Ms/Mrs" or by first name if invited
- Reference local context: BEE, load shedding, Gauteng traffic
- Be straightforward but polite
- Use phrases like: "Let's discuss", "Please elaborate", "If you will"
- Professional distance initially, warm up as conversation progresses
- Direct about expectations and deliverables
- Diversity and transformation awareness
- Respect for time and punctuality
`,
  fillers: ["You see", "Basically", " essentially", "Let's see", "If you will"],
  reactions: {
    positive: ["Good.", "Well done.", "Excellent.", "That's good.", "Very nice."],
    neutral: ["I see.", "Alright.", "Okay.", "Hmm.", "Continue."],
    skeptical: ["Are you sure?", "Hmm.", "Is that correct?", "Please clarify."],
  },
  culturalContext: [
    "Respect for diversity and transformation",
    "Professionalism and structure",
    "BEE and economic empowerment awareness",
    "Load shedding and infrastructure challenges",
    "Direct but polite communication",
  ],
};

const DATASETS: Record<Country, CountryDataset> = {
  nigeria: NIGERIA_DATASET,
  kenya: KENYA_DATASET,
  south_africa: SOUTH_AFRICA_DATASET,
};

/**
 * Get dataset for a specific country
 */
export function getDataset(country: Country): CountryDataset {
  return DATASETS[country] || DATASETS.nigeria;
}

/**
 * Get random question from dataset by category
 */
export function getRandomQuestion(
  country: Country,
  category: keyof CountryDataset['questions']
): string | null {
  const dataset = getDataset(country);
  const questions = dataset.questions[category];
  
  // Check if questions is an array
  if (!Array.isArray(questions) || questions.length === 0) {
    return null;
  }
  
  return questions[Math.floor(Math.random() * questions.length)];
}

/**
 * Get cultural tone guide for GPT prompts
 */
export function getToneGuide(country: Country): string {
  return getDataset(country).tone;
}

/**
 * Get random filler phrase for country
 */
export function getRandomFiller(country: Country): string {
  const fillers = getDataset(country).fillers;
  return fillers[Math.floor(Math.random() * fillers.length)];
}

/**
 * Get random reaction for country and sentiment
 */
export function getRandomReaction(
  country: Country,
  sentiment: 'positive' | 'neutral' | 'skeptical'
): string {
  const reactions = getDataset(country).reactions[sentiment];
  return reactions[Math.floor(Math.random() * reactions.length)];
}

/**
 * Get cultural context points for country
 */
export function getCulturalContext(country: Country): string[] {
  return getDataset(country).culturalContext;
}

/**
 * Detect country from user input or context
 * Falls back to Nigeria if unclear
 */
export function detectCountry(input: string): Country {
  const lower = input.toLowerCase();
  
  if (lower.includes('kenya') || lower.includes('nairobi') || lower.includes('swahili') || lower.includes('karibu')) {
    return 'kenya';
  }
  
  if (lower.includes('south africa') || lower.includes('johannesburg') || lower.includes('cape town') || lower.includes('gauteng')) {
    return 'south_africa';
  }
  
  // Default to Nigeria
  return 'nigeria';
}
