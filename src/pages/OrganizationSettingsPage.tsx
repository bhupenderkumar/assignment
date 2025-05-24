// src/pages/OrganizationSettingsPage.tsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useOrganization } from '../context/OrganizationContext';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import OrganizationJoinRequests from '../components/organization/OrganizationJoinRequests';
import UserManagement from '../components/organization/UserManagement';
import { Helmet } from 'react-helmet-async';

// Lazy-load the payment settings component
const OrganizationPaymentSettings = lazy(() => import('../components/organization/OrganizationPaymentSettings'));

const OrganizationSettingsPage: React.FC = () => {
  const { currentOrganization, isLoading: orgLoading } = useOrganization();
  const { isLoading: authLoading, supabase } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'joinRequests' | 'payments'>('general');
  const [pendingJoinRequestsCount, setPendingJoinRequestsCount] = useState(0);
  const [, setIsLoadingRequests] = useState(false);

  // Fetch pending join requests count
  useEffect(() => {
    const fetchPendingJoinRequestsCount = async () => {
      if (!currentOrganization || !supabase) return;

      setIsLoadingRequests(true);

      try {
        // Count pending join requests
        const { count, error } = await supabase
          .from('organization_join_request')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id)
          .eq('status', 'PENDING');

        if (error) throw error;

        setPendingJoinRequestsCount(count || 0);
      } catch (err) {
        console.error('Error fetching pending join requests count:', err);
      } finally {
        setIsLoadingRequests(false);
      }
    };

    // Only fetch if we have an organization and are not in loading state
    if (currentOrganization && !orgLoading && !authLoading) {
      fetchPendingJoinRequestsCount();
    }
  }, [currentOrganization, supabase, orgLoading, authLoading]);

  // Loading state
  if (orgLoading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // No organization selected
  if (!currentOrganization) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">
            No Organization Selected
          </h2>
          <p className="text-yellow-700 dark:text-yellow-300">
            Please select an organization to view its settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`Organization Settings | ${currentOrganization.name || 'Interactive Assignments'}`}</title>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Organization Settings
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'general'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'members'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Members
            </button>
            <button
              onClick={() => setActiveTab('joinRequests')}
              className={`px-6 py-4 text-sm font-medium relative ${
                activeTab === 'joinRequests'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Join Requests
              {pendingJoinRequestsCount > 0 && (
                <span className="absolute top-2 right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {pendingJoinRequestsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'payments'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <span>Payments</span>
                <svg className="ml-2 w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
              </div>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'general' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Organization Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Organization Name
                      </label>
                      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-white">
                        {currentOrganization.name}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Organization Type
                      </label>
                      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-white capitalize">
                        {currentOrganization.type}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Organization Logo
                    </label>
                    <div className="flex items-center justify-center h-32 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      {currentOrganization.logoUrl ? (
                        <img
                          src={currentOrganization.logoUrl}
                          alt={currentOrganization.name}
                          className="max-h-full max-w-full object-contain rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl">
                          {currentOrganization.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <UserManagement
                organization={currentOrganization}
                userOrganizations={[]} // We'll fetch these in the component
              />
            )}

            {activeTab === 'joinRequests' && (
              <OrganizationJoinRequests
                organizationId={currentOrganization.id}
                onRequestStatusChange={() => {
                  // Refresh the pending join requests count
                  const fetchPendingCount = async () => {
                    if (!supabase) return;

                    try {
                      const { count, error } = await supabase
                        .from('organization_join_request')
                        .select('id', { count: 'exact', head: true })
                        .eq('organization_id', currentOrganization.id)
                        .eq('status', 'PENDING');

                      if (error) throw error;

                      setPendingJoinRequestsCount(count || 0);
                    } catch (err) {
                      console.error('Error refreshing pending count:', err);
                    }
                  };

                  fetchPendingCount();
                }}
              />
            )}
            
            {activeTab === 'payments' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  <div className="flex items-center">
                    <span className="bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">Payment Settings</span>
                    <div className="ml-3 px-2 py-1 text-xs rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      Powered by Solana
                    </div>
                  </div>
                </h2>
                
                {/* Import the OrganizationPaymentSettings component */}
                {currentOrganization && (
                  <div className="space-y-4">
                    <p className="mb-6 text-gray-600 dark:text-gray-300">
                      Configure payment options for premium assignments in your organization.
                      Students can pay using Solana cryptocurrency to access premium content.  
                    </p>
                    
                    {/* Payment settings component */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-1 mb-6">
                      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                        <Suspense fallback={
                          <div className="animate-pulse p-6" id="payment-settings-placeholder">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
                          </div>
                        }>
                          <OrganizationPaymentSettings organizationId={currentOrganization.id} />
                        </Suspense>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-8">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default OrganizationSettingsPage;
