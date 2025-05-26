// src/utils/testProgressTracking.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const testProgressTracking = async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase credentials not found');
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    console.log('🔍 Testing Supabase connection...');

    // Test 1: Check if user_progress table exists
    const { data: tableData, error: tableError } = await supabase
      .from('user_progress')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ user_progress table test failed:', tableError);
      return false;
    }

    console.log('✅ user_progress table accessible');

    // Test 2: Check if we can query anonymous_user table
    const { data: anonymousData, error: anonymousError } = await supabase
      .from('anonymous_user')
      .select('*')
      .limit(1);

    if (anonymousError) {
      console.error('❌ anonymous_user table test failed:', anonymousError);
      return false;
    }

    console.log('✅ anonymous_user table accessible');

    // Test 3: Check if we can query interactive_assignment table
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('interactive_assignment')
      .select('*')
      .limit(1);

    if (assignmentError) {
      console.error('❌ interactive_assignment table test failed:', assignmentError);
      return false;
    }

    console.log('✅ interactive_assignment table accessible');

    // Test 4: Try to create a test progress entry
    const testUserId = 'test-user-' + Date.now();
    const testAssignmentId = 'test-assignment-' + Date.now();

    const { data: insertData, error: insertError } = await supabase
      .from('user_progress')
      .insert({
        user_id: testUserId,
        assignment_id: testAssignmentId,
        started_at: new Date().toISOString(),
        time_spent: 60,
        status: 'IN_PROGRESS',
        attempts: 1,
        feedback: 'Test progress entry'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Test progress insert failed:', insertError);
      return false;
    }

    console.log('✅ Test progress entry created:', insertData);

    // Test 5: Clean up test data
    const { error: deleteError } = await supabase
      .from('user_progress')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.warn('⚠️ Failed to clean up test data:', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }

    console.log('🎉 All progress tracking tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Progress tracking test failed:', error);
    return false;
  }
};

export const testProgressQuery = async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase credentials not found');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    console.log('🔍 Testing progress query with joins...');

    const { data, error } = await supabase
      .from('user_progress')
      .select(`
        *,
        interactive_assignment(
          title,
          organization_id,
          questions:interactive_question(count)
        ),
        anonymous_user(name)
      `)
      .limit(5);

    if (error) {
      console.error('❌ Progress query test failed:', error);
      return;
    }

    console.log('✅ Progress query successful, found', data?.length || 0, 'records');
    console.log('📊 Sample data:', data);

  } catch (error) {
    console.error('❌ Progress query test failed:', error);
  }
};

// Function to run all tests
export const runAllProgressTests = async () => {
  console.log('🚀 Starting progress tracking tests...');
  
  const basicTest = await testProgressTracking();
  if (basicTest) {
    await testProgressQuery();
  }
  
  console.log('🏁 Progress tracking tests completed');
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testProgressTracking = testProgressTracking;
  (window as any).testProgressQuery = testProgressQuery;
  (window as any).runAllProgressTests = runAllProgressTests;
}
