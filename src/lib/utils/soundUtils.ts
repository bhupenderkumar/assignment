// src/lib/utils/soundUtils.ts
import { audioManager, AUDIO_PRIORITIES } from './audioManager';

// Sound types
type SoundType = 'correct' | 'incorrect' | 'click' | 'celebration' | 'complete' | 'clapping' | 'very-good' | 'better-luck' | 'background';

// Map of sound types to their URLs (using gentle, child-friendly sounds)
const soundMap: Record<SoundType, string> = {
  correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Gentle success chime
  incorrect: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3', // Soft error tone
  click: 'https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3', // Gentle click
  celebration: 'https://assets.mixkit.co/active_storage/sfx/1993/1993-preview.mp3', // Happy celebration
  complete: 'https://assets.mixkit.co/active_storage/sfx/1995/1995-preview.mp3', // Completion fanfare
  clapping: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Applause
  'very-good': 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Placeholder - will use TTS
  'better-luck': 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3', // Placeholder - will use TTS
  background: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Gentle background music
};

// Cache for audio elements
const audioCache: Record<string, HTMLAudioElement> = {};

// Track if audio context has been initialized
let audioInitialized = false;

// Background music control
let backgroundMusic: HTMLAudioElement | null = null;
let isBackgroundMusicPlaying = false;

/**
 * Play text-to-speech
 * @param text The text to speak
 * @param volume Optional volume (0-1)
 */
const playTTS = (text: string, volume = 0.7) => {
  // Check if TTS is supported
  if (!('speechSynthesis' in window)) return;

  // Check if sound is enabled
  const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
  if (!soundEnabled) return;

  // Cancel any ongoing speech
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.volume = volume;
  utterance.rate = 0.9;
  utterance.pitch = 1.1;

  // Try to use a child-friendly voice
  const voices = speechSynthesis.getVoices();
  const childVoice = voices.find(voice =>
    voice.name.toLowerCase().includes('child') ||
    voice.name.toLowerCase().includes('kid') ||
    voice.name.toLowerCase().includes('female')
  );

  if (childVoice) {
    utterance.voice = childVoice;
  }

  speechSynthesis.speak(utterance);
};

/**
 * Play enhanced audio feedback with voice and sound effects
 * @param type The type of feedback
 * @param volume Optional volume (0-1)
 */
export const playEnhancedFeedback = (type: 'correct' | 'incorrect', volume = 0.7) => {
  if (type === 'correct') {
    // Play "Very good!" followed by clapping
    playTTS('Very good!', volume);
    setTimeout(() => {
      playSound('clapping', volume * 0.8);
    }, 1000);
  } else {
    // Play "Better luck next time"
    playTTS('Better luck next time', volume);
  }
};

/**
 * Initialize audio context on first user interaction
 */
const initializeAudio = () => {
  if (audioInitialized) return;

  // Pre-load common sounds
  const commonSounds = ['click', 'correct', 'incorrect'];
  commonSounds.forEach(soundType => {
    if (soundMap[soundType as SoundType] && !audioCache[soundType]) {
      const audio = new Audio(soundMap[soundType as SoundType]);
      audio.preload = 'auto';
      audio.volume = 0.01; // Very low volume for preload
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0.5; // Reset to normal volume
      }).catch(() => {
        // Ignore preload errors
      });
      audioCache[soundType] = audio;
    }
  });

  audioInitialized = true;
};

/**
 * Play a sound effect
 * @param type The type of sound to play
 * @param volume Optional volume (0-1)
 */
export const playSound = (type: SoundType, volume = 0.5) => {
  // Initialize audio on first call
  initializeAudio();

  // Check if sound is enabled in local storage
  const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
  if (!soundEnabled) return;

  // Handle TTS-based sounds
  if (type === 'very-good') {
    playTTS('Very good!', volume);
    return;
  }

  if (type === 'better-luck') {
    playTTS('Better luck next time', volume);
    return;
  }

  const soundUrl = soundMap[type];
  if (!soundUrl) {
    console.warn(`Sound URL not found for type: ${type}`);
    return;
  }

  // Use cached audio element or create a new one
  if (!audioCache[type]) {
    audioCache[type] = new Audio(soundUrl);
    audioCache[type].preload = 'auto';

    // Register with audio manager
    const priority = type === 'background' ? AUDIO_PRIORITIES.BACKGROUND : AUDIO_PRIORITIES.EFFECT;
    const audioType = type === 'background' ? 'background' : 'effect';
    audioManager.register(`sound-${type}`, audioCache[type], audioType, priority);
  }

  const audio = audioCache[type];
  audio.volume = Math.min(1, Math.max(0, volume));

  // Reset audio to beginning if it's already playing
  audio.currentTime = 0;

  // Use audio manager to play the sound
  audioManager.play(`sound-${type}`).catch(error => {
    console.error(`Error playing sound '${type}':`, error);

    // Try to create a new audio element if the cached one failed
    if (audioCache[type]) {
      audioManager.unregister(`sound-${type}`);
      delete audioCache[type];
      const newAudio = new Audio(soundUrl);
      newAudio.volume = volume;
      const priority = type === 'background' ? AUDIO_PRIORITIES.BACKGROUND : AUDIO_PRIORITIES.EFFECT;
      const audioType = type === 'background' ? 'background' : 'effect';
      audioManager.register(`sound-${type}`, newAudio, audioType, priority);
      audioManager.play(`sound-${type}`).catch(retryError => {
        console.error(`Retry failed for sound '${type}':`, retryError);
      });
      audioCache[type] = newAudio;
    }
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

/**
 * Start background music
 * @param volume Optional volume (0-1, default: 0.2)
 */
export const startBackgroundMusic = (volume = 0.2) => {
  // Check if sound is enabled
  const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
  if (!soundEnabled) return;

  // Don't start if already playing
  if (isBackgroundMusicPlaying && backgroundMusic) return;

  try {
    if (!backgroundMusic) {
      backgroundMusic = new Audio(soundMap.background);
      backgroundMusic.loop = true;
      backgroundMusic.preload = 'auto';

      // Register with audio manager
      audioManager.register('background-music', backgroundMusic, 'background', AUDIO_PRIORITIES.BACKGROUND);
    }

    backgroundMusic.volume = Math.min(1, Math.max(0, volume));
    backgroundMusic.currentTime = 0;

    audioManager.play('background-music').then((success) => {
      if (success) {
        isBackgroundMusicPlaying = true;
      }
    }).catch(error => {
      console.error('Error starting background music:', error);
    });
  } catch (error) {
    console.error('Error initializing background music:', error);
  }
};

/**
 * Stop background music
 */
export const stopBackgroundMusic = () => {
  if (backgroundMusic && isBackgroundMusicPlaying) {
    audioManager.pause('background-music');
    isBackgroundMusicPlaying = false;
  }
};

/**
 * Check if background music is playing
 */
export const isBackgroundMusicActive = (): boolean => {
  return isBackgroundMusicPlaying;
};

/**
 * Set background music volume
 * @param volume Volume level (0-1)
 */
export const setBackgroundMusicVolume = (volume: number) => {
  if (backgroundMusic) {
    backgroundMusic.volume = Math.min(1, Math.max(0, volume));
  }
};

/**
 * Stop all sounds and clean up audio resources
 */
export const stopAllSounds = () => {
  // Use audio manager to pause all audio
  audioManager.pauseAll();

  // Reset background music state
  isBackgroundMusicPlaying = false;

  // Stop TTS
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
};

/**
 * Initialize audio system (call this on first user interaction)
 */
export const initializeSoundSystem = () => {
  initializeAudio();
  // Start background music automatically when sound system is initialized
  setTimeout(() => {
    startBackgroundMusic(0.15); // Very gentle volume
  }, 500);
};
