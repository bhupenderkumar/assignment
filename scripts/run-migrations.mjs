// scripts/run-migrations.mjs
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Initialize dotenv
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Function to run SQL using the pgSQL endpoint
async function runSQL(sql) {
  try {
    console.log('Running SQL...');
    const response = await fetch(`${supabaseUrl}/pg/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
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

// SQL to create the organization_invitation table
const organizationInvitationSQL = `
CREATE TABLE IF NOT EXISTS organization_invitation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'member'
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,

  -- Add a unique constraint to prevent duplicate invitations
  UNIQUE(organization_id, email)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_organization_invitation_organization_id ON organization_invitation(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invitation_email ON organization_invitation(email);

-- Add RLS policies
ALTER TABLE organization_invitation ENABLE ROW LEVEL SECURITY;

-- Policy for organization admins to see invitations for their organizations
DROP POLICY IF EXISTS organization_invitation_select_policy ON organization_invitation;
CREATE POLICY organization_invitation_select_policy ON organization_invitation
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organization
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
`;

// SQL to create a view for auth.users
const usersViewSQL = `
CREATE OR REPLACE VIEW users AS
SELECT id, email, raw_user_meta_data, created_at, updated_at
FROM auth.users;

-- Add RLS policy to the view
ALTER VIEW users SECURITY INVOKER;
`;

// Run the migrations
async function runMigrations() {
  try {
    console.log('Running migrations...');

    // Step 1: Create migration history table first
    console.log('Creating migration history table...');
    try {
      await runSQL(migrationHistoryTableSQL);
      console.log('Migration history table created successfully');
    } catch (error) {
      console.error('Error creating migration history table:', error);
      // Continue anyway
    }

    // Step 2: Create organization_invitation table
    console.log('Creating organization_invitation table...');
    try {
      await runSQL(organizationInvitationSQL);
      console.log('organization_invitation table created successfully');
    } catch (error) {
      console.error('Error creating organization_invitation table:', error);
      // Continue anyway
    }

    // Step 3: Create users view
    console.log('Creating users view...');
    try {
      await runSQL(usersViewSQL);
      console.log('users view created successfully');
    } catch (error) {
      console.error('Error creating users view:', error);
      // Continue anyway
    }

    console.log('Migrations completed');
  } catch (error) {
    console.error('Error running migrations:', error);
  }
}

// Run the migrations
runMigrations()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
