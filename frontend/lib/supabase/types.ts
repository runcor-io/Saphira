export interface Interview {
  id: string;
  user_id?: string;
  job_role: string;
  company: string;
  experience_level: string;
  interview_type: string;
  score?: number;
  status: 'in_progress' | 'completed';
  created_at?: string;
  updated_at?: string;
}

export interface InterviewQuestion {
  id: string;
  interview_id: string;
  question: string;
  answer?: string;
  score?: number;
  feedback?: {
    score: number;
    strengths: string;
    improvements: string;
    improved_answer: string;
  };
  persona?: {
    id: string;
    name: string;
    title: string;
    voice_persona: string;
    personality: string;
    image?: string;
    color?: string;
  };
  created_at?: string;
}

export interface Presentation {
  id: string;
  user_id?: string;
  topic: string;
  presentation_type: string;
  duration: string;
  score?: number;
  status: 'in_progress' | 'completed';
  created_at?: string;
  updated_at?: string;
}

export interface PanelQuestion {
  id: string;
  presentation_id: string;
  panel_member: {
    id: string;
    name: string;
    role: string;
    personality: string;
    voice_persona: string;
  };
  question: string;
  answer?: string;
  score?: number;
  feedback?: string | object;
  created_at?: string;
}

export type Database = {
  public: {
    Tables: {
      interviews: {
        Row: Interview;
        Insert: Omit<Interview, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Interview>;
      };
      questions: {
        Row: InterviewQuestion;
        Insert: Omit<InterviewQuestion, 'id' | 'created_at'>;
        Update: Partial<InterviewQuestion>;
      };
      presentations: {
        Row: Presentation;
        Insert: Omit<Presentation, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Presentation>;
      };
      panel_questions: {
        Row: PanelQuestion;
        Insert: Omit<PanelQuestion, 'id' | 'created_at'>;
        Update: Partial<PanelQuestion>;
      };
    };
  };
};
