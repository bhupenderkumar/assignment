// src/components/auth/SupabaseAuth.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';

interface SupabaseAuthProps {
  mode: 'signIn' | 'signUp';
}

const SupabaseAuth: React.FC<SupabaseAuthProps> = ({ mode }) => {
  const { config } = useConfiguration();
  const { isAuthenticated, signIn, signUp } = useSupabaseAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signIn') {
        await signIn(email, password);
      } else {
        await signUp(email, password, { name });
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {mode === 'signIn' ? 'Sign In' : 'Create Account'}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {mode === 'signIn' 
                  ? 'Welcome back! Sign in to your account' 
                  : 'Create a new account to get started'}
              </p>
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
                className={`w-full py-2 px-4 rounded-lg text-white font-medium transition-colors bg-gradient-to-r from-[${config.primaryColor}] to-[${config.secondaryColor}] hover:opacity-90 disabled:opacity-70`}
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
                    <a href="/sign-up" className={`text-[${config.accentColor}] hover:underline`}>
                      Sign Up
                    </a>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <a href="/sign-in" className={`text-[${config.accentColor}] hover:underline`}>
                      Sign In
                    </a>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SupabaseAuth;
