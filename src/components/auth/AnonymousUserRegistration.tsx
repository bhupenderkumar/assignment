// src/components/auth/AnonymousUserRegistration.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
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
  const [existingUser, setExistingUser] = useState<any>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  const { registerAnonymousUser } = useInteractiveAssignment();
  const { supabase } = useSupabaseAuth();
  const navigate = useNavigate();

  // Check for existing user by name
  const checkForExistingUser = async (userName: string) => {
    if (!userName.trim() || !supabase) return null;

    setIsCheckingDuplicate(true);
    try {
      const { data, error } = await supabase
        .from('anonymous_user')
        .select('*')
        .ilike('name', userName.trim())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking for existing user:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error checking for existing user:', error);
      return null;
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  // Handle name input change with duplicate checking
  const handleNameChange = async (newName: string) => {
    setName(newName);
    setExistingUser(null);

    if (newName.trim().length >= 2) {
      const existing = await checkForExistingUser(newName);
      if (existing) {
        setExistingUser(existing);
        // If existing user has contact info, pre-fill it
        if (existing.contact_info) {
          setContactInfo(existing.contact_info);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    // If duplicate user exists and no contact info provided, require it
    if (existingUser && !contactInfo.trim()) {
      toast.error('This name is already registered. Please provide your contact information to continue.');
      return;
    }

    setIsSubmitting(true);

    try {
      let userToUse = null;

      if (existingUser && contactInfo.trim()) {
        // Use existing user if contact info matches or update contact info
        if (existingUser.contact_info === contactInfo.trim()) {
          userToUse = existingUser;
          toast.success('Welcome back! Using your existing profile.');
        } else if (supabase) {
          // Update existing user's contact info
          const { data, error } = await supabase
            .from('anonymous_user')
            .update({
              contact_info: contactInfo.trim(),
              last_active_at: new Date().toISOString()
            })
            .eq('id', existingUser.id)
            .select()
            .single();

          if (error) throw error;
          userToUse = {
            id: data.id,
            name: data.name,
            contactInfo: data.contact_info,
            createdAt: new Date(data.created_at),
            lastActiveAt: new Date(data.last_active_at),
          };
          toast.success('Profile updated successfully!');
        }
      } else {
        // Create new user
        userToUse = await registerAnonymousUser(name, contactInfo);
        toast.success('Registration successful!');
      }

      // Store user in localStorage
      if (userToUse) {
        localStorage.setItem('anonymousUser', JSON.stringify(userToUse));
      }

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
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-colors"
                  placeholder="Enter your name"
                  required
                />
                {isCheckingDuplicate && (
                  <p className="text-xs text-blue-500 mt-1">
                    Checking for existing user...
                  </p>
                )}
                {existingUser && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ This name is already registered (last active: {new Date(existingUser.created_at).toLocaleDateString()})
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Please provide your contact information to continue with your existing profile.
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label htmlFor="contactInfo" className="block text-gray-700 font-medium mb-2">
                  Contact Information {existingUser ? <span className="text-red-500">*</span> : '(Optional)'}
                </label>
                <input
                  type="text"
                  id="contactInfo"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring focus:ring-opacity-50 transition-colors ${
                    existingUser
                      ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-200'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                  }`}
                  placeholder="Email or phone number"
                  required={existingUser !== null}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {existingUser
                    ? 'Required to verify your identity and continue with existing profile.'
                    : 'This helps us keep track of your progress across sessions.'
                  }
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
