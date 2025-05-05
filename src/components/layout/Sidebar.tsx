import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useConfiguration } from '../../context/ConfigurationContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useUserRole } from '../../hooks/useUserRole';
import { hexToRgba } from '../../utils/colorUtils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isMobile }) => {
  const location = useLocation();
  const { config } = useConfiguration();
  const { isAuthenticated, signOut } = useSupabaseAuth();
  const { isAdmin } = useUserRole();
  const [currentPath, setCurrentPath] = useState(location.pathname);

  // Update current path when location changes
  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location]);

  // Using hexToRgba from utils/colorUtils

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    onClose(); // Close sidebar after signing out
  };

  // Navigation items
  const navItems = [
    { path: '/', label: 'Landing Page', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/home', label: 'Dashboard', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
    { path: '/gallery', label: 'Assignment Gallery', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { path: '/dashboard', label: 'My Dashboard', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', requiresAuth: true },
    { path: '/manage-assignments', label: 'Manage Assignments', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', requiresAuth: true },
    { path: '/payment-demo', label: 'Payment History', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', requiresAuth: true, requiresAdmin: true },
    { path: '/organizations', label: 'Organizations', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', requiresAuth: true },
    { path: '/organization-settings', label: 'Organization Settings', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4', requiresAuth: true },
    { path: '/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', requiresAuth: true },
    { path: '/help', label: 'Help Center', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { path: '/privacy', label: 'Privacy Policy', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { path: '/terms', label: 'Terms of Service', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
  ];

  // Filter items based on authentication status and admin role
  const filteredNavItems = navItems.filter(item =>
    (!item.requiresAuth || isAuthenticated) &&
    (!item.requiresAdmin || isAdmin)
  );

  // Sidebar variants for animation
  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: isMobile ? "-100%" : "-280px",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  // Handle navigation
  const handleNavigation = (path: string) => {
    // Update current path immediately for better UX
    setCurrentPath(path);
    // Only close sidebar on mobile
    if (isMobile) {
      onClose();
    }
  };

  // Overlay variants for animation
  const overlayVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay (only for mobile) */}
          {isMobile && (
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={overlayVariants}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={onClose}
            />
          )}

          {/* Sidebar */}
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            className={`fixed top-0 left-0 h-full w-64 z-50 overflow-y-auto ${
              config.darkMode ? 'bg-gray-900/95' : 'bg-white/95'
            } backdrop-blur-md`}
            style={{
              marginTop: isMobile ? '0' : '64px', // Adjust based on header height
              height: isMobile ? '100%' : 'calc(100% - 64px)',
              borderRight: `1px solid ${hexToRgba(config.accentColor, 0.1)}`,
              boxShadow: `4px 0 20px ${hexToRgba(config.accentColor, 0.05)}`,
              background: config.darkMode
                ? `linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))`
                : `linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))`
            }}
          >
            {/* Mobile close button */}
            {isMobile && (
              <div className="flex justify-end p-4">
                <button
                  onClick={onClose}
                  className="focus:outline-none transition-colors duration-300"
                  style={{ color: config.accentColor }}
                  aria-label="Close sidebar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="px-4 py-6">
              <ul className="space-y-2">
                {filteredNavItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                        currentPath === item.path
                          ? 'shadow-md'
                          : 'hover:bg-opacity-5 hover:bg-gray-500'
                      }`}
                      style={{
                        color: currentPath === item.path ? config.accentColor : config.darkMode ? '#ffffff' : '#333333',
                        backgroundColor: currentPath === item.path
                          ? hexToRgba(config.accentColor, 0.1)
                          : 'transparent',
                        borderLeft: currentPath === item.path
                          ? `3px solid ${config.accentColor}`
                          : `3px solid transparent`,
                        transform: currentPath === item.path ? 'translateX(3px)' : 'none'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 transition-all duration-300 ${
                          currentPath === item.path ? 'scale-110' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      <span className="font-medium">{item.label}</span>

                      {/* Active indicator dot */}
                      {currentPath === item.path && (
                        <motion.div
                          className="ml-auto w-2 h-2 rounded-full"
                          style={{ backgroundColor: config.accentColor }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Authentication Links */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="px-4 py-2 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
                  Account
                </h3>
                {isAuthenticated ? (
                  <button
                    onClick={handleSignOut}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all duration-300 text-left hover:bg-opacity-5 hover:bg-gray-500 mt-2"
                    style={{
                      color: config.accentColor,
                      backgroundColor: hexToRgba(config.accentColor, 0.05),
                      border: `1px solid ${hexToRgba(config.accentColor, 0.1)}`
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="font-medium">Sign Out</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <div className="space-y-3 mt-2">
                    <Link
                      to="/sign-in"
                      onClick={() => handleNavigation('/sign-in')}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all duration-300 hover:bg-opacity-5 hover:bg-gray-500"
                      style={{
                        color: config.accentColor,
                        backgroundColor: hexToRgba(config.accentColor, 0.05),
                        border: `1px solid ${hexToRgba(config.accentColor, 0.1)}`
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium">Sign In</span>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <Link
                      to="/sign-up"
                      onClick={() => handleNavigation('/sign-up')}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all duration-300"
                      style={{
                        color: '#ffffff',
                        background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`,
                        boxShadow: `0 4px 10px ${hexToRgba(config.primaryColor, 0.3)}`
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        <span className="font-medium">Sign Up</span>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
