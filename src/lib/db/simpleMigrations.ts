// src/lib/db/simpleMigrations.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { runOrganizationMigration } from './migrations/organizationMigration';

// Define a type for migration progress callbacks
export type MigrationProgressCallback = (progress: number, status: string) => void;

/**
 * Run database migrations with progress reporting
 * @param supabase Supabase client
 * @param onProgress Optional callback for progress updates
 */
export const runMigrations = async (
  supabase: SupabaseClient,
  onProgress?: MigrationProgressCallback
) => {
  // Track overall progress
  let currentProgress = 0;

  // Update progress and notify callback
  const updateProgress = (progress: number, status: string) => {
    currentProgress = progress;
    // Ensure progress doesn't exceed 100%
    currentProgress = Math.min(currentProgress, 100);

    if (onProgress) {
      onProgress(Math.round(currentProgress), status);
    }
    console.log(`Migration progress: ${Math.round(currentProgress)}% - ${status}`);
  };

  try {
    console.log('Running database migrations...');
    updateProgress(10, 'Starting migrations');

    // Check if we can connect to the database
    try {
      const { data, error } = await supabase
        .from('interactive_assignment')
        .select('id')
        .limit(1);

      if (error) {
        console.warn('Could not query interactive_assignment table:', error.message);
        // This is expected if the table doesn't exist yet
      } else {
        console.log('Successfully connected to database');
      }
    } catch (error) {
      console.warn('Error checking database connection:', error);
      // Continue anyway - this is not critical
    }

    // Run organization migration
    updateProgress(30, 'Running organization migration');
    try {
      const orgMigrationSuccess = await runOrganizationMigration(supabase);
      if (orgMigrationSuccess) {
        console.log('Organization migration completed successfully');
        updateProgress(70, 'Organization tables created');
      } else {
        console.warn('Organization migration failed, but we can continue');
        updateProgress(50, 'Organization migration failed');
      }
    } catch (error) {
      console.error('Error running organization migration:', error);
      // Continue anyway - we can still use the application without organization features
      updateProgress(50, 'Organization migration failed');
    }

    updateProgress(100, 'Database initialization completed');
    return true;
  } catch (error: unknown) {
    console.error('Error initializing database:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    updateProgress(0, `Database initialization failed: ${errorMessage}`);
    return false;
  }
};
