/**
 * POST /api/interview/summary
 * Generate comprehensive interview summary and final report
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const {
      jobRole,
      company,
      candidateName,
      interviewTranscript,
      scores,
      totalQuestions,
    } = await request.json();

    if (!interviewTranscript || !jobRole) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const averageScore = scores?.length > 0
      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      : 0;

    const systemPrompt = `You are an expert HR consultant and interview coach.

Generate a comprehensive interview summary report for a candidate who just completed a job interview.

Your report should:
1. Provide an overall assessment
2. Highlight key strengths demonstrated
3. Identify areas for improvement
4. Give actionable next steps for the candidate
5. Include a hiring recommendation

Keep the tone professional, encouraging, and constructive.`;

    const userPrompt = `Job Role: ${jobRole}
Company: ${company || 'Unknown'}
Candidate: ${candidateName || 'Candidate'}
Average Score: ${averageScore}/10
Questions Answered: ${totalQuestions || 'Unknown'}

INTERVIEW TRANSCRIPT:
${interviewTranscript}

Individual Scores: ${JSON.stringify(scores)}

Generate a comprehensive summary report in this JSON format:
{
  "overallScore": ${averageScore},
  "overallRating": "<Excellent|Strong|Good|Fair|Needs Development>",
  "hiringRecommendation": "<Strongly Recommend|Recommend|Consider|Not Recommended>",
  "keyStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "areasToImprove": ["<area 1>", "<area 2>"],
  "performanceHighlights": "<paragraph summarizing standout moments>",
  "developmentPlan": "<specific actionable advice for future interviews>",
  "summary": "<overall summary of the interview performance>"
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
      overallScore: result.overallScore || averageScore,
      overallRating: result.overallRating || 'Average',
      hiringRecommendation: result.hiringRecommendation || 'Consider',
      keyStrengths: result.keyStrengths || [],
      areasToImprove: result.areasToImprove || [],
      performanceHighlights: result.performanceHighlights || '',
      developmentPlan: result.developmentPlan || '',
      summary: result.summary || 'Interview completed.',
    });

  } catch (error: any) {
    console.error('[Summary API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
