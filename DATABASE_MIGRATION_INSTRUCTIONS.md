# Database Migration Instructions

## Issue
The `user_progress` table is missing some required columns that were added in recent updates:
- `current_question_index`
- `questions_answered` 
- `created_at`
- `updated_at`

## Quick Fix

### Option 1: Use the Admin Dashboard (Recommended)
1. Go to **Admin Dashboard** → **Database** tab
2. Click **"Fix Progress Table"** button
3. Check the console logs for any SQL commands that need to be run manually
4. Click **"Test Progress Table"** to verify the fix

### Option 2: Manual SQL Execution
If the automated fix doesn't work, run these SQL commands in your **Supabase SQL Editor**:

```sql
-- Add missing columns to user_progress table
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS questions_answered INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create or replace trigger function for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at column
DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_assignment_id ON user_progress(assignment_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_status ON user_progress(status);
CREATE INDEX IF NOT EXISTS idx_user_progress_created_at ON user_progress(created_at);
```

## How to Access Supabase SQL Editor

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar
4. Create a new query
5. Paste the SQL commands above
6. Click **"Run"** to execute

## Verification

After running the migration, verify it worked by:

1. Going back to **Admin Dashboard** → **Database** tab
2. Click **"Test Progress Table"**
3. You should see: ✅ All user_progress table tests passed

## What These Changes Do

- **`current_question_index`**: Tracks which question the user is currently on
- **`questions_answered`**: Counts how many questions the user has answered
- **`created_at`**: Records when the progress record was first created
- **`updated_at`**: Automatically updates when the record is modified
- **Indexes**: Improve query performance for common lookups
- **Trigger**: Automatically updates the `updated_at` timestamp

## Troubleshooting

### If you get permission errors:
- Make sure you're logged in as the project owner
- Check that your Supabase project has the necessary permissions

### If columns already exist:
- The `IF NOT EXISTS` clause will prevent errors if columns already exist
- You can safely run the commands multiple times

### If you see "relation does not exist" errors:
- Make sure the `user_progress` table exists
- Check that you're connected to the correct database

## After Migration

Once the migration is complete:

1. **Test the Progress Dashboard**: Go to Admin Dashboard → User Progress tab
2. **Check Contact Info**: Verify that contact information appears for users
3. **Test WhatsApp**: Try sending a WhatsApp message to a user with contact info
4. **Test Export**: Try exporting progress data to CSV/JSON

## Need Help?

If you encounter any issues:

1. Check the browser console for detailed error messages
2. Look at the migration logs in the Admin Dashboard
3. Verify your Supabase project permissions
4. Make sure you're using the correct database/project

The migration should resolve the schema issues and enable all the new progress tracking and contact features!
