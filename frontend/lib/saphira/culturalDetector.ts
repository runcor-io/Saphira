/**
 * Saphira AI - Cultural Context Detector
 * Detects Nigerian communication patterns in candidate responses
 */

import { 
  CulturalContext, 
  ResponseAnalysis, 
  EvasionType, 
  ConfidenceLevel 
} from './types';

// Pidgin English patterns
const PIDGIN_PATTERNS = {
  common: [
    'dey', 'wey', 'na', 'abi', 'sha', 'omo', 'wahala', 'abeg', 'shey',
    'naim', 'kpele', 'how far', 'wetin', 'no be', 'don', 'go', 'come'
  ],
  sentence_starters: [
    'as in', 'you know', 'actually', 'like', 'so like', 'err'
  ],
  fillers: [
    'sha', 'now', 'o', 'na', 'abi', 'ba'
  ]
};

// Religious reference patterns
const RELIGIOUS_PATTERNS = [
  /\b(by\s+god'?s?\s+grace|by\s+allah'?s?\s+will|in\s+jesus'?\s?name|insha\s*allah)\b/gi,
  /\b(if\s+god\s+permits|god\s+willing|prayerfully|blessed|miracle)\b/gi,
  /\b(thank\s+god|praise\s+god|all\s+glory\s+to)\b/gi,
  /\b(i\s+pray|let\s+us\s+pray|we\s+pray)\b/gi,
  /\b(it\s+is\s+well|god\s+will\s+provide|jehovah\s+jireh)\b/gi,
];

// Hierarchy/deference markers
const DEFERENCE_PATTERNS = [
  /\b(sir|ma|madam)\b/gi,
  /\b(with\s+(due\s+)?respect|begging|if\s+i\s+may)\b/gi,
  /\b(your\s+(highness|excellency|honour|lordship))\b/gi,
  /\b(as\s+you\s+command|as\s+you\s+wish|at\s+your\s+service)\b/gi,
];

// Family obligation indicators
const FAMILY_PATTERNS = [
  /\b(support\s+(my\s+)?family|take\s+care\s+of|parents|siblings)\b/gi,
  /\b(first\s+born|responsibility\s+for|family\s+obligations?)\b/gi,
  /\b(mother|father|sibling|brother|sister)\s+need\b/gi,
  /\b(hustle\s+for|struggle\s+for)\s+my\s+family\b/gi,
];

// Nervousness indicators
const NERVOUSNESS_PATTERNS = [
  /\b(uh+|um+|err+|ah+|erm+)\b/gi,
  /\b(actually|basically|you\s+know|like|sort\s+of|kind\s+of)\b/gi,
  /[.]{3,}/g, // Multiple dots
  /\b(i\s+think|i\s+guess|maybe|perhaps|possibly)\b/gi,
];

// Overconfidence indicators
const OVERCONFIDENCE_PATTERNS = [
  /\b(i\s+can\s+do\s+anything|i\s+am\s+the\s+best|unbeatable|unmatched)\b/gi,
  /\b(i\s+never\s+fail|always\s+succeed|perfect|flawless)\b/gi,
  /\b(i\s+know\s+everything|i\s+don't\s+need|easy\s+for\s+me)\b/gi,
  /\b(obviously|clearly|definitely|absolutely)(\s+\w+){0,3}\s+i\s+can\b/gi,
];

// Defensive patterns
const DEFENSIVE_PATTERNS = [
  /\b(with\s+all\s+due\s+respect|no\s+offense\s+but|not\s+to\s+be)\b/gi,
  /\b(that'?s\s+not\s+(fair|true|correct)|i\s+disagree|i\s+beg\s+to\s+differ)\b/gi,
  /\b(actually,\s+i|but\s+i|however,\s+i)\b/gi,
];

// Apologetic patterns
const APOLOGETIC_PATTERNS = [
  /\b(i\s+apologize|i'?m\s+sorry|please\s+forgive|my\s+bad)\b/gi,
  /\b(i\s+don'?t\s+mean\s+to|i\s+hope\s+i'?m\s+not|if\s+i\s+may)\b/gi,
];

// Enthusiasm indicators
const ENTHUSIASM_PATTERNS = [
  /\b(excited|thrilled|passionate|love|dream|opportunity)\b/gi,
  /!{2,}/g, // Multiple exclamation marks
  /\b(can'?t\s+wait|looking\s+forward|eager|enthusiastic)\b/gi,
];

// Evasion patterns
const EVASION_PATTERNS = {
  circular_story: /(?:then|after that|so|and then|next|following that).{50,}(?:then|after that|so|and then)/i,
  vague_generalities: /\b(basically|you know|sort of|kind of|stuff like that|things like that|and so on)\b/gi,
  excessive_context: /^(?:well|so|okay|you see|the thing is).{100,}before/i,
  filler_words: /\b(like|you know|actually|basically|sort of|kind of)\b/gi,
};

// Direct answer indicators
const DIRECT_ANSWER_INDICATORS = [
  /\b(yes|no|specifically|exactly|the answer is|to answer your question)\b/i,
  /\b(my\s+role\s+was|i\s+was\s+responsible|i\s+led|i\s+managed)\b/i,
  /\b(the\s+result\s+was|we\s+achieved|the\s+outcome\s+was)\b/i,
];

// Technical jargon indicators
const TECHNICAL_JARGON_PATTERNS = [
  /\b(leverage|synergy|paradigm|optimize|strategic|scalable)\b/gi,
  /\b(algorithm|framework|architecture|infrastructure|implementation)\b/gi,
];

// Number/date patterns
const NUMBER_PATTERNS = [
  /\b\d+\s*(percent|%|million|billion|thousand|hundred)\b/gi,
  /\b\d{4}\b/g, // Years
  /\b(first|second|third|fourth)\b/gi,
  /\b(in\s+20\d{2}|for\s+\d+\s+years?)\b/gi,
];

/**
 * Extract Pidgin phrases from text
 */
function extractPidginPhrases(text: string): string[] {
  const phrases: string[] = [];
  const lower = text.toLowerCase();
  
  PIDGIN_PATTERNS.common.forEach(word => {
    if (lower.includes(word)) phrases.push(word);
  });
  
  return phrases;
}

/**
 * Extract religious references
 */
function extractReligiousRefs(text: string): string[] {
  const refs: string[] = [];
  
  RELIGIOUS_PATTERNS.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) refs.push(...matches);
  });
  
  return refs;
}

/**
 * Extract hierarchy/deference markers
 */
function extractHierarchyMarkers(text: string): string[] {
  const markers: string[] = [];
  
  DEFERENCE_PATTERNS.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) markers.push(...matches);
  });
  
  return markers;
}

/**
 * Detect if answer mentions family obligations
 */
function detectFamilyObligations(text: string): boolean {
  return FAMILY_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Detect confidence level
 */
function detectConfidence(text: string): ConfidenceLevel {
  const nervousCount = countMatches(text, NERVOUSNESS_PATTERNS);
  const overconfidentCount = countMatches(text, OVERCONFIDENCE_PATTERNS);
  const directIndicators = countMatches(text, DIRECT_ANSWER_INDICATORS);
  
  // High confidence: direct, no nervousness, no overcompensation
  if (directIndicators >= 2 && nervousCount <= 1 && overconfidentCount <= 1) {
    return 'high';
  }
  
  // Low confidence: nervous or defensive
  if (nervousCount >= 3 || overconfidentCount >= 3) {
    return 'low';
  }
  
  return 'medium';
}

/**
 * Detect nervousness
 */
function detectNervousness(text: string): boolean {
  const nervousCount = countMatches(text, NERVOUSNESS_PATTERNS);
  const wordCount = text.split(/\s+/).length;
  
  // More than 3 nervous indicators or excessive hesitations
  return nervousCount >= 3 || (nervousCount / wordCount > 0.1);
}

/**
 * Detect overconfidence
 */
function detectOverconfidence(text: string): boolean {
  return countMatches(text, OVERCONFIDENCE_PATTERNS) >= 2;
}

/**
 * Detect evasiveness
 */
function detectEvasiveness(text: string): {
  isEvasive: boolean;
  type: EvasionType;
  confidence: number;
} {
  const wordCount = text.split(/\s+/).length;
  const hasDirectAnswer = DIRECT_ANSWER_INDICATORS.some(p => p.test(text));
  
  // Excessive context: long answer without direct answer
  if (wordCount > 100 && !hasDirectAnswer) {
    return { isEvasive: true, type: 'excessive_context', confidence: 0.8 };
  }
  
  // Circular story: repeated transitions
  if (EVASION_PATTERNS.circular_story.test(text)) {
    return { isEvasive: true, type: 'circular_story', confidence: 0.75 };
  }
  
  // Vague generalities: many filler words
  const fillerMatches = text.match(EVASION_PATTERNS.vague_generalities);
  if (fillerMatches && fillerMatches.length > 3) {
    return { isEvasive: true, type: 'vague_generalities', confidence: 0.7 };
  }
  
  return { isEvasive: false, type: 'none', confidence: 0 };
}

/**
 * Count regex matches
 */
function countMatches(text: string, patterns: RegExp[]): number {
  let count = 0;
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  });
  return count;
}

/**
 * Check if response has specific examples
 */
function hasSpecificExample(text: string): boolean {
  // Look for past tense action verbs with specifics
  return /\b(i\s+(led|managed|created|built|developed|implemented|designed|worked|solved))\b/i.test(text) &&
         // And either numbers or specific details
         (NUMBER_PATTERNS.some(p => p.test(text)) || /\b(project|team|system|product|company)\b/i.test(text));
}

/**
 * Check if response has numbers/metrics
 */
function hasNumbers(text: string): boolean {
  return NUMBER_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Check if question was answered directly
 */
function answeredDirectly(text: string): boolean {
  return DIRECT_ANSWER_INDICATORS.some(pattern => pattern.test(text)) ||
         text.split(/\s+/).length < 30; // Short answers are usually direct
}

/**
 * Check for technical jargon
 */
function hasTechnicalJargon(text: string): boolean {
  return TECHNICAL_JARGON_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Detect defensive tone
 */
function detectDefensive(text: string): boolean {
  return countMatches(text, DEFENSIVE_PATTERNS) >= 1;
}

/**
 * Detect apologetic tone
 */
function detectApologetic(text: string): boolean {
  return countMatches(text, APOLOGETIC_PATTERNS) >= 1;
}

/**
 * Detect enthusiasm
 */
function detectEnthusiasm(text: string): boolean {
  return countMatches(text, ENTHUSIASM_PATTERNS) >= 2;
}

/**
 * Check relevance to question (simplified)
 */
function checkRelevance(candidateResponse: string, question: string): boolean {
  // Extract keywords from question
  const questionKeywords = question.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['what', 'when', 'where', 'which', 'about', 'tell', 'your', 'have', 'this', 'that'].includes(w));
  
  const responseLower = candidateResponse.toLowerCase();
  
  // Check if at least one keyword appears in response
  return questionKeywords.some(keyword => responseLower.includes(keyword));
}

/**
 * Main function: Detect cultural context from candidate response
 */
export function detectCulturalContext(
  candidateResponse: string,
  question?: string
): CulturalContext {
  const lower = candidateResponse.toLowerCase();
  
  const pidginPhrases = extractPidginPhrases(candidateResponse);
  const religiousRefs = extractReligiousRefs(candidateResponse);
  const hierarchyMarkers = extractHierarchyMarkers(candidateResponse);
  
  return {
    usesPidgin: pidginPhrases.length > 0,
    pidginPhrases,
    religiousReferences: religiousRefs,
    hierarchyMarkers,
    familyObligations: detectFamilyObligations(candidateResponse),
    mentionsGod: religiousRefs.some(r => r.toLowerCase().includes('god') || r.toLowerCase().includes('allah')),
    confidenceLevel: detectConfidence(candidateResponse),
    nervousness: detectNervousness(candidateResponse),
    overconfidence: detectOverconfidence(candidateResponse),
    evasiveness: detectEvasiveness(candidateResponse),
    excessiveRespect: hierarchyMarkers.length > 2,
  };
}

/**
 * Full response analysis
 */
export function analyzeResponse(
  candidateResponse: string,
  question?: string
): ResponseAnalysis {
  const wordCount = candidateResponse.split(/\s+/).length;
  
  return {
    cultural: detectCulturalContext(candidateResponse, question),
    content: {
      hasSpecificExample: hasSpecificExample(candidateResponse),
      hasNumbers: hasNumbers(candidateResponse),
      wordCount,
      answeredDirectly: answeredDirectly(candidateResponse),
      technicalJargon: hasTechnicalJargon(candidateResponse),
      relevantToQuestion: question ? checkRelevance(candidateResponse, question) : true,
    },
    tone: {
      defensive: detectDefensive(candidateResponse),
      apologetic: detectApologetic(candidateResponse),
      enthusiastic: detectEnthusiasm(candidateResponse),
    },
  };
}

/**
 * Get evasion response template
 */
export function getEvasionResponse(evasionType: EvasionType): string {
  const responses = {
    circular_story: [
      "Let me stop you there. I asked a specific question. Can you give me a direct answer - yes or no, then explain?",
      "You're giving me a timeline, not an answer. What was YOUR specific contribution?",
      "I need you to focus. Answer the question directly.",
    ],
    vague_generalities: [
      "That's a bit general. Can you give me a specific example with numbers or dates?",
      "I need more detail. What exactly did you do?",
      "Be specific. What was the actual outcome?",
    ],
    excessive_context: [
      "I appreciate the background, but what specifically was YOUR role in this?",
      "Let's cut to the chase. What was the result?",
      "I understand the context, but I asked a specific question. Please answer directly.",
    ],
    none: [],
  };
  
  const options = responses[evasionType];
  return options[Math.floor(Math.random() * options.length)] || "";
}

/**
 * Generate cultural adaptation note for interviewer
 */
export function generateCulturalAdaptation(context: CulturalContext): string {
  const adaptations: string[] = [];
  
  if (context.usesPidgin) {
    adaptations.push("Candidate uses Pidgin - respond warmly but maintain professionalism.");
  }
  
  if (context.religiousReferences.length > 0) {
    adaptations.push("Acknowledged religious reference briefly, redirect to professional matters.");
  }
  
  if (context.excessiveRespect) {
    adaptations.push("Excessive deference detected - try to equalize and build confidence.");
  }
  
  if (context.nervousness) {
    adaptations.push("Candidate seems nervous - use encouraging tone.");
  }
  
  if (context.overconfidence) {
    adaptations.push("Overconfidence detected - challenge with specific follow-up.");
  }
  
  if (context.evasiveness.isEvasive) {
    adaptations.push(`Evasive answer (${context.evasiveness.type}) - redirect for direct answer.`);
  }
  
  return adaptations.join(" ");
}

export default {
  detectCulturalContext,
  analyzeResponse,
  getEvasionResponse,
  generateCulturalAdaptation,
};
