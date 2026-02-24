/**
 * Saphira Verified Dataset Service
 * Uses REAL interview data from verified sources
 * Sources: MyJobMag, Legit.ng, Jobberman, BrighterMonday, Careers24
 */

import nigeriaData from './datasets/nigeria_real_verified.json';
import kenyaData from './datasets/kenya_real_verified.json';
import saData from './datasets/south_africa_real_verified.json';

export type Country = 'nigeria' | 'kenya' | 'south_africa';
export type Company = 
  | 'general' 
  | 'GTBank' | 'Access_Bank' | 'Flutterwave' | 'Paystack'
  | 'Safaricom' | 'Equity_Bank' | 'KCB'
  | 'Standard_Bank' | 'FNB' | 'MTN' | 'Nedbank';
export type QuestionCategory = 
  | 'traditional' 
  | 'bank_specific' 
  | 'tough' 
  | 'pressure' 
  | 'personality'
  | 'bee_transformation'
  | 'competency';

// Interfaces
export interface Question {
  id: string;
  question: string;
  variations?: string[];
  context?: string;
  tips?: string;
  suggested_answer?: string;
  bad_answers?: string[];
  category: QuestionCategory;
}

export interface CompanyData {
  name: string;
  core_values?: string[];
  interview_stages?: Array<{
    stage: number;
    name: string;
    components: string[];
    duration?: string;
    note?: string;
  }>;
  questions: string[];
  focus?: string;
  emphasis?: string;
}

export interface CulturalContext {
  communication_style: string;
  key_values: string[];
  honorifics?: string[];
  language_markers: Record<string, string>;
  conversational_fillers: string[];
  phrasing_preferences?: {
    Western: Record<string, string>;
    Local: Record<string, string>;
  };
}

export interface CountryDataset {
  metadata: {
    dataset_name: string;
    sources: string[];
  };
  cultural_context: CulturalContext;
  companies: Record<string, CompanyData>;
  question_categories: Record<string, any[]>;
  common_questions?: any[];
}

// Load datasets
const DATASETS: Record<Country, CountryDataset> = {
  nigeria: nigeriaData as CountryDataset,
  kenya: kenyaData as CountryDataset,
  south_africa: saData as CountryDataset,
};

// Company to country mapping
const COMPANY_COUNTRY_MAP: Record<string, Country> = {
  general: 'nigeria',
  GTBank: 'nigeria',
  Access_Bank: 'nigeria',
  Flutterwave: 'nigeria',
  Paystack: 'nigeria',
  Safaricom: 'kenya',
  Equity_Bank: 'kenya',
  KCB: 'kenya',
  Standard_Bank: 'south_africa',
  FNB: 'south_africa',
  MTN: 'south_africa',
  Nedbank: 'south_africa',
};

/**
 * Get dataset for a specific country
 */
export function getDataset(country: Country): CountryDataset {
  return DATASETS[country] || DATASETS.nigeria;
}

/**
 * Get all companies for a country
 */
export function getCompaniesForCountry(country: Country): string[] {
  const dataset = getDataset(country);
  return Object.keys(dataset.companies || {});
}

/**
 * Get all available companies (across all countries)
 */
export function getAllCompanies(): { id: string; name: string; country: Country }[] {
  const companies: { id: string; name: string; country: Country }[] = [
    { id: 'general', name: 'General Practice', country: 'nigeria' }
  ];

  (Object.keys(DATASETS) as Country[]).forEach(country => {
    const dataset = getDataset(country);
    Object.entries(dataset.companies || {}).forEach(([id, data]) => {
      companies.push({
        id,
        name: (data as CompanyData).name || id.replace(/_/g, ' '),
        country
      });
    });
  });

  return companies;
}

/**
 * Get company-specific questions
 */
export function getCompanyQuestions(company: string, country?: Country): Question[] {
  const targetCountry = country || COMPANY_COUNTRY_MAP[company] || 'nigeria';
  const dataset = getDataset(targetCountry);
  const companyData = dataset.companies?.[company];
  
  if (!companyData) {
    return getGeneralQuestions(targetCountry);
  }

  return companyData.questions.map((q, idx) => ({
    id: `${company}_${idx}`,
    question: q,
    category: 'traditional',
    context: `From ${companyData.name} interview`,
  }));
}

/**
 * Get general questions for a country
 */
export function getGeneralQuestions(country: Country): Question[] {
  const dataset = getDataset(country);
  const questions: Question[] = [];

  // Get from question_categories
  Object.entries(dataset.question_categories || {}).forEach(([category, qs]) => {
    qs.forEach((q: any, idx: number) => {
      questions.push({
        id: `${country}_${category}_${idx}`,
        question: q.question || q.text || String(q),
        variations: q.variations,
        context: q.context,
        tips: q.tips,
        suggested_answer: q.suggested_answer,
        bad_answers: q.bad_answers,
        category: category as QuestionCategory,
      });
    });
  });

  // Get from common_questions (Kenya/SA)
  if (dataset.common_questions) {
    dataset.common_questions.forEach((q: any, idx: number) => {
      questions.push({
        id: `${country}_common_${idx}`,
        question: q.question,
        context: q.context,
        category: 'traditional',
      });
    });
  }

  return questions;
}

/**
 * Get random question from country
 */
export function getRandomQuestion(
  country: Country, 
  category?: QuestionCategory,
  company?: string
): Question | null {
  let questions: Question[];
  
  if (company && company !== 'general') {
    questions = getCompanyQuestions(company, country);
  } else {
    questions = getGeneralQuestions(country);
  }

  if (category) {
    questions = questions.filter(q => q.category === category);
  }

  if (questions.length === 0) return null;
  
  return questions[Math.floor(Math.random() * questions.length)];
}

/**
 * Get cultural tone guide for GPT prompts
 */
export function getToneGuide(country: Country, company?: string): string {
  const dataset = getDataset(country);
  const ctx = dataset.cultural_context;
  
  let guide = `
## Cultural Communication Style
${ctx.communication_style}

## Key Values
${ctx.key_values.join(', ')}

## Language Markers
${Object.entries(ctx.language_markers).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

## Conversational Fillers (use naturally)
${ctx.conversational_fillers.join(', ')}
`;

  // Add company-specific context
  if (company && company !== 'general') {
    const companyData = dataset.companies?.[company];
    if (companyData?.core_values) {
      guide += `
## ${companyData.name} Core Values
${companyData.core_values.join(', ')}
`;
    }
  }

  // Add country-specific phrasing preferences
  if (ctx.phrasing_preferences) {
    guide += `
## Local Phrasing Preferences
Instead of Western phrases, use:
${Object.entries(ctx.phrasing_preferences.Local).map(([k, v]) => `- "${v}" (not "${ctx.phrasing_preferences!.Western[k]}")`).join('\n')}
`;
  }

  return guide;
}

/**
 * Get panel introduction for country style
 */
export function getPanelIntroduction(country: Country, type: 'formal' | 'warm' | 'direct' = 'formal'): string {
  const openings: Record<Country, Record<string, string[]>> = {
    nigeria: {
      formal: [
        "Good morning. Thank you for coming in today. Please, have a seat.",
        "Good morning. Please sit down. Can we meet you?",
        "Welcome. Thank you for making the time to see us today."
      ],
      warm: [
        "Good morning! Welcome. How was your journey here?",
        "Good morning. Please sit down. Make yourself comfortable.",
        "Welcome! I hope Lagos traffic wasn't too bad?"
      ],
      direct: [
        "Good morning. Let's proceed. Introduce yourself.",
        "Alright, let's start. Tell us about yourself."
      ]
    },
    kenya: {
      formal: [
        "Karibu. Thank you for coming. Please have a seat.",
        "Good morning. Welcome. I hope you found us easily.",
        "Thank you for being punctual. Shall we begin?"
      ],
      warm: [
        "Karibu sana! Welcome. Habari yako?",
        "Good morning! Karibu. How was your trip?"
      ],
      direct: [
        "Good morning. Let's get started. Tell us about yourself.",
        "Thank you for coming. Let's talk about your experience."
      ]
    },
    south_africa: {
      formal: [
        "Good morning. Thank you for coming in. Please, have a seat.",
        "Welcome. We appreciate you making the time today.",
        "Thank you for your punctuality. Let's begin."
      ],
      warm: [
        "Howzit! Thanks for coming through.",
        "Good morning. Welcome to our offices."
      ],
      direct: [
        "Good morning. Let's get straight to it.",
        "Thanks for coming. Let's talk about why you're here."
      ]
    }
  };

  const options = openings[country]?.[type] || openings[country]?.formal || openings.nigeria.formal;
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Get country-specific question variations
 */
export function getLocalVariation(country: Country, westernQuestion: string): string {
  const dataset = getDataset(country);
  const prefs = dataset.cultural_context.phrasing_preferences;
  
  if (!prefs) return westernQuestion;

  // Find matching western phrase
  const entry = Object.entries(prefs.Western).find(([key, phrase]) => 
    westernQuestion.toLowerCase().includes(phrase.toLowerCase())
  );

  if (entry) {
    return prefs.Local[entry[0]];
  }

  return westernQuestion;
}

/**
 * Get cultural context for GPT
 */
export function getCulturalContext(country: Country): string {
  const contexts: Record<Country, string> = {
    nigeria: `Nigerian employers are concerned about:
1. CGPA performance - ask about low grades if applicable
2. NYSC completion - ask about service year
3. 'Japa' (emigration) intentions - probe loyalty
4. Religious and family obligations
5. Direct communication about salary expectations
6. Use respectful honorifics: Sir/Ma, Chief, Dr., Engr., Barr.`,

    kenya: `Kenyan employers value:
1. STAR method answers (Situation-Task-Action-Result)
2. Harambee (teamwork) spirit - emphasize collective achievement
3. Long-term growth mindset within the company
4. Use "Karibu" for welcome, "Asante" for thanks
5. British-influenced professional politeness
6. Respect for hierarchy and education credentials`,

    south_africa: `South African employers focus on:
1. BEE/Transformation awareness - ask about diversity contribution
2. Ubuntu philosophy - "I am because we are"
3. Competency-based responses with specific examples
4. Direct communication style with confidence
5. Less hierarchical than Nigeria, more egalitarian
6. Ask: "What is your understanding of BEE?" and "What does Ubuntu mean to you?"`
  };

  return contexts[country] || contexts.nigeria;
}

/**
 * Get question by category
 */
export function getQuestionsByCategory(
  country: Country, 
  category: QuestionCategory,
  company?: string
): Question[] {
  let questions: Question[];
  
  if (company && company !== 'general') {
    questions = getCompanyQuestions(company, country);
  } else {
    questions = getGeneralQuestions(country);
  }

  return questions.filter(q => q.category === category);
}

/**
 * Get company info
 */
export function getCompanyInfo(company: string, country?: Country): CompanyData | null {
  const targetCountry = country || COMPANY_COUNTRY_MAP[company] || 'nigeria';
  const dataset = getDataset(targetCountry);
  return dataset.companies?.[company] || null;
}

/**
 * Get interview stages for company
 */
export function getInterviewStages(company: string, country?: Country): CompanyData['interview_stages'] {
  const info = getCompanyInfo(company, country);
  return info?.interview_stages || [];
}

export default {
  getDataset,
  getCompaniesForCountry,
  getAllCompanies,
  getCompanyQuestions,
  getGeneralQuestions,
  getRandomQuestion,
  getToneGuide,
  getPanelIntroduction,
  getLocalVariation,
  getCulturalContext,
  getQuestionsByCategory,
  getCompanyInfo,
  getInterviewStages,
};
