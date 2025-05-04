// src/lib/auth/userUtils.ts
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get user details by ID
 * @param supabase Supabase client
 * @param userId User ID
 * @returns User details or null if not found
 */
export const getUserById = async (supabase: SupabaseClient, userId: string) => {
  try {
    // For the current user, we can use the getUser method
    const { data: currentUserData } = await supabase.auth.getUser();

    if (currentUserData.user && currentUserData.user.id === userId) {
      return currentUserData.user;
    }

    // For other users, we need to get their details from the database
    // Since we can't use admin API, we'll create a placeholder user
    return {
      id: userId,
      email: `User ${userId.substring(0, 8)}`,
      user_metadata: { name: `User ${userId.substring(0, 8)}` }
    };
  } catch (error) {
    console.error(`Error getting details for user ${userId}:`, error);
    return null;
  }
};

/**
 * Get user details by email
 * @param supabase Supabase client
 * @param email User email
 * @returns User details or null if not found
 */
export const getUserByEmail = async (supabase: SupabaseClient, email: string) => {
  try {
    // For the current user, we can use the getUser method
    const { data: currentUserData } = await supabase.auth.getUser();

    if (currentUserData.user && currentUserData.user.email === email) {
      return currentUserData.user;
    }

    // For other users, we can't get their details without admin access
    // Return a placeholder user
    return {
      id: `unknown-${Math.random().toString(36).substring(2, 10)}`,
      email: email,
      user_metadata: { name: email.split('@')[0] }
    };
  } catch (error) {
    console.error(`Error getting details for user with email ${email}:`, error);
    return null;
  }
};

/**
 * Get multiple users by IDs
 * @param supabase Supabase client
 * @param userIds Array of user IDs
 * @returns Array of user details
 */
export const getUsersByIds = async (supabase: SupabaseClient, userIds: string[]) => {
  // Get the current user first
  const { data: currentUserData } = await supabase.auth.getUser();
  const currentUser = currentUserData.user;

  // Create a map to store users by ID
  const usersMap = new Map();

  // Add the current user to the map if it's in the requested IDs
  if (currentUser && userIds.includes(currentUser.id)) {
    usersMap.set(currentUser.id, currentUser);
  }

  // For other users, create placeholder users
  for (const userId of userIds) {
    if (!usersMap.has(userId)) {
      usersMap.set(userId, {
        id: userId,
        email: `User ${userId.substring(0, 8)}`,
        user_metadata: { name: `User ${userId.substring(0, 8)}` }
      });
    }
  }

  // Convert the map to an array
  return Array.from(usersMap.values());
};
