// src/pages/OrganizationManagementPage.tsx
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useOrganization } from '../context/OrganizationContext';
import { Organization, UserOrganization, OrganizationRole } from '../types/organization';
import UserManagement from '../components/organization/UserManagement';
import OrganizationInvite from '../components/organization/OrganizationInvite';
import OrganizationAnalytics from '../components/organization/OrganizationAnalytics';
import OrganizationBranding from '../components/organization/OrganizationBranding';
import toast from 'react-hot-toast';

// Lazy load payment settings component
const OrganizationPaymentSettings = lazy(() => import('../components/organization/OrganizationPaymentSettings'));

const OrganizationManagementPage: React.FC = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { supabase, user } = useSupabaseAuth();
  const { organizations, currentOrganization, setCurrentOrganization } = useOrganization();
  const [activeTab, setActiveTab] = useState<'users' | 'invites' | 'analytics' | 'branding' | 'payments'>('users');
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<UserOrganization[]>([]);
  const [isLoadingUserOrgs, setIsLoadingUserOrgs] = useState<boolean>(true);
  const [hasProcessedOrganization, setHasProcessedOrganization] = useState<boolean>(false);
  const userOrgsRequestInProgress = useRef<boolean>(false);
  const navigate = useNavigate();

  // Set the organization based on the URL parameter or current organization
  useEffect(() => {
    console.log('OrganizationManagementPage: Effect triggered with:', {
      organizationId,
      organizationsCount: organizations.length,
      currentOrganization: currentOrganization?.name,
      isLoading: isLoadingUserOrgs,
      userOrganizationsCount: userOrganizations.length,
      hasProcessedOrganization
    });

    // Don't do anything if we're still loading
    if (isLoadingUserOrgs) {
      console.log('OrganizationManagementPage: Still loading user organizations, skipping navigation');
      return;
    }

    // Prevent duplicate processing
    if (hasProcessedOrganization && organization) {
      console.log('OrganizationManagementPage: Already processed organization, skipping');
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
      setHasProcessedOrganization(true);
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
        setHasProcessedOrganization(true);
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
        setHasProcessedOrganization(true);
      } else if (userOrgIds.length > 0) {
        // Organization not found but user has other organizations
        console.log('OrganizationManagementPage: Organization ID not found, redirecting to first available');
        navigate(`/organizations/${userOrgIds[0]}`, { replace: true });
        setHasProcessedOrganization(true);
      } else {
        // No organizations available
        console.log('OrganizationManagementPage: No organizations available, redirecting to home');
        navigate('/', { replace: true });
        setHasProcessedOrganization(true);
      }
    } else if (currentOrganization && userOrgIds.includes(currentOrganization.id)) {
      // No organization ID in URL, use current organization if user is a member
      console.log('OrganizationManagementPage: No organization ID in URL, using current:', currentOrganization.name);
      navigate(`/organizations/${currentOrganization.id}`, { replace: true });
      setHasProcessedOrganization(true);
    } else if (userOrgIds.length > 0) {
      // No current organization or user is not a member, use first available
      console.log('OrganizationManagementPage: No current organization, using first available');
      navigate(`/organizations/${userOrgIds[0]}`, { replace: true });
      setHasProcessedOrganization(true);
    } else {
      // No organizations available, redirect to home
      console.log('OrganizationManagementPage: No organizations available, redirecting to home');
      navigate('/', { replace: true });
      setHasProcessedOrganization(true);
    }
  }, [organizationId, organizations, currentOrganization, navigate, isLoadingUserOrgs, setCurrentOrganization, userOrganizations, hasProcessedOrganization, organization]);

  // Fetch user organization roles - only when user changes
  useEffect(() => {
    const fetchUserOrganizations = async () => {
      if (!supabase || !user) {
        setIsLoadingUserOrgs(false);
        return;
      }

      // Prevent duplicate API calls
      if (userOrgsRequestInProgress.current) {
        if (process.env.NODE_ENV === 'development') {
          console.log('OrganizationManagementPage: User organizations fetch already in progress, skipping');
        }
        return;
      }

      // Only fetch if we don't have data for this user yet
      if (userOrganizations.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('OrganizationManagementPage: User organizations already loaded, skipping fetch');
        }
        setIsLoadingUserOrgs(false);
        return;
      }

      userOrgsRequestInProgress.current = true;
      if (process.env.NODE_ENV === 'development') {
        console.log('OrganizationManagementPage: Fetching user organizations for user:', user.id);
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
          if (process.env.NODE_ENV === 'development') {
            console.log('OrganizationManagementPage: User organizations fetched successfully:', userOrgs.length);
          }
        }
      } catch (err) {
        console.error('Error in fetchUserOrganizations:', err);
        setUserOrganizations([]);
      } finally {
        setIsLoadingUserOrgs(false);
        userOrgsRequestInProgress.current = false;
      }
    };

    fetchUserOrganizations();
  }, [supabase, user?.id]); // Removed userOrganizations.length from dependencies

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
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <span>Payments</span>
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                  Solana
                </span>
              </div>
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
          {activeTab === 'payments' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">Payment Settings</span>
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Configure payment options for premium assignments in your organization.
                  Students can pay using Solana cryptocurrency to access premium content.
                </p>
              </div>

              <Suspense fallback={
                <div className="animate-pulse" id="payment-settings-placeholder">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
                </div>
              }>
                <OrganizationPaymentSettings organizationId={organization.id} />
              </Suspense>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-8">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">
                  Payment Transactions
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  View all payment transactions for assignments in your organization.
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No payment transactions yet. They will appear here when students make payments for premium assignments.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationManagementPage;
