/**
 * Interview Engine - Frontend API Client
 * Calls backend API routes for OpenAI integration
 */

export interface InterviewQuestionInput {
  job_role: string;
  company: string;
  experience_level: 'entry' | 'mid' | 'senior' | 'executive';
  interview_type: 'technical' | 'behavioral' | 'mixed';
  persona_id?: string;
}

export interface InterviewQuestionOutput {
  question: string;
  persona: {
    id: string;
    name: string;
    title: string;
    location: string;
    greeting: string;
  };
}

export interface InterviewFeedbackOutput {
  score: number;
  strengths: string;
  improvements: string;
  improved_answer: string;
}

export async function generateInterviewQuestion(
  jobRole: string,
  company: string,
  experienceLevel: string,
  interviewType: string,
  previousQuestions: string[] = [],
  persona?: any
): Promise<{ question: string; persona: any }> {
  console.log('Generating interview question...', { jobRole, company, persona: persona?.name });
  
  const response = await fetch('/api/interview/question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobRole,
      company,
      experienceLevel,
      interviewType,
      previousQuestions,
      persona,
    }),
  });

  console.log('Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API error:', errorText);
    throw new Error(errorText || 'Failed to generate question');
  }

  return response.json();
}

export async function generateInterviewFeedback(
  question: string,
  answer: string,
  jobRole: string
): Promise<InterviewFeedbackOutput> {
  const response = await fetch('/api/interview/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      answer,
      jobRole,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate feedback');
  }

  return response.json();
}
