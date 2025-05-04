// src/lib/db/simpleMigrations.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { runOrganizationMigration } from './migrations/organizationMigration';
import { assignmentRlsSQL } from './migrations/assignmentRlsMigration';

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
        updateProgress(60, 'Organization tables created');
      } else {
        console.warn('Organization migration failed, but we can continue');
        updateProgress(40, 'Organization migration failed');
      }
    } catch (error) {
      console.error('Error running organization migration:', error);
      // Continue anyway - we can still use the application without organization features
      updateProgress(40, 'Organization migration failed');
    }

    // Run assignment RLS migration
    updateProgress(70, 'Setting up assignment RLS policies');
    try {
      // First check if the exec_sql function exists by trying to call it with a simple query
      try {
        const testResult = await supabase.rpc('exec_sql', { sql: 'SELECT 1 as test' });

        if (!testResult.error) {
          // If the function exists, run the migration
          const { error } = await supabase.rpc('exec_sql', { sql: assignmentRlsSQL });

          if (error) {
            console.warn('Assignment RLS migration failed, but we can continue:', error.message);
            updateProgress(80, 'Assignment RLS migration failed');
          } else {
            console.log('Assignment RLS migration completed successfully');
            updateProgress(90, 'Assignment RLS policies created');
          }
        } else {
          // If the function doesn't exist, log a warning and continue
          console.warn('exec_sql RPC function not available, skipping assignment RLS migration');
          console.warn('Please run the assignment RLS migration SQL manually in the Supabase SQL editor');
          updateProgress(80, 'Assignment RLS migration skipped');
        }
      } catch (testError) {
        // If the test fails, the function doesn't exist
        console.warn('exec_sql RPC function not available, skipping assignment RLS migration');
        console.warn('Please run the assignment RLS migration SQL manually in the Supabase SQL editor');
        updateProgress(80, 'Assignment RLS migration skipped');
      }
    } catch (error) {
      console.error('Error running assignment RLS migration:', error);
      // Continue anyway - we can still use the application without RLS features
      updateProgress(80, 'Assignment RLS migration failed');
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
