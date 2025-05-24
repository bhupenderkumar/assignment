// src/components/common/SimpleAudioPlayer.tsx
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import toast from 'react-hot-toast';

interface SimpleAudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  label?: string;
  showLabel?: boolean;
  className?: string;
  onAutoPlayBlocked?: () => void;
}

export interface SimpleAudioPlayerRef {
  play: () => Promise<void>;
  pause: () => void;
  isPlaying: boolean;
}

const SimpleAudioPlayer = forwardRef<SimpleAudioPlayerRef, SimpleAudioPlayerProps>(({
  audioUrl,
  autoPlay = false,
  label = 'Audio Player',
  showLabel = true,
  className = '',
  onAutoPlayBlocked
}, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [autoPlayBlocked, setAutoPlayBlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoPlayAttempted = useRef<boolean>(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);

  // Sanitize audio URL to fix double slash issues
  const sanitizedAudioUrl = useMemo(() => {
    if (!audioUrl || audioUrl.trim() === '') return '';
    // Fix double slashes in the path while preserving protocol
    return audioUrl.replace(/\/\/+/g, '/').replace(':/', '://');
  }, [audioUrl]);

  // Check if we have a valid audio URL
  const hasValidAudioUrl = sanitizedAudioUrl && sanitizedAudioUrl.length > 0;

  // Debug logging
  useEffect(() => {
    console.log('🎵 SimpleAudioPlayer Debug:', {
      originalAudioUrl: audioUrl,
      sanitizedAudioUrl,
      hasValidAudioUrl,
      audioUrlType: typeof audioUrl,
      audioUrlLength: audioUrl?.length || 0,
      autoPlay,
      isPlaying,
      error,
      autoPlayBlocked
    });
  }, [audioUrl, sanitizedAudioUrl, hasValidAudioUrl, autoPlay, isPlaying, error, autoPlayBlocked]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    play: async () => {
      const audio = audioRef.current;
      if (audio && !error) {
        try {
          await audio.play();
        } catch (err) {
          console.error('Failed to play audio:', err);
        }
      }
    },
    pause: () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
      }
    },
    isPlaying
  }), [isPlaying, error]);

  // Detect user interaction globally
  useEffect(() => {
    // Only set up interaction detection if we have a valid audio URL
    if (!hasValidAudioUrl) return;

    const detectInteraction = () => {
      setUserHasInteracted(true);
      // Try to play audio immediately if autoplay is enabled and audio is ready
      if (autoPlay && !autoPlayAttempted.current && audioRef.current) {
        const audio = audioRef.current;
        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA or higher
          autoPlayAttempted.current = true;
          audio.play().then(() => {
            console.log('SimpleAudioPlayer: Autoplay successful after user interaction detection!');
            setAutoPlayBlocked(false);
            toast('🎵 Audio instructions are now playing!', {
              duration: 3000,
              icon: '🔊',
              style: {
                background: '#10B981',
                color: 'white',
              },
            });
          }).catch(() => {
            setAutoPlayBlocked(true);
          });
        }
      }
    };

    // Listen for any user interaction
    document.addEventListener('click', detectInteraction, { once: true });
    document.addEventListener('keydown', detectInteraction, { once: true });
    document.addEventListener('touchstart', detectInteraction, { once: true });
    document.addEventListener('scroll', detectInteraction, { once: true });

    return () => {
      document.removeEventListener('click', detectInteraction);
      document.removeEventListener('keydown', detectInteraction);
      document.removeEventListener('touchstart', detectInteraction);
      document.removeEventListener('scroll', detectInteraction);
    };
  }, [autoPlay, hasValidAudioUrl]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !hasValidAudioUrl) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError('Failed to load audio file');
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      // Try autoplay if enabled and not attempted yet
      if (autoPlay && !autoPlayAttempted.current) {
        autoPlayAttempted.current = true;

        // Try multiple strategies for autoplay
        const attemptAutoplay = async () => {
          try {
            // Strategy 1: Direct play
            await audio.play();
            console.log('SimpleAudioPlayer: Autoplay successful!');
            toast('🎵 Audio instructions are now playing!', {
              duration: 3000,
              icon: '🔊',
              style: {
                background: '#10B981',
                color: 'white',
              },
            });
          } catch (error) {
            console.log('SimpleAudioPlayer: Direct autoplay failed, trying with user interaction detection');

            // Strategy 2: Wait for any user interaction
            const enableAutoplayOnInteraction = () => {
              audio.play().then(() => {
                console.log('SimpleAudioPlayer: Autoplay successful after user interaction!');
                toast('🎵 Audio instructions are now playing!', {
                  duration: 3000,
                  icon: '🔊',
                  style: {
                    background: '#10B981',
                    color: 'white',
                  },
                });
                // Remove listeners after successful play
                document.removeEventListener('click', enableAutoplayOnInteraction);
                document.removeEventListener('keydown', enableAutoplayOnInteraction);
                document.removeEventListener('touchstart', enableAutoplayOnInteraction);
              }).catch(() => {
                // Still failed, show manual play message
                setAutoPlayBlocked(true);
                if (onAutoPlayBlocked) {
                  onAutoPlayBlocked();
                }
              });
            };

            // Listen for any user interaction
            document.addEventListener('click', enableAutoplayOnInteraction, { once: true });
            document.addEventListener('keydown', enableAutoplayOnInteraction, { once: true });
            document.addEventListener('touchstart', enableAutoplayOnInteraction, { once: true });

            // Show immediate feedback
            setAutoPlayBlocked(true);
            if (onAutoPlayBlocked) {
              onAutoPlayBlocked();
            }
            toast('🔊 Audio instructions ready! Click anywhere to start playing.', {
              duration: 8000,
              icon: '🎵',
              style: {
                background: '#3B82F6',
                color: 'white',
                fontWeight: 'bold',
              },
            });

            // Cleanup listeners after 10 seconds
            setTimeout(() => {
              document.removeEventListener('click', enableAutoplayOnInteraction);
              document.removeEventListener('keydown', enableAutoplayOnInteraction);
              document.removeEventListener('touchstart', enableAutoplayOnInteraction);
            }, 10000);
          }
        };

        attemptAutoplay();
      }
    };

    // Add event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [autoPlay, onAutoPlayBlocked, hasValidAudioUrl]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || error) return;

    if (isPlaying) {
      audio.pause();
    } else {
      try {
        await audio.play();
        // Clear autoplay blocked state when user manually plays
        if (autoPlayBlocked) {
          setAutoPlayBlocked(false);
        }
      } catch (err) {
        console.error('Failed to play audio:', err);
        toast.error('Failed to play audio');
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Don't render anything if there's no valid audio URL
  if (!hasValidAudioUrl) {
    return null;
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
        <div className="w-full bg-gradient-to-r from-blue-100 to-blue-200 border-2 border-blue-300 rounded-lg p-3 mb-2 animate-pulse">
          <div className="flex items-center">
            <div className="animate-bounce mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <span className="text-sm text-blue-800 font-bold">🎵 Audio Ready!</span>
              <p className="text-xs text-blue-700 mt-1">Click anywhere on the page or the play button to start audio instructions</p>
            </div>
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
          src={sanitizedAudioUrl}
          preload="metadata"
        />

        {error ? (
          <div className="w-full flex flex-col items-center justify-center text-center p-2">
            <div className="text-red-500 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Audio URL: {sanitizedAudioUrl ? sanitizedAudioUrl.substring(0, 50) + (sanitizedAudioUrl.length > 50 ? '...' : '') : 'None'}
            </p>
          </div>
        ) : (
          <>
            <button
              onClick={togglePlay}
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
                onChange={handleSeek}
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

SimpleAudioPlayer.displayName = 'SimpleAudioPlayer';

export default SimpleAudioPlayer;
