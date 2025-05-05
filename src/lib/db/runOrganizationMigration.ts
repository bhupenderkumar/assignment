// src/lib/db/runOrganizationMigration.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { organizationTableSQL } from './migrations/organizationMigration';
import toast from 'react-hot-toast';

/**
 * Run the organization migration directly
 * @param supabase Supabase client
 * @returns Promise that resolves to true if successful
 */
export const executeOrganizationMigration = async (supabase: SupabaseClient): Promise<boolean> => {
  try {
    console.log('Running organization migration directly...');

    // Execute the SQL directly
    const { error } = await supabase.rpc('exec_sql', { sql: organizationTableSQL });

    if (error) {
      // If the RPC function doesn't exist, try to run the SQL directly
      if (error.code === 'PGRST202' || error.message?.includes('Could not find the function')) {
        console.warn('exec_sql RPC function not available, trying to create tables directly');

        // Try to create the organization_invitation table directly
        const invitationTableSQL = `
        CREATE TABLE IF NOT EXISTS organization_invitation (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
          email TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'member',
          status TEXT NOT NULL DEFAULT 'PENDING',
          invited_by UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          accepted_at TIMESTAMP WITH TIME ZONE,
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

        // Execute the SQL directly
        const { error: directError } = await supabase.rpc('exec_sql', { sql: invitationTableSQL });

        if (directError) {
          console.error('Error creating organization_invitation table directly:', directError);
          toast.error('Failed to create organization_invitation table');
          return false;
        }

        console.log('Organization invitation table created successfully');
        return true;
      }

      console.error('Error running organization migration:', error);
      toast.error('Failed to run organization migration');
      return false;
    }

    console.log('Organization migration completed successfully');
    toast.success('Organization migration completed successfully');
    return true;
  } catch (error) {
    console.error('Error in organization migration:', error);
    toast.error('Failed to run organization migration');
    return false;
  }
};
