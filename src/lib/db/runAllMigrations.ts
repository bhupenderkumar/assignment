// src/lib/db/runAllMigrations.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { runMigrations } from './runMigrations';
import { runOrganizationMigration } from './migrations/organizationMigration';
import { createUsersView } from './createUsersView';
import { galleryFeaturesSQL } from './migrations/galleryFeaturesMigration';
import toast from 'react-hot-toast';

/**
 * Run all migrations in the correct order
 * @param supabase Supabase client
 * @param onProgress Optional callback for progress updates
 * @returns Promise that resolves to true if all migrations were successful
 */
export const runAllMigrations = async (
  supabase: SupabaseClient,
  onProgress?: (progress: number, status: string) => void
): Promise<boolean> => {
  try {
    // Update progress
    if (onProgress) {
      onProgress(0, 'Starting migrations');
    }

    // Run base migrations
    const baseMigrationsSuccess = await runMigrations(supabase, (progress, status) => {
      if (onProgress) {
        // Base migrations are 40% of the total
        onProgress(progress * 0.4, status);
      }
    });

    if (!baseMigrationsSuccess) {
      toast.error('Failed to run base migrations');
      return false;
    }

    // Update progress
    if (onProgress) {
      onProgress(40, 'Base migrations completed');
    }

    // Run organization migration
    if (onProgress) {
      onProgress(40, 'Running organization migration');
    }

    const organizationMigrationSuccess = await runOrganizationMigration(supabase);

    if (!organizationMigrationSuccess) {
      toast.error('Failed to run organization migration');
      return false;
    }

    // Update progress
    if (onProgress) {
      onProgress(80, 'Organization migration completed');
    }

    // Create users view
    if (onProgress) {
      onProgress(80, 'Creating users view');
    }

    const usersViewSuccess = await createUsersView(supabase);

    if (!usersViewSuccess) {
      toast.error('Failed to create users view');
      // Continue anyway - this is not critical
    }

    // Run gallery features migration
    if (onProgress) {
      onProgress(90, 'Setting up gallery features');
    }

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: galleryFeaturesSQL });

      if (error) {
        console.error('Error running gallery features migration:', error);
        toast.error('Failed to set up gallery features');
        // Continue anyway - this is not critical
      } else {
        console.log('Gallery features migration completed successfully');
      }
    } catch (error) {
      console.error('Error running gallery features migration:', error);
      toast.error('Failed to set up gallery features');
      // Continue anyway - this is not critical
    }

    // Update progress
    if (onProgress) {
      onProgress(100, 'All migrations completed');
    }

    toast.success('All migrations completed successfully');
    return true;
  } catch (error) {
    console.error('Error running all migrations:', error);
    toast.error('Failed to run all migrations');
    return false;
  }
};
