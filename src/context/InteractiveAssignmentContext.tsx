// src/context/InteractiveAssignmentContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

import { createEnhancedInteractiveAssignmentService } from '../lib/services/enhancedInteractiveAssignmentService';
import { createUserProgressService } from '../lib/services/userProgressService';
import {
  InteractiveAssignment,
  InteractiveQuestion,
  InteractiveSubmission,
  InteractiveResponse,
  AnonymousUser,
  UserProgress
} from '../types/interactiveAssignment';
import toast from 'react-hot-toast';
import { useSupabaseAuth } from './SupabaseAuthContext';
import { useDatabaseState } from './DatabaseStateContext';
import useProgressOverlay from '../hooks/useProgressOverlay';
import { usePageVisibility } from '../hooks/usePageVisibility';
import ProgressOverlay from '../components/ui/ProgressOverlay';

// Define the context type
interface InteractiveAssignmentContextType {
  assignments: InteractiveAssignment[];
  currentAssignment: InteractiveAssignment | null;
  loading: boolean;
  error: string | null;
  anonymousUser: AnonymousUser | null;
  fetchAssignments: () => Promise<InteractiveAssignment[]>;
  fetchAssignmentById: (id: string) => Promise<InteractiveAssignment | null>;
  fetchPublicAssignmentById: (id: string) => Promise<InteractiveAssignment | null>;
  fetchAssignmentByShareableLink: (shareableLink: string) => Promise<InteractiveAssignment | null>;
  createAssignment: (assignment: Partial<InteractiveAssignment>) => Promise<InteractiveAssignment>;
  updateAssignment: (id: string, assignment: Partial<InteractiveAssignment>) => Promise<InteractiveAssignment>;
  deleteAssignment: (id: string) => Promise<void>;
  deleteMultipleAssignments: (ids: string[]) => Promise<void>;
  createQuestion: (question: Partial<InteractiveQuestion>) => Promise<InteractiveQuestion>;
  updateQuestion: (id: string, question: Partial<InteractiveQuestion>) => Promise<InteractiveQuestion>;
  deleteQuestion: (id: string) => Promise<void>;
  createSubmission: (submission: Partial<InteractiveSubmission>) => Promise<string>;
  submitResponses: (submissionId: string, responses: Partial<InteractiveResponse>[], score?: number) => Promise<void>;
  registerAnonymousUser: (name: string, contactInfo?: string) => Promise<AnonymousUser>;
  generateShareableLink: (assignmentId: string, expiresInDays?: number) => Promise<string>;
  setCurrentAssignment: (assignment: InteractiveAssignment | null) => void;
  // User progress methods
  fetchUserSubmissions: () => Promise<InteractiveSubmission[]>;
  refreshUserSubmissions: () => Promise<InteractiveSubmission[]>;
  fetchUserProgress: () => Promise<UserProgress[]>;
  updateUserProgress: (progress: Partial<UserProgress>) => Promise<UserProgress>;
  // Progress overlay methods
  showProgress: (initialStatus?: string) => void;
  updateProgress: (newProgress: number, newStatus: string) => void;
  hideProgress: () => void;
}

// Create the context
const InteractiveAssignmentContext = createContext<InteractiveAssignmentContextType | undefined>(undefined);

// Interface for request cache
interface RequestCache {
  assignments: {
    data: InteractiveAssignment[];
    timestamp: number;
    userId: string; // Track which user this data belongs to
  } | null;
  assignmentsById: {
    [id: string]: {
      data: InteractiveAssignment | null;
      timestamp: number;
    };
  };
  userSubmissions: {
    [userId: string]: {
      data: InteractiveSubmission[];
      timestamp: number;
    };
  };
  lastFetchedUserId: string | null; // Track the last user we fetched assignments for
  pendingRequests: {
    fetchAssignments: boolean;
    fetchAssignmentById: { [id: string]: boolean };
    fetchUserSubmissions: { [userId: string]: boolean };
  };
}

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Provider component
export const InteractiveAssignmentProvider = ({ children }: { children: ReactNode }) => {
  const [assignments, setAssignments] = useState<InteractiveAssignment[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<InteractiveAssignment | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [anonymousUser, setAnonymousUser] = useState<AnonymousUser | null>(null);
  const { supabase, userId, isSupabaseLoading, user, currentOrganization } = useSupabaseAuth();
  const { isReady: isDatabaseReady, state: dbState } = useDatabaseState();

  // Use page visibility to prevent API calls when page is not visible
  const { shouldPauseApiCalls } = usePageVisibility({
    onHidden: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚫 InteractiveAssignmentContext: Page hidden, pausing API calls');
      }
    },
    onVisible: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ InteractiveAssignmentContext: Page visible, resuming API calls');
      }
    }
  });

  // Request cache to prevent duplicate requests
  const requestCache = useRef<RequestCache>({
    assignments: null,
    assignmentsById: {},
    userSubmissions: {},
    lastFetchedUserId: null,
    pendingRequests: {
      fetchAssignments: false,
      fetchAssignmentById: {},
      fetchUserSubmissions: {}
    }
  });

  // Progress overlay state
  const {
    isVisible: progressVisible,
    progress,
    status: progressStatus,
    showProgress,
    updateProgress,
    hideProgress
  } = useProgressOverlay();

  // Create service instance with current Supabase client
  const getService = useCallback(() => {
    // Use the enhanced service that handles Supabase initialization internally
    return createEnhancedInteractiveAssignmentService(user);
  }, [user]);

  // Load anonymous user from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('anonymousUser');
    if (storedUser) {
      try {
        setAnonymousUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('anonymousUser');
      }
    }
  }, []);

  // Fetch all assignments
  const fetchAssignments = useCallback(async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('fetchAssignments called for user:', userId || 'anonymous');
    }

    // Don't make API calls if page is not visible
    if (shouldPauseApiCalls) {
      if (process.env.NODE_ENV === 'development') {
        console.log('InteractiveAssignmentContext: Page not visible, skipping fetch');
      }
      return assignments;
    }

    // Get current user ID (authenticated user or 'anonymous' for gallery)
    const currentUserId = userId || 'anonymous';

    // Check if there's a pending request already
    if (requestCache.current.pendingRequests.fetchAssignments) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Assignments fetch already in progress, waiting for it to complete');
      }
      return assignments;
    }

    // Check if we have cached data that's still valid for this user
    const cachedData = requestCache.current.assignments;
    const hasValidCache = cachedData &&
      cachedData.userId === currentUserId &&
      (Date.now() - cachedData.timestamp < CACHE_EXPIRATION);

    // Also check if we've already fetched for this user recently
    const alreadyFetchedForUser = requestCache.current.lastFetchedUserId === currentUserId;

    if (hasValidCache) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Using cached assignments data for user:', currentUserId);
      }
      return cachedData.data;
    }

    if (alreadyFetchedForUser && assignments.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Already fetched assignments for user, using current state:', currentUserId);
      }
      return assignments;
    }

    // Mark that we're starting a request
    requestCache.current.pendingRequests.fetchAssignments = true;

    setLoading(true);
    setError(null);

    // Only show progress overlay if this is a user-initiated action, not during initial load
    // We'll check if we're in the initial loading phase by checking if assignments is empty
    if (assignments.length > 0 || !isSupabaseLoading) {
      showProgress('Fetching assignments...');
      updateProgress(5, 'Preparing to fetch assignments...');
    }

    // Check if database is ready using the DatabaseStateContext
    if (!isDatabaseReady) {
      console.log('Database is not ready yet, waiting...');
      updateProgress(10, 'Waiting for database connection to initialize...');

      // Instead of returning immediately, let's try to wait for the database to be ready
      try {
        // Wait for up to 5 seconds for the database to be ready
        let waitTime = 0;
        const maxWaitTime = 5000; // 5 seconds
        const checkInterval = 500; // Check every 500ms

        while (!isDatabaseReady && waitTime < maxWaitTime) {
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          waitTime += checkInterval;
          updateProgress(10 + (waitTime / maxWaitTime * 5), 'Waiting for database connection...');
        }

        // If database is ready now, continue with the fetch
        if (isDatabaseReady) {
          console.log('Database is now ready, continuing with fetch');
          updateProgress(20, 'Database connection established');
        } else {
          // If still not ready, show error and return
          if (dbState === 'error') {
            console.error('Database connection error');
            setError('Database connection error. Please refresh the page and try again.');
            updateProgress(15, 'Database connection error');
          } else {
            console.log('Database is still initializing, please try again...');
            setError('Database connection is initializing, please try again in a moment.');
            updateProgress(15, 'Database connection is still initializing...');
          }

          setLoading(false);

          // Clear pending request flag
          requestCache.current.pendingRequests.fetchAssignments = false;

          // Hide progress after a delay
          setTimeout(() => {
            hideProgress();
          }, 2000);

          return assignments;
        }
      } catch (waitError) {
        console.error('Error waiting for database:', waitError);
        setError('Error connecting to database. Please refresh the page and try again.');
        setLoading(false);
        requestCache.current.pendingRequests.fetchAssignments = false;
        setTimeout(() => hideProgress(), 2000);
        return assignments;
      }
    }

    // Check if supabase is available
    if (!supabase) {
      console.error('Supabase client not available');
      setError('Database connection is not available. Please refresh the page and try again.');
      updateProgress(20, 'Database connection unavailable');
      setLoading(false);

      // Clear pending request flag
      requestCache.current.pendingRequests.fetchAssignments = false;

      // Hide progress after a delay
      setTimeout(() => {
        hideProgress();
      }, 2000);

      return assignments;
    }

    updateProgress(30, 'Connecting to database...');

    try {
      console.log('Getting service and calling getAssignments()');
      updateProgress(40, 'Fetching assignments...');

      const service = getService();
      const data = await service.getAssignments();

      console.log('Assignments fetched successfully:', data.length, 'assignments');
      updateProgress(90, `Successfully loaded ${data.length} assignments`);

      // Update the cache with user ID
      requestCache.current.assignments = {
        data,
        timestamp: Date.now(),
        userId: currentUserId
      };

      // Mark that we've fetched for this user
      requestCache.current.lastFetchedUserId = currentUserId;

      setAssignments(data);
      // Clear any previous errors if successful
      setError(null);

      // Complete the progress
      updateProgress(100, 'Assignments loaded successfully');

      // Hide progress after a short delay
      setTimeout(() => {
        hideProgress();
      }, 1000);

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error fetching assignments:', err);

      // Update progress to show error
      updateProgress(50, 'Error encountered, attempting to recover...');

      // Authentication errors are handled automatically by Supabase Auth
      updateProgress(60, 'Authentication issue detected, please try again...');

      // Provide more user-friendly error messages
      let userFriendlyError = '';

      if (errorMessage.includes('not initialized')) {
        userFriendlyError = 'Database connection is not ready. Please try again in a moment.';
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        userFriendlyError = 'Network error. Please check your internet connection and try again.';
      } else if (errorMessage.includes('JWT') || errorMessage.includes('auth') || errorMessage.includes('token')) {
        userFriendlyError = 'Authentication error. Please refresh the page or sign in again.';
      } else {
        userFriendlyError = errorMessage;
      }

      setError(userFriendlyError);
      updateProgress(85, `Error: ${userFriendlyError}`);

      toast.error('Failed to load assignments. Please try again.');

      // Hide progress after a delay
      setTimeout(() => {
        hideProgress();
      }, 3000);

      return assignments;
    } finally {
      setLoading(false);
      // Clear pending request flag
      requestCache.current.pendingRequests.fetchAssignments = false;
      console.log('Finished fetching assignments');
    }
  }, [getService, isSupabaseLoading, supabase, showProgress, updateProgress, hideProgress, isDatabaseReady, dbState, userId, shouldPauseApiCalls]);

  // Fetch assignment by ID
  const fetchAssignmentById = useCallback(async (id: string) => {
    console.log(`fetchAssignmentById called for ID: ${id}`);

    // Always set the current assignment to the one being requested
    // This ensures we're working with the correct assignment when editing
    if (currentAssignment?.id !== id) {
      console.log(`Current assignment ID (${currentAssignment?.id}) doesn't match requested ID (${id}), will update current assignment`);
    }

    // Check if there's a pending request already for this ID
    if (requestCache.current.pendingRequests.fetchAssignmentById[id]) {
      console.log(`Assignment fetch for ID ${id} already in progress, waiting for it to complete`);
      // Return current assignment if it matches the requested ID
      if (currentAssignment && currentAssignment.id === id) {
        return currentAssignment;
      }
      // Otherwise return from cache if available
      const cachedAssignment = requestCache.current.assignmentsById[id];
      if (cachedAssignment) {
        // Always update the current assignment to match the requested ID
        if (cachedAssignment.data) {
          console.log(`Setting current assignment from pending request cache for ID: ${id}`);
          setCurrentAssignment(cachedAssignment.data);
        }
        return cachedAssignment.data;
      }
      return null;
    }

    // Check if we have cached data that's still valid
    const cachedData = requestCache.current.assignmentsById[id];
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_EXPIRATION)) {
      console.log(`Using cached assignment data for ID: ${id}`);
      // Always update the current assignment to match the requested ID
      if (cachedData.data) {
        console.log(`Setting current assignment from cache for ID: ${id}`);
        setCurrentAssignment(cachedData.data);
      }
      return cachedData.data;
    }

    // Mark that we're starting a request
    requestCache.current.pendingRequests.fetchAssignmentById[id] = true;

    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching fresh data for assignment ID: ${id}`);
      const service = getService();
      const data = await service.getAssignmentById(id);

      // Update the cache
      requestCache.current.assignmentsById[id] = {
        data,
        timestamp: Date.now()
      };

      if (data) {
        console.log(`Setting current assignment from fresh data for ID: ${id}`);
        setCurrentAssignment(data);
      } else {
        console.log(`No data returned from service for assignment ID: ${id}`);
      }
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error fetching assignment by ID:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
      // Clear pending request flag
      requestCache.current.pendingRequests.fetchAssignmentById[id] = false;
    }
  }, [getService, currentAssignment]);

  // Fetch public assignment by ID (for playing)
  const fetchPublicAssignmentById = useCallback(async (id: string) => {
    // Check if we already have this assignment loaded
    if (currentAssignment && currentAssignment.id === id) {
      return currentAssignment;
    }

    setLoading(true);
    setError(null);
    try {
      const service = getService();
      const data = await service.getPublicAssignmentById(id);
      if (data) {
        setCurrentAssignment(data);
      }
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error fetching public assignment by ID:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentAssignment, getService]);

  // Fetch assignment by shareable link
  const fetchAssignmentByShareableLink = useCallback(async (shareableLink: string) => {
    // Check if we already have an assignment with this shareable link
    if (currentAssignment && currentAssignment.shareableLink === shareableLink) {
      return currentAssignment;
    }

    setLoading(true);
    setError(null);
    try {
      const service = getService();
      const data = await service.getAssignmentByShareableLink(shareableLink);
      if (data) {
        setCurrentAssignment(data);
      }
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error fetching assignment by shareable link:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentAssignment, getService]);

  // Create assignment
  const createAssignment = async (assignment: Partial<InteractiveAssignment>) => {
    setLoading(true);
    setError(null);
    try {
      // Add the current user's ID as the creator and organization ID if available
      const assignmentWithCreator = {
        ...assignment,
        createdBy: userId || 'anonymous',
        organizationId: currentOrganization?.id // Add organization ID from context
      };

      const service = getService();
      const data = await service.createAssignment(assignmentWithCreator);
      setAssignments(prev => [data, ...prev]);
      toast.success('Assignment created successfully');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update assignment
  const updateAssignment = async (id: string, assignment: Partial<InteractiveAssignment>) => {
    setLoading(true);
    setError(null);
    try {
      const service = getService();
      const data = await service.updateAssignment(id, assignment);
      setAssignments(prev => prev.map(a => a.id === id ? data : a));
      if (currentAssignment?.id === id) {
        setCurrentAssignment(data);
      }
      toast.success('Assignment updated successfully');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete assignment
  const deleteAssignment = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const service = getService();
      await service.deleteAssignment(id);
      setAssignments(prev => prev.filter(a => a.id !== id));
      if (currentAssignment?.id === id) {
        setCurrentAssignment(null);
      }
      toast.success('Assignment deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete multiple assignments
  const deleteMultipleAssignments = async (ids: string[]) => {
    if (ids.length === 0) return;

    setLoading(true);
    setError(null);
    showProgress('Deleting assignments...');
    updateProgress(5, 'Preparing to delete assignments...');

    try {
      const service = getService();
      let successCount = 0;
      let failCount = 0;
      let lastError = null;

      // Process each assignment deletion sequentially
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        updateProgress(
          5 + Math.floor((i / ids.length) * 90),
          `Deleting assignment ${i + 1} of ${ids.length}...`
        );

        try {
          // First, check if the assignment exists
          const assignmentExists = assignments.some(a => a.id === id);
          if (!assignmentExists) {
            console.log(`Assignment ${id} not found in state, skipping`);
            continue;
          }

          await service.deleteAssignment(id);
          successCount++;
        } catch (error) {
          console.error(`Error deleting assignment ${id}:`, error);
          failCount++;
          lastError = error;

          // Continue with the next assignment instead of stopping the whole process
        }
      }

      // Update the assignments state to remove the deleted assignments
      if (successCount > 0) {
        setAssignments(prev => prev.filter(a => !ids.includes(a.id)));

        // If current assignment was deleted, set it to null
        if (currentAssignment && ids.includes(currentAssignment.id)) {
          setCurrentAssignment(null);
        }
      }

      updateProgress(100, successCount > 0 ? 'Assignments deleted successfully' : 'Failed to delete assignments');

      if (failCount === 0 && successCount > 0) {
        toast.success(`Successfully deleted ${successCount} assignment${successCount !== 1 ? 's' : ''}`);
      } else if (successCount > 0) {
        toast.success(`Deleted ${successCount} assignment${successCount !== 1 ? 's' : ''}, but failed to delete ${failCount}`);
      } else {
        const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown error occurred';
        toast.error(`Failed to delete assignments: ${errorMessage}`);
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      updateProgress(100, `Error: ${errorMessage}`);
      toast.error(`Failed to delete assignments: ${errorMessage}`);
    } finally {
      setLoading(false);
      setTimeout(() => {
        hideProgress();
      }, 1000);
    }
  };

  // Create question
  const createQuestion = async (question: Partial<InteractiveQuestion>) => {
    setLoading(true);
    setError(null);
    try {
      const service = getService();
      const data = await service.createQuestion(question);

      // Update current assignment if this question belongs to it
      if (currentAssignment && currentAssignment.id === question.assignmentId) {
        // Fetch the updated assignment to ensure we have the latest data
        const updatedAssignment = await fetchAssignmentById(currentAssignment.id);
        if (updatedAssignment) {
          setCurrentAssignment(updatedAssignment);
        } else {
          // Fallback to manual update if fetch fails
          const updatedQuestions = [...(currentAssignment.questions || []), data];
          setCurrentAssignment({
            ...currentAssignment,
            questions: updatedQuestions
          });
        }
      }

      toast.success('Question created successfully');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update question
  const updateQuestion = async (id: string, question: Partial<InteractiveQuestion>) => {
    setLoading(true);
    setError(null);
    try {
      const service = getService();
      const data = await service.updateQuestion(id, question);

      // Update current assignment if this question belongs to it
      if (currentAssignment && currentAssignment.questions) {
        // Fetch the updated assignment to ensure we have the latest data
        if (question.assignmentId) {
          const updatedAssignment = await fetchAssignmentById(question.assignmentId);
          if (updatedAssignment) {
            setCurrentAssignment(updatedAssignment);
          } else {
            // Fallback to manual update if fetch fails
            const updatedQuestions = currentAssignment.questions.map(q =>
              q.id === id ? data : q
            );
            setCurrentAssignment({
              ...currentAssignment,
              questions: updatedQuestions
            });
          }
        }
      }

      toast.success('Question updated successfully');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete question
  const deleteQuestion = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // Get the question's assignment ID before deleting
      let assignmentId = '';
      if (currentAssignment && currentAssignment.questions) {
        const question = currentAssignment.questions.find(q => q.id === id);
        if (question) {
          assignmentId = question.assignmentId;
        }
      }

      const service = getService();
      await service.deleteQuestion(id);

      // Update current assignment if this question belongs to it
      if (currentAssignment && currentAssignment.questions) {
        if (assignmentId) {
          // Fetch the updated assignment to ensure we have the latest data
          const updatedAssignment = await fetchAssignmentById(assignmentId);
          if (updatedAssignment) {
            setCurrentAssignment(updatedAssignment);
          } else {
            // Fallback to manual update if fetch fails
            const updatedQuestions = currentAssignment.questions.filter(q => q.id !== id);
            setCurrentAssignment({
              ...currentAssignment,
              questions: updatedQuestions
            });
          }
        }
      }

      toast.success('Question deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create submission
  const createSubmission = async (submission: Partial<InteractiveSubmission>) => {
    setLoading(true);
    setError(null);
    try {
      // Add the current user's ID if authenticated
      // Note: The database expects a UUID format for the userId field
      const submissionWithUser = {
        ...submission,
        userId: userId || (anonymousUser ? anonymousUser.id : 'anonymous')
      };

      const service = getService();
      const submissionId = await service.createSubmission(submissionWithUser);
      return submissionId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Submit responses
  const submitResponses = async (submissionId: string, responses: Partial<InteractiveResponse>[], score?: number) => {
    setLoading(true);
    setError(null);
    try {
      const service = getService();
      await service.submitResponses(submissionId, responses, score);

      // Invalidate user submissions cache after successful submission
      if (userId && requestCache.current.userSubmissions[userId]) {
        console.log('🔄 Invalidating user submissions cache after successful submission');
        delete requestCache.current.userSubmissions[userId];
      }

      // Don't show toast here - let the calling component handle notifications
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      // Don't show toast here - let the calling component handle error notifications
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register anonymous user
  const registerAnonymousUser = async (name: string, contactInfo?: string) => {
    setLoading(true);
    setError(null);
    try {
      const service = getService();
      const user = await service.registerAnonymousUser(name, contactInfo);
      setAnonymousUser(user);

      // Store user in local storage
      localStorage.setItem('anonymousUser', JSON.stringify(user));

      toast.success('Registration successful');
      return user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Generate shareable link
  const generateShareableLink = async (assignmentId: string, expiresInDays = 30) => {
    setLoading(true);
    setError(null);
    try {
      const service = getService();
      const link = await service.generateShareableLink(assignmentId, expiresInDays);

      // Update current assignment if this is the one we're generating a link for
      if (currentAssignment && currentAssignment.id === assignmentId) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);

        setCurrentAssignment({
          ...currentAssignment,
          shareableLink: link,
          shareableLinkExpiresAt: expiresAt
        });
      }

      toast.success('Shareable link generated successfully');
      return link;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch user submissions
  const fetchUserSubmissions = useCallback(async () => {
    console.log('fetchUserSubmissions called with userId:', userId);

    if (!userId) {
      console.warn('fetchUserSubmissions called without a userId');
      return [];
    }

    // Check if there's a pending request already for this user
    if (requestCache.current.pendingRequests.fetchUserSubmissions[userId]) {
      console.log(`User submissions fetch for user ${userId} already in progress, waiting for it to complete`);
      const cachedSubmissions = requestCache.current.userSubmissions[userId];
      if (cachedSubmissions) {
        console.log(`Returning ${cachedSubmissions.data.length} cached submissions for user ${userId}`);
        return cachedSubmissions.data;
      }
      console.log(`No cached submissions found for user ${userId} despite pending request`);
      return [];
    }

    // Check if we have cached data that's still valid
    const cachedData = requestCache.current.userSubmissions[userId];
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_EXPIRATION)) {
      console.log(`Using cached user submissions data for user: ${userId}, found ${cachedData.data.length} submissions`);
      return cachedData.data;
    }

    // Mark that we're starting a request
    requestCache.current.pendingRequests.fetchUserSubmissions[userId] = true;
    console.log(`Starting new submissions request for user ${userId}`);

    setLoading(true);
    setError(null);
    try {
      // Check if supabase is available
      if (!supabase) {
        console.error('Supabase client not available for fetchUserSubmissions');
        throw new Error('Database connection is not available');
      }

      const userProgressService = createUserProgressService(supabase);
      console.log('Created userProgressService, fetching submissions for user:', userId);

      // Directly query the database to check if submissions exist
      try {
        const { data: directData, error: directError } = await supabase
          .from('interactive_submission')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'SUBMITTED');

        if (directError) {
          console.error('Direct query error:', directError);
        } else {
          console.log(`Direct query found ${directData?.length || 0} submissions for user ${userId}`);
          console.log('Direct query results:', JSON.stringify(directData));
        }
      } catch (directQueryError) {
        console.error('Error in direct query:', directQueryError);
      }

      // Now use the service to fetch submissions with proper formatting
      const submissions = await userProgressService.fetchUserSubmissions(userId); // The service will handle UUID conversion
      console.log('Received submissions from service:', submissions.length);
      console.log('Submissions data:', JSON.stringify(submissions));

      // Update the cache
      requestCache.current.userSubmissions[userId] = {
        data: submissions,
        timestamp: Date.now()
      };
      console.log(`Updated cache with ${submissions.length} submissions for user ${userId}`);

      return submissions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error in fetchUserSubmissions:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      // Note: We're not setting loading to false here because the component that called this method
      // should handle its own loading state. This prevents conflicts when multiple components
      // are using this method simultaneously.

      // Clear pending request flag
      requestCache.current.pendingRequests.fetchUserSubmissions[userId] = false;
      console.log(`Completed submissions request for user ${userId}`);
    }
  }, [userId, supabase]);

  // Refresh user submissions (force cache invalidation)
  const refreshUserSubmissions = useCallback(async () => {
    console.log('🔄 Refreshing user submissions (force cache invalidation)');

    if (!userId) {
      console.warn('refreshUserSubmissions called without a userId');
      return [];
    }

    // Force invalidate cache
    if (requestCache.current.userSubmissions[userId]) {
      delete requestCache.current.userSubmissions[userId];
    }

    // Clear any pending requests
    requestCache.current.pendingRequests.fetchUserSubmissions[userId] = false;

    // Fetch fresh data
    return await fetchUserSubmissions();
  }, [userId, fetchUserSubmissions]);

  // Fetch user progress
  const fetchUserProgress = async (): Promise<UserProgress[]> => {
    setLoading(true);
    setError(null);
    try {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (!supabase) return [];
      const userProgressService = createUserProgressService(supabase);
      const progress = await userProgressService.fetchUserProgress(userId); // The service will handle UUID conversion
      return progress || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Update user progress
  const updateUserProgress = async (progress: Partial<UserProgress>): Promise<UserProgress> => {
    setLoading(true);
    setError(null);
    try {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const progressWithUserId = {
        ...progress,
        userId: userId // The service will convert this to UUID format
      };

      if (!supabase) {
        throw new Error('Database connection is not available');
      }

      const userProgressService = createUserProgressService(supabase);
      const updatedProgress = await userProgressService.updateUserProgress(progressWithUserId);

      if (!updatedProgress) {
        throw new Error('Failed to update user progress');
      }

      return updatedProgress;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err; // Re-throw the error instead of returning a fallback
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    assignments,
    currentAssignment,
    loading,
    error,
    anonymousUser,
    fetchAssignments,
    fetchAssignmentById,
    fetchPublicAssignmentById,
    fetchAssignmentByShareableLink,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    deleteMultipleAssignments,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    createSubmission,
    submitResponses,
    registerAnonymousUser,
    generateShareableLink,
    setCurrentAssignment,
    // User progress methods
    fetchUserSubmissions,
    refreshUserSubmissions,
    fetchUserProgress,
    updateUserProgress,
    // Progress overlay methods
    showProgress,
    updateProgress,
    hideProgress,
  };

  // Only show progress overlay if it's explicitly requested
  const shouldShowOverlay = progressVisible && !isSupabaseLoading;

  return (
    <InteractiveAssignmentContext.Provider value={value}>
      {children}
      {shouldShowOverlay && (
        <ProgressOverlay
          isVisible={true}
          progress={progress}
          status={progressStatus}
        />
      )}
    </InteractiveAssignmentContext.Provider>
  );
};

// Custom hook to use the context
export const useInteractiveAssignment = () => {
  const context = useContext(InteractiveAssignmentContext);
  if (context === undefined) {
    throw new Error('useInteractiveAssignment must be used within an InteractiveAssignmentProvider');
  }
  return context;
};
