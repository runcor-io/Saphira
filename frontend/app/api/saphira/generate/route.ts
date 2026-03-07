/**
 * POST /api/saphira/generate
 * Generate dynamic interview/panel questions using GPT-4
 * Supports both single response and panel round (multiple responses)
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { systemPrompt, userPrompt, useCase, panelMemberId, panelMemberIds, isPanelRound } = await request.json();

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
      temperature: 0.75,
      max_tokens: isPanelRound ? 800 : 500, // Increased for panel rounds
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content from OpenAI');
    }

    const response = JSON.parse(content);

    // Support both panel round format (messages array) and single response format
    if (response.messages && Array.isArray(response.messages)) {
      // Panel round format
      return NextResponse.json({
        messages: response.messages,
        useCase,
        panelMemberIds: panelMemberIds || [],
        isPanelRound: true,
      });
    } else {
      // Single response format (backward compatibility)
      return NextResponse.json({
        text: response.text,
        isQuestion: response.isQuestion ?? true,
        suggestedFollowUp: response.suggestedFollowUp,
        culturalAdaptation: response.culturalAdaptation,
        tone: response.tone,
        useCase,
        panelMemberId,
      });
    }

  } catch (error: any) {
    console.error('Error generating question:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate question' },
      { status: 500 }
    );
  }
}
