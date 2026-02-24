/**
 * POST /api/interview/followup
 * Generate intelligent follow-up questions using GPT-4
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { 
      candidateAnswer, 
      jobRole, 
      company, 
      interviewerName,
      previousQuestions,
      stage,
      candidateName 
    } = await request.json();

    if (!candidateAnswer || !jobRole) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are ${interviewerName || 'an interviewer'}, a professional Nigerian interviewer conducting a job interview at ${company || 'a company'}.

Your role is to:
1. Listen carefully to the candidate's answer
2. Generate a natural, conversational follow-up that probes deeper
3. Ask specific questions that reveal the candidate's expertise
4. Reference specific details from their answer to show you're listening
5. Keep your tone professional but warm (Nigerian corporate style)

Rules:
- Respond as the interviewer speaking directly to the candidate
- Ask ONE question at a time
- Make it specific to what they just said
- Don't ask generic questions - dig deeper into their experience
- Keep it concise (1-2 sentences of acknowledgment + 1 question)
- If their answer was vague, ask for specific examples
- If their answer was detailed, ask about the outcome or lessons learned`;

    const userPrompt = `Job Role: ${jobRole}
Interview Stage: ${stage || 'general'}
Candidate Name: ${candidateName || 'Candidate'}

Previous questions asked:
${previousQuestions?.join('\n') || 'None yet'}

Candidate just answered:
"${candidateAnswer}"

Generate your follow-up response as the interviewer. Include:
1. A brief acknowledgment of their answer (show you listened)
2. ONE specific follow-up question that probes deeper

Respond in this format:
{
  "acknowledgment": "Brief response showing you listened",
  "followUpQuestion": "The specific follow-up question",
  "fullResponse": "Complete response combining both"
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
      acknowledgment: result.acknowledgment || '',
      followUpQuestion: result.followUpQuestion || '',
      fullResponse: result.fullResponse || `${result.acknowledgment}\n\n${result.followUpQuestion}`,
    });

  } catch (error: any) {
    console.error('[Follow-up API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate follow-up' },
      { status: 500 }
    );
  }
}
