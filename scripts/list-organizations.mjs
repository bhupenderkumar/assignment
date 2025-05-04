// scripts/list-organizations.mjs
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Initialize dotenv
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Function to fetch organizations using the anon key
async function fetchOrganizations() {
  try {
    console.log('Fetching organizations with anon key...');
    console.log(`URL: ${supabaseUrl}/rest/v1/organization?select=*`);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/organization?select=*`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Accept': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch organizations: ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return null;
  }
}

// Run the script
async function run() {
  try {
    console.log('Listing all organizations in the database...');
    const organizations = await fetchOrganizations();
    
    if (!organizations) {
      console.error('Failed to fetch organizations');
      return;
    }
    
    console.log(`Found ${organizations.length} organizations`);
    
    if (organizations.length > 0) {
      console.log('\nOrganization details:');
      organizations.forEach((org, index) => {
        console.log(`\n--- Organization ${index + 1} ---`);
        console.log(`ID: ${org.id}`);
        console.log(`Name: ${org.name}`);
        console.log(`Type: ${org.type}`);
        console.log(`Logo URL: ${org.logo_url || 'None'}`);
        console.log(`Created by: ${org.created_by}`);
        console.log(`Created at: ${org.created_at}`);
      });
    } else {
      console.log('No organizations found in the database');
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
