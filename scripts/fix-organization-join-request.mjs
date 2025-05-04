// scripts/fix-organization-join-request.mjs
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Initialize dotenv
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client with service key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SQL to check the organization_join_request table structure
const checkTableSQL = `
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'organization_join_request'
ORDER BY 
  ordinal_position;
`;

// SQL to check foreign key constraints
const checkForeignKeysSQL = `
SELECT
  tc.table_schema, 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'organization_join_request';
`;

// SQL to fix the organization_join_request table
const fixTableSQL = `
-- First, check if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organization_join_request') THEN
    -- Drop existing foreign keys if they exist
    ALTER TABLE IF EXISTS organization_join_request 
      DROP CONSTRAINT IF EXISTS organization_join_request_user_id_fkey,
      DROP CONSTRAINT IF EXISTS organization_join_request_organization_id_fkey;
    
    -- Add proper foreign key constraints
    ALTER TABLE organization_join_request
      ADD CONSTRAINT organization_join_request_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id) ON DELETE CASCADE;
    
    ALTER TABLE organization_join_request
      ADD CONSTRAINT organization_join_request_organization_id_fkey 
      FOREIGN KEY (organization_id) 
      REFERENCES organization(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key constraints added to organization_join_request table';
  ELSE
    -- Create the table if it doesn't exist
    CREATE TABLE organization_join_request (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      request_message TEXT,
      response_message TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, organization_id)
    );
    
    -- Add RLS policies
    ALTER TABLE organization_join_request ENABLE ROW LEVEL SECURITY;
    
    -- Policy for users to see their own join requests
    CREATE POLICY organization_join_request_select_policy ON organization_join_request
      FOR SELECT USING (auth.uid() = user_id);
    
    -- Policy for organization admins to see join requests for their organization
    CREATE POLICY organization_join_request_admin_policy ON organization_join_request
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM user_organization
          WHERE user_organization.user_id = auth.uid()
          AND user_organization.organization_id = organization_join_request.organization_id
          AND (user_organization.role = 'owner' OR user_organization.role = 'admin')
        )
      );
    
    -- Policy for users to create join requests
    CREATE POLICY organization_join_request_insert_policy ON organization_join_request
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    RAISE NOTICE 'Created organization_join_request table with proper foreign keys';
  END IF;
END
$$;
`;

// Function to execute SQL
async function executeSQL(sql, description) {
  try {
    console.log(`Executing SQL: ${description}...`);
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`Error executing SQL (${description}):`, error);
      return null;
    }
    
    console.log(`SQL executed successfully: ${description}`);
    return data;
  } catch (err) {
    console.error(`Exception executing SQL (${description}):`, err);
    return null;
  }
}

// Alternative function to execute SQL using REST API
async function executeSQLViaREST(sql, description) {
  try {
    console.log(`Executing SQL via REST: ${description}...`);
    
    // Use the SQL endpoint directly
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
      console.error(`Error executing SQL via REST (${description}):`, errorText);
      return null;
    }
    
    const data = await response.json();
    console.log(`SQL executed successfully via REST: ${description}`);
    return data;
  } catch (err) {
    console.error(`Exception executing SQL via REST (${description}):`, err);
    return null;
  }
}

// Function to check if the exec_sql function exists
async function checkExecSQLFunction() {
  try {
    const { data, error } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'exec_sql')
      .single();
    
    if (error) {
      console.log('Error checking exec_sql function:', error);
      return false;
    }
    
    return !!data;
  } catch (err) {
    console.error('Exception checking exec_sql function:', err);
    return false;
  }
}

// Function to create the exec_sql function if it doesn't exist
async function createExecSQLFunction() {
  try {
    // Create the function using raw SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS jsonb
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          result jsonb;
        BEGIN
          EXECUTE sql;
          RETURN '{"success": true}'::jsonb;
        EXCEPTION WHEN OTHERS THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'detail', SQLSTATE
          );
        END;
        $$;
      `
    });
    
    if (error) {
      console.error('Error creating exec_sql function:', error);
      return false;
    }
    
    console.log('exec_sql function created successfully');
    return true;
  } catch (err) {
    console.error('Exception creating exec_sql function:', err);
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log('Starting fix for organization_join_request table...');
    
    // Check if the exec_sql function exists
    const execSQLExists = await checkExecSQLFunction();
    
    if (!execSQLExists) {
      console.log('exec_sql function does not exist, creating it...');
      const created = await createExecSQLFunction();
      
      if (!created) {
        console.error('Failed to create exec_sql function, using REST API instead');
      }
    }
    
    // Check the current table structure
    console.log('Checking current table structure...');
    const tableStructure = await executeSQL(checkTableSQL, 'Check table structure');
    console.log('Table structure:', tableStructure);
    
    // Check existing foreign keys
    console.log('Checking existing foreign keys...');
    const foreignKeys = await executeSQL(checkForeignKeysSQL, 'Check foreign keys');
    console.log('Foreign keys:', foreignKeys);
    
    // Fix the table
    console.log('Fixing the organization_join_request table...');
    const fixResult = await executeSQL(fixTableSQL, 'Fix table');
    
    if (!fixResult) {
      console.log('Trying alternative method via REST API...');
      const restResult = await executeSQLViaREST(fixTableSQL, 'Fix table via REST');
      
      if (!restResult) {
        console.error('Failed to fix the table using both methods');
        process.exit(1);
      }
    }
    
    console.log('Table fixed successfully!');
    
    // Verify the fix
    console.log('Verifying the fix...');
    const verifyForeignKeys = await executeSQL(checkForeignKeysSQL, 'Verify foreign keys');
    console.log('Updated foreign keys:', verifyForeignKeys);
    
    console.log('Fix completed successfully!');
  } catch (err) {
    console.error('Error in main function:', err);
    process.exit(1);
  }
}

// Run the main function
main()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
