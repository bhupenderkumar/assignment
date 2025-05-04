-- Add source_assignment_id column to track imported assignments
ALTER TABLE interactive_assignment
ADD COLUMN IF NOT EXISTS source_assignment_id UUID REFERENCES interactive_assignment(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_interactive_assignment_source_id ON interactive_assignment(source_assignment_id);

-- Add is_template column to mark assignments that are meant to be templates/blueprints
ALTER TABLE interactive_assignment
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;

-- Update existing gallery assignments to be templates
UPDATE interactive_assignment
SET is_template = TRUE
WHERE organization_id IS NULL AND status = 'PUBLISHED';

-- Add policy to allow all users to view template assignments
DROP POLICY IF EXISTS "Anyone can view template assignments" ON interactive_assignment;
CREATE POLICY "Anyone can view template assignments" ON interactive_assignment
  FOR SELECT USING (is_template = TRUE);

-- Fix the foreign key constraint in user_progress table to cascade deletes
-- First, drop the existing constraint
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_assignment_id_fkey;

-- Then recreate it with CASCADE option
ALTER TABLE user_progress
ADD CONSTRAINT user_progress_assignment_id_fkey
FOREIGN KEY (assignment_id)
REFERENCES interactive_assignment(id)
ON DELETE CASCADE;
