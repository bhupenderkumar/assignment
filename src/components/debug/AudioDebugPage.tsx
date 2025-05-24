// src/components/debug/AudioDebugPage.tsx
import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import SimpleAudioPlayer from '../common/SimpleAudioPlayer';

const AudioDebugPage: React.FC = () => {
  const { supabase } = useSupabaseAuth();
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const assignmentId = 'fd11f901-b974-4636-9c0b-42393b2ba75f';

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!supabase) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('interactive_assignment')
          .select('id, title, audio_instructions')
          .eq('id', assignmentId)
          .single();

        if (error) throw error;
        setAssignment(data);
      } catch (err) {
        console.error('Error fetching assignment:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [supabase]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Audio Debug Page</h1>
        <div className="animate-pulse">Loading assignment...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Audio Debug Page</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Audio Debug Page</h1>

      {assignment && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Assignment Details</h2>
            <div className="space-y-2">
              <p><strong>ID:</strong> {assignment.id}</p>
              <p><strong>Title:</strong> {assignment.title}</p>
              <p><strong>Audio URL:</strong> {assignment.audio_instructions || 'No audio'}</p>
            </div>
          </div>

          {assignment.audio_instructions && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Simple Audio Player Test</h2>
              <SimpleAudioPlayer
                audioUrl={assignment.audio_instructions}
                autoPlay={false}
                label="Assignment Audio Instructions"
                className="w-full"
              />
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Direct Audio Element Test</h2>
            {assignment.audio_instructions ? (
              <audio controls className="w-full">
                <source src={assignment.audio_instructions} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
            ) : (
              <p className="text-gray-500">No audio URL available</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">URL Analysis</h2>
            {assignment.audio_instructions ? (
              <div className="space-y-2">
                <p><strong>Original URL:</strong> {assignment.audio_instructions}</p>
                <p><strong>Has double slash:</strong> {assignment.audio_instructions.includes('//audio_') ? 'Yes ❌' : 'No ✅'}</p>
                <p><strong>URL Length:</strong> {assignment.audio_instructions.length}</p>
                <p><strong>Domain:</strong> {new URL(assignment.audio_instructions).hostname}</p>
                <a
                  href={assignment.audio_instructions}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Test URL in New Tab
                </a>
              </div>
            ) : (
              <p className="text-gray-500">No audio URL to analyze</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioDebugPage;
