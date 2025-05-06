// src/components/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { InteractiveAssignment } from '../../types/interactiveAssignment';
import AssignmentList from '../assignments/AssignmentList';
import { useDatabaseState } from '../../context/DatabaseStateContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useOrganization } from '../../context/OrganizationContext';

const DashboardPage = () => {
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const { isReady: isDatabaseReady, state: dbState, error: dbError } = useDatabaseState();
  const { isAuthenticated, isLoading: isAuthLoading, username } = useSupabaseAuth();
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();

  // Check database state and set error if needed
  useEffect(() => {
    if (dbState === 'error') {
      setDatabaseError(dbError || 'Database connection error. Please try refreshing the page.');
    } else {
      setDatabaseError(null);
    }
  }, [dbState, dbError]);

  const handleSelectAssignment = (assignment: InteractiveAssignment) => {
    console.log('Assignment selected:', assignment.id);
    navigate(`/play/assignment/${assignment.id}`);
  };

  // Redirect to sign-in if not authenticated and not loading
  if (!isAuthenticated && !isAuthLoading) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <div className="container mx-auto pt-4">
      {/* Database Error Message */}
      {databaseError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl my-4"
        >
          <h3 className="font-bold text-lg">Database Connection Error</h3>
          <p>{databaseError}</p>
          <div className="flex gap-3 mt-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Refresh Page
            </button>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {!isDatabaseReady && dbState !== 'error' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-12"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 text-center">
            Initializing database connection...
            <br />
            <span className="text-sm">This may take a moment</span>
          </p>
        </motion.div>
      )}

      {/* Auth Loading State */}
      {isAuthLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-12"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 text-center">
            Checking authentication status...
          </p>
        </motion.div>
      )}

      {/* Dashboard Content - only show when database is ready AND user is authenticated */}
      {(isDatabaseReady || dbState === 'ready') && isAuthenticated && !isAuthLoading && (
        <motion.div
          key="dashboard-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {/* Welcome Section */}
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h1 className="text-3xl font-bold mb-4">
              Welcome back, {username || 'User'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {currentOrganization ?
                `You're currently in the ${currentOrganization.name} organization.` :
                'You are not currently in any organization.'}
            </p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div
              className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 shadow cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/gallery')}
            >
              <h3 className="text-xl font-semibold mb-2">Browse Gallery</h3>
              <p className="text-gray-600 dark:text-gray-300">Explore our collection of assignments</p>
            </div>
            <div
              className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 shadow cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/manage-assignments')}
            >
              <h3 className="text-xl font-semibold mb-2">Manage Assignments</h3>
              <p className="text-gray-600 dark:text-gray-300">Create and edit your assignments</p>
            </div>
            <div
              className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 shadow cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/organizations')}
            >
              <h3 className="text-xl font-semibold mb-2">Organizations</h3>
              <p className="text-gray-600 dark:text-gray-300">Manage your organization settings</p>
            </div>
            <div
              className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 shadow cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/user-dashboard')}
            >
              <h3 className="text-xl font-semibold mb-2">My Certificates</h3>
              <p className="text-gray-600 dark:text-gray-300">View and download your achievement certificates</p>
            </div>
          </motion.div>

          {/* Recent Assignments */}
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold mb-6">Your Assignments</h2>
            <AssignmentList onSelectAssignment={handleSelectAssignment} />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardPage;
