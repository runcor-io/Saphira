import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId } = await request.json();

    if (!text || !voiceId) {
      console.error('[Voice API] Missing text or voiceId');
      return NextResponse.json(
        { error: 'Text and voiceId are required' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error('[Voice API] ELEVENLABS_API_KEY not configured');
      return NextResponse.json(
        { error: 'Voice service not configured' },
        { status: 500 }
      );
    }

    console.log('[Voice API] Generating voice for:', text.substring(0, 50) + '...');
    console.log('[Voice API] Using voice ID:', voiceId);

    // Call ElevenLabs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Voice API] ElevenLabs error:', response.status, errorText);
      
      // Parse error for specific codes
      let errorMessage = `ElevenLabs API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail?.code === 'paid_plan_required') {
          errorMessage = 'PAID_PLAN_REQUIRED';
        } else if (errorJson.detail?.message) {
          errorMessage = errorJson.detail.message;
        }
      } catch (e) {
        // Not JSON
      }
      
      return NextResponse.json(
        { error: errorMessage, details: errorText },
        { status: 500 }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    console.log('[Voice API] Audio generated, size:', audioBuffer.byteLength, 'bytes');

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error('[Voice API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate voice' },
      { status: 500 }
    );
  }
}
