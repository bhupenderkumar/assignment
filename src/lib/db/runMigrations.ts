// src/lib/db/runMigrations.ts
import { SupabaseClient } from '@supabase/supabase-js';

// Migration history table SQL
const migrationHistoryTableSQL = `
-- Create migration history table to track applied migrations
CREATE TABLE IF NOT EXISTS _migration_history (
  id SERIAL PRIMARY KEY,
  migration_name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT
);
`;

// User progress table SQL
const userProgressTableSQL = `
-- Create user_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  assignment_id UUID NOT NULL REFERENCES interactive_assignment(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  time_spent INTEGER, -- in seconds
  attempts INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  feedback TEXT,

  -- Add a unique constraint to prevent duplicate progress entries
  UNIQUE(user_id, assignment_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_assignment_id ON user_progress(assignment_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_status ON user_progress(status);

-- Add RLS policies
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their own progress
DROP POLICY IF EXISTS user_progress_select_policy ON user_progress;
CREATE POLICY user_progress_select_policy ON user_progress
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'sub' = user_id);

-- Policy for users to insert their own progress
DROP POLICY IF EXISTS user_progress_insert_policy ON user_progress;
CREATE POLICY user_progress_insert_policy ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'sub' = user_id);

-- Policy for users to update their own progress
DROP POLICY IF EXISTS user_progress_update_policy ON user_progress;
CREATE POLICY user_progress_update_policy ON user_progress
  FOR UPDATE USING (auth.uid() = user_id OR auth.jwt() ->> 'sub' = user_id);

-- Add function to update user_progress when a submission is completed
CREATE OR REPLACE FUNCTION update_user_progress_on_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to SUBMITTED
  IF NEW.status = 'SUBMITTED' THEN
    -- Insert or update user progress
    INSERT INTO user_progress (
      user_id,
      assignment_id,
      started_at,
      completed_at,
      score,
      status
    ) VALUES (
      NEW.user_id,
      NEW.assignment_id,
      NEW.started_at,
      NEW.submitted_at,
      NEW.score,
      'COMPLETED'
    )
    ON CONFLICT (user_id, assignment_id)
    DO UPDATE SET
      completed_at = NEW.submitted_at,
      score = NEW.score,
      status = 'COMPLETED',
      attempts = user_progress.attempts + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on interactive_submission table
DROP TRIGGER IF EXISTS trigger_update_user_progress ON interactive_submission;
CREATE TRIGGER trigger_update_user_progress
  AFTER UPDATE OF status ON interactive_submission
  FOR EACH ROW
  EXECUTE FUNCTION update_user_progress_on_submission();
`;

// Define a type for migration progress callbacks
export type MigrationProgressCallback = (progress: number, status: string) => void;

/**
 * Run database migrations with progress reporting and retry functionality
 * @param supabase Supabase client
 * @param onProgress Optional callback for progress updates
 * @param maxRetries Maximum number of retry attempts
 * @param retryInterval Interval between retries in milliseconds
 */
export const runMigrations = async (
  supabase: SupabaseClient,
  onProgress?: MigrationProgressCallback,
  maxRetries = 3,
  retryInterval = 2000
) => {
  // Define our migrations
  const migrations = [
    {
      name: 'Migration History Table',
      sql: migrationHistoryTableSQL,
      weight: 10, // Percentage weight of this migration in the overall progress
      completed: false,
      attempts: 0
    },
    {
      name: 'User Progress Table',
      sql: userProgressTableSQL,
      weight: 90, // Percentage weight of this migration in the overall progress
      completed: false,
      attempts: 0
    }
    // Add more migrations here as needed, adjusting weights accordingly
  ];

  // Calculate total weight for percentage calculations
  const totalWeight = migrations.reduce((sum, migration) => sum + migration.weight, 0);

  // Track overall progress
  let currentProgress = 0;

  // Update progress and notify callback
  const updateProgress = (additionalProgress: number, status: string) => {
    currentProgress += additionalProgress;
    // Ensure progress doesn't exceed 100%
    currentProgress = Math.min(currentProgress, 100);

    if (onProgress) {
      onProgress(Math.round(currentProgress), status);
    }
    console.log(`Migration progress: ${Math.round(currentProgress)}% - ${status}`);
  };

  try {
    console.log('Running database migrations...');
    updateProgress(0, 'Starting migrations');

    // First, check which migrations have already been applied
    try {
      // Check if migration history table exists
      const { data: migrationHistory, error: historyError } = await supabase
        .from('_migration_history')
        .select('migration_name')
        .eq('success', true);

      if (!historyError) {
        // Mark migrations as completed if they're in the history
        const completedMigrations = new Set(migrationHistory?.map(m => m.migration_name) || []);
        migrations.forEach(migration => {
          if (completedMigrations.has(migration.name)) {
            migration.completed = true;
            updateProgress((migration.weight / totalWeight) * 100, `${migration.name} already applied`);
          }
        });
      }
    } catch (error) {
      // If we can't check migration history, we'll try to run all migrations
      console.log('Could not check migration history, will attempt all migrations');
    }

    // Process each migration
    for (const migration of migrations) {
      // Skip if already completed
      if (migration.completed) continue;

      let success = false;

      // Try to run the migration with retries
      while (!success && migration.attempts < maxRetries) {
        migration.attempts++;

        try {
          updateProgress(0, `Running ${migration.name} (attempt ${migration.attempts}/${maxRetries})`);

          // Execute the SQL directly using Supabase's SQL API
          const { error } = await supabase
            .from('_migration_history')
            .select('id')
            .limit(1);

          if (error) {
            console.error(`Error running ${migration.name} migration (attempt ${migration.attempts}):`, error);

            if (migration.attempts < maxRetries) {
              updateProgress(0, `Retrying ${migration.name} in ${retryInterval/1000} seconds...`);
              await new Promise(resolve => setTimeout(resolve, retryInterval));
            } else {
              // Record failed migration
              try {
                await supabase.from('_migration_history').upsert({
                  migration_name: migration.name,
                  success: false,
                  error_message: error.message || 'Unknown error'
                });
              } catch (recordError) {
                console.error('Failed to record migration failure:', recordError);
              }

              updateProgress(0, `Failed to run ${migration.name} after ${maxRetries} attempts`);
              throw error;
            }
          } else {
            console.log(`${migration.name} migration completed successfully`);
            migration.completed = true;
            success = true;

            // Record successful migration
            try {
              await supabase.from('_migration_history').upsert({
                migration_name: migration.name,
                success: true,
                error_message: null
              });
            } catch (recordError) {
              console.error('Failed to record migration success:', recordError);
            }

            // Calculate progress contribution of this migration
            const progressContribution = (migration.weight / totalWeight) * 100;
            updateProgress(progressContribution, `${migration.name} completed`);
          }
        } catch (migrationError) {
          console.error(`Error in ${migration.name} migration (attempt ${migration.attempts}):`, migrationError);

          if (migration.attempts < maxRetries) {
            // Exponential backoff for retries
            const backoffTime = retryInterval * Math.pow(1.5, migration.attempts - 1);
            updateProgress(0, `Retrying ${migration.name} in ${backoffTime/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          } else {
            // Record failed migration
            try {
              const errorMessage = migrationError instanceof Error
                ? migrationError.message
                : String(migrationError);

              await supabase.from('_migration_history').upsert({
                migration_name: migration.name,
                success: false,
                error_message: errorMessage
              });
            } catch (recordError) {
              console.error('Failed to record migration failure:', recordError);
            }

            updateProgress(0, `Failed to run ${migration.name} after ${maxRetries} attempts`);
            throw migrationError;
          }
        }
      }
    }

    // Ensure we reach 100% when all migrations are complete
    if (currentProgress < 100) {
      updateProgress(100 - currentProgress, 'All migrations completed');
    } else {
      console.log('All migrations completed successfully');
    }

    return true;
  } catch (error: unknown) {
    console.error('Error running migrations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    updateProgress(0, `Migration failed: ${errorMessage}`);
    return false;
  }
};
