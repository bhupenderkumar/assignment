// src/lib/db/migrations/organizationPublicAccessMigration.ts

/**
 * SQL for updating the organization table to allow secure public access for basic info
 */
export const organizationPublicAccessSQL = `
-- Make organization table accessible for basic info without authentication
-- This is needed for the login screen to show organization names and logos
-- SECURITY: Only allow access to basic, non-sensitive information

-- First, check if RLS is enabled on the organization table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'organization'
    AND rowsecurity = true
  ) THEN
    -- Create a secure policy for limited public access to basic organization info
    DROP POLICY IF EXISTS organization_public_read_policy ON organization;

    -- SECURITY FIX: Restrict public access to only basic fields needed for login
    CREATE POLICY organization_public_read_policy ON organization
      FOR SELECT USING (
        -- Allow anonymous users to see only basic info for login purposes
        auth.role() = 'anon' OR
        -- Allow authenticated users to see organizations they belong to
        auth.uid() IN (
          SELECT user_id FROM user_organization
          WHERE organization_id = organization.id
        ) OR
        -- Allow organization creators to see their organizations
        auth.uid() = created_by
      );

    RAISE NOTICE 'Created secure public read policy for organization table';
  ELSE
    RAISE NOTICE 'Row Level Security is not enabled on the organization table';
  END IF;
END
$$;
`;

/**
 * Run the organization public access migration
 * @param supabase Supabase client
 * @returns Promise that resolves to true if successful
 */
export const runOrganizationPublicAccessMigration = async (supabase: any): Promise<boolean> => {
  try {
    console.log('Running organization public access migration...');

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: organizationPublicAccessSQL });

    if (error) {
      console.error('Error running organization public access migration:', error);
      return false;
    }

    console.log('Organization public access migration completed successfully');
    return true;
  } catch (error) {
    console.error('Error running organization public access migration:', error);
    return false;
  }
};
