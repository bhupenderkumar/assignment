// src/components/assignments/PlaySharedAssignment.tsx
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { createEnhancedInteractiveAssignmentService } from '../../lib/services/enhancedInteractiveAssignmentService';
import PlayAssignment from './PlayAssignment';
import AnonymousUserRegistration from '../auth/AnonymousUserRegistration';

interface PlaySharedAssignmentProps {
  shareableLink: string;
  onOrganizationLoad?: (organization: any) => void;
  onAssignmentLoad?: (assignment: any) => void;
}

const PlaySharedAssignment = ({
  shareableLink,
  onOrganizationLoad,
  onAssignmentLoad
}: PlaySharedAssignmentProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<any | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { anonymousUser } = useInteractiveAssignment();
  const { user, isSupabaseLoading } = useSupabaseAuth();
  const navigate = useNavigate();
  const [showRegistration, setShowRegistration] = useState(false);

  // Create the enhanced service
  const assignmentService = useCallback(() => {
    return createEnhancedInteractiveAssignmentService(user);
  }, [user]);

  // Function to fetch assignment with retry logic
  const fetchAssignment = useCallback(async () => {
    if (!shareableLink) {
      console.error('No shareable link provided');
      setError('No shareable link provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`Attempting to fetch assignment by shareable link (attempt ${retryCount + 1})`);

      // Try to get the assignment from localStorage first (for offline/fallback support)
      try {
        // First, check if we have a direct cache for this shareable link
        const directCachedAssignment = localStorage.getItem(`cached_shared_assignment_${shareableLink}`);
        if (directCachedAssignment) {
          try {
            const parsedAssignment = JSON.parse(directCachedAssignment);
            console.log('Found directly cached assignment data, using it');
            setCurrentAssignment(parsedAssignment);
            setLoading(false);
            return; // Exit early since we have the data
          } catch (parseError) {
            console.warn('Error parsing cached assignment:', parseError);
            // Continue to next approach
          }
        }

        // Extract the assignment ID from the shareable link (format: randomString-assignmentId)
        const parts = shareableLink.split('-');
        if (parts.length >= 2) {
          const assignmentId = parts[parts.length - 1];

          // Check if we have this assignment in cache
          const shareableLinkCache = JSON.parse(localStorage.getItem('shareableLinkCache') || '{}');
          const cachedAssignmentData = shareableLinkCache[assignmentId];

          if (cachedAssignmentData && cachedAssignmentData.assignment) {
            console.log('Found cached assignment data in shareableLinkCache, using it');
            setCurrentAssignment(cachedAssignmentData.assignment);
            setLoading(false);
            return; // Exit early since we have the data
          } else if (cachedAssignmentData) {
            console.log('Found cached link data, but no assignment, will try to fetch');
            // We have cached data, but we still need to try to get the full assignment
            // We'll continue with the normal flow but with this knowledge
          }
        }
      } catch (cacheError) {
        console.warn('Error checking localStorage cache:', cacheError);
        // Continue with normal flow
      }

      // Create service with or without user (works for anonymous users too)
      const service = assignmentService();
      const assignment = await service.getAssignmentByShareableLink(shareableLink);

      if (assignment) {
        console.log('Assignment fetched successfully:', assignment);
        setCurrentAssignment(assignment);

        // Cache the assignment data in localStorage for persistence
        try {
          // Extract the assignment ID from the shareable link
          const parts = shareableLink.split('-');
          if (parts.length >= 2) {
            const assignmentId = parts[parts.length - 1];

            // Store in localStorage with a key that includes both the shareable link and assignment ID
            localStorage.setItem(`cached_shared_assignment_${shareableLink}`, JSON.stringify(assignment));

            // Also update the shareableLinkCache
            const shareableLinkCache = JSON.parse(localStorage.getItem('shareableLinkCache') || '{}');
            shareableLinkCache[assignmentId] = {
              link: shareableLink,
              assignment: assignment,
              timestamp: new Date().toISOString()
            };
            localStorage.setItem('shareableLinkCache', JSON.stringify(shareableLinkCache));
            console.log('Assignment cached successfully for persistence');
          }
        } catch (cacheError) {
          console.warn('Error caching assignment data:', cacheError);
          // Continue with normal flow even if caching fails
        }
      } else {
        console.log('Assignment not found or link expired');
        setError('Assignment not found or link has expired');
      }
    } catch (err) {
      console.error('Error fetching assignment by shareable link:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';

      // Provide a more user-friendly error message
      if (errorMessage.includes('JWT') || errorMessage.includes('auth') || errorMessage.includes('401')) {
        setError('This assignment requires authentication. Please sign in to view it.');
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [shareableLink, assignmentService, retryCount]);

  // Fetch assignment on mount or when Supabase initialization state changes
  useEffect(() => {
    const controller = new AbortController();

    // Always try to fetch the assignment, even if Supabase is still loading
    // This is important for anonymous users who don't need authentication
    fetchAssignment();

    // If the first attempt fails and Supabase is still loading, retry a few times
    if (isSupabaseLoading && retryCount < 3) {
      const timeoutId = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1000); // Wait 1 second before retrying

      return () => clearTimeout(timeoutId);
    }

    // Cleanup function to abort any in-progress fetches when component unmounts
    return () => {
      controller.abort();
    };
  }, [shareableLink, fetchAssignment, isSupabaseLoading, retryCount]);

  // Check if user is registered
  useEffect(() => {
    if (currentAssignment && !anonymousUser) {
      setShowRegistration(true);
    }
  }, [currentAssignment, anonymousUser]);

  // Call onAssignmentLoad callback when assignment is loaded
  useEffect(() => {
    if (currentAssignment && onAssignmentLoad) {
      onAssignmentLoad(currentAssignment);
    }
  }, [currentAssignment, onAssignmentLoad]);

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
            onClick={() => navigate('/')}
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
        <p>The shared assignment could not be found or has expired.</p>
        <p className="mt-2 text-sm">Link used: {shareableLink}</p>
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
            onClick={() => navigate('/')}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
          >
            Go to Home Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">{currentAssignment.title}</h1>
          <p className="text-gray-600 mb-4">{currentAssignment.description}</p>

          <div className="flex items-center text-sm text-gray-500">
            <span className="mr-2">Direct link:</span>
            <a
              href={`/play/assignment/${currentAssignment.id}`}
              className="text-blue-500 hover:text-blue-700 underline flex items-center"
            >
              {`${window.location.origin}/play/assignment/${currentAssignment.id}`}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        {/* Pass the assignment to the PlayAssignment component */}
        <PlayAssignment
          assignment={currentAssignment}
          onOrganizationLoad={onOrganizationLoad}
        />
      </motion.div>

      {/* Anonymous User Registration Modal */}
      <AnonymousUserRegistration
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
      />
    </div>
  );
};

export default PlaySharedAssignment;
