// src/components/progress/UserProgressTracker.tsx
import React, { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserProgress } from '../../hooks/useUserProgress';
import { useConfiguration } from '../../context/ConfigurationContext';
import { InteractiveAssignment, InteractiveQuestion } from '../../types/interactiveAssignment';

interface UserProgressTrackerProps {
  assignment: InteractiveAssignment;
  currentQuestionIndex: number;
  currentQuestion?: InteractiveQuestion;
  onQuestionAnswer?: (questionId: string, isCorrect: boolean, responseData?: any) => void;
  showMiniDashboard?: boolean;
  autoSaveInterval?: number; // in seconds, default 30
}

const UserProgressTracker: React.FC<UserProgressTrackerProps> = ({
  assignment,
  currentQuestionIndex,
  currentQuestion,
  onQuestionAnswer,
  showMiniDashboard = true,
  autoSaveInterval = 30,
}) => {
  const {
    currentJourney,
    isTracking,
    startTracking,
    trackQuestionStart,
    trackQuestionAnswer,
    trackQuestionNavigation,
    getProgressPercentage,
    getCurrentMilestone,
    saveProgress,
  } = useUserProgress();

  const { config } = useConfiguration();

  // Initialize tracking when component mounts
  useEffect(() => {
    if (assignment && assignment.questions && !isTracking) {
      console.log('🎯 UserProgressTracker: Initializing tracking for assignment:', assignment.id, 'with', assignment.questions.length, 'questions');
      startTracking(assignment.id, assignment.questions.length);
    }
  }, [assignment, isTracking, startTracking]);

  // Track question navigation - use refs to prevent infinite loops
  const prevQuestionRef = useRef<string | null>(null);
  const prevQuestionIndexRef = useRef<number>(-1);

  useEffect(() => {
    if (currentQuestion && isTracking && currentQuestion.id !== prevQuestionRef.current) {
      console.log('🎯 UserProgressTracker: Starting question tracking for:', currentQuestion.id, 'at index:', currentQuestionIndex);
      trackQuestionStart(currentQuestion.id, currentQuestionIndex);
      prevQuestionRef.current = currentQuestion.id;
    }
  }, [currentQuestion?.id, currentQuestionIndex, isTracking, trackQuestionStart]);

  // Track question index changes
  useEffect(() => {
    if (isTracking && currentQuestionIndex !== prevQuestionIndexRef.current) {
      console.log('🎯 UserProgressTracker: Question navigation to index:', currentQuestionIndex);
      trackQuestionNavigation(currentQuestionIndex);
      prevQuestionIndexRef.current = currentQuestionIndex;
    }
  }, [currentQuestionIndex, isTracking, trackQuestionNavigation]);

  // Auto-save progress periodically
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      saveProgress();
    }, autoSaveInterval * 1000);

    return () => clearInterval(interval);
  }, [isTracking, saveProgress, autoSaveInterval]);

  // Handle question answers
  const handleQuestionAnswer = useCallback((questionId: string, isCorrect: boolean, responseData?: any) => {
    if (isTracking) {
      trackQuestionAnswer(questionId, isCorrect, responseData);
    }

    // Call parent callback if provided
    if (onQuestionAnswer) {
      onQuestionAnswer(questionId, isCorrect, responseData);
    }
  }, [isTracking, trackQuestionAnswer, onQuestionAnswer]);

  // Expose the answer handler for parent components
  useEffect(() => {
    // Store the handler in a way that parent components can access it
    if (typeof window !== 'undefined') {
      (window as any).trackQuestionAnswer = handleQuestionAnswer;
    }
  }, [handleQuestionAnswer]);

  if (!showMiniDashboard || !currentJourney) {
    return null;
  }

  const progressPercentage = getProgressPercentage();
  const milestone = getCurrentMilestone();
  const answeredQuestions = Object.values(currentJourney.questionsProgress).filter(q => q.answeredAt).length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs"
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Progress
          </h4>
          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
            {milestone}
          </span>
        </div>

        {/* Mini Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {answeredQuestions}/{currentJourney.totalQuestions} answered
            </span>
            <span className="text-xs font-bold" style={{ color: config.primaryColor }}>
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
              className="h-2 rounded-full"
              style={{ backgroundColor: config.primaryColor }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
            <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {currentQuestionIndex + 1}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Current
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded p-2">
            <div className="text-sm font-bold text-green-600 dark:text-green-400">
              {Math.floor(currentJourney.totalTimeSpent / 60)}m
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              Time
            </div>
          </div>
        </div>

        {/* Question Progress Dots */}
        <div className="mt-3">
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: currentJourney.totalQuestions }, (_, index) => {
              const questionProgress = Object.values(currentJourney.questionsProgress)
                .find(q => q.questionIndex === index);

              let dotColor = 'bg-gray-300 dark:bg-gray-600'; // Not started

              if (questionProgress?.answeredAt) {
                dotColor = questionProgress.isCorrect
                  ? 'bg-green-500'
                  : 'bg-red-500';
              } else if (index === currentQuestionIndex) {
                dotColor = 'bg-blue-500'; // Current question
              }

              return (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`w-2 h-2 rounded-full ${dotColor}`}
                  title={`Question ${index + 1}${questionProgress?.answeredAt ?
                    ` - ${questionProgress.isCorrect ? 'Correct' : 'Incorrect'}` : ''}`}
                />
              );
            })}
          </div>
        </div>

        {/* Milestone Indicator */}
        {milestone !== 'Just Started' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 text-center"
          >
            <div className="text-xs text-gray-500 dark:text-gray-400">
              🎯 {milestone}
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default UserProgressTracker;
