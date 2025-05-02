// src/pages/test-matching-audio.tsx
import React from 'react';
import EnhancedMatchingExercise, { MatchingExerciseData } from '../components/exercises/EnhancedMatchingExercise';

const TestMatchingAudioPage = () => {
  // Sample audio URL - replace with an actual audio file URL
  const sampleAudioUrl = 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3';

  // Sample matching data
  const matchingData: MatchingExerciseData = {
    sourceItems: [
      { id: 's1', content: 'Apple', imageUrl: 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80' },
      { id: 's2', content: 'Banana', imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80' },
      { id: 's3', content: 'Orange', imageUrl: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80' },
    ],
    targetItems: [
      { id: 't1', content: 'Red Fruit' },
      { id: 't2', content: 'Yellow Fruit' },
      { id: 't3', content: 'Orange Fruit' },
    ],
    correctPairs: [
      { sourceId: 's1', targetId: 't1' },
      { sourceId: 's2', targetId: 't2' },
      { sourceId: 's3', targetId: 't3' },
    ]
  };

  const handleComplete = (isCorrect: boolean, score: number) => {
    console.log(`Exercise completed. All correct: ${isCorrect}, Score: ${score}%`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Test Matching Exercise with Audio</h1>
      <p className="mb-4">
        This is a test page for the enhanced matching exercise component with audio instructions.
        Try clicking on the audio player to hear the instructions, and use the floating audio button to replay them.
      </p>
      <div className="mb-6 bg-purple-50 p-4 rounded-lg border border-purple-200">
        <p className="text-purple-700 mb-2">
          Want to try the basic matching exercise without audio?
        </p>
        <a
          href="/test-matching"
          className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          Go to Basic Test Matching
        </a>
      </div>

      <EnhancedMatchingExercise
        data={matchingData}
        onComplete={handleComplete}
        audioInstructions={sampleAudioUrl}
      />
    </div>
  );
};

export default TestMatchingAudioPage;
