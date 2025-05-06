// src/components/pages/SignInPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SupabaseAuth from '../auth/SupabaseAuth';
import Layout from '../layout/Layout';
import { useConfiguration } from '../../context/ConfigurationContext';

const SignInPage: React.FC = () => {
  const { config } = useConfiguration();

  return (
    <Layout hideNavigation={true}>
      <div className="relative min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Background pattern */}
        <div className="absolute inset-0 z-0 opacity-10 dark:opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md mb-8 text-center"
          >
            <div className="inline-block mb-4 p-3 bg-white dark:bg-gray-800 rounded-full shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600"
                style={{
                  backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`
                }}>
              Interactive Assignments
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Sign in to access your educational content
            </p>
          </motion.div>

          <SupabaseAuth mode="signIn" />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Don't have an account?{' '}
              <Link to="/sign-up" className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
                    style={{ color: config.accentColor }}>
                Sign up here
              </Link>
            </p>
            <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default SignInPage;
