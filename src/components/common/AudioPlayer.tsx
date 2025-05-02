// src/components/common/AudioPlayer.tsx
import { useState, useRef, useEffect } from 'react';

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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleAudioEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    // Add event listeners
    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleAudioEnd);

    // Auto play if enabled
    if (autoPlay) {
      audio.play().catch(error => {
        console.error('Auto play failed:', error);
      });
    }

    // Clean up
    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleAudioEnd);
    };
  }, [audioUrl, autoPlay]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        console.error('Play failed:', error);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

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

  return (
    <div className={`flex flex-col ${className}`}>
      {showLabel && (
        <div className="flex items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
      )}
      <div className="bg-gray-100 rounded-lg p-3 flex items-center space-x-2">
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
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
      </div>
    </div>
  );
};

export default AudioPlayer;
