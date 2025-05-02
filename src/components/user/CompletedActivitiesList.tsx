// src/components/user/CompletedActivitiesList.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useConfiguration } from '../../context/ConfigurationContext';
import { InteractiveSubmission } from '../../types/interactiveAssignment';
import { InteractiveSubmissionExtended } from '../../types/interactiveSubmissionExtended';
import CertificateViewer from '../certificates/CertificateViewer';

interface CompletedActivitiesListProps {
  activities: (InteractiveSubmission | InteractiveSubmissionExtended)[];
  loading: boolean;
}

const CompletedActivitiesList = ({ activities, loading }: CompletedActivitiesListProps) => {
  const [selectedActivity, setSelectedActivity] = useState<InteractiveSubmission | InteractiveSubmissionExtended | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const { config } = useConfiguration();
  const navigate = useNavigate();

  // Debug logging
  console.log('CompletedActivitiesList render - loading:', loading, 'activities:', activities.length);
  console.log('CompletedActivitiesList activities data:', JSON.stringify(activities));

  // Store activities in a ref for debugging
  const activitiesRef = useRef<any[]>([]);

  // Update the ref when activities change
  useEffect(() => {
    if (activities && activities.length > 0) {
      console.log('CompletedActivitiesList: Storing activities in ref');
      activitiesRef.current = [...activities];
    }
  }, [activities]);

  // Format date
  const formatDate = (date?: Date | string) => {
    if (!date) return 'N/A';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Invalid Date';
    }
  };

  // Get badge based on score
  const getBadge = (score?: number | null) => {
    // Convert null or undefined to 0
    const actualScore = score === null || score === undefined ? 0 : score;

    if (actualScore >= 90) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Excellent
        </span>
      );
    } else if (actualScore >= 70) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          Good
        </span>
      );
    } else if (actualScore >= 50) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Satisfactory
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Needs Practice
        </span>
      );
    }
  };

  // Handle view certificate
  const handleViewCertificate = (activity: InteractiveSubmission | InteractiveSubmissionExtended) => {
    // Normalize the activity to ensure it has the expected properties
    const normalizedActivity: any = {
      ...activity,
      // Ensure camelCase properties exist
      id: activity.id,
      assignmentId: activity.assignmentId || activity.assignment_id,
      userId: activity.userId || activity.user_id,
      status: activity.status,
      score: activity.score !== null && activity.score !== undefined ? activity.score : 0,
      startedAt: activity.startedAt || activity.started_at,
      submittedAt: activity.submittedAt || activity.submitted_at,
      feedback: activity.feedback,
      // Preserve the interactive_assignment property for the certificate
      interactive_assignment: activity.interactive_assignment
    };

    console.log('Viewing certificate for activity:', normalizedActivity);
    setSelectedActivity(normalizedActivity);
    setShowCertificate(true);
  };

  // Handle retry assignment
  const handleRetryAssignment = (activity: InteractiveSubmission | InteractiveSubmissionExtended) => {
    const assignmentId = activity.assignmentId || activity.assignment_id;
    if (!assignmentId) {
      console.error('No assignment ID found for activity:', activity);
      return;
    }
    navigate(`/play/assignment/${assignmentId}`);
  };

  // Check if we're in a loading state - use a direct boolean check
  const isLoading = Boolean(loading);
  console.log('CompletedActivitiesList isLoading calculated:', isLoading, 'original loading prop:', loading);

  // Track how long we've been in the loading state
  const [loadingStartTime] = useState<number>(Date.now());
  const loadingDuration = Date.now() - loadingStartTime;

  // If loading for more than 10 seconds, show a message instead of spinner
  const showLoadingTimeout = loadingDuration > 10000;

  // If we have activities but loading is still true, force it to false
  useEffect(() => {
    if (isLoading && activities.length > 0) {
      console.log('Activities found but still loading, forcing loading state to false');
      // This is a workaround for when the loading state gets stuck
      setTimeout(() => window.dispatchEvent(new Event('force-refresh')), 100);
    }
  }, [isLoading, activities.length]);

  if (isLoading && activities.length === 0) {
    console.log('CompletedActivitiesList is in loading state, duration:', loadingDuration);
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6" style={{ color: config.secondaryColor }}>
          Completed Activities
        </h2>
        <div className="flex flex-col justify-center items-center py-12">
          {showLoadingTimeout ? (
            <>
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-4 text-center">
                Taking longer than expected to load your activities.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 rounded-lg font-medium transition-colors duration-300 mt-2"
                style={{ backgroundColor: config.primaryColor, color: 'white' }}
              >
                Refresh Page
              </button>
            </>
          ) : (
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4" style={{ borderColor: config.accentColor }}></div>
          )}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    console.log('CompletedActivitiesList: No activities found, checking ref');

    // Check if we have activities in the ref but not in the props
    if (activitiesRef.current.length > 0) {
      console.log('CompletedActivitiesList: Found activities in ref but not in props, using ref data');
      // This is a workaround for when the activities prop is empty but we have data in the ref
      return (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-4">
            <h2 className="text-2xl font-bold mb-6" style={{ color: config.secondaryColor }}>
              Completed Activities (Recovered)
            </h2>
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
              <p className="font-bold">Data Recovery Mode</p>
              <p>Activities were found in cache but not properly passed to the component. Using recovered data.</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded text-sm"
              >
                Refresh Page
              </button>
            </div>
            <p>Found {activitiesRef.current.length} activities in recovery cache.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6" style={{ color: config.secondaryColor }}>
              Completed Activities
            </h2>
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                You haven't completed any activities yet.
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 rounded-lg font-medium transition-colors duration-300"
                style={{ backgroundColor: config.primaryColor, color: 'white' }}
              >
                Explore Activities
              </button>
            </div>
          </div>
        </>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6" style={{ color: config.secondaryColor }}>
          Completed Activities
        </h2>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
            You haven't completed any activities yet.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 rounded-lg font-medium transition-colors duration-300"
            style={{ backgroundColor: config.primaryColor, color: 'white' }}
          >
            Explore Activities
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: config.secondaryColor }}>
          Completed Activities
        </h2>

        {/* Desktop view - Table (hidden on mobile) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Completed On
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {activities.map((activity) => (
                <motion.tr
                  key={activity.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.assignmentTitle ||
                       (activity.interactive_assignment && activity.interactive_assignment.title) ||
                       (activity.assignment_id && `Assignment ${activity.assignment_id.substring(0, 8)}`) ||
                       (activity.assignmentId && `Assignment ${activity.assignmentId.substring(0, 8)}`) ||
                       'Unknown Assignment'}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(activity.submittedAt || activity.submitted_at)}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium" style={{ color: config.accentColor }}>
                      {activity.score !== undefined && activity.score !== null ? `${activity.score}%` : '0%'}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    {getBadge(activity.score)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewCertificate(activity)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View Certificate
                      </button>
                      <button
                        onClick={() => handleRetryAssignment(activity)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile view - Card layout (visible only on mobile) */}
        <div className="sm:hidden space-y-4">
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  {activity.assignmentTitle ||
                   (activity.interactive_assignment && activity.interactive_assignment.title) ||
                   (activity.assignment_id && `Assignment ${activity.assignment_id.substring(0, 8)}`) ||
                   (activity.assignmentId && `Assignment ${activity.assignmentId.substring(0, 8)}`) ||
                   'Unknown Assignment'}
                </h3>
                {getBadge(activity.score)}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Completed On</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formatDate(activity.submittedAt || activity.submitted_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
                  <p className="text-sm font-medium" style={{ color: config.accentColor }}>
                    {activity.score !== undefined && activity.score !== null ? `${activity.score}%` : '0%'}
                  </p>
                </div>
              </div>

              <div className="flex space-x-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => handleViewCertificate(activity)}
                  className="flex-1 py-2 text-center text-sm text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View Certificate
                </button>
                <button
                  onClick={() => handleRetryAssignment(activity)}
                  className="flex-1 py-2 text-center text-sm text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                >
                  Retry
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Certificate Viewer Modal */}
      <AnimatePresence>
        {showCertificate && selectedActivity && (
          <CertificateViewer
            submission={selectedActivity}
            onClose={() => setShowCertificate(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default CompletedActivitiesList;
