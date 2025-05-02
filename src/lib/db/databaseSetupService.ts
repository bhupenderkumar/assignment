// src/lib/db/databaseSetupService.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { runMigrations, MigrationProgressCallback } from './simpleMigrations';

// Flag to track if migrations have been attempted in this session
let migrationsAttempted = false;

/**
 * Database setup service
 *
 * This service handles database initialization and migrations.
 * It ensures migrations only run once per session and provides
 * proper error handling and progress reporting.
 */
export class DatabaseSetupService {
  private supabase: SupabaseClient;
  private isInitialized = false;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Initialize the database
   * This checks if the database is properly set up and runs migrations if needed
   *
   * @param onProgress Optional callback for progress updates
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(onProgress?: MigrationProgressCallback): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Check if we need to run migrations
      if (!migrationsAttempted) {
        migrationsAttempted = true;

        // Run simplified migrations
        const success = await runMigrations(this.supabase, onProgress);
        if (!success) {
          throw new Error('Database initialization failed');
        }
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      return false;
    }
  }

  /**
   * Check if the database is initialized
   * @returns True if the database is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
let databaseSetupInstance: DatabaseSetupService | null = null;

/**
 * Get the database setup service instance
 * @param supabase Supabase client
 * @returns Database setup service instance
 */
export const getDatabaseSetupService = (supabase: SupabaseClient): DatabaseSetupService => {
  if (!databaseSetupInstance) {
    databaseSetupInstance = new DatabaseSetupService(supabase);
  }
  return databaseSetupInstance;
};
