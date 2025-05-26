import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

// Define the configuration type
export interface AppConfiguration {
  // Company/Organization Info
  companyName: string;
  companyTagline: string;
  companyLogo: string; // URL or SVG string

  // Theme Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;

  // UI Settings
  darkMode: boolean;
  animationsEnabled: boolean;

  // Footer Settings
  footerLinks: {
    title: string;
    links: { label: string; url: string }[];
  }[];
  footerText: string;
}

// Default configuration
const defaultConfiguration: AppConfiguration = {
  companyName: 'First Step School',
  companyTagline: 'EXPLORE · LEARN · MASTER',
  companyLogo: 'star', // Default icon key (we'll use a switch statement to render the right icon)

  primaryColor: '#10b981', // emerald-500
  secondaryColor: '#8b5cf6', // violet-500
  accentColor: '#f59e0b', // amber-500

  darkMode: false, // Changed to false for better readability
  animationsEnabled: true,

  footerLinks: [
    {
      title: 'Quick Links',
      links: [
        { label: 'Home', url: '#' },
        { label: 'Assignments', url: '#' },
        { label: 'Progress', url: '#' }
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', url: '#' },
        { label: 'Privacy Policy', url: '#' },
        { label: 'Terms of Service', url: '#' }
      ]
    }
  ],
  footerText: `© ${new Date().getFullYear()} First Step School. All rights reserved.`
};

// Create the context
interface ConfigurationContextType {
  config: AppConfiguration;
  updateConfig: (newConfig: Partial<AppConfiguration>) => void;
  resetConfig: () => void;
}

const ConfigurationContext = createContext<ConfigurationContextType | undefined>(undefined);

// Provider component
interface ConfigurationProviderProps {
  children: ReactNode;
  initialConfig?: Partial<AppConfiguration>;
}

export const ConfigurationProvider: React.FC<ConfigurationProviderProps> = ({
  children,
  initialConfig = {}
}) => {
  // Try to load config from localStorage
  const loadSavedConfig = (): AppConfiguration => {
    try {
      const savedConfig = localStorage.getItem('appConfiguration');
      if (savedConfig) {
        return { ...defaultConfiguration, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      console.error('Failed to load saved configuration:', error);
    }
    return { ...defaultConfiguration, ...initialConfig };
  };

  const [config, setConfig] = useState<AppConfiguration>(loadSavedConfig);

  // Update configuration - memoized with useCallback to prevent infinite loops
  const updateConfig = useCallback((newConfig: Partial<AppConfiguration>) => {
    setConfig(prevConfig => {
      const updatedConfig = { ...prevConfig, ...newConfig };
      // Save to localStorage
      try {
        localStorage.setItem('appConfiguration', JSON.stringify(updatedConfig));
      } catch (error) {
        console.error('Failed to save configuration:', error);
      }
      return updatedConfig;
    });
  }, []);

  // Reset to default - also memoized with useCallback
  const resetConfig = useCallback(() => {
    setConfig(defaultConfiguration);
    try {
      localStorage.removeItem('appConfiguration');
    } catch (error) {
      console.error('Failed to reset configuration:', error);
    }
  }, []);

  // Apply CSS variables for theme colors
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', config.primaryColor);
    root.style.setProperty('--secondary-color', config.secondaryColor);
    root.style.setProperty('--accent-color', config.accentColor);

    // Set text color based on dark mode
    root.style.setProperty('--text-color', config.darkMode ? '#ffffff' : '#1f2937');

    // Set background colors based on dark mode
    if (config.darkMode) {
      // Dark mode background colors
      root.style.setProperty('--background-start', 'var(--dark-background-start)');
      root.style.setProperty('--background-middle', 'var(--dark-background-middle)');
      root.style.setProperty('--background-end', 'var(--dark-background-end)');

      // Dark mode card and UI colors
      root.style.setProperty('--card-bg', 'rgba(15, 23, 42, 0.6)');
      root.style.setProperty('--card-border', 'rgba(30, 41, 59, 0.3)');
      root.style.setProperty('--card-shadow', 'rgba(0, 0, 0, 0.4)');
      root.style.setProperty('--card-hover-shadow', 'rgba(0, 0, 0, 0.5)');

      // Add dark theme class to body
      document.body.classList.add('dark-theme');
    } else {
      // Light mode background colors
      root.style.setProperty('--background-start', 'var(--light-background-start)');
      root.style.setProperty('--background-middle', 'var(--light-background-middle)');
      root.style.setProperty('--background-end', 'var(--light-background-end)');

      // Light mode card and UI colors
      root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.8)');
      root.style.setProperty('--card-border', 'rgba(6, 182, 212, 0.1)');
      root.style.setProperty('--card-shadow', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--card-hover-shadow', 'rgba(0, 0, 0, 0.2)');

      // Remove dark theme class from body
      document.body.classList.remove('dark-theme');
    }
  }, [config]);

  return (
    <ConfigurationContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </ConfigurationContext.Provider>
  );
};

// Custom hook for using the configuration
export const useConfiguration = () => {
  const context = useContext(ConfigurationContext);
  if (context === undefined) {
    throw new Error('useConfiguration must be used within a ConfigurationProvider');
  }
  return context;
};
