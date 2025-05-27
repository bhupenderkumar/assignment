// src/config/appConfig.ts - Application configuration constants

/**
 * Application Configuration
 * 
 * This file contains the default configuration for the application.
 * You can modify these values to customize the default organization
 * and app-level settings.
 * 
 * These values will be used when:
 * - No organization is selected
 * - As fallbacks throughout the application
 * - For SEO and social media meta tags
 */

export interface AppConfig {
  // Default organization info when no organization is selected
  defaultOrganization: {
    name: string;
    tagline: string;
    logo: string;
  };
  
  // App-level branding
  app: {
    name: string;
    description: string;
    url: string;
    author: string;
    twitterHandle: string;
  };
  
  // Default theme colors
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
}

/**
 * Default Application Configuration
 * 
 * Modify these values to customize your application defaults.
 * 
 * Example for "First Step School":
 * 
 * export const APP_CONFIG: AppConfig = {
 *   defaultOrganization: {
 *     name: 'First Step School',
 *     tagline: 'Building Tomorrow\'s Leaders',
 *     logo: 'school'
 *   },
 *   app: {
 *     name: 'First Step School Platform',
 *     description: 'Interactive Learning Platform for First Step School',
 *     url: 'https://your-domain.com',
 *     author: 'First Step School',
 *     twitterHandle: '@FirstStepSchool'
 *   },
 *   theme: {
 *     primaryColor: '#3B82F6',
 *     secondaryColor: '#6366F1',
 *     accentColor: '#10B981'
 *   }
 * };
 */
export const APP_CONFIG: AppConfig = {
  defaultOrganization: {
    name: 'Interactive Learning Platform',
    tagline: 'EXPLORE · LEARN · MASTER',
    logo: 'star'
  },
  
  app: {
    name: 'Interactive Assignments',
    description: 'Modern Interactive Learning Platform',
    url: 'https://interactive-assignment-one.vercel.app',
    author: 'Interactive Learning Platform',
    twitterHandle: '@InteractiveLearning'
  },
  
  theme: {
    primaryColor: '#6366F1',
    secondaryColor: '#EC4899',
    accentColor: '#10B981'
  }
};

/**
 * Get configuration value with environment variable override
 * This function checks for environment variables first, then falls back to the config file
 */
export const getConfigValue = (envKey: string, configValue: string): string => {
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // In browser, check for Vite environment variables
      const viteVar = (window as any).__VITE_ENV__?.[envKey];
      if (viteVar) return viteVar;
      
      // Check for injected environment variables
      const injectedVar = (window as any).__ENV__?.[envKey];
      if (injectedVar) return injectedVar;
    }
    
    // Check for process.env if available (build time)
    if (typeof process !== 'undefined' && process.env) {
      const envVar = process.env[envKey];
      if (envVar) return envVar;
    }
    
    // Return config file value
    return configValue;
  } catch (error) {
    // Return config file value as fallback
    return configValue;
  }
};

/**
 * Get the final app configuration with environment variable overrides
 */
export const getFinalAppConfig = (): AppConfig => {
  return {
    defaultOrganization: {
      name: getConfigValue('REACT_APP_DEFAULT_ORG_NAME', APP_CONFIG.defaultOrganization.name),
      tagline: getConfigValue('REACT_APP_DEFAULT_ORG_TAGLINE', APP_CONFIG.defaultOrganization.tagline),
      logo: getConfigValue('REACT_APP_DEFAULT_ORG_LOGO', APP_CONFIG.defaultOrganization.logo)
    },
    
    app: {
      name: getConfigValue('REACT_APP_NAME', APP_CONFIG.app.name),
      description: getConfigValue('REACT_APP_DESCRIPTION', APP_CONFIG.app.description),
      url: getConfigValue('REACT_APP_URL', APP_CONFIG.app.url),
      author: getConfigValue('REACT_APP_AUTHOR', APP_CONFIG.app.author),
      twitterHandle: getConfigValue('REACT_APP_TWITTER_HANDLE', APP_CONFIG.app.twitterHandle)
    },
    
    theme: {
      primaryColor: getConfigValue('REACT_APP_DEFAULT_PRIMARY_COLOR', APP_CONFIG.theme.primaryColor),
      secondaryColor: getConfigValue('REACT_APP_DEFAULT_SECONDARY_COLOR', APP_CONFIG.theme.secondaryColor),
      accentColor: getConfigValue('REACT_APP_DEFAULT_ACCENT_COLOR', APP_CONFIG.theme.accentColor)
    }
  };
};
