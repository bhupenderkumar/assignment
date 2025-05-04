// scripts/run-sql-with-rest-api.mjs
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function runSql() {
  try {
    console.log('Running SQL script...');
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'scripts', 'add-source-assignment-id-with-ratings.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sql.split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement separately using the REST API
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\nExecuting statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
      
      try {
        // Use a simple query to test if we can connect to the database
        const { error: testError } = await supabase
          .from('_migration_history')
          .select('id')
          .limit(1);
        
        if (testError && testError.code !== '42P01') {
          console.error('Error connecting to database:', testError);
          continue;
        }
        
        // Try to execute the statement using a simple query
        // This won't work for all statements, but it's a start
        if (statement.toLowerCase().startsWith('create table')) {
          console.log('Skipping table creation - please run this manually in the Supabase dashboard');
          continue;
        } else if (statement.toLowerCase().startsWith('alter table')) {
          console.log('Skipping table alteration - please run this manually in the Supabase dashboard');
          continue;
        } else if (statement.toLowerCase().startsWith('create index')) {
          console.log('Skipping index creation - please run this manually in the Supabase dashboard');
          continue;
        } else if (statement.toLowerCase().startsWith('drop policy')) {
          console.log('Skipping policy drop - please run this manually in the Supabase dashboard');
          continue;
        } else if (statement.toLowerCase().startsWith('create policy')) {
          console.log('Skipping policy creation - please run this manually in the Supabase dashboard');
          continue;
        } else if (statement.toLowerCase().startsWith('create or replace function')) {
          console.log('Skipping function creation - please run this manually in the Supabase dashboard');
          continue;
        } else if (statement.toLowerCase().startsWith('update')) {
          // Try to execute an update statement
          const tableName = statement.toLowerCase().split('update')[1].trim().split(' ')[0];
          console.log(`Attempting to update table ${tableName}`);
          const { error } = await supabase.from(tableName).update({ dummy: 'dummy' }).eq('id', 'dummy');
          if (error && error.code !== '42P01' && error.code !== '42703') {
            console.error(`Error updating table ${tableName}:`, error);
          }
          console.log('Please run this update statement manually in the Supabase dashboard');
          continue;
        }
        
        console.log('This statement needs to be run manually in the Supabase dashboard');
      } catch (stmtError) {
        console.error(`Error executing statement ${i + 1}:`, stmtError);
      }
    }
    
    console.log('\n===== IMPORTANT =====');
    console.log('Some SQL statements could not be executed automatically.');
    console.log('Please run the SQL manually in the Supabase dashboard:');
    console.log(`1. Go to https://supabase.com/dashboard/project/${supabaseUrl.match(/https:\/\/([^.]+)/)[1]}/sql/new`);
    console.log(`2. Copy and paste the SQL from: ${sqlFilePath}`);
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
      console.log('\nScript completed successfully');
      process.exit(0);
    } else {
      console.error('\nScript failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
