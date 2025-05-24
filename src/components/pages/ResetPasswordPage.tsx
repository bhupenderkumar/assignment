// src/components/pages/ResetPasswordPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../layout/Layout';
import { useConfiguration } from '../../context/ConfigurationContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { getGradientWithHoverStyle } from '../../utils/styleUtils';
import { getUserActivityLogger } from '../../lib/services/userActivityLogger';

const ResetPasswordPage: React.FC = () => {
  const { config } = useConfiguration();
  const { updatePassword, user, isLoading } = useSupabaseAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Log page view
  useEffect(() => {
    const activityLogger = getUserActivityLogger();
    activityLogger.logPageView(
      'ResetPasswordPage',
      window.location.href,
      user
    );
  }, [user]);

  // Check if user is authenticated via the reset password link
  useEffect(() => {
    if (!isLoading && !user) {
      // If not authenticated, redirect to forgot password page
      navigate('/forgot-password', {
        replace: true,
        state: {
          error: 'Password reset link has expired or is invalid. Please request a new one.'
        }
      });
    }
  }, [user, isLoading, navigate]);

  const validatePassword = (password: string): boolean => {
    // Password must be at least 8 characters
    return password.length >= 8;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const activityLogger = getUserActivityLogger();

    // Validate password
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long');

      // Log validation error
      await activityLogger.logUserAction(
        'Password reset validation error - password too short',
        'ResetPasswordPage',
        user
      );
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');

      // Log validation error
      await activityLogger.logUserAction(
        'Password reset validation error - passwords do not match',
        'ResetPasswordPage',
        user
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Log password update attempt
    await activityLogger.logUserAction(
      'Password update form submitted',
      'ResetPasswordPage',
      user
    );

    try {
      await updatePassword(password);
      setSuccess(true);

      // Log successful password update
      await activityLogger.logUserAction(
        'Password updated successfully',
        'ResetPasswordPage',
        user
      );

      // Redirect to sign in page after 3 seconds
      setTimeout(() => {
        navigate('/signin');
      }, 3000);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to update password');

      // Log password update failure
      await activityLogger.logUserAction(
        'Password update failed',
        'ResetPasswordPage',
        user,
        { error: error.message }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Layout hideNavigation={true}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideNavigation={true}>
      <div className="relative min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Background pattern */}
        <div className="absolute inset-0 z-0 opacity-10 dark:opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-md mx-auto">
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`
                  }}>
                Set New Password
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Create a new password for your account
              </p>
            </motion.div>

            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {success ? (
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Password Updated!</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Your password has been successfully updated. You will be redirected to the sign-in page shortly.
                  </p>
                  <Link
                    to="/signin"
                    className="inline-block py-2 px-4 rounded-lg font-medium text-white transition-all"
                    style={getGradientWithHoverStyle({
                      primaryColor: config.primaryColor,
                      secondaryColor: config.secondaryColor,
                      accentColor: config.accentColor
                    })}
                  >
                    Sign In Now
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
                      {error}
                    </div>
                  )}

                  <div className="mb-6">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter new password"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Password must be at least 8 characters long
                    </p>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                    style={getGradientWithHoverStyle({
                      primaryColor: config.primaryColor,
                      secondaryColor: config.secondaryColor,
                      accentColor: config.accentColor
                    })}
                  >
                    {isSubmitting ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResetPasswordPage;
