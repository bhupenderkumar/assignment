// scripts/check-organization-rls.mjs
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Initialize dotenv
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Function to run SQL using the pgSQL endpoint
async function runSQL(sql) {
  try {
    console.log('Running SQL...');
    // Use the correct REST API endpoint for SQL queries
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to run SQL: ${errorText}`);
    }
    console.log('SQL executed successfully');
    return await response.json();
  } catch (error) {
    console.error('Error running SQL:', error);
    throw error;
  }
}

// SQL to check RLS policies
const checkRLSPoliciesSQL = `
-- Check if RLS is enabled on the organization table
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'organization';

-- List all policies on the organization table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'organization';
`;

// SQL to update the organization table to allow public access for basic info
const organizationPublicAccessSQL = `
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

// SQL to check if there are any organizations in the database
const checkOrganizationsSQL = `
-- Count organizations in the database
SELECT COUNT(*) FROM organization;

-- List first 5 organizations
SELECT id, name, type, logo_url, created_at
FROM organization
LIMIT 5;
`;

// Run the checks
async function runChecks() {
  try {
    console.log('Checking RLS policies...');
    const rlsPolicies = await runSQL(checkRLSPoliciesSQL);
    console.log('RLS Policies:', JSON.stringify(rlsPolicies, null, 2));

    console.log('\nUpdating organization public access policy...');
    await runSQL(organizationPublicAccessSQL);
    console.log('Public access policy updated');

    console.log('\nChecking organizations in the database...');
    const organizations = await runSQL(checkOrganizationsSQL);
    console.log('Organizations:', JSON.stringify(organizations, null, 2));

    console.log('\nChecks completed successfully');
  } catch (error) {
    console.error('Error running checks:', error);
  }
}

// Run the checks
runChecks()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
