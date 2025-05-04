// src/components/organization/UserManagement.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { Organization, OrganizationRole, UserOrganization } from '../../types/organization';
import { getUsersByIds } from '../../lib/auth/userUtils';
import toast from 'react-hot-toast';

interface UserManagementProps {
  organization: Organization;
  userOrganizations?: UserOrganization[];
}

interface OrganizationUser {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: OrganizationRole;
  avatarUrl?: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ organization, userOrganizations = [] }) => {
  const { supabase, user } = useSupabaseAuth();
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localUserOrganizations, setLocalUserOrganizations] = useState<UserOrganization[]>(userOrganizations);
  const [isLoadingUserOrgs, setIsLoadingUserOrgs] = useState(userOrganizations.length === 0);

  // Fetch user organizations if not provided
  useEffect(() => {
    const fetchUserOrganizations = async () => {
      if (!supabase || userOrganizations.length > 0) return;

      setIsLoadingUserOrgs(true);

      try {
        // Get current user's organization memberships
        const { data, error } = await supabase
          .from('user_organization')
          .select('id, organization_id, user_id, role')
          .eq('organization_id', organization.id)
          .eq('user_id', user?.id);

        if (error) throw error;

        // Map to UserOrganization objects
        const userOrgs = (data || []).map(row => ({
          id: row.id,
          organizationId: row.organization_id,
          userId: row.user_id,
          role: row.role as OrganizationRole
        }));

        setLocalUserOrganizations(userOrgs);
      } catch (err) {
        console.error('Error fetching user organizations:', err);
        toast.error('Failed to load user permissions');
      } finally {
        setIsLoadingUserOrgs(false);
      }
    };

    fetchUserOrganizations();
  }, [supabase, organization.id, user?.id, userOrganizations.length]);

  // Current user's role in this organization
  const currentUserRole = localUserOrganizations.find(
    uo => uo.userId === user?.id && uo.organizationId === organization.id
  )?.role || 'member';

  // Check if current user is owner or admin
  const canManageUsers = currentUserRole === 'owner' || currentUserRole === 'admin';

  // Fetch organization users
  useEffect(() => {
    const fetchOrganizationUsers = async () => {
      if (!supabase) return;

      setIsLoading(true);
      setError(null);

      try {
        // Get user_organization records for this organization
        const { data: userOrgs, error: userOrgsError } = await supabase
          .from('user_organization')
          .select('id, user_id, role')
          .eq('organization_id', organization.id);

        if (userOrgsError) throw userOrgsError;

        if (!userOrgs || userOrgs.length === 0) {
          setUsers([]);
          return;
        }

        // Get user details for each user
        const userIds = userOrgs.map(uo => uo.user_id);

        // Get user details using our utility function
        const users = await getUsersByIds(supabase, userIds);

        // Convert the users to the format we need
        const userData = users.map(user => ({
          id: user.id,
          email: user.email || `User ${user.id.substring(0, 8)}`,
          raw_user_meta_data: user.user_metadata || { name: `User ${user.id.substring(0, 8)}` }
        }));

        // If we couldn't get any user details, use fallback
        if (!userData || userData.length === 0) {
          console.warn('Failed to get user details, using fallback');

          // Fallback: Just show user IDs if we can't get user details
          const fallbackUsers = userOrgs.map(uo => ({
            id: uo.id,
            userId: uo.user_id,
            email: 'User ' + uo.user_id.substring(0, 8),
            name: 'User ' + uo.user_id.substring(0, 8),
            role: uo.role as OrganizationRole
          }));

          setUsers(fallbackUsers);
          return;
        }

        // Map user data to OrganizationUser objects
        const organizationUsers = userOrgs.map(uo => {
          const user = userData?.find(u => u.id === uo.user_id);
          return {
            id: uo.id,
            userId: uo.user_id,
            email: user?.email || 'Unknown',
            name: user?.raw_user_meta_data?.name || user?.email || 'Unknown',
            role: uo.role as OrganizationRole,
            avatarUrl: user?.raw_user_meta_data?.avatar_url
          };
        });

        setUsers(organizationUsers);
      } catch (err) {
        console.error('Error fetching organization users:', err);
        setError('Failed to load organization users');
        toast.error('Failed to load organization users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizationUsers();
  }, [supabase, organization.id]);

  // Update user role
  const updateUserRole = async (userId: string, newRole: OrganizationRole) => {
    if (!supabase || !canManageUsers) return;

    try {
      // Find the user_organization record
      const userOrg = users.find(u => u.userId === userId);
      if (!userOrg) return;

      // Update the role
      const { error } = await supabase
        .from('user_organization')
        .update({ role: newRole })
        .eq('id', userOrg.id);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(u =>
        u.userId === userId ? { ...u, role: newRole } : u
      ));

      toast.success(`User role updated to ${newRole}`);
    } catch (err) {
      console.error('Error updating user role:', err);
      toast.error('Failed to update user role');
    }
  };

  // Remove user from organization
  const removeUser = async (userId: string) => {
    if (!supabase || !canManageUsers) return;

    try {
      // Find the user_organization record
      const userOrg = users.find(u => u.userId === userId);
      if (!userOrg) return;

      // Check if trying to remove an owner
      if (userOrg.role === 'owner') {
        // Count owners
        const ownerCount = users.filter(u => u.role === 'owner').length;
        if (ownerCount <= 1) {
          toast.error('Cannot remove the only owner of the organization');
          return;
        }
      }

      // Delete the user_organization record
      const { error } = await supabase
        .from('user_organization')
        .delete()
        .eq('id', userOrg.id);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.filter(u => u.userId !== userId));

      toast.success('User removed from organization');
    } catch (err) {
      console.error('Error removing user:', err);
      toast.error('Failed to remove user from organization');
    }
  };

  // Render loading state for either user orgs or users
  if (isLoading || isLoadingUserOrgs) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Organization Members
        </h3>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Organization Members
      </h3>

      {users.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No users found in this organization.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                {canManageUsers && (
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatarUrl ? (
                          <img className="h-10 w-10 rounded-full" src={user.avatarUrl} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {canManageUsers && user.role !== 'owner' ? (
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.userId, e.target.value as OrganizationRole)}
                        className="text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                    ) : (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'owner'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : user.role === 'admin'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  {canManageUsers && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {user.role !== 'owner' && (
                        <button
                          onClick={() => removeUser(user.userId)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
