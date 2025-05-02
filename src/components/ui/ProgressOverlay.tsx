// src/components/ui/ProgressOverlay.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';

interface ProgressOverlayProps {
  isVisible: boolean;
  progress: number;
  status: string;
  onCancel?: () => void;
  showCancelButton?: boolean;
}

const ProgressOverlay: React.FC<ProgressOverlayProps> = ({
  isVisible,
  progress,
  status,
  onCancel,
  showCancelButton = false
}) => {
  const { config } = useConfiguration();
  const [showSpinner, setShowSpinner] = useState(true);
  
  // Hide spinner after a certain progress threshold
  useEffect(() => {
    if (progress > 95) {
      setShowSpinner(false);
    } else if (progress < 5) {
      setShowSpinner(true);
    }
  }, [progress]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
          >
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4" style={{ color: config.primaryColor }}>
                {progress >= 100 ? 'Completed' : 'In Progress'}
              </h3>
              
              <div className="mb-4">
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: 'spring', stiffness: 50 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: config.accentColor }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{progress}%</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {progress >= 100 ? 'Complete' : 'In Progress'}
                  </span>
                </div>
              </div>
              
              <div className="mb-4 min-h-16 flex items-center justify-center">
                {showSpinner && (
                  <div className="mr-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full"
                      style={{ borderTopColor: config.primaryColor }}
                    />
                  </div>
                )}
                <p className="text-gray-600 dark:text-gray-300">{status}</p>
              </div>
              
              {showCancelButton && onCancel && (
                <button
                  onClick={onCancel}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProgressOverlay;
