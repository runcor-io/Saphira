/**
 * Voice Mode Support - Frontend API Client
 * Calls backend API routes for ElevenLabs integration
 */

// Nigerian Voice IDs from ElevenLabs (verified available)
export const NIGERIAN_VOICES = {
  // Available female voices
  female1: 'Y4Xi1YBz9HedbrvzwylK',      // Nigerian Female - Professional
  
  // Available male voices  
  male1: 'U7wWSnxIJwCjioxt86mk',        // Olaniyi Victor - Warm, calming, Lagos Nigerian accent
  male2: '77aEIu0qStu8Jwv1EdhX',        // Ayinde - Deep and Melodic
  male3: 'tj0Lij6AHHeCO5FylYzu',        // Chief Okafor / Tunde - Authoritative
  
  // Named aliases for presentation page
  ceo: 'tj0Lij6AHHeCO5FylYzu',          // Chief Okafor - Authoritative
  cfo: 'Y4Xi1YBz9HedbrvzwylK',          // Mrs. Adebayo - Female
  hr: 'Y4Xi1YBz9HedbrvzwylK',           // Mrs. Okonkwo - Female
  cto: 'U7wWSnxIJwCjioxt86mk',          // Engr. Nnamdi - Technical male
};

export enum VoicePersona {
  HR_INTERVIEWER = 'HR_INTERVIEWER',
  CEO = 'CEO',
  TECHNICAL_LEAD = 'TECHNICAL_LEAD',
  PANEL_MEMBER = 'PANEL_MEMBER'
}

export async function textToSpeech(text: string, voiceId: string): Promise<string> {
  const response = await fetch('/api/voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      voiceId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate voice');
  }

  const audioBlob = await response.blob();
  return URL.createObjectURL(audioBlob);
}

export function cleanupAudioUrl(url: string | null) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}
