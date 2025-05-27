// src/components/admin/AssignmentManagementList.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import { InteractiveAssignment } from '../../types/interactiveAssignment';
import { useTranslations } from '../../hooks/useTranslations';
import toast from 'react-hot-toast';

interface AssignmentManagementListProps {
  onEdit: (assignment: InteractiveAssignment) => void;
  onShare: (assignment: InteractiveAssignment) => void;
}

const AssignmentManagementList = ({ onEdit, onShare }: AssignmentManagementListProps) => {
  const { assignments, loading, error, fetchAssignments, deleteAssignment, deleteMultipleAssignments } = useInteractiveAssignment();
  const { commonTranslate, assignmentTranslate, getPlaceholder } = useTranslations();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);


  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  // Fetch assignments on mount, but only if we don't already have them
  useEffect(() => {
    const loadAssignments = async () => {
      if (assignments.length === 0 && !loading) {
        if (process.env.NODE_ENV === 'development') {
          console.log('AssignmentManagementList: No assignments loaded, fetching...');
        }
        await fetchAssignments();
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('AssignmentManagementList: Assignments already loaded, count:', assignments.length);
        }
      }
    };

    // Only load assignments if component is mounted and we don't have data
    if (isMounted.current) {
      loadAssignments();
    }

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted.current = false;
    };
  }, [assignments.length, loading]); // Removed fetchAssignments from dependencies

  // Filter assignments based on search term, filter type, and status
  // Also filter out template assignments that don't belong to the organization
  const filteredAssignments = assignments.filter(assignment => {
    // First, filter out template assignments that don't belong to an organization
    // These should only be shown in the gallery, not in the management list
    if (assignment.isTemplate === true && !assignment.organizationId) {
      return false;
    }

    // Then apply the user's filters
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType ? assignment.type === filterType : true;
    const matchesStatus = filterStatus ? assignment.status === filterStatus : true;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Clear selected assignments when filters change
  useEffect(() => {
    setSelectedAssignments([]);
    setConfirmBulkDelete(false);
  }, [searchTerm, filterType, filterStatus]);

  // Get unique assignment types and statuses
  const assignmentTypes = [...new Set(assignments.map(a => a.type))];
  const assignmentStatuses = [...new Set(assignments.map(a => a.status))];

  // Handle delete assignment
  const handleDeleteAssignment = async (id: string) => {
    try {
      await deleteAssignment(id);
      setConfirmDelete(null);
      toast.success('Assignment deleted successfully');

      // No need to fetch assignments again since the context already updates the assignments state
      // The deleteAssignment method in the context removes the deleted assignment from the state
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error(`Failed to delete assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle select all assignments
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all filtered assignments
      setSelectedAssignments(filteredAssignments.map(a => a.id));
    } else {
      // Deselect all
      setSelectedAssignments([]);
    }
  };

  // Handle select individual assignment
  const handleSelectAssignment = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedAssignments(prev => [...prev, id]);
    } else {
      setSelectedAssignments(prev => prev.filter(assignmentId => assignmentId !== id));
    }
  };

  // Handle delete selected assignments
  const handleDeleteSelected = async () => {
    if (selectedAssignments.length === 0) return;

    try {
      await deleteMultipleAssignments(selectedAssignments);
      setSelectedAssignments([]);
      setConfirmBulkDelete(false);
    } catch (error) {
      console.error('Error deleting assignments:', error);
      toast.error(`Failed to delete assignments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Loading state
  if (loading && assignments.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error && assignments.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p>Error loading assignments: {error}</p>
        <button
          onClick={() => fetchAssignments()}
          className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 font-bold py-1 px-3 rounded-lg text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
          <h2 className="text-xl md:text-2xl font-bold">{assignmentTranslate('title')}</h2>

          {/* Bulk Actions - Desktop Only (Mobile has its own bulk actions) */}
          {selectedAssignments.length > 0 && (
            <div className="hidden md:flex items-center">
              <span className="mr-2 text-sm text-gray-600">
                {assignmentTranslate('selected', { count: selectedAssignments.length })}
              </span>
              {confirmBulkDelete ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-red-600">
                    {assignmentTranslate('confirmDeleteMultiple', { count: selectedAssignments.length })}
                  </span>
                  <button
                    onClick={handleDeleteSelected}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    {commonTranslate('yes')}
                  </button>
                  <button
                    onClick={() => setConfirmBulkDelete(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm"
                  >
                    {commonTranslate('no')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmBulkDelete(true)}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {assignmentTranslate('deleteSelected')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search and Filter - Mobile Optimized */}
        <div className="space-y-3 md:space-y-0 md:flex md:gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder={getPlaceholder('searchAssignments')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 md:py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-base md:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:flex md:gap-4">
            <div className="md:w-auto">
              <select
                value={filterType || ''}
                onChange={(e) => setFilterType(e.target.value || null)}
                className="w-full px-4 py-3 md:py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-base md:text-sm"
              >
                <option value="">{assignmentTranslate('allTypes')}</option>
                {assignmentTypes.map(type => (
                  <option key={type} value={type}>
                    {assignmentTranslate(type.toLowerCase().replace(/_/g, ''), type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()))}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:w-auto">
              <select
                value={filterStatus || ''}
                onChange={(e) => setFilterStatus(e.target.value || null)}
                className="w-full px-4 py-3 md:py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-base md:text-sm"
              >
                <option value="">{assignmentTranslate('allStatuses')}</option>
                {assignmentStatuses.map(status => (
                  <option key={status} value={status}>
                    {assignmentTranslate(status.toLowerCase(), status.charAt(0) + status.slice(1).toLowerCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Assignment List */}
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">{assignmentTranslate('noAssignments')}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={filteredAssignments.length > 0 && selectedAssignments.length === filteredAssignments.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {commonTranslate('title')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {commonTranslate('type')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {commonTranslate('status')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {assignmentTranslate('dueDate')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {commonTranslate('actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredAssignments.map(assignment => (
                      <motion.tr
                        key={assignment.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`hover:bg-gray-50 ${selectedAssignments.includes(assignment.id) ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              checked={selectedAssignments.includes(assignment.id)}
                              onChange={(e) => handleSelectAssignment(assignment.id, e.target.checked)}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{assignment.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {assignment.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            assignment.status === 'PUBLISHED'
                              ? 'bg-green-100 text-green-800'
                              : assignment.status === 'DRAFT'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {assignment.status.charAt(0) + assignment.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : assignmentTranslate('noDueDate')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {confirmDelete === assignment.id ? (
                            <div className="flex items-center justify-end space-x-2">
                              <span className="text-xs text-red-600">{assignmentTranslate('confirmDelete')}</span>
                              <button
                                onClick={() => handleDeleteAssignment(assignment.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                {commonTranslate('yes')}
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                {commonTranslate('no')}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end space-x-3">
                              <button
                                onClick={() => onEdit(assignment)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title={commonTranslate('edit')}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => onShare(assignment)}
                                className="text-blue-600 hover:text-blue-900"
                                title={commonTranslate('share')}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setConfirmDelete(assignment.id)}
                                className="text-red-600 hover:text-red-900"
                                title={commonTranslate('delete')}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (visible only on mobile) */}
            <div className="md:hidden space-y-4">
              {/* Mobile Bulk Selection Header */}
              {filteredAssignments.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={filteredAssignments.length > 0 && selectedAssignments.length === filteredAssignments.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {selectedAssignments.length > 0
                        ? assignmentTranslate('selected', { count: selectedAssignments.length })
                        : assignmentTranslate('selectAll')
                      }
                    </span>
                  </div>
                  {selectedAssignments.length > 0 && (
                    <button
                      onClick={() => setConfirmBulkDelete(true)}
                      className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {commonTranslate('delete')}
                    </button>
                  )}
                </div>
              )}

              <AnimatePresence>
                {filteredAssignments.map(assignment => (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className={`bg-white rounded-lg shadow-sm border p-4 ${
                      selectedAssignments.includes(assignment.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3 flex-1">
                        <input
                          type="checkbox"
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                          checked={selectedAssignments.includes(assignment.id)}
                          onChange={(e) => handleSelectAssignment(assignment.id, e.target.checked)}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {assignment.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {assignment.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="space-y-3">
                      {/* Type and Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {assignment.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            assignment.status === 'PUBLISHED'
                              ? 'bg-green-100 text-green-800'
                              : assignment.status === 'DRAFT'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {assignment.status.charAt(0) + assignment.status.slice(1).toLowerCase()}
                          </span>
                        </div>
                      </div>

                      {/* Due Date */}
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">{assignmentTranslate('dueDate')}: </span>
                        {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : assignmentTranslate('noDueDate')}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end space-x-1 pt-2 border-t border-gray-100">
                        {confirmDelete === assignment.id ? (
                          <div className="flex items-center space-x-2 w-full justify-center">
                            <span className="text-sm text-red-600 font-medium">{assignmentTranslate('deleteThisAssignment')}</span>
                            <button
                              onClick={() => handleDeleteAssignment(assignment.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                            >
                              {commonTranslate('yes')}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium"
                            >
                              {commonTranslate('no')}
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => onEdit(assignment)}
                              className="flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                              {commonTranslate('edit')}
                            </button>
                            <button
                              onClick={() => onShare(assignment)}
                              className="flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                              </svg>
                              {commonTranslate('share')}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(assignment.id)}
                              className="flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {commonTranslate('delete')}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AssignmentManagementList;
