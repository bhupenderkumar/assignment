// src/components/organization/OrganizationJoinRequests.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { OrganizationJoinRequest, OrganizationJoinRequestStatus } from '../../types/organization';
import { createOrganizationJoinRequestService } from '../../lib/services/organizationJoinRequestService';
import { getSupabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface OrganizationJoinRequestsProps {
  organizationId?: string; // If not provided, uses current organization
  onRequestStatusChange?: () => void; // Callback when a request status changes
}

const OrganizationJoinRequests: React.FC<OrganizationJoinRequestsProps> = ({ organizationId, onRequestStatusChange }) => {
  const { user } = useSupabaseAuth();
  const { currentOrganization } = useOrganization();
  const [joinRequests, setJoinRequests] = useState<OrganizationJoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrganizationJoinRequestStatus | 'ALL'>('PENDING');
  const [responseMessage, setResponseMessage] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Get the organization ID to use
  const targetOrgId = organizationId || currentOrganization?.id;

  // Fetch join requests
  const fetchJoinRequests = async () => {
    if (!targetOrgId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try using the service first
      try {
        const joinRequestService = createOrganizationJoinRequestService(user);
        let requests: OrganizationJoinRequest[];

        if (selectedStatus === 'ALL') {
          requests = await joinRequestService.getOrganizationJoinRequests(targetOrgId);
        } else {
          requests = await joinRequestService.getOrganizationJoinRequests(targetOrgId, selectedStatus);
        }

        // Sort requests by date (newest first) and status (pending first)
        requests.sort((a, b) => {
          // First sort by status (PENDING first)
          if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
          if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;

          // Then sort by date (newest first)
          return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
        });

        setJoinRequests(requests);
      } catch (serviceErr) {
        // If the service fails, try a direct query as fallback
        console.error('Error using join request service:', serviceErr);

        // Get Supabase instance
        const supabase = await getSupabase();

        // Build the query based on the selected status
        let query = supabase
          .from('organization_join_request')
          .select('*')
          .eq('organization_id', targetOrgId);

        // Add status filter if not ALL
        if (selectedStatus !== 'ALL') {
          query = query.eq('status', selectedStatus);
        }

        // Execute the query
        const { data, error } = await query;

        if (error) throw error;

        // If no data, return empty array
        if (!data || data.length === 0) {
          setJoinRequests([]);
          return;
        }

        // Get unique user IDs from the join requests
        const userIds = [...new Set(data.map(row => row.user_id))];

        // Fetch user data separately
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, raw_user_meta_data')
          .in('id', userIds);

        if (userError) {
          console.warn('Error fetching user data:', userError);
          // Continue without user data
        }

        // Create a map of user data for quick lookup
        const userMap = new Map();
        if (userData) {
          userData.forEach(user => {
            userMap.set(user.id, user);
          });
        }

        // Map the data to OrganizationJoinRequest objects
        const requests = (data || []).map(row => {
          const user = userMap.get(row.user_id);
          return {
            id: row.id,
            userId: row.user_id,
            organizationId: row.organization_id,
            userName: user?.raw_user_meta_data?.name || user?.email || 'Unknown User',
            userEmail: user?.email || 'Unknown Email',
            requestMessage: row.request_message,
            responseMessage: row.response_message,
            status: row.status as OrganizationJoinRequestStatus,
            requestedAt: new Date(row.created_at || row.requested_at),
            updatedAt: new Date(row.updated_at)
          };
        });

        // Sort requests
        requests.sort((a, b) => {
          if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
          if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
          return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
        });

        setJoinRequests(requests);
      }
    } catch (err) {
      console.error('Error fetching join requests:', err);
      setError('Failed to fetch join requests');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch join requests when component mounts or status filter changes
  useEffect(() => {
    if (targetOrgId) {
      fetchJoinRequests();
    }
  }, [targetOrgId, selectedStatus]);

  // Handle responding to a join request
  const handleRespond = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    setIsResponding(true);
    setError(null);

    try {
      // Try using the service first
      try {
        const joinRequestService = createOrganizationJoinRequestService(user);
        await joinRequestService.respondToJoinRequest(
          requestId,
          status,
          responseMessage.trim() || undefined
        );
      } catch (serviceErr) {
        // If the service fails, try a direct update as fallback
        console.error('Error using join request service for response:', serviceErr);

        // Get Supabase instance
        const supabase = await getSupabase();

        // Update the request status
        const { error: updateError } = await supabase
          .from('organization_join_request')
          .update({
            status: status,
            response_message: responseMessage.trim() || null,
            responded_at: new Date().toISOString(),
            responded_by: user?.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (updateError) throw updateError;

        // If approved, add the user to the organization
        if (status === 'APPROVED') {
          // First get the join request to get the user_id and organization_id
          const { data: joinRequest, error: getError } = await supabase
            .from('organization_join_request')
            .select('user_id, organization_id')
            .eq('id', requestId)
            .single();

          if (getError) {
            console.error('Error getting join request details:', getError);
          } else if (joinRequest) {
            // Add the user to the organization
            const { error: addUserError } = await supabase
              .from('user_organization')
              .insert({
                user_id: joinRequest.user_id,
                organization_id: joinRequest.organization_id,
                role: 'member'
              });

            if (addUserError) {
              console.error('Error adding user to organization:', addUserError);
              // Continue anyway - the request was approved successfully
            }
          }
        }
      }

      // Refresh the list
      fetchJoinRequests();

      // Reset state
      setResponseMessage('');
      setSelectedRequestId(null);

      // Notify parent component
      if (onRequestStatusChange) {
        onRequestStatusChange();
      }

      // Show success message
      toast.success(`Request ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully`);
    } catch (err) {
      console.error('Error responding to join request:', err);
      setError('Failed to respond to join request');
    } finally {
      setIsResponding(false);
    }
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

  if (!targetOrgId) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg">
        No organization selected. Please select an organization to view join requests.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Organization Join Requests
          </h2>

          <div className="flex space-x-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as OrganizationJoinRequestStatus | 'ALL')}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="ALL">All Requests</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <button
              onClick={() => fetchJoinRequests()}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg text-sm transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : joinRequests.length === 0 ? (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-300 rounded-lg text-center">
            No {selectedStatus === 'ALL' ? '' : selectedStatus.toLowerCase()} join requests found.
          </div>
        ) : (
          <div className="space-y-4">
            {joinRequests.map((request) => (
              <div
                key={request.id}
                className={`p-4 border rounded-lg ${
                  request.status === 'PENDING'
                    ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
                    : request.status === 'APPROVED'
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                    : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-lg">
                      {request.userName?.charAt(0) || request.userEmail?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {request.userName || request.userEmail || 'Unknown User'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Requested: {formatDate(request.requestedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'PENDING'
                          ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200'
                          : request.status === 'APPROVED'
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                </div>

                {request.requestMessage && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                    <div className="font-medium mb-1">Message:</div>
                    {request.requestMessage}
                  </div>
                )}

                {request.responseMessage && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                    <div className="font-medium mb-1">Response:</div>
                    {request.responseMessage}
                  </div>
                )}

                {request.status === 'PENDING' && (
                  <div className="mt-3 flex space-x-2">
                    {selectedRequestId === request.id ? (
                      <div className="w-full">
                        <textarea
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                          className="w-full px-3 py-2 mb-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="Optional response message"
                          rows={2}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedRequestId(null);
                              setResponseMessage('');
                            }}
                            className="flex-1 py-1.5 px-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm rounded-md font-medium transition-colors"
                            disabled={isResponding}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleRespond(request.id, 'APPROVED')}
                            className="flex-1 py-1.5 px-3 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md font-medium transition-colors"
                            disabled={isResponding}
                          >
                            {isResponding ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleRespond(request.id, 'REJECTED')}
                            className="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md font-medium transition-colors"
                            disabled={isResponding}
                          >
                            {isResponding ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setSelectedRequestId(request.id)}
                          className="flex-1 py-1.5 px-3 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md font-medium transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setSelectedRequestId(request.id)}
                          className="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md font-medium transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationJoinRequests;
