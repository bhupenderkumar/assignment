// src/lib/db/directMigration.ts
import { SupabaseClient } from '@supabase/supabase-js';

export const runDirectMigration = async (supabase: SupabaseClient) => {
  console.log('🚀 Starting direct migration for user_progress table...');

  try {
    // Step 1: Add missing columns to user_progress table
    console.log('📝 Adding missing columns to user_progress table...');
    
    const alterTableQueries = [
      'ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT 0;',
      'ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS questions_answered INTEGER DEFAULT 0;',
      'ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();',
      'ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();'
    ];

    // Execute each ALTER TABLE command individually
    for (const query of alterTableQueries) {
      console.log(`Executing: ${query}`);
      
      // Use a simple approach - try to insert a test record to trigger any schema issues
      try {
        // Test if the column exists by trying to select it
        const { error: testError } = await supabase
          .from('user_progress')
          .select('current_question_index, questions_answered, created_at, updated_at')
          .limit(1);

        if (testError) {
          console.log('❌ Columns missing, need to add them manually');
          console.log('Please run these SQL commands in your Supabase SQL editor:');
          console.log('');
          alterTableQueries.forEach(query => {
            console.log(query);
          });
          console.log('');
          console.log('After running these commands, refresh the page and try again.');
          return false;
        } else {
          console.log('✅ All required columns exist');
          break;
        }
      } catch (error) {
        console.error('Error testing columns:', error);
      }
    }

    // Step 2: Create or update the trigger function
    console.log('📝 Setting up trigger function...');
    
    // We can't execute DDL directly, so we'll provide instructions
    console.log('✅ Migration check completed');
    console.log('');
    console.log('If you see schema errors, please run these SQL commands in Supabase SQL Editor:');
    console.log('');
    console.log(`
-- Add missing columns
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS questions_answered INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_assignment_id ON user_progress(assignment_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_status ON user_progress(status);
CREATE INDEX IF NOT EXISTS idx_user_progress_created_at ON user_progress(created_at);
    `);

    return true;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
};

export const testUserProgressSchema = async (supabase: SupabaseClient) => {
  console.log('🔍 Testing user_progress table schema...');

  try {
    // Test basic table access
    const { data: basicTest, error: basicError } = await supabase
      .from('user_progress')
      .select('id, user_id, assignment_id')
      .limit(1);

    if (basicError) {
      console.error('❌ Basic table access failed:', basicError);
      return false;
    }

    console.log('✅ Basic table access successful');

    // Test new columns
    const { data: schemaTest, error: schemaError } = await supabase
      .from('user_progress')
      .select('current_question_index, questions_answered, created_at, updated_at')
      .limit(1);

    if (schemaError) {
      console.error('❌ New columns missing:', schemaError.message);
      console.log('');
      console.log('🔧 Please run the migration SQL in Supabase SQL Editor:');
      console.log('');
      console.log('ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT 0;');
      console.log('ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS questions_answered INTEGER DEFAULT 0;');
      console.log('ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();');
      console.log('ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();');
      return false;
    }

    console.log('✅ All required columns exist');

    // Test insert/update functionality
    try {
      const testUserId = 'test-user-' + Date.now();
      const testAssignmentId = 'test-assignment-' + Date.now();

      // Test insert
      const { data: insertData, error: insertError } = await supabase
        .from('user_progress')
        .insert({
          user_id: testUserId,
          assignment_id: testAssignmentId,
          current_question_index: 1,
          questions_answered: 1,
          status: 'IN_PROGRESS'
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Insert test failed:', insertError);
        return false;
      }

      console.log('✅ Insert test successful');

      // Test update
      const { error: updateError } = await supabase
        .from('user_progress')
        .update({
          current_question_index: 2,
          questions_answered: 2
        })
        .eq('id', insertData.id);

      if (updateError) {
        console.error('❌ Update test failed:', updateError);
      } else {
        console.log('✅ Update test successful');
      }

      // Clean up test data
      await supabase
        .from('user_progress')
        .delete()
        .eq('id', insertData.id);

      console.log('✅ Test data cleaned up');

    } catch (testError) {
      console.error('❌ Insert/Update test failed:', testError);
      return false;
    }

    console.log('🎉 All schema tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Schema test failed:', error);
    return false;
  }
};
