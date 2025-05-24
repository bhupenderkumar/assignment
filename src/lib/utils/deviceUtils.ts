// src/lib/utils/deviceUtils.ts

/**
 * Device detection and utility functions
 */

/**
 * Check if the current device is mobile
 * @returns true if mobile device
 */
export const isMobileDevice = (): boolean => {
  // Check screen width
  const isMobileWidth = window.innerWidth < 768;
  
  // Check user agent for mobile indicators
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'android', 'webos', 'iphone', 'ipad', 'ipod', 
    'blackberry', 'windows phone', 'mobile'
  ];
  
  const isMobileUserAgent = mobileKeywords.some(keyword => 
    userAgent.includes(keyword)
  );
  
  // Check for touch capability
  const isTouchDevice = 'ontouchstart' in window || 
    navigator.maxTouchPoints > 0;
  
  return isMobileWidth || (isMobileUserAgent && isTouchDevice);
};

/**
 * Check if the device supports touch
 * @returns true if touch is supported
 */
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || 
    navigator.maxTouchPoints > 0 || 
    (window as any).DocumentTouch && document instanceof (window as any).DocumentTouch;
};

/**
 * Get device type
 * @returns device type string
 */
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  
  if (width < 768) {
    return 'mobile';
  } else if (width < 1024) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

/**
 * Check if device is in landscape mode
 * @returns true if landscape
 */
export const isLandscape = (): boolean => {
  return window.innerWidth > window.innerHeight;
};

/**
 * Get safe area insets for mobile devices
 * @returns object with safe area values
 */
export const getSafeAreaInsets = () => {
  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
    right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
    bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
  };
};

/**
 * Add event listener for device orientation change
 * @param callback Function to call on orientation change
 * @returns cleanup function
 */
export const onOrientationChange = (callback: () => void) => {
  const handleOrientationChange = () => {
    // Small delay to ensure dimensions are updated
    setTimeout(callback, 100);
  };
  
  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', handleOrientationChange);
  
  return () => {
    window.removeEventListener('orientationchange', handleOrientationChange);
    window.removeEventListener('resize', handleOrientationChange);
  };
};

/**
 * Prevent zoom on double tap for iOS
 */
export const preventZoomOnDoubleTap = () => {
  let lastTouchEnd = 0;
  
  const handleTouchEnd = (event: TouchEvent) => {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  };
  
  document.addEventListener('touchend', handleTouchEnd, { passive: false });
  
  return () => {
    document.removeEventListener('touchend', handleTouchEnd);
  };
};

/**
 * Get viewport dimensions accounting for mobile browsers
 * @returns object with width and height
 */
export const getViewportDimensions = () => {
  return {
    width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
    height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
  };
};
