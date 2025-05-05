// src/components/organization/OrganizationOnboarding.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useConfiguration } from '../../context/ConfigurationContext';
import { useOrganization } from '../../context/OrganizationContext';
import { OrganizationType } from '../../types/organization';
import toast from 'react-hot-toast';

interface OrganizationOnboardingProps {
  onComplete: () => void;
  isPostSignup?: boolean; // Flag to indicate if this is shown after signup
}

const OrganizationOnboarding: React.FC<OrganizationOnboardingProps> = ({
  onComplete,
  isPostSignup = false
}) => {
  const { joinOrganization } = useSupabaseAuth();
  const { createOrganization } = useOrganization();
  const { config } = useConfiguration();

  // State for the onboarding flow - if post-signup, go directly to create
  const [step, setStep] = useState<'choice' | 'create' | 'join'>(isPostSignup ? 'create' : 'choice');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for creating an organization
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<OrganizationType>('company');

  // State for joining an organization
  const [joinCode, setJoinCode] = useState('');

  // Handle creating a new organization
  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgName.trim()) {
      toast.error('Please enter an organization name');
      return;
    }

    setIsSubmitting(true);

    try {
      await createOrganization({
        name: orgName,
        type: orgType,
        signatureUrl: 'https://via.placeholder.com/200x100?text=Signature'
      });
      toast.success('Organization created successfully!');
      onComplete();
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Failed to create organization. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle joining an existing organization
  const handleJoinOrganization = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!joinCode.trim()) {
      toast.error('Please enter an organization ID');
      return;
    }

    setIsSubmitting(true);

    try {
      await joinOrganization(joinCode);
      toast.success('Joined organization successfully!');
      onComplete();
    } catch (error) {
      console.error('Error joining organization:', error);
      toast.error('Failed to join organization. Please check the ID and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {step === 'choice' && (
          <motion.div
            key="choice"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: config.primaryColor }}>
              Welcome to Your Learning Journey
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
              To get started, you need to either create a new organization or join an existing one.
            </p>

            <div className="space-y-4">
              <button
                onClick={() => setStep('create')}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Create a New Organization
              </button>

              <button
                onClick={() => setStep('join')}
                className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
              >
                Join an Existing Organization
              </button>
            </div>
          </motion.div>
        )}

        {step === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: config.primaryColor }}>
              {isPostSignup ? 'Welcome! Create Your Organization' : 'Create Your Organization'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
              {isPostSignup
                ? 'Your account has been created successfully! Now, set up your organization to get started.'
                : 'Set up your organization to manage your content and users.'}
            </p>

            <form onSubmit={handleCreateOrganization}>
              <div className="mb-4">
                <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization Name
                </label>
                <input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter organization name"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="orgType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization Type
                </label>
                <select
                  id="orgType"
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value as OrganizationType)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="company">Company</option>
                  <option value="school">School</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className={`flex ${isPostSignup ? '' : 'space-x-4'}`}>
                {!isPostSignup && (
                  <button
                    type="button"
                    onClick={() => setStep('choice')}
                    className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
                    disabled={isSubmitting}
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Organization'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 'join' && (
          <motion.div
            key="join"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: config.primaryColor }}>
              Join an Organization
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
              Enter the organization ID to join an existing organization.
            </p>

            <form onSubmit={handleJoinOrganization}>
              <div className="mb-6">
                <label htmlFor="joinCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization ID
                </label>
                <input
                  id="joinCode"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter organization ID"
                  required
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep('choice')}
                  className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Joining...' : 'Join Organization'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrganizationOnboarding;
