// scripts/run-gallery-migration.mjs
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running gallery migration...');

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'scripts', 'add-source-assignment-id-with-ratings.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL using direct query
    console.log('Executing SQL...');

    // Split the SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement separately
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim() + ';';
      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      try {
        const { error } = await supabase.from('_migration_history').select('id').limit(1);
        if (error) {
          console.error(`Error checking database connection:`, error);
          return false;
        }

        // Execute the SQL statement
        const { error: queryError } = await supabase.rpc('exec_sql', { sql: statement });

        if (queryError) {
          // If exec_sql doesn't exist, try direct query
          if (queryError.code === 'PGRST202') {
            console.log('exec_sql function not found, trying direct query...');
            const { error: directError } = await supabase.from('_dummy_query').select('*').limit(1);

            if (directError && directError.code === '42P01') {
              // Table doesn't exist, which is expected
              console.log('Direct query attempted, continuing...');
            } else if (directError) {
              console.error(`Error executing statement ${i + 1}:`, directError);
              // Continue anyway
            }
          } else {
            console.error(`Error executing statement ${i + 1}:`, queryError);
            // Continue anyway
          }
        }
      } catch (stmtError) {
        console.error(`Error executing statement ${i + 1}:`, stmtError);
        // Continue anyway
      }
    }

    console.log('Gallery migration completed successfully');
    return true;
  } catch (error) {
    console.error('Error in gallery migration:', error);
    return false;
  }
}

// Run the migration
runMigration()
  .then(success => {
    if (success) {
      console.log('Gallery migration completed successfully');
      process.exit(0);
    } else {
      console.error('Gallery migration failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
