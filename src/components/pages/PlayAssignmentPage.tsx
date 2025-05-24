import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useBeforeUnload } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import PlayAssignment from '../assignments/PlayAssignment';
import AnonymousUserRegistration from '../auth/AnonymousUserRegistration';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { createEnhancedInteractiveAssignmentService } from '../../lib/services/enhancedInteractiveAssignmentService';
import { getCachedItem, setCachedItem } from '../../lib/utils/cacheUtils';

import toast from 'react-hot-toast';

// We don't need the props anymore since we're using useParams
const PlayAssignmentPage = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [showRegistration, setShowRegistration] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<any | null>(null);
  const [isAssignmentActive, setIsAssignmentActive] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [assignmentOrganization, setAssignmentOrganization] = useState<any | null>(null);
  const { anonymousUser } = useInteractiveAssignment();
  const { user, isSupabaseLoading } = useSupabaseAuth();
  const navigate = useNavigate();

  // Reference to track if navigation was confirmed
  const navigationConfirmed = useRef(false);

  // Add navigation warning when assignment is active
  useBeforeUnload(
    useCallback((event) => {
      if (isAssignmentActive && !isSubmitted && !navigationConfirmed.current) {
        // Standard for modern browsers
        event.preventDefault();
        // For older browsers
        event.returnValue = '';
        return '';
      }
    }, [isAssignmentActive, isSubmitted])
  );

  // Create the enhanced service - memoized to prevent recreation
  const assignmentService = useCallback(() => {
    return createEnhancedInteractiveAssignmentService(user);
  }, [user]);

  // Function to fetch assignment with retry logic and caching
  const fetchAssignment = useCallback(async () => {
    // Skip if we already have the assignment or if Supabase is still initializing
    if (currentAssignment || isSupabaseLoading) {
      return;
    }

    // Check if we have a cached version of this assignment
    const cachedAssignmentKey = `cached_assignment_${assignmentId}`;
    const cachedAssignment = getCachedItem(cachedAssignmentKey);

    if (cachedAssignment) {
      setCurrentAssignment(cachedAssignment);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const service = assignmentService();
      const assignment = await service.getPublicAssignmentById(assignmentId || '');

      if (assignment) {
        setCurrentAssignment(assignment);
        // Try to cache the assignment data, but don't worry if it fails
        try {
          const cacheSuccess = setCachedItem(cachedAssignmentKey, assignment);
          if (!cacheSuccess) {
            console.log('Assignment too large to cache, proceeding without caching');
          }
        } catch (cacheError) {
          console.warn('Failed to cache assignment, proceeding without caching:', cacheError);
        }
      } else {
        setError('Assignment not found or not published');
      }
    } catch (err) {
      console.error('Error fetching assignment:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [assignmentId, assignmentService, isSupabaseLoading, currentAssignment]);

  // Fetch assignment only once when component mounts or when dependencies change
  useEffect(() => {
    // Skip if we already have the assignment
    if (currentAssignment) {
      return;
    }

    // If Supabase is ready, fetch immediately
    if (!isSupabaseLoading) {
      fetchAssignment();
      return;
    }

    // If Supabase is still loading and we haven't exceeded retry limit
    if (isSupabaseLoading && retryCount < 3) {
      const timeoutId = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1500); // Increased delay to reduce frequency of retries

      return () => clearTimeout(timeoutId);
    }
  }, [assignmentId, fetchAssignment, isSupabaseLoading, retryCount, currentAssignment]);

  // Check if user is registered
  useEffect(() => {
    if (currentAssignment && !anonymousUser && !user) {
      // Only show registration if we have an assignment but no user (anonymous or authenticated)
      console.log('No user found, showing registration modal');
      setShowRegistration(true);
    } else {
      // Make sure registration modal is closed if we have a user
      setShowRegistration(false);
    }
  }, [currentAssignment, anonymousUser, user]);

  // Handle back to home with confirmation if assignment is active
  const handleBackToHome = () => {
    if (isAssignmentActive && !isSubmitted) {
      const confirmed = window.confirm(
        'You have an active assignment in progress. If you leave now, your progress will be lost. Are you sure you want to leave?'
      );

      if (!confirmed) {
        return; // Stay on the page if not confirmed
      }

      // Mark navigation as confirmed to prevent the beforeunload warning
      navigationConfirmed.current = true;
    }

    // Use React Router navigation
    navigate('/');
  };

  // Custom navigation handler for any navigation attempt
  useEffect(() => {
    // Function to handle navigation attempts
    const handleNavigation = (event: BeforeUnloadEvent | PopStateEvent) => {
      if (isAssignmentActive && !isSubmitted && !navigationConfirmed.current) {
        if (event.type === 'beforeunload') {
          // For page refresh or close
          event.preventDefault();
          (event as BeforeUnloadEvent).returnValue = '';
          return '';
        } else {
          // For history navigation (back/forward buttons)
          const confirmed = window.confirm(
            'You have an active assignment in progress. If you leave now, your progress will be lost. Are you sure you want to leave?'
          );

          if (!confirmed) {
            // Stay on the page if not confirmed
            window.history.pushState(null, '', window.location.pathname);
            return;
          }

          // Mark navigation as confirmed
          navigationConfirmed.current = true;
        }
      }
    };

    // Add event listeners
    window.addEventListener('popstate', handleNavigation);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handleNavigation);
    };
  }, [isAssignmentActive, isSubmitted]);

  // Loading state
  if (loading || isSupabaseLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        {isSupabaseLoading && (
          <p className="text-gray-600 text-center">
            Initializing database connection...
            <br />
            <span className="text-sm">This may take a moment</span>
          </p>
        )}
        {!isSupabaseLoading && loading && (
          <p className="text-gray-600">Loading assignment...</p>
        )}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl my-6">
        <h3 className="font-bold text-lg">Error</h3>
        <p>{error}</p>
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={() => {
              setRetryCount(0);
              fetchAssignment();
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
          >
            Try Again
          </button>
          <button
            onClick={handleBackToHome}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // No assignment found
  if (!currentAssignment) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-xl my-6">
        <h3 className="font-bold text-lg">Assignment Not Found</h3>
        <p>The requested assignment could not be found or has been removed.</p>
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={() => {
              setRetryCount(0);
              fetchAssignment();
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
          >
            Try Again
          </button>
          <button
            onClick={handleBackToHome}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Dynamic page title based on organization */}
      <Helmet>
        <title>
          {assignmentOrganization?.name
            ? `${assignmentOrganization.name} | ${currentAssignment?.title || 'Assignment'}`
            : currentAssignment?.title
            ? `${currentAssignment.title} | Interactive Assignment`
            : 'Interactive Assignment'
          }
        </title>
        {assignmentOrganization?.logo_url && (
          <link rel="icon" type="image/png" href={assignmentOrganization.logo_url} />
        )}
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handleBackToHome}
          className="flex items-center text-blue-500 hover:text-blue-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Assignments
        </button>

        <button
          onClick={() => {
            const url = `${window.location.origin}/play/assignment/${assignmentId}`;
            navigator.clipboard.writeText(url);
            toast.success('Assignment link copied to clipboard!');
          }}
          className="flex items-center text-blue-500 hover:text-blue-700 transition-colors"
          title="Copy direct link"
        >
          <span className="mr-1">Share</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </div>

        <PlayAssignment
          assignment={currentAssignment}
          onAssignmentStart={() => setIsAssignmentActive(true)}
          onAssignmentComplete={() => {
            setIsAssignmentActive(false);
            setIsSubmitted(true);
          }}
          onOrganizationLoad={setAssignmentOrganization}
        />

        {/* Anonymous User Registration Modal */}
        <AnonymousUserRegistration
          isOpen={showRegistration}
          onClose={() => setShowRegistration(false)}
          onSuccess={() => {
            console.log('User registered successfully');
            setShowRegistration(false);
            // After successful registration, reload the page to ensure we get fresh data
            window.location.reload();
          }}
        />
      </motion.div>
    </>
  );
};

export default PlayAssignmentPage;
