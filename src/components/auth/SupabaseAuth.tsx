// src/components/auth/SupabaseAuth.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';
import { useNavigate } from 'react-router-dom';
import { getGradientWithHoverStyle } from '../../utils/styleUtils';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { getSupabase } from '../../lib/supabase';
import { createOrganizationJoinRequestService } from '../../lib/services/organizationJoinRequestService';
import OrganizationOnboarding from '../organization/OrganizationOnboarding';
import OrganizationLookup from './OrganizationLookup';
import UserJoinRequests from '../organization/UserJoinRequests';
import { Organization } from '../../types/organization';

interface SupabaseAuthProps {
  mode: 'signIn' | 'signUp';
}

// Helper function to get the full URL for organization logos
const getFullLogoUrl = (logoUrl: string | null): string => {
  if (!logoUrl) return '';

  // If it's already a full URL, return it
  if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
    return logoUrl;
  }

  // If it's a storage path, convert it to a full URL
  if (logoUrl.startsWith('/')) {
    logoUrl = logoUrl.substring(1); // Remove leading slash if present
  }

  // Construct the full URL using the Supabase project ID
  return `https://uymsiskesqqrfnpslinp.supabase.co/storage/v1/object/public/organization-logos/${logoUrl}`;
};

const SupabaseAuth: React.FC<SupabaseAuthProps> = ({ mode }) => {
  const { config } = useConfiguration();
  const { isAuthenticated, isLoading, signIn, signUp, organizations } = useSupabaseAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  // We'll use signInSuccess for both sign-in and sign-up completion
  const [signInSuccess, setSignInSuccess] = useState(false);

  // Organization selection state
  const [step, setStep] = useState<'org-lookup' | 'credentials'>(mode === 'signIn' ? 'org-lookup' : 'credentials');
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [showCreateOrgAfterSignup, setShowCreateOrgAfterSignup] = useState(false);

  // Handle redirection after authentication state changes
  useEffect(() => {
    // Only proceed if we're not in a loading state
    if (!isLoading) {
      console.log('Auth state updated - isAuthenticated:', isAuthenticated);

      // If user is authenticated and we've just completed sign-in
      if (isAuthenticated && signInSuccess) {
        console.log('Authentication successful, checking organization status');

        // For sign-in with organization selected, go to home page
        if (mode === 'signIn' && selectedOrganization) {
          console.log('Sign-in with organization selected, redirecting to home');
          navigate('/');
        }
        // For sign-up, show organization creation
        else if (mode === 'signUp') {
          console.log('Sign-up successful, showing organization creation');
          setShowCreateOrgAfterSignup(true);
          setShowOnboarding(true);
        }
        // For sign-in without organization or with existing organizations
        else if (mode === 'signIn') {
          if (organizations.length > 0) {
            console.log('User has organizations, redirecting to home');
            navigate('/');
          } else if (!showOnboarding) {
            console.log('No organizations found, showing onboarding');
            setShowOnboarding(true);
          }
        }
      }
    }
  }, [isAuthenticated, isLoading, signInSuccess, organizations.length, mode, showOnboarding, navigate, selectedOrganization]);

  // Show organization onboarding if authenticated but no organizations
  useEffect(() => {
    if (isAuthenticated && organizations.length === 0 && !showOnboarding && !isLoading && !signInSuccess) {
      console.log('No organizations found and not in sign-in flow, showing onboarding');
      setShowOnboarding(true);
    }
  }, [isAuthenticated, organizations.length, showOnboarding, isLoading, signInSuccess]);

  // Handle organization selection
  const handleOrganizationSelect = (organization: Organization, action?: string) => {
    setSelectedOrganization(organization);

    if (action === 'join-request') {
      // Show join request form directly
      setShowJoinRequestForm(true);
    } else {
      // Proceed to credentials
      setStep('credentials');
    }

    console.log('Selected organization:', organization, 'Action:', action || 'sign-in');
  };

  // Handle going back to organization lookup
  const handleBackToOrgLookup = () => {
    setStep('org-lookup');
    setSelectedOrganization(null);
    setError(null);
  };

  // State for join request
  const [showJoinRequestForm, setShowJoinRequestForm] = useState(false);
  const [joinRequestMessage, setJoinRequestMessage] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [joinRequestStatus, setJoinRequestStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');

  // Handle submitting a join request
  const handleSubmitJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRequest(true);
    setError(null);

    try {
      if (!selectedOrganization) {
        throw new Error('No organization selected');
      }

      // Create a join request
      const joinRequestService = createOrganizationJoinRequestService();
      await joinRequestService.createJoinRequest(
        selectedOrganization.id,
        joinRequestMessage.trim() || undefined
      );

      // Show success message
      setShowJoinRequestForm(false);
      setError(`Your request to join ${selectedOrganization.name} has been submitted. An administrator will review your request.`);
      setJoinRequestStatus('pending');
    } catch (err: any) {
      console.error('Error submitting join request:', err);
      setError(err.message || 'Failed to submit join request. Please try again.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signIn') {
        // First authenticate the user
        await signIn(email, password);

        // If no organization is selected, proceed normally
        if (!selectedOrganization) {
          setSignInSuccess(true);
          console.log('Sign-in successful without organization selection');
          return;
        }

        // Check if the user is a member of the selected organization
        const supabase = await getSupabase();

        // Get the current user ID
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          throw new Error('Authentication failed');
        }

        // Check user_organization table for membership
        const { data: membership, error: membershipError } = await supabase
          .from('user_organization')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('organization_id', selectedOrganization.id)
          .maybeSingle();

        if (membershipError) {
          console.error('Error checking organization membership:', membershipError);
          throw new Error('Failed to verify organization membership');
        }

        // If user is a member, proceed with sign-in
        if (membership) {
          // Store the selected organization in localStorage for post-login handling
          localStorage.setItem('selectedOrganizationId', selectedOrganization.id);
          setSignInSuccess(true);
          console.log('Sign-in successful with organization membership');
          return;
        }

        // If not a member, check if there's a pending join request
        const { data: joinRequest, error: joinRequestError } = await supabase
          .from('organization_join_request')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('organization_id', selectedOrganization.id)
          .maybeSingle();

        if (joinRequestError) {
          console.error('Error checking join request:', joinRequestError);
          throw new Error('Failed to check organization join request status');
        }

        // If there's a pending join request, show appropriate message
        if (joinRequest) {
          setJoinRequestStatus(joinRequest.status);

          if (joinRequest.status === 'PENDING') {
            setError(`You have a pending request to join ${selectedOrganization.name}. Please wait for an administrator to approve your request.`);
          } else if (joinRequest.status === 'REJECTED') {
            setError(`Your request to join ${selectedOrganization.name} was rejected. Please contact an administrator for assistance.`);
          }

          // Sign out the user since they can't access this organization
          await supabase.auth.signOut();
          setIsSubmitting(false);
          return;
        }

        // If no membership and no join request, show join request form
        setShowJoinRequestForm(true);
        setError(`You are not a member of ${selectedOrganization.name}. Please submit a request to join.`);

        // Sign out the user since they can't access this organization yet
        await supabase.auth.signOut();
      } else {
        // For sign-up, proceed normally
        await signUp(email, password, { name });
        setSignInSuccess(true);
        console.log('Sign-up successful, setting signInSuccess to true');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOnboardingComplete = () => {
    // Redirect to home page after onboarding
    navigate('/');
  };

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <AnimatePresence mode="wait">
        {showJoinRequestForm && selectedOrganization && (
          <motion.div
            key="join-request"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 flex items-center space-x-3 border-b border-gray-200 dark:border-gray-600">
                {selectedOrganization.logoUrl ? (
                  <img
                    src={getFullLogoUrl(selectedOrganization.logoUrl)}
                    alt={selectedOrganization.name}
                    className="w-10 h-10 rounded-md object-cover"
                    onError={(e) => {
                      console.error('Error loading logo in auth:', e);
                      const imgElement = e.currentTarget as HTMLImageElement;
                      imgElement.style.display = 'none';
                      const fallbackElement = imgElement.nextElementSibling as HTMLElement;
                      if (fallbackElement) {
                        fallbackElement.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div
                  className="w-10 h-10 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg"
                  style={{ display: selectedOrganization.logoUrl ? 'none' : 'flex' }}
                >
                  {selectedOrganization.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{selectedOrganization.name}</div>
                  <button
                    onClick={handleBackToOrgLookup}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Change organization
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Request to Join
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    Submit a request to join {selectedOrganization.name}
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmitJoinRequest}>
                  <div className="mb-6">
                    <label htmlFor="joinRequestMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Message (Optional)
                    </label>
                    <textarea
                      id="joinRequestMessage"
                      value={joinRequestMessage}
                      onChange={(e) => setJoinRequestMessage(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Explain why you want to join this organization"
                      rows={4}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Your request will be sent to the organization administrators for approval.
                    </p>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={handleBackToOrgLookup}
                      className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
                      disabled={isSubmittingRequest}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 px-4 rounded-lg text-white font-medium transition-all duration-300 hover:opacity-90 disabled:opacity-70"
                      style={getGradientWithHoverStyle({
                        primaryColor: selectedOrganization?.primaryColor || config.primaryColor,
                        secondaryColor: selectedOrganization?.secondaryColor || config.secondaryColor,
                        accentColor: config.accentColor
                      })}
                      disabled={isSubmittingRequest}
                    >
                      {isSubmittingRequest ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
        {showOnboarding ? (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <OrganizationOnboarding
              onComplete={handleOnboardingComplete}
              isPostSignup={showCreateOrgAfterSignup}
            />
          </motion.div>
        ) : step === 'org-lookup' ? (
          <motion.div
            key="org-lookup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <OrganizationLookup
              onOrganizationSelect={handleOrganizationSelect}
              onBack={() => {
                // Skip organization selection and go directly to credentials
                setStep('credentials');
                // Clear any selected organization
                setSelectedOrganization(null);
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="auth-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              {selectedOrganization && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 flex items-center space-x-3 border-b border-gray-200 dark:border-gray-600">
                  {selectedOrganization.logoUrl ? (
                    <img
                      src={getFullLogoUrl(selectedOrganization.logoUrl)}
                      alt={selectedOrganization.name}
                      className="w-10 h-10 rounded-md object-cover"
                      onError={(e) => {
                        console.error('Error loading logo in auth:', e);
                        // Replace with fallback on error
                        const imgElement = e.currentTarget as HTMLImageElement;
                        imgElement.style.display = 'none';

                        // Find the fallback element (next sibling)
                        const fallbackElement = imgElement.nextElementSibling as HTMLElement;
                        if (fallbackElement) {
                          fallbackElement.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className="w-10 h-10 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg"
                    style={{ display: selectedOrganization.logoUrl ? 'none' : 'flex' }}
                  >
                    {selectedOrganization.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedOrganization.name}</div>
                    <button
                      onClick={handleBackToOrgLookup}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Change organization
                    </button>
                  </div>
                </div>
              )}

              <div className="p-6 sm:p-8">
                {mode === 'signIn' && isAuthenticated && (
                  <UserJoinRequests />
                )}

                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {mode === 'signIn' ? 'Sign In' : 'Create Account'}
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    {mode === 'signIn'
                      ? selectedOrganization
                        ? `Welcome back to ${selectedOrganization.name}`
                        : 'Welcome back! Sign in to your account'
                      : 'Create a new account to get started'}
                  </p>
                  {mode === 'signIn' && !selectedOrganization && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      You've skipped organization selection. You'll be able to select or create an organization after signing in.
                    </p>
                  )}
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {mode === 'signUp' && (
                    <div className="mb-4">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Enter your name"
                      />
                    </div>
                  )}

                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 px-4 rounded-lg text-white font-medium transition-all duration-300 hover:opacity-90 disabled:opacity-70"
                    style={getGradientWithHoverStyle({
                      primaryColor: selectedOrganization?.primaryColor || config.primaryColor,
                      secondaryColor: selectedOrganization?.secondaryColor || config.secondaryColor,
                      accentColor: config.accentColor
                    })}
                  >
                    {isSubmitting
                      ? 'Processing...'
                      : mode === 'signIn'
                      ? 'Sign In'
                      : 'Create Account'}
                  </button>

                  <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    {mode === 'signIn' ? (
                      <>
                        Don't have an account?{' '}
                        <button
                          onClick={() => navigate('/sign-up')}
                          className="text-blue-600 hover:underline bg-transparent border-none p-0 cursor-pointer"
                          style={{ color: config.accentColor }}
                        >
                          Sign Up
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{' '}
                        <button
                          onClick={() => navigate('/sign-in')}
                          className="text-blue-600 hover:underline bg-transparent border-none p-0 cursor-pointer"
                          style={{ color: config.accentColor }}
                        >
                          Sign In
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupabaseAuth;
