// src/components/pages/UserDashboardPage.tsx
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useConfiguration } from '../../context/ConfigurationContext';
import CompletedActivitiesList from '../user/CompletedActivitiesList';
import { InteractiveSubmissionExtended } from '../../types/interactiveSubmissionExtended';
import toast from 'react-hot-toast';

const UserDashboardPage = () => {
  const [completedActivities, setCompletedActivities] = useState<InteractiveSubmissionExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);
  const { isAuthenticated, userId, username } = useSupabaseAuth();
  const { fetchUserSubmissions } = useInteractiveAssignment();
  const { config } = useConfiguration();
  const navigate = useNavigate();

  // For debugging and state recovery
  const submissionsRef = useRef<any[]>([]);

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  // Effect to ensure loading state is properly managed when activities are loaded
  useEffect(() => {
    if (completedActivities.length > 0 && loading) {
      console.log('Activities loaded but loading is still true, setting loading to false');
      setLoading(false);
    }
  }, [completedActivities, loading]);

  // Additional effect to ensure loading state is reset after a timeout
  // This prevents the loader from getting stuck
  useEffect(() => {
    // If loading is true for more than 3 seconds, force it to false
    const timeoutId = setTimeout(() => {
      if (loading && initialLoadAttempted) {
        console.log('Loading timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [loading, initialLoadAttempted]);

  // Process submissions data to ensure consistent format
  const processSubmissions = (submissions: any[]): InteractiveSubmissionExtended[] => {
    if (!submissions || !Array.isArray(submissions) || submissions.length === 0) {
      return [];
    }

    return submissions.map((submission: any) => {
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
      } else if (submission.started_at) {
        processedSubmission.startedAt = new Date(submission.started_at);
      } else {
        processedSubmission.startedAt = new Date();
      }

      if (submission.submittedAt) {
        processedSubmission.submittedAt = typeof submission.submittedAt === 'string'
          ? new Date(submission.submittedAt)
          : submission.submittedAt;
      } else if (submission.submitted_at) {
        processedSubmission.submittedAt = new Date(submission.submitted_at);
      } else {
        processedSubmission.submittedAt = new Date();
      }

      // Extract assignment title from nested object if needed
      if (submission.assignmentTitle) {
        processedSubmission.assignmentTitle = submission.assignmentTitle;
      } else if (submission.interactive_assignment && submission.interactive_assignment.title) {
        processedSubmission.assignmentTitle = submission.interactive_assignment.title;
        processedSubmission.interactive_assignment = submission.interactive_assignment;
      } else {
        processedSubmission.assignmentTitle = 'Unknown Assignment';
      }

      return processedSubmission;
    });
  };

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
        setInitialLoadAttempted(true);

        // Store submissions in ref for backup/recovery
        submissionsRef.current = submissions;

        // Process and update state with the submissions
        if (isMounted.current && submissions && Array.isArray(submissions)) {
          const processedSubmissions = processSubmissions(submissions);

          if (processedSubmissions.length > 0) {
            console.log(`Setting ${processedSubmissions.length} processed submissions to state`);
            setCompletedActivities(processedSubmissions);
          } else if (submissions.length > 0) {
            // Fallback: use raw submissions if processing failed
            console.log(`Using ${submissions.length} raw submissions as fallback`);
            setCompletedActivities(submissions as any);
          } else {
            console.log('No submissions found');
            // Ensure we clear any previous activities if none are found
            setCompletedActivities([]);
          }
        } else {
          console.log('No valid submissions data or component unmounted');
          if (isMounted.current) {
            setCompletedActivities([]);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        if (isMounted.current) {
          toast.error('Failed to load your activities');
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

  // Backup mechanism: If state is empty but ref has data, use the ref data
  useEffect(() => {
    if (initialLoadAttempted && completedActivities.length === 0 && submissionsRef.current.length > 0) {
      console.log('Backup mechanism: completedActivities is empty but submissionsRef has data');
      const processedBackupData = processSubmissions(submissionsRef.current);
      if (processedBackupData.length > 0) {
        console.log(`Setting ${processedBackupData.length} backup submissions to state`);
        setCompletedActivities(processedBackupData);
      }
    }
  }, [completedActivities.length, initialLoadAttempted]);

  // Use the most reliable source of data for display
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
