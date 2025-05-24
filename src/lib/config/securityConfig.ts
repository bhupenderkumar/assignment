// src/lib/config/securityConfig.ts

/**
 * Security configuration and environment variable validation
 * This file centralizes security settings and validates environment variables
 */

// Security configuration constants
export const SECURITY_CONFIG = {
  // Rate limiting
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
  API_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  API_RATE_LIMIT_MAX_REQUESTS: 100,
  
  // File upload limits
  MAX_FILE_SIZE: {
    AUDIO: 10 * 1024 * 1024, // 10MB
    IMAGE: 5 * 1024 * 1024,  // 5MB
    DOCUMENT: 2 * 1024 * 1024 // 2MB
  },
  
  // Content validation
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_ORGANIZATION_NAME_LENGTH: 100,
  
  // Session security
  SESSION_TIMEOUT_MS: 24 * 60 * 60 * 1000, // 24 hours
  IDLE_TIMEOUT_MS: 2 * 60 * 60 * 1000, // 2 hours
  
  // Password policy
  MIN_PASSWORD_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  
  // Content Security Policy
  CSP_DIRECTIVES: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    'img-src': ["'self'", "data:", "https:", "blob:"],
    'font-src': ["'self'", "https://fonts.gstatic.com"],
    'connect-src': ["'self'", "https://*.supabase.co", "https://*.supabase.in", "wss://*.supabase.co", "wss://*.supabase.in"],
    'media-src': ["'self'", "blob:", "data:"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"]
  }
};

// Environment variable validation
interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Validate and get environment configuration
 */
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const nodeEnv = import.meta.env.MODE;

  // Validate required environment variables
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL environment variable is required');
  }

  if (!supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY environment variable is required');
  }

  // Validate Supabase URL format
  if (!isValidSupabaseUrl(supabaseUrl)) {
    throw new Error('Invalid VITE_SUPABASE_URL format');
  }

  // Validate Supabase anon key format (should be a JWT)
  if (!isValidJWT(supabaseAnonKey)) {
    console.warn('VITE_SUPABASE_ANON_KEY does not appear to be a valid JWT');
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production'
  };
};

/**
 * Validate Supabase URL format
 */
const isValidSupabaseUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' && 
           urlObj.hostname.includes('supabase') &&
           urlObj.hostname.endsWith('.co');
  } catch {
    return false;
  }
};

/**
 * Basic JWT format validation
 */
const isValidJWT = (token: string): boolean => {
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
};

/**
 * Allowed file types for uploads
 */
export const ALLOWED_FILE_TYPES = {
  audio: [
    'audio/mpeg',
    'audio/wav', 
    'audio/ogg',
    'audio/mp3',
    'audio/m4a',
    'audio/aac'
  ],
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ],
  document: [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
};

/**
 * Dangerous content patterns to check for
 */
export const DANGEROUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /data:text\/html/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /onmouseover\s*=/gi,
  /<iframe[^>]*>/gi,
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<form[^>]*>/gi
];

/**
 * Trusted domains for external resources
 */
export const TRUSTED_DOMAINS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'supabase.co',
  'supabase.in'
];

/**
 * Check if a URL is from a trusted domain
 */
export const isTrustedDomain = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return TRUSTED_DOMAINS.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
};

/**
 * Generate Content Security Policy string
 */
export const generateCSP = (): string => {
  return Object.entries(SECURITY_CONFIG.CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

/**
 * Security audit configuration
 */
export const AUDIT_CONFIG = {
  // Events to log
  LOGGED_EVENTS: [
    'LOGIN_SUCCESS',
    'LOGIN_FAILURE', 
    'LOGOUT',
    'PASSWORD_CHANGE',
    'ASSIGNMENT_CREATE',
    'ASSIGNMENT_UPDATE',
    'ASSIGNMENT_DELETE',
    'ORGANIZATION_CREATE',
    'ORGANIZATION_UPDATE',
    'FILE_UPLOAD',
    'PERMISSION_DENIED',
    'RATE_LIMIT_EXCEEDED'
  ],
  
  // Retention period for audit logs
  LOG_RETENTION_DAYS: 90,
  
  // Critical events that require immediate attention
  CRITICAL_EVENTS: [
    'MULTIPLE_LOGIN_FAILURES',
    'PERMISSION_ESCALATION_ATTEMPT',
    'SUSPICIOUS_FILE_UPLOAD',
    'SQL_INJECTION_ATTEMPT',
    'XSS_ATTEMPT'
  ]
};

/**
 * Database security settings
 */
export const DB_SECURITY_CONFIG = {
  // Connection settings
  MAX_CONNECTIONS: 20,
  CONNECTION_TIMEOUT_MS: 30000,
  IDLE_TIMEOUT_MS: 300000,
  
  // Query settings
  MAX_QUERY_TIME_MS: 30000,
  MAX_ROWS_RETURNED: 1000,
  
  // RLS enforcement
  ENFORCE_RLS: true,
  REQUIRE_AUTH_FOR_MUTATIONS: true
};

/**
 * Initialize security configuration
 */
export const initializeSecurity = (): void => {
  // Validate environment
  try {
    getEnvironmentConfig();
    console.log('✅ Environment configuration validated');
  } catch (error) {
    console.error('❌ Environment configuration validation failed:', error);
    throw error;
  }
  
  // Set up CSP if in browser environment
  if (typeof document !== 'undefined') {
    const csp = generateCSP();
    const metaTag = document.createElement('meta');
    metaTag.httpEquiv = 'Content-Security-Policy';
    metaTag.content = csp;
    document.head.appendChild(metaTag);
  }
  
  // Log security initialization
  console.log('🔒 Security configuration initialized');
};

/**
 * Runtime security checks
 */
export const performSecurityChecks = (): { passed: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  // Check if running in development with production data
  const config = getEnvironmentConfig();
  if (config.isDevelopment && config.supabaseUrl.includes('supabase.co')) {
    issues.push('Development mode detected with production Supabase URL');
  }
  
  // Check for console.log statements in production
  if (config.isProduction && typeof console.log === 'function') {
    // In production, console.log should be disabled or limited
    console.warn('Console logging is enabled in production');
  }
  
  // Check for exposed sensitive data
  if (typeof window !== 'undefined') {
    const sensitiveKeys = ['password', 'secret', 'key', 'token'];
    const exposedData = Object.keys(window).filter(key => 
      sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
    );
    
    if (exposedData.length > 0) {
      issues.push(`Potentially sensitive data exposed on window: ${exposedData.join(', ')}`);
    }
  }
  
  return {
    passed: issues.length === 0,
    issues
  };
};
