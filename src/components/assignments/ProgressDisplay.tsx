// src/components/assignments/ProgressDisplay.tsx
import { motion } from 'framer-motion';

interface ProgressDisplayProps {
  currentQuestion: number;
  totalQuestions: number;
  score?: number;
  timeSpent?: number; // in seconds
}

const ProgressDisplay = ({
  currentQuestion,
  totalQuestions,
  score,
  timeSpent
}: ProgressDisplayProps) => {
  // Calculate progress percentage
  const progressPercentage = Math.round((currentQuestion / totalQuestions) * 100);

  // Format time spent
  const formatTimeSpent = (seconds?: number) => {
    if (!seconds) return '00:00';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-6 progress-display">
      <div className="flex flex-wrap items-center justify-between">
        <div className="mb-2 md:mb-0">
          <h3 className="text-lg font-bold">Progress</h3>
          <p className="text-gray-600">
            Question {currentQuestion} of {totalQuestions}
          </p>
        </div>

        {score !== undefined && (
          <div className="mb-2 md:mb-0 text-center">
            <h3 className="text-lg font-bold">Score</h3>
            <p className="text-blue-600 font-bold">{score !== null ? score : 0}%</p>
          </div>
        )}

        {timeSpent !== undefined && (
          <div className="mb-2 md:mb-0 text-center">
            <h3 className="text-lg font-bold">Time</h3>
            <p className="text-gray-600">{formatTimeSpent(timeSpent)}</p>
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-right text-sm text-gray-500 mt-1">{progressPercentage}% complete</p>
      </div>
    </div>
  );
};

export default ProgressDisplay;
