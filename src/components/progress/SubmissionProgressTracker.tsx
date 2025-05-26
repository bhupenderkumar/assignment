// src/components/progress/SubmissionProgressTracker.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubmissionStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  duration?: number;
  error?: string;
}

interface SubmissionProgressTrackerProps {
  isVisible: boolean;
  currentStep: string;
  steps: SubmissionStep[];
  onComplete?: () => void;
  onError?: (error: string) => void;
  showPerformanceMetrics?: boolean;
}

const SubmissionProgressTracker: React.FC<SubmissionProgressTrackerProps> = ({
  isVisible,
  currentStep,
  steps,
  onComplete,
  onError,
  showPerformanceMetrics = true,
}) => {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [stepTimes, setStepTimes] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isVisible && !startTime) {
      setStartTime(performance.now());
    }
  }, [isVisible, startTime]);

  useEffect(() => {
    if (currentStep && startTime) {
      const now = performance.now();
      setStepTimes(prev => ({
        ...prev,
        [currentStep]: now - startTime
      }));
    }
  }, [currentStep, startTime]);

  const getStepIcon = (status: SubmissionStep['status']) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'active':
        return (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          </div>
        );
      case 'error':
        return (
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          </div>
        );
    }
  };

  const totalTime = startTime ? performance.now() - startTime : 0;
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Submitting Assignment
            </h3>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {completedSteps} of {steps.length} steps completed
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-3"
              >
                {getStepIcon(step.status)}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    step.status === 'active' ? 'text-blue-600 dark:text-blue-400' :
                    step.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                    step.status === 'error' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                  {step.status === 'error' && step.error && (
                    <p className="text-xs text-red-500 mt-1">{step.error}</p>
                  )}
                  {showPerformanceMetrics && stepTimes[step.id] && (
                    <p className="text-xs text-gray-400 mt-1">
                      {(stepTimes[step.id] / 1000).toFixed(2)}s
                    </p>
                  )}
                </div>
                {step.status === 'active' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Performance Metrics */}
          {showPerformanceMetrics && totalTime > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Total time: {(totalTime / 1000).toFixed(2)}s
              </p>
              {progressPercentage === 100 && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ✅ Submission completed successfully!
                </p>
              )}
            </div>
          )}

          {/* Loading Animation */}
          <div className="flex justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubmissionProgressTracker;
