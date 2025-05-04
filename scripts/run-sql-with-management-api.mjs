// scripts/run-sql-with-management-api.mjs
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Extract project ID from the URL
const projectId = supabaseUrl.match(/https:\/\/([^.]+)/)[1];

async function runSql() {
  try {
    console.log('Running SQL script...');
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'scripts', 'add-source-assignment-id-with-ratings.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Create a temporary SQL file that we'll run directly using the Supabase CLI
    const tempSqlFilePath = path.join(process.cwd(), 'scripts', 'temp-migration.sql');
    fs.writeFileSync(tempSqlFilePath, sql);
    
    console.log('Created temporary SQL file:', tempSqlFilePath);
    console.log('Please run the following command to execute the SQL:');
    console.log(`supabase db execute --file ${tempSqlFilePath}`);
    
    console.log('\nAlternatively, you can run the SQL directly in the Supabase dashboard:');
    console.log(`1. Go to https://supabase.com/dashboard/project/${projectId}/sql/new`);
    console.log('2. Copy and paste the SQL from the file');
    console.log('3. Click "Run" to execute the SQL');
    
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

// Run the SQL
runSql()
  .then(success => {
    if (success) {
      console.log('Script completed successfully');
      process.exit(0);
    } else {
      console.error('Script failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
