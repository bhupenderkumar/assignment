// src/hooks/usePageVisibility.ts

import { useState, useEffect, useRef } from 'react';

interface PageVisibilityOptions {
  /** Whether to enable the hook (default: true) */
  enabled?: boolean;
  /** Callback when page becomes visible */
  onVisible?: () => void;
  /** Callback when page becomes hidden */
  onHidden?: () => void;
  /** Debounce time in milliseconds to prevent rapid state changes (default: 100) */
  debounceMs?: number;
}

interface PageVisibilityState {
  /** Whether the page is currently visible */
  isVisible: boolean;
  /** Whether the page has been visible at least once */
  hasBeenVisible: boolean;
  /** Timestamp of last visibility change */
  lastVisibilityChange: number;
  /** Whether API calls should be paused */
  shouldPauseApiCalls: boolean;
}

/**
 * Custom hook to track page visibility and manage API call behavior
 * Helps prevent excessive network calls when users navigate away and come back
 */
export const usePageVisibility = (options: PageVisibilityOptions = {}) => {
  const {
    enabled = true,
    onVisible,
    onHidden,
    debounceMs = 100
  } = options;

  const [state, setState] = useState<PageVisibilityState>({
    isVisible: !document.hidden,
    hasBeenVisible: !document.hidden,
    lastVisibilityChange: Date.now(),
    shouldPauseApiCalls: document.hidden
  });

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef({ onVisible, onHidden });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = { onVisible, onHidden };
  }, [onVisible, onHidden]);

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      const now = Date.now();

      // Clear any existing debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Debounce the state update to prevent rapid changes
      debounceTimeoutRef.current = setTimeout(() => {
        setState(prevState => {
          const newState = {
            isVisible,
            hasBeenVisible: prevState.hasBeenVisible || isVisible,
            lastVisibilityChange: now,
            shouldPauseApiCalls: !isVisible
          };

          // Call appropriate callback
          if (isVisible && !prevState.isVisible) {
            callbacksRef.current.onVisible?.();
          } else if (!isVisible && prevState.isVisible) {
            callbacksRef.current.onHidden?.();
          }

          return newState;
        });
      }, debounceMs);
    };

    // Handle window focus/blur events as well
    const handleFocus = () => {
      if (!document.hidden) {
        handleVisibilityChange();
      }
    };

    const handleBlur = () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        setState(prevState => ({
          ...prevState,
          shouldPauseApiCalls: true,
          lastVisibilityChange: Date.now()
        }));
        callbacksRef.current.onHidden?.();
      }, debounceMs);
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Cleanup
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled, debounceMs]);

  return state;
};

/**
 * Hook to conditionally execute API calls based on page visibility
 * Returns a function that only executes the callback if the page is visible
 */
export const useConditionalApiCall = (options: PageVisibilityOptions = {}) => {
  const { isVisible, shouldPauseApiCalls } = usePageVisibility(options);

  const executeIfVisible = <T extends any[], R>(
    callback: (...args: T) => R,
    fallbackValue?: R
  ) => {
    return (...args: T): R | undefined => {
      if (shouldPauseApiCalls) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🚫 API call paused - page not visible');
        }
        return fallbackValue;
      }
      return callback(...args);
    };
  };

  return {
    isVisible,
    shouldPauseApiCalls,
    executeIfVisible
  };
};

export default usePageVisibility;
