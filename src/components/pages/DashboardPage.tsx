// src/components/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { InteractiveAssignment } from '../../types/interactiveAssignment';
import AssignmentList from '../assignments/AssignmentList';
import { useDatabaseState } from '../../context/DatabaseStateContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { useTranslations } from '../../hooks/useTranslations';
import { toastUtils } from '../../utils/toastUtils';

const DashboardPage = () => {
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const { isReady: isDatabaseReady, state: dbState, error: dbError } = useDatabaseState();
  const { isAuthenticated, isLoading: isAuthLoading, username } = useSupabaseAuth();
  const { currentOrganization } = useOrganization();
  const { commonTranslate, navTranslate, authTranslate } = useTranslations();
  const navigate = useNavigate();

  // Check database state and set error if needed
  useEffect(() => {
    if (dbState === 'error') {
      setDatabaseError(dbError || commonTranslate('databaseError', 'Database connection error. Please try refreshing the page.'));
    } else {
      setDatabaseError(null);
    }
  }, [dbState, dbError, commonTranslate]);

  const handleSelectAssignment = (assignment: InteractiveAssignment) => {
    console.log('Assignment selected:', assignment.id);
    navigate(`/play/assignment/${assignment.id}`);
  };

  // Redirect to sign-in if not authenticated and not loading
  if (!isAuthenticated && !isAuthLoading) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <div className="container mx-auto pt-2 md:pt-4 px-4">
      {/* Mobile-optimized Database Error Message */}
      {databaseError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 border border-red-400 text-red-700 px-3 md:px-4 py-3 rounded-xl my-2 md:my-4"
        >
          <h3 className="font-bold text-base md:text-lg">Database Connection Error</h3>
          <p className="text-sm md:text-base">{databaseError}</p>
          <div className="flex gap-2 md:gap-3 mt-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 md:px-4 rounded-lg transition-colors duration-300 text-sm md:text-base"
            >
              Refresh Page
            </button>
          </div>
        </motion.div>
      )}

      {/* Mobile-optimized Loading State */}
      {!isDatabaseReady && dbState !== 'error' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-8 md:py-12"
        >
          <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-t-2 border-b-2 border-blue-500 mb-3 md:mb-4"></div>
          <p className="text-gray-600 text-center text-sm md:text-base">
            Initializing database connection...
            <br />
            <span className="text-xs md:text-sm">This may take a moment</span>
          </p>
        </motion.div>
      )}

      {/* Mobile-optimized Auth Loading State */}
      {isAuthLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-8 md:py-12"
        >
          <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-t-2 border-b-2 border-blue-500 mb-3 md:mb-4"></div>
          <p className="text-gray-600 text-center text-sm md:text-base">
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
          className="space-y-4 md:space-y-8"
        >
          {/* Mobile-First Welcome Section */}
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl md:text-3xl font-bold mb-2">
                  Welcome back, {username || 'User'}! 👋
                </h1>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
                  {currentOrganization ?
                    `You're in ${currentOrganization.name} organization` :
                    'Ready to create amazing learning experiences?'}
                </p>
              </div>
              <div className="hidden md:block">
                <div className="text-2xl">🚀</div>
              </div>
            </div>

            {/* Quick stats for SaaS */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 mt-4 p-3 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-blue-600">📊</div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">Analytics</p>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-green-600">📱</div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">Mobile-Ready</p>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-purple-600">🎯</div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">Interactive</p>
              </div>
            </div>
          </motion.div>

          {/* Mobile-First Quick Actions */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div
              className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 md:p-6 shadow cursor-pointer hover:shadow-md transition-all hover:scale-105"
              onClick={() => navigate('/gallery')}
            >
              <div className="text-2xl md:text-3xl mb-2">🎨</div>
              <h3 className="text-sm md:text-xl font-semibold mb-1 md:mb-2">Gallery</h3>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">Browse templates</p>
            </div>
            <div
              className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 md:p-6 shadow cursor-pointer hover:shadow-md transition-all hover:scale-105"
              onClick={() => navigate('/manage-assignments')}
            >
              <div className="text-2xl md:text-3xl mb-2">⚙️</div>
              <h3 className="text-sm md:text-xl font-semibold mb-1 md:mb-2">Manage</h3>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">Create & edit</p>
            </div>
            <div
              className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 md:p-6 shadow cursor-pointer hover:shadow-md transition-all hover:scale-105"
              onClick={() => navigate('/organizations')}
            >
              <div className="text-2xl md:text-3xl mb-2">🏢</div>
              <h3 className="text-sm md:text-xl font-semibold mb-1 md:mb-2">Organizations</h3>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">Manage settings</p>
            </div>
            <div
              className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 md:p-6 shadow cursor-pointer hover:shadow-md transition-all hover:scale-105"
              onClick={() => navigate('/user-dashboard')}
            >
              <div className="text-2xl md:text-3xl mb-2">🏆</div>
              <h3 className="text-sm md:text-xl font-semibold mb-1 md:mb-2">Certificates</h3>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">View achievements</p>
            </div>
          </motion.div>

          {/* Mobile-First Recent Assignments */}
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-lg md:text-2xl font-bold">Your Assignments</h2>
              <div className="text-lg md:text-xl">📚</div>
            </div>
            <AssignmentList onSelectAssignment={handleSelectAssignment} />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardPage;
