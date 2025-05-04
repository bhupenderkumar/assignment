// scripts/check-organizations-client.mjs
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Initialize dotenv
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client with anon key
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Create Supabase client with service key if available
const supabaseService = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Function to fetch organizations using the anon key
async function fetchOrganizationsWithAnonKey() {
  try {
    console.log('Fetching organizations with anon key...');
    const { data, error } = await supabaseAnon
      .from('organization')
      .select('*');
    
    if (error) {
      console.error('Error fetching organizations with anon key:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception fetching organizations with anon key:', error);
    return null;
  }
}

// Function to fetch organizations using the service key
async function fetchOrganizationsWithServiceKey() {
  if (!supabaseService) {
    console.log('No service key available, skipping service key fetch');
    return null;
  }
  
  try {
    console.log('Fetching organizations with service key...');
    const { data, error } = await supabaseService
      .from('organization')
      .select('*');
    
    if (error) {
      console.error('Error fetching organizations with service key:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception fetching organizations with service key:', error);
    return null;
  }
}

// Function to check RLS policies on the organization table
async function checkRLSPolicies() {
  if (!supabaseService) {
    console.log('No service key available, skipping RLS policy check');
    return;
  }
  
  try {
    console.log('Checking RLS policies on organization table...');
    
    // Check if RLS is enabled
    const { data: rlsData, error: rlsError } = await supabaseService.rpc('check_rls_enabled', {
      table_name: 'organization'
    });
    
    if (rlsError) {
      console.error('Error checking RLS status:', rlsError);
      
      // Try a direct query instead
      console.log('Trying direct query to check RLS status...');
      const { data: pgTablesData, error: pgTablesError } = await supabaseService
        .from('pg_tables')
        .select('rowsecurity')
        .eq('tablename', 'organization')
        .eq('schemaname', 'public')
        .single();
      
      if (pgTablesError) {
        console.error('Error querying pg_tables:', pgTablesError);
      } else {
        console.log('RLS status from pg_tables:', pgTablesData);
      }
    } else {
      console.log('RLS status:', rlsData);
    }
  } catch (error) {
    console.error('Exception checking RLS policies:', error);
  }
}

// Run the script
async function run() {
  try {
    console.log('Checking organizations in the database...');
    
    // Check RLS policies
    await checkRLSPolicies();
    
    // Fetch with anon key
    const anonOrgs = await fetchOrganizationsWithAnonKey();
    console.log(`Found ${anonOrgs ? anonOrgs.length : 0} organizations with anon key`);
    
    if (anonOrgs && anonOrgs.length > 0) {
      console.log('\nOrganization details (anon key):');
      anonOrgs.forEach((org, index) => {
        console.log(`\n--- Organization ${index + 1} ---`);
        console.log(`ID: ${org.id}`);
        console.log(`Name: ${org.name}`);
        console.log(`Type: ${org.type}`);
        console.log(`Logo URL: ${org.logo_url || 'None'}`);
        console.log(`Created by: ${org.created_by}`);
        console.log(`Created at: ${org.created_at}`);
      });
    }
    
    // Fetch with service key
    const serviceOrgs = await fetchOrganizationsWithServiceKey();
    console.log(`Found ${serviceOrgs ? serviceOrgs.length : 0} organizations with service key`);
    
    if (serviceOrgs && serviceOrgs.length > 0) {
      console.log('\nOrganization details (service key):');
      serviceOrgs.forEach((org, index) => {
        console.log(`\n--- Organization ${index + 1} ---`);
        console.log(`ID: ${org.id}`);
        console.log(`Name: ${org.name}`);
        console.log(`Type: ${org.type}`);
        console.log(`Logo URL: ${org.logo_url || 'None'}`);
        console.log(`Created by: ${org.created_by}`);
        console.log(`Created at: ${org.created_at}`);
      });
    }
    
    console.log('\nScript completed successfully');
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
