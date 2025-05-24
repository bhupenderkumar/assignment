// src/lib/utils/securityUtils.ts
import DOMPurify from 'dompurify';

/**
 * Security utilities for input validation and sanitization
 */

// File type validation mappings
const ALLOWED_FILE_TYPES = {
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/m4a'],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'text/plain']
};

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  audio: 10 * 1024 * 1024, // 10MB
  image: 5 * 1024 * 1024,  // 5MB
  document: 2 * 1024 * 1024 // 2MB
};

// File signature validation (magic numbers)
const FILE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'audio/mpeg': [0xFF, 0xFB],
  'audio/wav': [0x52, 0x49, 0x46, 0x46],
  'application/pdf': [0x25, 0x50, 0x44, 0x46]
};

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove any script tags and dangerous content
  const sanitized = DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
  
  return sanitized;
};

/**
 * Sanitize HTML content for safe rendering
 */
export const sanitizeHTML = (html: string): string => {
  if (!html || typeof html !== 'string') return '';
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['class']
  });
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate file based on type, size, and signature
 */
export const validateFile = async (file: File, expectedType: 'audio' | 'image' | 'document'): Promise<{ isValid: boolean; errors: string[] }> => {
  const errors: string[] = [];
  
  // Check file type
  const allowedTypes = ALLOWED_FILE_TYPES[expectedType];
  if (!allowedTypes.includes(file.type)) {
    errors.push(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  // Check file size
  const maxSize = FILE_SIZE_LIMITS[expectedType];
  if (file.size > maxSize) {
    errors.push(`File size too large. Maximum size: ${(maxSize / (1024 * 1024)).toFixed(1)}MB`);
  }
  
  // Check file signature
  try {
    const isValidSignature = await validateFileSignature(file);
    if (!isValidSignature) {
      errors.push('File signature validation failed. File may be corrupted or malicious.');
    }
  } catch (error) {
    errors.push('Unable to validate file signature');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate file signature by reading the first few bytes
 */
export const validateFileSignature = async (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      if (!arrayBuffer) {
        resolve(false);
        return;
      }
      
      const uint8Array = new Uint8Array(arrayBuffer);
      const signature = FILE_SIGNATURES[file.type as keyof typeof FILE_SIGNATURES];
      
      if (!signature) {
        resolve(true); // If we don't have a signature for this type, allow it
        return;
      }
      
      // Check if the file starts with the expected signature
      const matches = signature.every((byte, index) => uint8Array[index] === byte);
      resolve(matches);
    };
    
    reader.onerror = () => resolve(false);
    
    // Read only the first 8 bytes for signature validation
    reader.readAsArrayBuffer(file.slice(0, 8));
  });
};

/**
 * Validate URL format and prevent malicious URLs
 */
export const validateURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

/**
 * Escape HTML entities to prevent XSS
 */
export const escapeHTML = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Validate organization name
 */
export const validateOrganizationName = (name: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const sanitizedName = sanitizeInput(name);
  
  if (!sanitizedName || sanitizedName.length < 2) {
    errors.push('Organization name must be at least 2 characters long');
  }
  
  if (sanitizedName.length > 100) {
    errors.push('Organization name must be less than 100 characters');
  }
  
  // Check for potentially malicious content
  if (/<script|javascript:|data:|vbscript:/i.test(name)) {
    errors.push('Organization name contains invalid content');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(identifier, validAttempts);
    
    return true;
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

/**
 * Generate secure random string
 */
export const generateSecureToken = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Validate assignment content for security
 */
export const validateAssignmentContent = (content: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  try {
    // Ensure content is valid JSON
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr);
    
    // Check for potentially dangerous content
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i
    ];
    
    const hasXSS = dangerousPatterns.some(pattern => pattern.test(contentStr));
    if (hasXSS) {
      errors.push('Assignment content contains potentially dangerous scripts');
    }
    
    // Validate structure if it's an object
    if (typeof parsed === 'object' && parsed !== null) {
      // Add specific validation rules for assignment structure
      if (parsed.exercises && Array.isArray(parsed.exercises)) {
        parsed.exercises.forEach((exercise: any, index: number) => {
          if (exercise.questionText && typeof exercise.questionText === 'string') {
            const sanitized = sanitizeInput(exercise.questionText);
            if (sanitized !== exercise.questionText) {
              errors.push(`Exercise ${index + 1} contains potentially unsafe content`);
            }
          }
        });
      }
    }
    
  } catch (error) {
    errors.push('Invalid assignment content format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
