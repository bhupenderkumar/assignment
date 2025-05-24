-- Create user activity log table
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  activity_description TEXT NOT NULL,
  page_url TEXT,
  component TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);

-- Create index on activity_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_user_activity_log_activity_type ON user_activity_log(activity_type);

-- Create index on timestamp for faster time-based queries
CREATE INDEX IF NOT EXISTS idx_user_activity_log_timestamp ON user_activity_log(timestamp);

-- Add RLS policies
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Only allow admins to view all logs
CREATE POLICY "Admins can view all logs" 
  ON user_activity_log 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_organization uo
      WHERE uo.user_id = auth.uid() 
      AND uo.role = 'admin'
    )
  );

-- Users can view their own logs
CREATE POLICY "Users can view their own logs" 
  ON user_activity_log 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Only the system can insert logs
CREATE POLICY "System can insert logs" 
  ON user_activity_log 
  FOR INSERT 
  WITH CHECK (true);

-- No one can update logs
CREATE POLICY "No one can update logs" 
  ON user_activity_log 
  FOR UPDATE 
  USING (false);

-- Only admins can delete logs
CREATE POLICY "Only admins can delete logs" 
  ON user_activity_log 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_organization uo
      WHERE uo.user_id = auth.uid() 
      AND uo.role = 'admin'
    )
  );
