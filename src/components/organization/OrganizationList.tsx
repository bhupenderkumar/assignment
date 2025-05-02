// src/components/organization/OrganizationList.tsx
import React, { useState } from 'react';
import { Organization } from '../../types/organization';
import { useOrganization } from '../../context/OrganizationContext';
import { motion, AnimatePresence } from 'framer-motion';
import OrganizationForm from './OrganizationForm';
import toast from 'react-hot-toast';
import { useConfiguration } from '../../context/ConfigurationContext';

const OrganizationList: React.FC = () => {
  const { 
    organizations, 
    currentOrganization, 
    setCurrentOrganization, 
    isLoading, 
    error, 
    createOrganization, 
    updateOrganization, 
    deleteOrganization 
  } = useOrganization();
  
  const { config } = useConfiguration();
  
  // UI state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  // Handle create organization
  const handleCreateSubmit = async (data: any) => {
    try {
      await createOrganization(data);
      setShowCreateForm(false);
      toast.success('Organization created successfully');
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Failed to create organization');
    }
  };
  
  // Handle update organization
  const handleUpdateSubmit = async (data: any) => {
    if (!editingOrganization) return;
    
    try {
      await updateOrganization(editingOrganization.id, data);
      setEditingOrganization(null);
      toast.success('Organization updated successfully');
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error('Failed to update organization');
    }
  };
  
  // Handle delete organization
  const handleDelete = async (id: string) => {
    try {
      await deleteOrganization(id);
      setConfirmDelete(null);
      toast.success('Organization deleted successfully');
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error('Failed to delete organization');
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold">Error</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Your Organizations
        </h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Create New Organization
        </button>
      </div>
      
      {/* Create Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <OrganizationForm
              onSubmit={handleCreateSubmit}
              onCancel={() => setShowCreateForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Edit Form */}
      <AnimatePresence>
        {editingOrganization && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <OrganizationForm
              initialData={editingOrganization}
              onSubmit={handleUpdateSubmit}
              onCancel={() => setEditingOrganization(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Organizations List */}
      {organizations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No organizations yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating a new organization.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create Organization
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-2 ${
                currentOrganization?.id === org.id
                  ? 'border-blue-500'
                  : 'border-transparent'
              }`}
            >
              <div className="p-4">
                <div className="flex items-center mb-4">
                  {org.logoUrl ? (
                    <img
                      src={org.logoUrl}
                      alt={org.name}
                      className="w-12 h-12 object-contain rounded-md mr-3"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-md mr-3 flex items-center justify-center text-white"
                      style={{ backgroundColor: org.primaryColor || config.primaryColor }}
                    >
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {org.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {org.type}
                    </p>
                  </div>
                </div>
                
                {org.headerText && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 italic">
                    "{org.headerText}"
                  </p>
                )}
                
                <div className="flex space-x-2 mb-4">
                  {org.primaryColor && (
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-1"
                        style={{ backgroundColor: org.primaryColor }}
                      ></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Primary
                      </span>
                    </div>
                  )}
                  {org.secondaryColor && (
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-1"
                        style={{ backgroundColor: org.secondaryColor }}
                      ></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Secondary
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setCurrentOrganization(org)}
                    className={`px-3 py-1 rounded text-sm ${
                      currentOrganization?.id === org.id
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900'
                    }`}
                  >
                    {currentOrganization?.id === org.id ? 'Current' : 'Select'}
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingOrganization(org)}
                      className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                      title="Edit"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => setConfirmDelete(org.id)}
                      className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                      title="Delete"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Confirm Deletion
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete this organization? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrganizationList;
