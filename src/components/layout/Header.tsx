import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import ConfigurableLogo from '../common/ConfigurableLogo';
import OrganizationSwitcher from '../organization/OrganizationSwitcher';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { hexToRgba } from '../../utils/colorUtils';

interface HeaderProps {
  onNavigate?: (view: string) => void;
  currentView?: string;
  hideNavigation?: boolean;
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, hideNavigation = false, onToggleSidebar }) => {
  const [scrolled, setScrolled] = useState(false);
  const { config, updateConfig } = useConfiguration();
  const { isAuthenticated, username, userImageUrl, signOut, isLoading, isSupabaseLoading } = useSupabaseAuth();
  const { currentOrganization, isLoading: isOrgLoading } = useOrganization();
  const location = useLocation();

  // Function to toggle dark mode
  const toggleDarkMode = () => {
    updateConfig({ darkMode: !config.darkMode });
  };
  const navigate = useNavigate();

  // Debug authentication state
  useEffect(() => {
    console.log('Header auth state:', { isAuthenticated, username, isLoading, isSupabaseLoading });
  }, [isAuthenticated, username, isLoading, isSupabaseLoading]);



  // We no longer need to determine current view since navigation is in the sidebar

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Function to navigate with React Router
  const navigateWithUrl = (view: string) => {
    console.log('Navigating to view:', view);

    // Map view to URL
    let url = '/';
    if (view === 'home') {
      url = '/home';
    } else if (view === 'landing') {
      url = '/';
    } else if (view === 'test-matching') {
      url = '/test-matching';
    } else if (view === 'test-matching-audio') {
      url = '/test-matching-audio';
    } else if (view === 'admin') {
      url = '/manage-assignments';
    } else if (view === 'organizations') {
      url = '/organizations';
    } else if (view === 'settings') {
      url = '/settings';
    } else if (view === 'sign-in') {
      url = '/sign-in';
    } else if (view === 'sign-up') {
      url = '/sign-up';
    } else if (view === 'help') {
      url = '/help';
    } else if (view === 'privacy') {
      url = '/privacy';
    } else if (view === 'terms') {
      url = '/terms';
    } else if (view === 'gallery') {
      url = '/gallery';
    }

    // Use React Router navigation
    navigate(url);
    console.log('Navigated to:', url);

    if (onNavigate) {
      // Update the current view state if callback provided
      onNavigate(view);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Log organization changes for debugging
  useEffect(() => {
    // Log current organization for debugging
    if (currentOrganization) {
      console.log('Current organization in Header:', currentOrganization.name, currentOrganization.id);
      console.log('Organization logo URL:', currentOrganization.logoUrl);
    }
  }, [currentOrganization]);

  // Using hexToRgba from utils/colorUtils

  // Check if we're on the landing page
  const isLandingPage = location.pathname === '/';

  return (
    <header
      className={`w-full fixed top-0 z-50 transition-all duration-300 ${
        scrolled || !isLandingPage ? 'backdrop-blur-md' : ''
      }`}
      style={{
        backgroundColor: scrolled || !isLandingPage
          ? hexToRgba(config.darkMode ? '#0f172a' : '#ffffff', 0.85)
          : 'transparent',
        boxShadow: scrolled || !isLandingPage
          ? `0 4px 20px ${hexToRgba(config.accentColor, 0.15)}`
          : 'none',
        borderBottom: scrolled || !isLandingPage
          ? `1px solid ${hexToRgba(config.accentColor, 0.1)}`
          : 'none'
      }}
    >
      <div className="container mx-auto flex justify-between items-center py-5 md:py-4 px-4">
        {/* Left section: Sidebar toggle and logo */}
        <div className="flex items-center">
          {/* Sidebar toggle button with improved styling */}
          {!hideNavigation && (
            <button
              onClick={onToggleSidebar}
              className={`focus:outline-none transition-all duration-300 mr-3 p-2 rounded-lg hover:bg-opacity-10 hover:bg-${config.primaryColor.replace('#', '')}`}
              style={{
                color: config.accentColor,
                backgroundColor: hexToRgba(config.accentColor, 0.05)
              }}
              aria-label="Toggle sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Logo and company name */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigateWithUrl('landing')}
          >
            <div className="relative">
              {currentOrganization && currentOrganization.logoUrl ? (
                <div className="relative">
                  <img
                    src={currentOrganization.logoUrl}
                    alt={currentOrganization.name}
                    className="h-8 w-8 md:h-10 md:w-10 rounded-lg object-cover border-2 transition-all duration-300"
                    style={{ borderColor: hexToRgba(config.accentColor, 0.3) }}
                  />
                  {config.animationsEnabled && (
                    <div
                      className="absolute inset-0 rounded-lg blur-xl -z-10 animate-pulse"
                      style={{ backgroundColor: `${hexToRgba(config.accentColor, 0.2)}` }}
                    ></div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <ConfigurableLogo
                    logoType={config.companyLogo}
                    className="h-8 w-8 md:h-10 md:w-10"
                    color={config.accentColor}
                  />
                  {config.animationsEnabled && (
                    <div
                      className="absolute inset-0 rounded-lg blur-xl -z-10 animate-pulse"
                      style={{ backgroundColor: `${hexToRgba(config.accentColor, 0.2)}` }}
                    ></div>
                  )}
                </div>
              )}
            </div>
            <div className="text-left">
              <h1
                className="text-lg md:text-2xl font-bold text-theme-gradient"
                style={{
                  backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`
                }}
              >
                {currentOrganization ? currentOrganization.name : config.companyName}
              </h1>
              <p
                className="text-xs md:text-sm font-light tracking-wider"
                style={{ color: hexToRgba(config.accentColor, 0.9) }}
              >
                {currentOrganization?.headerText || config.companyTagline}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right section: User profile, dark mode, etc. */}
        {!hideNavigation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center space-x-3"
          >
            {/* Organization Switcher - only show when authenticated */}
            {isAuthenticated && !isLoading && (
              <OrganizationSwitcher />
            )}

            {/* Dark mode toggle button */}
            <motion.button
              onClick={toggleDarkMode}
              className="relative p-2 rounded-lg transition-all duration-300 flex items-center justify-center overflow-hidden"
              style={{
                background: hexToRgba(config.accentColor, 0.05),
                color: config.accentColor,
                border: `1px solid ${hexToRgba(config.accentColor, 0.1)}`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={config.darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              <motion.div
                initial={false}
                animate={{ rotate: config.darkMode ? 0 : 180 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="relative"
              >
                {config.darkMode ? (
                  // Sun icon for light mode
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  // Moon icon for dark mode
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </motion.div>
            </motion.button>

            {/* User profile and authentication */}
            {isLoading ? (
              // Loading state
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-lg animate-pulse"
                  style={{ background: hexToRgba(config.accentColor, 0.3) }}></div>
              </div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {/* User profile */}
                <div className="flex items-center space-x-2 bg-opacity-5 px-2 py-1 rounded-lg"
                  style={{ backgroundColor: hexToRgba(config.accentColor, 0.05) }}>
                  {userImageUrl ? (
                    <img
                      src={userImageUrl}
                      alt={username || 'User'}
                      className="w-8 h-8 rounded-lg border-2 transition-all duration-300"
                      style={{ borderColor: hexToRgba(config.accentColor, 0.3) }}
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm transition-all duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`
                      }}
                    >
                      {username?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span
                    className="text-sm font-medium hidden md:inline"
                    style={{ color: config.darkMode ? '#ffffff' : '#333333' }}
                  >
                    {username}
                  </span>
                </div>

                {/* Sign out button */}
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 rounded-lg text-sm transition-all duration-300 hidden md:flex items-center space-x-1"
                  style={{
                    background: hexToRgba(config.accentColor, 0.05),
                    color: config.accentColor,
                    border: `1px solid ${hexToRgba(config.accentColor, 0.1)}`
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/sign-in"
                  className="px-3 py-2 rounded-lg text-sm transition-all duration-300 flex items-center space-x-1"
                  style={{
                    background: hexToRgba(config.accentColor, 0.05),
                    color: config.accentColor,
                    border: `1px solid ${hexToRgba(config.accentColor, 0.1)}`,
                    textDecoration: 'none'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
                <Link
                  to="/sign-up"
                  className="px-3 py-2 rounded-lg text-sm transition-all duration-300 flex items-center space-x-1"
                  style={{
                    background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`,
                    color: '#ffffff',
                    textDecoration: 'none',
                    boxShadow: `0 4px 10px ${hexToRgba(config.primaryColor, 0.3)}`
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span className="hidden sm:inline">Sign Up</span>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default Header;
