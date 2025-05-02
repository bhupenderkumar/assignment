// src/lib/utils/soundUtils.ts

// Sound types
type SoundType = 'correct' | 'incorrect' | 'click' | 'celebration' | 'complete';

// Map of sound types to their URLs
const soundMap: Record<SoundType, string> = {
  correct: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  incorrect: 'https://assets.mixkit.co/active_storage/sfx/2053/2053-preview.mp3',
  click: 'https://assets.mixkit.co/active_storage/sfx/1111/1111-preview.mp3',
  celebration: 'https://assets.mixkit.co/active_storage/sfx/1993/1993-preview.mp3',
  complete: 'https://assets.mixkit.co/active_storage/sfx/1995/1995-preview.mp3',
};

// Cache for audio elements
const audioCache: Record<string, HTMLAudioElement> = {};

/**
 * Play a sound effect
 * @param type The type of sound to play
 * @param volume Optional volume (0-1)
 */
export const playSound = (type: SoundType, volume = 0.5) => {
  // Check if sound is enabled in local storage
  const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
  if (!soundEnabled) return;

  const soundUrl = soundMap[type];
  if (!soundUrl) return;

  // Use cached audio element or create a new one
  if (!audioCache[type]) {
    audioCache[type] = new Audio(soundUrl);
  }

  const audio = audioCache[type];
  audio.volume = volume;
  
  // Reset audio to beginning if it's already playing
  audio.currentTime = 0;
  
  // Play the sound
  audio.play().catch(error => {
    console.error('Error playing sound:', error);
  });
};

/**
 * Enable or disable sounds
 * @param enabled Whether sounds should be enabled
 */
export const setSoundEnabled = (enabled: boolean) => {
  localStorage.setItem('soundEnabled', enabled.toString());
};

/**
 * Check if sounds are enabled
 * @returns Whether sounds are enabled
 */
export const isSoundEnabled = (): boolean => {
  return localStorage.getItem('soundEnabled') !== 'false';
};
