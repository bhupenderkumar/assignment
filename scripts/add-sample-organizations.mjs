// scripts/add-sample-organizations.mjs
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

// Sample organizations data
const sampleOrganizations = [
  {
    name: 'First Step School',
    type: 'school',
    logo_url: null,
    primary_color: '#3B82F6',
    secondary_color: '#6366F1',
    header_text: 'Welcome to First Step School',
    signature_url: 'https://via.placeholder.com/200x100?text=Signature'
  },
  {
    name: 'Second School',
    type: 'school',
    logo_url: null,
    primary_color: '#10B981',
    secondary_color: '#059669',
    header_text: 'Welcome to Second School',
    signature_url: 'https://via.placeholder.com/200x100?text=Signature'
  }
];

// Function to check if organizations exist
async function checkOrganizations() {
  try {
    console.log('Checking if organizations exist...');
    
    const { data, error } = await supabase
      .from('organization')
      .select('id, name')
      .limit(10);
    
    if (error) {
      console.error('Error checking organizations:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception checking organizations:', error);
    return null;
  }
}

// Function to add a sample organization
async function addSampleOrganization(organization) {
  try {
    console.log(`Adding sample organization: ${organization.name}`);
    
    // Get a user to set as the creator
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1);
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return null;
    }
    
    if (!users || users.length === 0) {
      console.error('No users found in the database');
      return null;
    }
    
    const userId = users[0].id;
    
    // Add created_by field to the organization
    const orgData = {
      ...organization,
      created_by: userId
    };
    
    // Insert the organization
    const { data, error } = await supabase
      .from('organization')
      .insert(orgData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating organization:', error);
      return null;
    }
    
    console.log(`Organization created with ID: ${data.id}`);
    
    // Create user_organization record
    const { error: userOrgError } = await supabase
      .from('user_organization')
      .insert({
        user_id: userId,
        organization_id: data.id,
        role: 'owner'
      });
    
    if (userOrgError) {
      console.error('Error creating user_organization record:', userOrgError);
    }
    
    return data;
  } catch (error) {
    console.error('Exception creating organization:', error);
    return null;
  }
}

// Function to update RLS policies
async function updateRLSPolicies() {
  try {
    console.log('Updating RLS policies for organization table...');
    
    // Check if RLS is enabled
    const { data: rlsData, error: rlsError } = await supabase
      .from('pg_tables')
      .select('rowsecurity')
      .eq('tablename', 'organization')
      .eq('schemaname', 'public')
      .single();
    
    if (rlsError) {
      console.error('Error checking RLS status:', rlsError);
      return false;
    }
    
    console.log('RLS status:', rlsData);
    
    // If RLS is enabled, create a public access policy
    if (rlsData.rowsecurity) {
      // Execute SQL to create the policy
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          -- Create a policy for public access to basic organization info
          DROP POLICY IF EXISTS organization_public_read_policy ON organization;
          
          CREATE POLICY organization_public_read_policy ON organization
            FOR SELECT USING (true);
        `
      });
      
      if (error) {
        console.error('Error creating public access policy:', error);
        return false;
      }
      
      console.log('Public access policy created successfully');
      return true;
    } else {
      console.log('RLS is not enabled on the organization table');
      return false;
    }
  } catch (error) {
    console.error('Exception updating RLS policies:', error);
    return false;
  }
}

// Run the script
async function run() {
  try {
    // Check if organizations exist
    const organizations = await checkOrganizations();
    
    if (!organizations) {
      console.error('Failed to check organizations');
      return;
    }
    
    console.log(`Found ${organizations.length} organizations`);
    
    // If no organizations exist, add sample organizations
    if (organizations.length === 0) {
      console.log('No organizations found. Adding sample organizations...');
      
      for (const org of sampleOrganizations) {
        await addSampleOrganization(org);
      }
      
      console.log('Sample organizations added successfully');
    } else {
      console.log('Organizations already exist:');
      organizations.forEach(org => {
        console.log(`- ${org.name} (${org.id})`);
      });
    }
    
    // Update RLS policies
    await updateRLSPolicies();
    
    console.log('Script completed successfully');
  } catch (error) {
    console.error('Error running script:', error);
  }
}

// Run the script
run()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
