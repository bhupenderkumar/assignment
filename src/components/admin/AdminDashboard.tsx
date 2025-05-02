// src/components/admin/AdminDashboard.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import { InteractiveAssignment } from '../../types/interactiveAssignment';
import AssignmentForm from './AssignmentForm';
import AssignmentManagementList from './AssignmentManagementList';
import ShareAssignmentModal from './ShareAssignmentModal';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<InteractiveAssignment | null>(null);
  const [sharingAssignment, setSharingAssignment] = useState<InteractiveAssignment | null>(null);
  const { createAssignment, updateAssignment, fetchAssignmentById } = useInteractiveAssignment();
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

          // Check if we already have this assignment loaded
          if (editingAssignment && editingAssignment.id === assignmentId) {
            console.log('Assignment already loaded, skipping fetch');
            return;
          }

          const assignment = await fetchAssignmentById(assignmentId);

          // Only update state if component is still mounted
          if (isMounted.current) {
            if (assignment) {
              setEditingAssignment(assignment);
            } else {
              toast.error('Assignment not found');
              navigate('/manage-assignments');
            }
          }
        } catch (error) {
          console.error('Error loading assignment for edit:', error);
          if (isMounted.current) {
            toast.error('Failed to load assignment for editing');
            navigate('/manage-assignments');
          }
        }
      }
    };

    loadAssignmentForEdit();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted.current = false;
    };
  }, [assignmentId, fetchAssignmentById, navigate, editingAssignment]);

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
    try {
      // Make sure we're passing the ID in the assignment data
      const dataWithId = { ...assignmentData, id };
      await updateAssignment(id, dataWithId);
      setEditingAssignment(null);
      toast.success('Assignment updated successfully');
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error(`Error updating assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Assignment Management</h1>
        {!isCreating && !editingAssignment && (
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

      <AnimatePresence mode="wait">
        {isCreating ? (
          <motion.div
            key="create-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
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
            key="assignment-list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AssignmentManagementList
              onEdit={handleEditAssignment}
              onShare={handleShareAssignment}
            />
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
