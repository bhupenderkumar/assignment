import React, { useState } from 'react';

// Define types for the matching exercise
export interface MatchingExerciseItem {
  id: string;
  content: string;
  imageUrl?: string;
}

export interface MatchingExerciseData {
  sourceItems: MatchingExerciseItem[];
  targetItems: MatchingExerciseItem[];
  correctPairs: { sourceId: string; targetId: string }[];
}

interface MatchingExerciseProps {
  data: MatchingExerciseData;
  onComplete: (isCorrect: boolean, score: number) => void;
  showFeedback?: boolean;
  readOnly?: boolean;
  initialMatches?: { sourceId: string; targetId: string }[];
  audioInstructions?: string; // URL to audio file with instructions
}

// Simple implementation of the MatchingExercise component
const MatchingExercise: React.FC<MatchingExerciseProps> = ({
  data,
  onComplete,
  showFeedback: initialShowFeedback = false,
  initialMatches = [],
}) => {
  const [matches, setMatches] = useState<{ sourceId: string; targetId: string }[]>(initialMatches);
  const [showFeedback, setShowFeedback] = useState(initialShowFeedback);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  // Handle source item click
  const handleSourceItemClick = (sourceId: string) => {
    setSelectedSourceId(sourceId);
  };

  // Handle target item click
  const handleTargetItemClick = (targetId: string) => {
    if (selectedSourceId) {
      // Add the match
      const newMatches = [...matches, { sourceId: selectedSourceId, targetId }];
      setMatches(newMatches);
      setSelectedSourceId(null);

      // Calculate score
      const correctMatches = newMatches.filter(match => {
        return data.correctPairs.some(
          pair => pair.sourceId === match.sourceId && pair.targetId === match.targetId
        );
      });

      const score = Math.round((correctMatches.length / data.sourceItems.length) * 100);
      const allCorrect = correctMatches.length === data.sourceItems.length;

      // Show feedback
      setShowFeedback(true);

      // Call onComplete
      onComplete(allCorrect, score);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 my-4">
      <h3 className="text-xl font-bold mb-4 text-center">Match the items</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source Items */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-semibold text-center mb-2">Items</h4>
          {data.sourceItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border-2 ${selectedSourceId === item.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'} cursor-pointer shadow-md`}
              onClick={() => handleSourceItemClick(item.id)}
            >
              <div className="flex items-center">
                {item.imageUrl && (
                  <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-lg mr-3">
                    <img
                      src={item.imageUrl}
                      alt={item.content}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <span className="text-lg font-medium">{item.content}</span>
                {selectedSourceId === item.id && (
                  <span className="ml-auto text-blue-500">✓</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Target Items */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-semibold text-center mb-2">Matches</h4>
          {data.targetItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border-2 ${selectedSourceId ? 'border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50' : 'border-gray-300 bg-white'} cursor-pointer shadow-md`}
              onClick={() => selectedSourceId && handleTargetItemClick(item.id)}
            >
              <div className="flex items-center">
                {item.imageUrl && (
                  <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-lg mr-3">
                    <img
                      src={item.imageUrl}
                      alt={item.content}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <span className="text-lg font-medium">{item.content}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Message */}
      {showFeedback && (
        <div className="mt-8 text-center">
          <h3 className="text-xl font-bold mb-2">
            {matches.every(
              ({ sourceId, targetId }) =>
                data.correctPairs.some(pair =>
                  pair.sourceId === sourceId && pair.targetId === targetId
                )
            )
              ? '🎉 Great job! All matches are correct!'
              : '😊 Good try! Some matches need adjustment.'}
          </h3>
          <button
            onClick={() => setShowFeedback(false)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all duration-300 text-lg mt-4"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchingExercise;
