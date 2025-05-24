// Script to fix missing scores in anonymous user submissions
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SubmissionWithResponses {
  id: string;
  assignment_id: string;
  user_id: string;
  status: string;
  score: number | null;
  responses: Array<{
    is_correct: boolean;
  }>;
}

async function fixMissingScores() {
  console.log('🔍 Finding submissions with missing scores...');

  try {
    // Get all submitted submissions with null scores that have responses
    const { data: submissions, error } = await supabase
      .from('interactive_submission')
      .select(`
        id,
        assignment_id,
        user_id,
        status,
        score,
        interactive_response(is_correct)
      `)
      .eq('status', 'SUBMITTED')
      .is('score', null);

    if (error) {
      console.error('Error fetching submissions:', error);
      return;
    }

    if (!submissions || submissions.length === 0) {
      console.log('✅ No submissions with missing scores found');
      return;
    }

    console.log(`📊 Found ${submissions.length} submissions with missing scores`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const submission of submissions as any[]) {
      const responses = submission.interactive_response || [];
      
      if (responses.length === 0) {
        console.log(`⏭️  Skipping submission ${submission.id} - no responses found`);
        skippedCount++;
        continue;
      }

      // Calculate score
      const totalResponses = responses.length;
      const correctResponses = responses.filter((r: any) => r.is_correct === true).length;
      const calculatedScore = Math.round((correctResponses / totalResponses) * 100);

      console.log(`🔧 Fixing submission ${submission.id}: ${correctResponses}/${totalResponses} = ${calculatedScore}%`);

      // Update the submission with calculated score
      const { error: updateError } = await supabase
        .from('interactive_submission')
        .update({ score: calculatedScore })
        .eq('id', submission.id);

      if (updateError) {
        console.error(`❌ Error updating submission ${submission.id}:`, updateError);
      } else {
        console.log(`✅ Updated submission ${submission.id} with score ${calculatedScore}%`);
        fixedCount++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`✅ Fixed: ${fixedCount} submissions`);
    console.log(`⏭️  Skipped: ${skippedCount} submissions (no responses)`);
    console.log(`📊 Total processed: ${submissions.length} submissions`);

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
fixMissingScores()
  .then(() => {
    console.log('🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
