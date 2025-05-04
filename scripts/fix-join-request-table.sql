-- Fix the organization_join_request table

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
