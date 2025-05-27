import React from 'react';
import { motion } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';
import { useTranslations } from '../../hooks/useTranslations';

interface MobileProgressIndicatorProps {
  currentQuestion: number;
  totalQuestions: number;
  score?: number;
  timeSpent?: number; // in seconds
  assignmentTitle?: string;
  organizationName?: string;
}

const MobileProgressIndicator: React.FC<MobileProgressIndicatorProps> = ({
  currentQuestion,
  totalQuestions,
  score,
  timeSpent,
  assignmentTitle,
  organizationName
}) => {
  const { config } = useConfiguration();
  const { commonTranslate } = useTranslations();

  // Validate and sanitize input values
  const validCurrentQuestion = Math.max(1, currentQuestion || 1);
  const validTotalQuestions = Math.max(1, totalQuestions || 1);
  const validScore = score !== undefined && score !== null ? score : 0;

  // Calculate progress percentage
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

  return (
    <div className={`mobile-progress-indicator ${config.darkMode ? 'mobile-bottom-nav-dark' : ''} slide-in-down`}>
      <div className="px-4 py-3">
        {/* Header with Organization and Assignment */}
        <div className="text-center mb-3">
          {organizationName && (
            <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">
              {organizationName}
            </div>
          )}
          {assignmentTitle && (
            <div className="text-lg font-bold text-gray-800 dark:text-white truncate">
              {assignmentTitle}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {commonTranslate('question', 'Question')} {validCurrentQuestion} {commonTranslate('of', 'of')} {validTotalQuestions}
            </span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {progressPercentage}%
            </span>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex justify-center space-x-6">
          {/* Score */}
          {score !== undefined && (
            <div className="text-center">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {validScore}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {commonTranslate('score', 'Score')}
              </div>
            </div>
          )}

          {/* Time */}
          {timeSpent !== undefined && (
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatTimeSpent(timeSpent)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {commonTranslate('time', 'Time')}
              </div>
            </div>
          )}

          {/* Progress Dots */}
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(validTotalQuestions, 8) }, (_, index) => {
              const questionIndex = Math.floor((index / 8) * validTotalQuestions);
              return (
                <motion.div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    questionIndex < validCurrentQuestion - 1
                      ? 'bg-green-500'
                      : questionIndex === validCurrentQuestion - 1
                      ? 'bg-indigo-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                />
              );
            })}
            {validTotalQuestions > 8 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                +{validTotalQuestions - 8}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileProgressIndicator;
