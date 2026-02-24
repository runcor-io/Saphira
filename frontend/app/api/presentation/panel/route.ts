import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function GET() {
  // Return the predefined panel - 4 panelists matching the UI
  const panel = [
    {
      id: 'ceo',
      name: 'Chief Okafor',
      role: 'CEO',
      personality: 'Strategic, visionary, big-picture thinker. Direct, results-oriented, values ROI and business impact. Authoritative Nigerian executive tone.',
      questioning_style: 'Challenges assumptions, asks about business metrics, ROI, and strategic alignment. Uses phrases like "Let me be direct" and "The bottom line is". Asks about vision, market positioning, and leadership.',
      voice_persona: 'CEO',
    },
    {
      id: 'cfo',
      name: 'Mrs. Adebayo',
      role: 'CFO',
      personality: 'Analytical, numbers-focused, detail-oriented. Cautious about financial risks. Professional Lagos corporate style.',
      questioning_style: 'Focuses on financials, projections, break-even timelines, and ROI. Asks about budget breakdowns, assumptions, and financial risks.',
      voice_persona: 'PANEL_MEMBER',
    },
    {
      id: 'hr',
      name: 'Mrs. Okonkwo',
      role: 'HR Director',
      personality: 'People-focused, behavioral, culture guardian. Warm but thorough. Focuses on team dynamics and cultural fit.',
      questioning_style: 'Asks about teamwork, leadership style, conflict resolution, and cultural alignment. Uses phrases like "How do you handle..." and "Tell me about a time when".',
      voice_persona: 'HR_INTERVIEWER',
    },
    {
      id: 'cto',
      name: 'Engr. Nnamdi',
      role: 'CTO',
      personality: 'Technical, innovative, solution-driven. Detail-oriented and analytical. Precise and methodical.',
      questioning_style: 'Probes technical depth, asks about implementation details, scalability, integration challenges, and technical dependencies.',
      voice_persona: 'TECHNICAL_LEAD',
    },
  ];

  return NextResponse.json({ panel });
}

export async function POST(request: NextRequest) {
  try {
    const { member, topic, previousQuestions } = await request.json();

    const systemPrompt = `You are ${member.name}, ${member.role} of a Nigerian company.
${member.personality}

Questioning Style: ${member.questioning_style}

The presenter is pitching on: "${topic}"

Generate a challenging but fair question from your perspective as ${member.role}.
Ask ONE specific question that reflects your role and personality.
Be concise - one or two sentences maximum.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Generate your next question for the presentation on "${topic}".
${previousQuestions?.length > 0 ? `Avoid questions similar to these already asked: ${previousQuestions.join(', ')}` : ''}` 
        },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    const question = completion.choices[0].message.content?.trim() || 'Tell me more about your proposal.';

    // Generate feedback for the answer (if provided)
    let feedback = '';
    let score = 0;

    return NextResponse.json({ 
      question,
      feedback,
      score,
    });
  } catch (error: any) {
    console.error('Error generating panel question:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate question' },
      { status: 500 }
    );
  }
}
