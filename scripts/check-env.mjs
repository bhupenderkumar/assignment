// scripts/check-env.mjs
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Initialize dotenv
dotenv.config();

// Check if .env file exists
const envPath = path.resolve(process.cwd(), '.env');
console.log(`Checking for .env file at: ${envPath}`);
const envExists = fs.existsSync(envPath);
console.log(`.env file exists: ${envExists}`);

if (envExists) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    // Mask sensitive values
    const maskedContent = envContent
      .split('\n')
      .map(line => {
        if (line.includes('KEY') || line.includes('SECRET')) {
          const parts = line.split('=');
          if (parts.length > 1) {
            const value = parts[1].trim();
            if (value.length > 8) {
              return `${parts[0]}=${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
            }
          }
        }
        return line;
      })
      .join('\n');
    
    console.log('Masked .env content:');
    console.log(maskedContent);
  } catch (err) {
    console.error('Error reading .env file:', err);
  }
}

// Check environment variables
console.log('\nChecking environment variables:');
const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

for (const varName of requiredVars) {
  const value = process.env[varName];
  console.log(`${varName}: ${value ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : 'Not set'}`);
}

// Check if we can create a basic Supabase URL
console.log('\nTrying to construct Supabase URL:');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
if (supabaseUrl) {
  console.log(`Base URL: ${supabaseUrl}`);
  console.log(`REST API URL: ${supabaseUrl}/rest/v1/organization`);
} else {
  console.log('Cannot construct Supabase URL: VITE_SUPABASE_URL is not set');
}

console.log('\nScript completed');
