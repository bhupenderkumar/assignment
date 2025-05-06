// src/pages/OrganizationRequestsPage.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { useConfiguration } from '../context/ConfigurationContext';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import UserJoinRequests from '../components/organization/UserJoinRequests';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const OrganizationRequestsPage: React.FC = () => {
  const { config } = useConfiguration();
  const { isAuthenticated } = useSupabaseAuth();

  return (
    <>
      <Helmet>
        <title>{`Organization Requests | ${config?.companyName || 'Interactive Assignments'}`}</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2" style={{ color: config.primaryColor }}>
              Organization Requests
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              View and manage your organization join requests
            </p>
          </div>

          {isAuthenticated ? (
            <div className="space-y-6">
              <UserJoinRequests
                showTitle={false}
                showAllRequests={true}
                className="mb-6"
              />

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">About Organization Requests</h2>
                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                  <p>
                    When you request to join an organization, administrators of that organization will review your request.
                    You'll be notified once your request is approved or rejected.
                  </p>
                  <p>
                    If your request is approved, you'll gain access to the organization's content and assignments.
                    If rejected, you can contact the organization administrators for more information.
                  </p>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Request Status Types</h3>
                    <ul className="list-disc list-inside space-y-2">
                      <li className="flex items-center">
                        <span className="inline-block w-16 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-medium mr-2 text-center">
                          PENDING
                        </span>
                        <span>Your request is waiting for administrator review</span>
                      </li>
                      <li className="flex items-center">
                        <span className="inline-block w-16 px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 rounded-full text-xs font-medium mr-2 text-center">
                          APPROVED
                        </span>
                        <span>Your request has been approved and you are now a member</span>
                      </li>
                      <li className="flex items-center">
                        <span className="inline-block w-16 px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 rounded-full text-xs font-medium mr-2 text-center">
                          REJECTED
                        </span>
                        <span>Your request has been rejected by the organization</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
              <h2 className="text-xl font-semibold mb-4">Please Sign In</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You need to be signed in to view your organization requests.
              </p>
              <Link
                to="/sign-in"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                style={{ backgroundColor: config.primaryColor }}
              >
                Sign In
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default OrganizationRequestsPage;
