import React, { ReactNode, useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';
import { useConfiguration } from '../../context/ConfigurationContext';
import DatabaseStatusIndicator from '../common/DatabaseStatusIndicator';
import { hexToRgbString, hexToRgba } from '../../utils/colorUtils';
import { Analytics } from '@vercel/analytics/react';


interface LayoutProps {
  children?: ReactNode;
  hideNavigation?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, hideNavigation = false }) => {
  const { config } = useConfiguration();
  // Initialize sidebar as closed by default, will open on desktop based on path
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Handle window resize to detect mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);

      // Only auto-close on mobile if it was open
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  useEffect(() => {
    // Add stars to the background
    const createStars = () => {
      const starsContainer = document.getElementById('stars-container');
      if (starsContainer) {
        // Clear existing stars first
        starsContainer.innerHTML = '';

        // Only create stars if animations are enabled
        if (config.animationsEnabled) {
          for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.width = `${Math.random() * 2}px`;
            star.style.height = star.style.width;
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDuration = `${Math.random() * 10 + 10}s`;
            star.style.animationDelay = `${Math.random() * 10}s`;
            starsContainer.appendChild(star);
          }
        }
      }
    };

    createStars();
  }, [config.animationsEnabled]);

  // Using hexToRgbString from utils/colorUtils

  // Set RGB variables for CSS use
  useEffect(() => {
    const root = document.documentElement;
    try {
      root.style.setProperty('--primary-color-rgb', hexToRgbString(config.primaryColor));
      root.style.setProperty('--secondary-color-rgb', hexToRgbString(config.secondaryColor));
      root.style.setProperty('--accent-color-rgb', hexToRgbString(config.accentColor));
    } catch (error) {
      console.error('Error setting RGB variables:', error);
    }
  }, [config.primaryColor, config.secondaryColor, config.accentColor]);

  return (
    <div className={`min-h-screen flex flex-col bg-theme-gradient-vertical ${config.darkMode ? 'text-white' : 'text-gray-800'} relative overflow-hidden`}>
      {/* Stars background */}
      <div id="stars-container" className="fixed inset-0 z-0 overflow-hidden"></div>

      {/* Animated gradient orbs - only show if animations are enabled */}
      {config.animationsEnabled && (
        <>
          <div
            className="fixed top-1/4 -left-20 w-80 h-80 rounded-full blur-3xl animate-pulse-slow z-0"
            style={{ backgroundColor: `rgba(${hexToRgbString(config.secondaryColor)}, 0.2)` }}
          ></div>
          <div
            className="fixed bottom-1/4 -right-20 w-80 h-80 rounded-full blur-3xl animate-pulse-slow animation-delay-2000 z-0"
            style={{ backgroundColor: `rgba(${hexToRgbString(config.primaryColor)}, 0.2)` }}
          ></div>
        </>
      )}

      {/* Header - pass toggle function for sidebar */}
      <Header
        hideNavigation={hideNavigation}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Sidebar */}
      {!hideNavigation && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
        />
      )}

      {/* Main content - adjust padding when sidebar is open on desktop */}
      <main
        className={`flex-grow w-full z-10 transition-all duration-500 ${
          sidebarOpen && !isMobile ? 'lg:pl-64' : ''
        } relative`}
        style={{
          marginTop: '85px', // Margin to prevent header overlap
          paddingTop: '0', // Remove padding as we'll add it to the content container
        }}
      >
        {/* Futuristic content container with border */}
        <div
          className={`mx-auto ${sidebarOpen && !isMobile ? 'lg:container' : 'container'} relative mt-6 pt-6 px-4 md:px-6`}
          style={{
            background: config.darkMode
              ? 'rgba(15, 23, 42, 0.3)' // Dark mode background
              : 'rgba(255, 255, 255, 0.2)', // Light mode background
            borderTop: `1px solid ${hexToRgba(config.accentColor, 0.2)}`,
            borderLeft: `1px solid ${hexToRgba(config.accentColor, 0.1)}`,
            borderRight: `1px solid ${hexToRgba(config.accentColor, 0.1)}`,
            borderRadius: '8px 8px 0 0',
            backdropFilter: 'blur(8px)',
            boxShadow: `0 -5px 20px rgba(${hexToRgbString(config.accentColor)}, 0.05)`
          }}
        >
          {/* Futuristic corner accents for content area */}
          <div className="absolute top-0 left-0 w-5 h-5">
            <div className="absolute top-0 left-0 w-[1px] h-5" style={{ background: `linear-gradient(to bottom, ${hexToRgba(config.accentColor, 0.8)}, transparent)` }}></div>
            <div className="absolute top-0 left-0 h-[1px] w-5" style={{ background: `linear-gradient(to right, ${hexToRgba(config.accentColor, 0.8)}, transparent)` }}></div>
          </div>

          <div className="absolute top-0 right-0 w-5 h-5">
            <div className="absolute top-0 right-0 w-[1px] h-5" style={{ background: `linear-gradient(to bottom, ${hexToRgba(config.accentColor, 0.8)}, transparent)` }}></div>
            <div className="absolute top-0 right-0 h-[1px] w-5" style={{ background: `linear-gradient(to left, ${hexToRgba(config.accentColor, 0.8)}, transparent)` }}></div>
          </div>

          {children}
        </div>
      </main>

      <Footer />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: config.darkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            color: config.darkMode ? '#fff' : '#333',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '16px',
            boxShadow: `0 8px 30px rgba(0, 0, 0, 0.4), 0 0 10px rgba(${hexToRgbString(config.accentColor)}, 0.3)`,
            border: `1px solid rgba(${hexToRgbString(config.accentColor)}, 0.15)`,
            transform: 'translateY(-10px)',
            transition: 'all 0.3s ease-in-out',
          },
          success: {
            iconTheme: {
              primary: '#4ade80',
              secondary: config.darkMode ? '#0f172a' : '#ffffff',
            },
            style: {
              background: config.darkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
            }
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: config.darkMode ? '#0f172a' : '#ffffff',
            },
            style: {
              background: config.darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
            }
          },
          loading: {
            style: {
              background: config.darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
            }
          }
        }}
      />

      {/* Database status indicator */}
      <DatabaseStatusIndicator />

      {/* Vercel Analytics */}
      <Analytics />
    </div>
  );
};

export default Layout;
