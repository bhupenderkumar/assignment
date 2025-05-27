// src/components/auth/SupabaseAuth.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';
import { useNavigate, Link } from 'react-router-dom';
import { getGradientWithHoverStyle } from '../../utils/styleUtils';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { getSupabase } from '../../lib/supabase';
import { createOrganizationJoinRequestService } from '../../lib/services/organizationJoinRequestService';
import OrganizationOnboarding from '../organization/OrganizationOnboarding';
import OrganizationLookup from './OrganizationLookup';
import UserJoinRequests from '../organization/UserJoinRequests';
import { Organization, OrganizationInput } from '../../types/organization';
import { useOrganization } from '../../context/OrganizationContext';
import { useTranslations } from '../../hooks/useTranslations';
import toast from 'react-hot-toast';

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
  const { isAuthenticated, isLoading, signIn, signUp, organizations, user } = useSupabaseAuth();
  const { createOrganization } = useOrganization();
  const { commonTranslate, authTranslate, validationTranslate } = useTranslations();
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

        // Check if there's a pending organization to create
        const pendingOrgData = localStorage.getItem('pendingOrganization');
        if (pendingOrgData && user) {
          try {
            // Parse the pending organization data
            const orgData: OrganizationInput = JSON.parse(pendingOrgData);

            // Create the organization
            console.log('Creating pending organization:', orgData.name);
            createOrganization(orgData)
              .then(newOrg => {
                console.log('Organization created successfully:', newOrg);
                toast.success(`Organization "${newOrg.name}" created successfully!`);

                // Clear the pending organization data
                localStorage.removeItem('pendingOrganization');

                // Redirect to dashboard
                navigate('/dashboard');
              })
              .catch(err => {
                console.error('Error creating organization after authentication:', err);
                toast.error('Failed to create organization. Please try again.');

                // Show organization onboarding as fallback
                setShowOnboarding(true);
              });

            // Return early to prevent other navigation
            return;
          } catch (err) {
            console.error('Error parsing pending organization data:', err);
            // Continue with normal flow if there's an error
          }
        }

        // Check if there's a pending join request
        const pendingOrgForJoin = localStorage.getItem('selectedOrganizationForJoin');
        const pendingJoinMessage = localStorage.getItem('pendingJoinRequestMessage');

        if (pendingOrgForJoin && user) {
          try {
            // Parse the pending organization data
            const organization: Organization = JSON.parse(pendingOrgForJoin);

            // Process the join request
            console.log('Processing join request for organization:', organization.name);

            // Use a separate function to handle the async operations
            const processJoinRequest = async () => {
              try {
                // Check if the user is already a member of this organization
                const supabase = await getSupabase();

                // Check user_organization table for membership
                const { data: membership, error: membershipError } = await supabase
                  .from('user_organization')
                  .select('*')
                  .eq('user_id', user.id)
                  .eq('organization_id', organization.id)
                  .maybeSingle();

                if (membershipError) {
                  console.error('Error checking organization membership:', membershipError);
                }

                // If user is already a member, just redirect to home
                if (membership) {
                  console.log('User is already a member of this organization');
                  localStorage.removeItem('selectedOrganizationForJoin');
                  localStorage.removeItem('pendingJoinRequestMessage');

                  // Store the selected organization in localStorage for post-login handling
                  localStorage.setItem('selectedOrganizationId', organization.id);
                  navigate('/dashboard');
                  return;
                }

                // Check if there's already a pending join request
                const { data: existingRequest, error: requestError } = await supabase
                  .from('organization_join_request')
                  .select('*')
                  .eq('user_id', user.id)
                  .eq('organization_id', organization.id)
                  .eq('status', 'PENDING')
                  .maybeSingle();

                if (requestError) {
                  console.error('Error checking join request:', requestError);
                }

                // If there's already a pending request, show message and redirect
                if (existingRequest) {
                  toast(`You already have a pending request to join ${organization.name}`);
                  localStorage.removeItem('selectedOrganizationForJoin');
                  localStorage.removeItem('pendingJoinRequestMessage');
                  navigate('/dashboard');
                  return;
                }

                // Create a join request
                console.log('Creating join request for organization:', organization.name);
                const joinRequestService = createOrganizationJoinRequestService();
                await joinRequestService.createJoinRequest(
                  organization.id,
                  pendingJoinMessage || undefined
                );

                // Clear the pending join request data
                localStorage.removeItem('selectedOrganizationForJoin');
                localStorage.removeItem('pendingJoinRequestMessage');

                toast.success(`Your request to join ${organization.name} has been submitted`);
                navigate('/dashboard');
              } catch (err) {
                console.error('Error in processJoinRequest:', err);
                toast.error('Failed to process join request');

                // Continue with normal flow
                if (organizations.length > 0) {
                  navigate('/dashboard');
                } else {
                  setShowOnboarding(true);
                }
              }
            };

            // Call the async function
            processJoinRequest();
            return;
          } catch (err) {
            console.error('Error parsing organization data for join request:', err);
            // Continue with normal flow if there's an error
          }
        }

        // For sign-in with organization selected, go to dashboard
        if (mode === 'signIn' && selectedOrganization && selectedOrganization.id !== 'pending') {
          console.log('Sign-in with organization selected, redirecting to dashboard');
          navigate('/dashboard');
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
            console.log('User has organizations, redirecting to dashboard');
            navigate('/dashboard');
          } else if (!showOnboarding) {
            console.log('No organizations found, showing onboarding');
            setShowOnboarding(true);
          }
        }
      }
    }
  }, [isAuthenticated, isLoading, signInSuccess, organizations.length, mode, showOnboarding, navigate, selectedOrganization, user, createOrganization]);

  // Show organization onboarding if authenticated but no organizations
  useEffect(() => {
    if (isAuthenticated && organizations.length === 0 && !showOnboarding && !isLoading && !signInSuccess) {
      console.log('No organizations found and not in sign-in flow, showing onboarding');
      setShowOnboarding(true);
    }
  }, [isAuthenticated, organizations.length, showOnboarding, isLoading, signInSuccess]);

  // Reset form state when mode changes (switching between sign-in and sign-up)
  useEffect(() => {
    console.log('Auth mode changed to:', mode);
    // Reset form state
    setEmail('');
    setPassword('');
    setName('');
    setError(null);
    setIsSubmitting(false);
    setSignInSuccess(false);
    // Reset organization selection if needed
    if (step !== 'org-lookup') {
      setStep(mode === 'signIn' ? 'org-lookup' : 'credentials');
    }
    setSelectedOrganization(null);
    setShowCreateOrgAfterSignup(false);
    setShowJoinRequestForm(false);
    setJoinRequestMessage('');
  }, [mode]);

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

        // If this is a pending organization (from create flow), proceed normally
        // The organization will be created after authentication in the useEffect
        if (selectedOrganization.id === 'pending') {
          setSignInSuccess(true);
          console.log('Sign-in successful with pending organization creation');
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
          if (joinRequest.status === 'PENDING') {
            setError(`You have a pending request to join ${selectedOrganization.name}. Please wait for an administrator to approve your request.`);
            // Store the organization in localStorage for potential future use
            localStorage.setItem('selectedOrganizationForJoin', JSON.stringify(selectedOrganization));
            setSignInSuccess(true);
            return;
          } else if (joinRequest.status === 'REJECTED') {
            setError(`Your request to join ${selectedOrganization.name} was rejected. Please contact an administrator for assistance.`);
            // Store the organization in localStorage for potential future use
            localStorage.setItem('selectedOrganizationForJoin', JSON.stringify(selectedOrganization));
            setSignInSuccess(true);
            return;
          }
        }

        // If no membership and no join request, store the organization and proceed
        // This will trigger the join request flow in the useEffect
        localStorage.setItem('selectedOrganizationForJoin', JSON.stringify(selectedOrganization));

        // Show a message to the user
        toast.success(authTranslate('provideReasonToJoin', 'Please provide a reason to join the organization'));

        // Set sign-in success to trigger the useEffect
        setSignInSuccess(true);
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
    // Redirect to dashboard after onboarding
    navigate('/dashboard');
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
                      {authTranslate('changeOrganization', 'Change organization')}
                    </button>
                  </div>
                </div>
              )}

              <div className="p-6 sm:p-8">
                {mode === 'signIn' && isAuthenticated && (
                  <UserJoinRequests />
                )}

                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {mode === 'signIn' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      )}
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {mode === 'signIn' ? authTranslate('signIn') : authTranslate('createAccount', 'Create Account')}
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    {mode === 'signIn'
                      ? selectedOrganization
                        ? `${authTranslate('welcomeBackTo', 'Welcome back to')} ${selectedOrganization.name}`
                        : authTranslate('welcomeBackSignIn', 'Welcome back! Sign in to your account')
                      : authTranslate('createNewAccount', 'Create a new account to get started')}
                  </p>
                  {mode === 'signIn' && !selectedOrganization && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {authTranslate('skippedOrgSelection', "You've skipped organization selection. You'll be able to select or create an organization after signing in.")}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm border-l-4 border-red-500 dark:border-red-400 flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                  {mode === 'signUp' && (
                    <div className="mb-5">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {authTranslate('fullName', 'Full Name')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white shadow-sm"
                          placeholder={authTranslate('enterFullName', 'Enter your full name')}
                          autoFocus
                        />
                      </div>
                    </div>
                  )}

                  <div className="mb-5">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {authTranslate('emailAddress', 'Email Address')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white shadow-sm"
                        placeholder={authTranslate('enterEmail', 'Enter your email')}
                        autoFocus={mode === 'signIn'}
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {authTranslate('password', 'Password')}
                      </label>
                      {mode === 'signIn' && (
                        <Link to="/forgot-password" className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                          {authTranslate('forgotPassword', 'Forgot password?')}
                        </Link>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white shadow-sm"
                        placeholder={mode === 'signIn' ? authTranslate('enterPassword', 'Enter your password') : authTranslate('createPassword', 'Create a password')}
                      />
                    </div>
                    {mode === 'signUp' && (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {authTranslate('passwordRequirement', 'Password should be at least 8 characters long')}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 hover:shadow-md disabled:opacity-70 flex items-center justify-center"
                    style={getGradientWithHoverStyle({
                      primaryColor: selectedOrganization?.primaryColor || config.primaryColor,
                      secondaryColor: selectedOrganization?.secondaryColor || config.secondaryColor,
                      accentColor: config.accentColor
                    })}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {authTranslate('processing', 'Processing...')}
                      </>
                    ) : mode === 'signIn' ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        {authTranslate('signIn')}
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        {authTranslate('createAccount', 'Create Account')}
                      </>
                    )}
                  </button>

                  <div className="mt-6 text-center">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                          {mode === 'signIn' ? 'New to First Step School?' : 'Already registered?'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      {mode === 'signIn' ? (
                        <Link
                          to="/sign-up"
                          className="inline-flex items-center justify-center w-full py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          Create a new account
                        </Link>
                      ) : (
                        <Link
                          to="/sign-in"
                          className="inline-flex items-center justify-center w-full py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          {authTranslate('signInToAccount', 'Sign in to your account')}
                        </Link>
                      )}
                    </div>
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
