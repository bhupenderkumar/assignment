// src/components/ui/MobileModal.tsx
import React, { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  showCloseButton?: boolean;
  maxWidth?: string;
  className?: string;
  preventBackdropClose?: boolean;
}

const MobileModal: React.FC<MobileModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  maxWidth = 'max-w-md',
  className = '',
  preventBackdropClose = false
}) => {
  const { config } = useConfiguration();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Scroll to top on mobile when modal opens
      if (window.innerWidth < 768) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !preventBackdropClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{
            background: config.darkMode
              ? 'rgba(0, 0, 0, 0.8)'
              : 'rgba(0, 0, 0, 0.5)'
          }}
          onClick={handleBackdropClick}
        >
          {/* Mobile-first positioning */}
          <div className="min-h-screen px-4 py-4 md:py-8 md:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-center min-h-full">
              <motion.div
                initial={{
                  scale: 0.95,
                  y: 20,
                  opacity: 0
                }}
                animate={{
                  scale: 1,
                  y: 0,
                  opacity: 1
                }}
                exit={{
                  scale: 0.95,
                  y: 20,
                  opacity: 0
                }}
                transition={{
                  duration: 0.2,
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
                className={`
                  w-full ${maxWidth} mx-auto
                  ${config.darkMode ? 'bg-gray-800' : 'bg-white'}
                  rounded-2xl shadow-2xl
                  ${className}
                  relative
                  mt-4 md:mt-0
                `}
                style={{
                  boxShadow: config.darkMode
                    ? `0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)`
                    : `0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)`,
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${config.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with title and close button */}
                {(title || showCloseButton) && (
                  <div className="flex items-center justify-between p-6 pb-4">
                    {title && (
                      <h2
                        className="text-xl md:text-2xl font-bold"
                        style={{ color: config.primaryColor }}
                      >
                        {title}
                      </h2>
                    )}
                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className={`
                          p-2 rounded-full transition-all duration-200
                          ${config.darkMode
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }
                          focus:outline-none focus:ring-2 focus:ring-offset-2
                        `}
                        style={{
                          '--tw-ring-color': config.primaryColor + '50'
                        } as React.CSSProperties}
                        aria-label="Close modal"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className={`${(title || showCloseButton) ? 'px-6 pb-6' : 'p-6'}`}>
                  {children}
                </div>

                {/* Mobile-specific visual enhancements */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full md:hidden mt-2" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileModal;
