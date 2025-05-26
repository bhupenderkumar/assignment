// src/components/assignments/AssignmentList.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import { useDatabaseState } from '../../context/DatabaseStateContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useConfiguration } from '../../context/ConfigurationContext';
import { InteractiveAssignment } from '../../types/interactiveAssignment';

interface AssignmentListProps {
  onSelectAssignment: (assignment: InteractiveAssignment) => void;
}

const AssignmentList = ({ onSelectAssignment }: AssignmentListProps) => {
  const { assignments, loading, error, fetchAssignments } = useInteractiveAssignment();
  const { isReady: isDatabaseReady, executeWhenReady } = useDatabaseState();
  const { isAuthenticated } = useSupabaseAuth();
  const { config } = useConfiguration();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch assignments on mount, but only when database is ready, user is authenticated, and we don't already have assignments
  useEffect(() => {
    console.log('AssignmentList mounted, current assignments:', assignments.length);
    console.log('Database ready status:', isDatabaseReady);
    console.log('Authentication status:', isAuthenticated);

    // Only fetch if database is ready, user is authenticated, AND we don't already have assignments
    // This prevents multiple fetches during initialization and fetching when not authenticated
    if (isDatabaseReady && isAuthenticated && assignments.length === 0 && !loading) {
      setLocalLoading(true);

      // Use executeWhenReady to ensure database operations are queued if needed
      executeWhenReady(() => {
        return fetchAssignments()
          .then(() => {
            console.log('Assignments fetched successfully');
            setLocalError(null);
          })
          .catch(error => {
            console.error('Error fetching assignments:', error);
            setLocalError(error instanceof Error ? error.message : 'Failed to load assignments');
          })
          .finally(() => {
            setLocalLoading(false);
          });
      });
    } else if (assignments.length > 0) {
      // We already have assignments, no need to fetch
      console.log('AssignmentList: Already have assignments, skipping fetch');
    } else if (!isAuthenticated) {
      // User is not authenticated, no need to fetch
      console.log('AssignmentList: User not authenticated, skipping fetch');
    }
  }, [fetchAssignments, isDatabaseReady, executeWhenReady, assignments.length, loading, isAuthenticated]);

  // Filter assignments based on search term and filter type
  // Also filter out template assignments that don't belong to the organization
  const filteredAssignments = assignments.filter(assignment => {
    // First, filter out template assignments that don't belong to an organization
    // These should only be shown in the gallery, not in the assignment list
    if (assignment.isTemplate === true && !assignment.organizationId) {
      return false;
    }

    // Then apply the user's filters
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType ? assignment.type === filterType : true;

    return matchesSearch && matchesType;
  });

  // Get unique assignment types
  const assignmentTypes = [...new Set(assignments.map(a => a.type))];

  // Loading state - use either local or context loading state
  if (loading || localLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Loading assignments...</p>
      </div>
    );
  }

  // Not ready state - database is not ready yet
  if (!isDatabaseReady) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-xl my-4">
        <h3 className="font-bold text-lg">Database Initializing</h3>
        <p>The database connection is being established. Please wait a moment.</p>
        <div className="mt-3 flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-yellow-700 mr-3"></div>
          <span>Connecting to database...</span>
        </div>
      </div>
    );
  }

  // Error state - use either local or context error
  if (error || localError) {
    const errorMessage = localError || error;
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl my-4">
        <h3 className="font-bold text-lg">Error</h3>
        <p>{errorMessage}</p>
        <div className="flex gap-3 mt-3">
          <button
            onClick={() => {
              setLocalLoading(true);
              executeWhenReady(() =>
                fetchAssignments()
                  .then(() => setLocalError(null))
                  .catch(err => setLocalError(String(err)))
                  .finally(() => setLocalLoading(false))
              );
            }}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg transition-colors duration-300"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">{config.companyName} Assignments</h2>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>

          <div className="w-full md:w-auto">
            <select
              value={filterType || ''}
              onChange={(e) => setFilterType(e.target.value || null)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            >
              <option value="">All Types</option>
              {assignmentTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Assignment List */}
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No assignments found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredAssignments.map((assignment: InteractiveAssignment) => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold">{assignment.title}</h3>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        assignment.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-800'
                          : assignment.status === 'DRAFT'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.status.charAt(0) + assignment.status.slice(1).toLowerCase()}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">{assignment.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {assignment.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>

                      {assignment.difficultyLevel && (
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                          {assignment.difficultyLevel.charAt(0).toUpperCase() + assignment.difficultyLevel.slice(1)}
                        </span>
                      )}

                      {assignment.estimatedTimeMinutes && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {assignment.estimatedTimeMinutes} min
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onSelectAssignment(assignment)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                      >
                        Play Assignment
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          // Use React Router navigation
                          navigate(`/play/assignment/${assignment.id}`);
                          console.log('Navigating to:', `/play/assignment/${assignment.id}`);
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-3 rounded-lg transition-colors duration-300 flex items-center justify-center"
                        title="Direct Link"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentList;
