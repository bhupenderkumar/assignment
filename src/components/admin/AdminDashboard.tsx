// src/components/admin/AdminDashboard.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import { InteractiveAssignment } from '../../types/interactiveAssignment';
import AssignmentForm from './AssignmentForm';
import AssignmentManagementList from './AssignmentManagementList';
import ShareAssignmentModal from './ShareAssignmentModal';
import AnonymousUserActivity from './AnonymousUserActivity';
import AllUserActivity from './AllUserActivity';
import UserProgressDashboard from './UserProgressDashboard';
import DatabaseMigrationRunner from './DatabaseMigrationRunner';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<InteractiveAssignment | null>(null);
  const [sharingAssignment, setSharingAssignment] = useState<InteractiveAssignment | null>(null);
  const [activeTab, setActiveTab] = useState<'assignments' | 'progress' | 'activity' | 'all-activity' | 'database'>('assignments');
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['assignments'])); // Track which tabs have been loaded
  const {
    createAssignment,
    updateAssignment,
    fetchAssignmentById,
    currentAssignment,
    showProgress,
    updateProgress,
    hideProgress
  } = useInteractiveAssignment();
  const navigate = useNavigate();
  const { assignmentId } = useParams<{ assignmentId: string }>();

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  // Check if we're in edit mode based on URL parameters
  useEffect(() => {
    const loadAssignmentForEdit = async () => {
      if (assignmentId) {
        try {
          console.log('Loading assignment for edit from URL parameter:', assignmentId);

          // Show loading progress
          showProgress('Loading assignment...');
          updateProgress(10, 'Preparing to load assignment...');

          // Always fetch the assignment when the URL parameter changes
          // This ensures we're always working with the latest data
          console.log('Fetching assignment data for editing...');
          updateProgress(30, 'Fetching assignment data...');

          await fetchAssignmentById(assignmentId);

          updateProgress(100, 'Assignment loaded successfully');
          setTimeout(() => hideProgress(), 500);
        } catch (error) {
          console.error('Error loading assignment for edit:', error);
          updateProgress(100, 'Failed to load assignment');
          setTimeout(() => hideProgress(), 1000);

          if (isMounted.current) {
            toast.error('Failed to load assignment for editing');
            navigate('/manage-assignments');
          }
        }
      } else {
        // If no assignment ID in URL, make sure we're not in edit mode
        if (editingAssignment) {
          console.log('No assignment ID in URL, clearing editing state');
          setEditingAssignment(null);
        }
      }
    };

    loadAssignmentForEdit();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted.current = false;
    };
  }, [assignmentId, fetchAssignmentById, navigate, editingAssignment, showProgress, updateProgress, hideProgress]);

  // Update editingAssignment when currentAssignment changes
  useEffect(() => {
    if (currentAssignment && assignmentId && currentAssignment.id === assignmentId) {
      console.log('Setting editingAssignment from currentAssignment:', currentAssignment.title);
      setEditingAssignment(currentAssignment);
    } else if (!assignmentId && editingAssignment) {
      // Clear editing state if no assignment ID in URL
      setEditingAssignment(null);
    }
  }, [currentAssignment, assignmentId, editingAssignment]);

  // Handle tab switching with lazy loading
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as any);
    // Mark this tab as loaded when it becomes active
    setLoadedTabs(prev => new Set([...prev, tabId]));
  };

  // Debug log to help diagnose rendering issues
  useEffect(() => {
    console.log('Render state:', {
      isCreating,
      hasEditingAssignment: !!editingAssignment,
      editingAssignmentId: editingAssignment?.id,
      currentAssignmentId: currentAssignment?.id,
      assignmentIdFromURL: assignmentId
    });
  }, [isCreating, editingAssignment, currentAssignment, assignmentId]);

  const handleCreateAssignment = async (assignmentData: Partial<InteractiveAssignment>) => {
    try {
      await createAssignment(assignmentData);
      setIsCreating(false);
      toast.success('Assignment created successfully');
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error(`Error creating assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateAssignment = async (id: string, assignmentData: Partial<InteractiveAssignment>) => {
    // Show loading progress
    showProgress('Updating assignment...');
    updateProgress(10, 'Preparing to update assignment...');

    try {
      // Make sure we're passing the ID in the assignment data
      const dataWithId = { ...assignmentData, id };
      updateProgress(30, 'Saving assignment data...');
      await updateAssignment(id, dataWithId);

      updateProgress(80, 'Assignment updated successfully');
      setEditingAssignment(null);
      toast.success('Assignment updated successfully');

      // Redirect to manage assignments page
      updateProgress(90, 'Redirecting to manage assignments...');
      navigate('/manage-assignments');

      updateProgress(100, 'Complete');
      setTimeout(() => hideProgress(), 500);
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error(`Error updating assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      updateProgress(100, 'Failed to update assignment');
      setTimeout(() => hideProgress(), 1000);
    }
  };

  const handleEditAssignment = async (assignment: InteractiveAssignment) => {
    // Navigate to the edit page with the assignment ID
    navigate(`/edit-assignment/${assignment.id}`);
  };

  const handleShareAssignment = (assignment: InteractiveAssignment) => {
    setSharingAssignment(assignment);
  };

  // Handle cancel edit - navigate back to management page
  const handleCancelEdit = () => {
    setEditingAssignment(null);
    navigate('/manage-assignments');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        {!isCreating && !editingAssignment && activeTab === 'assignments' && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create Assignment
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      {!isCreating && !editingAssignment && (
        <div className="mb-8">
          {/* Desktop Tab Navigation */}
          <div className="hidden md:block">
            <nav className="flex space-x-8 border-b border-gray-200 dark:border-gray-700">
              {[
                { id: 'assignments', label: 'Assignments', icon: '📝' },
                { id: 'progress', label: 'User Progress', icon: '📊' },
                { id: 'activity', label: 'Anonymous Activity', icon: '👤' },
                { id: 'all-activity', label: 'All User Activity', icon: '👥' },
                { id: 'database', label: 'Database', icon: '🗄️' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Mobile Tab Navigation - Horizontal Scroll */}
          <div className="md:hidden">
            <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-hide mobile-tab-scroll">
              {[
                { id: 'assignments', label: 'Assignments', icon: '📝' },
                { id: 'progress', label: 'User Progress', icon: '📊' },
                { id: 'activity', label: 'Anonymous Activity', icon: '👤' },
                { id: 'all-activity', label: 'All User Activity', icon: '👥' },
                { id: 'database', label: 'Database', icon: '🗄️' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {isCreating ? (
          <motion.div
            key="create-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mt-8"
          >
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Create New Assignment</h2>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <AssignmentForm onSubmit={handleCreateAssignment} onCancel={() => setIsCreating(false)} />
            </div>
          </motion.div>
        ) : editingAssignment ? (
          <motion.div
            key="edit-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mt-8"
          >
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Edit Assignment</h2>
                <button
                  onClick={() => setEditingAssignment(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <AssignmentForm
                initialData={editingAssignment}
                onSubmit={(data) => handleUpdateAssignment(editingAssignment.id, data)}
                onCancel={handleCancelEdit}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`tab-${activeTab}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mt-8"
          >
            {activeTab === 'assignments' && (
              <AssignmentManagementList
                onEdit={handleEditAssignment}
                onShare={handleShareAssignment}
              />
            )}

            {activeTab === 'progress' && loadedTabs.has('progress') && (
              <UserProgressDashboard shouldLoad={loadedTabs.has('progress')} />
            )}

            {activeTab === 'activity' && loadedTabs.has('activity') && (
              <AnonymousUserActivity shouldLoad={loadedTabs.has('activity')} />
            )}

            {activeTab === 'all-activity' && loadedTabs.has('all-activity') && (
              <AllUserActivity shouldLoad={loadedTabs.has('all-activity')} />
            )}

            {activeTab === 'database' && loadedTabs.has('database') && (
              <DatabaseMigrationRunner />
            )}

            {/* Loading states for tabs that haven't been loaded yet */}
            {activeTab === 'progress' && !loadedTabs.has('progress') && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading user progress...</span>
              </div>
            )}

            {activeTab === 'activity' && !loadedTabs.has('activity') && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading anonymous activity...</span>
              </div>
            )}

            {activeTab === 'all-activity' && !loadedTabs.has('all-activity') && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading all user activity...</span>
              </div>
            )}

            {activeTab === 'database' && !loadedTabs.has('database') && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading database tools...</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Assignment Modal */}
      <ShareAssignmentModal
        assignment={sharingAssignment}
        onClose={() => setSharingAssignment(null)}
      />
    </div>
  );
};

export default AdminDashboard;
