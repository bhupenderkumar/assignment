// src/components/pages/ForgotPasswordPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../layout/Layout';
import { useConfiguration } from '../../context/ConfigurationContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { getGradientWithHoverStyle } from '../../utils/styleUtils';
import { getUserActivityLogger } from '../../lib/services/userActivityLogger';

const ForgotPasswordPage: React.FC = () => {
  const { config } = useConfiguration();
  const { resetPasswordForEmail, user } = useSupabaseAuth();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Log page view
  useEffect(() => {
    const activityLogger = getUserActivityLogger();
    activityLogger.logPageView(
      'ForgotPasswordPage',
      window.location.href,
      user
    );
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const activityLogger = getUserActivityLogger();

    if (!email) {
      setError('Please enter your email address');
      await activityLogger.logUserAction(
        'Password reset validation error - empty email',
        'ForgotPasswordPage',
        user
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Log password reset attempt
    await activityLogger.logUserAction(
      'Password reset form submitted',
      'ForgotPasswordPage',
      user,
      { email }
    );

    try {
      await resetPasswordForEmail(email);
      setSuccess(true);

      // Log successful password reset request
      await activityLogger.logUserAction(
        'Password reset email sent successfully',
        'ForgotPasswordPage',
        user,
        { email }
      );
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to send password reset email');

      // Log password reset failure
      await activityLogger.logUserAction(
        'Password reset email failed',
        'ForgotPasswordPage',
        user,
        { email, error: error.message }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`
                  }}>
                Reset Password
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Enter your email to receive a password reset link
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
                  <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Check Your Email</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    We've sent a password reset link to <strong>{email}</strong>.
                    Please check your inbox and follow the instructions to reset your password.
                  </p>
                  <div className="flex flex-col space-y-4">
                    <Link
                      to="/signin"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Return to Sign In
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
                      {error}
                    </div>
                  )}

                  <div className="mb-6">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="your.email@example.com"
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
                    {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                  </button>

                  <div className="mt-6 text-center">
                    <Link to="/signin" className="text-blue-600 dark:text-blue-400 hover:underline">
                      Back to Sign In
                    </Link>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ForgotPasswordPage;
