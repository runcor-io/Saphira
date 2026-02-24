/**
 * POST /api/presentation/feedback
 * Generate feedback for a presentation answer
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { member, question, answer, topic } = await request.json();

    if (!member || !question || !answer || !topic) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const prompt = `You are ${member.name}, a ${member.role} with a ${member.personality} personality.

You asked this question during a presentation about "${topic}":
"${question}"

The presenter answered:
"${answer}"

Provide feedback in this JSON format:
{
  "feedback": "Detailed constructive feedback on the answer",
  "score": <number between 1-10>,
  "improved_answer": "A suggested improved version of the answer",
  "satisfied": <boolean indicating if you're satisfied with the answer>
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a ${member.role} on a panel evaluating a business presentation. You have a ${member.personality} personality and your questioning style is: ${member.questioning_style}. Provide constructive, specific feedback.`,
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content from OpenAI');
    }

    const feedback = JSON.parse(content);

    return NextResponse.json({
      feedback: feedback.feedback,
      score: feedback.score,
      improved_answer: feedback.improved_answer,
      satisfied: feedback.satisfied,
    });
  } catch (error: any) {
    console.error('Error generating presentation feedback:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate feedback' },
      { status: 500 }
    );
  }
}
