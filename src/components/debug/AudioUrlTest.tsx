// src/components/debug/AudioUrlTest.tsx
import React, { useState } from 'react';

const AudioUrlTest: React.FC = () => {
  const [testUrl, setTestUrl] = useState('https://uymsiskesqqrfnpslinp.supabase.co/storage/v1/object/public/audio-instructions//audio_1748088449121.wav');
  
  // URL sanitization function (same as in AudioPlayer)
  const sanitizeUrl = (url: string): string => {
    if (!url) return '';
    // Fix double slashes in the path while preserving protocol
    return url.replace(/\/\/+/g, '/').replace(':/', '://');
  };

  const sanitizedUrl = sanitizeUrl(testUrl);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Audio URL Test</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test URL (with double slash issue):
          </label>
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sanitized URL:
          </label>
          <div className="p-2 bg-gray-100 rounded-md font-mono text-sm">
            {sanitizedUrl}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Original URL (Broken)</h3>
            <audio controls className="w-full mb-2">
              <source src={testUrl} type="audio/wav" />
              Your browser does not support the audio element.
            </audio>
            <a 
              href={testUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm"
            >
              Test original URL in new tab
            </a>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Sanitized URL (Fixed)</h3>
            <audio controls className="w-full mb-2">
              <source src={sanitizedUrl} type="audio/wav" />
              Your browser does not support the audio element.
            </audio>
            <a 
              href={sanitizedUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm"
            >
              Test sanitized URL in new tab
            </a>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">URL Analysis:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li><strong>Original has double slash:</strong> {testUrl.includes('//audio_') ? 'Yes ❌' : 'No ✅'}</li>
            <li><strong>Sanitized has double slash:</strong> {sanitizedUrl.includes('//audio_') ? 'Yes ❌' : 'No ✅'}</li>
            <li><strong>URLs are different:</strong> {testUrl !== sanitizedUrl ? 'Yes ✅' : 'No ❌'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AudioUrlTest;
