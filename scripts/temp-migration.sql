-- Create ratings_reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS ratings_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES interactive_assignment(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID REFERENCES organization(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Add a unique constraint to prevent duplicate reviews from the same user
  UNIQUE(assignment_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ratings_reviews_assignment_id ON ratings_reviews(assignment_id);

-- Add RLS policies for ratings_reviews table
ALTER TABLE ratings_reviews ENABLE ROW LEVEL SECURITY;

-- Policy for users to view all ratings (public gallery)
DROP POLICY IF EXISTS "Anyone can view ratings" ON ratings_reviews;
CREATE POLICY "Anyone can view ratings" ON ratings_reviews
  FOR SELECT USING (true);

-- Policy for users to create their own ratings
DROP POLICY IF EXISTS "Users can create their own ratings" ON ratings_reviews;
CREATE POLICY "Users can create their own ratings" ON ratings_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (
      organization_id IN (
        SELECT organization_id FROM user_organization
        WHERE user_id = auth.uid()
      ) OR
      organization_id IS NULL
    )
  );

-- Policy for users to update their own ratings
DROP POLICY IF EXISTS "Users can update their own ratings" ON ratings_reviews;
CREATE POLICY "Users can update their own ratings" ON ratings_reviews
  FOR UPDATE USING (
    auth.uid() = user_id AND
    (
      organization_id IN (
        SELECT organization_id FROM user_organization
        WHERE user_id = auth.uid()
      ) OR
      organization_id IS NULL
    )
  );

-- Policy for users to delete their own ratings
DROP POLICY IF EXISTS "Users can delete their own ratings" ON ratings_reviews;
CREATE POLICY "Users can delete their own ratings" ON ratings_reviews
  FOR DELETE USING (
    auth.uid() = user_id AND
    (
      organization_id IN (
        SELECT organization_id FROM user_organization
        WHERE user_id = auth.uid()
      ) OR
      organization_id IS NULL
    )
  );

-- Create function to calculate average rating
CREATE OR REPLACE FUNCTION calculate_avg_rating(assignment_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  avg_rating NUMERIC;
BEGIN
  SELECT AVG(rating) INTO avg_rating
  FROM ratings_reviews
  WHERE assignment_id = assignment_uuid;

  RETURN avg_rating;
END;
$$ LANGUAGE plpgsql;

-- Now continue with the original add-source-assignment-id.sql content
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
