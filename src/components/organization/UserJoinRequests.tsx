// src/components/organization/UserJoinRequests.tsx
import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { OrganizationJoinRequest } from '../../types/organization';
import { createOrganizationJoinRequestService } from '../../lib/services/organizationJoinRequestService';

const UserJoinRequests: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [joinRequests, setJoinRequests] = useState<OrganizationJoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's join requests
  useEffect(() => {
    const fetchJoinRequests = async () => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        const joinRequestService = createOrganizationJoinRequestService(user);
        const requests = await joinRequestService.getUserJoinRequests();
        setJoinRequests(requests);
      } catch (err) {
        console.error('Error fetching join requests:', err);
        setError('Failed to fetch your join requests');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJoinRequests();
  }, [user]);

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter pending requests
  const pendingRequests = joinRequests.filter(req => req.status === 'PENDING');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  if (pendingRequests.length === 0) {
    return null; // Don't show anything if there are no pending requests
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
      <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
        Pending Organization Requests
      </h3>
      
      <div className="space-y-2">
        {pendingRequests.map(request => (
          <div key={request.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {request.organizationName || 'Organization'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Requested on {formatDate(request.requestedAt)}
              </div>
            </div>
            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-medium">
              Pending
            </span>
          </div>
        ))}
      </div>
      
      <p className="mt-3 text-sm text-yellow-700 dark:text-yellow-300">
        Your request{pendingRequests.length > 1 ? 's are' : ' is'} pending approval from the organization administrator.
      </p>
    </div>
  );
};

export default UserJoinRequests;
