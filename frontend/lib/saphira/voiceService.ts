/**
 * Voice Service for Pan-African Support
 * Maps countries to appropriate ElevenLabs voices
 */

import { Country } from './datasetService';

// Voice IDs by country
const COUNTRY_VOICES: Record<Country, string[]> = {
  nigeria: [
    'tj0Lij6AHHeCO5FylYzu', // Chief Okafor - Authoritative male
    'Y4Xi1YBz9HedbrvzwylK', // Nigerian Female
    'U7wWSnxIJwCjioxt86mk', // Olaniyi Victor - Warm male
    '77aEIu0qStu8Jwv1EdhX', // Ayinde - Deep male
  ],
  kenya: [
    'Y4Xi1YBz9HedbrvzwylK', // Placeholder - using Nigerian female (replace with Kenyan voice)
    'U7wWSnxIJwCjioxt86mk', // Placeholder - using Olaniyi (replace with Kenyan voice)
  ],
  south_africa: [
    'Y4Xi1YBz9HedbrvzwylK', // Placeholder - using Nigerian female (replace with SA voice)
    'U7wWSnxIJwCjioxt86mk', // Placeholder - using Olaniyi (replace with SA voice)
  ],
};

// Voice gender mapping
const VOICE_GENDER: Record<string, 'male' | 'female'> = {
  'tj0Lij6AHHeCO5FylYzu': 'male',
  'Y4Xi1YBz9HedbrvzwylK': 'female',
  'U7wWSnxIJwCjioxt86mk': 'male',
  '77aEIu0qStu8Jwv1EdhX': 'male',
};

/**
 * Get available voices for a country
 */
export function getCountryVoices(country: Country): string[] {
  return COUNTRY_VOICES[country] || COUNTRY_VOICES.nigeria;
}

/**
 * Get voice by index for country
 */
export function getVoiceForCountry(country: Country, index: number = 0): string {
  const voices = getCountryVoices(country);
  return voices[index % voices.length] || voices[0];
}

/**
 * Get voice by gender preference
 */
export function getVoiceByGender(
  country: Country,
  gender: 'male' | 'female',
  index: number = 0
): string {
  const voices = getCountryVoices(country).filter(
    v => VOICE_GENDER[v] === gender
  );
  
  if (voices.length === 0) {
    // Fallback to any voice from country
    return getVoiceForCountry(country, index);
  }
  
  return voices[index % voices.length] || voices[0];
}

/**
 * Get voice for panel member
 * Assigns consistent voice based on role
 */
export function getVoiceForPanelMember(
  country: Country,
  role: string,
  gender?: 'male' | 'female'
): string {
  const voices = getCountryVoices(country);
  
  // Assign voices by role type
  if (role.toLowerCase().includes('ceo') || role.toLowerCase().includes('chief')) {
    // Authoritative voice for leadership
    return voices[0] || voices[0];
  }
  
  if (role.toLowerCase().includes('hr') || role.toLowerCase().includes('cfo')) {
    // Professional voice for HR/CFO
    return voices[1] || voices[0];
  }
  
  if (role.toLowerCase().includes('tech') || role.toLowerCase().includes('engineer')) {
    // Technical voice
    return voices[2] || voices[0];
  }
  
  // Default by gender if specified
  if (gender) {
    return getVoiceByGender(country, gender);
  }
  
  // Round-robin
  return voices[0];
}

/**
 * Get voice name for display
 */
export function getVoiceName(voiceId: string): string {
  const voiceNames: Record<string, string> = {
    'tj0Lij6AHHeCO5FylYzu': 'Chief Okafor',
    'Y4Xi1YBz9HedbrvzwylK': 'Nigerian Female',
    'U7wWSnxIJwCjioxt86mk': 'Olaniyi Victor',
    '77aEIu0qStu8Jwv1EdhX': 'Ayinde',
  };
  
  return voiceNames[voiceId] || 'AI Voice';
}

/**
 * Update voice when country changes
 * Returns fallback voice if specified voice not available for country
 */
export function migrateVoiceToCountry(
  currentVoiceId: string,
  targetCountry: Country
): string {
  const countryVoices = getCountryVoices(targetCountry);
  
  // If current voice is available in target country, keep it
  if (countryVoices.includes(currentVoiceId)) {
    return currentVoiceId;
  }
  
  // Otherwise, get voice of same gender or default
  const currentGender = VOICE_GENDER[currentVoiceId];
  if (currentGender) {
    const matchingVoices = countryVoices.filter(
      v => VOICE_GENDER[v] === currentGender
    );
    if (matchingVoices.length > 0) {
      return matchingVoices[0];
    }
  }
  
  // Fallback to first voice
  return countryVoices[0];
}
