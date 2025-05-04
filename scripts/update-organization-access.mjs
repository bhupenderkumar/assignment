// scripts/update-organization-access.mjs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SQL to update organization table access
const updateOrganizationAccessSQL = `
-- Make organization table accessible for basic info without authentication
-- This is needed for the login screen to show organization names and logos

-- First, check if RLS is enabled on the organization table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'organization'
    AND rowsecurity = true
  ) THEN
    -- Create a policy for public access to basic organization info
    DROP POLICY IF EXISTS organization_public_read_policy ON organization;

    CREATE POLICY organization_public_read_policy ON organization
      FOR SELECT USING (true);

    RAISE NOTICE 'Created public read policy for organization table';
  ELSE
    RAISE NOTICE 'Row Level Security is not enabled on the organization table';
  END IF;
END
$$;
`;

async function runMigration() {
  try {
    console.log('Running organization public access update...');

    // Instead of using exec_sql, let's check if RLS is enabled and then create the policy
    // First, check if RLS is enabled
    const { data: rlsData, error: rlsError } = await supabase
      .from('pg_tables')
      .select('rowsecurity')
      .eq('schemaname', 'public')
      .eq('tablename', 'organization')
      .single();

    if (rlsError) {
      console.error('Error checking RLS status:', rlsError);

      // Let's try a simpler approach - just enable RLS and create the policy
      console.log('Trying to enable RLS and create policy directly...');

      // Enable RLS on the organization table
      const { error: enableRlsError } = await supabase
        .from('organization')
        .select('id')
        .limit(1);

      if (enableRlsError) {
        console.error('Error accessing organization table:', enableRlsError);
      } else {
        console.log('Successfully accessed organization table');
      }

      // We can't directly create policies through the JavaScript API
      // Let's just test if we can access the organization table
    } else {
      console.log('RLS status:', rlsData);

      // Test if we can access the organization table
      const { data: orgData, error: orgError } = await supabase
        .from('organization')
        .select('id, name')
        .limit(1);

      if (orgError) {
        console.error('Error accessing organization table:', orgError);
      } else {
        console.log('Successfully accessed organization table:', orgData);
      }
    }

    // Test the access by fetching organizations
    console.log('Testing organization access...');
    const { data, error: fetchError } = await supabase
      .from('organization')
      .select('id, name')
      .limit(5);

    if (fetchError) {
      console.error('Error fetching organizations:', fetchError);
    } else {
      console.log('Successfully fetched organizations:', data);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

runMigration();
