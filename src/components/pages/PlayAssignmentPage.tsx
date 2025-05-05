import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
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
  const { anonymousUser } = useInteractiveAssignment();
  const { user, isSupabaseLoading } = useSupabaseAuth();
  const navigate = useNavigate();

  // Log the assignment ID from URL params
  useEffect(() => {
    console.log('Assignment ID from URL params:', assignmentId);
  }, [assignmentId]);

  // Create the enhanced service
  const assignmentService = useCallback(() => {
    return createEnhancedInteractiveAssignmentService(user);
  }, [user]);

  // Function to fetch assignment with retry logic and caching
  const fetchAssignment = useCallback(async () => {
    if (isSupabaseLoading) {
      console.log('Supabase is still initializing, waiting...');
      return;
    }

    // Check if we have a cached version of this assignment
    const cachedAssignmentKey = `cached_assignment_${assignmentId}`;
    const cachedAssignment = getCachedItem(cachedAssignmentKey);

    if (cachedAssignment) {
      console.log('Using cached assignment data');
      setCurrentAssignment(cachedAssignment);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`Attempting to fetch assignment (attempt ${retryCount + 1})`);
      const service = assignmentService();
      const assignment = await service.getPublicAssignmentById(assignmentId || '');

      if (assignment) {
        console.log('Assignment fetched successfully:', assignment);
        setCurrentAssignment(assignment);

        // Cache the assignment data
        setCachedItem(cachedAssignmentKey, assignment);
        console.log('Assignment data cached successfully');
      } else {
        console.log('Assignment not found');
        setError('Assignment not found or not published');
      }
    } catch (err) {
      console.error('Error fetching assignment:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [assignmentId, assignmentService, retryCount, isSupabaseLoading]);

  // Fetch assignment on mount or when Supabase initialization state changes
  useEffect(() => {
    // Use a ref to track if we've already fetched this assignment
    const controller = new AbortController();

    // Check if we already have the assignment data in state
    if (currentAssignment) {
      console.log('Assignment already loaded in state, skipping fetch');
      return;
    }

    if (!isSupabaseLoading) {
      fetchAssignment();
    } else if (retryCount < 3) {
      // If Supabase is still loading, set a timeout to retry
      const timeoutId = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1000); // Wait 1 second before retrying

      return () => clearTimeout(timeoutId);
    }

    // Cleanup function to abort any in-progress fetches when component unmounts
    return () => {
      controller.abort();
    };
  }, [assignmentId, fetchAssignment, isSupabaseLoading, retryCount, currentAssignment]);

  // Check if user is registered
  useEffect(() => {
    if (currentAssignment && !anonymousUser) {
      setShowRegistration(true);
    }
  }, [currentAssignment, anonymousUser]);

  // Handle back to home
  const handleBackToHome = () => {
    // Use React Router navigation
    navigate('/');
  };

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

      <PlayAssignment assignment={currentAssignment} />

      {/* Anonymous User Registration Modal */}
      <AnonymousUserRegistration
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
      />
    </motion.div>
  );
};

export default PlayAssignmentPage;
