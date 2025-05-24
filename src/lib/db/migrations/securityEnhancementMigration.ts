// src/lib/db/migrations/securityEnhancementMigration.ts

/**
 * Comprehensive security enhancement migration
 * This migration implements all the security fixes identified in the security audit
 */

export const securityEnhancementSQL = `
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
  RETURN email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
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

-- 5. Add rate limiting table
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL, -- IP address or user ID
  action TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_action ON rate_limit_log(identifier, action);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window_start ON rate_limit_log(window_start);

-- 6. Create function to log security events
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

-- 7. Add triggers for security logging
CREATE OR REPLACE FUNCTION trigger_log_assignment_changes() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_security_event('CREATE', 'assignment', NEW.id::TEXT);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_security_event('UPDATE', 'assignment', NEW.id::TEXT);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_security_event('DELETE', 'assignment', OLD.id::TEXT);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS log_assignment_changes ON interactive_assignment;
CREATE TRIGGER log_assignment_changes
  AFTER INSERT OR UPDATE OR DELETE ON interactive_assignment
  FOR EACH ROW EXECUTE FUNCTION trigger_log_assignment_changes();

-- 8. Add content validation constraints
ALTER TABLE interactive_assignment 
  ADD CONSTRAINT check_title_length CHECK (length(title) <= 200),
  ADD CONSTRAINT check_description_length CHECK (length(description) <= 2000),
  ADD CONSTRAINT check_title_not_empty CHECK (trim(title) != '');

ALTER TABLE organization 
  ADD CONSTRAINT check_org_name_valid CHECK (validate_organization_name(name));

-- 9. Clean up old data that might not meet new constraints
UPDATE interactive_assignment 
SET title = left(title, 200) 
WHERE length(title) > 200;

UPDATE interactive_assignment 
SET description = left(description, 2000) 
WHERE length(description) > 2000;

-- 10. Add session security table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add RLS for user sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_sessions_policy ON user_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- 11. Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 12. Add password policy validation (for future use)
CREATE OR REPLACE FUNCTION validate_password_strength(password TEXT) RETURNS BOOLEAN AS $$
BEGIN
  RETURN length(password) >= 8 
    AND password ~ '[A-Z]'  -- uppercase
    AND password ~ '[a-z]'  -- lowercase  
    AND password ~ '[0-9]'  -- digit
    AND password ~ '[^A-Za-z0-9]'; -- special character
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 13. Create security settings table
CREATE TABLE IF NOT EXISTS security_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organization(id) ON DELETE CASCADE,
  max_login_attempts INTEGER DEFAULT 5,
  lockout_duration_minutes INTEGER DEFAULT 15,
  password_expiry_days INTEGER DEFAULT 90,
  require_2fa BOOLEAN DEFAULT false,
  allowed_ip_ranges TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add RLS for security settings
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY security_settings_policy ON security_settings
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organization 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Add notification for security enhancements completion
DO $$
BEGIN
  RAISE NOTICE 'Security enhancement migration completed successfully';
  RAISE NOTICE 'Applied fixes for:';
  RAISE NOTICE '- Organization RLS policies';
  RAISE NOTICE '- Assignment RLS policies'; 
  RAISE NOTICE '- Input validation functions';
  RAISE NOTICE '- Audit logging';
  RAISE NOTICE '- Rate limiting infrastructure';
  RAISE NOTICE '- Content validation constraints';
  RAISE NOTICE '- Session security';
  RAISE NOTICE '- Password policy validation';
  RAISE NOTICE '- Security settings management';
END $$;
`;

/**
 * Run the security enhancement migration
 * @param supabase Supabase client
 * @returns Promise that resolves to true if successful
 */
export const runSecurityEnhancementMigration = async (supabase: any): Promise<boolean> => {
  try {
    console.log('Running security enhancement migration...');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: securityEnhancementSQL });
    
    if (error) {
      console.error('Error running security enhancement migration:', error);
      return false;
    }
    
    console.log('Security enhancement migration completed successfully');
    return true;
  } catch (error) {
    console.error('Error running security enhancement migration:', error);
    return false;
  }
};
