import React, { useState } from 'react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useConfiguration } from '../../context/ConfigurationContext';
import toast from 'react-hot-toast';

const AccountSettings: React.FC = () => {
  const { supabase, signOut } = useSupabaseAuth();
  const { config } = useConfiguration();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    // Validate passwords
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Get the user's email first
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData.user?.email || '';

      // First verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword
      });

      if (signInError) {
        toast.error('Current password is incorrect');
        return;
      }

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      // Clear the form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (!supabase) return;

    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm account deletion');
      return;
    }

    setIsDeleting(true);
    try {
      // This is a placeholder - Supabase doesn't provide a direct way to delete accounts
      // In a real implementation, you would need to:
      // 1. Create a server-side function with admin privileges
      // 2. Call that function to delete the user

      // For now, we'll just sign the user out
      toast.error('Account deletion requires admin assistance. Please contact support.');

      // Reset the form
      setDeleteConfirmText('');
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Account Settings
      </h3>

      <div className="space-y-8">
        {/* Password Change Section */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
            Change Password
          </h4>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                id="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={isChangingPassword}
                className="px-6 py-2 rounded-md text-white font-medium flex items-center justify-center"
                style={{ backgroundColor: config.accentColor }}
              >
                {isChangingPassword ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Sign Out Section */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
            Sign Out
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Sign out from your account on this device.
          </p>
          <button
            onClick={signOut}
            className="px-6 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Account Deletion Section */}
        <div>
          <h4 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">
            Delete Account
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-2 rounded-md bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium border border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-800/30 transition-colors"
            >
              Delete Account
            </button>
          ) : (
            <div className="space-y-4 p-4 border border-red-200 dark:border-red-800 rounded-md bg-red-50 dark:bg-red-900/10">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                This action is permanent and cannot be undone. All your data will be deleted.
              </p>
              <div>
                <label htmlFor="delete-confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type DELETE to confirm
                </label>
                <input
                  type="text"
                  id="delete-confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-red-300 dark:border-red-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleAccountDeletion}
                  disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                  className="px-6 py-2 rounded-md bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : 'Confirm Deletion'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="px-6 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
