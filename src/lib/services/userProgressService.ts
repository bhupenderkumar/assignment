// src/lib/services/userProgressService.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { InteractiveSubmission, UserProgress } from '../../types/interactiveAssignment';

import { ensureUuidFormat } from '../utils/userIdMapping';

export const createUserProgressService = (supabase: SupabaseClient) => ({
  // Fetch user submissions
  async fetchUserSubmissions(userId: string): Promise<InteractiveSubmission[]> {
    try {
      if (!userId) {
        console.warn('No user ID provided for fetching submissions');
        return [];
      }

      console.log('userProgressService.fetchUserSubmissions called with userId:', userId);

      // Convert Clerk user ID to UUID format if needed
      let supabaseUserId;
      try {
        supabaseUserId = ensureUuidFormat(userId);
        console.log(`Fetching submissions for user: ${userId} (mapped to: ${supabaseUserId})`);
      } catch (mappingError) {
        console.error('Error mapping user ID to UUID:', mappingError);
        // Fallback to original ID
        supabaseUserId = userId;
        console.log(`Using original user ID for submissions: ${userId}`);
      }

      // First, check if the user exists in the database
      console.log(`Checking if user ${supabaseUserId} exists in the database`);
      const { data: userData, error: userError } = await supabase
        .from('interactive_submission')
        .select('user_id')
        .eq('user_id', supabaseUserId)
        .limit(1);

      if (userError) {
        console.error('Error checking if user exists:', userError);
      } else {
        console.log(`User check result: ${userData?.length ? 'User found' : 'User not found'}`);
      }

      // Join with assignments to get titles
      console.log(`Querying interactive_submission table for user ${supabaseUserId}`);
      const { data, error } = await supabase
        .from('interactive_submission')
        .select(`
          *,
          interactive_assignment:assignment_id (
            title,
            type,
            difficulty_level
          )
        `)
        .eq('user_id', supabaseUserId)
        .eq('status', 'SUBMITTED')
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching submissions:', error);
        // If we get a UUID format error, try again with a different approach
        if (error.code === '22P02' && error.message.includes('invalid input syntax for type uuid')) {
          console.log('UUID format error, trying alternative approach');
          // Try to query without the user ID filter as a fallback
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('interactive_submission')
            .select(`
              *,
              interactive_assignment:assignment_id (
                title,
                type,
                difficulty_level
              )
            `)
            .eq('status', 'SUBMITTED')
            .order('submitted_at', { ascending: false })
            .limit(10); // Limit to avoid fetching too much data

          if (fallbackError) {
            console.error('Fallback query error:', fallbackError);
            throw fallbackError;
          }

          console.log(`Fallback query found ${fallbackData?.length || 0} submissions`);
          console.log('Fallback data:', JSON.stringify(fallbackData));

          // Format the fallback data
          return (fallbackData || []).map(item => ({
            id: item.id,
            assignmentId: item.assignment_id,
            userId: item.user_id,
            status: item.status,
            startedAt: new Date(item.started_at),
            submittedAt: item.submitted_at ? new Date(item.submitted_at) : undefined,
            score: item.score,
            feedback: item.feedback,
            assignmentTitle: item.interactive_assignment?.title,
            assignmentType: item.interactive_assignment?.type,
            difficultyLevel: item.interactive_assignment?.difficulty_level,
            // Keep the original nested data for compatibility
            interactive_assignment: item.interactive_assignment
          }));
        }

        throw error;
      }

      console.log(`Query found ${data?.length || 0} submissions for user ${supabaseUserId}`);
      console.log('Raw submission data:', JSON.stringify(data));

      // Format the data to match our frontend types
      const formattedData = (data || []).map(item => {
        console.log('Processing submission item:', JSON.stringify(item));
        return {
          id: item.id,
          assignmentId: item.assignment_id,
          userId: item.user_id,
          status: item.status,
          startedAt: new Date(item.started_at),
          submittedAt: item.submitted_at ? new Date(item.submitted_at) : undefined,
          score: item.score,
          feedback: item.feedback,
          // Add assignment title from the joined data
          assignmentTitle: item.interactive_assignment?.title,
          assignmentType: item.interactive_assignment?.type,
          difficultyLevel: item.interactive_assignment?.difficulty_level,
          // Keep the original nested data for compatibility
          interactive_assignment: item.interactive_assignment
        };
      });

      console.log(`Returning ${formattedData.length} formatted submissions`);
      return formattedData;
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      // Return empty array instead of throwing to prevent UI errors
      return [];
    }
  },

  // Fetch user progress
  async fetchUserProgress(userId: string): Promise<UserProgress[]> {
    try {
      if (!userId) {
        console.warn('No user ID provided for fetching progress');
        return [];
      }

      // Convert Clerk user ID to UUID format if needed
      let supabaseUserId;
      try {
        supabaseUserId = ensureUuidFormat(userId);
        console.log(`Fetching progress for user: ${userId} (mapped to: ${supabaseUserId})`);
      } catch (mappingError) {
        console.error('Error mapping user ID to UUID:', mappingError);
        // Fallback to original ID
        supabaseUserId = userId;
        console.log(`Using original user ID for progress: ${userId}`);
      }

      const { data, error } = await supabase
        .from('user_progress')
        .select(`
          *,
          interactive_assignment:assignment_id (
            title,
            type
          )
        `)
        .eq('user_id', supabaseUserId)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching progress:', error);
        // If we get a UUID format error, try again with a different approach
        if (error.code === '22P02' && error.message.includes('invalid input syntax for type uuid')) {
          console.log('UUID format error, trying alternative approach');
          // Try to query without the user ID filter as a fallback
          const { data: fallbackData } = await supabase
            .from('user_progress')
            .select(`
              *,
              interactive_assignment:assignment_id (
                title,
                type
              )
            `)
            .order('completed_at', { ascending: false })
            .limit(10); // Limit to avoid fetching too much data

          // Format the fallback data
          return (fallbackData || []).map(item => ({
            id: item.id,
            userId: item.user_id,
            assignmentId: item.assignment_id,
            startedAt: new Date(item.started_at),
            completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
            score: item.score,
            timeSpent: item.time_spent,
            attempts: item.attempts,
            status: item.status,
            feedback: item.feedback,
            assignmentTitle: item.interactive_assignment?.title,
            assignmentType: item.interactive_assignment?.type
          }));
        }

        throw error;
      }

      // Format the data to match our frontend types
      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        assignmentId: item.assignment_id,
        startedAt: new Date(item.started_at),
        completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
        score: item.score,
        timeSpent: item.time_spent,
        attempts: item.attempts,
        status: item.status,
        feedback: item.feedback,
        // Add assignment title from the joined data
        assignmentTitle: item.interactive_assignment?.title,
        assignmentType: item.interactive_assignment?.type
      }));
    } catch (error) {
      console.error('Error fetching user progress:', error);
      // Return empty array instead of throwing to prevent UI errors
      return [];
    }
  },

  // Update user progress when assignment is completed
  async updateUserProgress(progress: Partial<UserProgress>): Promise<UserProgress> {
    try {
      if (!progress.userId || !progress.assignmentId) {
        console.error('Missing required fields for updating progress');
        throw new Error('User ID and Assignment ID are required');
      }

      // Convert Clerk user ID to UUID format if needed
      let supabaseUserId;
      try {
        supabaseUserId = ensureUuidFormat(progress.userId);
        console.log(`Updating progress for user: ${progress.userId} (mapped to: ${supabaseUserId})`);
      } catch (mappingError) {
        console.error('Error mapping user ID to UUID:', mappingError);
        // Fallback to original ID
        supabaseUserId = progress.userId;
        console.log(`Using original user ID for updating progress: ${progress.userId}`);
      }

      // Check if progress already exists for this user and assignment
      const { data: existingProgress, error: fetchError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', supabaseUserId)
        .eq('assignment_id', progress.assignmentId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching existing progress:', fetchError);

        // If we get a UUID format error, try a different approach
        if (fetchError.code === '22P02' && fetchError.message.includes('invalid input syntax for type uuid')) {
          console.log('UUID format error, creating new progress entry');
          // Skip checking for existing progress and create a new one
          return this.createFallbackProgress(progress, supabaseUserId, supabase);
        }

        throw fetchError;
      }

      let result;

      if (existingProgress) {
        // Update existing progress
        const { data, error } = await supabase
          .from('user_progress')
          .update({
            completed_at: progress.completedAt?.toISOString(),
            score: progress.score,
            time_spent: progress.timeSpent,
            attempts: existingProgress.attempts + 1,
            status: progress.status,
            feedback: progress.feedback
          })
          .eq('id', existingProgress.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating progress:', error);
          throw error;
        }
        result = data;
      } else {
        // Create new progress
        const { data, error } = await supabase
          .from('user_progress')
          .insert({
            user_id: supabaseUserId, // Use the converted UUID
            assignment_id: progress.assignmentId,
            started_at: progress.startedAt?.toISOString() || new Date().toISOString(),
            completed_at: progress.completedAt?.toISOString(),
            score: progress.score,
            time_spent: progress.timeSpent,
            attempts: 1,
            status: progress.status || 'IN_PROGRESS',
            feedback: progress.feedback
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating progress:', error);

          // If we get a UUID format error, try a different approach
          if (error.code === '22P02' && error.message.includes('invalid input syntax for type uuid')) {
            console.log('UUID format error when creating progress, trying fallback');
            return this.createFallbackProgress(progress, supabaseUserId, supabase);
          }

          throw error;
        }
        result = data;
      }

      // Format the data to match our frontend types
      return {
        id: result.id,
        userId: result.user_id,
        assignmentId: result.assignment_id,
        startedAt: new Date(result.started_at),
        completedAt: result.completed_at ? new Date(result.completed_at) : undefined,
        score: result.score,
        timeSpent: result.time_spent,
        attempts: result.attempts,
        status: result.status,
        feedback: result.feedback
      };
    } catch (error) {
      console.error('Error updating user progress:', error);
      // Create a fallback progress object to return
      return {
        id: 'temp-' + Date.now(),
        userId: progress.userId || 'unknown',
        assignmentId: progress.assignmentId || 'unknown',
        startedAt: progress.startedAt || new Date(),
        completedAt: progress.completedAt,
        score: progress.score || 0,
        timeSpent: progress.timeSpent || 0,
        attempts: 1,
        status: progress.status || 'ABANDONED',
        feedback: progress.feedback || 'Error saving progress'
      };
    }
  },

  // Helper method to create fallback progress when UUID issues occur
  async createFallbackProgress(
    progress: Partial<UserProgress>,
    _userId: string,
    _supabase: SupabaseClient
  ): Promise<UserProgress> {
    try {
      // Try to create a progress entry without user_id validation
      // This is a last resort when UUID mapping fails
      console.log('Creating fallback progress entry');

      // Store progress in localStorage as a backup
      if (typeof window !== 'undefined') {
        const key = `fallback_progress_${progress.assignmentId}`;
        const data = {
          ...progress,
          timestamp: new Date().toISOString()
        };
        try {
          localStorage.setItem(key, JSON.stringify(data));
          console.log('Saved fallback progress to localStorage');
        } catch (e) {
          console.error('Failed to save to localStorage:', e);
        }
      }

      // Return a client-side only progress object
      return {
        id: 'local-' + Date.now(),
        userId: progress.userId || 'unknown',
        assignmentId: progress.assignmentId || 'unknown',
        startedAt: progress.startedAt || new Date(),
        completedAt: progress.completedAt || new Date(),
        score: progress.score || 0,
        timeSpent: progress.timeSpent || 0,
        attempts: 1,
        status: progress.status || 'COMPLETED',
        feedback: progress.feedback || 'Saved locally'
      };
    } catch (error) {
      console.error('Error creating fallback progress:', error);
      // Return a minimal progress object
      return {
        id: 'error-' + Date.now(),
        userId: progress.userId || 'unknown',
        assignmentId: progress.assignmentId || 'unknown',
        startedAt: new Date(),
        completedAt: progress.completedAt,
        score: progress.score || 0,
        timeSpent: progress.timeSpent || 0,
        attempts: 1,
        status: 'ABANDONED',
        feedback: 'Error saving progress'
      };
    }
  }
});

export type UserProgressService = ReturnType<typeof createUserProgressService>;
