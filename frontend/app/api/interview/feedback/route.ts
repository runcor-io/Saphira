/**
 * POST /api/interview/feedback
 * Generate comprehensive feedback for candidate answers
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const {
      question,
      answer,
      jobRole,
      stage,
      questionNumber,
      totalQuestions,
    } = await request.json();

    if (!question || !answer || !jobRole) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert interview coach and hiring manager with 20+ years of experience.

Your task is to evaluate a candidate's interview answer and provide constructive feedback.

Evaluation Criteria (Score 1-10):
- Relevance: Did they answer the question asked?
- Clarity: Was their response clear and well-structured?
- Specificity: Did they provide concrete examples/details?
- Depth: Did they demonstrate expertise?
- Communication: Was their answer concise yet complete?

Provide feedback in Nigerian corporate style - professional, encouraging, but honest.`;

    const userPrompt = `Job Role: ${jobRole}
Interview Stage: ${stage || 'General'}
Question ${questionNumber || '?'} of ${totalQuestions || '?'}

QUESTION ASKED:
"${question}"

CANDIDATE'S ANSWER:
"${answer}"

Provide evaluation in this exact JSON format:
{
  "score": <number 1-10>,
  "rating": "<Excellent|Good|Average|Needs Improvement|Poor>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area to improve 1>", "<area to improve 2>"],
  "suggestedAnswer": "<an example of how a strong candidate might answer this question>",
  "feedback": "<brief encouraging summary of their performance on this answer>"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(content);

    return NextResponse.json({
      score: result.score || 5,
      rating: result.rating || 'Average',
      strengths: result.strengths || [],
      improvements: result.improvements || [],
      suggestedAnswer: result.suggestedAnswer || '',
      feedback: result.feedback || 'Thank you for your answer.',
    });

  } catch (error: any) {
    console.error('[Feedback API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate feedback' },
      { status: 500 }
    );
  }
}
