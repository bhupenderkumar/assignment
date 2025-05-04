// scripts/check-organization-access.mjs
import dotenv from 'dotenv';
import fetch from 'node-fetch';

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

// Function to fetch organizations using the anon key
async function fetchOrganizations() {
  try {
    console.log('Fetching organizations with anon key...');
    const response = await fetch(`${supabaseUrl}/rest/v1/organization?select=*&limit=10`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    console.log('Response status:', response.status);

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

// Function to check if there are any organizations
async function checkOrganizations() {
  try {
    console.log('Checking if organizations exist...');
    const organizations = await fetchOrganizations();

    if (!organizations) {
      console.error('Failed to fetch organizations');
      return;
    }

    console.log(`Found ${organizations.length} organizations`);

    if (organizations.length > 0) {
      console.log('Sample organization data:');
      console.log(JSON.stringify(organizations[0], null, 2));
    } else {
      console.log('No organizations found');

      // If we have a service key, we can try to create a sample organization
      if (supabaseServiceKey) {
        console.log('Creating a sample organization...');
        await createSampleOrganization();
      }
    }
  } catch (error) {
    console.error('Error checking organizations:', error);
  }
}

// Run the checks
async function run() {
  try {
    await checkOrganizations();
    console.log('\nChecks completed successfully');
  } catch (error) {
    console.error('Error running checks:', error);
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
