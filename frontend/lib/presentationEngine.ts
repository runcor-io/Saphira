/**
 * Presentation Engine - Frontend API Client
 * Calls backend API routes for OpenAI integration
 */

export interface PanelMember {
  id: string;
  name: string;
  role: 'CEO' | 'CFO' | 'HR Director' | 'CTO';
  personality: string;
  questioning_style: string;
  voice_persona: string;
}

export interface PanelQuestionOutput {
  question: string;
  feedback: string;
  score: number;
}

export interface PresentationFeedback {
  feedback: string;
  score: number;
  improved_answer: string;
  satisfied: boolean;
}

// Default panel members - Executive Board Panel
const DEFAULT_PANEL: PanelMember[] = [
  {
    id: 'ceo',
    name: 'Chief Okafor',
    role: 'CEO',
    personality: 'Strategic, visionary, big-picture thinker. Direct and results-oriented. Authoritative Nigerian executive tone.',
    questioning_style: 'Challenges assumptions, asks about business metrics, ROI, and strategic alignment. Uses phrases like "Let me be direct" and "The bottom line is". Asks about vision, market positioning, and leadership.',
    voice_persona: 'CEO',
  },
  {
    id: 'cfo',
    name: 'Mrs. Adebayo',
    role: 'CFO',
    personality: 'Analytical, numbers-focused, detail-oriented. Cautious about financial risks. Professional Lagos corporate style.',
    questioning_style: 'Focuses on financials, projections, break-even timelines, and ROI. Asks about budget breakdowns, assumptions, and financial risks.',
    voice_persona: 'PANEL_MEMBER',
  },
  {
    id: 'hr',
    name: 'Mrs. Okonkwo',
    role: 'HR Director',
    personality: 'People-focused, behavioral, culture guardian. Warm but thorough. Focuses on team dynamics and cultural fit.',
    questioning_style: 'Asks about teamwork, leadership style, conflict resolution, and cultural alignment. Uses phrases like "How do you handle..." and "Tell me about a time when".',
    voice_persona: 'HR_INTERVIEWER',
  },
  {
    id: 'cto',
    name: 'Engr. Nnamdi',
    role: 'CTO',
    personality: 'Technical, innovative, solution-driven. Detail-oriented and analytical. Precise and methodical.',
    questioning_style: 'Probes technical depth, asks about implementation details, scalability, integration challenges, and technical dependencies.',
    voice_persona: 'TECHNICAL_LEAD',
  },
];

export function generatePanel(): PanelMember[] {
  return DEFAULT_PANEL;
}

export function getNextPanelMember(
  panel: PanelMember[],
  currentIndex: number
): { member: PanelMember; index: number } | null {
  // Cycle through panelists, allowing multiple rounds
  const nextIndex = (currentIndex + 1) % panel.length;
  
  // Allow up to 8 questions total (2 rounds of 4 panelists)
  if (currentIndex >= 7) {
    return null;
  }
  
  return { member: panel[nextIndex], index: nextIndex };
}

export async function generatePresentationFeedback(
  member: PanelMember,
  question: string,
  answer: string,
  topic: string
): Promise<PresentationFeedback> {
  const response = await fetch('/api/presentation/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      member,
      question,
      answer,
      topic,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate feedback');
  }

  return response.json();
}

export async function generatePanelQuestion(
  member: PanelMember,
  topic: string,
  previousQuestions: string[] = []
): Promise<PanelQuestionOutput> {
  const response = await fetch('/api/presentation/panel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      member,
      topic,
      previousQuestions,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate panel question');
  }

  return response.json();
}
