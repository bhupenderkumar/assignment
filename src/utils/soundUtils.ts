// src/utils/soundUtils.ts

/**
 * Sound utility functions for interactive assignments
 */

// Check if we're in production (not localhost)
const isProduction = () => {
  return !window.location.hostname.includes('localhost') &&
         !window.location.hostname.includes('127.0.0.1') &&
         !window.location.hostname.includes('192.168.');
};

// Override console methods in production
if (isProduction()) {
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.debug = () => {};
  // Keep console.error for critical issues
}

// Sound effects using Web Audio API
class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private enabled: boolean = true;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      if (!isProduction()) {
        console.warn('Web Audio API not supported:', error);
      }
    }
  }

  // Create sound effects programmatically
  private createTone(frequency: number, duration: number, type: OscillatorType = 'sine'): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const numSamples = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      switch (type) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'square':
          sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
          break;
        case 'triangle':
          sample = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * t));
          break;
        default:
          sample = Math.sin(2 * Math.PI * frequency * t);
      }

      // Apply envelope (fade in/out)
      const envelope = Math.min(1, Math.min(i / (sampleRate * 0.01), (numSamples - i) / (sampleRate * 0.01)));
      channelData[i] = sample * envelope * 0.1; // Reduce volume
    }

    return buffer;
  }

  // Initialize default sounds
  public initSounds() {
    if (!this.audioContext) return;

    // Click sound
    const clickBuffer = this.createTone(800, 0.1, 'sine');
    if (clickBuffer) this.sounds.set('click', clickBuffer);

    // Success sound
    const successBuffer = this.createTone(523.25, 0.3, 'sine'); // C5 note
    if (successBuffer) this.sounds.set('success', successBuffer);

    // Error sound
    const errorBuffer = this.createTone(220, 0.2, 'square'); // A3 note
    if (errorBuffer) this.sounds.set('error', errorBuffer);

    // Completion sound (chord)
    const completionBuffer = this.createTone(659.25, 0.5, 'sine'); // E5 note
    if (completionBuffer) this.sounds.set('completion', completionBuffer);
  }

  // Play a sound
  public playSound(soundName: string, volume: number = 0.5) {
    if (!this.enabled || !this.audioContext || !this.sounds.has(soundName)) return;

    try {
      const buffer = this.sounds.get(soundName);
      if (!buffer) return;

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      gainNode.gain.value = Math.min(1, Math.max(0, volume));

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start();
    } catch (error) {
      if (!isProduction()) {
        console.warn('Error playing sound:', error);
      }
    }
  }

  // Enable/disable sounds
  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }
}

// Text-to-Speech functionality
class TextToSpeechManager {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private enabled: boolean = true;

  constructor() {
    this.initTTS();
  }

  private initTTS() {
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();

      // Load voices when they become available
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    } else {
      if (!isProduction()) {
        console.warn('Text-to-Speech not supported in this browser');
      }
    }
  }

  private loadVoices() {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  // Speak text
  public speak(text: string, options: {
    rate?: number;
    pitch?: number;
    volume?: number;
    lang?: string;
  } = {}) {
    if (!this.enabled || !this.synth || !text.trim()) return;

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Set options
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 0.8;
    utterance.lang = options.lang || 'en-US';

    // Try to find a suitable voice
    const preferredVoice = this.voices.find(voice =>
      voice.lang.startsWith(utterance.lang.split('-')[0])
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Error handling
    utterance.onerror = (event) => {
      if (!isProduction()) {
        console.warn('TTS Error:', event.error);
      }
    };

    this.synth.speak(utterance);
  }

  // Stop speaking
  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  // Enable/disable TTS
  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled && this.synth) {
      this.synth.cancel();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // Check if TTS is available
  public isAvailable(): boolean {
    return !!this.synth;
  }
}

// Global instances
const soundManager = new SoundManager();
const ttsManager = new TextToSpeechManager();

// Initialize sounds when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    soundManager.initSounds();
  });
} else {
  soundManager.initSounds();
}

// Export functions
export const playSound = (soundName: string, volume?: number) => {
  soundManager.playSound(soundName, volume);
};

export const speakText = (text: string, options?: {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}) => {
  ttsManager.speak(text, options);
};

export const stopSpeaking = () => {
  ttsManager.stop();
};

export const setSoundEnabled = (enabled: boolean) => {
  soundManager.setEnabled(enabled);
};

export const setTTSEnabled = (enabled: boolean) => {
  ttsManager.setEnabled(enabled);
};

export const isTTSAvailable = () => {
  return ttsManager.isAvailable();
};

export const isSoundEnabled = () => {
  return soundManager.isEnabled();
};

export const isTTSEnabled = () => {
  return ttsManager.isEnabled();
};

// Clean text for TTS (remove HTML tags, special characters)
export const cleanTextForTTS = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, ' ') // Remove HTML entities
    .replace(/[^\w\s.,!?-]/g, ' ') // Remove special characters except basic punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

/**
 * Stop all sounds and clean up audio resources
 */
export const stopAllSounds = () => {
  // Stop TTS
  ttsManager.stop();

  // Stop all HTML audio elements that might not be managed by soundManager
  // This catches AudioPlayer and any other unmanaged audio elements
  const allAudioElements = document.querySelectorAll('audio');
  allAudioElements.forEach(audio => {
    if (!audio.paused) {
      audio.pause();
    }
  });

  // Note: Web Audio API sources (from SoundManager) can't be stopped once started,
  // but they're usually very short sound effects
};
