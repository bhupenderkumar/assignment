// src/components/common/AudioPlayer.tsx
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import toast from 'react-hot-toast';
import { audioManager, AUDIO_PRIORITIES } from '../../lib/utils/audioManager';

interface AudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  showLabel?: boolean;
  label?: string;
  className?: string;
  onAutoPlayBlocked?: () => void;
  priority?: number;
  audioType?: 'instruction' | 'background' | 'effect' | 'other';
  audioId?: string;
}

export interface AudioPlayerRef {
  play: () => void;
  pause: () => void;
  isPlaying: boolean;
}

const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(({
  audioUrl,
  autoPlay = false,
  showLabel = true,
  label = 'Audio Instructions',
  className = '',
  onAutoPlayBlocked,
  priority = AUDIO_PRIORITIES.INSTRUCTION,
  audioType = 'instruction',
  audioId
}, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [autoPlayBlocked, setAutoPlayBlocked] = useState(false);
  const [hasShownNotification, setHasShownNotification] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const instanceId = useRef<string>(audioId || `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const autoPlayAttempted = useRef<boolean>(false);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    play: async () => {
      if (!error) {
        const success = await audioManager.play(instanceId.current);
        if (!success) {
          console.log('AudioPlayer: Play blocked by audio manager');
        }
      }
    },
    pause: () => {
      audioManager.pause(instanceId.current);
    },
    isPlaying
  }), [isPlaying, error]);

  // Log the audio URL for debugging
  useEffect(() => {
    console.log('AudioPlayer: Audio URL received:', audioUrl);
    console.log('AudioPlayer: Audio URL type:', typeof audioUrl);
    console.log('AudioPlayer: Audio URL length:', audioUrl?.length);

    // Validate the URL
    if (!audioUrl) {
      console.error('AudioPlayer: No audio URL provided');
      setError('No audio URL provided');
      return;
    }

    if (typeof audioUrl !== 'string') {
      console.error('AudioPlayer: Audio URL is not a string:', audioUrl);
      setError('Invalid audio URL format');
      return;
    }

    try {
      // Check if URL is valid
      const url = new URL(audioUrl);
      console.log('AudioPlayer: Valid URL parsed:', url.href);
      console.log('AudioPlayer: URL protocol:', url.protocol);
      console.log('AudioPlayer: URL hostname:', url.hostname);
    } catch (e) {
      console.error('AudioPlayer: Invalid audio URL:', audioUrl, e);
      setError('Invalid audio URL');
      return;
    }

    // Reset error state if URL is valid
    setError(null);
    console.log('AudioPlayer: URL validation passed, error state cleared');
  }, [audioUrl]);

  // Register with audio manager
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Register with audio manager
    audioManager.register(instanceId.current, audio, audioType, priority);

    // Cleanup on unmount
    return () => {
      audioManager.unregister(instanceId.current);
    };
  }, [audioType, priority]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.log('AudioPlayer: No audio element ref available');
      return;
    }

    console.log('AudioPlayer: Setting up audio element with URL:', audioUrl);

    const setAudioData = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
      console.log('AudioPlayer: Audio loaded successfully, duration:', audio.duration);
      console.log('AudioPlayer: Audio readyState:', audio.readyState);
      console.log('AudioPlayer: Audio networkState:', audio.networkState);

      // Try autoplay after audio is loaded (only once)
      if (autoPlay && !error && !autoPlayAttempted.current) {
        autoPlayAttempted.current = true;
        console.log('AudioPlayer: Attempting autoplay...');

        // Add a small delay to ensure audio is fully loaded
        setTimeout(async () => {
          const success = await audioManager.play(instanceId.current);
          if (success) {
            console.log('AudioPlayer: Autoplay successful!');
            // Show success notification only once
            if (!hasShownNotification) {
              toast('🎵 Audio instructions are now playing!', {
                duration: 3000,
                icon: '🔊',
                style: {
                  background: '#10B981',
                  color: 'white',
                },
              });
              setHasShownNotification(true);
            }
          } else {
            console.error('AudioPlayer: Auto play failed or blocked');
            setAutoPlayBlocked(true);
            // Call the callback if provided
            if (onAutoPlayBlocked) {
              onAutoPlayBlocked();
            }
            // Show blocked notification only once
            if (!hasShownNotification) {
              toast('🔊 Audio instructions available! Click play to listen.', {
                duration: 5000,
                icon: '🎵',
                style: {
                  background: '#3B82F6',
                  color: 'white',
                  fontWeight: 'bold',
                },
              });
              setHasShownNotification(true);
            }
          }
        }, 200);
      }
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleAudioEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      console.error('AudioPlayer: Audio error event:', e);
      const target = e.target as HTMLAudioElement;
      console.error('AudioPlayer: Audio error details:', {
        error: target.error,
        networkState: target.networkState,
        readyState: target.readyState,
        src: target.src,
        currentSrc: target.currentSrc
      });
      if (target.error) {
        console.error('AudioPlayer: Media error code:', target.error.code);
        console.error('AudioPlayer: Media error message:', target.error.message);
      }
      setError('Failed to load audio file');
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      console.log('AudioPlayer: Audio can play');
      // Don't attempt autoplay here to avoid conflicts with loadeddata handler
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    // Add event listeners
    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleAudioEnd);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // Clean up
    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleAudioEnd);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioUrl, autoPlay, error, isPlaying]);

  const togglePlay = async () => {
    if (error) return;

    if (isPlaying) {
      audioManager.pause(instanceId.current);
    } else {
      const success = await audioManager.play(instanceId.current);
      if (!success) {
        console.error('Play failed or blocked by audio manager');
        toast.error('Failed to play audio. Another audio might be playing.');
      }
    }
  };

  const handleTimeUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || error) return;

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Function to retry loading the audio
  const retryLoading = () => {
    setError(null);
    const audio = audioRef.current;
    if (audio) {
      audio.load();
    }
  };

  // Show loading state
  if (!isLoaded && !error) {
    return (
      <div className={`flex flex-col ${className}`}>
        {showLabel && (
          <div className="flex items-center mb-2">
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </div>
        )}
        <div className="bg-gray-100 rounded-lg p-3 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="text-sm text-gray-600">Loading audio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {showLabel && (
        <div className="flex items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
      )}

      {/* Show autoplay blocked message */}
      {autoPlayBlocked && (
        <div className="w-full bg-blue-100 border border-blue-300 rounded-lg p-2 mb-2">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <span className="text-sm text-blue-700 font-medium">Click play to hear audio instructions</span>
          </div>
        </div>
      )}

      <div className={`rounded-lg p-3 flex items-center space-x-2 ${
        autoPlayBlocked
          ? 'bg-blue-50 border-2 border-blue-200'
          : 'bg-gray-100'
      }`}>
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onLoadStart={() => console.log('AudioPlayer: Load start')}
          onLoadedMetadata={() => console.log('AudioPlayer: Metadata loaded')}
          onCanPlay={() => console.log('AudioPlayer: Can play')}
          onCanPlayThrough={() => console.log('AudioPlayer: Can play through')}
          onPlay={() => console.log('AudioPlayer: Play event')}
          onPause={() => console.log('AudioPlayer: Pause event')}
          onError={(e) => console.error('AudioPlayer: Audio element error:', e)}
        />

        {error ? (
          <div className="w-full flex flex-col items-center justify-center text-center p-2">
            <div className="text-red-500 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={retryLoading}
              className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
            >
              Retry
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Audio URL: {audioUrl ? audioUrl.substring(0, 50) + (audioUrl.length > 50 ? '...' : '') : 'None'}
            </p>
          </div>
        ) : (
          <>
            <button
              onClick={() => {
                togglePlay();
                // Clear autoplay blocked state when user manually plays
                if (autoPlayBlocked) {
                  setAutoPlayBlocked(false);
                }
              }}
              className={`flex items-center justify-center text-white rounded-full focus:outline-none transition-all duration-200 ${
                autoPlayBlocked
                  ? 'w-12 h-12 bg-blue-600 hover:bg-blue-700 shadow-lg animate-bounce'
                  : 'w-10 h-10 bg-blue-500 hover:bg-blue-600'
              }`}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <div className="flex-1 flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleTimeUpdate}
                className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-gray-500 w-16 text-right">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;
