import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const { jobRole, company, experienceLevel, interviewType, previousQuestions, persona } = await request.json();
    
    console.log('Generating question for:', { jobRole, company, persona: persona?.name });

    const systemPrompt = `You are ${persona.name}, ${persona.title}. ${persona.description}

Personality: ${persona.personality}
Accent/Style: ${persona.accent}

Generate a single interview question for a candidate applying for a ${jobRole} position at ${company}.
Experience Level: ${experienceLevel}
Interview Type: ${interviewType}

Guidelines:
- Ask ONE clear, specific question
- Use a warm, professional Nigerian corporate tone
- Occasionally use Nigerian expressions like "I like that", "Tell me more", "That's interesting"
- The question should be appropriate for the experience level and role
- Avoid questions that have already been asked

${previousQuestions?.length > 0 ? `Previously asked questions (avoid these): ${previousQuestions.join(', ')}` : ''}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate the next interview question.' },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    const question = completion.choices[0].message.content?.trim() || 'Tell me about yourself.';
    
    console.log('Generated question:', question);

    return NextResponse.json({ question, persona });
  } catch (error: any) {
    console.error('Error generating interview question:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate question' },
      { status: 500 }
    );
  }
}
