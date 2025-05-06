// src/components/pages/HomePage.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { InteractiveAssignment } from '../../types/interactiveAssignment';
import AssignmentList from '../assignments/AssignmentList';
import AnonymousUserRegistration from '../auth/AnonymousUserRegistration';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import { useDatabaseState } from '../../context/DatabaseStateContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';

const HomePage = () => {
  const [showRegistration, setShowRegistration] = useState(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const { anonymousUser } = useInteractiveAssignment();
  const { isReady: isDatabaseReady, state: dbState, error: dbError } = useDatabaseState();
  const { isAuthenticated, isLoading: isAuthLoading } = useSupabaseAuth();
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

    // Show registration modal if user is not registered
    if (!anonymousUser) {
      console.log('User not registered, showing registration modal');
      setShowRegistration(true);

      // Store the assignment ID to navigate after registration
      localStorage.setItem('pendingAssignmentId', assignment.id);
    } else {
      console.log('User already registered:', anonymousUser);
      // Use React Router navigation
      navigate(`/play/assignment/${assignment.id}`);
    }
  };



  // Redirect to dashboard if authenticated, or to sign-in if not authenticated
  if (!isAuthLoading) {
    if (isAuthenticated) {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/sign-in" replace />;
    }
  }

  return (
    <div className="container mx-auto">
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

      {/* Assignment List - only show when database is ready AND user is authenticated */}
      {(isDatabaseReady || dbState === 'ready') && isAuthenticated && !isAuthLoading && (
        <motion.div
          key="assignment-list"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AssignmentList onSelectAssignment={handleSelectAssignment} />
        </motion.div>
      )}

      {/* Anonymous User Registration Modal */}
      <AnonymousUserRegistration
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
      />
    </div>
  );
};

export default HomePage;
