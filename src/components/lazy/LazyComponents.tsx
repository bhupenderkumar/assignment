// src/components/lazy/LazyComponents.tsx
import React, { lazy, Suspense, ComponentType } from 'react';
import { motion } from 'framer-motion';

/**
 * Loading component for lazy-loaded components
 */
const LoadingSpinner = ({ message = 'Loading...' }: { message?: string }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center py-12"
  >
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
    <p className="text-gray-600 text-center">{message}</p>
  </motion.div>
);

/**
 * Error boundary for lazy-loaded components
 */
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <p className="text-gray-600 text-center">Failed to load component</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for lazy loading with error boundary and loading state
 */
const withLazyLoading = <P extends object>(
  LazyComponent: ComponentType<P>,
  loadingMessage?: string,
  errorFallback?: React.ReactNode
) => {
  return (props: P) => (
    <LazyErrorBoundary fallback={errorFallback}>
      <Suspense fallback={<LoadingSpinner message={loadingMessage} />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );
};

// Lazy-loaded Admin Components
export const LazyAdminDashboard = withLazyLoading(
  lazy(() => import('../admin/AdminDashboard')),
  'Loading admin dashboard...'
);

export const LazyAssignmentForm = withLazyLoading(
  lazy(() => import('../admin/AssignmentForm')),
  'Loading assignment editor...'
);

export const LazyAnonymousUserActivity = withLazyLoading(
  lazy(() => import('../admin/AnonymousUserActivity')),
  'Loading user activity...'
);

// Lazy-loaded Organization Components
export const LazyOrganizationManagementPage = withLazyLoading(
  lazy(() => import('../../pages/OrganizationManagementPage')),
  'Loading organization management...'
);

export const LazyOrganizationPaymentSettings = withLazyLoading(
  lazy(() => import('../organization/OrganizationPaymentSettings')),
  'Loading payment settings...'
);

export const LazyOrganizationAnalytics = withLazyLoading(
  lazy(() => import('../organization/OrganizationAnalytics')),
  'Loading analytics...'
);

// Lazy-loaded Assignment Components
// Note: AssignmentGalleryPage component doesn't exist yet
// export const LazyAssignmentGalleryPage = withLazyLoading(
//   lazy(() => import('../../pages/AssignmentGalleryPage')),
//   'Loading assignment gallery...'
// );

export const LazyPlayAssignment = withLazyLoading(
  lazy(() => import('../assignments/PlayAssignment')),
  'Loading assignment...'
);

export const LazyCertificateTemplate = withLazyLoading(
  lazy(() => import('../certificates/CertificateTemplate')),
  'Loading certificate...'
);

// Lazy-loaded Exercise Components
export const LazyEnhancedMatchingExercise = withLazyLoading(
  lazy(() => import('../exercises/EnhancedMatchingExercise')),
  'Loading matching exercise...'
);

export const LazyOrderingExercise = withLazyLoading(
  lazy(() => import('../exercises/OrderingExercise')),
  'Loading ordering exercise...'
);

export const LazyMultipleChoiceExercise = withLazyLoading(
  lazy(() => import('../exercises/MultipleChoiceExercise')),
  'Loading multiple choice exercise...'
);

export const LazyCompletionExercise = withLazyLoading(
  lazy(() => import('../exercises/CompletionExercise')),
  'Loading completion exercise...'
);

// Lazy-loaded Heavy Dependencies
// Note: These components don't exist yet
// export const LazyCanvasDrawing = withLazyLoading(
//   lazy(() => import('../drawing/CanvasDrawing')),
//   'Loading drawing canvas...'
// );

// export const LazyAudioRecorder = withLazyLoading(
//   lazy(() => import('../audio/AudioRecorder')),
//   'Loading audio recorder...'
// );

// export const LazyVideoPlayer = withLazyLoading(
//   lazy(() => import('../media/VideoPlayer')),
//   'Loading video player...'
// );

// Lazy-loaded Auth Components
export const LazySignInPage = withLazyLoading(
  lazy(() => import('../pages/SignInPage')),
  'Loading sign in...'
);

export const LazySignUpPage = withLazyLoading(
  lazy(() => import('../pages/SignUpPage')),
  'Loading sign up...'
);

// Utility function to preload components
export const preloadComponent = (componentLoader: () => Promise<any>) => {
  // Only preload on user interaction or when idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      componentLoader().catch(() => {
        // Silently fail preloading
      });
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      componentLoader().catch(() => {
        // Silently fail preloading
      });
    }, 100);
  }
};

// Preload critical components on app initialization
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be used soon
  preloadComponent(() => import('../assignments/AssignmentList'));
  preloadComponent(() => import('../organization/OrganizationSwitcher'));
  preloadComponent(() => import('../admin/AdminDashboard'));
};

// Component size tracking for optimization
export const trackComponentSize = (componentName: string) => {
  if (process.env.NODE_ENV === 'development') {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      console.log(`Component ${componentName} loaded in ${loadTime.toFixed(2)}ms`);

      // Track bundle size if available
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection && connection.effectiveType) {
          console.log(`Network: ${connection.effectiveType}, Downlink: ${connection.downlink}Mbps`);
        }
      }
    };
  }

  return () => {}; // No-op in production
};

export default {
  LazyAdminDashboard,
  LazyAssignmentForm,
  LazyAnonymousUserActivity,
  LazyOrganizationManagementPage,
  LazyOrganizationPaymentSettings,
  LazyOrganizationAnalytics,
  // LazyAssignmentGalleryPage, // Component doesn't exist yet
  LazyPlayAssignment,
  LazyCertificateTemplate,
  LazyEnhancedMatchingExercise,
  LazyOrderingExercise,
  LazyMultipleChoiceExercise,
  LazyCompletionExercise,
  // LazyCanvasDrawing, // Component doesn't exist yet
  // LazyAudioRecorder, // Component doesn't exist yet
  // LazyVideoPlayer, // Component doesn't exist yet
  LazySignInPage,
  LazySignUpPage,
  preloadComponent,
  preloadCriticalComponents,
  trackComponentSize
};
