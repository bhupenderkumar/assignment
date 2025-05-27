// src/lib/utils/ogUtils.ts - Utilities for Open Graph link generation

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
    return defaultValue;
  }
};

// Get app defaults for configuration
let appDefaults: any = null;
try {
  // Dynamically import to avoid circular dependencies
  import('../../context/ConfigurationContext').then(module => {
    appDefaults = module.getAppDefaults();
  });
} catch (error) {
  console.warn('Could not load app defaults, using fallback values');
}

// Fallback function to get base URL
const getBaseUrl = (): string => {
  return appDefaults?.appUrl || getEnvVar('REACT_APP_URL', 'https://interactive-assignment-one.vercel.app');
};

/**
 * Generate a shareable URL with Open Graph meta tags for social media
 * @param type - Type of content ('assignment' or 'share')
 * @param id - Assignment ID or shareable link
 * @returns URL that will show proper preview in social media
 */
export const generateOGUrl = (type: 'assignment' | 'share', id: string): string => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/og/${type}/${id}`;
};

/**
 * Generate a regular assignment URL (for internal navigation)
 * @param assignmentId - Assignment ID
 * @returns Regular assignment URL
 */
export const generateAssignmentUrl = (assignmentId: string): string => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/play/assignment/${assignmentId}`;
};

/**
 * Generate a regular shareable URL (for internal navigation)
 * @param shareableLink - Shareable link
 * @returns Regular shareable URL
 */
export const generateShareableUrl = (shareableLink: string): string => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/play/share/${shareableLink}`;
};

/**
 * Get the appropriate URL for sharing on social media
 * Use this when you want WhatsApp/Facebook/Twitter previews to work
 * @param type - Type of content ('assignment' or 'share')
 * @param id - Assignment ID or shareable link
 * @returns URL optimized for social media sharing
 */
export const getSocialShareUrl = (type: 'assignment' | 'share', id: string): string => {
  return generateOGUrl(type, id);
};

/**
 * Get the appropriate URL for direct navigation
 * Use this for internal app navigation
 * @param type - Type of content ('assignment' or 'share')
 * @param id - Assignment ID or shareable link
 * @returns URL for direct navigation
 */
export const getDirectUrl = (type: 'assignment' | 'share', id: string): string => {
  if (type === 'assignment') {
    return generateAssignmentUrl(id);
  } else {
    return generateShareableUrl(id);
  }
};

/**
 * Check if a URL is a social media crawler
 * @param userAgent - User agent string
 * @returns True if it's a social media crawler
 */
export const isSocialMediaCrawler = (userAgent: string): boolean => {
  const crawlers = [
    'facebookexternalhit',
    'Twitterbot',
    'WhatsApp',
    'LinkedInBot',
    'TelegramBot',
    'SkypeUriPreview',
    'SlackBot',
    'DiscordBot'
  ];

  return crawlers.some(crawler =>
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
};

// Fallback function to get default organization name
const getDefaultOrgName = (): string => {
  return appDefaults?.defaultOrganizationName || getEnvVar('REACT_APP_DEFAULT_ORG_NAME', 'Interactive Learning Platform');
};

/**
 * Generate meta tags object for a given assignment
 * @param assignment - Assignment data
 * @param organization - Organization data
 * @param type - Type of URL ('assignment' or 'share')
 * @param id - Assignment ID or shareable link
 * @returns Meta tags object
 */
export const generateMetaTags = (
  assignment: any,
  organization: any,
  type: 'assignment' | 'share',
  id: string
) => {
  const baseUrl = getBaseUrl();
  const url = type === 'assignment'
    ? `${baseUrl}/play/assignment/${assignment.id}`
    : `${baseUrl}/play/share/${id}`;

  const title = organization?.name
    ? `${organization.name} | ${assignment.title}`
    : `${assignment.title} | Interactive Assignment`;

  const description = assignment.description ||
    `Take the interactive assignment "${assignment.title}" ${organization?.name ? `from ${organization.name}` : ''}. Complete exercises, get instant feedback, and earn your certificate!`;

  const image = organization?.logo_url || `${baseUrl}/og-default.svg`;
  const siteName = organization?.name || getDefaultOrgName();

  return {
    title,
    description,
    url,
    siteName,
    image,
    imageAlt: `${assignment.title} - Educational Assignment`,
    type: 'website'
  };
};
