/**
 * POST /api/saphira/feedback
 * Generate feedback for candidate responses
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, useCase } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert evaluator of Nigerian professional communication. Provide constructive, specific feedback.' 
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 800,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content from OpenAI');
    }

    const response = JSON.parse(content);

    return NextResponse.json({
      score: response.score,
      rating: response.rating,
      strengths: response.strengths || [],
      improvements: response.improvements || [],
      suggestedAnswer: response.suggestedAnswer,
      culturalNotes: response.culturalNotes,
      useCase,
    });

  } catch (error: any) {
    console.error('Error generating feedback:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate feedback' },
      { status: 500 }
    );
  }
}
