import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { getFinalAppConfig } from '../config/appConfig';

// Define the app-level configuration type
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

// Define the global app defaults (can be overridden by environment variables)
export interface AppDefaults {
  // Default organization info when no organization is selected
  defaultOrganizationName: string;
  defaultOrganizationTagline: string;
  defaultOrganizationLogo: string;

  // App-level branding
  appName: string;
  appDescription: string;
  appUrl: string;
  appAuthor: string;
  appTwitterHandle: string;

  // Default theme
  defaultPrimaryColor: string;
  defaultSecondaryColor: string;
  defaultAccentColor: string;
}

// Safe environment variable access
const getEnvVar = (key: string, defaultValue: string): string => {
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // In browser, check for Vite environment variables
      const viteVar = (window as any).__VITE_ENV__?.[key];
      if (viteVar) return viteVar;

      // Check for injected environment variables
      const injectedVar = (window as any).__ENV__?.[key];
      if (injectedVar) return injectedVar;
    }

    // Check for process.env if available (build time)
    if (typeof process !== 'undefined' && process.env) {
      const envVar = process.env[key];
      if (envVar) return envVar;
    }

    // Return default value
    return defaultValue;
  } catch (error) {
    console.warn(`Failed to access environment variable ${key}, using default:`, defaultValue);
    return defaultValue;
  }
};

// Environment-based app defaults
const createAppDefaults = (): AppDefaults => {
  return {
    // Default organization info
    defaultOrganizationName: getEnvVar('REACT_APP_DEFAULT_ORG_NAME', 'Interactive Learning Platform'),
    defaultOrganizationTagline: getEnvVar('REACT_APP_DEFAULT_ORG_TAGLINE', 'EXPLORE · LEARN · MASTER'),
    defaultOrganizationLogo: getEnvVar('REACT_APP_DEFAULT_ORG_LOGO', 'star'),

    // App-level branding
    appName: getEnvVar('REACT_APP_NAME', 'Interactive Assignments'),
    appDescription: getEnvVar('REACT_APP_DESCRIPTION', 'Modern Interactive Learning Platform'),
    appUrl: getEnvVar('REACT_APP_URL', 'https://interactive-assignment-one.vercel.app'),
    appAuthor: getEnvVar('REACT_APP_AUTHOR', 'Interactive Learning Platform'),
    appTwitterHandle: getEnvVar('REACT_APP_TWITTER_HANDLE', '@InteractiveLearning'),

    // Default theme colors
    defaultPrimaryColor: getEnvVar('REACT_APP_DEFAULT_PRIMARY_COLOR', '#6366F1'),
    defaultSecondaryColor: getEnvVar('REACT_APP_DEFAULT_SECONDARY_COLOR', '#EC4899'),
    defaultAccentColor: getEnvVar('REACT_APP_DEFAULT_ACCENT_COLOR', '#10B981'),
  };
};

// Get app defaults
const appDefaults = createAppDefaults();

// Default configuration - Uses app defaults and can be overridden by organization settings
const defaultConfiguration: AppConfiguration = {
  companyName: appDefaults.defaultOrganizationName,
  companyTagline: appDefaults.defaultOrganizationTagline,
  companyLogo: appDefaults.defaultOrganizationLogo,

  // Modern, beautiful and accessible color palette
  primaryColor: appDefaults.defaultPrimaryColor,
  secondaryColor: appDefaults.defaultSecondaryColor,
  accentColor: appDefaults.defaultAccentColor,

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
  footerText: `© ${new Date().getFullYear()} ${appDefaults.defaultOrganizationName}. All rights reserved.`
};

// Create the context
interface ConfigurationContextType {
  config: AppConfiguration;
  appDefaults: AppDefaults;
  updateConfig: (newConfig: Partial<AppConfiguration>) => void;
  resetConfig: () => void;
  resetToDefaults: () => void;
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

  // Reset to app defaults (ignoring any organization overrides)
  const resetToDefaults = useCallback(() => {
    const defaultsConfig: AppConfiguration = {
      companyName: appDefaults.defaultOrganizationName,
      companyTagline: appDefaults.defaultOrganizationTagline,
      companyLogo: appDefaults.defaultOrganizationLogo,
      primaryColor: appDefaults.defaultPrimaryColor,
      secondaryColor: appDefaults.defaultSecondaryColor,
      accentColor: appDefaults.defaultAccentColor,
      darkMode: false,
      animationsEnabled: true,
      footerLinks: defaultConfiguration.footerLinks,
      footerText: `© ${new Date().getFullYear()} ${appDefaults.defaultOrganizationName}. All rights reserved.`
    };

    setConfig(defaultsConfig);
    try {
      localStorage.setItem('appConfiguration', JSON.stringify(defaultsConfig));
    } catch (error) {
      console.error('Failed to save default configuration:', error);
    }
  }, []);

  // Apply CSS variables for theme colors
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', config.primaryColor);
    root.style.setProperty('--secondary-color', config.secondaryColor);
    root.style.setProperty('--accent-color', config.accentColor);

    // Set modern text colors with good contrast
    root.style.setProperty('--text-color', config.darkMode ? '#F8FAFC' : '#1F2937');
    root.style.setProperty('--text-color-secondary', config.darkMode ? '#CBD5E1' : '#4B5563');
    root.style.setProperty('--text-color-muted', config.darkMode ? '#94A3B8' : '#6B7280');

    // Set background colors based on dark mode
    if (config.darkMode) {
      // Beautiful dark mode with gradient backgrounds
      root.style.setProperty('--background-start', 'var(--dark-background-start)');
      root.style.setProperty('--background-middle', 'var(--dark-background-middle)');
      root.style.setProperty('--background-end', 'var(--dark-background-end)');

      // Dark mode card and UI colors with modern styling
      root.style.setProperty('--card-bg', 'rgba(30, 41, 59, 0.8)');
      root.style.setProperty('--card-border', 'rgba(99, 102, 241, 0.2)');
      root.style.setProperty('--card-shadow', 'rgba(0, 0, 0, 0.3)');
      root.style.setProperty('--card-hover-shadow', 'rgba(99, 102, 241, 0.3)');
      root.style.setProperty('--card-hover-border', 'rgba(99, 102, 241, 0.4)');
      root.style.setProperty('--card-hover-glow', 'rgba(99, 102, 241, 0.2)');

      // Add dark theme class to body
      document.body.classList.add('dark-theme');
    } else {
      // Clean, modern light mode
      root.style.setProperty('--background-start', 'var(--light-background-start)');
      root.style.setProperty('--background-middle', 'var(--light-background-middle)');
      root.style.setProperty('--background-end', 'var(--light-background-end)');

      // Light mode card and UI colors with modern styling
      root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.9)');
      root.style.setProperty('--card-border', 'rgba(99, 102, 241, 0.1)');
      root.style.setProperty('--card-shadow', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--card-hover-shadow', 'rgba(99, 102, 241, 0.2)');
      root.style.setProperty('--card-hover-border', 'rgba(99, 102, 241, 0.3)');
      root.style.setProperty('--card-hover-glow', 'rgba(99, 102, 241, 0.15)');

      // Remove dark theme class from body
      document.body.classList.remove('dark-theme');
    }
  }, [config]);

  return (
    <ConfigurationContext.Provider value={{ config, appDefaults, updateConfig, resetConfig, resetToDefaults }}>
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

// Export app defaults for use in other components
export { appDefaults };

// Utility function to get app defaults (can be used outside of React components)
export const getAppDefaults = () => appDefaults;
