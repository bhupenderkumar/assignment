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
    dueDate: row.due_date ? new Date(row.due_date) : undefined,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    audioInstructions: row.audio_instructions,
    difficultyLevel: row.difficulty_level,
    estimatedTimeMinutes: row.estimated_time_minutes,
    hasAudioFeedback: row.has_audio_feedback,
    hasCelebration: row.has_celebration,
    ageGroup: row.age_group,
    requiresHelp: row.requires_help,
    shareableLink: row.shareable_link,
    shareableLinkExpiresAt: row.shareable_link_expires_at ? new Date(row.shareable_link_expires_at) : undefined,
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
    audio_instructions: assignment.audioInstructions,
    difficulty_level: assignment.difficultyLevel,
    estimated_time_minutes: assignment.estimatedTimeMinutes,
    has_audio_feedback: assignment.hasAudioFeedback,
    has_celebration: assignment.hasCelebration,
    age_group: assignment.ageGroup,
    requires_help: assignment.requiresHelp,
    shareable_link: assignment.shareableLink,
    shareable_link_expires_at: assignment.shareableLinkExpiresAt?.toISOString(),
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

    const data = await fetchData<any>(
      'interactive_assignment',
      (query) => query.select('*').order('created_at', { ascending: false }),
      user
    );

    console.log('Assignments data received from Supabase:', data.length, 'records');
    const assignments = data.map(mapRowToAssignment);
    console.log('Mapped assignments data:', assignments.length, 'assignments');

    return assignments;
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

    // Delete related questions first (due to foreign key constraints)
    await executeCustomQuery(
      async (client) => {
        return await client
          .from('interactive_question')
          .delete()
          .eq('assignment_id', id);
      },
      user
    );

    // Then delete the assignment
    await deleteRecord('interactive_assignment', id, user);
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
    await deleteRecord('interactive_question', id, user);
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

  // Submit responses
  async submitResponses(submissionId: string, responses: Partial<InteractiveResponse>[], score?: number): Promise<void> {
    const formattedResponses = responses.map(response => ({
      submission_id: submissionId,
      question_id: response.questionId,
      response_data: response.responseData,
      is_correct: response.isCorrect,
    }));

    await executeCustomQuery(
      async (client) => {
        return await client
          .from('interactive_response')
          .insert(formattedResponses);
      },
      user
    );

    // Update submission status and score
    const updateData: any = {
      status: 'SUBMITTED',
      submitted_at: new Date().toISOString(),
    };

    // Add score to update data if provided
    if (score !== undefined) {
      updateData.score = score;
    }

    await executeCustomQuery(
      async (client) => {
        return await client
          .from('interactive_submission')
          .update(updateData)
          .eq('id', submissionId);
      },
      user
    );
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

      if (!data) {
        console.log('No assignment found with shareable link:', shareableLink);
        return null;
      }

      const assignment = mapRowToAssignment(data);
      console.log('Assignment found:', assignment.title);

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
    } catch (error) {
      console.error('Error fetching assignment by shareable link:', error);
      throw error;
    }
  },

  // Generate shareable link
  async generateShareableLink(assignmentId: string, expiresInDays = 30): Promise<string> {
    // Generate a random string for the link
    const randomString = Math.random().toString(36).substring(2, 15);
    const shareableLink = `${randomString}-${assignmentId}`;

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

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

    return shareableLink;
  },
});
