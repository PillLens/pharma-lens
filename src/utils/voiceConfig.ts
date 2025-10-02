export const SUPPORTED_VOICES = [
  { 
    id: 'alloy', 
    name: 'Alloy', 
    description: 'Neutral and balanced voice',
    gender: 'neutral'
  },
  { 
    id: 'echo', 
    name: 'Echo', 
    description: 'Warm and friendly voice',
    gender: 'male'
  },
  { 
    id: 'shimmer', 
    name: 'Shimmer', 
    description: 'Soft and gentle voice',
    gender: 'female'
  },
  { 
    id: 'ash', 
    name: 'Ash', 
    description: 'Clear and articulate voice',
    gender: 'neutral'
  },
  { 
    id: 'ballad', 
    name: 'Ballad', 
    description: 'Expressive and dynamic voice',
    gender: 'male'
  },
  { 
    id: 'coral', 
    name: 'Coral', 
    description: 'Bright and energetic voice',
    gender: 'female'
  },
  { 
    id: 'sage', 
    name: 'Sage', 
    description: 'Calm and reassuring voice',
    gender: 'neutral'
  },
  { 
    id: 'verse', 
    name: 'Verse', 
    description: 'Melodic and soothing voice',
    gender: 'female'
  }
] as const;

export type VoiceId = typeof SUPPORTED_VOICES[number]['id'];

export const validateVoiceSelection = (voice: string): voice is VoiceId => {
  return SUPPORTED_VOICES.some(v => v.id === voice);
};

export const getVoiceById = (voiceId: string) => {
  return SUPPORTED_VOICES.find(v => v.id === voiceId) || SUPPORTED_VOICES[0];
};

export const DEFAULT_VOICE: VoiceId = 'alloy';

export const SESSION_CONFIG = {
  modalities: ["text", "audio"] as const,
  input_audio_format: "pcm16" as const,
  output_audio_format: "pcm16" as const,
  turn_detection: {
    type: "server_vad" as const,
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 1000
  },
  temperature: 0.8,
  max_response_output_tokens: "inf" as const
};
