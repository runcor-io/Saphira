import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'ELEVENLABS_API_KEY not configured' 
      }, { status: 500 });
    }

    // Test the API by fetching available voices
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ 
        status: 'error', 
        message: `ElevenLabs API error: ${response.status}`,
        details: error 
      }, { status: 500 });
    }

    const data = await response.json();
    
    // Check if our Nigerian voices are available
    const nigerianVoiceIds = [
      '9Dbo4hEvXQ5l7MXGZFQA',
      '1QqhXn166kOO1gqssUgz',
      'eSsKYR3BasKvhJghjsCX',
      'U7wWSnxIJwCjioxt86mk',
      '77aEIu0qStu8Jwv1EdhX',
      '9hEb6p6ZCFsloAWErEvE',
    ];
    
    const availableVoices = data.voices?.filter((v: any) => 
      nigerianVoiceIds.includes(v.voice_id)
    ) || [];

    return NextResponse.json({
      status: 'ok',
      message: 'ElevenLabs API is configured and working',
      totalVoices: data.voices?.length || 0,
      nigerianVoicesAvailable: availableVoices.map((v: any) => ({
        id: v.voice_id,
        name: v.name,
        gender: v.labels?.gender || 'unknown',
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error', 
      message: error.message 
    }, { status: 500 });
  }
}
