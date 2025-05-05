// src/lib/utils/supabaseUtils.ts
import { SupabaseClient, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '../services/supabaseService';

// Maximum number of retries for operations
const MAX_RETRIES = 3;
// Delay between retries in milliseconds
const RETRY_DELAY = 1000;

/**
 * Waits for the specified delay
 * @param ms Milliseconds to wait
 */
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Gets an initialized Supabase client, retrying if necessary
 * This function uses the singleton pattern to ensure only one client instance exists
 *
 * @param user Current user (optional)
 * @param retries Number of retries attempted
 * @returns Initialized Supabase client
 */
export const getInitializedClient = async (
  user: User | null = null,
  retries = 0
): Promise<SupabaseClient> => {
  try {
    // Only log on first attempt to reduce console noise
    if (retries === 0) {
      console.log(`Getting Supabase client (singleton)`);
    }

    // Get the singleton client instance
    const client = await getSupabaseClient(user);

    if (!client) {
      throw new Error('Failed to initialize Supabase client');
    }

    // Only test the connection on first attempt
    if (retries === 0) {
      try {
        // Just try to connect - we don't need to query a specific table or function
        await client.from('_pgsql_reserved_dummy').select('*').limit(1).maybeSingle();
        console.log('Supabase client initialized and connected successfully');
      } catch (e) {
        // This error is expected (table doesn't exist), but we just want to test the connection
        const err = e as { code?: string; message?: string };
        if (err.code !== 'PGRST116') {
          console.warn('Supabase connection test warning:', err.message);
        }
      }
    }

    return client;
  } catch (error) {
    console.error(`Error getting Supabase client (attempt ${retries + 1}):`, error);

    if (retries < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY}ms...`);
      await wait(RETRY_DELAY);
      return getInitializedClient(user, retries + 1);
    }

    throw new Error(`Failed to initialize Supabase client after ${MAX_RETRIES} attempts`);
  }
};

/**
 * Executes a Supabase query with retry logic
 * @param operation Function that performs the Supabase operation
 * @param user Current user (optional)
 * @param retries Number of retries attempted
 * @returns Result of the operation
 */
export const executeWithRetry = async <T>(
  operation: (client: SupabaseClient) => Promise<T>,
  user: User | null = null,
  retries = 0
): Promise<T> => {
  try {
    const client = await getInitializedClient(user, retries);
    return await operation(client);
  } catch (error) {
    console.error(`Error executing Supabase operation (attempt ${retries + 1}):`, error);

    // Check if this is an authentication error
    const errorMessage = (error as { message?: string })?.message || '';
    const isAuthError =
      errorMessage.includes('JWT') ||
      errorMessage.includes('auth') ||
      errorMessage.includes('token') ||
      errorMessage.includes('JWS') ||
      errorMessage.includes('401');

    if (isAuthError && retries === 0) {
      console.log('Authentication error detected, retrying with fresh client...');
      await wait(RETRY_DELAY);
      return executeWithRetry(operation, user, retries + 1);
    }

    if (retries < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY}ms...`);
      await wait(RETRY_DELAY);
      return executeWithRetry(operation, user, retries + 1);
    }

    throw error;
  }
};

/**
 * Fetches data from a Supabase table
 * @param table Table name
 * @param query Query function to customize the request
 * @param user Current user (optional)
 * @returns Query result
 */
export const fetchData = async <T>(
  table: string,
  query: (query: any) => any,
  user: User | null = null
): Promise<T[]> => {
  try {
    return await executeWithRetry(async (client) => {
      const { data, error } = await query(client.from(table));

      if (error) {
        console.error(`Error fetching data from ${table}:`, error);
        throw error;
      }

      return data || [];
    }, user);
  } catch (error) {
    // Add more detailed logging for debugging
    console.error(`Failed to fetch data from ${table} after retries:`, error);
    console.error(`Error details:`, {
      message: (error as any).message,
      code: (error as any).code,
      details: (error as any).details,
      hint: (error as any).hint
    });
    throw error;
  }
};

/**
 * Fetches a single record by ID
 * @param table Table name
 * @param id Record ID
 * @param user Current user (optional)
 * @returns Single record or null if not found
 */
export const fetchById = async <T>(
  table: string,
  id: string,
  user: User | null = null
): Promise<T | null> => {
  return executeWithRetry(async (client) => {
    const { data, error } = await client
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // If the error is 'not found', return null instead of throwing
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error(`Error fetching ${table} by ID:`, error);
      throw error;
    }

    return data;
  }, user);
};

/**
 * Inserts a record into a table
 * @param table Table name
 * @param record Record to insert
 * @param user Current user (optional)
 * @returns Inserted record
 */
export const insertRecord = async <T>(
  table: string,
  record: Partial<T>,
  user: User | null = null
): Promise<T> => {
  return executeWithRetry(async (client) => {
    const { data, error } = await client
      .from(table)
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error(`Error inserting into ${table}:`, error);
      throw error;
    }

    return data;
  }, user);
};

/**
 * Updates a record in a table
 * @param table Table name
 * @param id Record ID
 * @param updates Updates to apply
 * @param user Current user (optional)
 * @returns Updated record
 */
export const updateRecord = async <T>(
  table: string,
  id: string,
  updates: Partial<T>,
  user: User | null = null
): Promise<T> => {
  return executeWithRetry(async (client) => {
    const { data, error } = await client
      .from(table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating ${table}:`, error);
      throw error;
    }

    return data;
  }, user);
};

/**
 * Deletes a record from a table
 * @param table Table name
 * @param id Record ID
 * @param user Current user (optional)
 */
export const deleteRecord = async (
  table: string,
  id: string,
  user: User | null = null
): Promise<void> => {
  return executeWithRetry(async (client) => {
    const { error } = await client
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting from ${table}:`, error);
      throw error;
    }
  }, user);
};

/**
 * Executes a custom query
 * @param queryFn Function that performs the custom query
 * @param user Current user (optional)
 * @returns Query result
 */
export const executeCustomQuery = async <T>(
  queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>,
  user: User | null = null
): Promise<T> => {
  return executeWithRetry(async (client) => {
    const { data, error } = await queryFn(client);

    if (error) {
      console.error('Error executing custom query:', error);
      throw error;
    }

    return data as T;
  }, user);
};
