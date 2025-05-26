// src/lib/utils/ogUtils.ts - Utilities for Open Graph link generation

/**
 * Generate a shareable URL with Open Graph meta tags for social media
 * @param type - Type of content ('assignment' or 'share')
 * @param id - Assignment ID or shareable link
 * @returns URL that will show proper preview in social media
 */
export const generateOGUrl = (type: 'assignment' | 'share', id: string): string => {
  const baseUrl = 'https://interactive-assignment-one.vercel.app';
  return `${baseUrl}/og/${type}/${id}`;
};

/**
 * Generate a regular assignment URL (for internal navigation)
 * @param assignmentId - Assignment ID
 * @returns Regular assignment URL
 */
export const generateAssignmentUrl = (assignmentId: string): string => {
  const baseUrl = 'https://interactive-assignment-one.vercel.app';
  return `${baseUrl}/play/assignment/${assignmentId}`;
};

/**
 * Generate a regular shareable URL (for internal navigation)
 * @param shareableLink - Shareable link
 * @returns Regular shareable URL
 */
export const generateShareableUrl = (shareableLink: string): string => {
  const baseUrl = 'https://interactive-assignment-one.vercel.app';
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
  const baseUrl = 'https://interactive-assignment-one.vercel.app';
  const url = type === 'assignment'
    ? `${baseUrl}/play/assignment/${assignment.id}`
    : `${baseUrl}/play/share/${id}`;

  const title = organization?.name
    ? `${organization.name} | ${assignment.title}`
    : `${assignment.title} | Interactive Assignment`;

  const description = assignment.description ||
    `Take the interactive assignment "${assignment.title}" ${organization?.name ? `from ${organization.name}` : ''}. Complete exercises, get instant feedback, and earn your certificate!`;

  const image = organization?.logo_url || `${baseUrl}/og-default.svg`;
  const siteName = organization?.name || 'First Step School';

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
