import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import ConfigurableLogo from '../common/ConfigurableLogo';
import OrganizationSwitcher from '../organization/OrganizationSwitcher';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { hexToRgba } from '../../utils/colorUtils';
import { useTranslations } from '../../hooks/useTranslations';
import { useImageCache } from '../../utils/imageCache';

interface HeaderProps {
  onNavigate?: (view: string) => void;
  currentView?: string;
  hideNavigation?: boolean;
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = React.memo(({ onNavigate, hideNavigation = false, onToggleSidebar }) => {
  const [scrolled, setScrolled] = useState(false);
  const { config, updateConfig } = useConfiguration();
  const { isAuthenticated, username, userImageUrl, signOut, isLoading } = useSupabaseAuth();
  const { currentOrganization } = useOrganization();
  const { authTranslate } = useTranslations();
  const location = useLocation();

  // Use global image cache to prevent constant reloading
  const globalImageCache = useImageCache();
  const [cachedLogoUrl, setCachedLogoUrl] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState<boolean>(false);

  // Memoize organization data to prevent unnecessary re-renders
  const organizationData = useMemo(() => {
    if (!currentOrganization) return null;
    return {
      id: currentOrganization.id,
      name: currentOrganization.name,
      logoUrl: currentOrganization.logoUrl,
      headerText: currentOrganization.headerText
    };
  }, [currentOrganization?.id, currentOrganization?.name, currentOrganization?.logoUrl, currentOrganization?.headerText]);



  // Function to toggle dark mode
  const toggleDarkMode = () => {
    updateConfig({ darkMode: !config.darkMode });
  };
  const navigate = useNavigate();

  // Optimized image caching for organization logo using global cache
  useEffect(() => {
    if (!organizationData?.logoUrl) {
      setCachedLogoUrl(null);
      setLogoLoading(false);
      return;
    }

    const logoUrl = organizationData.logoUrl;

    // Check if image is already cached
    if (globalImageCache.isCached(logoUrl)) {
      setCachedLogoUrl(logoUrl);
      setLogoLoading(false);
      return;
    }

    // Check if image is currently loading
    if (globalImageCache.isLoading(logoUrl)) {
      setLogoLoading(true);
      // Wait for the existing loading promise
      globalImageCache.loadImage(logoUrl)
        .then(() => {
          setCachedLogoUrl(logoUrl);
          setLogoLoading(false);
        })
        .catch(() => {
          console.warn('Failed to load organization logo:', logoUrl);
          setCachedLogoUrl(null);
          setLogoLoading(false);
        });
      return;
    }

    // Load and cache the image
    setLogoLoading(true);
    globalImageCache.loadImage(logoUrl)
      .then(() => {
        setCachedLogoUrl(logoUrl);
        setLogoLoading(false);
      })
      .catch(() => {
        console.warn('Failed to load organization logo:', logoUrl);
        setCachedLogoUrl(null);
        setLogoLoading(false);
      });
  }, [organizationData?.logoUrl, globalImageCache]);

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
    if (view === 'dashboard') {
      // Direct link to dashboard
      url = '/dashboard';
    } else if (view === 'home') {
      // Redirect to dashboard if authenticated, otherwise to home
      url = isAuthenticated ? '/dashboard' : '/home';
    } else if (view === 'landing') {
      // Redirect to dashboard if authenticated, otherwise to landing page
      url = isAuthenticated ? '/dashboard' : '/';
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
    } else if (view === 'payment') {
      url = '/payment-demo';
    } else if (view === 'anonymous-users') {
      url = '/anonymous-users';
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
    // Redirect to landing page after sign out
    navigate('/');
  };

  // Removed problematic logging useEffect that was causing constant re-renders

  // Using hexToRgba from utils/colorUtils

  // Check if we're on the landing page
  const isLandingPage = location.pathname === '/';

  return (
    <header
      className={`w-full fixed top-0 z-50 transition-all duration-300 ${
        scrolled || !isLandingPage ? 'backdrop-blur-lg' : ''
      }`}
      style={{
        background: scrolled || !isLandingPage
          ? config.darkMode
            ? `linear-gradient(135deg, ${hexToRgba('#0F172A', 0.95)}, ${hexToRgba('#1E293B', 0.90)}, ${hexToRgba('#334155', 0.85)})` // Beautiful dark gradient with indigo tints
            : `linear-gradient(135deg, ${hexToRgba('#FFFFFF', 0.95)}, ${hexToRgba('#F8FAFC', 0.90)}, ${hexToRgba('#F1F5F9', 0.85)})` // Clean modern light gradient
          : 'transparent',
        boxShadow: scrolled || !isLandingPage
          ? config.darkMode
            ? `0 8px 32px ${hexToRgba(config.primaryColor, 0.3)}, 0 2px 16px ${hexToRgba(config.secondaryColor, 0.2)}`
            : `0 8px 32px ${hexToRgba(config.primaryColor, 0.15)}, 0 2px 16px ${hexToRgba('#000000', 0.1)}`
          : 'none',
        borderBottom: scrolled || !isLandingPage
          ? `1px solid ${hexToRgba(config.primaryColor, 0.2)}`
          : 'none'
      }}
    >
      {/* Beautiful modern accent lines */}
      {(scrolled || !isLandingPage) && (
        <>
          {/* Top accent line with gradient */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px] z-10"
            style={{
              background: `linear-gradient(90deg, transparent, ${hexToRgba(config.primaryColor, 0.6)}, ${hexToRgba(config.secondaryColor, 0.6)}, transparent)`
            }}
          ></div>

          {/* Bottom accent line with beautiful animation */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[1px] z-10"
            style={{
              background: `linear-gradient(90deg, transparent, ${hexToRgba(config.primaryColor, 0.4)}, ${hexToRgba(config.accentColor, 0.4)}, transparent)`,
              animation: 'shimmer 3s ease-in-out infinite'
            }}
          ></div>

          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 z-10">
            <div className="absolute top-0 left-0 w-[1px] h-4" style={{ background: hexToRgba(config.accentColor, 0.8) }}></div>
            <div className="absolute top-0 left-0 h-[1px] w-4" style={{ background: hexToRgba(config.accentColor, 0.8) }}></div>
          </div>

          <div className="absolute top-0 right-0 w-4 h-4 z-10">
            <div className="absolute top-0 right-0 w-[1px] h-4" style={{ background: hexToRgba(config.accentColor, 0.8) }}></div>
            <div className="absolute top-0 right-0 h-[1px] w-4" style={{ background: hexToRgba(config.accentColor, 0.8) }}></div>
          </div>
        </>
      )}

      <div className="container mx-auto flex justify-between items-center py-3 md:py-4 px-4">
        {/* Mobile-First Left section: Sidebar toggle and logo */}
        <div className="flex items-center">
          {/* Modern sidebar toggle with beautiful styling */}
          {!hideNavigation && (
            <button
              onClick={onToggleSidebar}
              className="focus:outline-none transition-all duration-300 mr-2 md:mr-3 p-2 rounded-xl hover:scale-105"
              style={{
                color: config.primaryColor,
                background: `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.1)}, ${hexToRgba(config.secondaryColor, 0.05)})`,
                border: `1px solid ${hexToRgba(config.primaryColor, 0.2)}`,
                boxShadow: `0 4px 12px ${hexToRgba(config.primaryColor, 0.15)}`
              }}
              aria-label="Toggle sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Mobile-optimized logo and company name */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-2 md:space-x-3 cursor-pointer group"
            onClick={() => isAuthenticated ? navigateWithUrl('dashboard') : navigateWithUrl('landing')}
          >
            <div className="relative">
              {organizationData && cachedLogoUrl ? (
                <div className="relative">
                  <img
                    src={cachedLogoUrl}
                    alt={organizationData.name}
                    className="h-7 w-7 md:h-10 md:w-10 rounded-xl object-cover border-2 transition-all duration-300 hover:scale-105"
                    style={{ borderColor: hexToRgba(config.primaryColor, 0.4) }}
                    loading="lazy"
                    onError={() => {
                      // Remove from cache if image fails to load
                      if (cachedLogoUrl) {
                        globalImageCache.removeFromCache(cachedLogoUrl);
                        setCachedLogoUrl(null);
                      }
                    }}
                  />
                  {config.animationsEnabled && (
                    <div
                      className="absolute inset-0 rounded-xl blur-xl -z-10 animate-pulse"
                      style={{
                        background: `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.3)}, ${hexToRgba(config.secondaryColor, 0.2)})`
                      }}
                    ></div>
                  )}
                </div>
              ) : logoLoading ? (
                <div className="relative">
                  {/* Loading placeholder */}
                  <div
                    className="h-7 w-7 md:h-10 md:w-10 rounded-xl border-2 animate-pulse flex items-center justify-center"
                    style={{
                      borderColor: hexToRgba(config.primaryColor, 0.4),
                      background: `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.1)}, ${hexToRgba(config.secondaryColor, 0.05)})`
                    }}
                  >
                    <div className="w-3 h-3 md:w-4 md:h-4 rounded-full animate-spin border-2 border-transparent border-t-current"
                         style={{ color: config.primaryColor }}></div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <ConfigurableLogo
                    logoType={config.companyLogo}
                    className="h-7 w-7 md:h-10 md:w-10 transition-all duration-300 hover:scale-105"
                    color={config.primaryColor}
                  />
                  {config.animationsEnabled && (
                    <div
                      className="absolute inset-0 rounded-xl blur-xl -z-10 animate-pulse"
                      style={{
                        background: `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.3)}, ${hexToRgba(config.secondaryColor, 0.2)})`
                      }}
                    ></div>
                  )}
                </div>
              )}
            </div>
            <div className="text-left">
              <h1
                className="text-base md:text-2xl font-bold text-theme-gradient"
                style={{
                  backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {organizationData ? organizationData.name : config.companyName}
              </h1>
              <p
                className="text-xs md:text-sm font-medium tracking-wider hidden sm:block"
                style={{
                  color: config.darkMode
                    ? hexToRgba(config.primaryColor, 0.8)
                    : hexToRgba(config.primaryColor, 0.7),
                  textShadow: `0 1px 2px ${hexToRgba(config.primaryColor, 0.2)}`
                }}
              >
                {organizationData?.headerText || "Modern Learning Platform"}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Mobile-First Right section */}
        {!hideNavigation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center space-x-1 md:space-x-3"
          >
            {/* Language Switcher - hidden on mobile */}
            <LanguageSwitcher variant="compact" className="hidden lg:block" />

            {/* Organization Switcher - mobile optimized */}
            {isAuthenticated && !isLoading && (
              <div className="hidden sm:block">
                <OrganizationSwitcher />
              </div>
            )}

            {/* Modern dark mode toggle with beautiful styling */}
            <motion.button
              onClick={toggleDarkMode}
              className="relative p-1.5 md:p-2 rounded-xl transition-all duration-300 flex items-center justify-center overflow-hidden hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.1)}, ${hexToRgba(config.secondaryColor, 0.05)})`,
                color: config.primaryColor,
                border: `1px solid ${hexToRgba(config.primaryColor, 0.2)}`,
                boxShadow: `0 4px 12px ${hexToRgba(config.primaryColor, 0.15)}`
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </motion.div>
            </motion.button>

            {/* Mobile-optimized user profile and authentication */}
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg animate-pulse"
                  style={{ background: hexToRgba(config.accentColor, 0.3) }}></div>
              </div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-1 md:space-x-2">
                {/* Modern user profile with beautiful styling */}
                <div className="flex items-center space-x-1 md:space-x-2 px-1 md:px-2 py-1 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.1)}, ${hexToRgba(config.secondaryColor, 0.05)})`,
                    border: `1px solid ${hexToRgba(config.primaryColor, 0.15)}`
                  }}>
                  {userImageUrl ? (
                    <img
                      src={userImageUrl}
                      alt={username || 'User'}
                      className="w-6 h-6 md:w-8 md:h-8 rounded-xl border-2 transition-all duration-300 hover:scale-105"
                      style={{ borderColor: hexToRgba(config.primaryColor, 0.4) }}
                    />
                  ) : (
                    <div
                      className="w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-white text-xs md:text-sm transition-all duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`
                      }}
                    >
                      {username?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span
                    className="text-xs md:text-sm font-medium hidden lg:inline"
                    style={{ color: config.darkMode ? '#ffffff' : '#333333' }}
                  >
                    {username}
                  </span>
                </div>

                {/* Modern sign out button */}
                <button
                  onClick={handleSignOut}
                  className="p-1.5 md:px-3 md:py-2 rounded-xl text-xs md:text-sm transition-all duration-300 flex items-center space-x-1 hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.1)}, ${hexToRgba(config.secondaryColor, 0.05)})`,
                    color: config.primaryColor,
                    border: `1px solid ${hexToRgba(config.primaryColor, 0.2)}`,
                    boxShadow: `0 4px 12px ${hexToRgba(config.primaryColor, 0.15)}`
                  }}
                  title="Sign Out"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden lg:inline">{authTranslate('signOut')}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1 md:space-x-2">
                <Link
                  to="/sign-in"
                  className="px-2 py-1.5 md:px-3 md:py-2 rounded-xl text-xs md:text-sm transition-all duration-300 flex items-center space-x-1 hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.1)}, ${hexToRgba(config.secondaryColor, 0.05)})`,
                    color: config.primaryColor,
                    border: `1px solid ${hexToRgba(config.primaryColor, 0.2)}`,
                    boxShadow: `0 4px 12px ${hexToRgba(config.primaryColor, 0.15)}`,
                    textDecoration: 'none'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden md:inline">{authTranslate('signIn')}</span>
                </Link>
                <Link
                  to="/sign-up"
                  className="px-2 py-1.5 md:px-3 md:py-2 rounded-xl text-xs md:text-sm transition-all duration-300 flex items-center space-x-1 font-semibold hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`,
                    color: '#ffffff',
                    textDecoration: 'none',
                    boxShadow: `0 6px 20px ${hexToRgba(config.primaryColor, 0.4)}`,
                    transform: 'translateY(0)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 8px 25px ${hexToRgba(config.primaryColor, 0.5)}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 6px 20px ${hexToRgba(config.primaryColor, 0.4)}`;
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span className="hidden md:inline">Try Free</span>
                  <span className="md:hidden">Free</span>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </header>
  );
});

export default Header;
