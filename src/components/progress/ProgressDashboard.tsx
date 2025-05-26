// src/components/progress/ProgressDashboard.tsx
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserProgress, UserJourney } from '../../hooks/useUserProgress';
import { useConfiguration } from '../../context/ConfigurationContext';

interface ProgressDashboardProps {
  journey?: UserJourney | null;
  showDetailedView?: boolean;
  className?: string;
  showMobileOptimized?: boolean;
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  journey: externalJourney,
  showDetailedView = false,
  className = '',
  showMobileOptimized = true,
}) => {
  const { currentJourney, getProgressPercentage, getCurrentMilestone, getTimeSpentOnQuestion } = useUserProgress();
  const { config } = useConfiguration();

  const journey = externalJourney || currentJourney;

  // Memoize calculations for better performance
  const progressData = useMemo(() => {
    if (!journey) return null;

    const answeredQuestions = Object.values(journey.questionsProgress).filter(q => q.answeredAt).length;
    const correctAnswers = Object.values(journey.questionsProgress).filter(q => q.answeredAt && q.isCorrect).length;
    const progressPercentage = getProgressPercentage();
    const milestone = getCurrentMilestone();
    const accuracy = answeredQuestions > 0 ? Math.round((correctAnswers / answeredQuestions) * 100) : 0;
    const averageTimePerQuestion = answeredQuestions > 0 ? Math.round(journey.totalTimeSpent / answeredQuestions) : 0;

    return {
      answeredQuestions,
      correctAnswers,
      progressPercentage,
      milestone,
      accuracy,
      averageTimePerQuestion,
    };
  }, [journey, getProgressPercentage, getCurrentMilestone]);

  if (!journey || !progressData) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-500 dark:text-gray-400 text-center">Loading progress data...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = getProgressPercentage();
  const milestone = getCurrentMilestone();
  const answeredQuestions = Object.values(journey.questionsProgress).filter(q => q.answeredAt).length;
  const totalTimeMinutes = Math.floor(journey.totalTimeSpent / 60);
  const totalTimeSeconds = journey.totalTimeSpent % 60;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMilestoneColor = (milestone: string): string => {
    switch (milestone) {
      case 'Completed': return 'text-green-600 dark:text-green-400';
      case 'Halfway Complete': return 'text-yellow-600 dark:text-yellow-400';
      case 'In Progress': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Progress Dashboard
        </h3>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${getMilestoneColor(milestone)} bg-opacity-10`}>
          {milestone}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Overall Progress
          </span>
          <span className="text-sm font-bold" style={{ color: config.primaryColor }}>
            {progressPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-3 rounded-full"
            style={{ backgroundColor: config.primaryColor }}
          />
        </div>
      </div>

      {/* Enhanced Stats Grid - Mobile Optimized */}
      <div className={`grid ${showMobileOptimized ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 md:grid-cols-4'} gap-3 sm:gap-4 mb-6`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
            {progressData.answeredQuestions}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            of {journey.totalQuestions} answered
          </div>
          <div className="mt-1 text-xs text-blue-500 dark:text-blue-300">
            {progressData.progressPercentage}% complete
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
        >
          <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
            {formatTime(journey.totalTimeSpent)}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">
            total time
          </div>
          <div className="mt-1 text-xs text-green-500 dark:text-green-300">
            {progressData.averageTimePerQuestion}s avg/question
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
        >
          <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
            {progressData.accuracy}%
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400">
            accuracy
          </div>
          <div className="mt-1 text-xs text-purple-500 dark:text-purple-300">
            {progressData.correctAnswers} correct
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
        >
          <div className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
            {progressData.milestone}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400">
            milestone
          </div>
          <div className="mt-1 text-xs text-orange-500 dark:text-orange-300">
            current status
          </div>
        </motion.div>

        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {journey.currentQuestionIndex + 1}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400">
            current question
          </div>
        </div>

        <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {Object.values(journey.questionsProgress).reduce((sum, q) => sum + q.attempts, 0)}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400">
            total attempts
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Journey Milestones
        </h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Started: {journey.milestones.started.toLocaleTimeString()}
            </span>
          </div>

          {journey.milestones.firstQuestionAnswered && (
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                First Answer: {journey.milestones.firstQuestionAnswered.toLocaleTimeString()}
              </span>
            </div>
          )}

          {journey.milestones.halfwayComplete && (
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Halfway: {journey.milestones.halfwayComplete.toLocaleTimeString()}
              </span>
            </div>
          )}

          {journey.milestones.completed && (
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Completed: {journey.milestones.completed.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Question Progress */}
      {showDetailedView && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Question-by-Question Progress
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {Object.values(journey.questionsProgress)
              .sort((a, b) => a.questionIndex - b.questionIndex)
              .map((questionProgress) => (
                <div
                  key={questionProgress.questionId}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Q{questionProgress.questionIndex + 1}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                      questionProgress.answeredAt
                        ? questionProgress.isCorrect
                          ? 'bg-green-500'
                          : 'bg-red-500'
                        : 'bg-gray-300'
                    }`} />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(questionProgress.timeSpent)} • {questionProgress.attempts} attempts
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProgressDashboard;
