// src/lib/db/migrations/assignmentRlsMigration.ts

// SQL to create RLS policies for interactive_assignment table
export const assignmentRlsSQL = `
-- Enable RLS on interactive_assignment table
ALTER TABLE interactive_assignment ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view assignments from their organizations" ON interactive_assignment;
DROP POLICY IF EXISTS "Users can create assignments in their organizations" ON interactive_assignment;
DROP POLICY IF EXISTS "Users can update assignments in their organizations" ON interactive_assignment;
DROP POLICY IF EXISTS "Users can delete assignments in their organizations" ON interactive_assignment;

-- Policy for users to view assignments from their organizations
CREATE POLICY "Users can view assignments from their organizations" ON interactive_assignment
  FOR SELECT USING (
    -- Users can see assignments from organizations they belong to
    organization_id IN (
      SELECT organization_id FROM user_organization
      WHERE user_id = auth.uid()
    ) OR
    -- Users can see assignments they created
    created_by = auth.uid() OR
    -- SECURITY FIX: Only allow NULL organization_id for published assignments
    (organization_id IS NULL AND status = 'PUBLISHED')
  );

-- Policy for users to create assignments in their organizations
CREATE POLICY "Users can create assignments in their organizations" ON interactive_assignment
  FOR INSERT WITH CHECK (
    -- Users can create assignments in organizations they belong to
    organization_id IN (
      SELECT organization_id FROM user_organization
      WHERE user_id = auth.uid()
    ) OR
    -- SECURITY FIX: Only allow NULL organization_id for system/template assignments
    (organization_id IS NULL AND auth.uid() IS NOT NULL)
  );

-- Policy for users to update assignments in their organizations
CREATE POLICY "Users can update assignments in their organizations" ON interactive_assignment
  FOR UPDATE USING (
    -- Users can update assignments in organizations they belong to
    organization_id IN (
      SELECT organization_id FROM user_organization
      WHERE user_id = auth.uid()
    ) OR
    -- Users can update assignments they created
    created_by = auth.uid()
  );

-- Policy for users to delete assignments in their organizations
CREATE POLICY "Users can delete assignments in their organizations" ON interactive_assignment
  FOR DELETE USING (
    -- Users can delete assignments in organizations they belong to (with admin role)
    organization_id IN (
      SELECT organization_id FROM user_organization
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ) OR
    -- Users can delete assignments they created
    created_by = auth.uid()
  );
`;
