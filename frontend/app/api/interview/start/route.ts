/**
 * POST /api/interview/start
 * Start a new interview session with Nigerian persona
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateInterviewQuestion } from '@/lib/interviewEngine';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client for API routes
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { job_role, company, experience_level, interview_type, enable_voice = true, persona_id } = body;

    // Validate required fields
    if (!job_role || !company || !experience_level || !interview_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create interview record
    const { data: interview, error: insertError } = await supabaseAdmin
      .from('interviews')
      .insert({
        user_id: user.id,
        job_role,
        company,
        experience_level,
        interview_type,
        status: 'in_progress',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating interview:', insertError);
      return NextResponse.json(
        { error: 'Failed to create interview' },
        { status: 500 }
      );
    }

    // Generate first question with voice and persona
    const questionData = await generateInterviewQuestion(
      job_role,
      company,
      experience_level,
      interview_type,
      [],
      persona_id ? { id: persona_id } : undefined
    );

    // Save question to database
    const { data: question, error: questionError } = await supabaseAdmin
      .from('questions')
      .insert({
        interview_id: interview.id,
        question: questionData.question,
        order: 1,
      })
      .select()
      .single();

    if (questionError) {
      console.error('Error saving question:', questionError);
    }

    return NextResponse.json({
      success: true,
      interview,
      question: {
        id: question?.id,
        question: questionData.question,
      },
      persona: questionData.persona,
    });
  } catch (error) {
    console.error('Error in interview start:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
