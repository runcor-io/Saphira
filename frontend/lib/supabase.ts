/**
 * Supabase Client Configuration
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on our schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          plan: 'free' | 'pro';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: 'free' | 'pro';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: 'free' | 'pro';
          updated_at?: string;
        };
      };
      interviews: {
        Row: {
          id: string;
          user_id: string;
          job_role: string;
          company: string;
          experience_level: 'entry' | 'mid' | 'senior' | 'executive';
          interview_type: 'technical' | 'behavioral' | 'mixed';
          status: 'in_progress' | 'completed' | 'cancelled';
          overall_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_role: string;
          company: string;
          experience_level: 'entry' | 'mid' | 'senior' | 'executive';
          interview_type: 'technical' | 'behavioral' | 'mixed';
          status?: 'in_progress' | 'completed' | 'cancelled';
          overall_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'in_progress' | 'completed' | 'cancelled';
          overall_score?: number | null;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          interview_id: string;
          question: string;
          answer: string | null;
          feedback: string | null;
          score: number | null;
          order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          interview_id: string;
          question: string;
          answer?: string | null;
          feedback?: string | null;
          score?: number | null;
          order: number;
          created_at?: string;
        };
        Update: {
          answer?: string | null;
          feedback?: string | null;
          score?: number | null;
        };
      };
      presentations: {
        Row: {
          id: string;
          user_id: string;
          topic: string;
          description: string | null;
          status: 'in_progress' | 'completed' | 'cancelled';
          overall_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic: string;
          description?: string | null;
          status?: 'in_progress' | 'completed' | 'cancelled';
          overall_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'in_progress' | 'completed' | 'cancelled';
          overall_score?: number | null;
          updated_at?: string;
        };
      };
      panel_questions: {
        Row: {
          id: string;
          presentation_id: string;
          persona_id: string;
          persona_name: string;
          persona_role: string;
          question: string;
          answer: string | null;
          feedback: string | null;
          score: number | null;
          order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          presentation_id: string;
          persona_id: string;
          persona_name: string;
          persona_role: string;
          question: string;
          answer?: string | null;
          feedback?: string | null;
          score?: number | null;
          order: number;
          created_at?: string;
        };
        Update: {
          answer?: string | null;
          feedback?: string | null;
          score?: number | null;
        };
      };
    };
  };
}

// Typed Supabase client
export const typedSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
