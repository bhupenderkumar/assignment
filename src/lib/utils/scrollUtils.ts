// src/lib/utils/scrollUtils.ts

/**
 * Scroll utility functions for smooth navigation
 */

/**
 * Smooth scroll to top of the page
 * @param offset Optional offset from top (default: 0)
 * @param duration Optional duration in ms (default: 500)
 */
export const scrollToTop = (offset: number = 0, duration: number = 500) => {
  const startPosition = window.pageYOffset;
  const targetPosition = offset;
  const distance = targetPosition - startPosition;
  const startTime = performance.now();

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  };

  const animateScroll = (currentTime: number) => {
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    const ease = easeInOutCubic(progress);

    window.scrollTo(0, startPosition + distance * ease);

    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  };

  requestAnimationFrame(animateScroll);
};

/**
 * Smooth scroll to a specific element
 * @param element The element to scroll to
 * @param offset Optional offset from element top (default: 20)
 * @param duration Optional duration in ms (default: 500)
 */
export const scrollToElement = (
  element: HTMLElement | null,
  offset: number = 20,
  duration: number = 500
) => {
  if (!element) return;

  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
  const targetPosition = elementPosition - offset;

  scrollToPosition(targetPosition, duration);
};

/**
 * Smooth scroll to a specific position
 * @param position The Y position to scroll to
 * @param duration Optional duration in ms (default: 500)
 */
export const scrollToPosition = (position: number, duration: number = 500) => {
  const startPosition = window.pageYOffset;
  const distance = position - startPosition;
  const startTime = performance.now();

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  };

  const animateScroll = (currentTime: number) => {
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    const ease = easeInOutCubic(progress);

    window.scrollTo(0, startPosition + distance * ease);

    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  };

  requestAnimationFrame(animateScroll);
};

/**
 * Scroll to question/exercise container
 * @param questionIndex Optional question index for targeting specific question
 * @param offset Optional offset from top (default: 80)
 */
export const scrollToQuestion = (questionIndex?: number, offset: number = 80) => {
  // Try to find the question container
  let targetElement: HTMLElement | null = null;

  if (questionIndex !== undefined) {
    // Look for question-specific container
    targetElement = document.querySelector(`[data-question-index="${questionIndex}"]`) as HTMLElement;
  }

  if (!targetElement) {
    // Fallback to common question container selectors in priority order
    const selectors = [
      '#current-question',
      '[data-testid="question-container"]',
      '.question-container',
      '.exercise-container',
      '.assignment-question',
      '[data-question-index]'
    ];

    for (const selector of selectors) {
      targetElement = document.querySelector(selector) as HTMLElement;
      if (targetElement) {
        break;
      }
    }
  }

  if (targetElement) {
    // Ensure the element is visible and scroll to it
    scrollToElement(targetElement, offset);
  } else {
    // If no question container found, try to scroll to the progress display or assignment header
    const fallbackSelectors = [
      '.progress-display',
      '.assignment-header',
      'main',
      '.container'
    ];

    for (const selector of fallbackSelectors) {
      const fallbackElement = document.querySelector(selector) as HTMLElement;
      if (fallbackElement) {
        scrollToElement(fallbackElement, offset);
        return;
      }
    }

    // Final fallback - scroll to a reasonable position (not top)
    scrollToPosition(200);
  }
};

/**
 * Check if element is in viewport
 * @param element The element to check
 * @param threshold Optional threshold (0-1, default: 0.1)
 * @returns true if element is visible
 */
export const isElementInViewport = (element: HTMLElement, threshold: number = 0.1): boolean => {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  const verticalVisible = rect.top <= windowHeight * (1 - threshold) &&
                         rect.bottom >= windowHeight * threshold;
  const horizontalVisible = rect.left <= windowWidth * (1 - threshold) &&
                           rect.right >= windowWidth * threshold;

  return verticalVisible && horizontalVisible;
};

/**
 * Get scroll position
 * @returns object with x and y scroll positions
 */
export const getScrollPosition = () => {
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop,
  };
};

/**
 * Disable scroll
 */
export const disableScroll = () => {
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${window.scrollY}px`;
  document.body.style.width = '100%';
};

/**
 * Enable scroll
 */
export const enableScroll = () => {
  const scrollY = document.body.style.top;
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';

  if (scrollY) {
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
  }
};

/**
 * Smooth scroll to top with enhanced easing and callback support
 * @param options Configuration options for the scroll animation
 */
export const smoothScrollToTop = (options: {
  offset?: number;
  duration?: number;
  easing?: 'easeInOut' | 'easeOut' | 'easeIn' | 'linear';
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
} = {}) => {
  const {
    offset = 0,
    duration = 600,
    easing = 'easeInOut',
    onComplete,
    onProgress
  } = options;

  const startPosition = window.pageYOffset;
  const targetPosition = offset;
  const distance = targetPosition - startPosition;
  const startTime = performance.now();

  // Different easing functions
  const easingFunctions = {
    linear: (t: number) => t,
    easeIn: (t: number) => t * t,
    easeOut: (t: number) => t * (2 - t),
    easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  };

  const easingFunction = easingFunctions[easing];

  const animateScroll = (currentTime: number) => {
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    const ease = easingFunction(progress);

    window.scrollTo(0, startPosition + distance * ease);

    // Call progress callback if provided
    if (onProgress) {
      onProgress(progress);
    }

    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    } else {
      // Call completion callback if provided
      if (onComplete) {
        onComplete();
      }
    }
  };

  requestAnimationFrame(animateScroll);
};
