// src/hooks/useScrollToTopOnRouteChange.ts

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollToTop, smoothScrollToTop } from '../lib/utils/scrollUtils';
import { usePageVisibility } from './usePageVisibility';

interface ScrollToTopOptions {
  /** Duration of the scroll animation in milliseconds (default: 600) */
  duration?: number;
  /** Offset from the top in pixels (default: 0) */
  offset?: number;
  /** Delay before starting the scroll animation in milliseconds (default: 100) */
  delay?: number;
  /** Whether to enable smooth scroll to top on route changes (default: true) */
  enabled?: boolean;
  /** Routes to exclude from auto-scroll (e.g., ['/play/assignment', '/play/share']) */
  excludeRoutes?: string[];
  /** Whether to scroll only on pathname changes, ignoring search params and hash (default: true) */
  pathnameOnly?: boolean;
  /** Easing function for the scroll animation (default: 'easeInOut') */
  easing?: 'easeInOut' | 'easeOut' | 'easeIn' | 'linear';
  /** Callback function called when scroll animation completes */
  onScrollComplete?: () => void;
}

/**
 * Custom hook that automatically scrolls to the top of the page with a smooth animation
 * whenever the route changes. Uses the existing scrollToTop utility for consistent behavior.
 *
 * @param options Configuration options for the scroll behavior
 */
export const useScrollToTopOnRouteChange = (options: ScrollToTopOptions = {}) => {
  const location = useLocation();
  const previousLocationRef = useRef<string>('');

  const {
    duration = 600,
    offset = 0,
    delay = 100,
    enabled = true,
    excludeRoutes = [],
    pathnameOnly = true,
    easing = 'easeInOut',
    onScrollComplete
  } = options;

  // Use page visibility to prevent scroll actions when page is not visible
  const { shouldPauseApiCalls } = usePageVisibility();

  useEffect(() => {
    if (!enabled) return;

    // Don't scroll if page is not visible (prevents unnecessary scroll actions during navigation)
    if (shouldPauseApiCalls) {
      return;
    }

    // Get the current location string based on pathnameOnly setting
    const currentLocation = pathnameOnly
      ? location.pathname
      : `${location.pathname}${location.search}${location.hash}`;

    // Check if the location actually changed
    if (previousLocationRef.current === currentLocation) {
      return;
    }

    // Check if current route should be excluded
    const shouldExclude = excludeRoutes.some(route => {
      if (route.endsWith('*')) {
        // Support wildcard matching (e.g., '/play/*')
        const baseRoute = route.slice(0, -1);
        return location.pathname.startsWith(baseRoute);
      }
      return location.pathname === route || location.pathname.startsWith(route + '/');
    });

    if (shouldExclude) {
      previousLocationRef.current = currentLocation;
      return;
    }

    // Add a small delay to ensure the new page content is rendered
    const timeoutId = setTimeout(() => {
      // Only scroll if we're not already at the top (to avoid unnecessary animations)
      if (window.pageYOffset > offset) {
        smoothScrollToTop({
          offset,
          duration,
          easing,
          onComplete: () => {
            if (process.env.NODE_ENV === 'development') {
              console.log('🔝 Smooth scroll to top completed for route:', location.pathname);
            }
            if (onScrollComplete) {
              onScrollComplete();
            }
          }
        });
      }
    }, delay);

    // Update the previous location
    previousLocationRef.current = currentLocation;

    // Cleanup timeout on unmount or dependency change
    return () => {
      clearTimeout(timeoutId);
    };
  }, [location, duration, offset, delay, enabled, excludeRoutes, pathnameOnly, easing, onScrollComplete, shouldPauseApiCalls]);

  // Return current location for debugging purposes
  return {
    currentPath: location.pathname,
    isEnabled: enabled
  };
};

export default useScrollToTopOnRouteChange;
