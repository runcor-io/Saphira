/**
 * Interview Memory System
 * Stores and retrieves conversation context for smarter follow-up questions
 */

export interface InterviewMemory {
  candidateName: string;
  education: string;
  experience: string;
  skills: string[];
  previousAnswers: Array<{
    stage: string;
    question: string;
    answer: string;
    timestamp: number;
  }>;
  lastQuestion: string;
  topicsDiscussed: string[];
  questionsAsked: string[]; // Track all questions asked
}

/**
 * Create empty memory
 */
export function createMemory(): InterviewMemory {
  return {
    candidateName: '',
    education: '',
    experience: '',
    skills: [],
    previousAnswers: [],
    lastQuestion: '',
    topicsDiscussed: [],
    questionsAsked: [],
  };
}

/**
 * Update memory with new information
 */
export function updateMemory(
  memory: InterviewMemory,
  updates: Partial<InterviewMemory>
): InterviewMemory {
  return {
    ...memory,
    ...updates,
  };
}

/**
 * Store an answer in memory
 */
export function storeAnswer(
  memory: InterviewMemory,
  stage: string,
  question: string,
  answer: string
): InterviewMemory {
  const newAnswer = {
    stage,
    question,
    answer,
    timestamp: Date.now(),
  };
  
  // Extract skills mentioned
  const skills = extractSkills(answer);
  
  // Extract topics discussed
  const topics = extractTopics(answer);
  
  return {
    ...memory,
    previousAnswers: [...memory.previousAnswers, newAnswer],
    skills: Array.from(new Set([...memory.skills, ...skills])),
    topicsDiscussed: Array.from(new Set([...memory.topicsDiscussed, ...topics])),
    lastQuestion: question,
  };
}

/**
 * Extract skills from answer text
 */
function extractSkills(answer: string): string[] {
  const skills: string[] = [];
  const lowerAnswer = answer.toLowerCase();
  
  // Common technical skills
  const techSkills = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust',
    'react', 'vue', 'angular', 'node.js', 'express', 'django', 'flask',
    'sql', 'postgresql', 'mongodb', 'mysql', 'redis',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
    'git', 'github', 'gitlab', 'ci/cd', 'jenkins',
    'machine learning', 'ai', 'data science', 'analytics',
    'leadership', 'management', 'communication', 'problem solving',
    'agile', 'scrum', 'kanban', 'jira', 'confluence',
  ];
  
  for (const skill of techSkills) {
    if (lowerAnswer.includes(skill)) {
      skills.push(skill);
    }
  }
  
  return skills;
}

/**
 * Extract topics from answer text
 */
function extractTopics(answer: string): string[] {
  const topics: string[] = [];
  const lowerAnswer = answer.toLowerCase();
  
  // Topic keywords
  const topicMap: Record<string, string[]> = {
    'frontend': ['frontend', 'ui', 'ux', 'design', 'css', 'html', 'react', 'vue'],
    'backend': ['backend', 'server', 'api', 'database', 'sql'],
    'mobile': ['mobile', 'ios', 'android', 'flutter', 'react native'],
    'devops': ['devops', 'deployment', 'ci/cd', 'docker', 'kubernetes'],
    'management': ['management', 'leadership', 'team lead', 'managed team'],
    'startup': ['startup', 'founded', 'co-founder', 'early stage'],
    'enterprise': ['enterprise', 'corporate', 'large company'],
    'consulting': ['consulting', 'client', 'consultant'],
  };
  
  for (const [topic, keywords] of Object.entries(topicMap)) {
    if (keywords.some(kw => lowerAnswer.includes(kw))) {
      topics.push(topic);
    }
  }
  
  return topics;
}

/**
 * Get memory summary for context
 */
export function getMemorySummary(memory: InterviewMemory): string {
  const parts: string[] = [];
  
  if (memory.candidateName) {
    parts.push(`Candidate name: ${memory.candidateName}`);
  }
  
  if (memory.education) {
    parts.push(`Education: ${memory.education}`);
  }
  
  if (memory.experience) {
    parts.push(`Experience: ${memory.experience}`);
  }
  
  if (memory.skills.length > 0) {
    parts.push(`Skills mentioned: ${memory.skills.join(', ')}`);
  }
  
  if (memory.topicsDiscussed.length > 0) {
    parts.push(`Topics discussed: ${memory.topicsDiscussed.join(', ')}`);
  }
  
  return parts.join('. ');
}

/**
 * Get previous answer by stage
 */
export function getPreviousAnswerByStage(
  memory: InterviewMemory,
  stage: string
): { question: string; answer: string } | null {
  const answer = memory.previousAnswers.find(a => a.stage === stage);
  if (answer) {
    return { question: answer.question, answer: answer.answer };
  }
  return null;
}

/**
 * Get last N answers
 */
export function getRecentAnswers(
  memory: InterviewMemory,
  count: number = 3
): Array<{ question: string; answer: string; stage: string }> {
  return memory.previousAnswers
    .slice(-count)
    .map(a => ({
      question: a.question,
      answer: a.answer,
      stage: a.stage,
    }));
}

/**
 * Check if candidate mentioned specific topic
 */
export function hasDiscussedTopic(
  memory: InterviewMemory,
  topic: string
): boolean {
  return memory.topicsDiscussed.some(t => 
    t.toLowerCase().includes(topic.toLowerCase())
  );
}

/**
 * Get skills for follow-up question
 */
export function getSkillForFollowUp(memory: InterviewMemory): string | null {
  if (memory.skills.length === 0) return null;
  
  // Return the first skill that hasn't been deeply discussed
  return memory.skills[0];
}

/**
 * Clear memory
 */
export function clearMemory(): InterviewMemory {
  return createMemory();
}
