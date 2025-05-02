// src/lib/utils/userIdMapping.ts
import { v5 as uuidv5 } from 'uuid';

// Namespace for generating consistent UUIDs
// This is a randomly generated UUID used as a namespace
const UUID_NAMESPACE = '9a3b7a70-f9e8-4ea9-8d7f-3aadf1e5b0c2';

/**
 * Checks if a string is a valid UUID format
 *
 * @param str String to check
 * @returns True if the string is a valid UUID
 */
export const isValidUuid = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Ensures a user ID is in UUID format for Supabase
 * If it's already a UUID, returns as is; otherwise generates a UUID
 *
 * @param userId A user ID
 * @returns A UUID compatible with Supabase
 */
export const ensureUuidFormat = (userId: string): string => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    // If it's already a UUID, return as is
    if (isValidUuid(userId)) {
      return userId;
    }

    // Generate a UUID from the user ID
    return uuidv5(userId, UUID_NAMESPACE);
  } catch (error) {
    console.error('Error converting user ID to UUID:', error);
    // Return a fallback UUID based on the string representation
    return uuidv5(String(userId), UUID_NAMESPACE);
  }
};
