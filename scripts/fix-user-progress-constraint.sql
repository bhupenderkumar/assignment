-- Fix the foreign key constraint in user_progress table to cascade deletes
-- First, drop the existing constraint
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_assignment_id_fkey;

-- Then recreate it with CASCADE option
ALTER TABLE user_progress 
ADD CONSTRAINT user_progress_assignment_id_fkey 
FOREIGN KEY (assignment_id) 
REFERENCES interactive_assignment(id) 
ON DELETE CASCADE;
