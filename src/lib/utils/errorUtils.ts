// src/lib/utils/errorUtils.ts

/**
 * Handles Supabase errors and returns a user-friendly error message
 * @param error The error object from Supabase
 * @returns A user-friendly error message
 */
export const handleSupabaseError = (error: any): string => {
  console.error('Supabase error:', error);
  
  // If it's a Supabase error with a message
  if (error?.message) {
    return error.message;
  }
  
  // If it's a Supabase error with details
  if (error?.error_description) {
    return error.error_description;
  }
  
  // If it's a Supabase error with code and details
  if (error?.code && error?.details) {
    return `${error.code}: ${error.details}`;
  }
  
  // If it's a PostgreSQL error
  if (error?.code && error?.message && error?.hint) {
    return `Database error: ${error.message}. ${error.hint}`;
  }
  
  // If it's a network error
  if (error?.name === 'FetchError' || error?.name === 'NetworkError') {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  // If it's an authentication error
  if (error?.status === 401 || error?.code === 'PGRST301') {
    return 'Authentication error. Please sign in again.';
  }
  
  // If it's a permission error
  if (error?.status === 403 || error?.code === 'PGRST302') {
    return 'You do not have permission to perform this action.';
  }
  
  // Default error message
  return 'An unexpected error occurred. Please try again later.';
};
