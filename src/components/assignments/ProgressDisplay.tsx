// src/components/assignments/ProgressDisplay.tsx
import { motion } from 'framer-motion';
import { useEffect } from 'react';

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
  // Debug logging to track the "0 by 0" issue - only in development and throttled
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Throttle logging to prevent spam
      const now = Date.now();
      const lastLogKey = 'lastProgressDisplayLog';
      const lastLog = (window as any)[lastLogKey] || 0;

      if (now - lastLog > 3000) { // Log at most every 3 seconds
        console.log('🔍 ProgressDisplay Debug:', {
          currentQuestion,
          totalQuestions,
          score,
          timeSpent,
          isValidData: currentQuestion > 0 && totalQuestions > 0
        });
        (window as any)[lastLogKey] = now;
      }
    }
  }, [currentQuestion, totalQuestions, score, timeSpent]);

  // Validate and sanitize input values
  const validCurrentQuestion = Math.max(1, currentQuestion || 1);
  const validTotalQuestions = Math.max(1, totalQuestions || 1);
  const validScore = score !== undefined && score !== null ? score : 0;

  // Calculate progress percentage with validation
  const progressPercentage = validTotalQuestions > 0
    ? Math.round((validCurrentQuestion / validTotalQuestions) * 100)
    : 0;

  // Format time spent
  const formatTimeSpent = (seconds?: number) => {
    if (!seconds || seconds < 0) return '00:00';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Show warning if invalid data is detected - only in development
  if (process.env.NODE_ENV === 'development' && (currentQuestion <= 0 || totalQuestions <= 0)) {
    console.warn('⚠️ ProgressDisplay: Invalid data detected', {
      currentQuestion,
      totalQuestions
    });
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-lg p-4 mb-6 progress-display border border-purple-100">
      {/* Mobile-First Design */}
      <div className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
        {/* Progress Info - Mobile Optimized */}
        <div className="text-center md:text-left">
          <h3 className="text-lg font-bold text-gray-800 mb-1">Progress</h3>
          <div className="flex items-center justify-center md:justify-start space-x-2">
            <span className="text-2xl font-bold text-purple-600">
              {validCurrentQuestion}
            </span>
            <span className="text-gray-400 text-lg">/</span>
            <span className="text-lg font-semibold text-gray-600">
              {validTotalQuestions}
            </span>
            <span className="text-sm text-gray-500 ml-2">questions</span>
          </div>
        </div>

        {/* Score Display - Enhanced */}
        {score !== undefined && (
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Score</h3>
            <div className="flex items-center justify-center space-x-1">
              <span className="text-2xl font-bold text-green-600">
                {validScore}
              </span>
              <span className="text-lg text-green-500">%</span>
            </div>
          </div>
        )}

        {/* Time Display - Enhanced */}
        {timeSpent !== undefined && (
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Time</h3>
            <div className="flex items-center justify-center space-x-1">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-lg font-semibold text-blue-600">
                {formatTimeSpent(timeSpent)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">
            Question {validCurrentQuestion} of {validTotalQuestions}
          </span>
          <span className="text-sm font-bold text-purple-600">
            {progressPercentage}% complete
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-sm"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {/* Progress Dots for Mobile */}
        <div className="flex justify-center mt-3 space-x-1 md:hidden">
          {Array.from({ length: validTotalQuestions }, (_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                index < validCurrentQuestion
                  ? 'bg-purple-500'
                  : index === validCurrentQuestion - 1
                  ? 'bg-purple-300'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressDisplay;
