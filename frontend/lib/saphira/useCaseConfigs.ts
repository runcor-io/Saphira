/**
 * Saphira AI - Use Case Configurations
 * Based on saphira_filtered_dataset (1,258 entries)
 */

import { UseCaseConfig, UseCase, PanelMember } from './types';

// Nigerian voice IDs from ElevenLabs
const NIGERIAN_VOICES = {
  male1: 'U7wWSnxIJwCjioxt86mk', // Olaniyi Victor - Warm, calming
  male2: '77aEIu0qStu8Jwv1EdhX', // Ayinde - Deep and melodic
  male3: 'tj0Lij6AHHeCO5FylYzu', // Chief Okafor / Tunde - Authoritative
  female1: 'Y4Xi1YBz9HedbrvzwylK', // Nigerian Female - Professional
};

/**
 * Default panels for each use case
 */
const DEFAULT_PANELS: Record<UseCase, PanelMember[]> = {
  job_interview: [
    {
      id: 'hr-manager',
      name: 'Mrs. Adebayo',
      role: 'HR Manager',
      personality: 'supportive',
      voiceId: NIGERIAN_VOICES.female1,
      focus: 'culture_fit',
      gender: 'female',
    },
    {
      id: 'tech-lead',
      name: 'Engr. Nnamdi',
      role: 'Technical Lead',
      personality: 'technical',
      voiceId: NIGERIAN_VOICES.male1,
      focus: 'technical_depth',
      gender: 'male',
    },
    {
      id: 'department-head',
      name: 'Chief Okafor',
      role: 'Department Head',
      personality: 'direct',
      voiceId: NIGERIAN_VOICES.male3,
      focus: 'leadership',
      gender: 'male',
    },
  ],

  embassy_interview: [
    {
      id: 'visa-officer',
      name: 'Officer Adeleke',
      role: 'Visa Officer',
      personality: 'skeptical',
      voiceId: NIGERIAN_VOICES.male2,
      focus: 'immigrant_intent_detection',
      gender: 'male',
    },
  ],

  scholarship_interview: [
    {
      id: 'professor-1',
      name: 'Prof. Adeyemi',
      role: 'Department Head',
      personality: 'strict',
      voiceId: NIGERIAN_VOICES.male1,
      focus: 'research_capability',
      gender: 'male',
    },
    {
      id: 'professor-2',
      name: 'Dr. Okonkwo',
      role: 'External Examiner',
      personality: 'technical',
      voiceId: NIGERIAN_VOICES.male2,
      focus: 'methodology',
      gender: 'male',
    },
    {
      id: 'industry-partner',
      name: 'Mrs. Ibrahim',
      role: 'Industry Partner',
      personality: 'supportive',
      voiceId: NIGERIAN_VOICES.female1,
      focus: 'practical_application',
      gender: 'female',
    },
  ],

  business_pitch: [
    {
      id: 'investor-1',
      name: 'Chief Okafor',
      role: 'Lead Investor',
      personality: 'direct',
      voiceId: NIGERIAN_VOICES.male3,
      focus: 'business_model',
      gender: 'male',
    },
    {
      id: 'investor-2',
      name: 'Mrs. Adebayo',
      role: 'CFO',
      personality: 'analytical',
      voiceId: NIGERIAN_VOICES.female1,
      focus: 'financials',
      gender: 'female',
    },
    {
      id: 'technical-advisor',
      name: 'Engr. Nnamdi',
      role: 'Technical Advisor',
      personality: 'technical',
      voiceId: NIGERIAN_VOICES.male1,
      focus: 'technical_feasibility',
      gender: 'male',
    },
  ],

  academic_presentation: [
    {
      id: 'supervisor',
      name: 'Prof. Nwosu',
      role: 'Supervisor',
      personality: 'supportive',
      voiceId: NIGERIAN_VOICES.male1,
      focus: 'research_quality',
      gender: 'male',
    },
    {
      id: 'external-examiner',
      name: 'Dr. Abdullahi',
      role: 'External Examiner',
      personality: 'strict',
      voiceId: NIGERIAN_VOICES.male2,
      focus: 'methodology_rigor',
      gender: 'male',
    },
  ],

  board_presentation: [
    {
      id: 'ceo',
      name: 'Chief Okafor',
      role: 'CEO',
      personality: 'direct',
      voiceId: NIGERIAN_VOICES.male3,
      focus: 'strategic_alignment',
      gender: 'male',
    },
    {
      id: 'cfo',
      name: 'Mrs. Adebayo',
      role: 'CFO',
      personality: 'analytical',
      voiceId: NIGERIAN_VOICES.female1,
      focus: 'financial_roi',
      gender: 'female',
    },
    {
      id: 'hr-director',
      name: 'Mrs. Okonkwo',
      role: 'HR Director',
      personality: 'supportive',
      voiceId: NIGERIAN_VOICES.female1,
      focus: 'team_impact',
      gender: 'female',
    },
    {
      id: 'cto',
      name: 'Engr. Nnamdi',
      role: 'CTO',
      personality: 'technical',
      voiceId: NIGERIAN_VOICES.male1,
      focus: 'technical_implementation',
      gender: 'male',
    },
  ],

  conference: [
    {
      id: 'moderator',
      name: 'Dr. Adeyemi',
      role: 'Session Moderator',
      personality: 'supportive',
      voiceId: NIGERIAN_VOICES.male1,
      focus: 'audience_engagement',
      gender: 'male',
    },
    {
      id: 'expert-panelist',
      name: 'Prof. Okonkwo',
      role: 'Expert Panelist',
      personality: 'technical',
      voiceId: NIGERIAN_VOICES.male2,
      focus: 'technical_depth',
      gender: 'male',
    },
  ],

  exhibition: [
    {
      id: 'visitor-1',
      name: 'Mr. Ibrahim',
      role: 'Potential Client',
      personality: 'skeptical',
      voiceId: NIGERIAN_VOICES.male2,
      focus: 'product_value',
      gender: 'male',
    },
    {
      id: 'visitor-2',
      name: 'Mrs. Ngozi',
      role: 'Industry Observer',
      personality: 'supportive',
      voiceId: NIGERIAN_VOICES.female1,
      focus: 'innovation_potential',
      gender: 'female',
    },
  ],

  media_interview: [
    {
      id: 'journalist',
      name: 'Ms. Chioma',
      role: 'Senior Journalist',
      personality: 'direct',
      voiceId: NIGERIAN_VOICES.female1,
      focus: 'controversial_angles',
      gender: 'female',
    },
  ],
};

/**
 * Use case configurations based on filtered dataset analysis
 * 352 job interviews, 331 embassy, 212 scholarship, 170 business pitch, etc.
 */
export const USE_CASE_CONFIGS: Record<UseCase, UseCaseConfig> = {
  job_interview: {
    id: 'job_interview',
    displayName: 'Job Interview',
    description: 'Practice job interviews with HR, technical, and leadership questions',
    formalityLevel: 'semi_formal',
    directnessLevel: 'medium',
    expectedDuration: 20,
    minQuestions: 5,
    maxQuestions: 10,
    keyQuestions: [
      'Tell me about yourself',
      'Why do you want to work here?',
      'What are your strengths and weaknesses?',
      'Tell me about a challenging situation',
      'Where do you see yourself in 5 years?',
      'What is your salary expectation?',
    ],
    culturalMarkers: ['nysc_reference', 'salary_expectation', 'family_obligation'],
    defaultPanel: DEFAULT_PANELS.job_interview,
    icon: 'Briefcase',
  },

  embassy_interview: {
    id: 'embassy_interview',
    displayName: 'Embassy/Visa Interview',
    description: 'Practice visa interviews for study, work, or travel abroad',
    formalityLevel: 'formal',
    directnessLevel: 'high',
    expectedDuration: 5,
    minQuestions: 3,
    maxQuestions: 8,
    keyQuestions: [
      'Why do you want to go to this country?',
      'Who is funding your trip?',
      'What ties do you have to Nigeria?',
      'What will you do after your studies?',
      'Have you been refused a visa before?',
    ],
    culturalMarkers: ['document_focused', 'suspicion_of_immigrant_intent', 'funding_proof'],
    defaultPanel: DEFAULT_PANELS.embassy_interview,
    icon: 'Plane',
  },

  scholarship_interview: {
    id: 'scholarship_interview',
    displayName: 'Scholarship Interview',
    description: 'Practice academic scholarship and PhD admission interviews',
    formalityLevel: 'formal',
    directnessLevel: 'medium',
    expectedDuration: 15,
    minQuestions: 4,
    maxQuestions: 8,
    keyQuestions: [
      'Why do you deserve this scholarship?',
      'What are your research interests?',
      'How will this help your community?',
      'What are your academic achievements?',
      'Tell us about a challenge you overcame',
    ],
    culturalMarkers: ['academic_focus', 'community_giving', 'leadership_potential'],
    defaultPanel: DEFAULT_PANELS.scholarship_interview,
    icon: 'GraduationCap',
  },

  business_pitch: {
    id: 'business_pitch',
    displayName: 'Business Pitch',
    description: 'Practice pitching to investors and securing funding',
    formalityLevel: 'semi_formal',
    directnessLevel: 'high',
    expectedDuration: 15,
    minQuestions: 5,
    maxQuestions: 10,
    keyQuestions: [
      'What problem are you solving?',
      'What is your revenue model?',
      'Who are your competitors?',
      'How much are you raising?',
      'What is your traction so far?',
    ],
    culturalMarkers: ['direct_numbers', 'challenging_assumptions', 'local_context'],
    defaultPanel: DEFAULT_PANELS.business_pitch,
    icon: 'TrendingUp',
  },

  academic_presentation: {
    id: 'academic_presentation',
    displayName: 'Academic Presentation',
    description: 'Practice thesis defense and academic presentations',
    formalityLevel: 'formal',
    directnessLevel: 'high',
    expectedDuration: 30,
    minQuestions: 5,
    maxQuestions: 12,
    keyQuestions: [
      'Explain your methodology',
      'What is your contribution to knowledge?',
      'How does this apply in Nigeria?',
      'What are the limitations?',
      'Defend your literature review',
    ],
    culturalMarkers: ['methodology_focus', 'local_application', 'theoretical_grounding'],
    defaultPanel: DEFAULT_PANELS.academic_presentation,
    icon: 'BookOpen',
  },

  board_presentation: {
    id: 'board_presentation',
    displayName: 'Board Presentation',
    description: 'Practice executive presentations to senior leadership',
    formalityLevel: 'formal',
    directnessLevel: 'high',
    expectedDuration: 20,
    minQuestions: 6,
    maxQuestions: 12,
    keyQuestions: [
      'What is the business impact?',
      'What is the ROI?',
      'What are the risks?',
      'Who approved this approach?',
      'What does this mean for the bottom line?',
    ],
    culturalMarkers: ['executive_focus', 'financial_metrics', 'strategic_alignment'],
    defaultPanel: DEFAULT_PANELS.board_presentation,
    icon: 'Users',
  },

  conference: {
    id: 'conference',
    displayName: 'Conference Presentation',
    description: 'Practice presenting at professional conferences',
    formalityLevel: 'semi_formal',
    directnessLevel: 'medium',
    expectedDuration: 15,
    minQuestions: 3,
    maxQuestions: 6,
    keyQuestions: [
      'What is the key takeaway?',
      'How does this compare to prior work?',
      'What are the practical implications?',
    ],
    culturalMarkers: ['audience_engagement', 'time_management', 'q&a_handling'],
    defaultPanel: DEFAULT_PANELS.conference,
    icon: 'Mic',
  },

  exhibition: {
    id: 'exhibition',
    displayName: 'Exhibition/Trade Show',
    description: 'Practice demoing products to potential clients',
    formalityLevel: 'informal',
    directnessLevel: 'medium',
    expectedDuration: 10,
    minQuestions: 3,
    maxQuestions: 6,
    keyQuestions: [
      'What does this product do?',
      'How much does it cost?',
      'Who are your existing clients?',
    ],
    culturalMarkers: ['quick_pitch', 'value_proposition', 'relationship_building'],
    defaultPanel: DEFAULT_PANELS.exhibition,
    icon: 'Store',
  },

  media_interview: {
    id: 'media_interview',
    displayName: 'Media Interview',
    description: 'Practice handling press and media questions',
    formalityLevel: 'semi_formal',
    directnessLevel: 'high',
    expectedDuration: 10,
    minQuestions: 4,
    maxQuestions: 8,
    keyQuestions: [
      'What is your response to the allegations?',
      'Why should the public trust you?',
      'What is your vision for the future?',
    ],
    culturalMarkers: ['crisis_management', 'soundbite_ready', 'deflection_techniques'],
    defaultPanel: DEFAULT_PANELS.media_interview,
    icon: 'Radio',
  },
};

/**
 * Get configuration for a specific use case
 */
export function getUseCaseConfig(useCase: UseCase): UseCaseConfig {
  return USE_CASE_CONFIGS[useCase];
}

/**
 * Get default panel for a use case
 */
export function getDefaultPanel(useCase: UseCase): PanelMember[] {
  return USE_CASE_CONFIGS[useCase].defaultPanel;
}

/**
 * Get all available use cases
 */
export function getAllUseCases(): UseCaseConfig[] {
  return Object.values(USE_CASE_CONFIGS);
}

/**
 * Detect use case from user input
 */
export function detectUseCase(input: string): UseCase {
  const lower = input.toLowerCase();
  
  if (lower.match(/visa|embassy|travel|study abroad|immigration/)) {
    return 'embassy_interview';
  }
  if (lower.match(/scholarship|phd|masters|admission|fellowship/)) {
    return 'scholarship_interview';
  }
  if (lower.match(/pitch|investors?|funding|business|startup|venture/)) {
    return 'business_pitch';
  }
  if (lower.match(/thesis|defense|dissertation|academic|professor|lecturer/)) {
    return 'academic_presentation';
  }
  if (lower.match(/board|executive|cfo|ceo|director|management/)) {
    return 'board_presentation';
  }
  if (lower.match(/conference|keynote|speaker|session/)) {
    return 'conference';
  }
  if (lower.match(/exhibition|trade show|booth|demo|product display/)) {
    return 'exhibition';
  }
  if (lower.match(/media|press|journalist|news|tv|radio/)) {
    return 'media_interview';
  }
  
  // Default to job interview
  return 'job_interview';
}
