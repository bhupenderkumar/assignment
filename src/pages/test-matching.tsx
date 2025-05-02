import React from 'react';
import MatchingExercise, { MatchingExerciseData } from '../components/exercises/MatchingExercise';

const TestMatchingPage: React.FC = () => {
  // Sample data for testing
  const matchingData: MatchingExerciseData = {
    sourceItems: [
      { id: 's1', content: 'Dog', imageUrl: 'https://via.placeholder.com/150?text=Dog' },
      { id: 's2', content: 'Cat', imageUrl: 'https://via.placeholder.com/150?text=Cat' },
      { id: 's3', content: 'Bird', imageUrl: 'https://via.placeholder.com/150?text=Bird' },
    ],
    targetItems: [
      { id: 't1', content: 'Woof', imageUrl: 'https://via.placeholder.com/150?text=Woof' },
      { id: 't2', content: 'Meow', imageUrl: 'https://via.placeholder.com/150?text=Meow' },
      { id: 't3', content: 'Tweet', imageUrl: 'https://via.placeholder.com/150?text=Tweet' },
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
      <h1 className="text-2xl font-bold mb-6">Test Matching Exercise</h1>
      <p className="mb-4">
        This is a test page for the enhanced matching exercise component.
        Try clicking on any item to select it, then click on a matching item to create a match.
      </p>
      <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-blue-700 mb-2">
          Want to try the matching exercise with audio instructions?
        </p>
        <a
          href="/test-matching-audio"
          className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          Go to Test Matching with Audio
        </a>
      </div>

      <MatchingExercise
        data={matchingData}
        onComplete={handleComplete}
      />
    </div>
  );
};

export default TestMatchingPage;
