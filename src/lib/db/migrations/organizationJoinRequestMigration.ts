// src/lib/db/migrations/organizationJoinRequestMigration.ts

/**
 * SQL for creating the organization_join_request table
 */
export const organizationJoinRequestTableSQL = `
-- Create organization_join_request table if it doesn't exist
CREATE TABLE IF NOT EXISTS organization_join_request (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
  request_message TEXT, -- Optional message from the user
  response_message TEXT, -- Optional response from the admin
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE, -- When the request was approved/rejected
  responded_by UUID REFERENCES auth.users(id), -- Admin who responded to the request
  
  -- Add a unique constraint to prevent duplicate requests
  UNIQUE(organization_id, user_id, status)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_org_join_request_org_id ON organization_join_request(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_join_request_user_id ON organization_join_request(user_id);
CREATE INDEX IF NOT EXISTS idx_org_join_request_status ON organization_join_request(status);

-- Add RLS policies
ALTER TABLE organization_join_request ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own requests
DROP POLICY IF EXISTS org_join_request_select_policy ON organization_join_request;
CREATE POLICY org_join_request_select_policy ON organization_join_request
  FOR SELECT USING (
    -- Users can see their own requests
    auth.uid() = user_id
    OR
    -- Organization admins can see requests for their organization
    auth.uid() IN (
      SELECT user_id FROM user_organization
      WHERE organization_id = organization_join_request.organization_id
      AND role IN ('owner', 'admin')
    )
  );

-- Policy for users to insert their own requests
DROP POLICY IF EXISTS org_join_request_insert_policy ON organization_join_request;
CREATE POLICY org_join_request_insert_policy ON organization_join_request
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Policy for organization admins to update requests
DROP POLICY IF EXISTS org_join_request_update_policy ON organization_join_request;
CREATE POLICY org_join_request_update_policy ON organization_join_request
  FOR UPDATE USING (
    -- Only organization admins can update requests
    auth.uid() IN (
      SELECT user_id FROM user_organization
      WHERE organization_id = organization_join_request.organization_id
      AND role IN ('owner', 'admin')
    )
  );
`;

/**
 * Run the organization join request migration
 * @param supabase Supabase client
 * @returns Promise that resolves to true if successful
 */
export const runOrganizationJoinRequestMigration = async (supabase: any): Promise<boolean> => {
  try {
    console.log('Running organization join request migration...');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: organizationJoinRequestTableSQL });
    
    if (error) {
      console.error('Error running organization join request migration:', error);
      return false;
    }
    
    console.log('Organization join request migration completed successfully');
    return true;
  } catch (error) {
    console.error('Error running organization join request migration:', error);
    return false;
  }
};
