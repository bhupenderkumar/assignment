// src/components/organization/UserJoinRequests.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';
import { useOrganizationJoinRequests } from '../../context/OrganizationJoinRequestContext';
import { format } from 'date-fns';

interface UserJoinRequestsProps {
  showTitle?: boolean;
  showAllRequests?: boolean;
  className?: string;
}

const UserJoinRequests: React.FC<UserJoinRequestsProps> = ({
  showTitle = true,
  showAllRequests = false,
  className = ""
}) => {
  const { config } = useConfiguration();
  const { userJoinRequests, isLoading, error, refreshUserJoinRequests, lastRefreshed } = useOrganizationJoinRequests();
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUserJoinRequests();
    setIsRefreshing(false);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Toggle expanded state for a request
  const toggleRequestExpand = (requestId: string) => {
    if (expandedRequestId === requestId) {
      setExpandedRequestId(null);
    } else {
      setExpandedRequestId(requestId);
    }
  };

  // Get requests to display based on props
  const requestsToDisplay = showAllRequests
    ? userJoinRequests
    : userJoinRequests.filter(req => req.status === 'PENDING');

  // Format last refreshed time
  const getLastRefreshedText = () => {
    if (!lastRefreshed) return 'Never refreshed';

    try {
      return `Last updated ${format(lastRefreshed, 'MMM d, yyyy h:mm a')}`;
    } catch (e) {
      return `Last updated ${lastRefreshed.toLocaleString()}`;
    }
  };

  if (isLoading && requestsToDisplay.length === 0) {
    return (
      <div className={`flex justify-center items-center py-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && requestsToDisplay.length === 0) {
    return (
      <div className={`p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm ${className}`}>
        {error}
        <button
          onClick={handleRefresh}
          className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (requestsToDisplay.length === 0) {
    return null; // Don't show anything if there are no requests to display
  }

  return (
    <div className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 ${className}`}>
      <div className="flex justify-between items-center mb-3">
        {showTitle && (
          <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
            Organization Join Requests
          </h3>
        )}

        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {getLastRefreshedText()}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Refresh join requests"
          >
            <svg
              className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${isRefreshing || isLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {requestsToDisplay.map(request => (
          <motion.div
            key={request.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              onClick={() => toggleRequestExpand(request.id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  {request.organizationLogo ? (
                    <img
                      src={request.organizationLogo}
                      alt={request.organizationName || 'Organization'}
                      className="w-10 h-10 rounded-md object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-md flex items-center justify-center text-white font-bold text-lg"
                      style={{
                        background: `linear-gradient(to bottom right, ${config.primaryColor}, ${config.secondaryColor})`
                      }}
                    >
                      {(request.organizationName || 'O').charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {request.organizationName || 'Organization'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Requested on {formatDate(request.requestedAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    request.status === 'PENDING'
                      ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200'
                      : request.status === 'APPROVED'
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
                      : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                  }`}>
                    {request.status}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedRequestId === request.id ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {expandedRequestId === request.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-3 pb-3"
              >
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <div className="font-medium mb-1">Request Details:</div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
                      {request.requestMessage ? (
                        <p className="text-sm">{request.requestMessage}</p>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">No message provided</p>
                      )}
                    </div>

                    {request.status !== 'PENDING' && (
                      <div className="mt-3">
                        <div className="font-medium mb-1">Response:</div>
                        <div className={`p-2 rounded-md ${
                          request.status === 'APPROVED'
                            ? 'bg-green-50 dark:bg-green-900/20'
                            : 'bg-red-50 dark:bg-red-900/20'
                        }`}>
                          {request.responseMessage ? (
                            <p className="text-sm">{request.responseMessage}</p>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No response message provided</p>
                          )}
                        </div>
                      </div>
                    )}

                    {request.status === 'PENDING' && (
                      <div className="mt-3">
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-yellow-600 bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200">
                                Waiting for approval
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-yellow-200 dark:bg-yellow-900/30">
                            <div style={{ width: "50%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500 dark:bg-yellow-600">
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {requestsToDisplay.some(req => req.status === 'PENDING') && (
        <p className="mt-3 text-sm text-yellow-700 dark:text-yellow-300">
          Your pending request{requestsToDisplay.filter(req => req.status === 'PENDING').length > 1 ? 's are' : ' is'} awaiting approval from the organization administrator.
        </p>
      )}
    </div>
  );
};

export default UserJoinRequests;
