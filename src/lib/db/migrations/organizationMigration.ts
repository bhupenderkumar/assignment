// src/lib/db/migrations/organizationMigration.ts
import { SupabaseClient } from '@supabase/supabase-js';

// Organization table SQL
export const organizationTableSQL = `
-- Create organization table if it doesn't exist
CREATE TABLE IF NOT EXISTS organization (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'company', 'school', 'other'
  logo_url TEXT, -- URL to the organization logo (optional)
  primary_color TEXT, -- Brand primary color (optional)
  secondary_color TEXT, -- Brand secondary color (optional)
  header_text TEXT, -- Custom header text (optional)
  signature_url TEXT NOT NULL, -- URL to the signature image (required)
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_organization_created_by ON organization(created_by);

-- Add RLS policies
ALTER TABLE organization ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their own organizations
DROP POLICY IF EXISTS organization_select_policy ON organization;
CREATE POLICY organization_select_policy ON organization
  FOR SELECT USING (auth.uid() = created_by OR auth.jwt() ->> 'sub' = created_by);

-- Policy for users to insert their own organizations
DROP POLICY IF EXISTS organization_insert_policy ON organization;
CREATE POLICY organization_insert_policy ON organization
  FOR INSERT WITH CHECK (auth.uid() = created_by OR auth.jwt() ->> 'sub' = created_by);

-- Policy for users to update their own organizations
DROP POLICY IF EXISTS organization_update_policy ON organization;
CREATE POLICY organization_update_policy ON organization
  FOR UPDATE USING (auth.uid() = created_by OR auth.jwt() ->> 'sub' = created_by);

-- Policy for users to delete their own organizations
DROP POLICY IF EXISTS organization_delete_policy ON organization;
CREATE POLICY organization_delete_policy ON organization
  FOR DELETE USING (auth.uid() = created_by OR auth.jwt() ->> 'sub' = created_by);

-- Create user_organization table to support multiple users per organization in the future
CREATE TABLE IF NOT EXISTS user_organization (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Add a unique constraint to prevent duplicate entries
  UNIQUE(user_id, organization_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_organization_user_id ON user_organization(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organization_organization_id ON user_organization(organization_id);

-- Add RLS policies
ALTER TABLE user_organization ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their own organization memberships
DROP POLICY IF EXISTS user_organization_select_policy ON user_organization;
CREATE POLICY user_organization_select_policy ON user_organization
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'sub' = user_id);

-- Add organization_id to interactive_assignment table
ALTER TABLE IF EXISTS interactive_assignment
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organization(id);

-- Add organization_id to certificate_template table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'certificate_template'
  ) THEN
    ALTER TABLE certificate_template
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organization(id);
  END IF;
END
$$;

-- Create organization_invitation table
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

/**
 * Run organization migration
 * @param supabase Supabase client
 */
export const runOrganizationMigration = async (
  supabase: SupabaseClient
): Promise<boolean> => {
  try {
    console.log('Running organization migration...');

    // First, check if the organization table already exists
    try {
      const { error: checkError } = await supabase
        .from('organization')
        .select('id')
        .limit(1);

      if (!checkError) {
        console.log('Organization table already exists, skipping migration');
        return true;
      }
    } catch (checkError) {
      console.log('Organization table check failed, will attempt to create it');
    }

    // Try to execute the SQL using the exec_sql RPC function
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: organizationTableSQL });

      if (error) {
        // If the RPC function doesn't exist, we'll get a 404 error
        if (error.code === 'PGRST202' || error.message?.includes('Could not find the function')) {
          console.warn('exec_sql RPC function not available, skipping organization migration');
          console.warn('Please run the organization migration SQL manually in the Supabase SQL editor');

          // We'll return true to avoid blocking the app, but log a warning
          console.warn('Organization migration skipped, but app will continue to function');
          return true;
        }

        throw error;
      }

      console.log('Organization migration completed successfully');
      return true;
    } catch (rpcError) {
      console.error('Error running organization migration via RPC:', rpcError);

      // Try an alternative approach - check if tables exist one by one
      try {
        // Check if organization table exists by trying to select from it
        await supabase.from('organization').select('id').limit(1);
        console.log('Organization table exists, assuming migration was successful');
        return true;
      } catch (tableError) {
        console.error('Organization table does not exist, migration failed');
        return false;
      }
    }
  } catch (error) {
    console.error('Error in organization migration:', error);
    return false;
  }
};
