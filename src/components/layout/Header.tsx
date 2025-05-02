import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import ConfigurableLogo from '../common/ConfigurableLogo';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
  onNavigate?: (view: string) => void;
  currentView?: string;
  hideNavigation?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentView: propCurrentView, hideNavigation = false }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { config, updateConfig } = useConfiguration();
  const { isAuthenticated, username, userImageUrl, signOut, isLoading, isSupabaseLoading } = useSupabaseAuth();

  // Function to toggle dark mode
  const toggleDarkMode = () => {
    updateConfig({ darkMode: !config.darkMode });
  };
  const location = useLocation();
  const navigate = useNavigate();

  // Debug authentication state
  useEffect(() => {
    console.log('Header auth state:', { isAuthenticated, username, isLoading, isSupabaseLoading });
  }, [isAuthenticated, username, isLoading, isSupabaseLoading]);

  // Determine current view from location
  const getViewFromPath = (path: string) => {
    if (path === '/') return 'home';
    if (path === '/dashboard') return 'dashboard';
    if (path === '/manage-assignments') return 'admin';
    if (path === '/test-matching') return 'test-matching';
    if (path === '/test-matching-audio') return 'test-matching-audio';
    if (path === '/help') return 'help';
    if (path === '/privacy') return 'privacy';
    if (path === '/terms') return 'terms';
    if (path.startsWith('/sign-in')) return 'sign-in';
    if (path.startsWith('/sign-up')) return 'sign-up';
    return 'home';
  };

  const currentView = propCurrentView || getViewFromPath(location.pathname);

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
    if (view === 'test-matching') {
      url = '/test-matching';
    } else if (view === 'test-matching-audio') {
      url = '/test-matching-audio';
    } else if (view === 'admin') {
      url = '/manage-assignments';
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

  // Convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <header
      className={`w-full fixed top-0 z-50 transition-all duration-300 ${
        scrolled ? 'backdrop-blur-md shadow-lg' : ''
      }`}
      style={{
        backgroundColor: scrolled
          ? hexToRgba(config.darkMode ? '#000000' : '#ffffff', 0.8)
          : 'transparent',
        boxShadow: scrolled
          ? `0 4px 20px ${hexToRgba(config.accentColor, 0.1)}`
          : 'none'
      }}
    >
      <div className="container mx-auto flex justify-between items-center py-4 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => navigateWithUrl('home')}
        >
          <div className="relative">
            <ConfigurableLogo
              logoType={config.companyLogo}
              className="h-10 w-10"
              color={config.accentColor}
            />
            {config.animationsEnabled && (
              <div
                className="absolute inset-0 rounded-full blur-xl -z-10 animate-pulse"
                style={{ backgroundColor: `${hexToRgba(config.accentColor, 0.2)}` }}
              ></div>
            )}
          </div>
          <div className="text-left">
            <h1
              className="text-2xl md:text-3xl font-bold text-theme-gradient"
              style={{
                backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`
              }}
            >
              {config.companyName}
            </h1>
            <p
              className="text-xs md:text-sm font-light tracking-wider"
              style={{ color: hexToRgba(config.accentColor, 0.9) }}
            >
              {config.companyTagline}
            </p>
          </div>
        </motion.div>

        {/* Navigation - only show if not hidden */}
        {!hideNavigation && (
          <>
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="focus:outline-none transition-colors duration-300"
                style={{ color: config.accentColor }}
                aria-label="Toggle menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

            {/* Desktop navigation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="hidden md:flex items-center space-x-6"
            >
              {/* Main navigation links */}
              {[
                { view: 'home', label: 'Home' },
                { view: 'dashboard', label: 'My Dashboard', requiresAuth: true },
                { view: 'admin', label: 'Manage Assignments', requiresAuth: true }
              ]
                .filter(item => !item.requiresAuth || isAuthenticated)
                .map(({ view, label }) => (
                  <Link
                    key={view}
                    to={view === 'home' ? '/' : view === 'admin' ? '/manage-assignments' : view === 'dashboard' ? '/dashboard' : `/${view}`}
                    className={`relative px-4 py-2 transition-all duration-300 overflow-hidden group`}
                    style={{
                      color: currentView === view ? config.accentColor : config.darkMode ? '#ffffff' : '#333333',
                      textDecoration: 'none'
                    }}
                  >
                    <span className="relative z-10">{label}</span>
                    {currentView === view && (
                      <motion.span
                        layoutId="navHighlight"
                        className="absolute bottom-0 left-0 w-full h-0.5"
                        style={{
                          backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    <span
                      className="absolute bottom-0 left-0 w-full h-0 group-hover:h-full transition-all duration-300 -z-0"
                      style={{
                        backgroundImage: `linear-gradient(to right, ${hexToRgba(config.primaryColor, 0.1)}, ${hexToRgba(config.secondaryColor, 0.1)})`
                      }}
                    ></span>
                  </Link>
                ))}

              {/* Dark mode toggle button */}
              <motion.button
                onClick={toggleDarkMode}
                className="relative px-3 py-2 rounded-full transition-all duration-300 flex items-center justify-center overflow-hidden"
                style={{
                  background: hexToRgba(config.accentColor, 0.1),
                  color: config.accentColor,
                  border: `1px solid ${hexToRgba(config.accentColor, 0.2)}`
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

              {/* Authentication buttons */}
              {isLoading ? (
                // Loading state
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full animate-pulse"
                    style={{ background: hexToRgba(config.accentColor, 0.3) }}></div>
                  <div className="h-4 w-20 rounded animate-pulse"
                    style={{ background: hexToRgba(config.accentColor, 0.3) }}></div>
                </div>
              ) : isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  {/* User profile */}
                  <div className="flex items-center space-x-2">
                    {userImageUrl ? (
                      <img
                        src={userImageUrl}
                        alt={username || 'User'}
                        className="w-8 h-8 rounded-full border-2"
                        style={{ borderColor: config.accentColor }}
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                        style={{
                          background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`
                        }}
                      >
                        {username?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span
                      className="text-sm font-medium"
                      style={{ color: config.darkMode ? '#ffffff' : '#333333' }}
                    >
                      {username}
                    </span>
                  </div>

                  {/* Sign out button */}
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1 rounded-lg text-sm transition-all duration-300"
                    style={{
                      background: hexToRgba(config.accentColor, 0.2),
                      color: config.accentColor,
                      border: `1px solid ${hexToRgba(config.accentColor, 0.3)}`
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/sign-in"
                    className="px-4 py-1.5 rounded-lg text-sm transition-all duration-300"
                    style={{
                      background: 'transparent',
                      color: config.accentColor,
                      border: `1px solid ${hexToRgba(config.accentColor, 0.5)}`,
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/sign-up"
                    className="px-4 py-1.5 rounded-lg text-sm transition-all duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`,
                      color: '#ffffff',
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden backdrop-blur-md px-4 py-2 absolute top-full left-0 right-0"
                style={{
                  backgroundColor: hexToRgba(config.darkMode ? '#000000' : '#ffffff', 0.7),
                  borderTop: `1px solid ${hexToRgba(config.accentColor, 0.1)}`
                }}
              >
                <div className="flex flex-col space-y-3 py-3">
                  {/* Main navigation links */}
                  {[
                    { view: 'home', label: 'Home' },
                    { view: 'dashboard', label: 'My Dashboard', requiresAuth: true },
                    { view: 'admin', label: 'Manage Assignments', requiresAuth: true }
                  ]
                    .filter(item => !item.requiresAuth || isAuthenticated)
                    .map(({ view, label }) => (
                      <Link
                        key={view}
                        to={view === 'home' ? '/' : view === 'admin' ? '/manage-assignments' : view === 'dashboard' ? '/dashboard' : `/${view}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`transition-colors duration-300 text-left py-2 block`}
                        style={{
                          color: currentView === view ? config.accentColor : config.darkMode ? '#ffffff' : '#333333',
                          textDecoration: 'none'
                        }}
                      >
                        {label}
                      </Link>
                    ))}

                  {/* Dark mode toggle */}
                  <motion.button
                    onClick={toggleDarkMode}
                    className="flex items-center space-x-2 py-2 transition-colors duration-300 text-left"
                    style={{ color: config.accentColor }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      initial={false}
                      animate={{ rotate: config.darkMode ? 0 : 180 }}
                      transition={{ duration: 0.5, type: "spring" }}
                    >
                      {config.darkMode ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                    </motion.div>
                    <span>{config.darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
                  </motion.button>

                  {/* Divider */}
                  <div
                    className="my-2 h-px w-full"
                    style={{ background: hexToRgba(config.accentColor, 0.1) }}
                  ></div>

                  {/* Authentication options */}
                  {isLoading ? (
                    // Loading state
                    <div className="flex items-center space-x-2 py-2">
                      <div className="w-8 h-8 rounded-full animate-pulse"
                        style={{ background: hexToRgba(config.accentColor, 0.3) }}></div>
                      <div className="h-4 w-20 rounded animate-pulse"
                        style={{ background: hexToRgba(config.accentColor, 0.3) }}></div>
                    </div>
                  ) : isAuthenticated ? (
                    <>
                      {/* User info */}
                      <div className="flex items-center space-x-3 py-2">
                        {userImageUrl ? (
                          <img
                            src={userImageUrl}
                            alt={username || 'User'}
                            className="w-8 h-8 rounded-full border-2"
                            style={{ borderColor: config.accentColor }}
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                            style={{
                              background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`
                            }}
                          >
                            {username?.charAt(0) || 'U'}
                          </div>
                        )}
                        <span
                          className="text-sm font-medium"
                          style={{ color: config.darkMode ? '#ffffff' : '#333333' }}
                        >
                          {username}
                        </span>
                      </div>

                      {/* Sign out button */}
                      <button
                        onClick={() => {
                          handleSignOut();
                          setMobileMenuOpen(false);
                        }}
                        className="transition-colors duration-300 text-left py-2"
                        style={{ color: config.accentColor }}
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/sign-in"
                        onClick={() => setMobileMenuOpen(false)}
                        className="transition-colors duration-300 text-left py-2 block"
                        style={{
                          color: config.accentColor,
                          textDecoration: 'none'
                        }}
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/sign-up"
                        onClick={() => setMobileMenuOpen(false)}
                        className="transition-colors duration-300 text-left py-2 block"
                        style={{
                          color: config.darkMode ? '#ffffff' : '#333333',
                          fontWeight: 'bold',
                          textDecoration: 'none'
                        }}
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
