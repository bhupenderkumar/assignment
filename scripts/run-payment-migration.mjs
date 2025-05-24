// scripts/run-payment-migration.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL and service role key are required');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    const sqlFilePath = path.join(__dirname, 'add-payment-settings.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Running payment migration...');
    const { error } = await supabase.rpc('run_sql', { query: sqlContent });

    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }

    console.log('Payment migration completed successfully!');
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();