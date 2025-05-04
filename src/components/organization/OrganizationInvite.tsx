// src/components/organization/OrganizationInvite.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { Organization, OrganizationRole, UserOrganization } from '../../types/organization';
import toast from 'react-hot-toast';

interface OrganizationInviteProps {
  organization: Organization;
  userOrganizations?: UserOrganization[];
}

const OrganizationInvite: React.FC<OrganizationInviteProps> = ({ organization, userOrganizations = [] }) => {
  const { supabase } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrganizationRole>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  // Current user's role in this organization
  const currentUserRole = userOrganizations.find(
    uo => uo.organizationId === organization.id
  )?.role || 'member';

  // Check if current user is owner or admin
  const canInviteUsers = currentUserRole === 'owner' || currentUserRole === 'admin';

  // Generate an invitation link
  const generateInviteLink = async () => {
    if (!supabase || !canInviteUsers || !email) return;

    setIsSubmitting(true);

    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      const invitedById = user?.id;

      if (!invitedById) {
        throw new Error('User not authenticated');
      }

      // Try to use the database first, fall back to localStorage if needed
      try {
        // Try to create an invitation record in the database
        const { data, error } = await supabase
          .from('organization_invitation')
          .insert({
            organization_id: organization.id,
            email: email.toLowerCase(),
            role: role,
            invited_by: invitedById,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
          })
          .select()
          .single();

        // If there's an error, check what kind it is
        if (error) {
          // Check if it's a duplicate invitation
          if (error.code === '23505') {
            toast.error('An invitation has already been sent to this email');
            return;
          }

          // Check for specific errors
          if (error.code === 'PGRST204' || // Table not found
              error.code === '42P17' ||    // Infinite recursion
              error.code === '42501' ||    // Permission denied
              error.message?.includes('relation "organization_invitation" does not exist') ||
              error.message?.includes('infinite recursion detected') ||
              error.message?.includes('permission denied')) {
            console.warn('organization_invitation table issue, using local storage instead:', error);
            useLocalStorage();
            return;
          }

          // For any other error, fall back to localStorage
          console.error('Error creating invitation:', error);
          useLocalStorage();
          return;
        } else if (data) {
          // Generate the invitation link
          const baseUrl = window.location.origin;
          const inviteUrl = `${baseUrl}/join-organization?token=${data.id}`;

          setInviteLink(inviteUrl);
          toast.success('Invitation link generated successfully');
        }
      } catch (err) {
        console.error('Error with organization invitation:', err);
        useLocalStorage();
      }

      // Helper function to use localStorage for invitations
      function useLocalStorage() {
        // Generate a random ID for the invitation
        const tempId = Math.random().toString(36).substring(2, 15);

        // Store the invitation in localStorage
        const invitation = {
          id: tempId,
          organization_id: organization.id,
          email: email.toLowerCase(),
          role: role,
          invited_by: invitedById,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          status: 'PENDING'
        };

        // Get existing invitations or initialize empty array
        const existingInvitations = JSON.parse(localStorage.getItem('organization_invitations') || '[]');
        existingInvitations.push(invitation);
        localStorage.setItem('organization_invitations', JSON.stringify(existingInvitations));

        // Generate the invitation link
        const baseUrl = window.location.origin;
        const inviteUrl = `${baseUrl}/join-organization?token=${tempId}`;

        setInviteLink(inviteUrl);
        toast.success('Invitation link generated successfully (local mode)');
      }
    } catch (err) {
      console.error('Error generating invitation link:', err);
      toast.error('Failed to generate invitation link');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy invitation link to clipboard
  const copyInviteLink = () => {
    if (!inviteLink) return;

    navigator.clipboard.writeText(inviteLink)
      .then(() => toast.success('Invitation link copied to clipboard'))
      .catch(() => toast.error('Failed to copy invitation link'));
  };

  // Send invitation email using direct database call
  const sendInvitationEmail = async () => {
    if (!supabase || !canInviteUsers || !email || !inviteLink) return;

    setIsSubmitting(true);

    try {
      // Get the current user's name for the email
      const { data: { user } } = await supabase.auth.getUser();
      const inviterName = user?.user_metadata?.name || 'A team member';

      // Try to send email directly through database function
      const { data, error } = await supabase.rpc('send_email', {
        to_email: email,
        subject: `Invitation to join ${organization.name}`,
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4a5568;">You've been invited to join ${organization.name}</h2>
            <p style="color: #4a5568; font-size: 16px;">
              ${inviterName} has invited you to join ${organization.name} on Interactive Assignments.
            </p>
            <div style="margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Accept Invitation
              </a>
            </div>
            <p style="color: #718096; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <a href="${inviteLink}" style="color: #3182ce;">${inviteLink}</a>
            </p>
            <p style="color: #718096; font-size: 14px; margin-top: 30px;">
              This invitation will expire in 7 days.
            </p>
          </div>
        `,
        text_content: `
          You've been invited to join ${organization.name}

          ${inviterName} has invited you to join ${organization.name} on Interactive Assignments.

          Click the link below to accept the invitation:
          ${inviteLink}

          This invitation will expire in 7 days.
        `
      });

      if (error) {
        console.error('Error sending email via RPC:', error);
        throw new Error(error.message || 'Failed to send invitation email');
      }

      console.log('Email sent successfully:', data);
      toast.success(`Invitation email sent to ${email}`);

      // Always copy to clipboard as a backup
      navigator.clipboard.writeText(inviteLink)
        .then(() => {
          toast.info('Invitation link copied to clipboard as a backup');
        })
        .catch((err) => {
          console.warn('Could not copy invitation link to clipboard:', err);
        });
    } catch (err) {
      console.error('Error sending invitation email:', err);
      toast.error('Failed to send invitation email');

      // Fallback to mailto link if the database function fails
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const inviterName = user?.user_metadata?.name || 'A team member';

        const emailSubject = `Invitation to join ${organization.name}`;
        const emailBody = `
          ${inviterName} has invited you to join ${organization.name} on Interactive Assignments.

          Click the link below to accept the invitation:
          ${inviteLink}

          This invitation will expire in 7 days.
        `;

        const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        window.open(mailtoLink, '_blank');

        toast.info('Email client opened as a fallback');
      } catch (mailtoErr) {
        console.error('Fallback email method also failed:', mailtoErr);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canInviteUsers) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to invite users to this organization.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Invite Users
      </h3>

      <div className="space-y-4">
        {/* Email input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Enter email address"
            required
          />
        </div>

        {/* Role selection */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as OrganizationRole)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            {currentUserRole === 'owner' && (
              <option value="admin">Admin</option>
            )}
            <option value="member">Member</option>
          </select>
        </div>

        {/* Generate link button */}
        <div>
          <button
            onClick={generateInviteLink}
            disabled={isSubmitting || !email}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Generating...' : 'Generate Invitation Link'}
          </button>
        </div>

        {/* Invitation link */}
        {inviteLink && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden"
          >
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Invitation Link:
            </p>
            <div className="flex items-center">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-l-md"
              />
              <button
                onClick={copyInviteLink}
                className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="mt-2">
              <button
                onClick={sendInvitationEmail}
                className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Send Email Invitation
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OrganizationInvite;
