// src/components/common/ScrollToTopButton.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { smoothScrollToTop, getScrollPosition } from '../../lib/utils/scrollUtils';

interface ScrollToTopButtonProps {
  /** Show button when scrolled past this many pixels (default: 300) */
  showAfter?: number;
  /** Position of the button (default: 'bottom-right') */
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  /** Custom className for styling */
  className?: string;
  /** Custom icon component */
  icon?: React.ReactNode;
  /** Animation duration in ms (default: 600) */
  duration?: number;
  /** Easing function (default: 'easeInOut') */
  easing?: 'easeInOut' | 'easeOut' | 'easeIn' | 'linear';
}

/**
 * A floating button that appears when the user scrolls down and smoothly scrolls to top when clicked.
 * Uses the enhanced scroll utilities for consistent behavior across the app.
 */
const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
  showAfter = 300,
  position = 'bottom-right',
  className = '',
  icon,
  duration = 600,
  easing = 'easeInOut'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Monitor scroll position
  useEffect(() => {
    const handleScroll = () => {
      const { y } = getScrollPosition();
      setIsVisible(y > showAfter);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showAfter]);

  const handleClick = () => {
    if (isScrolling) return; // Prevent multiple clicks during animation

    setIsScrolling(true);
    smoothScrollToTop({
      duration,
      easing,
      onComplete: () => {
        setIsScrolling(false);
      }
    });
  };

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2'
  };

  const defaultIcon = (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 10l7-7m0 0l7 7m-7-7v18"
      />
    </svg>
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleClick}
          disabled={isScrolling}
          className={`
            fixed z-50 p-3 rounded-full shadow-lg
            bg-blue-600 hover:bg-blue-700 text-white
            transition-colors duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${positionClasses[position]}
            ${className}
          `}
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <motion.div
            animate={isScrolling ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: isScrolling ? 0.6 : 0 }}
          >
            {icon || defaultIcon}
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTopButton;
