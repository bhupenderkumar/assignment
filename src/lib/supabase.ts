// src/lib/supabase.ts
// This file is kept for backward compatibility
// New code should use the useSupabaseAuth hook to access the Supabase client

import { getSupabaseClient } from './services/supabaseService';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseService } from './services/supabaseService';

// Export a function to get the Supabase client (will use the singleton instance)
export const getSupabase = async (): Promise<SupabaseClient> => {
  return await getSupabaseClient(null);
};

// Export a getter that will initialize the client on first use
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    // This is a synchronous proxy, so we need to handle the async nature of getSupabaseClient
    // We'll initialize the client immediately if it's not already initialized
    getSupabaseClient(null).then(client => {
      // Also initialize the service for future use
      getSupabaseService(client, null);
    }).catch(err => {
      console.error('Error initializing Supabase client:', err);
    });

    // Get the client directly from the singleton
    const client = getSupabaseClient(null) as any;

    if (!client) {
      console.error('Supabase client not initialized yet');
      return () => Promise.reject(new Error('Supabase client not initialized'));
    }

    return client.then ? client.then((c: SupabaseClient) => c[prop]) : client[prop];
  }
});

// Log initialization status
console.log('Supabase client proxy initialized successfully');

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any): string => {
  console.error('Supabase error:', error);
  return error?.message || 'An unexpected error occurred';
};

// Export types
export type {
  User,
  Session,
  AuthError,
  PostgrestError,
  PostgrestSingleResponse,
  PostgrestResponse
} from '@supabase/supabase-js';
