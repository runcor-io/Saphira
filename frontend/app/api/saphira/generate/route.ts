/**
 * POST /api/saphira/generate
 * Generate dynamic interview/panel questions using GPT-4
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { systemPrompt, userPrompt, useCase, panelMemberId } = await request.json();

    if (!systemPrompt || !userPrompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content from OpenAI');
    }

    const response = JSON.parse(content);

    return NextResponse.json({
      text: response.text,
      isQuestion: response.isQuestion ?? true,
      suggestedFollowUp: response.suggestedFollowUp,
      culturalAdaptation: response.culturalAdaptation,
      tone: response.tone,
      useCase,
      panelMemberId,
    });

  } catch (error: any) {
    console.error('Error generating question:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate question' },
      { status: 500 }
    );
  }
}
