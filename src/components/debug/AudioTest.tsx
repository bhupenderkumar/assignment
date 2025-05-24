// src/components/debug/AudioTest.tsx
import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

const AudioTest: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // The actual audio URL from the assignment
  const audioUrl = 'https://uymsiskesqqrfnpslinp.supabase.co/storage/v1/object/public/audio-instructions//audio_1748088449121.wav';

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = () => {
      console.log('AudioTest: Audio loaded successfully');
      setIsLoaded(true);
      setError(null);
      
      // Try autoplay immediately
      audio.play().then(() => {
        console.log('AudioTest: Autoplay successful!');
        setIsPlaying(true);
        toast.success('🎵 Audio is playing!');
      }).catch(error => {
        console.error('AudioTest: Autoplay failed:', error);
        toast.error('Autoplay blocked. Click play button.');
      });
    };

    const handleError = (e: Event) => {
      console.error('AudioTest: Audio error:', e);
      const target = e.target as HTMLAudioElement;
      if (target.error) {
        console.error('AudioTest: Error code:', target.error.code);
        console.error('AudioTest: Error message:', target.error.message);
        setError(`Audio error: ${target.error.message}`);
      } else {
        setError('Unknown audio error');
      }
      setIsLoaded(false);
    };

    const handlePlay = () => {
      console.log('AudioTest: Play event');
      setIsPlaying(true);
    };

    const handlePause = () => {
      console.log('AudioTest: Pause event');
      setIsPlaying(false);
    };

    const handleEnded = () => {
      console.log('AudioTest: Audio ended');
      setIsPlaying(false);
    };

    // Add event listeners
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    // Load the audio
    audio.load();

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        console.error('AudioTest: Manual play failed:', error);
        toast.error('Failed to play audio');
      });
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-md mx-auto mt-8">
      <h2 className="text-lg font-bold mb-4">Audio Test Component</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Status: {error ? 'Error' : isLoaded ? 'Loaded' : 'Loading...'}
        </p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-2">
            {error}
          </div>
        )}
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onLoadStart={() => console.log('AudioTest: Load start')}
        onLoadedMetadata={() => console.log('AudioTest: Metadata loaded')}
        onCanPlay={() => console.log('AudioTest: Can play')}
        onCanPlayThrough={() => console.log('AudioTest: Can play through')}
      />

      <div className="flex items-center space-x-4">
        <button
          onClick={togglePlay}
          disabled={!isLoaded}
          className={`px-4 py-2 rounded text-white font-medium ${
            isLoaded 
              ? 'bg-blue-500 hover:bg-blue-600' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        
        <span className="text-sm text-gray-600">
          {isPlaying ? '🔊 Playing' : '⏸️ Stopped'}
        </span>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>Audio URL: {audioUrl.substring(0, 50)}...</p>
      </div>
    </div>
  );
};

export default AudioTest;
