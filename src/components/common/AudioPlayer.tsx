// src/components/common/AudioPlayer.tsx
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

interface AudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const AudioPlayer = ({
  audioUrl,
  autoPlay = false,
  showLabel = true,
  label = 'Audio Instructions',
  className = ''
}: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Log the audio URL for debugging
  useEffect(() => {
    console.log('AudioPlayer: Audio URL:', audioUrl);

    // Validate the URL
    if (!audioUrl) {
      console.error('AudioPlayer: No audio URL provided');
      setError('No audio URL provided');
      return;
    }

    try {
      // Check if URL is valid
      new URL(audioUrl);
    } catch (e) {
      console.error('AudioPlayer: Invalid audio URL:', audioUrl, e);
      setError('Invalid audio URL');
      return;
    }

    // Reset error state if URL is valid
    setError(null);
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      console.log('AudioPlayer: Audio loaded successfully, duration:', audio.duration);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleAudioEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      console.error('AudioPlayer: Audio error:', e);
      setError('Failed to load audio file');
      setIsPlaying(false);
    };

    // Add event listeners
    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleAudioEnd);
    audio.addEventListener('error', handleError);

    // Auto play if enabled
    if (autoPlay && !error) {
      audio.play().catch(error => {
        console.error('Auto play failed:', error);
        // Most browsers block autoplay unless there's user interaction
        // So we'll show a toast to let the user know they can play manually
        toast.error('Autoplay blocked by browser. Please click play to listen to the audio instructions.');
      });
    }

    // Clean up
    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleAudioEnd);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, autoPlay, error]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || error) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        console.error('Play failed:', error);
        setError('Failed to play audio');
        toast.error('Failed to play audio. Please try again.');
      });
    }
    setIsPlaying(!isPlaying);
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

  return (
    <div className={`flex flex-col ${className}`}>
      {showLabel && (
        <div className="flex items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
      )}
      <div className="bg-gray-100 rounded-lg p-3 flex items-center space-x-2">
        <audio ref={audioRef} src={audioUrl} preload="metadata" />

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
              onClick={togglePlay}
              className="w-10 h-10 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full focus:outline-none"
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
};

export default AudioPlayer;
