/**
 * POST /api/presentation/start
 * Start a new presentation simulation with multi-persona panel
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generatePanel, generatePanelQuestion } from '@/lib/presentationEngine';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { topic, description, enable_voice = true } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Create presentation record
    const { data: presentation, error: insertError } = await supabaseAdmin
      .from('presentations')
      .insert({
        user_id: user.id,
        topic,
        description,
        status: 'in_progress',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating presentation:', insertError);
      return NextResponse.json(
        { error: 'Failed to create presentation' },
        { status: 500 }
      );
    }

    // Generate panel
    const panel = generatePanel();

    // First panel member asks the first question
    const firstMember = panel[0];
    const firstQuestion = await generatePanelQuestion(firstMember, topic, []);

    // Save question to database
    const { data: question, error: questionError } = await supabaseAdmin
      .from('panel_questions')
      .insert({
        presentation_id: presentation.id,
        persona_id: firstMember.id,
        persona_name: firstMember.name,
        persona_role: firstMember.role,
        question: firstQuestion.question,
        order: 1,
      })
      .select()
      .single();

    if (questionError) {
      console.error('Error saving question:', questionError);
    }

    return NextResponse.json({
      success: true,
      presentation,
      panel,
      current_member: {
        index: 0,
        ...firstMember,
      },
      question: {
        id: question?.id,
        question: firstQuestion.question,
      },
    });
  } catch (error) {
    console.error('Error in presentation start:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
