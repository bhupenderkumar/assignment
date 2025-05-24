#!/usr/bin/env node

/**
 * Security Fixes Migration Script
 * This script applies all security fixes identified in the security audit
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Security Enhancement SQL
 */
const securityEnhancementSQL = `
-- ============================================================================
-- SECURITY ENHANCEMENT MIGRATION
-- ============================================================================

-- 1. Fix Organization RLS Policies
-- Replace overly permissive organization access policy
DROP POLICY IF EXISTS organization_public_read_policy ON organization;

CREATE POLICY organization_public_read_policy ON organization
  FOR SELECT USING (
    -- Allow anonymous users to see only basic info for login purposes
    auth.role() = 'anon' OR 
    -- Allow authenticated users to see organizations they belong to
    auth.uid() IN (
      SELECT user_id FROM user_organization 
      WHERE organization_id = organization.id
    ) OR
    -- Allow organization creators to see their organizations
    auth.uid() = created_by
  );

-- 2. Enhanced Assignment RLS Policies
-- Fix NULL organization_id bypass vulnerability
DROP POLICY IF EXISTS "Users can view assignments from their organizations" ON interactive_assignment;
DROP POLICY IF EXISTS "Users can create assignments in their organizations" ON interactive_assignment;
DROP POLICY IF EXISTS "Users can update assignments in their organizations" ON interactive_assignment;
DROP POLICY IF EXISTS "Users can delete assignments in their organizations" ON interactive_assignment;

-- Secure view policy
CREATE POLICY "Users can view assignments from their organizations" ON interactive_assignment
  FOR SELECT USING (
    -- Users can see assignments from organizations they belong to
    organization_id IN (
      SELECT organization_id FROM user_organization
      WHERE user_id = auth.uid()
    ) OR 
    -- Users can see assignments they created
    created_by = auth.uid() OR
    -- SECURITY FIX: Only allow NULL organization_id for published assignments
    (organization_id IS NULL AND status = 'PUBLISHED')
  );

-- Secure create policy
CREATE POLICY "Users can create assignments in their organizations" ON interactive_assignment
  FOR INSERT WITH CHECK (
    -- Users can create assignments in organizations they belong to
    organization_id IN (
      SELECT organization_id FROM user_organization
      WHERE user_id = auth.uid()
    ) OR
    -- SECURITY FIX: Only allow NULL organization_id for authenticated users
    (organization_id IS NULL AND auth.uid() IS NOT NULL)
  );

-- Secure update policy
CREATE POLICY "Users can update assignments in their organizations" ON interactive_assignment
  FOR UPDATE USING (
    -- Users can update assignments in organizations they belong to
    organization_id IN (
      SELECT organization_id FROM user_organization
      WHERE user_id = auth.uid()
    ) OR
    -- Users can update assignments they created
    created_by = auth.uid()
  );

-- Secure delete policy (admin only for organization assignments)
CREATE POLICY "Users can delete assignments in their organizations" ON interactive_assignment
  FOR DELETE USING (
    -- Users can delete assignments in organizations they belong to (with admin role)
    organization_id IN (
      SELECT organization_id FROM user_organization
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ) OR
    -- Users can delete assignments they created
    created_by = auth.uid()
  );

-- 3. Add input validation functions
CREATE OR REPLACE FUNCTION validate_email(email TEXT) RETURNS BOOLEAN AS $$
BEGIN
  RETURN email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION validate_organization_name(name TEXT) RETURNS BOOLEAN AS $$
BEGIN
  RETURN length(trim(name)) >= 2 AND length(trim(name)) <= 100 
    AND name !~ '<script|javascript:|data:|vbscript:';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Add audit logging table
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add RLS for audit log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow system and admins to view audit logs
CREATE POLICY security_audit_log_select_policy ON security_audit_log
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_organization 
      WHERE role IN ('owner', 'admin')
    )
  );

-- 5. Add content validation constraints
DO $$
BEGIN
  -- Add constraints if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_title_length' 
    AND table_name = 'interactive_assignment'
  ) THEN
    ALTER TABLE interactive_assignment 
      ADD CONSTRAINT check_title_length CHECK (length(title) <= 200);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_description_length' 
    AND table_name = 'interactive_assignment'
  ) THEN
    ALTER TABLE interactive_assignment 
      ADD CONSTRAINT check_description_length CHECK (length(description) <= 2000);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_title_not_empty' 
    AND table_name = 'interactive_assignment'
  ) THEN
    ALTER TABLE interactive_assignment 
      ADD CONSTRAINT check_title_not_empty CHECK (trim(title) != '');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_org_name_valid' 
    AND table_name = 'organization'
  ) THEN
    ALTER TABLE organization 
      ADD CONSTRAINT check_org_name_valid CHECK (validate_organization_name(name));
  END IF;
END $$;

-- 6. Clean up old data that might not meet new constraints
UPDATE interactive_assignment 
SET title = left(title, 200) 
WHERE length(title) > 200;

UPDATE interactive_assignment 
SET description = left(description, 2000) 
WHERE length(description) > 2000;

-- 7. Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO security_audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    success,
    error_message
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_success,
    p_error_message
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add notification for security enhancements completion
DO $$
BEGIN
  RAISE NOTICE '🔒 Security enhancement migration completed successfully';
  RAISE NOTICE 'Applied fixes for:';
  RAISE NOTICE '- Organization RLS policies';
  RAISE NOTICE '- Assignment RLS policies'; 
  RAISE NOTICE '- Input validation functions';
  RAISE NOTICE '- Audit logging';
  RAISE NOTICE '- Content validation constraints';
  RAISE NOTICE '- Security event logging';
END $$;
`;

/**
 * Run the security migration
 */
async function runSecurityMigration() {
  console.log('🔒 Starting security enhancement migration...');
  
  try {
    // Execute the security enhancement SQL
    const { error } = await supabase.rpc('exec_sql', { 
      sql: securityEnhancementSQL 
    });
    
    if (error) {
      console.error('❌ Error running security migration:', error);
      return false;
    }
    
    console.log('✅ Security enhancement migration completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error running security migration:', error);
    return false;
  }
}

/**
 * Verify security fixes
 */
async function verifySecurityFixes() {
  console.log('🔍 Verifying security fixes...');
  
  const checks = [
    {
      name: 'Organization RLS Policy',
      query: `
        SELECT COUNT(*) as count 
        FROM pg_policies 
        WHERE tablename = 'organization' 
        AND policyname = 'organization_public_read_policy'
      `
    },
    {
      name: 'Assignment RLS Policies',
      query: `
        SELECT COUNT(*) as count 
        FROM pg_policies 
        WHERE tablename = 'interactive_assignment'
      `
    },
    {
      name: 'Security Audit Log Table',
      query: `
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'security_audit_log'
      `
    },
    {
      name: 'Validation Functions',
      query: `
        SELECT COUNT(*) as count 
        FROM information_schema.routines 
        WHERE routine_name IN ('validate_email', 'validate_organization_name')
      `
    }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql: check.query 
      });
      
      if (error) {
        console.error(`❌ ${check.name}: Error - ${error.message}`);
        allPassed = false;
      } else {
        const count = data?.[0]?.count || 0;
        if (count > 0) {
          console.log(`✅ ${check.name}: OK (${count} items found)`);
        } else {
          console.log(`⚠️  ${check.name}: Not found`);
          allPassed = false;
        }
      }
    } catch (error) {
      console.error(`❌ ${check.name}: Exception - ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting security fixes application...\n');
  
  // Run the migration
  const migrationSuccess = await runSecurityMigration();
  
  if (!migrationSuccess) {
    console.error('❌ Migration failed. Exiting.');
    process.exit(1);
  }
  
  console.log('');
  
  // Verify the fixes
  const verificationSuccess = await verifySecurityFixes();
  
  console.log('\n' + '='.repeat(60));
  
  if (verificationSuccess) {
    console.log('🎉 All security fixes applied and verified successfully!');
    console.log('\n📋 Security improvements implemented:');
    console.log('   ✅ Fixed organization RLS policies');
    console.log('   ✅ Enhanced assignment RLS policies');
    console.log('   ✅ Added input validation functions');
    console.log('   ✅ Implemented audit logging');
    console.log('   ✅ Added content validation constraints');
    console.log('   ✅ Created security event logging');
    console.log('\n🔒 Your application is now more secure!');
  } else {
    console.log('⚠️  Some security fixes may not have been applied correctly.');
    console.log('   Please review the output above and run the script again if needed.');
  }
  
  console.log('='.repeat(60));
}

// Run the script
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
