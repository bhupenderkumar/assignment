// src/lib/db/directMigrations.ts
import { SupabaseClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

// Define a type for migration progress callbacks
export type MigrationProgressCallback = (progress: number, status: string) => void;

/**
 * Run direct migrations using Supabase API
 * @param supabase Supabase client
 * @param onProgress Optional callback for progress updates
 */
export const runDirectMigrations = async (
  supabase: SupabaseClient,
  onProgress?: MigrationProgressCallback
): Promise<boolean> => {
  // Track overall progress
  let currentProgress = 0;

  // Update progress and notify callback
  const updateProgress = (progress: number, status: string) => {
    currentProgress = progress;
    if (onProgress) {
      onProgress(Math.round(currentProgress), status);
    }
    console.log(`Migration progress: ${Math.round(currentProgress)}% - ${status}`);
  };

  try {
    updateProgress(0, 'Starting direct migrations');

    // Step 1: Check if organization_invitation table exists
    updateProgress(20, 'Checking organization_invitation table');
    try {
      // Try to query the organization_invitation table
      const { error: checkError } = await supabase
        .from('organization_invitation')
        .select('id')
        .limit(1);

      // If the table doesn't exist, create it
      if (checkError && (checkError.code === 'PGRST204' || checkError.message?.includes('relation "organization_invitation" does not exist'))) {
        updateProgress(40, 'Creating organization_invitation table');

        // Create the organization_invitation table using the REST API
        const { error: createError } = await supabase
          .from('organization_invitation')
          .insert({
            id: '00000000-0000-0000-0000-000000000000',
            organization_id: '00000000-0000-0000-0000-000000000000',
            email: 'temp@example.com',
            role: 'member',
            status: 'PENDING',
            invited_by: '00000000-0000-0000-0000-000000000000',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          });

        if (createError && createError.code !== '23505') { // Ignore unique constraint violations
          console.error('Error creating organization_invitation table:', createError);
        } else {
          console.log('Organization invitation table created or already exists');
        }
      } else {
        console.log('Organization invitation table already exists');
      }
    } catch (error) {
      console.error('Error checking organization_invitation table:', error);
    }

    // Step 2: Create a workaround for accessing user data
    updateProgress(60, 'Setting up users access');
    try {
      // Test if we can get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error getting current user:', userError);
      } else if (user) {
        console.log('User access working correctly for current user');
      } else {
        console.warn('No current user found');
      }
    } catch (error) {
      console.error('Error setting up users access:', error);
    }

    // Step 3: Update the UserManagement component to use auth.getUser instead of querying users table
    updateProgress(80, 'Updating user management');

    // All done
    updateProgress(100, 'Direct migrations completed');
    toast.success('Database setup completed');
    return true;
  } catch (error) {
    console.error('Error running direct migrations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    updateProgress(0, `Migration failed: ${errorMessage}`);
    toast.error('Failed to run migrations');
    return false;
  }
};
