// src/components/pages/SignInPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SupabaseAuth from '../auth/SupabaseAuth';
import Layout from '../layout/Layout';


const SignInPage: React.FC = () => {
  // Configuration not needed in this component

  return (
    <Layout hideNavigation={true}>
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mb-8 text-center"
        >
          <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
            Interactive Assignments
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
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
            <Link to="/sign-up" className="text-blue-500 hover:text-blue-600 font-medium">
              Sign up here
            </Link>
          </p>
          <Link to="/" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm">
            ← Back to Home
          </Link>
        </motion.div>
      </div>
    </Layout>
  );
};

export default SignInPage;
