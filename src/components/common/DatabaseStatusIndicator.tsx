// src/components/common/DatabaseStatusIndicator.tsx
import React, { useState, useEffect } from 'react';
import { useDatabaseState } from '../../context/DatabaseStateContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';

interface DatabaseStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

const DatabaseStatusIndicator: React.FC<DatabaseStatusIndicatorProps> = ({ 
  showDetails = false,
  className = ''
}) => {
  const { state, error, retryConnection, queueLength } = useDatabaseState();
  const { config } = useConfiguration();
  const [expanded, setExpanded] = useState(false);
  const [showIndicator, setShowIndicator] = useState(state !== 'ready');
  
  // Hide the indicator after a delay when the database becomes ready
  useEffect(() => {
    if (state === 'ready') {
      const timer = setTimeout(() => {
        setShowIndicator(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setShowIndicator(true);
    }
  }, [state]);
  
  // If we don't need to show the indicator, return null
  if (!showIndicator && !showDetails) {
    return null;
  }
  
  // Determine the status color
  const getStatusColor = () => {
    switch (state) {
      case 'ready':
        return 'bg-green-500';
      case 'initializing':
      case 'connecting':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Determine the status text
  const getStatusText = () => {
    switch (state) {
      case 'ready':
        return 'Connected';
      case 'initializing':
        return 'Initializing';
      case 'connecting':
        return 'Connecting';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };
  
  // Handle retry button click
  const handleRetry = async () => {
    await retryConnection();
  };
  
  return (
    <AnimatePresence>
      {(showIndicator || showDetails) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed bottom-4 right-4 z-50 ${className}`}
        >
          <div 
            className={`rounded-lg shadow-lg overflow-hidden ${
              expanded ? 'w-64' : 'w-auto'
            } ${config.darkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            {/* Status header - always visible */}
            <div 
              className="flex items-center justify-between p-2 cursor-pointer"
              onClick={() => setExpanded(!expanded)}
            >
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${getStatusColor()} mr-2`}></div>
                <span className={`text-sm font-medium ${config.darkMode ? 'text-white' : 'text-gray-700'}`}>
                  Database: {getStatusText()}
                </span>
              </div>
              <button 
                className={`ml-2 text-xs ${config.darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {expanded ? '▲' : '▼'}
              </button>
            </div>
            
            {/* Expanded details */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={`px-3 pb-3 ${config.darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  <div className="text-xs mb-2">
                    <p>Status: <span className="font-semibold">{state}</span></p>
                    {queueLength > 0 && (
                      <p>Queued operations: <span className="font-semibold">{queueLength}</span></p>
                    )}
                    {error && (
                      <p className="text-red-500 mt-1">Error: {error}</p>
                    )}
                  </div>
                  
                  {state === 'error' && (
                    <button
                      onClick={handleRetry}
                      className="w-full text-xs py-1 px-2 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                    >
                      Retry Connection
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DatabaseStatusIndicator;
