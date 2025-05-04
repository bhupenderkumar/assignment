// src/pages/OrganizationManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useOrganization } from '../context/OrganizationContext';
import { Organization, UserOrganization, OrganizationRole } from '../types/organization';
import UserManagement from '../components/organization/UserManagement';
import OrganizationInvite from '../components/organization/OrganizationInvite';
import OrganizationAnalytics from '../components/organization/OrganizationAnalytics';
import OrganizationBranding from '../components/organization/OrganizationBranding';
import toast from 'react-hot-toast';

const OrganizationManagementPage: React.FC = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { supabase, user } = useSupabaseAuth();
  const { organizations, currentOrganization, setCurrentOrganization } = useOrganization();
  const [activeTab, setActiveTab] = useState<'users' | 'invites' | 'analytics' | 'branding'>('users');
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<UserOrganization[]>([]);
  const [isLoadingUserOrgs, setIsLoadingUserOrgs] = useState<boolean>(true);
  const navigate = useNavigate();

  // Set the organization based on the URL parameter or current organization
  useEffect(() => {
    console.log('OrganizationManagementPage: Effect triggered with:', {
      organizationId,
      organizationsCount: organizations.length,
      currentOrganization: currentOrganization?.name,
      isLoading: isLoadingUserOrgs,
      userOrganizationsCount: userOrganizations.length
    });

    // Don't do anything if we're still loading
    if (isLoadingUserOrgs) {
      console.log('OrganizationManagementPage: Still loading user organizations, skipping navigation');
      return;
    }

    // Check if user has any organization memberships
    if (userOrganizations.length === 0) {
      console.log('OrganizationManagementPage: User has no organization memberships');
      // Show message and redirect to home after a delay
      toast.error('You are not a member of any organizations');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
      return;
    }

    // Get the IDs of organizations the user is a member of
    const userOrgIds = userOrganizations.map(uo => uo.organizationId);
    console.log('OrganizationManagementPage: User is a member of organizations:', userOrgIds);

    // If we have an organization ID in the URL
    if (organizationId) {
      console.log('OrganizationManagementPage: URL has organization ID:', organizationId);

      // Check if user is a member of this organization
      if (!userOrgIds.includes(organizationId)) {
        console.log('OrganizationManagementPage: User is not a member of this organization');
        toast.error('You are not a member of this organization');

        // Redirect to the first organization the user is a member of
        if (userOrgIds.length > 0) {
          const firstOrgId = userOrgIds[0];
          console.log('OrganizationManagementPage: Redirecting to first organization user is a member of:', firstOrgId);
          navigate(`/organizations/${firstOrgId}`, { replace: true });
        } else {
          // This shouldn't happen due to the check above, but just in case
          navigate('/', { replace: true });
        }
        return;
      }

      const org = organizations.find(o => o.id === organizationId);

      if (org) {
        console.log('OrganizationManagementPage: Found organization in list:', org.name);
        setOrganization(org);

        // If this is not the current organization, update it
        if (currentOrganization?.id !== org.id) {
          console.log('OrganizationManagementPage: Updating current organization to:', org.name);
          setCurrentOrganization(org);
        }
      } else if (userOrgIds.length > 0) {
        // Organization not found but user has other organizations
        console.log('OrganizationManagementPage: Organization ID not found, redirecting to first available');
        navigate(`/organizations/${userOrgIds[0]}`, { replace: true });
      } else {
        // No organizations available
        console.log('OrganizationManagementPage: No organizations available, redirecting to home');
        navigate('/', { replace: true });
      }
    } else if (currentOrganization && userOrgIds.includes(currentOrganization.id)) {
      // No organization ID in URL, use current organization if user is a member
      console.log('OrganizationManagementPage: No organization ID in URL, using current:', currentOrganization.name);
      navigate(`/organizations/${currentOrganization.id}`, { replace: true });
    } else if (userOrgIds.length > 0) {
      // No current organization or user is not a member, use first available
      console.log('OrganizationManagementPage: No current organization, using first available');
      navigate(`/organizations/${userOrgIds[0]}`, { replace: true });
    } else {
      // No organizations available, redirect to home
      console.log('OrganizationManagementPage: No organizations available, redirecting to home');
      navigate('/', { replace: true });
    }
  }, [organizationId, organizations, currentOrganization, navigate, isLoadingUserOrgs, setCurrentOrganization, userOrganizations]);

  // Fetch user organization roles
  useEffect(() => {
    const fetchUserOrganizations = async () => {
      if (!supabase || !user) {
        setIsLoadingUserOrgs(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_organization')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user organizations:', error);
          toast.error('Failed to load user organization roles');
          setUserOrganizations([]);
        } else {
          // Map the data to UserOrganization objects
          const userOrgs = (data || []).map(item => ({
            id: item.id,
            userId: item.user_id,
            organizationId: item.organization_id,
            role: item.role as OrganizationRole,
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at)
          }));
          setUserOrganizations(userOrgs);
        }
      } catch (err) {
        console.error('Error in fetchUserOrganizations:', err);
        setUserOrganizations([]);
      } finally {
        setIsLoadingUserOrgs(false);
      }
    };

    fetchUserOrganizations();
  }, [supabase, user]);

  // Check if user has permission to access this page
  const userRole = userOrganizations.find(
    uo => uo.organizationId === (organization?.id || '')
  )?.role;

  const canAccessManagement = userRole === 'owner' || userRole === 'admin';

  // Handle organization switch
  const handleOrganizationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const orgId = e.target.value;
    const org = organizations.find(o => o.id === orgId);

    if (org) {
      console.log('OrganizationManagementPage: Switching organization from dropdown:', org.name, org.id);

      // Update the current organization in context
      if (org.id !== currentOrganization?.id) {
        console.log('OrganizationManagementPage: Different organization selected, updating context');
        setCurrentOrganization(org);

        // Navigate to the organization page with replace to avoid adding to history stack
        navigate(`/organizations/${org.id}`, { replace: true });
      } else {
        console.log('OrganizationManagementPage: Same organization selected, no changes needed');
      }
    }
  };

  // Handle organization update
  const handleOrganizationUpdate = (updatedOrg: Organization) => {
    setOrganization(updatedOrg);

    // Update in the global context if this is the current organization
    if (currentOrganization?.id === updatedOrg.id) {
      setCurrentOrganization(updatedOrg);
    }
  };

  // Show loading state while fetching user organizations
  if (isLoadingUserOrgs) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Organization Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Loading organization details...
          </p>
        </div>
      </div>
    );
  }

  // If no organization is selected, show appropriate message
  if (!organization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Organization Management
          </h1>
          {userOrganizations.length === 0 ? (
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You are not a member of any organizations. You need to be invited to an organization or create your own.
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Return to Home
              </button>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              {organizations.length === 0
                ? 'Loading your organizations...'
                : 'Loading organization details...'}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!canAccessManagement) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Organization Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to manage this organization.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Organization Management
          </h1>

          {/* Organization selector */}
          {organizations.length > 1 && (
            <div className="mt-4 md:mt-0">
              <select
                value={organization.id}
                onChange={handleOrganizationChange}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('invites')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'invites'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Invitations
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'branding'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Branding
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'users' && (
            <UserManagement
              organization={organization}
              userOrganizations={userOrganizations}
            />
          )}
          {activeTab === 'invites' && (
            <OrganizationInvite
              organization={organization}
              userOrganizations={userOrganizations}
            />
          )}
          {activeTab === 'analytics' && <OrganizationAnalytics organization={organization} />}
          {activeTab === 'branding' && (
            <OrganizationBranding
              organization={organization}
              onUpdate={handleOrganizationUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationManagementPage;
