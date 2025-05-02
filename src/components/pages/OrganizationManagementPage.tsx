// src/components/pages/OrganizationManagementPage.tsx
import React from 'react';
import { motion } from 'framer-motion';
import OrganizationList from '../organization/OrganizationList';
import { useOrganization } from '../../context/OrganizationContext';

const OrganizationManagementPage: React.FC = () => {
  const { currentOrganization } = useOrganization();
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto py-8 px-4"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Organization Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Create and manage your organizations. The selected organization will be used for branding your assignments and certificates.
        </p>
      </div>
      
      {currentOrganization && (
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
            Current Organization
          </h2>
          <div className="flex items-center">
            {currentOrganization.logoUrl ? (
              <img
                src={currentOrganization.logoUrl}
                alt={currentOrganization.name}
                className="w-10 h-10 object-contain rounded-md mr-3"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-md mr-3 flex items-center justify-center text-white"
                style={{ backgroundColor: currentOrganization.primaryColor || '#0891b2' }}
              >
                {currentOrganization.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {currentOrganization.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {currentOrganization.headerText || 'No tagline set'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <OrganizationList />
    </motion.div>
  );
};

export default OrganizationManagementPage;
