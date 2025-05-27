// src/lib/services/clerkInteractiveAssignmentService.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { handleSupabaseError } from '../supabase';
import {
  InteractiveAssignment,
  InteractiveQuestion,
  InteractiveSubmission,
  InteractiveResponse,
  AnonymousUser
} from '../../types/interactiveAssignment';

// Convert database row to InteractiveAssignment
const mapRowToAssignment = (row: any): InteractiveAssignment => {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    dueDate: new Date(row.due_date),
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
    requiresPayment: row.requires_payment || false, // Payment field mapping
    paymentAmount: row.payment_amount || 0, // Payment amount field mapping
    shareableLink: row.shareable_link,
    shareableLinkExpiresAt: row.shareable_link_expires_at ? new Date(row.shareable_link_expires_at) : undefined,
  };
};

// Convert database row to InteractiveQuestion
const mapRowToQuestion = (row: any): InteractiveQuestion => {
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    questionType: row.question_type,
    questionText: row.question_text,
    questionData: row.question_data,
    order: row.order,
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
    requires_payment: assignment.requiresPayment || false, // Payment field mapping
    payment_amount: assignment.paymentAmount || 0, // Payment amount field mapping
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

// Create a factory function that returns the service with the current Supabase client
export const createInteractiveAssignmentService = (supabase: SupabaseClient) => ({
  // Get all assignments
  async getAssignments(): Promise<InteractiveAssignment[]> {
    console.log('interactiveAssignmentService.getAssignments called');
    try {
      console.log('Calling supabase.from("interactive_assignment").select("*")');
      const { data, error } = await supabase
        .from('interactive_assignment')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error in getAssignments:', error);
        throw error;
      }

      console.log('Assignments data received from Supabase:', data ? data.length : 0, 'records');

      if (!data || data.length === 0) {
        console.log('No assignments found in the database');
        return [];
      }

      const mappedData = data.map(mapRowToAssignment);
      console.log('Mapped assignments data:', mappedData.length, 'assignments');
      return mappedData;
    } catch (error) {
      console.error('Error in getAssignments:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get assignment by ID
  async getAssignmentById(id: string): Promise<InteractiveAssignment | null> {
    try {
      const { data, error } = await supabase
        .from('interactive_assignment')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      const assignment = mapRowToAssignment(data);

      // Get questions for this assignment
      const { data: questionsData, error: questionsError } = await supabase
        .from('interactive_question')
        .select('*')
        .eq('assignment_id', id)
        .order('order', { ascending: true });

      if (questionsError) throw questionsError;

      assignment.questions = questionsData.map(mapRowToQuestion);
      return assignment;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get public assignment by ID (for playing)
  async getPublicAssignmentById(id: string): Promise<InteractiveAssignment | null> {
    try {
      const { data, error } = await supabase
        .from('interactive_assignment')
        .select('*')
        .eq('id', id)
        .eq('status', 'PUBLISHED')
        .single();

      if (error) throw error;
      if (!data) return null;

      const assignment = mapRowToAssignment(data);

      // Get questions for this assignment
      const { data: questionsData, error: questionsError } = await supabase
        .from('interactive_question')
        .select('*')
        .eq('assignment_id', id)
        .order('order', { ascending: true });

      if (questionsError) throw questionsError;

      assignment.questions = questionsData.map(mapRowToQuestion);
      return assignment;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Create assignment
  async createAssignment(assignment: Partial<InteractiveAssignment>): Promise<InteractiveAssignment> {
    try {
      const { data, error } = await supabase
        .from('interactive_assignment')
        .insert(mapAssignmentToRow(assignment))
        .select()
        .single();

      if (error) throw error;
      return mapRowToAssignment(data);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Update assignment
  async updateAssignment(id: string, assignment: Partial<InteractiveAssignment>): Promise<InteractiveAssignment> {
    try {
      // First, check if the assignment exists
      const { data: existingData, error: fetchError } = await supabase
        .from('interactive_assignment')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!existingData) throw new Error(`Assignment with ID ${id} not found`);

      // Then update it
      const { data, error } = await supabase
        .from('interactive_assignment')
        .update(mapAssignmentToRow(assignment))
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      // If no data is returned but no error occurred, fetch the updated record
      if (!data) {
        const { data: updatedData, error: refetchError } = await supabase
          .from('interactive_assignment')
          .select('*')
          .eq('id', id)
          .single();

        if (refetchError) throw refetchError;
        return mapRowToAssignment(updatedData);
      }

      return mapRowToAssignment(data);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Delete assignment
  async deleteAssignment(id: string): Promise<void> {
    try {
      // First, check if the assignment exists
      const { data: existingData, error: fetchError } = await supabase
        .from('interactive_assignment')
        .select('id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!existingData) throw new Error(`Assignment with ID ${id} not found`);

      // Delete related questions first (due to foreign key constraints)
      const { error: questionsError } = await supabase
        .from('interactive_question')
        .delete()
        .eq('assignment_id', id);

      if (questionsError) throw questionsError;

      // Then delete the assignment
      const { error } = await supabase
        .from('interactive_assignment')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Create question
  async createQuestion(question: Partial<InteractiveQuestion>): Promise<InteractiveQuestion> {
    try {
      const { data, error } = await supabase
        .from('interactive_question')
        .insert(mapQuestionToRow(question))
        .select()
        .single();

      if (error) throw error;
      return mapRowToQuestion(data);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Update question
  async updateQuestion(id: string, question: Partial<InteractiveQuestion>): Promise<InteractiveQuestion> {
    try {
      const { data, error } = await supabase
        .from('interactive_question')
        .update(mapQuestionToRow(question))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapRowToQuestion(data);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Delete question
  async deleteQuestion(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('interactive_question')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Create submission
  async createSubmission(submission: Partial<InteractiveSubmission>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('interactive_submission')
        .insert({
          assignment_id: submission.assignmentId,
          user_id: submission.userId,
          status: submission.status || 'PENDING',
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Submit responses
  async submitResponses(submissionId: string, responses: Partial<InteractiveResponse>[], score?: number): Promise<void> {
    try {
      const formattedResponses = responses.map(response => ({
        submission_id: submissionId,
        question_id: response.questionId,
        response_data: response.responseData,
        is_correct: response.isCorrect,
      }));

      const { error } = await supabase
        .from('interactive_response')
        .insert(formattedResponses);

      if (error) throw error;

      // Update submission status and score
      const updateData: any = {
        status: 'SUBMITTED',
        submitted_at: new Date().toISOString(),
      };

      // Add score to update data if provided, or calculate it from responses
      if (score !== undefined) {
        updateData.score = score;
        console.log('Updating submission with provided score:', score);
      } else {
        // Calculate score from responses if not provided
        const totalResponses = responses.length;
        const correctResponses = responses.filter(r => r.isCorrect === true).length;
        const calculatedScore = totalResponses > 0 ? Math.round((correctResponses / totalResponses) * 100) : 0;
        updateData.score = calculatedScore;
        console.log('Calculated score from responses:', calculatedScore, 'correct:', correctResponses, 'total:', totalResponses);
      }

      const { error: updateError } = await supabase
        .from('interactive_submission')
        .update(updateData)
        .eq('id', submissionId);

      if (updateError) throw updateError;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Register anonymous user
  async registerAnonymousUser(name: string, contactInfo?: string): Promise<AnonymousUser> {
    try {
      const { data, error } = await supabase
        .from('anonymous_user')
        .insert({
          name,
          contact_info: contactInfo,
          created_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        contactInfo: data.contact_info,
        createdAt: new Date(data.created_at),
        lastActiveAt: new Date(data.last_active_at),
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get assignment by shareable link
  async getAssignmentByShareableLink(shareableLink: string): Promise<InteractiveAssignment | null> {
    try {
      // Find the assignment with the given shareable link
      const { data, error } = await supabase
        .from('interactive_assignment')
        .select('*')
        .eq('shareable_link', shareableLink);

      if (error) throw error;
      if (!data || data.length === 0) {
        return null;
      }

      // Use the first matching assignment (should typically be only one)
      const assignmentData = data[0];
      const assignment = mapRowToAssignment(assignmentData);

      // Check if the assignment is published and not expired
      const now = new Date();
      const expiresAt = assignment.shareableLinkExpiresAt;

      if (assignment.status !== 'PUBLISHED') {
        return null;
      }

      if (expiresAt && new Date(expiresAt) < now) {
        return null;
      }

      // Get questions for this assignment
      const { data: questionsData, error: questionsError } = await supabase
        .from('interactive_question')
        .select('*')
        .eq('assignment_id', assignment.id)
        .order('order', { ascending: true });

      if (questionsError) throw questionsError;

      assignment.questions = questionsData.map(mapRowToQuestion);
      return assignment;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
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

      // Update assignment with shareable link
      const { error } = await supabase
        .from('interactive_assignment')
        .update({
          shareable_link: shareableLink,
          shareable_link_expires_at: expiresAt.toISOString(),
        })
        .eq('id', assignmentId);

      if (error) throw error;

      return shareableLink;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },
});
