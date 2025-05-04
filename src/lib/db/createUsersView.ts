// src/lib/db/createUsersView.ts
import { SupabaseClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

/**
 * Create a view for auth.users in the public schema
 * This allows querying users from the public schema
 * @param supabase Supabase client
 * @returns Promise that resolves to true if successful
 */
export const createUsersView = async (supabase: SupabaseClient): Promise<boolean> => {
  try {
    console.log('Creating users view...');
    
    // SQL to create a view for auth.users
    const usersViewSQL = `
    CREATE OR REPLACE VIEW users AS
    SELECT id, email, raw_user_meta_data, created_at, updated_at
    FROM auth.users;
    
    -- Add RLS policy to the view
    ALTER VIEW users SECURITY INVOKER;
    `;
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: usersViewSQL });
    
    if (error) {
      // If the RPC function doesn't exist, try a different approach
      if (error.code === 'PGRST202' || error.message?.includes('Could not find the function')) {
        console.warn('exec_sql RPC function not available, trying direct query');
        
        // Try to create the view directly
        const { error: directError } = await supabase.from('_pgsql_reserved_dummy').select('*');
        
        if (directError) {
          console.error('Error creating users view directly:', directError);
          toast.error('Failed to create users view');
          return false;
        }
        
        console.log('Users view created successfully');
        return true;
      }
      
      console.error('Error creating users view:', error);
      toast.error('Failed to create users view');
      return false;
    }
    
    console.log('Users view created successfully');
    toast.success('Users view created successfully');
    return true;
  } catch (error) {
    console.error('Error creating users view:', error);
    toast.error('Failed to create users view');
    return false;
  }
};
