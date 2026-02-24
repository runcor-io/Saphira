/**
 * POST /api/presentation/question
 * Submit answer and get comprehensive feedback from panel
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generatePanel, generatePanelQuestion, generatePresentationFeedback, getNextPanelMember } from '@/lib/presentationEngine';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
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
    const { presentation_id, question_id, answer, action = 'next', enable_voice = true, current_member_index = 0 } = body;

    if (!presentation_id || !question_id || !answer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get presentation
    const { data: presentation, error: presentationError } = await supabaseAdmin
      .from('presentations')
      .select('*')
      .eq('id', presentation_id)
      .eq('user_id', user.id)
      .single();

    if (presentationError || !presentation) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
    }

    // Get current question
    const { data: currentQuestion } = await supabaseAdmin
      .from('panel_questions')
      .select('*')
      .eq('id', question_id)
      .single();

    if (!currentQuestion) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Get panel and current member
    const panel = generatePanel();
    const currentMember = panel[current_member_index] || panel[0];

    // Generate comprehensive feedback
    const feedback = await generatePresentationFeedback(
      currentMember,
      currentQuestion.question,
      answer,
      presentation.topic
    );

    // Update question with complete feedback
    await supabaseAdmin
      .from('panel_questions')
      .update({
        answer,
        feedback: feedback.feedback,
        score: feedback.score,
        improved_answer: feedback.improved_answer,
        satisfied: feedback.satisfied,
      })
      .eq('id', question_id);

    // If finishing
    if (action === 'finish') {
      const { data: allQuestions } = await supabaseAdmin
        .from('panel_questions')
        .select('score')
        .eq('presentation_id', presentation_id);

      const scores = allQuestions?.map(q => q.score).filter(Boolean) as number[] || [];
      const overallScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;

      await supabaseAdmin
        .from('presentations')
        .update({ status: 'completed', overall_score: overallScore })
        .eq('id', presentation_id);

      return NextResponse.json({
        success: true,
        completed: true,
        feedback,
        overall_score: overallScore,
      });
    }

    // Get next panel member
    const nextMemberResult = getNextPanelMember(panel, current_member_index);
    if (!nextMemberResult) {
      return NextResponse.json({ success: true, completed: true, feedback, message: 'Panel rotation complete' });
    }

    const { member: nextMember, index: nextIndex } = nextMemberResult;

    // Get previous questions
    const { data: existingQuestions } = await supabaseAdmin
      .from('panel_questions')
      .select('question')
      .eq('presentation_id', presentation_id);

    const previousQuestions = existingQuestions?.map(q => q.question) || [];
    const nextOrder = previousQuestions.length + 1;

    if (nextOrder > 6) {
      const { data: allQuestions } = await supabaseAdmin
        .from('panel_questions')
        .select('score')
        .eq('presentation_id', presentation_id);

      const scores = allQuestions?.map(q => q.score).filter(Boolean) as number[] || [];
      const overallScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;

      await supabaseAdmin
        .from('presentations')
        .update({ status: 'completed', overall_score: overallScore })
        .eq('id', presentation_id);

      return NextResponse.json({
        success: true,
        completed: true,
        feedback,
        overall_score: overallScore,
        message: 'Presentation completed - maximum questions reached',
      });
    }

    // Generate next question
    const nextQuestion = await generatePanelQuestion(
      nextMember,
      presentation.topic,
      previousQuestions
    );

    const { data: savedQuestion } = await supabaseAdmin
      .from('panel_questions')
      .insert({
        presentation_id,
        persona_id: nextMember.id,
        persona_name: nextMember.name,
        persona_role: nextMember.role,
        question: nextQuestion.question,
        order: nextOrder,
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      completed: false,
      feedback,
      current_member: { index: nextIndex, ...nextMember },
      question: {
        id: savedQuestion?.id,
        question: nextQuestion.question,
      },
    });
  } catch (error) {
    console.error('Error in presentation question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
