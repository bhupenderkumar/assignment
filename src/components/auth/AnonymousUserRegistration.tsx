// src/components/auth/AnonymousUserRegistration.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import toast from 'react-hot-toast';

interface AnonymousUserRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AnonymousUserRegistration = ({
  isOpen,
  onClose,
  onSuccess
}: AnonymousUserRegistrationProps) => {
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { registerAnonymousUser } = useInteractiveAssignment();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsSubmitting(true);

    try {
      await registerAnonymousUser(name, contactInfo);
      toast.success('Registration successful!');

      // Check if there's a pending assignment to navigate to
      const pendingAssignmentId = localStorage.getItem('pendingAssignmentId');
      if (pendingAssignmentId) {
        // Clear the pending assignment
        localStorage.removeItem('pendingAssignmentId');
        // Navigate to the assignment
        navigate(`/play/assignment/${pendingAssignmentId}`);
      }

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
          >
            <h2 className="text-2xl font-bold mb-4 text-center">Welcome!</h2>
            <p className="text-gray-600 mb-6 text-center">
              Please enter your name to continue with the interactive assignment.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-colors"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="contactInfo" className="block text-gray-700 font-medium mb-2">
                  Contact Information (Optional)
                </label>
                <input
                  type="text"
                  id="contactInfo"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-colors"
                  placeholder="Email or phone number"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This helps us keep track of your progress across sessions.
                </p>
              </div>

              <div className="flex justify-between space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-6 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-6 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registering...' : 'Continue'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnonymousUserRegistration;
