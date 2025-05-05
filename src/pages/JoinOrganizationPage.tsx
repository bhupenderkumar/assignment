// src/pages/JoinOrganizationPage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const JoinOrganizationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { supabase, isAuthenticated, joinOrganization } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [inviterName, setInviterName] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get('token');

  // Fetch invitation details
  useEffect(() => {
    const fetchInvitationDetails = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching invitation details for token:', token);

        // First, check if the invitation is in localStorage (fallback method)
        const localInvitations = JSON.parse(localStorage.getItem('organization_invitations') || '[]');
        const localInvitation = localInvitations.find((inv: any) => inv.id === token);

        if (localInvitation) {
          console.log('Found local invitation:', localInvitation);

          // Check if invitation has expired
          const expiresAt = new Date(localInvitation.expires_at);
          if (expiresAt < new Date()) {
            setError('This invitation has expired');
            setIsLoading(false);
            return;
          }

          // Try to get organization details
          if (supabase) {
            const { data: organization } = await supabase
              .from('organizations')
              .select('name')
              .eq('id', localInvitation.organization_id)
              .single();

            if (organization) {
              setOrganizationName(organization.name);
            } else {
              setOrganizationName('Organization');
            }

            // Try to get inviter details
            if (localInvitation.invited_by) {
              const { data: inviter } = await supabase
                .from('users')
                .select('raw_user_meta_data')
                .eq('id', localInvitation.invited_by)
                .single();

              if (inviter) {
                setInviterName(inviter.raw_user_meta_data?.name || 'Unknown User');
              }
            }
          } else {
            setOrganizationName('Organization');
          }

          setIsLoading(false);
          return;
        }

        // If not in localStorage and no supabase client, show error
        if (!supabase) {
          setError('Cannot verify invitation. Please try again later.');
          setIsLoading(false);
          return;
        }

        // Get invitation details from database
        const { data: invitation, error: invitationError } = await supabase
          .from('organization_invitation')
          .select('*, organization(*), invited_by')
          .eq('id', token)
          .single();

        if (invitationError) {
          // Check if the error is because the table doesn't exist
          if (invitationError.code === 'PGRST204' || // Table not found
              invitationError.code === '42P01' ||    // Relation does not exist
              invitationError.message?.includes('relation "organization_invitation" does not exist')) {
            console.error('organization_invitation table does not exist:', invitationError);
            setError('Invalid invitation system. Please contact the administrator.');
          } else {
            console.error('Error fetching invitation:', invitationError);
            throw invitationError;
          }
          setIsLoading(false);
          return;
        }

        if (!invitation) {
          console.error('Invitation not found for token:', token);
          setError('Invitation not found or has expired');
          setIsLoading(false);
          return;
        }

        console.log('Invitation found in database:', invitation);

        // Check if invitation has expired
        const expiresAt = new Date(invitation.expires_at);
        if (expiresAt < new Date()) {
          setError('This invitation has expired');
          setIsLoading(false);
          return;
        }

        // Set organization and inviter details
        setOrganizationName(invitation.organization?.name || 'Unknown Organization');

        // Get inviter details if available
        if (invitation.invited_by) {
          const { data: inviter, error: inviterError } = await supabase
            .from('users')
            .select('raw_user_meta_data')
            .eq('id', invitation.invited_by)
            .single();

          if (inviterError) {
            console.warn('Error fetching inviter details:', inviterError);
          }

          if (inviter) {
            setInviterName(inviter.raw_user_meta_data?.name || 'Unknown User');
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching invitation details:', err);
        setError('Failed to load invitation details');
        setIsLoading(false);
      }
    };

    fetchInvitationDetails();
  }, [supabase, token]);

  // Handle joining organization
  const handleJoinOrganization = async () => {
    if (!supabase || !token || !isAuthenticated) {
      console.error('Cannot join organization: missing supabase, token, or not authenticated');
      if (!isAuthenticated) {
        toast.error('Please sign in to join this organization');
      }
      return;
    }

    setIsJoining(true);

    try {
      console.log('Joining organization with token:', token);

      // First, check if the token is in localStorage (fallback method)
      const localInvitations = JSON.parse(localStorage.getItem('organization_invitations') || '[]');
      const localInvitation = localInvitations.find((inv: any) => inv.id === token);

      if (localInvitation) {
        console.log('Found local invitation:', localInvitation);

        // Join the organization using the local invitation
        await joinOrganization(localInvitation.organization_id);

        // Mark the invitation as accepted in localStorage
        const updatedInvitations = localInvitations.map((inv: any) =>
          inv.id === token
            ? { ...inv, status: 'ACCEPTED', accepted_at: new Date().toISOString() }
            : inv
        );
        localStorage.setItem('organization_invitations', JSON.stringify(updatedInvitations));

        toast.success('You have successfully joined the organization');
        navigate('/');
        return;
      }

      // If not in localStorage, try the database
      const { data: invitation, error: invitationError } = await supabase
        .from('organization_invitation')
        .select('organization_id, role, email, status')
        .eq('id', token)
        .single();

      if (invitationError) {
        // Check if the error is because the table doesn't exist
        if (invitationError.code === 'PGRST204' || // Table not found
            invitationError.code === '42P01' ||    // Relation does not exist
            invitationError.message?.includes('relation "organization_invitation" does not exist')) {
          console.error('organization_invitation table does not exist:', invitationError);
          setError('Invalid invitation system. Please contact the administrator.');
        } else {
          console.error('Error fetching invitation for joining:', invitationError);
          throw invitationError;
        }
        setIsJoining(false);
        return;
      }

      if (!invitation) {
        console.error('Invitation not found for token:', token);
        setError('Invitation not found or has expired');
        setIsJoining(false);
        return;
      }

      console.log('Found invitation in database:', invitation);

      // Check if invitation is already accepted
      if (invitation.status === 'ACCEPTED') {
        console.log('Invitation already accepted');
        toast('This invitation has already been accepted');
        navigate('/');
        return;
      }

      // Join the organization
      await joinOrganization(invitation.organization_id);

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('organization_invitation')
        .update({
          status: 'ACCEPTED',
          accepted_at: new Date().toISOString()
        })
        .eq('id', token);

      if (updateError) {
        console.error('Error updating invitation status:', updateError);
        // Continue anyway - the user has been added to the organization
      }

      toast.success('You have successfully joined the organization');

      // Redirect to home page
      navigate('/');
    } catch (err) {
      console.error('Error joining organization:', err);
      toast.error('Failed to join organization');
    } finally {
      setIsJoining(false);
    }
  };

  // Redirect to sign in if not authenticated
  const handleSignIn = () => {
    navigate(`/sign-in?redirect=${encodeURIComponent(window.location.href)}`);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
        >
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              Invalid Invitation
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {error || 'The invitation link is invalid or has expired.'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Home Page
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Join {organizationName}
          </h1>

          {inviterName && (
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You've been invited by {inviterName} to join {organizationName}.
            </p>
          )}

          {isAuthenticated ? (
            <button
              onClick={handleJoinOrganization}
              disabled={isJoining}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? 'Joining...' : `Join ${organizationName}`}
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                You need to sign in to join this organization.
              </p>
              <button
                onClick={handleSignIn}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Sign In to Continue
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default JoinOrganizationPage;
