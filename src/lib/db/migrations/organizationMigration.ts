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
    
    // Execute the SQL directly
    const { error } = await supabase.rpc('exec_sql', { sql: organizationTableSQL });
    
    if (error) {
      console.error('Error running organization migration:', error);
      return false;
    }
    
    console.log('Organization migration completed successfully');
    return true;
  } catch (error) {
    console.error('Error in organization migration:', error);
    return false;
  }
};
