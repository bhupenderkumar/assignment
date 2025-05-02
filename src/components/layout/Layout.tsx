import React, { ReactNode, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';
import { useConfiguration } from '../../context/ConfigurationContext';
import DatabaseStatusIndicator from '../common/DatabaseStatusIndicator';

interface LayoutProps {
  children?: ReactNode;
  hideNavigation?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, hideNavigation = false }) => {
  const { config } = useConfiguration();

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

  // Convert hex colors to RGB for CSS variables
  const hexToRgb = (hex: string) => {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `${r}, ${g}, ${b}`;
  };

  // Set RGB variables for CSS use
  useEffect(() => {
    const root = document.documentElement;
    try {
      root.style.setProperty('--primary-color-rgb', hexToRgb(config.primaryColor));
      root.style.setProperty('--secondary-color-rgb', hexToRgb(config.secondaryColor));
      root.style.setProperty('--accent-color-rgb', hexToRgb(config.accentColor));
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
            style={{ backgroundColor: `rgba(${hexToRgb(config.secondaryColor)}, 0.2)` }}
          ></div>
          <div
            className="fixed bottom-1/4 -right-20 w-80 h-80 rounded-full blur-3xl animate-pulse-slow animation-delay-2000 z-0"
            style={{ backgroundColor: `rgba(${hexToRgb(config.primaryColor)}, 0.2)` }}
          ></div>
        </>
      )}

      <Header hideNavigation={hideNavigation} />
      <main className="flex-grow w-full z-10 pt-20">
        <div className="container mx-auto px-4">
          {children}
        </div>
      </main>
      <Footer />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: config.darkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            color: config.darkMode ? '#fff' : '#333',
            padding: '16px',
            borderRadius: '10px',
            fontSize: '16px',
            boxShadow: `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 10px rgba(${hexToRgb(config.accentColor)}, 0.2)`,
            border: `1px solid rgba(${hexToRgb(config.accentColor)}, 0.1)`,
          },
          success: {
            iconTheme: {
              primary: '#4ade80',
              secondary: config.darkMode ? '#0f172a' : '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: config.darkMode ? '#0f172a' : '#ffffff',
            },
          },
        }}
      />

      {/* Database status indicator */}
      <DatabaseStatusIndicator />
    </div>
  );
};

export default Layout;
