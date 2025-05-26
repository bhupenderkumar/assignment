// src/lib/services/enhancedInteractiveAssignmentService.ts
import { User } from '@supabase/supabase-js';
import {
  InteractiveAssignment,
  InteractiveQuestion,
  InteractiveSubmission,
  InteractiveResponse,
  AnonymousUser
} from '../../types/interactiveAssignment';
import {
  fetchData,
  fetchById,
  insertRecord,
  updateRecord,
  deleteRecord,
  executeCustomQuery
} from '../utils/supabaseUtils';

// Convert database row to InteractiveAssignment
const mapRowToAssignment = (row: any): InteractiveAssignment => {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    dueDate: row.due_date ? new Date(row.due_date) : new Date(),
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    organizationId: row.organization_id, // Add organization ID
    audioInstructions: row.audio_instructions,
    difficultyLevel: row.difficulty_level,
    estimatedTimeMinutes: row.estimated_time_minutes,
    hasAudioFeedback: row.has_audio_feedback,
    hasCelebration: row.has_celebration,
    ageGroup: row.age_group,
    requiresHelp: row.requires_help,
    shareableLink: row.shareable_link,
    shareableLinkExpiresAt: row.shareable_link_expires_at ? new Date(row.shareable_link_expires_at) : undefined,
    // Gallery fields
    category: row.category,
    topic: row.topic,
    featured: row.featured || false,
    viewCount: row.view_count || 0,
    averageRating: row.average_rating || 0,
    ratingCount: row.rating_count || 0,
    // Template/import fields
    isTemplate: row.is_template || false,
    sourceAssignmentId: row.source_assignment_id,
    questions: [],
    attachments: row.attachments || [],
  };
};

// Convert database row to InteractiveQuestion
const mapRowToQuestion = (row: any): InteractiveQuestion => {
  console.log('Mapping question row to object:', row);
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    questionType: row.question_type,
    questionText: row.question_text || '',
    questionData: row.question_data || {},
    order: row.order || 0,
    audioInstructions: row.audio_instructions,
    hintText: row.hint_text,
    hintImageUrl: row.hint_image_url,
    feedbackCorrect: row.feedback_correct,
    feedbackIncorrect: row.feedback_incorrect,
  };
};

// Convert InteractiveAssignment to database row
const mapAssignmentToRow = (assignment: Partial<InteractiveAssignment>) => {
  return {
    title: assignment.title,
    description: assignment.description,
    type: assignment.type,
    status: assignment.status,
    due_date: assignment.dueDate?.toISOString(),
    organization_id: assignment.organizationId, // Add organization ID
    audio_instructions: assignment.audioInstructions,
    difficulty_level: assignment.difficultyLevel,
    estimated_time_minutes: assignment.estimatedTimeMinutes,
    has_audio_feedback: assignment.hasAudioFeedback,
    has_celebration: assignment.hasCelebration,
    age_group: assignment.ageGroup,
    requires_help: assignment.requiresHelp,
    shareable_link: assignment.shareableLink,
    shareable_link_expires_at: assignment.shareableLinkExpiresAt?.toISOString(),
    // Gallery fields
    category: assignment.category,
    topic: assignment.topic,
    featured: assignment.featured,
    view_count: assignment.viewCount,
    // Template/import fields
    is_template: assignment.isTemplate,
    source_assignment_id: assignment.sourceAssignmentId,
  };
};

// Convert InteractiveQuestion to database row
const mapQuestionToRow = (question: Partial<InteractiveQuestion>) => {
  return {
    assignment_id: question.assignmentId,
    question_type: question.questionType,
    question_text: question.questionText,
    question_data: question.questionData,
    order: question.order,
    audio_instructions: question.audioInstructions,
    hint_text: question.hintText,
    hint_image_url: question.hintImageUrl,
    feedback_correct: question.feedbackCorrect,
    feedback_incorrect: question.feedbackIncorrect,
  };
};

// Create a factory function that returns the service
export const createEnhancedInteractiveAssignmentService = (user: User | null = null) => ({
  // Get all assignments
  async getAssignments(): Promise<InteractiveAssignment[]> {
    console.log('enhancedInteractiveAssignmentService.getAssignments called');

    // For the gallery, we want to fetch all published assignments
    // If user is authenticated, also fetch their organization's assignments
    let query;

    if (user) {
      // First, get the user's organizations
      const userOrgs = await fetchData<any>(
        'user_organization',
        (query) => query.select('organization_id'),
        user
      );

      console.log('User organizations:', userOrgs.length);

      // If user has organizations, include their organization's assignments
      if (userOrgs.length > 0) {
        const orgIds = userOrgs.map(org => org.organization_id);
        console.log('Including assignments from organizations:', orgIds);

        query = (q: any) => q
          .select('*')
          .or(`status.eq.PUBLISHED,organization_id.in.(${orgIds.join(',')})`)
          .order('created_at', { ascending: false });
      } else {
        // If no organizations, get published assignments and user's own assignments
        query = (q: any) => q
          .select('*')
          .or(`status.eq.PUBLISHED,created_by.eq.${user.id}`)
          .order('created_at', { ascending: false });
      }
    } else {
      // If no user, just get published assignments
      query = (q: any) => q
        .select('*')
        .eq('status', 'PUBLISHED')
        .order('created_at', { ascending: false });
    }

    const data = await fetchData<any>('interactive_assignment', query, user);

    console.log('Assignments data received from Supabase:', data.length, 'records');
    const assignments = data.map(mapRowToAssignment);
    console.log('Mapped assignments data:', assignments.length, 'assignments');

    // Post-process assignments to handle organization context
    // When viewing organization assignments, we should only see:
    // 1. Assignments that belong to the organization
    // 2. Template assignments (is_template=true) for the gallery
    // We should NOT see both the template and the imported copy in organization views
    const processedAssignments = assignments.filter(assignment => {
      // For gallery view (no organization context), show only templates
      if (!assignment.organizationId) {
        return assignment.isTemplate === true;
      }

      // For organization view, don't show templates unless they belong to the organization
      if (assignment.isTemplate === true && !assignment.organizationId) {
        return false;
      }

      return true;
    });

    console.log('Processed assignments after filtering:', processedAssignments.length, 'assignments');
    return processedAssignments;
  },

  // Get assignment by ID
  async getAssignmentById(id: string): Promise<InteractiveAssignment | null> {
    const assignmentData = await fetchById<any>('interactive_assignment', id, user);

    if (!assignmentData) return null;

    const assignment = mapRowToAssignment(assignmentData);

    // Get questions for this assignment
    const questionsData = await fetchData<any>(
      'interactive_question',
      (query) => query.select('*').eq('assignment_id', id).order('order', { ascending: true }),
      user
    );

    assignment.questions = questionsData.map(mapRowToQuestion);
    return assignment;
  },

  // Get public assignment by ID (for playing)
  async getPublicAssignmentById(id: string): Promise<InteractiveAssignment | null> {
    // Check if id is valid
    if (!id || id === 'undefined') {
      console.error('Invalid assignment ID:', id);
      throw new Error('Invalid assignment ID. Please provide a valid ID.');
    }

    console.log('Fetching public assignment with ID:', id);

    try {
      const data = await executeCustomQuery(
        async (client) => {
          return await client
            .from('interactive_assignment')
            .select('*')
            .eq('id', id)
            .eq('status', 'PUBLISHED')
            .single();
        },
        user
      );

      if (!data) {
        console.log('No assignment found with ID:', id);
        return null;
      }

      const assignment = mapRowToAssignment(data);
      console.log('Assignment found:', assignment.title);

      // Get questions for this assignment
      const questionsData = await fetchData<any>(
        'interactive_question',
        (query) => query.select('*').eq('assignment_id', id).order('order', { ascending: true }),
        user
      );

      console.log(`Found ${questionsData.length} questions for assignment`);
      assignment.questions = questionsData.map(mapRowToQuestion);
      return assignment;
    } catch (error) {
      console.error('Error fetching public assignment:', error);
      throw error;
    }
  },

  // Create assignment
  async createAssignment(assignment: Partial<InteractiveAssignment>): Promise<InteractiveAssignment> {
    const data = await insertRecord<any>('interactive_assignment', mapAssignmentToRow(assignment), user);
    return mapRowToAssignment(data);
  },

  // Update assignment
  async updateAssignment(id: string, assignment: Partial<InteractiveAssignment>): Promise<InteractiveAssignment> {
    const data = await updateRecord<any>('interactive_assignment', id, mapAssignmentToRow(assignment), user);
    return mapRowToAssignment(data);
  },

  // Delete assignment
  async deleteAssignment(id: string): Promise<void> {
    // First, check if the assignment exists
    const existingData = await fetchById<any>('interactive_assignment', id, user);

    if (!existingData) {
      throw new Error(`Assignment with ID ${id} not found`);
    }

    // Check if this is a gallery assignment (no organization_id) or an imported assignment
    const isGalleryAssignment = !existingData.organization_id;

    // Add additional safety check - only allow deleting assignments that:
    // 1. Have an organization_id (imported/user-created assignments)
    // 2. OR were created by the current user
    const isCreatedByCurrentUser = user && existingData.created_by === user.id;

    if (isGalleryAssignment && !isCreatedByCurrentUser) {
      console.error(`Cannot delete gallery assignment ${id} that was not created by the current user`);
      throw new Error('You cannot delete assignments from the gallery. You can only delete assignments that you have imported or created.');
    }

    try {
      console.log(`Deleting assignment ${id} (Gallery: ${isGalleryAssignment}, Created by user: ${isCreatedByCurrentUser})`);

      // Delete user progress records first (due to foreign key constraints)
      try {
        await executeCustomQuery(
          async (client) => {
            return await client
              .from('user_progress')
              .delete()
              .eq('assignment_id', id);
          },
          user
        );
        console.log(`Deleted user progress records for assignment ${id}`);
      } catch (progressError) {
        console.warn(`Error deleting user progress for assignment ${id}:`, progressError);
        // If this fails, the CASCADE constraint should handle it, but we'll log it
      }

      // First, get all submissions for this assignment
      const submissions = await executeCustomQuery(
        async (client) => {
          return await client
            .from('interactive_submission')
            .select('id')
            .eq('assignment_id', id);
        },
        user
      );

      if (submissions && submissions.length > 0) {
        console.log(`Found ${submissions.length} submissions for assignment ${id}`);

        // For each submission, delete its responses
        for (const submission of submissions) {
          await executeCustomQuery(
            async (client) => {
              return await client
                .from('interactive_response')
                .delete()
                .eq('submission_id', submission.id);
            },
            user
          );
        }

        // Delete all submissions for this assignment
        await executeCustomQuery(
          async (client) => {
            return await client
              .from('interactive_submission')
              .delete()
              .eq('assignment_id', id);
          },
          user
        );
      }

      // Get all questions for this assignment
      const questions = await executeCustomQuery(
        async (client) => {
          return await client
            .from('interactive_question')
            .select('id')
            .eq('assignment_id', id);
        },
        user
      );

      if (questions && questions.length > 0) {
        console.log(`Found ${questions.length} questions for assignment ${id}`);

        // For each question, delete any responses that reference it
        for (const question of questions) {
          await executeCustomQuery(
            async (client) => {
              return await client
                .from('interactive_response')
                .delete()
                .eq('question_id', question.id);
            },
            user
          );
        }

        // Now delete all questions for this assignment
        await executeCustomQuery(
          async (client) => {
            return await client
              .from('interactive_question')
              .delete()
              .eq('assignment_id', id);
          },
          user
        );
      }

      // Delete any ratings/reviews for this assignment
      try {
        await executeCustomQuery(
          async (client) => {
            return await client
              .from('ratings_reviews')
              .delete()
              .eq('assignment_id', id);
          },
          user
        );
      } catch (error) {
        console.warn(`Error deleting ratings/reviews for assignment ${id}:`, error);
        // Continue with deletion even if this fails
      }

      // Finally, delete the assignment
      await deleteRecord('interactive_assignment', id, user);
      console.log(`Successfully deleted assignment ${id}`);
    } catch (error) {
      // Check for foreign key constraint error
      if (error instanceof Error &&
          (error.message.includes('violates foreign key constraint') ||
           error.message.includes('user_progress_assignment_id_fkey'))) {
        console.error(`Foreign key constraint error when deleting assignment ${id}:`, error);
        throw new Error('Cannot delete this assignment because it has user progress records. Please run the database migration to fix this issue.');
      }

      console.error(`Error deleting assignment ${id}:`, error);
      throw error;
    }
  },

  // Create question
  async createQuestion(question: Partial<InteractiveQuestion>): Promise<InteractiveQuestion> {
    const data = await insertRecord<any>('interactive_question', mapQuestionToRow(question), user);
    return mapRowToQuestion(data);
  },

  // Update question
  async updateQuestion(id: string, question: Partial<InteractiveQuestion>): Promise<InteractiveQuestion> {
    const data = await updateRecord<any>('interactive_question', id, mapQuestionToRow(question), user);
    return mapRowToQuestion(data);
  },

  // Delete question
  async deleteQuestion(id: string): Promise<void> {
    try {
      // First, get the question to check if it belongs to a gallery assignment
      const question = await fetchById<any>('interactive_question', id, user);

      if (!question) {
        throw new Error(`Question with ID ${id} not found`);
      }

      // Get the assignment this question belongs to
      const assignment = await fetchById<any>('interactive_assignment', question.assignment_id, user);

      if (!assignment) {
        throw new Error(`Assignment for question ${id} not found`);
      }

      // Check if this is a gallery assignment (no organization_id) or an imported assignment
      const isGalleryAssignment = !assignment.organization_id;

      // Add additional safety check - only allow deleting questions from assignments that:
      // 1. Have an organization_id (imported/user-created assignments)
      // 2. OR were created by the current user
      const isCreatedByCurrentUser = user && assignment.created_by === user.id;

      if (isGalleryAssignment && !isCreatedByCurrentUser) {
        console.error(`Cannot delete question ${id} from gallery assignment ${assignment.id}`);
        throw new Error('You cannot delete questions from gallery assignments. You can only delete questions from assignments that you have imported or created.');
      }

      console.log(`Deleting question ${id} from assignment ${assignment.id} (Gallery: ${isGalleryAssignment}, Created by user: ${isCreatedByCurrentUser})`);

      // First, delete any responses that reference this question
      await executeCustomQuery(
        async (client) => {
          return await client
            .from('interactive_response')
            .delete()
            .eq('question_id', id);
        },
        user
      );

      // Then delete the question
      await deleteRecord('interactive_question', id, user);
      console.log(`Successfully deleted question ${id}`);
    } catch (error) {
      console.error(`Error deleting question ${id}:`, error);
      throw error;
    }
  },

  // Create submission
  async createSubmission(submission: Partial<InteractiveSubmission>): Promise<string> {
    const data = await insertRecord<any>(
      'interactive_submission',
      {
        assignment_id: submission.assignmentId,
        user_id: submission.userId,
        status: submission.status || 'PENDING',
        started_at: new Date().toISOString(),
      },
      user
    );

    return data.id;
  },

  // Submit responses with optimized performance and error handling
  async submitResponses(submissionId: string, responses: Partial<InteractiveResponse>[], score?: number): Promise<void> {
    if (!submissionId || !responses || responses.length === 0) {
      throw new Error('Invalid submission data provided');
    }

    console.log(`🚀 Starting optimized batch submission for ${responses.length} responses`);
    const startTime = performance.now();

    const formattedResponses = responses.map(response => ({
      submission_id: submissionId,
      question_id: response.questionId,
      response_data: response.responseData,
      is_correct: response.isCorrect,
    }));

    try {
      // Use a single transaction for better performance and data consistency
      await executeCustomQuery(
        async (client) => {
          // Start a transaction-like operation by batching all operations
          const responseInsertPromise = client
            .from('interactive_response')
            .insert(formattedResponses);

          // Prepare submission update data
          const updateData: any = {
            status: 'SUBMITTED',
            submitted_at: new Date().toISOString(),
          };

          // Add score to update data if provided, or calculate it from responses
          if (score !== undefined) {
            updateData.score = score;
            console.log('📊 Using provided score:', score);
          } else {
            // Calculate score from responses if not provided
            const totalResponses = responses.length;
            const correctResponses = responses.filter(r => r.isCorrect === true).length;
            const calculatedScore = totalResponses > 0 ? Math.round((correctResponses / totalResponses) * 100) : 0;
            updateData.score = calculatedScore;
            console.log('📊 Calculated score:', calculatedScore, 'correct:', correctResponses, 'total:', totalResponses);
          }

          const submissionUpdatePromise = client
            .from('interactive_submission')
            .update(updateData)
            .eq('id', submissionId);

          // Execute both operations in parallel for better performance
          const [responseResult, submissionResult] = await Promise.all([
            responseInsertPromise,
            submissionUpdatePromise
          ]);

          // Check for errors in either operation
          if (responseResult.error) {
            console.error('❌ Error inserting responses:', responseResult.error);
            throw responseResult.error;
          }

          if (submissionResult.error) {
            console.error('❌ Error updating submission:', submissionResult.error);
            throw submissionResult.error;
          }

          // Return the expected format for executeCustomQuery
          return {
            data: { responseResult, submissionResult },
            error: null
          };
        },
        user
      );

      const endTime = performance.now();
      console.log(`✅ Batch submission completed successfully in ${(endTime - startTime).toFixed(2)}ms`);

    } catch (error) {
      const endTime = performance.now();
      console.error(`❌ Batch submission failed after ${(endTime - startTime).toFixed(2)}ms:`, error);

      // Provide more specific error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network connection issue. Please check your internet connection and try again.');
        } else if (error.message.includes('timeout')) {
          throw new Error('Request timed out. Please try again.');
        } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
          throw new Error('This submission has already been processed.');
        } else {
          throw new Error(`Submission failed: ${error.message}`);
        }
      } else {
        throw new Error('Failed to submit responses. Please check your connection and try again.');
      }
    }
  },

  // Register anonymous user
  async registerAnonymousUser(name: string, contactInfo?: string): Promise<AnonymousUser> {
    const data = await insertRecord<any>(
      'anonymous_user',
      {
        name,
        contact_info: contactInfo,
        created_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      },
      user
    );

    return {
      id: data.id,
      name: data.name,
      contactInfo: data.contact_info,
      createdAt: new Date(data.created_at),
      lastActiveAt: new Date(data.last_active_at),
    };
  },

  // Get assignment by shareable link
  async getAssignmentByShareableLink(shareableLink: string): Promise<InteractiveAssignment | null> {
    // Check if shareableLink is valid
    if (!shareableLink || shareableLink === 'undefined') {
      console.error('Invalid shareable link:', shareableLink);
      throw new Error('Invalid shareable link. Please provide a valid link.');
    }

    console.log('Fetching assignment with shareable link:', shareableLink);

    try {
      // Extract the assignment ID from the shareable link
      // Format is randomString-assignmentId
      const parts = shareableLink.split('-');
      if (parts.length < 2) {
        console.error('Invalid shareable link format:', shareableLink);
        return null;
      }

      const assignmentId = parts[parts.length - 1];

      // Check if we have this assignment in cache first
      try {
        const shareableLinkCache = JSON.parse(localStorage.getItem('shareableLinkCache') || '{}');
        const cachedLink = Object.entries(shareableLinkCache).find(
          ([id, data]: [string, any]) => id === assignmentId || data.link === shareableLink
        );

        if (cachedLink) {
          const [, linkData] = cachedLink;

          // Check if the link has expired
          const now = new Date();
          const typedLinkData = linkData as { expiresAt: string };
          const expiresAt = new Date(typedLinkData.expiresAt);

          if (expiresAt > now) {
            console.log('Found valid cached link, trying to get assignment');
            // We'll continue with the database query, but we know we have a valid link
          }
        }
      } catch (cacheError) {
        console.warn('Error checking localStorage cache:', cacheError);
        // Continue with database query
      }

      // Try to get the assignment from the database using a direct approach
      // This is more likely to work for anonymous users
      try {
        // First try with a direct query that doesn't rely on RLS policies
        const supabase = await import('@supabase/supabase-js');
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Supabase configuration missing');
        }

        // Create a temporary client just for this query
        // This avoids any issues with the singleton client
        const tempClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

        const { data, error } = await tempClient
          .from('interactive_assignment')
          .select('*')
          .eq('shareable_link', shareableLink)
          .single();

        if (!error && data) {
          const assignment = mapRowToAssignment(data);
          console.log('Assignment found in database using direct query:', assignment.title);

          // Check if the link has expired
          const now = new Date();
          const expiresAt = assignment.shareableLinkExpiresAt;

          if (expiresAt && new Date(expiresAt) < now) {
            console.log('Shareable link has expired:', shareableLink);
            return null;
          }

          // Get questions for this assignment
          const { data: questionsData, error: questionsError } = await tempClient
            .from('interactive_question')
            .select('*')
            .eq('assignment_id', assignment.id)
            .order('order', { ascending: true });

          if (!questionsError && questionsData) {
            console.log(`Found ${questionsData.length} questions for assignment`);
            assignment.questions = questionsData.map(mapRowToQuestion);
            return assignment;
          }
        }
      } catch (directQueryError) {
        console.warn('Error with direct query approach:', directQueryError);
        // Continue to next approach
      }

      // Try the normal approach with executeCustomQuery
      try {
        const data = await executeCustomQuery(
          async (client) => {
            return await client
              .from('interactive_assignment')
              .select('*')
              .eq('shareable_link', shareableLink)
              .single();
          },
          user
        );

        if (data) {
          const assignment = mapRowToAssignment(data);
          console.log('Assignment found in database:', assignment.title);

          // Check if the link has expired
          const now = new Date();
          const expiresAt = assignment.shareableLinkExpiresAt;

          if (expiresAt && new Date(expiresAt) < now) {
            console.log('Shareable link has expired:', shareableLink);
            return null;
          }

          // Get questions for this assignment
          const questionsData = await fetchData<any>(
            'interactive_question',
            (query) => query.select('*').eq('assignment_id', assignment.id).order('order', { ascending: true }),
            user
          );

          console.log(`Found ${questionsData.length} questions for assignment`);
          assignment.questions = questionsData.map(mapRowToQuestion);
          return assignment;
        }
      } catch (dbError) {
        console.warn('Error fetching assignment from database:', dbError);
        // Continue to fallback
      }

      // If we get here, we couldn't find the assignment in the database
      // Try to find it in localStorage
      console.log('Trying to find assignment in localStorage cache');

      // Check if we have this assignment in cache
      const shareableLinkCache = JSON.parse(localStorage.getItem('shareableLinkCache') || '{}');
      const cachedLink = Object.entries(shareableLinkCache).find(
        ([id, data]: [string, any]) => id === assignmentId || data.link === shareableLink
      );

      if (!cachedLink) {
        console.log('No cached link found for assignment');
        return null;
      }

      const [id, linkData] = cachedLink;

      // Check if the link has expired
      const now = new Date();
      const typedLinkData = linkData as { expiresAt: string };
      const expiresAt = new Date(typedLinkData.expiresAt);

      if (expiresAt < now) {
        console.log('Cached shareable link has expired');
        return null;
      }

      // Try to get the assignment by ID
      try {
        const assignment = await this.getAssignmentById(id);
        if (assignment) {
          console.log('Found assignment in cache:', assignment.title);
          return assignment;
        }
      } catch (cacheError) {
        console.error('Error fetching cached assignment:', cacheError);
      }

      return null;
    } catch (error) {
      console.error('Error fetching assignment by shareable link:', error);
      return null; // Return null instead of throwing to prevent UI errors
    }
  },

  // Generate shareable link
  async generateShareableLink(assignmentId: string, expiresInDays = 30): Promise<string> {
    try {
      // Generate a random string for the link
      const randomString = Math.random().toString(36).substring(2, 15);
      const shareableLink = `${randomString}-${assignmentId}`;

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      try {
        // Update assignment with shareable link
        await updateRecord<any>(
          'interactive_assignment',
          assignmentId,
          {
            shareable_link: shareableLink,
            shareable_link_expires_at: expiresAt.toISOString(),
          },
          user
        );
      } catch (updateError: any) {
        console.warn('Error updating assignment with shareable link:', updateError);

        // If the update fails, store the link in localStorage as a fallback
        const shareableLinkCache = JSON.parse(localStorage.getItem('shareableLinkCache') || '{}');
        shareableLinkCache[assignmentId] = {
          link: shareableLink,
          expiresAt: expiresAt.toISOString()
        };
        localStorage.setItem('shareableLinkCache', JSON.stringify(shareableLinkCache));

        console.log('Stored shareable link in localStorage as fallback');
      }

      return shareableLink;
    } catch (error) {
      console.error('Error generating shareable link:', error);

      // Generate a link anyway even if there's an error
      const fallbackRandomString = Math.random().toString(36).substring(2, 15);
      const fallbackShareableLink = `${fallbackRandomString}-${assignmentId}`;

      // Store in localStorage
      const shareableLinkCache = JSON.parse(localStorage.getItem('shareableLinkCache') || '{}');
      const fallbackExpiresAt = new Date();
      fallbackExpiresAt.setDate(fallbackExpiresAt.getDate() + expiresInDays);

      shareableLinkCache[assignmentId] = {
        link: fallbackShareableLink,
        expiresAt: fallbackExpiresAt.toISOString()
      };
      localStorage.setItem('shareableLinkCache', JSON.stringify(shareableLinkCache));

      return fallbackShareableLink;
    }
  },
});
