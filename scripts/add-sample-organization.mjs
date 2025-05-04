// scripts/add-sample-organization.mjs
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Initialize dotenv
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Function to run SQL using the pgSQL endpoint
async function runSQL(sql) {
  try {
    console.log('Running SQL...');
    // Use the correct REST API endpoint for SQL queries
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to run SQL: ${errorText}`);
    }
    console.log('SQL executed successfully');
    return await response.json();
  } catch (error) {
    console.error('Error running SQL:', error);
    throw error;
  }
}

// SQL to check if there are any organizations in the database
const checkOrganizationsSQL = `
-- Count organizations in the database
SELECT COUNT(*) FROM organization;
`;

// SQL to add a sample organization
const addSampleOrganizationSQL = `
-- Insert a sample organization if none exists
INSERT INTO organization (
  name,
  type,
  logo_url,
  primary_color,
  secondary_color,
  header_text,
  signature_url,
  created_by
)
VALUES (
  'Sample Organization',
  'company',
  NULL,
  '#3B82F6',
  '#6366F1',
  'Welcome to Sample Organization',
  'https://via.placeholder.com/200x100?text=Signature',
  (SELECT id FROM auth.users LIMIT 1)
)
RETURNING id;
`;

// SQL to add a user_organization record for the sample organization
const addUserOrganizationSQL = (organizationId) => `
-- Add all users as members of the sample organization
INSERT INTO user_organization (
  user_id,
  organization_id,
  role
)
SELECT
  id,
  '${organizationId}',
  'owner'
FROM auth.users
ON CONFLICT (user_id, organization_id) DO NOTHING;
`;

// Run the script
async function run() {
  try {
    console.log('Checking if organizations exist...');
    const countResult = await runSQL(checkOrganizationsSQL);
    const count = parseInt(countResult.data[0].count, 10);

    console.log(`Found ${count} organizations`);

    if (count === 0) {
      console.log('No organizations found. Adding a sample organization...');
      const orgResult = await runSQL(addSampleOrganizationSQL);

      if (orgResult.data && orgResult.data.length > 0) {
        const organizationId = orgResult.data[0].id;
        console.log(`Sample organization created with ID: ${organizationId}`);

        // Add user_organization records
        console.log('Adding users to the sample organization...');
        await runSQL(addUserOrganizationSQL(organizationId));
        console.log('Users added to the sample organization');
      } else {
        console.error('Failed to create sample organization');
      }
    } else {
      console.log('Organizations already exist. No need to add a sample organization.');
    }

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
