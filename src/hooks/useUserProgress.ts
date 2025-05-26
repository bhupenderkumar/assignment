// src/hooks/useUserProgress.ts
import { useState, useCallback, useRef } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useInteractiveAssignment } from '../context/InteractiveAssignmentContext';

export interface QuestionProgress {
  questionId: string;
  questionIndex: number;
  startedAt: Date;
  answeredAt?: Date;
  timeSpent: number; // in seconds
  attempts: number;
  isCorrect?: boolean;
  responseData?: any;
}

export interface UserJourney {
  assignmentId: string;
  userId: string;
  startedAt: Date;
  currentQuestionIndex: number;
  totalQuestions: number;
  questionsProgress: Record<string, QuestionProgress>;
  milestones: {
    started: Date;
    firstQuestionAnswered?: Date;
    halfwayComplete?: Date;
    completed?: Date;
  };
  totalTimeSpent: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'HALFWAY' | 'COMPLETED' | 'ABANDONED';
}

interface UseUserProgressReturn {
  currentJourney: UserJourney | null;
  isTracking: boolean;
  startTracking: (assignmentId: string, totalQuestions: number) => void;
  trackQuestionStart: (questionId: string, questionIndex: number) => void;
  trackQuestionAnswer: (questionId: string, isCorrect: boolean, responseData?: any) => void;
  trackQuestionNavigation: (newQuestionIndex: number) => void;
  completeJourney: (finalScore?: number) => void;
  getProgressPercentage: () => number;
  getTimeSpentOnQuestion: (questionId: string) => number;
  getCurrentMilestone: () => string;
  saveProgress: () => Promise<void>;
}

export const useUserProgress = (): UseUserProgressReturn => {
  const [currentJourney, setCurrentJourney] = useState<UserJourney | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const { user, anonymousUser } = useSupabaseAuth();
  const { updateUserProgress } = useInteractiveAssignment();

  // Timer refs for tracking time spent
  const questionTimerRef = useRef<number | null>(null);
  const journeyTimerRef = useRef<number | null>(null);
  const currentQuestionStartTime = useRef<Date | null>(null);

  const getCurrentUser = useCallback(() => {
    return user || anonymousUser;
  }, [user, anonymousUser]);

  const startTracking = useCallback((assignmentId: string, totalQuestions: number) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.warn('🎯 Cannot start tracking: No user available');
      return;
    }

    // Validate input parameters
    if (!assignmentId || totalQuestions <= 0) {
      console.warn('🎯 Cannot start tracking: Invalid parameters', { assignmentId, totalQuestions });
      return;
    }

    const now = new Date();
    const newJourney: UserJourney = {
      assignmentId,
      userId: currentUser.id,
      startedAt: now,
      currentQuestionIndex: 0,
      totalQuestions,
      questionsProgress: {},
      milestones: {
        started: now,
      },
      totalTimeSpent: 0,
      status: 'IN_PROGRESS',
    };

    setCurrentJourney(newJourney);
    setIsTracking(true);

    // Start journey timer
    journeyTimerRef.current = window.setInterval(() => {
      setCurrentJourney(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          totalTimeSpent: prev.totalTimeSpent + 1,
        };
      });
    }, 1000);

    console.log('🎯 Started tracking user journey for assignment:', assignmentId, 'with', totalQuestions, 'questions');
  }, [getCurrentUser]);

  const trackQuestionStart = useCallback((questionId: string, questionIndex: number) => {
    setCurrentJourney(prev => {
      if (!prev) return prev;

      // Check if we're already tracking this exact question to prevent duplicates
      const existingProgress = prev.questionsProgress[questionId];
      if (existingProgress && existingProgress.startedAt && prev.currentQuestionIndex === questionIndex) {
        return prev; // Already tracking this question, no changes needed
      }

      const now = new Date();
      currentQuestionStartTime.current = now;

      const newProgress: QuestionProgress = {
        questionId,
        questionIndex,
        startedAt: existingProgress?.startedAt || now,
        timeSpent: existingProgress?.timeSpent || 0,
        attempts: existingProgress?.attempts || 0,
      };

      const updatedJourney = {
        ...prev,
        currentQuestionIndex: questionIndex,
        questionsProgress: {
          ...prev.questionsProgress,
          [questionId]: newProgress,
        },
      };

      // Check for milestones
      if (!prev.milestones.firstQuestionAnswered && questionIndex === 0) {
        updatedJourney.milestones.firstQuestionAnswered = now;
      }

      const halfwayPoint = Math.floor(prev.totalQuestions / 2);
      if (!prev.milestones.halfwayComplete && questionIndex >= halfwayPoint) {
        updatedJourney.milestones.halfwayComplete = now;
        updatedJourney.status = 'HALFWAY';
      }

      // Start question timer only if not already started
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
      }

      questionTimerRef.current = window.setInterval(() => {
        setCurrentJourney(current => {
          if (!current || !current.questionsProgress[questionId]) return current;

          return {
            ...current,
            questionsProgress: {
              ...current.questionsProgress,
              [questionId]: {
                ...current.questionsProgress[questionId],
                timeSpent: current.questionsProgress[questionId].timeSpent + 1,
              },
            },
          };
        });
      }, 1000);

      console.log('📝 Started tracking question:', questionId, 'at index:', questionIndex);
      return updatedJourney;
    });
  }, []);

  const trackQuestionAnswer = useCallback((questionId: string, isCorrect: boolean, responseData?: any) => {
    const now = new Date();

    setCurrentJourney(prev => {
      if (!prev || !prev.questionsProgress[questionId]) return prev;

      const updatedProgress = {
        ...prev.questionsProgress[questionId],
        answeredAt: now,
        attempts: prev.questionsProgress[questionId].attempts + 1,
        isCorrect,
        responseData,
      };

      const updatedJourney = {
        ...prev,
        questionsProgress: {
          ...prev.questionsProgress,
          [questionId]: updatedProgress,
        },
      };

      // Update milestones
      if (!prev.milestones.firstQuestionAnswered) {
        updatedJourney.milestones.firstQuestionAnswered = now;
      }

      return updatedJourney;
    });

    console.log('✅ Tracked question answer:', questionId, 'correct:', isCorrect);
  }, []);

  const trackQuestionNavigation = useCallback((newQuestionIndex: number) => {
    // Stop current question timer
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }

    setCurrentJourney(prev => {
      if (!prev || prev.currentQuestionIndex === newQuestionIndex) return prev;
      return {
        ...prev,
        currentQuestionIndex: newQuestionIndex,
      };
    });

    console.log('🧭 Tracked navigation to question index:', newQuestionIndex);
  }, []);

  const completeJourney = useCallback((finalScore?: number) => {
    const now = new Date();

    // Stop all timers
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
    if (journeyTimerRef.current) {
      clearInterval(journeyTimerRef.current);
      journeyTimerRef.current = null;
    }

    setCurrentJourney(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        status: 'COMPLETED',
        milestones: {
          ...prev.milestones,
          completed: now,
        },
      };
    });

    setIsTracking(false);
    console.log('🏁 Completed user journey with score:', finalScore);
  }, []);

  const getProgressPercentage = useCallback((): number => {
    if (!currentJourney || currentJourney.totalQuestions <= 0) {
      console.warn('🎯 getProgressPercentage: Invalid journey data', { currentJourney });
      return 0;
    }

    const answeredQuestions = Object.values(currentJourney.questionsProgress)
      .filter(q => q.answeredAt).length;

    const percentage = Math.round((answeredQuestions / currentJourney.totalQuestions) * 100);

    console.log('🎯 Progress calculation:', {
      answeredQuestions,
      totalQuestions: currentJourney.totalQuestions,
      percentage,
      questionsProgress: Object.keys(currentJourney.questionsProgress)
    });

    return percentage;
  }, [currentJourney]);

  const getTimeSpentOnQuestion = useCallback((questionId: string): number => {
    if (!currentJourney || !currentJourney.questionsProgress[questionId]) return 0;
    return currentJourney.questionsProgress[questionId].timeSpent;
  }, [currentJourney]);

  const getCurrentMilestone = useCallback((): string => {
    if (!currentJourney) return 'Not Started';

    const { milestones, status } = currentJourney;

    if (status === 'COMPLETED') return 'Completed';
    if (status === 'HALFWAY') return 'Halfway Complete';
    if (milestones.firstQuestionAnswered) return 'In Progress';
    return 'Just Started';
  }, [currentJourney]);

  const saveProgress = useCallback(async (): Promise<void> => {
    if (!currentJourney) return;

    const startTime = performance.now();

    try {
      // Batch progress data for efficient saving
      const progressData = {
        userId: currentJourney.userId,
        assignmentId: currentJourney.assignmentId,
        startedAt: currentJourney.startedAt,
        timeSpent: currentJourney.totalTimeSpent,
        status: (currentJourney.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS') as 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED',
        feedback: `Progress: ${getProgressPercentage()}% - ${getCurrentMilestone()}`,
        // Add detailed progress metrics
        currentQuestionIndex: currentJourney.currentQuestionIndex,
        questionsAnswered: Object.values(currentJourney.questionsProgress).filter(q => q.answeredAt).length,
      };

      await updateUserProgress(progressData);

      const endTime = performance.now();
      console.log(`💾 Saved user progress to database in ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      const endTime = performance.now();
      console.error(`❌ Failed to save user progress after ${(endTime - startTime).toFixed(2)}ms:`, error);

      // Fallback: save to localStorage if database fails
      try {
        const localProgressKey = `progress_${currentJourney.userId}_${currentJourney.assignmentId}`;
        const localProgress = {
          ...currentJourney,
          lastSaved: new Date().toISOString(),
          progressPercentage: getProgressPercentage(),
          milestone: getCurrentMilestone(),
        };
        localStorage.setItem(localProgressKey, JSON.stringify(localProgress));
        console.log('💾 Saved progress to localStorage as fallback');
      } catch (localError) {
        console.error('❌ Failed to save progress to localStorage:', localError);
      }
    }
  }, [currentJourney, updateUserProgress, getProgressPercentage, getCurrentMilestone]);

  return {
    currentJourney,
    isTracking,
    startTracking,
    trackQuestionStart,
    trackQuestionAnswer,
    trackQuestionNavigation,
    completeJourney,
    getProgressPercentage,
    getTimeSpentOnQuestion,
    getCurrentMilestone,
    saveProgress,
  };
};

export default useUserProgress;
