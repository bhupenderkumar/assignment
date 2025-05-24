// src/lib/utils/audioManager.ts

/**
 * Global Audio Manager
 * Manages audio playback across the application to prevent conflicts
 * Only one audio source can play at a time
 */

interface AudioInstance {
  id: string;
  element: HTMLAudioElement;
  type: 'instruction' | 'background' | 'effect' | 'other';
  priority: number; // Higher number = higher priority
}

class AudioManager {
  private audioInstances: Map<string, AudioInstance> = new Map();
  private currentlyPlaying: string | null = null;
  private backgroundMusicId: string | null = null;

  /**
   * Register an audio element with the manager
   */
  register(
    id: string, 
    element: HTMLAudioElement, 
    type: AudioInstance['type'] = 'other',
    priority: number = 1
  ): void {
    console.log(`AudioManager: Registering audio ${id} (type: ${type}, priority: ${priority})`);
    
    const instance: AudioInstance = {
      id,
      element,
      type,
      priority
    };

    this.audioInstances.set(id, instance);

    // Add event listeners
    element.addEventListener('play', () => this.handlePlay(id));
    element.addEventListener('pause', () => this.handlePause(id));
    element.addEventListener('ended', () => this.handleEnded(id));

    // Track background music
    if (type === 'background') {
      this.backgroundMusicId = id;
    }
  }

  /**
   * Unregister an audio element
   */
  unregister(id: string): void {
    console.log(`AudioManager: Unregistering audio ${id}`);
    const instance = this.audioInstances.get(id);
    if (instance) {
      instance.element.pause();
      this.audioInstances.delete(id);
      
      if (this.currentlyPlaying === id) {
        this.currentlyPlaying = null;
      }
      
      if (this.backgroundMusicId === id) {
        this.backgroundMusicId = null;
      }
    }
  }

  /**
   * Play audio with conflict resolution
   */
  async play(id: string): Promise<boolean> {
    const instance = this.audioInstances.get(id);
    if (!instance) {
      console.warn(`AudioManager: Audio ${id} not found`);
      return false;
    }

    console.log(`AudioManager: Attempting to play ${id} (type: ${instance.type})`);

    // Handle conflicts based on priority
    if (this.currentlyPlaying && this.currentlyPlaying !== id) {
      const currentInstance = this.audioInstances.get(this.currentlyPlaying);
      if (currentInstance) {
        // If new audio has higher priority, pause current
        if (instance.priority > currentInstance.priority) {
          console.log(`AudioManager: Pausing ${this.currentlyPlaying} for higher priority ${id}`);
          currentInstance.element.pause();
        } else {
          // If current has higher or equal priority, don't play new audio
          console.log(`AudioManager: Blocking ${id} due to higher priority ${this.currentlyPlaying}`);
          return false;
        }
      }
    }

    try {
      await instance.element.play();
      return true;
    } catch (error) {
      console.error(`AudioManager: Failed to play ${id}:`, error);
      return false;
    }
  }

  /**
   * Pause specific audio
   */
  pause(id: string): void {
    const instance = this.audioInstances.get(id);
    if (instance) {
      instance.element.pause();
    }
  }

  /**
   * Pause all audio
   */
  pauseAll(): void {
    console.log('AudioManager: Pausing all audio');
    this.audioInstances.forEach(instance => {
      instance.element.pause();
    });
    this.currentlyPlaying = null;
  }

  /**
   * Resume background music if no higher priority audio is playing
   */
  resumeBackgroundMusic(): void {
    if (this.backgroundMusicId && !this.currentlyPlaying) {
      console.log('AudioManager: Resuming background music');
      this.play(this.backgroundMusicId);
    }
  }

  /**
   * Get currently playing audio info
   */
  getCurrentlyPlaying(): AudioInstance | null {
    if (this.currentlyPlaying) {
      return this.audioInstances.get(this.currentlyPlaying) || null;
    }
    return null;
  }

  /**
   * Check if any audio is playing
   */
  isAnyPlaying(): boolean {
    return this.currentlyPlaying !== null;
  }

  /**
   * Handle play event
   */
  private handlePlay(id: string): void {
    console.log(`AudioManager: ${id} started playing`);
    this.currentlyPlaying = id;
  }

  /**
   * Handle pause event
   */
  private handlePause(id: string): void {
    console.log(`AudioManager: ${id} paused`);
    if (this.currentlyPlaying === id) {
      this.currentlyPlaying = null;
      
      // Resume background music after a short delay if no other audio starts
      setTimeout(() => {
        if (!this.currentlyPlaying) {
          this.resumeBackgroundMusic();
        }
      }, 500);
    }
  }

  /**
   * Handle ended event
   */
  private handleEnded(id: string): void {
    console.log(`AudioManager: ${id} ended`);
    if (this.currentlyPlaying === id) {
      this.currentlyPlaying = null;
      
      // Resume background music after audio ends
      setTimeout(() => {
        if (!this.currentlyPlaying) {
          this.resumeBackgroundMusic();
        }
      }, 100);
    }
  }

  /**
   * Set volume for all audio of a specific type
   */
  setVolumeByType(type: AudioInstance['type'], volume: number): void {
    this.audioInstances.forEach(instance => {
      if (instance.type === type) {
        instance.element.volume = Math.max(0, Math.min(1, volume));
      }
    });
  }

  /**
   * Get debug info
   */
  getDebugInfo(): any {
    return {
      registeredAudio: Array.from(this.audioInstances.keys()),
      currentlyPlaying: this.currentlyPlaying,
      backgroundMusicId: this.backgroundMusicId,
      totalInstances: this.audioInstances.size
    };
  }
}

// Create global instance
export const audioManager = new AudioManager();

// Audio priority levels
export const AUDIO_PRIORITIES = {
  INSTRUCTION: 10,    // Highest priority - audio instructions
  EFFECT: 5,          // Medium priority - sound effects
  BACKGROUND: 1       // Lowest priority - background music
} as const;

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    audioManager.pauseAll();
  });
}
