// src/lib/services/organizationJoinRequestService.ts
import { SupabaseClient, User } from '@supabase/supabase-js';
import { OrganizationJoinRequest, OrganizationJoinRequestStatus } from '../../types/organization';
import { getSupabaseClient } from './supabaseService';
import toast from 'react-hot-toast';

/**
 * Map a database row to an OrganizationJoinRequest object
 * @param row Database row
 * @returns OrganizationJoinRequest object
 */
const mapRowToJoinRequest = (row: any): OrganizationJoinRequest => {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    status: row.status,
    requestMessage: row.request_message,
    responseMessage: row.response_message,
    requestedAt: new Date(row.requested_at || row.created_at), // Use created_at as fallback
    respondedAt: row.responded_at ? new Date(row.responded_at) : undefined,
    respondedBy: row.responded_by,
    organizationName: row.organization_name,
    organizationLogo: row.organization_logo,
    userName: row.user_name,
    userEmail: row.user_email
  };
};

/**
 * Create a factory function that returns the organization join request service
 * @param user Current user (optional)
 * @returns Organization join request service
 */
export const createOrganizationJoinRequestService = (user: User | null = null) => {
  // Get the Supabase client
  let supabasePromise: Promise<SupabaseClient> | null = null;

  const getClient = async (): Promise<SupabaseClient> => {
    if (!supabasePromise) {
      supabasePromise = getSupabaseClient(user);
    }
    return supabasePromise;
  };

  return {
    /**
     * Get the Supabase client
     * @returns Promise that resolves to a Supabase client
     */
    getClient,

    /**
     * Create a new join request
     * @param organizationId Organization ID
     * @param requestMessage Optional message from the user
     * @returns Promise that resolves to the created join request
     */
    async createJoinRequest(
      organizationId: string,
      requestMessage?: string
    ): Promise<OrganizationJoinRequest> {
      try {
        const supabase = await getClient();

        // Get the current user ID
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) throw new Error('User not authenticated');

        // Check if there's already a pending request
        const { data: existingRequests, error: checkError } = await supabase
          .from('organization_join_request')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('user_id', currentUser.id)
          .eq('status', 'PENDING');

        if (checkError) throw checkError;

        // If there's already a pending request, return it
        if (existingRequests && existingRequests.length > 0) {
          toast.info('You already have a pending request to join this organization');
          return mapRowToJoinRequest(existingRequests[0]);
        }

        // Create a new join request
        const { data, error } = await supabase
          .from('organization_join_request')
          .insert({
            organization_id: organizationId,
            user_id: currentUser.id,
            request_message: requestMessage,
            status: 'PENDING'
          })
          .select(`
            *,
            organization:organization_id (
              name,
              logo_url
            )
          `)
          .single();

        if (error) throw error;

        // Format the response
        const joinRequest = mapRowToJoinRequest({
          ...data,
          organization_name: data.organization?.name,
          organization_logo: data.organization?.logo_url
        });

        toast.success('Join request submitted successfully');
        return joinRequest;
      } catch (error) {
        console.error('Error creating join request:', error);
        toast.error('Failed to submit join request');
        throw error;
      }
    },

    /**
     * Get join requests for an organization
     * @param organizationId Organization ID
     * @param status Optional status filter
     * @returns Promise that resolves to an array of join requests
     */
    async getOrganizationJoinRequests(
      organizationId: string,
      status?: OrganizationJoinRequestStatus
    ): Promise<OrganizationJoinRequest[]> {
      try {
        const supabase = await getClient();

        // First, get the join requests without trying to join with users
        let query = supabase
          .from('organization_join_request')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false });

        // Add status filter if provided
        if (status) {
          query = query.eq('status', status);
        }

        // Execute the query
        const { data, error } = await query;

        if (error) throw error;

        // If no data, return empty array
        if (!data || data.length === 0) {
          return [];
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

        // Format the response
        return (data || []).map(row => {
          const user = userMap.get(row.user_id);
          return mapRowToJoinRequest({
            ...row,
            user_email: user?.email || 'Unknown Email',
            user_name: user?.raw_user_meta_data?.name || user?.email || 'Unknown User'
          });
        });
      } catch (error) {
        console.error('Error getting organization join requests:', error);
        toast.error('Failed to get join requests');
        throw error;
      }
    },

    /**
     * Get join requests for a user
     * @param userId User ID (defaults to current user)
     * @param status Optional status filter
     * @returns Promise that resolves to an array of join requests
     */
    async getUserJoinRequests(
      userId?: string,
      status?: OrganizationJoinRequestStatus
    ): Promise<OrganizationJoinRequest[]> {
      try {
        const supabase = await getClient();

        // Get the current user ID if not provided
        let targetUserId = userId;
        if (!targetUserId) {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (!currentUser) throw new Error('User not authenticated');
          targetUserId = currentUser.id;
        }

        // Build the query
        let query = supabase
          .from('organization_join_request')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        // Add status filter if provided
        if (status) {
          query = query.eq('status', status);
        }

        // Execute the query
        const { data, error } = await query;

        if (error) throw error;

        // If no data, return empty array
        if (!data || data.length === 0) {
          return [];
        }

        // Get unique organization IDs from the join requests
        const orgIds = [...new Set(data.map(row => row.organization_id))];

        // Fetch organization data separately
        const { data: orgData, error: orgError } = await supabase
          .from('organization')
          .select('id, name, logo_url')
          .in('id', orgIds);

        if (orgError) {
          console.warn('Error fetching organization data:', orgError);
          // Continue without organization data
        }

        // Create a map of organization data for quick lookup
        const orgMap = new Map();
        if (orgData) {
          orgData.forEach(org => {
            orgMap.set(org.id, org);
          });
        }

        // Format the response
        return (data || []).map(row => {
          const org = orgMap.get(row.organization_id);
          return mapRowToJoinRequest({
            ...row,
            organization_name: org?.name || 'Unknown Organization',
            organization_logo: org?.logo_url
          });
        });
      } catch (error) {
        console.error('Error getting user join requests:', error);
        toast.error('Failed to get join requests');
        throw error;
      }
    },

    /**
     * Respond to a join request
     * @param requestId Join request ID
     * @param status New status (APPROVED or REJECTED)
     * @param responseMessage Optional response message
     * @returns Promise that resolves to the updated join request
     */
    async respondToJoinRequest(
      requestId: string,
      status: 'APPROVED' | 'REJECTED',
      responseMessage?: string
    ): Promise<OrganizationJoinRequest> {
      try {
        const supabase = await getClient();

        // Get the current user ID
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) throw new Error('User not authenticated');

        // First, get the join request to check the organization
        const { data: joinRequest, error: getError } = await supabase
          .from('organization_join_request')
          .select('*')
          .eq('id', requestId)
          .single();

        if (getError) throw getError;
        if (!joinRequest) throw new Error('Join request not found');

        // Check if the user is an admin of the organization
        const { data: userOrgs, error: userOrgsError } = await supabase
          .from('user_organization')
          .select('role')
          .eq('organization_id', joinRequest.organization_id)
          .eq('user_id', currentUser.id);

        if (userOrgsError) throw userOrgsError;

        const isAdmin = userOrgs?.some(uo => ['owner', 'admin'].includes(uo.role));
        if (!isAdmin) {
          throw new Error('You do not have permission to respond to this join request');
        }

        // Update the join request
        const { data, error } = await supabase
          .from('organization_join_request')
          .update({
            status,
            response_message: responseMessage,
            responded_at: new Date().toISOString(),
            responded_by: currentUser.id
          })
          .eq('id', requestId)
          .select()
          .single();

        if (error) throw error;

        // If approved, add the user to the organization
        if (status === 'APPROVED') {
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

        toast.success(`Join request ${status.toLowerCase()}`);
        return mapRowToJoinRequest(data);
      } catch (error) {
        console.error('Error responding to join request:', error);
        toast.error('Failed to respond to join request');
        throw error;
      }
    },

    /**
     * Check if a user has a pending join request for an organization
     * @param organizationId Organization ID
     * @param userId User ID (defaults to current user)
     * @returns Promise that resolves to the join request if found, null otherwise
     */
    async checkPendingJoinRequest(
      organizationId: string,
      userId?: string
    ): Promise<OrganizationJoinRequest | null> {
      try {
        const supabase = await getClient();

        // Get the current user ID if not provided
        let targetUserId = userId;
        if (!targetUserId) {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (!currentUser) throw new Error('User not authenticated');
          targetUserId = currentUser.id;
        }

        // Check for pending requests
        const { data, error } = await supabase
          .from('organization_join_request')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('user_id', targetUserId)
          .eq('status', 'PENDING')
          .maybeSingle();

        if (error) throw error;

        // Return null if no request found
        if (!data) return null;

        // Get organization data
        const { data: orgData, error: orgError } = await supabase
          .from('organization')
          .select('name, logo_url')
          .eq('id', organizationId)
          .single();

        if (orgError) {
          console.warn('Error fetching organization data:', orgError);
          // Continue without organization data
        }

        // Format the response
        return mapRowToJoinRequest({
          ...data,
          organization_name: orgData?.name || 'Unknown Organization',
          organization_logo: orgData?.logo_url
        });
      } catch (error) {
        console.error('Error checking pending join request:', error);
        // Don't show toast for this method as it's used for checking
        throw error;
      }
    }
  };
};
