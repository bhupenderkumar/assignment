// src/components/certificates/CertificateFloatingButton.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import AnonymousUserCertificates from './AnonymousUserCertificates';

const CertificateFloatingButton: React.FC = () => {
  const { anonymousUser } = useInteractiveAssignment();
  const [showCertificates, setShowCertificates] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Only show for anonymous users
  if (!anonymousUser) {
    return null;
  }

  const handleOpenCertificates = () => {
    setShowCertificates(true);
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-6 left-6 z-40"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
      >
        <motion.button
          onClick={handleOpenCertificates}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 flex items-center space-x-2"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="View My Certificates"
        >
          {/* Certificate Icon */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          
          {/* Expandable Text */}
          <AnimatePresence>
            {isHovered && (
              <motion.span
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap overflow-hidden text-sm font-medium"
              >
                My Certificates
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Notification Badge (if user has certificates) */}
        <motion.div
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.5, type: "spring", stiffness: 500 }}
        >
          🏆
        </motion.div>
      </motion.div>

      {/* Certificate Gallery Modal */}
      <AnonymousUserCertificates
        isOpen={showCertificates}
        onClose={() => setShowCertificates(false)}
      />
    </>
  );
};

export default CertificateFloatingButton;
