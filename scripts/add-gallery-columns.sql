-- Add gallery-related fields to interactive_assignment table
ALTER TABLE interactive_assignment 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_interactive_assignment_category ON interactive_assignment(category);
CREATE INDEX IF NOT EXISTS idx_interactive_assignment_topic ON interactive_assignment(topic);

-- Add a policy to allow all users to view published assignments
DROP POLICY IF EXISTS "Anyone can view published assignments" ON interactive_assignment;
CREATE POLICY "Anyone can view published assignments" ON interactive_assignment
  FOR SELECT USING (status = 'PUBLISHED');
