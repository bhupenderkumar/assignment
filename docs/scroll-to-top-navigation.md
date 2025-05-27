# Smooth Scroll to Top on Navigation

This document explains the automatic scroll-to-top functionality that has been implemented for smooth navigation between pages.

## Overview

When users navigate between different pages/routes in the application, the page will automatically scroll to the top with a smooth animation effect. This provides a better user experience by ensuring users start at the top of each new page.

## Implementation

### Automatic Scroll on Route Changes

The main implementation uses the `useScrollToTopOnRouteChange` hook in `AppRouter.tsx`:

```typescript
useScrollToTopOnRouteChange({
  duration: 800, // Smooth 800ms animation
  offset: 0, // Scroll to the very top
  delay: 150, // Small delay to ensure content is rendered
  enabled: true, // Enable the feature
  easing: 'easeInOut', // Smooth easing for a pleasant effect
  excludeRoutes: [
    // Don't auto-scroll on assignment play pages to preserve user position
    '/play/assignment/*',
    '/play/share/*'
  ],
  pathnameOnly: true, // Only trigger on pathname changes, not search params
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `duration` | number | 600 | Animation duration in milliseconds |
| `offset` | number | 0 | Offset from top in pixels |
| `delay` | number | 100 | Delay before starting animation |
| `enabled` | boolean | true | Whether to enable the feature |
| `excludeRoutes` | string[] | [] | Routes to exclude from auto-scroll |
| `pathnameOnly` | boolean | true | Only trigger on pathname changes |
| `easing` | string | 'easeInOut' | Animation easing function |
| `onScrollComplete` | function | undefined | Callback when animation completes |

### Excluded Routes

The following routes are excluded from automatic scroll-to-top to preserve user position:
- `/play/assignment/*` - Assignment play pages
- `/play/share/*` - Shared assignment pages

## Manual Scroll Controls

### Scroll Utilities

The `scrollUtils.ts` file provides several utility functions:

```typescript
import { smoothScrollToTop, scrollToTop, scrollToElement } from '../lib/utils/scrollUtils';

// Enhanced smooth scroll with callbacks
smoothScrollToTop({
  duration: 800,
  easing: 'easeInOut',
  onComplete: () => console.log('Scroll completed!'),
  onProgress: (progress) => console.log(`Scroll progress: ${progress * 100}%`)
});

// Simple scroll to top
scrollToTop(0, 500);

// Scroll to specific element
const element = document.getElementById('my-element');
scrollToElement(element, 20, 600);
```

### ScrollToTopButton Component

A reusable floating button component is available:

```typescript
import ScrollToTopButton from '../components/common/ScrollToTopButton';

// Basic usage
<ScrollToTopButton />

// Customized
<ScrollToTopButton
  showAfter={500}
  position="bottom-left"
  duration={800}
  easing="easeOut"
  className="bg-green-600 hover:bg-green-700"
/>
```

## Easing Functions

Available easing options:
- `linear` - Constant speed
- `easeIn` - Slow start, fast end
- `easeOut` - Fast start, slow end
- `easeInOut` - Slow start and end, fast middle (recommended)

## Browser Compatibility

The implementation uses:
- `requestAnimationFrame` for smooth animations
- `window.scrollTo` for cross-browser compatibility
- Modern JavaScript features with TypeScript support

## Performance Considerations

- Animations use `requestAnimationFrame` for optimal performance
- Scroll events are throttled and use passive listeners
- Only triggers when actually needed (not already at top)
- Small delay ensures content is rendered before scrolling

## Troubleshooting

### Animation Not Working
- Check if the route is in the `excludeRoutes` list
- Verify the page has scrollable content
- Ensure JavaScript is enabled

### Performance Issues
- Reduce animation duration
- Check for conflicting scroll behaviors
- Monitor console for errors

## Future Enhancements

Potential improvements:
- Scroll position restoration for back/forward navigation
- Different animations for different route types
- Integration with page loading states
- Accessibility improvements for reduced motion preferences
