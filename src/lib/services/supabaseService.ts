// src/lib/services/supabaseService.ts
import { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Supabase Service
 *
 * This service provides utility methods for common Supabase operations.
 * It handles error handling, retries, and provides a consistent interface
 * for database operations.
 */
export class SupabaseService {
  private client: SupabaseClient | null = null;
  private user: User | null = null;
  private maxRetries = 3;
  private retryDelay = 1000; // ms

  /**
   * Initialize the service with a Supabase client
   * @param client Supabase client
   * @param user Current user (optional)
   */
  constructor(client: SupabaseClient | null = null, user: User | null = null) {
    this.client = client;
    this.user = user;
  }

  /**
   * Set the current user
   * @param user Current user
   */
  setUser(user: User | null): void {
    this.user = user;
  }

  /**
   * Get a Supabase client
   * @returns Supabase client
   */
  async getClient(): Promise<SupabaseClient> {
    if (!this.client) {
      this.client = await getSupabaseClient(this.user);
      // No need to test connection here - it's already tested in getSupabaseClient
    }
    return this.client;
  }

  /**
   * Refresh the Supabase client
   * @returns Fresh Supabase client
   */
  async refreshClient(): Promise<SupabaseClient> {
    this.client = await getSupabaseClient(this.user);
    return this.client;
  }

  /**
   * Execute a Supabase operation with retry logic
   * @param operation Function that performs the operation
   * @param retries Current retry count
   * @returns Result of the operation
   */
  private async executeWithRetry<T>(
    operation: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>,
    retries = 0
  ): Promise<T> {
    try {
      const client = await this.getClient();
      const { data, error } = await operation(client);

      if (error) {
        // Check if this is an authentication error
        const isAuthError =
          error.message?.includes('JWT') ||
          error.message?.includes('auth') ||
          error.message?.includes('401') ||
          error.code === 'PGRST301';

        if (isAuthError && retries < this.maxRetries) {
          // Refresh the client and retry
          await this.refreshClient();
          return this.executeWithRetry(operation, retries + 1);
        }

        throw error;
      }

      return data as T;
    } catch (error) {
      if (retries < this.maxRetries) {
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(1.5, retries)));
        return this.executeWithRetry(operation, retries + 1);
      }

      throw error;
    }
  }

  /**
   * Fetch data from a table
   * @param table Table name
   * @param queryBuilder Function to build the query
   * @returns Query result
   */
  async fetch<T>(
    table: string,
    queryBuilder: (query: any) => any = (query) => query.select('*')
  ): Promise<T[]> {
    return this.executeWithRetry(async (client) => {
      const baseQuery = client.from(table);
      const query = queryBuilder(baseQuery);
      return await query;
    });
  }

  /**
   * Fetch a single record by ID
   * @param table Table name
   * @param id Record ID
   * @returns Single record or null if not found
   */
  async fetchById<T>(table: string, id: string): Promise<T | null> {
    return this.executeWithRetry(async (client) => {
      return await client
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
    });
  }

  /**
   * Insert a record
   * @param table Table name
   * @param record Record to insert
   * @returns Inserted record
   */
  async insert<T>(table: string, record: Partial<T>): Promise<T> {
    return this.executeWithRetry(async (client) => {
      return await client
        .from(table)
        .insert(record)
        .select()
        .single();
    });
  }

  /**
   * Update a record
   * @param table Table name
   * @param id Record ID
   * @param updates Updates to apply
   * @returns Updated record
   */
  async update<T>(table: string, id: string, updates: Partial<T>): Promise<T> {
    return this.executeWithRetry(async (client) => {
      return await client
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    });
  }

  /**
   * Delete a record
   * @param table Table name
   * @param id Record ID
   * @returns Success status
   */
  async delete(table: string, id: string): Promise<boolean> {
    return this.executeWithRetry(async (client) => {
      const { error } = await client
        .from(table)
        .delete()
        .eq('id', id);

      return { data: !error, error };
    });
  }

  /**
   * Execute a custom query
   * @param queryFn Function that performs the custom query
   * @returns Query result
   */
  async executeCustomQuery<T>(
    queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>
  ): Promise<T> {
    return this.executeWithRetry(queryFn);
  }

  /**
   * Execute a stored procedure
   * @param procedure Procedure name
   * @param params Procedure parameters
   * @returns Procedure result
   */
  async callProcedure<T>(procedure: string, params: Record<string, any> = {}): Promise<T> {
    return this.executeWithRetry(async (client) => {
      return await client.rpc(procedure, params);
    });
  }
}

// Global singleton Supabase client instance
let _supabaseClientInstance: SupabaseClient | null = null;
// Flag to track if initialization is in progress
let _initializationInProgress = false;
// Promise for initialization
let _initializationPromise: Promise<SupabaseClient> | null = null;
// Flag to track if connection test has been performed
let _connectionTested = false;

/**
 * Creates and returns a Supabase client (singleton pattern)
 *
 * @param user The Supabase user object (null for anonymous users)
 * @returns A Supabase client
 */
export const getSupabaseClient = async (_user: User | null): Promise<SupabaseClient> => {
  // If we already have an instance and connection has been tested, return it immediately
  if (_supabaseClientInstance && _connectionTested) {
    return _supabaseClientInstance;
  }

  // If we have an instance but haven't tested connection, just return it without logging
  if (_supabaseClientInstance) {
    return _supabaseClientInstance;
  }

  // If initialization is already in progress, return the promise without logging
  if (_initializationInProgress && _initializationPromise) {
    return _initializationPromise;
  }

  // Set flag to prevent multiple initializations
  _initializationInProgress = true;

  // Create a promise for the initialization
  _initializationPromise = (async () => {
    try {
      // Validate configuration
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration is missing. Check your environment variables.');
      }

      // Create client if it doesn't exist
      console.log('Creating new Supabase client instance');
      _supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey);

      // We'll test the connection with a more reliable method
      if (!_connectionTested) {
        try {
          console.log('Testing Supabase connection...');
          // Use a more reliable method to test connection - auth.getSession() always exists
          await _supabaseClientInstance.auth.getSession();
          console.log('Supabase connection test completed');
          _connectionTested = true;
        } catch (e) {
          console.error('Supabase connection test failed:', e);
          // Even if this fails, we'll continue and let the app handle reconnection
        }
      }

      return _supabaseClientInstance;
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
      // Reset flags so we can try again
      _initializationInProgress = false;
      _initializationPromise = null;
      throw error;
    } finally {
      // Reset the initialization flag
      _initializationInProgress = false;
    }
  })();

  return _initializationPromise;
};

// Singleton instance
let supabaseServiceInstance: SupabaseService | null = null;

/**
 * Get the Supabase service instance
 * @param client Supabase client (optional)
 * @param user Current user (optional)
 * @returns Supabase service instance
 */
export const getSupabaseService = (
  client: SupabaseClient | null = null,
  user: User | null = null
): SupabaseService => {
  if (!supabaseServiceInstance) {
    supabaseServiceInstance = new SupabaseService(client, user);
  } else if (client || user) {
    // Update the instance if client or user is provided
    if (client) {
      supabaseServiceInstance = new SupabaseService(client, user);
    } else if (user) {
      supabaseServiceInstance.setUser(user);
    }
  }

  return supabaseServiceInstance;
};
