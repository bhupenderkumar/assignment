// src/components/pages/UserDashboardPage.tsx
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useConfiguration } from '../../context/ConfigurationContext';
import CompletedActivitiesList from '../user/CompletedActivitiesList';
import { InteractiveSubmissionExtended } from '../../types/interactiveSubmissionExtended';
import { useForceUpdate } from '../../hooks/useForceUpdate';
import toast from 'react-hot-toast';

const UserDashboardPage = () => {
  const [completedActivities, setCompletedActivities] = useState<InteractiveSubmissionExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, userId, username } = useSupabaseAuth();
  const { fetchUserSubmissions } = useInteractiveAssignment();
  const { config } = useConfiguration();
  const navigate = useNavigate();
  const forceUpdate = useForceUpdate();

  // For debugging and state recovery
  const submissionsRef = useRef<any[]>([]);

  // Use a ref to track if we've already processed submissions
  const processedSubmissionsRef = useRef<boolean>(false);

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  // Debug effect to log loading state changes
  useEffect(() => {
    console.log('Loading state changed:', loading);
  }, [loading]);

  // Listen for force-refresh events
  useEffect(() => {
    const handleForceRefresh = () => {
      console.log('Force refresh event received');
      if (loading) {
        console.log('Force setting loading to false');
        setLoading(false);
      }
      forceUpdate();
    };

    window.addEventListener('force-refresh', handleForceRefresh);

    return () => {
      window.removeEventListener('force-refresh', handleForceRefresh);
    };
  }, [loading, forceUpdate]);

  // Effect to ensure loading state is properly managed when activities are loaded
  useEffect(() => {
    if (completedActivities.length > 0 && loading) {
      console.log('Activities loaded but loading is still true, forcing loading to false');
      setLoading(false);
      forceUpdate();
    }
  }, [completedActivities, loading, forceUpdate]);

  // Additional effect to ensure loading state is reset after a timeout
  // This prevents the loader from getting stuck
  useEffect(() => {
    // If loading is true for more than 5 seconds, force it to false
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [loading]);

  // Load user data only once on mount or when auth state changes
  useEffect(() => {
    const loadUserData = async () => {
      if (!isAuthenticated && !userId) {
        toast.error('Please sign in to view your dashboard');
        navigate('/sign-in');
        return;
      }

      try {
        // Set loading state
        setLoading(true);
        console.log('UserDashboardPage: Loading user submissions for userId:', userId);

        // Fetch submissions
        const submissions = await fetchUserSubmissions();

        // Store submissions in ref for debugging and recovery
        submissionsRef.current = submissions;

        // Check if we've already processed these submissions
        if (processedSubmissionsRef.current) {
          console.log('Already processed submissions, skipping processing');
          return;
        }

        // Log the raw submissions data for debugging
        console.log('Raw submissions data:', JSON.stringify(submissions));
        console.log('Received submissions data:', submissions.length, 'submissions');

        // Only update state if component is still mounted
        console.log('Checking conditions for processing submissions:');
        console.log('- isMounted.current:', isMounted.current);
        console.log('- submissions exists:', !!submissions);
        console.log('- submissions.length:', submissions ? submissions.length : 'N/A');
        console.log('- submissions type:', submissions ? typeof submissions : 'N/A');
        console.log('- submissions is array:', submissions ? Array.isArray(submissions) : 'N/A');

        if (isMounted.current && submissions && Array.isArray(submissions) && submissions.length > 0) {
          // Process the submissions to ensure they match the expected format
          const processedSubmissions = submissions.map((submission: any) => {
            console.log('Processing submission:', JSON.stringify(submission));

            // Create a new object with camelCase properties
            const processedSubmission: any = {
              id: submission.id,
              // Convert snake_case to camelCase
              assignmentId: submission.assignmentId || submission.assignment_id,
              userId: submission.userId || submission.user_id,
              status: submission.status,
              score: submission.score !== null && submission.score !== undefined ? submission.score : 0,
              feedback: submission.feedback,
            };

            // Handle dates
            if (submission.startedAt) {
              processedSubmission.startedAt = typeof submission.startedAt === 'string'
                ? new Date(submission.startedAt)
                : submission.startedAt;
              console.log('Using startedAt:', submission.startedAt);
            } else if (submission.started_at) {
              processedSubmission.startedAt = new Date(submission.started_at);
              console.log('Using started_at:', submission.started_at);
            } else {
              console.log('No start date found in submission');
              processedSubmission.startedAt = new Date();
            }

            if (submission.submittedAt) {
              processedSubmission.submittedAt = typeof submission.submittedAt === 'string'
                ? new Date(submission.submittedAt)
                : submission.submittedAt;
              console.log('Using submittedAt:', submission.submittedAt);
            } else if (submission.submitted_at) {
              processedSubmission.submittedAt = new Date(submission.submitted_at);
              console.log('Using submitted_at:', submission.submitted_at);
            } else {
              console.log('No submission date found in submission');
              processedSubmission.submittedAt = new Date();
            }

            // Extract assignment title from nested object if needed
            if (submission.assignmentTitle) {
              processedSubmission.assignmentTitle = submission.assignmentTitle;
            } else if (submission.interactive_assignment && submission.interactive_assignment.title) {
              processedSubmission.assignmentTitle = submission.interactive_assignment.title;
              processedSubmission.interactive_assignment = submission.interactive_assignment;
              console.log('Found interactive_assignment:', submission.interactive_assignment);
            } else {
              console.log('No assignment title found in submission');
              processedSubmission.assignmentTitle = 'Unknown Assignment';
            }

            // Log the processed submission for debugging
            console.log('Processed submission result:', JSON.stringify(processedSubmission));

            return processedSubmission;
          });

          console.log('Processed submissions:', processedSubmissions.length, 'submissions');
          console.log('Final processed submissions array:', JSON.stringify(processedSubmissions));

          // IMPORTANT: Directly set the state with the processed submissions
          // This is a critical fix to ensure the state is updated correctly
          setCompletedActivities(processedSubmissions);
          console.log('Updated completedActivities state, new length:', processedSubmissions.length);

          // Mark that we've processed these submissions
          processedSubmissionsRef.current = true;

          // Add a delayed check to verify the state was updated
          setTimeout(() => {
            console.log('Delayed check of completedActivities state:', completedActivities.length);
            if (completedActivities.length === 0 && processedSubmissions.length > 0) {
              console.log('State update failed! Trying again with a different approach');
              // Try a different approach to update the state
              setCompletedActivities(prev => {
                console.log('Using functional state update with prev length:', prev.length);
                return processedSubmissions;
              });
            }
          }, 50);

          // Important: Set loading to false AFTER setting the activities
          console.log('Setting loading to false');
          setLoading(false);

          // Force a re-render after a short delay to ensure UI is updated
          setTimeout(() => {
            if (isMounted.current) {
              console.log('Forced update to ensure UI is refreshed');
              console.log('Current completedActivities length:', completedActivities.length);
              forceUpdate();
            }
          }, 100);
        } else {
          console.log('No submissions found or component unmounted - CRITICAL ERROR');
          console.log('This is the main issue causing the dashboard to show 0 activities');
          console.log('Attempting direct state update as a workaround');

          // Direct workaround - try to set the activities directly from the raw submissions
          if (submissions && Array.isArray(submissions) && submissions.length > 0) {
            console.log('Applying workaround with direct submissions data');
            setCompletedActivities(submissions as any);
            console.log('Directly set completedActivities with raw submissions data');

            // Mark that we've processed these submissions
            processedSubmissionsRef.current = true;

            // Force a re-render
            setTimeout(() => {
              forceUpdate();
            }, 100);
          } else {
            console.log('Cannot apply workaround - no valid submissions data');
          }

          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        if (isMounted.current) {
          toast.error('Failed to load your activities');
          // Even on error, we should set loading to false
          setLoading(false);
        }
      } finally {
        // Ensure loading is set to false in all cases
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    loadUserData();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted.current = false;
    };
  }, [isAuthenticated, userId, fetchUserSubmissions, navigate]);

  // Debug log in render function
  console.log('UserDashboardPage render - completedActivities:', completedActivities.length);
  console.log('UserDashboardPage render - loading:', loading);

  // Force completedActivities to use the ref if it's empty but ref has data
  useEffect(() => {
    if (completedActivities.length === 0 && submissionsRef.current.length > 0) {
      console.log('Render effect: completedActivities is empty but submissionsRef has data, forcing update');
      setCompletedActivities(submissionsRef.current as any);

      // Mark that we've processed these submissions
      processedSubmissionsRef.current = true;

      // Force a re-render
      setTimeout(() => {
        forceUpdate();
      }, 100);
    }
  }, [completedActivities.length, forceUpdate]);

  // CRITICAL FIX: Use a direct approach to ensure the activities are displayed
  // This is a last resort to fix the issue
  const displayedActivities = completedActivities.length > 0 ? completedActivities : submissionsRef.current;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: config.primaryColor }}>
            My Learning Journey
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">
            Welcome back, {username || 'Learner'}! Here's a summary of your completed activities.
          </p>

          {/* Stats Summary - Responsive grid for mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 sm:p-4 text-center">
              <h3 className="text-base sm:text-lg font-semibold mb-1">Completed Activities</h3>
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: config.accentColor }}>
                {loading ? '...' : displayedActivities.length}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 sm:p-4 text-center">
              <h3 className="text-base sm:text-lg font-semibold mb-1">Average Score</h3>
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: config.accentColor }}>
                {loading ? '...' :
                  displayedActivities.length > 0
                    ? `${Math.round(displayedActivities.reduce((sum, activity) => {
                        // Convert null/undefined scores to 0
                        const score = activity.score !== null && activity.score !== undefined ? activity.score : 0;
                        return sum + score;
                      }, 0) / displayedActivities.length)}%`
                    : '0%'
                }
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3 sm:p-4 text-center col-span-1 sm:col-span-2 lg:col-span-1">
              <h3 className="text-base sm:text-lg font-semibold mb-1">Certificates Earned</h3>
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: config.accentColor }}>
                {loading ? '...' : displayedActivities.length}
              </p>
            </div>
          </div>
        </div>

        {/* Completed Activities List */}
        <CompletedActivitiesList
          activities={displayedActivities}
          loading={loading}
        />
      </motion.div>
    </div>
  );
};

export default UserDashboardPage;
