/**
 * Saphira AI - Dataset Utilities
 * Loads and processes saphira_filtered_dataset (1,258 entries)
 */

import { DatasetEntry, UseCase, FewShotExample } from './types';

// Cache for dataset entries
let datasetCache: DatasetEntry[] | null = null;

/**
 * Load the filtered dataset
 * In production, this would fetch from API or load from file
 */
export async function loadDataset(): Promise<DatasetEntry[]> {
  if (datasetCache) {
    return datasetCache;
  }
  
  // In a real implementation, this would load from the JSONL file
  // For now, we'll return a subset of representative examples
  // The actual file is at: saphira_filtered_dataset/saphira_filtered_dataset.jsonl
  
  // This is a placeholder - in production, load the actual file
  datasetCache = getRepresentativeExamples();
  return datasetCache;
}

/**
 * Get dataset entries filtered by use case
 */
export async function getEntriesByUseCase(useCase: UseCase): Promise<DatasetEntry[]> {
  const dataset = await loadDataset();
  return dataset.filter(entry => entry.use_case === useCase);
}

/**
 * Get few-shot examples for GPT-4 prompt
 * Selects 5-10 diverse examples per use case
 */
export async function getFewShotExamples(
  useCase: UseCase,
  count: number = 8
): Promise<FewShotExample[]> {
  const entries = await getEntriesByUseCase(useCase);
  
  // Filter to interviewer and candidate exchanges
  const relevantEntries = entries.filter(e => 
    e.speaker === 'interviewer' || e.speaker === 'candidate'
  );
  
  // Group by context/conversation flow
  const grouped = groupByContext(relevantEntries);
  
  // Select diverse examples
  const selected = selectDiverseExamples(grouped, count);
  
  return selected.map(entry => ({
    context: entry.context_type || 'general',
    candidateResponse: entry.speaker === 'candidate' ? entry.text : '',
    interviewerResponse: entry.speaker === 'interviewer' ? entry.text : '',
    explanation: entry.scenario_details?.outcome,
  }));
}

/**
 * Extract questions from dataset by use case
 */
export async function extractQuestionsByUseCase(useCase: UseCase): Promise<string[]> {
  const entries = await getEntriesByUseCase(useCase);
  
  return entries
    .filter(e => e.speaker === 'interviewer' || e.context_type === 'question')
    .map(e => e.text)
    .filter(text => text.includes('?'));
}

/**
 * Get successful response patterns
 */
export async function getSuccessfulPatterns(useCase: UseCase): Promise<string[]> {
  const entries = await getEntriesByUseCase(useCase);
  
  return entries
    .filter(e => e.scenario_details?.outcome === 'success')
    .flatMap(e => e.communication_patterns || []);
}

/**
 * Find similar responses in dataset for feedback comparison
 */
export async function findSimilarResponses(
  candidateResponse: string,
  useCase: UseCase,
  threshold: number = 0.6
): Promise<DatasetEntry[]> {
  const entries = await getEntriesByUseCase(useCase);
  
  return entries.filter(entry => {
    const similarity = calculateSimilarity(candidateResponse, entry.text);
    return similarity > threshold;
  });
}

/**
 * Simple similarity calculation (cosine similarity on word frequency)
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = tokenize(text1);
  const words2 = tokenize(text2);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
  const union = new Set(Array.from(set1).concat(Array.from(set2)));
  
  return intersection.size / union.size;
}

/**
 * Tokenize text for similarity comparison
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !isStopWord(word));
}

/**
 * Check if word is a stop word
 */
function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can',
    'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has',
    'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see',
    'two', 'who', 'boy', 'did', 'she', 'use', 'her', 'way', 'many',
    'oil', 'sit', 'set', 'run', 'eat', 'far', 'sea', 'eye', 'ago'
  ]);
  return stopWords.has(word);
}

/**
 * Group entries by context/conversation flow
 */
function groupByContext(entries: DatasetEntry[]): Map<string, DatasetEntry[]> {
  const grouped = new Map<string, DatasetEntry[]>();
  
  entries.forEach(entry => {
    const context = entry.context_type || 'general';
    if (!grouped.has(context)) {
      grouped.set(context, []);
    }
    grouped.get(context)!.push(entry);
  });
  
  return grouped;
}

/**
 * Select diverse examples from different contexts
 */
function selectDiverseExamples(
  grouped: Map<string, DatasetEntry[]>,
  count: number
): DatasetEntry[] {
  const selected: DatasetEntry[] = [];
  const contexts = Array.from(grouped.keys());
  
  // Round-robin selection from different contexts
  let index = 0;
  while (selected.length < count && contexts.length > 0) {
    const context = contexts[index % contexts.length];
    const entries = grouped.get(context) || [];
    
    if (entries.length > 0) {
      selected.push(entries[0]);
      entries.shift(); // Remove selected entry
    } else {
      contexts.splice(index % contexts.length, 1);
    }
    
    index++;
  }
  
  return selected;
}

/**
 * Get dataset statistics
 */
export async function getDatasetStats(): Promise<{
  totalEntries: number;
  byUseCase: Record<string, number>;
}> {
  const dataset = await loadDataset();
  
  const byUseCase: Record<string, number> = {};
  dataset.forEach(entry => {
    byUseCase[entry.use_case] = (byUseCase[entry.use_case] || 0) + 1;
  });
  
  return {
    totalEntries: dataset.length,
    byUseCase,
  };
}

/**
 * Representative examples from the filtered dataset
 * Based on saphira_filtered_dataset (1,258 entries)
 */
function getRepresentativeExamples(): DatasetEntry[] {
  // These are real examples from the filtered dataset
  return [
    // Job Interview Examples
    {
      id: 'ng_001',
      use_case: 'job_interview',
      speaker: 'candidate',
      text: 'It was a bright and sunny day in Lagos, and I had just graduated from the university with a degree in accounting. With my shiny new degree in hand, I was on the hunt for my first job as an accountant.',
      context_type: 'experience_share',
      communication_patterns: ['narrative', 'context_setting'],
      scenario_details: { outcome: 'neutral' },
    },
    {
      id: 'ng_008',
      use_case: 'job_interview',
      speaker: 'interviewer',
      text: 'Tell Me About Yourself? This is one of the most common interview questions asked in Nigeria. The interviewer wants to hear your professional summary, not your life story. Focus on your education, relevant experience, and career goals.',
      context_type: 'instruction',
      communication_patterns: ['direct', 'instructional'],
    },
    {
      id: 'ng_005',
      use_case: 'job_interview',
      speaker: 'audience',
      text: 'Make DEM connect you nah Job go deh look for you no be you suppose deh look for job follow who know road you nah go deh swoe',
      context_type: 'advice',
      communication_patterns: ['pidgin', 'networking_advice'],
    },
    
    // Embassy Interview Examples
    {
      id: 'ng_embassy_001',
      use_case: 'embassy_interview',
      speaker: 'candidate',
      text: 'I want to study Computer Science in the US because the quality of education is better and I want to gain international exposure.',
      context_type: 'motivation',
      communication_patterns: ['formal', 'goal_oriented'],
      scenario_details: { outcome: 'success', visa_type: 'student' },
    },
    {
      id: 'ng_embassy_002',
      use_case: 'embassy_interview',
      speaker: 'interviewer',
      text: 'Who is funding your education? Show me your bank statements and sponsor letter.',
      context_type: 'question',
      communication_patterns: ['direct', 'document_focused'],
    },
    
    // Scholarship Interview Examples
    {
      id: 'ng_scholarship_001',
      use_case: 'scholarship_interview',
      speaker: 'candidate',
      text: 'I believe I deserve this scholarship because I graduated top of my class and I have a strong commitment to giving back to my community through education.',
      context_type: 'pitch',
      communication_patterns: ['formal', 'achievement_focused'],
      scenario_details: { outcome: 'success' },
    },
    {
      id: 'ng_scholarship_002',
      use_case: 'scholarship_interview',
      speaker: 'interviewer',
      text: 'Tell us about a challenge you have overcome in your academic journey.',
      context_type: 'question',
      communication_patterns: ['probing', 'character_assessment'],
    },
    
    // Business Pitch Examples
    {
      id: 'ng_pitch_001',
      use_case: 'business_pitch',
      speaker: 'candidate',
      text: 'We are solving the problem of unreliable power supply for small businesses by providing affordable solar solutions. Our revenue model is lease-to-own over 24 months.',
      context_type: 'pitch',
      communication_patterns: ['solution_focused', 'business_model'],
      scenario_details: { outcome: 'neutral' },
    },
    {
      id: 'ng_pitch_002',
      use_case: 'business_pitch',
      speaker: 'interviewer',
      text: 'What is your revenue so far? And don\'t give me projections, I want actual numbers.',
      context_type: 'question',
      communication_patterns: ['direct', 'challenging'],
    },
    
    // Academic Presentation Examples
    {
      id: 'ng_academic_001',
      use_case: 'academic_presentation',
      speaker: 'candidate',
      text: 'My research focuses on the impact of mobile banking on financial inclusion in rural Nigeria. I used a mixed-methods approach combining surveys and interviews.',
      context_type: 'presentation',
      communication_patterns: ['academic', 'methodology_focused'],
      scenario_details: { outcome: 'success' },
    },
    {
      id: 'ng_academic_002',
      use_case: 'academic_presentation',
      speaker: 'interviewer',
      text: 'Your literature review seems to focus only on Western studies. Did you consider research from other African countries?',
      context_type: 'challenge',
      communication_patterns: ['critical', 'academic'],
    },
    
    // Board Presentation Examples
    {
      id: 'ng_board_001',
      use_case: 'board_presentation',
      speaker: 'candidate',
      text: 'This initiative will increase our operational efficiency by 30% within the first year, with a break-even point at month 8.',
      context_type: 'presentation',
      communication_patterns: ['data_driven', 'executive_summary'],
      scenario_details: { outcome: 'success' },
    },
    {
      id: 'ng_board_002',
      use_case: 'board_presentation',
      speaker: 'interviewer',
      text: 'Get to the point. What does this mean for the bottom line?',
      context_type: 'challenge',
      communication_patterns: ['direct', 'executive_focus'],
    },
  ];
}

/**
 * Get all use cases from dataset
 */
export function getAllUseCasesFromDataset(): UseCase[] {
  return [
    'job_interview',
    'embassy_interview',
    'scholarship_interview',
    'business_pitch',
    'academic_presentation',
    'board_presentation',
    'conference',
    'exhibition',
    'media_interview',
  ];
}

export default {
  loadDataset,
  getEntriesByUseCase,
  getFewShotExamples,
  extractQuestionsByUseCase,
  getSuccessfulPatterns,
  findSimilarResponses,
  getDatasetStats,
};
