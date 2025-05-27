// src/components/assignments/PlayAssignment.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useDatabaseState } from '../../context/DatabaseStateContext';
import { createEnhancedInteractiveAssignmentService } from '../../lib/services/enhancedInteractiveAssignmentService';
import { getCachedItem, setCachedItem } from '../../lib/utils/cacheUtils';
import { paymentService } from '../../lib/services/paymentService';

// Add paymentService to window for debugging
if (typeof window !== 'undefined') {
  (window as any).paymentService = paymentService;
}
import ProgressDisplay from './ProgressDisplay';
import { playSound, stopSpeaking, cleanTextForTTS, isTTSAvailable } from '../../utils/soundUtils';
import CelebrationOverlay from './CelebrationOverlay';
// Anonymous user registration moved to parent component
import EnhancedMatchingExercise from '../exercises/EnhancedMatchingExercise';
import MultipleChoiceExercise from '../exercises/MultipleChoiceExercise';
import CompletionExercise from '../exercises/CompletionExercise';
import OrderingExercise from '../exercises/OrderingExercise';
import SimpleAudioPlayer, { SimpleAudioPlayerRef } from '../common/SimpleAudioPlayer';
import { initializeSoundSystem, startBackgroundMusic, stopBackgroundMusic, stopAllSounds } from '../../lib/utils/soundUtils';
import { scrollToQuestion } from '../../lib/utils/scrollUtils';
import toast from 'react-hot-toast';
import { InteractiveAssignment, InteractiveQuestion, InteractiveResponse } from '../../types/interactiveAssignment';
import CertificateFloatingButton from '../certificates/CertificateFloatingButton';
import ProgressOverlay from '../ui/ProgressOverlay';
import { useProgressOverlay } from '../../hooks/useProgressOverlay';
import UserProgressTracker from '../progress/UserProgressTracker';
import SubmissionProgressTracker from '../progress/SubmissionProgressTracker';
import { useUserProgress } from '../../hooks/useUserProgress';
import SubmissionDiagnostic from '../debug/SubmissionDiagnostic';
// Mobile-first components
import { useTranslations } from '../../hooks/useTranslations';
import { useConfiguration } from '../../context/ConfigurationContext';


// Extend window interface for payment tracking
declare global {
  interface Window {
    _checkedPayments?: Record<string, boolean>;
  }
}

interface PlayAssignmentProps {
  assignment?: InteractiveAssignment | null;
  onAssignmentStart?: () => void;
  onAssignmentComplete?: () => void;
  onOrganizationLoad?: (organization: any) => void;
}

const PlayAssignment = ({
  assignment,
  onAssignmentStart,
  onAssignmentComplete,
  onOrganizationLoad
}: PlayAssignmentProps) => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { anonymousUser, createSubmission, submitResponses } = useInteractiveAssignment();
  const { user, isSupabaseLoading, supabase } = useSupabaseAuth();
  const navigate = useNavigate();
  const { config } = useConfiguration();
  const { commonTranslate } = useTranslations();

  // All state declarations must come first before any hooks
  const [isMobile, setIsMobile] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<InteractiveAssignment | null>(assignment || null);
  const [audioInstructions, setAudioInstructions] = useState<string | null>(null);
  const [audioInstructionsLoaded, setAudioInstructionsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, InteractiveResponse>>({});
  const [score, setScore] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerInterval, setTimerInterval] = useState<number | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessingSubmission, setIsProcessingSubmission] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [hasPlayedGreeting, setHasPlayedGreeting] = useState(false);
  const [isTTSActive, setIsTTSActive] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | undefined>(undefined);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [assignmentOrganization, setAssignmentOrganization] = useState<any>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [submissionSteps, setSubmissionSteps] = useState<Array<{
    id: string;
    label: string;
    status: 'pending' | 'active' | 'completed' | 'error';
  }>>([
    { id: 'prepare', label: 'Preparing submission', status: 'pending' },
    { id: 'validate', label: 'Validating responses', status: 'pending' },
    { id: 'calculate', label: 'Calculating score', status: 'pending' },
    { id: 'submit', label: 'Submitting to server', status: 'pending' },
    { id: 'complete', label: 'Processing results', status: 'pending' },
  ]);
  const [showSubmissionTracker, setShowSubmissionTracker] = useState(false);
  const [currentSubmissionStep, setCurrentSubmissionStep] = useState('');

  // Mobile detection effect
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debug effect to track currentAssignment changes
  useEffect(() => {
    console.log('🎯 currentAssignment changed:', {
      hasAssignment: !!currentAssignment,
      id: currentAssignment?.id,
      title: currentAssignment?.title,
      audioInstructions: currentAssignment?.audioInstructions,
      audioInstructionsType: typeof currentAssignment?.audioInstructions,
      audioInstructionsLength: currentAssignment?.audioInstructions?.length || 0,
      allKeys: currentAssignment ? Object.keys(currentAssignment) : 'none',
      timestamp: new Date().toISOString()
    });
  }, [currentAssignment]);

  // Direct fetch for audio instructions - bypassing service layer issues
  useEffect(() => {
    const fetchAudioInstructions = async () => {
      if (!currentAssignment?.id || !supabase || audioInstructionsLoaded) return;

      try {
        console.log('🎵 Fetching audio instructions directly from database...');
        const { data, error } = await supabase
          .from('interactive_assignment')
          .select('audio_instructions')
          .eq('id', currentAssignment.id)
          .single();

        if (error) {
          console.error('❌ Error fetching audio instructions:', error);
          setAudioInstructionsLoaded(true);
          return;
        }

        console.log('✅ Audio instructions fetched:', {
          audioInstructions: data?.audio_instructions,
          type: typeof data?.audio_instructions,
          length: data?.audio_instructions?.length || 0
        });

        setAudioInstructions(data?.audio_instructions || null);
        setAudioInstructionsLoaded(true);
      } catch (err) {
        console.error('❌ Exception fetching audio instructions:', err);
        setAudioInstructionsLoaded(true);
      }
    };

    fetchAudioInstructions();
  }, [currentAssignment?.id, supabase, audioInstructionsLoaded]);

  // Handle speak question event from mobile navigation - moved to top with other hooks
  useEffect(() => {
    const handleSpeakQuestion = () => {
      // Dispatch a custom event that will be handled later when speakQuestion is available
      window.dispatchEvent(new CustomEvent('triggerSpeakQuestion', {
        detail: { currentQuestionIndex }
      }));
    };

    window.addEventListener('speakQuestion', handleSpeakQuestion);
    return () => window.removeEventListener('speakQuestion', handleSpeakQuestion);
  }, [currentQuestionIndex]);

  // Use refs to track TTS state without causing re-renders
  const ttsScheduledRef = useRef(false);
  const currentQuestionTTSRef = useRef<string | null>(null);
  const ttsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const completedTTSQuestionsRef = useRef<Set<string>>(new Set());
  const audioPlayerRef = useRef<SimpleAudioPlayerRef>(null);

  // Progress overlay for submission feedback
  const {
    isVisible: progressVisible,
    progress,
    status: progressStatus,
    showProgress,
    updateProgress,
    hideProgress
  } = useProgressOverlay();

  // User progress tracking
  const { completeJourney, saveProgress } = useUserProgress();

  // Ref to prevent duplicate submissions
  const isSubmittingRef = useRef(false);

  // Create the enhanced service
  const assignmentService = useCallback(() => {
    return createEnhancedInteractiveAssignmentService(user);
  }, [user]);

  // Import the database state context
  const { isReady: isDatabaseReady, executeWhenReady, state: dbState } = useDatabaseState();

  // Update currentAssignment when assignment prop changes - only once
  useEffect(() => {
    console.log('🔄 Assignment prop effect triggered:', {
      hasAssignmentProp: !!assignment,
      hasCurrentAssignment: !!currentAssignment,
      assignmentPropKeys: assignment ? Object.keys(assignment) : 'none',
      assignmentPropAudio: assignment?.audioInstructions,
      currentAssignmentKeys: currentAssignment ? Object.keys(currentAssignment) : 'none',
      currentAssignmentAudio: currentAssignment?.audioInstructions
    });

    if (assignment && !currentAssignment) {
      console.log('📥 Setting assignment from props:', {
        id: assignment.id,
        title: assignment.title,
        audioInstructions: assignment.audioInstructions,
        allKeys: Object.keys(assignment)
      });
      setCurrentAssignment(assignment);

      // Cache the assignment data for persistence
      if (assignment.id) {
        try {
          const cachedAssignmentKey = `cached_assignment_${assignment.id}`;
          localStorage.setItem(cachedAssignmentKey, JSON.stringify(assignment));
        } catch (cacheError) {
          console.warn('Error caching assignment from props:', cacheError);
        }
      }
    }
  }, [assignment, currentAssignment]);

  // Fetch assignment organization data
  useEffect(() => {
    const fetchAssignmentOrganization = async () => {
      if (currentAssignment?.organizationId && supabase) {
        try {
          const { data, error } = await supabase
            .from('organization')
            .select('id, name, logo_url, primary_color, secondary_color')
            .eq('id', currentAssignment.organizationId)
            .single();

          if (data && !error) {
            setAssignmentOrganization(data);
            // Call the parent callback to pass organization data up
            if (onOrganizationLoad) {
              onOrganizationLoad(data);
            }
          }
        } catch (error) {
          console.error('Error fetching assignment organization:', error);
        }
      }
    };

    fetchAssignmentOrganization();
  }, [currentAssignment?.organizationId, supabase, onOrganizationLoad]);

  // Function to fetch assignment with retry logic and caching - optimized to reduce calls
  const fetchAssignment = useCallback(async () => {
    // Skip if we already have the assignment, Supabase is loading, or database isn't ready
    if (currentAssignment || isSupabaseLoading || !isDatabaseReady) {
      if (!isDatabaseReady && dbState === 'error') {
        setError('Database connection error. Please try refreshing the page.');
      }
      return;
    }

    // Skip if we're using assignment from props
    if (assignment) {
      setCurrentAssignment(assignment);
      return;
    }

    // Skip if no assignment ID
    if (!assignmentId) {
      setError('No assignment ID provided');
      return;
    }

    // Check cache first
    const cachedAssignmentKey = `cached_assignment_${assignmentId}`;
    const cachedAssignment = getCachedItem<InteractiveAssignment>(cachedAssignmentKey);

    console.log('💾 Cache check result:', {
      assignmentId,
      hasCachedAssignment: !!cachedAssignment,
      cachedKeys: cachedAssignment ? Object.keys(cachedAssignment) : 'none',
      cachedAudioInstructions: cachedAssignment?.audioInstructions
    });

    if (cachedAssignment) {
      console.log('📦 Using cached assignment:', {
        id: cachedAssignment.id,
        title: cachedAssignment.title,
        audioInstructions: cachedAssignment.audioInstructions,
        allKeys: Object.keys(cachedAssignment)
      });
      setCurrentAssignment(cachedAssignment);
      return;
    }

    // Only set loading if we're actually going to make a network request
    setLoading(true);
    setError(null);

    try {
      // Create service
      const service = assignmentService();

      // Determine if we're on a shared page
      const isSharedPage = window.location.pathname.includes('/play/share/');

      let fetchedAssignment;
      if (isSharedPage) {
        const shareableLink = window.location.pathname.split('/play/share/')[1];
        if (shareableLink) {
          fetchedAssignment = await service.getAssignmentByShareableLink(shareableLink);
        } else {
          throw new Error('Invalid shareable link');
        }
      } else {
        fetchedAssignment = await service.getPublicAssignmentById(assignmentId);
      }

      if (fetchedAssignment) {
        console.log('🎯 Assignment fetched successfully:', {
          id: fetchedAssignment.id,
          title: fetchedAssignment.title,
          audioInstructions: fetchedAssignment.audioInstructions,
          audioInstructionsType: typeof fetchedAssignment.audioInstructions,
          audioInstructionsLength: fetchedAssignment.audioInstructions?.length || 0,
          allKeys: Object.keys(fetchedAssignment)
        });
        setCurrentAssignment(fetchedAssignment);
        // Try to cache the assignment data, but don't worry if it fails
        try {
          const cacheSuccess = setCachedItem(cachedAssignmentKey, fetchedAssignment);
          if (!cacheSuccess) {
            console.log('Assignment too large to cache, proceeding without caching');
          }
        } catch (cacheError) {
          console.warn('Failed to cache assignment, proceeding without caching:', cacheError);
        }
      } else {
        console.error('🚨 No assignment data returned from service');
        setError('Assignment not found or not published');
      }
    } catch (err) {
      console.error('Error fetching assignment:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [assignment, assignmentId, assignmentService, isSupabaseLoading, isDatabaseReady, dbState, currentAssignment]);

  // Fetch assignment only once when component mounts or when dependencies change
  useEffect(() => {
    // Skip if we already have the assignment or if it's provided as a prop
    if (currentAssignment || assignment) {
      return;
    }

    // If both database and auth are ready, fetch immediately
    if (isDatabaseReady && !isSupabaseLoading) {
      executeWhenReady(() => fetchAssignment())
        .catch(err => console.error('Error executing database operation:', err));
      return;
    }

    // If we've reached the retry limit, show an error
    if (retryCount >= 3) {
      setError('Could not connect to the database after multiple attempts. Please refresh the page.');
      return;
    }

    // Set a timeout with exponential backoff for retries
    const retryDelay = Math.min(1500 * Math.pow(1.5, retryCount), 5000); // Max 5 seconds
    const timeoutId = setTimeout(() => {
      setRetryCount(prev => prev + 1);
    }, retryDelay);

    return () => clearTimeout(timeoutId);
  }, [assignment, assignmentId, fetchAssignment, isSupabaseLoading, retryCount, isDatabaseReady, dbState, executeWhenReady, currentAssignment]);

  // We're moving the user registration check to the parent component

  // Check if assignment requires payment - using useRef to prevent multiple calls
  const paymentCheckRef = useRef<string | null>(null);

  useEffect(() => {
    // Only run payment check once per assignment/user combination
    if (!currentAssignment?.id || !user?.id || checkingPayment || isSubmitted) {
      return;
    }

    const paymentCheckKey = `${currentAssignment.id}-${user.id}`;

    // If we've already checked this combination, don't check again
    if (paymentCheckRef.current === paymentCheckKey) {
      return;
    }

    console.log('💳 Starting payment check for assignment:', currentAssignment.id);

    const checkPayment = async () => {
      setCheckingPayment(true);
      paymentCheckRef.current = paymentCheckKey; // Mark as checked

      try {
        const paymentStatus = await paymentService.getAssignmentPaymentStatus(currentAssignment.id, user.id);
        console.log('💳 Payment status received:', paymentStatus);

        // Additional logging for debugging payment issues
        console.log('💳 Payment check details:', {
          assignmentId: currentAssignment.id,
          assignmentTitle: currentAssignment.title,
          requiresPayment: paymentStatus.requiresPayment,
          hasPaid: paymentStatus.hasPaid,
          paymentAmount: paymentStatus.paymentAmount,
          shouldRedirect: paymentStatus.requiresPayment && !paymentStatus.hasPaid
        });

        setRequiresPayment(paymentStatus.requiresPayment);
        setHasPaid(paymentStatus.hasPaid);
        setPaymentAmount(paymentStatus.paymentAmount);

        // Mark this combination as checked
        if (window._checkedPayments) {
          window._checkedPayments[paymentCheckKey] = true;
        }

        // If payment is required but not paid, redirect to payment page
        if (paymentStatus.requiresPayment && !paymentStatus.hasPaid) {
          console.log('🔒 Payment required for assignment:', {
            assignmentId: currentAssignment.id,
            paymentAmount: paymentStatus.paymentAmount,
            requiresPayment: paymentStatus.requiresPayment,
            hasPaid: paymentStatus.hasPaid
          });

          toast.error('This assignment requires payment to access', {
            duration: 2000,
            icon: '💳'
          });

          // Immediate redirect to prevent multiple calls
          navigate(`/payment?assignmentId=${currentAssignment.id}&amount=${paymentStatus.paymentAmount || 0.5}`);
          return; // Exit early to prevent further execution
        } else if (paymentStatus.requiresPayment && paymentStatus.hasPaid) {
          console.log('✅ Payment verified for assignment:', currentAssignment.id);
          toast.success('Payment verified! You have access to this premium assignment', {
            duration: 3000,
            icon: '✅'
          });
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      } finally {
        setCheckingPayment(false);
      }
    };

    checkPayment();
  }, [currentAssignment?.id, user?.id, checkingPayment, navigate, isSubmitted]);

  // Effect to handle submission when isSubmitted changes
  useEffect(() => {
    // We need to define a local function here to avoid the circular dependency
    const submitAssignment = async () => {
      if (!currentAssignment || !submissionId) {
        console.log('❌ Cannot submit: missing assignment or submissionId', {
          hasAssignment: !!currentAssignment,
          hasSubmissionId: !!submissionId
        });
        return;
      }

      // Double-check to prevent duplicate submissions
      if (isSubmittingRef.current) {
        console.log('⚠️ Submission already in progress, skipping...');
        return;
      }

      console.log('🚀 Starting assignment submission process...');
      isSubmittingRef.current = true;
      setIsProcessingSubmission(true);

      // Make sure we have the current question's response before calculating score
      const ensureCurrentQuestionResponse = () => {
        if (currentAssignment.questions && currentQuestionIndex < currentAssignment.questions.length) {
          const currentQuestion = currentAssignment.questions[currentQuestionIndex];

          // If we don't have a response for the current question yet, create a default one
          if (currentQuestion && !responses[currentQuestion.id]) {
            return {
              ...responses,
              [currentQuestion.id]: {
                id: '',
                submissionId: submissionId || '',
                questionId: currentQuestion.id,
                responseData: {},
                isCorrect: false // Default to incorrect if no explicit response
              }
            };
          }
        }
        return responses;
      };

      try {
        // Update submission tracker - validate step
        setCurrentSubmissionStep('validate');
        setSubmissionSteps(prev => prev.map(step => ({
          ...step,
          status: step.id === 'prepare' ? 'completed' :
                  step.id === 'validate' ? 'active' : step.status
        })));

        // Update progress for data preparation
        updateProgress(35, 'Preparing response data...');

        // Get final responses including current question if needed
        const finalResponses = ensureCurrentQuestionResponse();

        // Update submission tracker - calculate step
        setCurrentSubmissionStep('calculate');
        setSubmissionSteps(prev => prev.map(step => ({
          ...step,
          status: step.id === 'validate' ? 'completed' :
                  step.id === 'calculate' ? 'active' : step.status
        })));

        // Update progress for score calculation
        updateProgress(45, 'Calculating your score...');

        // Calculate overall score
        const totalQuestions = currentAssignment.questions?.length || 0;
        const correctResponses = Object.values(finalResponses).filter(r => r.isCorrect);
        const calculatedScore = totalQuestions > 0
          ? Math.round((correctResponses.length / totalQuestions) * 100)
          : 0;

        setScore(calculatedScore);

        // Submit responses to server
        const responseArray = Object.values(finalResponses);

        // Update submission tracker - submit step
        setCurrentSubmissionStep('submit');
        setSubmissionSteps(prev => prev.map(step => ({
          ...step,
          status: step.id === 'calculate' ? 'completed' :
                  step.id === 'submit' ? 'active' : step.status
        })));

        // Update progress before submission
        updateProgress(55, 'Submitting your responses to server...');

        console.log(`Submitting ${responseArray.length} responses with score: ${calculatedScore}%`);

        // Pass the calculated score to the submitResponses function
        await submitResponses(submissionId, responseArray, calculatedScore);

        // Update submission tracker - complete step
        setCurrentSubmissionStep('complete');
        setSubmissionSteps(prev => prev.map(step => ({
          ...step,
          status: step.id === 'submit' ? 'completed' :
                  step.id === 'complete' ? 'active' : step.status
        })));

        // Update progress to completion
        updateProgress(90, 'Processing results...');

        // Reset loading state
        setIsSubmitting(false);
        setIsProcessingSubmission(false);

        // Show single success notification
        toast.success('Assignment completed successfully!', {
          duration: 3000,
          icon: '🎉'
        });

        // Complete progress and hide overlay
        setTimeout(() => {
          updateProgress(100, 'Completed successfully!');

          // Complete user journey tracking
          completeJourney(calculatedScore);

          // Save final progress
          saveProgress();

          setTimeout(() => {
            // Mark all steps as completed
            setSubmissionSteps(prev => prev.map(step => ({
              ...step,
              status: 'completed'
            })));

            hideProgress();
            setShowCelebration(true);

            // Hide submission tracker after a delay
            setTimeout(() => {
              setShowSubmissionTracker(false);
            }, 2000);

            // Stop background music when assignment is completed
            stopBackgroundMusic();

            // Notify parent that assignment is complete
            if (onAssignmentComplete) {
              onAssignmentComplete();
            }
          }, 1000);
        }, 300);

        console.log('Assignment submission completed successfully!');

      } catch (error) {
        console.error('Error submitting responses:', error);

        // Mark current step as error
        setSubmissionSteps(prev => prev.map(step => ({
          ...step,
          status: step.id === currentSubmissionStep ? 'error' : step.status,
          error: step.id === currentSubmissionStep ? (error instanceof Error ? error.message : 'Unknown error') : undefined
        })));

        // Reset loading state
        setIsSubmitting(false);
        setIsProcessingSubmission(false);
        hideProgress();

        // Show user-friendly error message
        const errorMessage = error instanceof Error ? error.message : 'Failed to submit assignment. Please try again.';
        toast.error(errorMessage, {
          duration: 4000
        });

        // Hide submission tracker after error
        setTimeout(() => {
          setShowSubmissionTracker(false);
        }, 3000);

        // Allow retry if submission fails
        setIsSubmitted(false);
        isSubmittingRef.current = false;
      }
    };

    if (isSubmitted && currentAssignment && submissionId) {
      console.log('✅ Submission effect triggered - calling submitAssignment');
      submitAssignment();
    } else if (isSubmitted) {
      console.log('❌ Submission effect triggered but missing requirements:', {
        isSubmitted,
        hasAssignment: !!currentAssignment,
        hasSubmissionId: !!submissionId
      });
    }
  }, [isSubmitted, currentAssignment, submissionId, currentQuestionIndex, responses, submitResponses, onAssignmentComplete]);

  // Start timer when assignment is loaded and create submission only once
  useEffect(() => {
    // Only proceed if we have an assignment and no timer yet
    if (!currentAssignment || timerInterval) {
      return;
    }

    // Initialize sound system on first assignment load
    initializeSoundSystem();

    // Start background music after a short delay
    setTimeout(() => {
      startBackgroundMusic(0.1); // Very gentle volume
    }, 1000);

    // Audio instructions notification will be handled by the AudioPlayer component

    // Start the timer
    const interval = window.setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    setTimerInterval(interval);

    // Notify parent that assignment has started
    if (onAssignmentStart) {
      onAssignmentStart();
    }

    // Create submission for any user (anonymous or authenticated) if we have an assignment and no submission ID yet
    const currentUser = anonymousUser || user;
    if (currentUser && !submissionId && currentAssignment.id) {
      // Use a flag to prevent duplicate API calls
      let isCreatingSubmission = false;

      if (!isCreatingSubmission) {
        isCreatingSubmission = true;

        createSubmission({
          assignmentId: currentAssignment.id,
          userId: currentUser.id,
          status: 'PENDING'
        })
          .then(id => {
            setSubmissionId(id);
          })
          .catch(error => {
            console.error('Error creating submission:', error);
          })
          .finally(() => {
            isCreatingSubmission = false;
          });
      }
    }

    // Cleanup function
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      // Stop all sounds when component unmounts or user navigates away
      stopAllSounds();
    };
  }, [currentAssignment, anonymousUser, user, submissionId, timerInterval, createSubmission, onAssignmentStart]);

  // Global cleanup effect to stop sounds when navigating away
  useEffect(() => {
    return () => {
      // This runs when the component unmounts (user navigates away)
      stopAllSounds();
    };
  }, []);

  // Function to enable TTS after user interaction
  const enableTTS = useCallback(() => {
    if (!ttsEnabled && 'speechSynthesis' in window) {
      try {
        // Test TTS with a silent utterance to enable it
        const testUtterance = new SpeechSynthesisUtterance('');
        testUtterance.volume = 0;
        speechSynthesis.speak(testUtterance);
        setTtsEnabled(true);
        console.log('🎤 TTS enabled after user interaction');
      } catch (error) {
        console.warn('🎤 Failed to enable TTS:', error);
      }
    }
  }, [ttsEnabled, setTtsEnabled]);

  // Add user interaction handler to enable audio playback
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
        // Enable TTS after user interaction
        enableTTS();
        // Try to play audio instructions if available and autoplay was blocked
        if (currentAssignment?.audioInstructions && audioPlayerRef.current) {
          // This will be handled by the AudioPlayer component
        }
      }
    };

    // Global click handler to stop sounds if assignment is completed or user clicks randomly
    const handleGlobalClick = (event: MouseEvent) => {
      // Check if assignment is completed (celebration is showing)
      if (showCelebration) {
        console.log('🔇 Assignment completed - stopping all sounds on click');
        stopAllSounds();
        stopSpeaking();
        return;
      }

      // Check if current question is completed and user is clicking outside of navigation buttons
      const target = event.target as HTMLElement;
      const isNavigationButton = target.closest('button[data-navigation]') ||
                                 target.closest('.navigation-button') ||
                                 target.closest('[data-testid="next-button"]') ||
                                 target.closest('[data-testid="finish-button"]');

      if (isCurrentQuestionCompleted() && !isNavigationButton) {
        console.log('🔇 Question completed - stopping sounds on non-navigation click');
        stopAllSounds();
        stopSpeaking();
        return;
      }

      // If user is clicking randomly during active exercise, stop sounds to avoid distractions
      const isExerciseElement = target.closest('.exercise-container') ||
                               target.closest('[data-exercise]') ||
                               target.closest('.question-container');

      if (!isExerciseElement) {
        console.log('🔇 Click outside exercise area - stopping sounds');
        stopAllSounds();
        stopSpeaking();
      }
    };

    // Add event listeners for user interaction and global click handling
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [hasUserInteracted, currentAssignment?.audioInstructions, showCelebration, responses, currentQuestionIndex]);

  // Add beforeunload warning when submission is in progress
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isProcessingSubmission || isSubmitting || showSubmissionTracker) {
        const message = "I am submitting your result now. Please wait and don't close the page!";
        event.preventDefault();
        event.returnValue = message; // For older browsers
        return message;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Stop TTS when tab loses focus
        if (speechSynthesis.speaking) {
          console.log('🎤 Tab hidden - stopping TTS');
          speechSynthesis.cancel();
          setIsTTSActive(false);
        }

        // Show a toast notification when user switches tabs during submission
        if (isProcessingSubmission || isSubmitting || showSubmissionTracker) {
          toast("Please don't switch tabs! I am submitting your result now.", {
            duration: 5000,
            icon: '⚠️'
          });
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isProcessingSubmission, isSubmitting, showSubmissionTracker]);

  // Effect to ensure voices are loaded for TTS
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Load voices if not already loaded
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
          console.log('🎤 Available TTS voices:', voices.map(v => `${v.name} (${v.lang})`));
        }
      };

      // Load voices immediately if available
      loadVoices();

      // Also listen for the voiceschanged event (some browsers load voices asynchronously)
      speechSynthesis.addEventListener('voiceschanged', loadVoices);

      return () => {
        speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, []);

  // Reset greeting flag when assignment changes
  useEffect(() => {
    if (currentAssignment?.id) {
      setHasPlayedGreeting(false);
      ttsScheduledRef.current = false;
      currentQuestionTTSRef.current = null;
      completedTTSQuestionsRef.current.clear();
      if (ttsTimeoutRef.current) {
        clearTimeout(ttsTimeoutRef.current);
        ttsTimeoutRef.current = null;
      }
      console.log('🎤 Reset greeting and TTS flags for new assignment:', currentAssignment.id);
    }
  }, [currentAssignment?.id]);

  // Helper function to get time-based salutation
  const getTimeBasedSalutation = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning';
    } else if (hour < 17) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  }, []);

  // Helper function to get user's name with fallback
  const getUserName = useCallback(() => {
    const name = anonymousUser?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0];
    return name || 'there';
  }, [anonymousUser, user]);

  // Helper function to configure female voice preference
  const configureFemaleVoice = useCallback(() => {
    if (!('speechSynthesis' in window)) return null;

    const voices = speechSynthesis.getVoices();

    // Look for female voices in order of preference (more comprehensive patterns)
    const femaleVoicePatterns = [
      /female/i,
      /woman/i,
      /girl/i,
      /samantha/i,
      /susan/i,
      /victoria/i,
      /karen/i,
      /moira/i,
      /tessa/i,
      /veena/i,
      /fiona/i,
      /zira/i,
      /hazel/i,
      /serena/i,
      /allison/i,
      /ava/i,
      /nicky/i,
      /paulina/i,
      /amelie/i,
      /anna/i,
      /carmit/i,
      /damayanti/i,
      /ellen/i,
      /ioana/i,
      /joana/i,
      /kanya/i,
      /kyoko/i,
      /laura/i,
      /lekha/i,
      /mariska/i,
      /mei-jia/i,
      /melina/i,
      /milena/i,
      /nora/i,
      /paulina/i,
      /rishi/i,
      /sara/i,
      /satu/i,
      /sin-ji/i,
      /tessa/i,
      /yuna/i,
      /zosia/i
    ];

    // Explicitly exclude known male voices
    const maleVoicePatterns = [
      /male/i,
      /man/i,
      /boy/i,
      /alex/i,
      /daniel/i,
      /tom/i,
      /david/i,
      /mark/i,
      /james/i,
      /jorge/i,
      /diego/i,
      /carlos/i,
      /felipe/i,
      /ivan/i,
      /yuki/i,
      /otoya/i,
      /stefanos/i,
      /cosimo/i,
      /luca/i,
      /reed/i,
      /nathan/i
    ];

    // First, try to find explicitly female voices
    for (const pattern of femaleVoicePatterns) {
      const femaleVoice = voices.find(voice => pattern.test(voice.name));
      if (femaleVoice) {
        console.log('🎤 Found female voice:', femaleVoice.name);
        return femaleVoice;
      }
    }

    // Fallback: look for any voice that doesn't match male patterns
    const nonMaleVoice = voices.find(voice =>
      !maleVoicePatterns.some(pattern => pattern.test(voice.name))
    );

    if (nonMaleVoice) {
      console.log('🎤 Using non-male voice:', nonMaleVoice.name);
      return nonMaleVoice;
    }

    console.log('🎤 No female voice found, using default voice');
    return voices[0] || null;
  }, []);

  // Enhanced speak function with female voice preference and interruption handling
  const speakWithFemaleVoice = useCallback((text: string, options: {
    rate?: number;
    pitch?: number;
    volume?: number;
    lang?: string;
  } = {}) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Text-to-speech not supported in this browser');
      return Promise.resolve();
    }

    // Check if TTS has been enabled by user interaction
    if (!ttsEnabled) {
      console.log('🎤 TTS not enabled yet - user interaction required');
      return Promise.resolve();
    }

    // Check if sound is enabled
    const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    if (!soundEnabled) {
      console.log('🎤 TTS disabled by user settings');
      return Promise.resolve();
    }

    // Check if tab is visible - don't play TTS when tab is not in focus
    if (document.visibilityState === 'hidden') {
      console.log('🎤 Tab not visible - skipping TTS');
      return Promise.resolve();
    }

    // Check if celebration overlay is visible - don't start TTS during celebration
    const celebrationOverlay = document.querySelector('[data-celebration-overlay="true"]');
    if (celebrationOverlay) {
      console.log('🎤 Celebration overlay visible - skipping TTS');
      return Promise.resolve();
    }

    // Prevent multiple simultaneous TTS calls
    if (isTTSActive) {
      console.log('🎤 TTS already active - skipping new request');
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      setIsTTSActive(true);

      // Stop any ongoing speech with a longer delay to prevent interruption
      if (speechSynthesis.speaking) {
        console.log('🎤 Stopping existing speech before starting new one');
        speechSynthesis.cancel();
        // Wait longer for the cancellation to complete
        setTimeout(() => {
          startSpeech();
        }, 500); // Increased delay for better reliability
      } else {
        // Even when no speech is active, add a small delay to ensure stability
        setTimeout(() => {
          startSpeech();
        }, 100);
      }

      function startSpeech() {
        const utterance = new SpeechSynthesisUtterance(text);

        // Configure voice preferences
        const femaleVoice = configureFemaleVoice();
        if (femaleVoice) {
          utterance.voice = femaleVoice;
          console.log('🎤 Using voice:', femaleVoice.name);
        } else {
          console.log('🎤 Using default voice');
        }

        // Configure speech parameters
        utterance.volume = Math.min(1, Math.max(0, options.volume || 0.8));
        utterance.rate = options.rate || 0.85; // Slightly slower for better comprehension
        utterance.pitch = options.pitch || 1.1; // Slightly higher pitch for friendliness
        utterance.lang = options.lang || 'en-US';

        // Add event listeners
        utterance.onstart = () => {
          console.log('🎤 TTS started:', text.substring(0, 50) + '...');
        };

        utterance.onend = () => {
          console.log('🎤 TTS completed successfully');
          setIsTTSActive(false);
          resolve();
        };

        utterance.onerror = (event) => {
          console.error('🎤 TTS error:', event.error);
          setIsTTSActive(false);
          if (event.error === 'interrupted') {
            console.log('🎤 TTS was interrupted - this is normal if user navigated or another sound started');
            resolve(); // Don't treat interruption as an error
          } else {
            reject(new Error(`TTS error: ${event.error}`));
          }
        };

        utterance.onpause = () => {
          console.log('🎤 TTS paused');
        };

        utterance.onresume = () => {
          console.log('🎤 TTS resumed');
        };

        // Speak the utterance
        try {
          speechSynthesis.speak(utterance);
        } catch (error) {
          console.error('🎤 Error starting TTS:', error);
          setIsTTSActive(false);
          reject(error);
        }
      }
    });
  }, [configureFemaleVoice, ttsEnabled]);



  // Generate personalized greeting
  const generatePersonalizedGreeting = useCallback(() => {
    const userName = getUserName();
    const salutation = getTimeBasedSalutation();

    const greeting = `Hi ${userName}, ${salutation}! I hope you are enjoying your summer holiday. Let's begin this test.`;

    console.log('🎤 Generated personalized greeting:', greeting);
    return greeting;
  }, [getUserName, getTimeBasedSalutation]);

  // Handle response update - memoized to prevent unnecessary re-renders
  const handleResponseUpdate = useCallback((questionId: string, responseData: any, isCorrect: boolean) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        id: '',
        submissionId: submissionId || '',
        questionId,
        responseData,
        isCorrect
      }
    }));
  }, [submissionId]);



  // Handle question completion - memoized to prevent unnecessary re-renders
  const handleQuestionComplete = useCallback((isCorrect: boolean, score?: number) => {
    if (!currentAssignment || !currentAssignment.questions) return;

    const currentQuestion = currentAssignment.questions[currentQuestionIndex];

    // Create response data with the actual user interaction
    const responseData = {
      answered: true,
      timestamp: new Date().toISOString(),
      score: score || (isCorrect ? 100 : 0)
    };

    // Update response
    handleResponseUpdate(currentQuestion.id, responseData, isCorrect);

    // No auto-advance - users must manually click Next button
    // This gives users time to review their answer and feedback
  }, [currentAssignment, currentQuestionIndex, handleResponseUpdate]);

  // Manual submit handler for the "Finish" button
  const handleManualSubmit = () => {
    // Prevent duplicate submissions
    if (isSubmittingRef.current || isSubmitting) {
      console.log('⚠️ Submission already in progress, ignoring duplicate request');
      return;
    }

    console.log('🎯 Finish button clicked - starting submission process');

    // Stop all sounds immediately when finish is clicked
    stopAllSounds();
    stopSpeaking(); // Also stop any text-to-speech

    // Set loading state with enhanced feedback
    setIsSubmitting(true);
    // Don't set isSubmittingRef.current here - let the effect handle it

    // Show enhanced submission tracker
    setShowSubmissionTracker(true);
    setCurrentSubmissionStep('prepare');
    setSubmissionSteps(prev => prev.map(step =>
      step.id === 'prepare' ? { ...step, status: 'active' } : step
    ));

    // Show progress overlay for submission with more detailed steps
    showProgress('Preparing submission...');
    updateProgress(5, 'Stopping audio and preparing data...');

    // Scroll to top of page for better UX
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      updateProgress(15, 'Organizing your responses...');
    }, 100);

    // Update progress without playing completion sound
    setTimeout(() => {
      updateProgress(25, 'Validating your answers...');
    }, 200);

    // Just set isSubmitted to true, and the effect will handle the actual submission
    setTimeout(() => {
      console.log('🚀 Setting isSubmitted to true to trigger submission effect');
      setIsSubmitted(true);
    }, 500);
  };

  // Enhanced text-to-speech for questions with personalized greeting
  const speakQuestion = useCallback(async (question: InteractiveQuestion, isFirstQuestion: boolean = false) => {
    if (!question) return;

    // Prevent duplicate calls for the same question
    if (isTTSActive) {
      console.log('🎤 TTS already active - skipping duplicate speakQuestion call');
      return;
    }

    // Check if tab is visible - don't start TTS when tab is not in focus
    if (document.visibilityState === 'hidden') {
      console.log('🎤 Tab not visible - skipping TTS in speakQuestion');
      return;
    }

    // Ensure any existing speech is stopped first
    if (speechSynthesis.speaking) {
      console.log('🎤 Cancelling existing speech in speakQuestion');
      speechSynthesis.cancel();
      // Wait for cancellation to complete
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    let textToSpeak = '';

    // Add personalized greeting for the first question only
    if (isFirstQuestion && !hasPlayedGreeting) {
      const greeting = generatePersonalizedGreeting();
      textToSpeak += greeting;

      // Add a natural pause between greeting and question
      if (question.questionText) {
        textToSpeak += ' Now, let me ask you the first question. ';
      }

      setHasPlayedGreeting(true);
      console.log('🎤 Including personalized greeting with first question');
      console.log('🎤 Full text to speak:', textToSpeak.substring(0, 100) + '...');
    } else if (isFirstQuestion && hasPlayedGreeting) {
      console.log('🎤 First question but greeting already played');
    }

    // Add question text if available
    if (question.questionText) {
      textToSpeak += cleanTextForTTS(question.questionText) + '. ';
    }

    // Add instructions based on question type
    switch (question.questionType) {
      case 'MULTIPLE_CHOICE':
        textToSpeak += 'Please select the correct answer from the options provided.';
        break;
      case 'MATCHING':
        textToSpeak += 'Please match the items by connecting the related pairs.';
        break;
      case 'COMPLETION':
        textToSpeak += 'Please fill in the blanks with the correct answers.';
        break;
      default:
        textToSpeak += 'Please answer the question.';
    }

    if (textToSpeak.trim()) {
      try {
        console.log('🎤 Starting TTS with text length:', textToSpeak.length);

        // Use enhanced female voice for the greeting and question as one continuous speech
        await speakWithFemaleVoice(textToSpeak, {
          rate: isFirstQuestion ? 0.8 : 0.85, // Slightly slower for greeting
          volume: 0.8,
          pitch: 1.1
        });

        console.log('🎤 TTS completed successfully for', isFirstQuestion ? 'first question with greeting' : 'question');
      } catch (error) {
        // Handle TTS errors gracefully
        const errorMessage = error instanceof Error ? error.message : 'Unknown TTS error';
        console.log('🎤 TTS failed, but continuing with assignment:', errorMessage);
      }
    }
  }, [hasPlayedGreeting, generatePersonalizedGreeting, speakWithFemaleVoice]);

  // TTS scheduling function that doesn't cause re-renders - made more stable
  const scheduleTTSForQuestion = useCallback((questionId: string, questionIndex: number) => {
    console.log(`🎤 scheduleTTSForQuestion called for question ${questionIndex} (${questionId})`);

    // Check if TTS has already been completed for this question
    if (completedTTSQuestionsRef.current.has(questionId)) {
      console.log('🎤 TTS already completed for this question - skipping');
      return;
    }

    // Clear any existing timeout
    if (ttsTimeoutRef.current) {
      clearTimeout(ttsTimeoutRef.current);
      ttsTimeoutRef.current = null;
    }

    // Check if we've already scheduled TTS for this question
    if (currentQuestionTTSRef.current === questionId || ttsScheduledRef.current) {
      console.log('🎤 TTS already scheduled for this question - skipping duplicate');
      return;
    }

    const currentQuestion = currentAssignment?.questions?.[questionIndex];
    if (!currentQuestion) {
      console.log('🎤 No current question found');
      return;
    }

    console.log('🎤 TTS Conditions check:', {
      hasAudioInstructions: !!currentQuestion.audioInstructions,
      isTTSAvailable: isTTSAvailable(),
      isTTSActive,
      ttsEnabled,
      tabVisible: document.visibilityState === 'visible'
    });

    // Check all conditions
    if (
      !currentQuestion.audioInstructions &&
      isTTSAvailable() &&
      !isTTSActive &&
      ttsEnabled &&
      document.visibilityState === 'visible'
    ) {
      // Mark as scheduled
      ttsScheduledRef.current = true;
      currentQuestionTTSRef.current = questionId;

      const isFirstQuestion = questionIndex === 0;
      const delay = isFirstQuestion ? 4000 : 2000;

      console.log(`🎤 Scheduling TTS for ${isFirstQuestion ? 'first question with greeting' : 'question'} in ${delay}ms`);

      ttsTimeoutRef.current = setTimeout(async () => {
        // Double-check conditions before starting TTS
        if (!isTTSActive && ttsEnabled && ttsScheduledRef.current && currentQuestionTTSRef.current === questionId && document.visibilityState === 'visible') {
          try {
            console.log('🎤 Starting scheduled TTS...');
            await speakQuestion(currentQuestion, isFirstQuestion);
            console.log('🎤 Scheduled TTS completed successfully');
            // Mark this question as completed
            completedTTSQuestionsRef.current.add(questionId);
          } catch (error) {
            console.log('🎤 TTS effect error handled:', error);
          } finally {
            // Reset scheduled flags after completion or error
            ttsScheduledRef.current = false;
            currentQuestionTTSRef.current = null;
            ttsTimeoutRef.current = null;
          }
        } else {
          console.log('🎤 TTS conditions changed before timer fired - resetting schedule');
          console.log('🎤 Conditions at timer fire:', {
            isTTSActive,
            ttsEnabled,
            ttsScheduled: ttsScheduledRef.current,
            currentQuestionTTS: currentQuestionTTSRef.current,
            expectedQuestionId: questionId,
            tabVisible: document.visibilityState === 'visible'
          });
          ttsScheduledRef.current = false;
          currentQuestionTTSRef.current = null;
          ttsTimeoutRef.current = null;
        }
      }, delay);
    } else if (currentQuestion && !currentQuestion.audioInstructions && !ttsEnabled) {
      console.log('🎤 TTS not enabled yet - waiting for user interaction');
    } else {
      console.log('🎤 TTS conditions not met - not scheduling');
    }
  }, [currentAssignment?.questions, isTTSActive, ttsEnabled]);

  // Create a stable ref for the scheduling function
  const scheduleTTSRef = useRef(scheduleTTSForQuestion);
  scheduleTTSRef.current = scheduleTTSForQuestion;

  // Effect to trigger TTS when question changes - simplified and stable
  useEffect(() => {
    const currentQuestion = currentAssignment?.questions?.[currentQuestionIndex];
    if (currentQuestion) {
      // Use a small delay to ensure the component has fully rendered
      const scheduleTimer = setTimeout(() => {
        scheduleTTSRef.current(currentQuestion.id, currentQuestionIndex);
      }, 100);

      return () => {
        clearTimeout(scheduleTimer);
      };
    }
  }, [currentQuestionIndex, currentAssignment?.questions]);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      if (ttsTimeoutRef.current) {
        clearTimeout(ttsTimeoutRef.current);
        ttsTimeoutRef.current = null;
      }
      ttsScheduledRef.current = false;
      currentQuestionTTSRef.current = null;
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        setIsTTSActive(false);
      }
      stopSpeaking();
    };
  }, []);

  // Render current question - memoized to prevent unnecessary re-renders
  const renderQuestion = useCallback((question: InteractiveQuestion) => {
    // No debug logs to reduce noise and prevent unnecessary renders

    // Check if questionData exists
    if (!question.questionData) {
      return (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 p-6 rounded-xl my-6">
          <h3 className="text-xl font-bold mb-4">Invalid Question Data</h3>
          <p>This question appears to be missing its data. Please contact support if this issue persists.</p>
          <div className="mt-4 p-4 bg-white bg-opacity-50 rounded-lg">
            <h4 className="font-semibold mb-2">Question Details:</h4>
            <pre className="text-xs overflow-auto max-h-40">
              {JSON.stringify(question, null, 2)}
            </pre>
          </div>
        </div>
      );
    }

    switch (question.questionType) {
      case 'MATCHING':
        // Check if pairs exists and is an array
        if (!question.questionData.pairs || !Array.isArray(question.questionData.pairs) || question.questionData.pairs.length === 0) {
          return (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 p-6 rounded-xl my-6">
              <h3 className="text-xl font-bold mb-4">Invalid Matching Question</h3>
              <p>This matching question is missing its pairs data. Please contact support if this issue persists.</p>
            </div>
          );
        }

        return (
          <EnhancedMatchingExercise
            data={{
              sourceItems: question.questionData.pairs.map((pair: any) => ({
                id: pair.id + '-left',
                content: pair.left || 'Missing content',
                imageUrl: pair.leftType === 'image' ? pair.left : undefined
              })),
              targetItems: question.questionData.pairs.map((pair: any) => ({
                id: pair.id + '-right',
                content: pair.right || 'Missing content',
                imageUrl: pair.rightType === 'image' ? pair.right : undefined
              })),
              correctPairs: question.questionData.pairs.map((pair: any) => ({
                sourceId: pair.id + '-left',
                targetId: pair.id + '-right'
              }))
            }}
            onComplete={(isCorrect, score) => {
              handleQuestionComplete(isCorrect, score);
            }}
            audioInstructions={question.audioInstructions}
          />
        );

      case 'MULTIPLE_CHOICE':
        // Check if options exists and is an array
        if (!question.questionData.options || !Array.isArray(question.questionData.options) || question.questionData.options.length === 0) {
          return (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 p-6 rounded-xl my-6">
              <h3 className="text-xl font-bold mb-4">Invalid Multiple Choice Question</h3>
              <p>This multiple choice question is missing its options data. Please contact support if this issue persists.</p>
            </div>
          );
        }

        return (
          <MultipleChoiceExercise
            data={{
              question: question.questionText,
              options: question.questionData.options,
              allowMultiple: question.questionData.allowMultiple || false
            }}
            onComplete={(isCorrect, score) => {
              handleQuestionComplete(isCorrect, score);
            }}
          />
        );

      case 'COMPLETION':
        // Check if text and blanks exist
        if (!question.questionData.text || !question.questionData.blanks || !Array.isArray(question.questionData.blanks)) {
          return (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 p-6 rounded-xl my-6">
              <h3 className="text-xl font-bold mb-4">Invalid Completion Question</h3>
              <p>This completion question is missing its text or blanks data. Please contact support if this issue persists.</p>
            </div>
          );
        }

        return (
          <CompletionExercise
            data={{
              text: question.questionData.text,
              blanks: question.questionData.blanks
            }}
            onComplete={(isCorrect, score) => {
              handleQuestionComplete(isCorrect, score);
            }}
          />
        );

      case 'ORDERING':
        // Check if items exists and is an array
        if (!question.questionData.items || !Array.isArray(question.questionData.items) || question.questionData.items.length === 0) {
          return (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 p-6 rounded-xl my-6">
              <h3 className="text-xl font-bold mb-4">Invalid Ordering Question</h3>
              <p>This ordering question is missing its items data. Please contact support if this issue persists.</p>
            </div>
          );
        }

        return (
          <OrderingExercise
            data={{
              instructions: question.questionText,
              items: question.questionData.items
            }}
            onComplete={(isCorrect, score) => {
              handleQuestionComplete(isCorrect, score);
            }}
          />
        );

      default:
        return (
          <div className="bg-white rounded-xl shadow-lg p-6 my-6">
            <h3 className="text-xl font-bold mb-4">Unsupported Question Type</h3>
            <p>This question type ({question.questionType || 'unknown'}) is not supported in the current version.</p>
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h4 className="font-semibold mb-2">Question Details:</h4>
              <pre className="text-xs overflow-auto max-h-40">
                {JSON.stringify(question, null, 2)}
              </pre>
            </div>
          </div>
        );
    }
  }, [handleQuestionComplete]); // Add handleQuestionComplete as a dependency

  // Loading state
  if (loading || isSupabaseLoading || checkingPayment) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        {isSupabaseLoading && (
          <p className="text-gray-600 text-center">
            Initializing database connection...
            <br />
            <span className="text-sm">This may take a moment</span>
          </p>
        )}
        {!isSupabaseLoading && loading && (
          <p className="text-gray-600">Loading assignment...</p>
        )}
        {checkingPayment && (
          <p className="text-gray-600">Checking payment status...</p>
        )}
      </div>
    );
  }

  // Payment required but not paid - must be after all hooks
  const renderPaymentRequired = () => {
    if (requiresPayment && !hasPaid && currentAssignment) {
      return (
        <div className="container mx-auto py-8 px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold mb-2">{currentAssignment.title}</h1>
            <p className="text-gray-600 mb-4">{currentAssignment.description}</p>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-yellow-800">Premium Assignment</h3>
                  <div className="mt-2 text-yellow-700">
                    <p>This assignment requires payment of {paymentAmount || 0.5} SOL to access.</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => navigate(`/payment-demo?assignmentId=${currentAssignment.id}&amount=${paymentAmount || 0.5}`)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      Make Payment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  // Error state - converted to render function
  const renderError = () => {
    if (!error) return null;

    // Check if it's a database initialization error
    const isDatabaseInitError = error.includes('Database connection is initializing');
    const isConnectionError = error.includes('connection') || error.includes('network') || error.includes('failed to fetch');

    // Determine the appropriate styling and messaging based on error type
    const bgColor = isDatabaseInitError ? 'bg-yellow-100' : isConnectionError ? 'bg-orange-100' : 'bg-red-100';
    const borderColor = isDatabaseInitError ? 'border-yellow-400' : isConnectionError ? 'border-orange-400' : 'border-red-400';
    const textColor = isDatabaseInitError ? 'text-yellow-700' : isConnectionError ? 'text-orange-700' : 'text-red-700';
    const title = isDatabaseInitError ? 'Database Initializing' : isConnectionError ? 'Connection Issue' : 'Error';

    // Check if Supabase is ready now (might have become ready after the error was set)
    const isSupabaseReadyNow = window._supabaseReady === true;

    return (
      <div className={`${bgColor} ${borderColor} ${textColor} border px-4 py-3 rounded-xl my-6`}>
        <h3 className="font-bold text-lg">{title}</h3>
        <p>{error}</p>

        {isDatabaseInitError && (
          <div className="mt-2 text-sm">
            <p>The database is still initializing. This usually takes a few seconds.</p>
            {isSupabaseReadyNow && (
              <p className="mt-1 font-semibold">Database appears to be ready now. You can try again.</p>
            )}
          </div>
        )}

        {isConnectionError && (
          <p className="mt-2 text-sm">
            There seems to be an issue connecting to our database. This could be due to network issues or server load.
          </p>
        )}

        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={() => {
              setRetryCount(0);
              fetchAssignment();
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
          >
            Try Again
          </button>

          <button
            onClick={() => {
              window.location.reload();
            }}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
          >
            Refresh Page
          </button>

          {retryCount > 2 && (
            <div className="w-full mt-2 p-2 bg-white bg-opacity-50 rounded-lg text-sm">
              <p className="font-semibold">Still having issues?</p>
              <p>If refreshing doesn't work, try:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Checking your internet connection</li>
                <li>Clearing your browser cache</li>
                <li>Trying again in a few minutes</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // No assignment found - converted to render function
  const renderNoAssignment = () => {
    if (!currentAssignment) {
      return (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-xl my-6">
          <h3 className="font-bold text-lg">Assignment Not Found</h3>
          <p>The requested assignment could not be found or has been removed.</p>
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={() => {
                setRetryCount(0);
                fetchAssignment();
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
            >
              Try Again
            </button>

            <button
              onClick={() => {
                window.location.reload();
              }}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return null;
  }



  // Get current question - memoized to prevent unnecessary re-renders
  const currentQuestion = currentAssignment?.questions?.[currentQuestionIndex];

  // Check if current question is completed (submitted)
  const isCurrentQuestionCompleted = () => {
    if (!currentQuestion) return false;

    const response = responses[currentQuestion.id];
    // Check if response exists and has been answered/submitted
    return response && response.responseData && response.responseData.answered === true;
  };

  // Check for loading state first
  if (loading || !audioInstructionsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">
            {!currentAssignment ? 'Loading assignment...' : 'Loading audio instructions...'}
          </p>

        </div>
      </div>
    );
  }

  // Check for error, payment requirement, or missing assignment
  const errorContent = renderError();
  const paymentRequiredContent = renderPaymentRequired();
  const noAssignmentContent = renderNoAssignment();

  if (errorContent) return errorContent;
  if (paymentRequiredContent) return paymentRequiredContent;
  if (noAssignmentContent) return noAssignmentContent;

  return (
    <div
      className={`${isMobile ? 'mobile-assignment-container' : 'container mx-auto py-8 px-4'}`}
      onClick={() => {
        // Initialize sound system on first user interaction
        initializeSoundSystem();
      }}
    >
      {/* Mobile Progress Indicator - Fixed at top */}
      {isMobile && currentAssignment?.questions && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              {currentAssignment?.title}
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Question {currentQuestionIndex + 1} of {currentAssignment?.questions.length}
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / currentAssignment?.questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Assignment Header - Responsive */}
      <div className={`${
        isMobile
          ? 'mobile-question-card p-4 mx-4 mt-20'
          : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl shadow-xl p-4 md:p-6 mb-6 border border-indigo-100'
      }`}>
        {/* User Info Banner for Anonymous Users - Enhanced */}
        {anonymousUser && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-emerald-800 mb-1">
                  Welcome, {anonymousUser.name}! 👋
                </h3>
                <p className="text-sm text-emerald-700 leading-relaxed">
                  You're taking this quiz as a guest. Your results will be saved and can be viewed by the instructor.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Header with Mobile-First Design */}
        <div className="text-center md:text-left mb-6">
          <h1 className="text-2xl md:text-4xl font-bold mb-3 leading-tight">
            {assignmentOrganization?.name ? (
              <div className="space-y-2">
                <div className="text-indigo-600 text-lg md:text-2xl font-semibold">
                  {assignmentOrganization.name}
                </div>
                <div className="text-gray-800 text-xl md:text-3xl">
                  {currentAssignment?.title}
                </div>
              </div>
            ) : (
              <span className="text-gray-800">{currentAssignment?.title}</span>
            )}
          </h1>

          {currentAssignment?.description && (
            <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-3xl mx-auto md:mx-0">
              {currentAssignment.description}
            </p>
          )}
        </div>

        {/* Enhanced Quiz Information - Mobile Optimized */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 md:p-5 mb-6 border border-gray-200">
          <h3 className="text-lg md:text-xl font-bold mb-4 text-gray-800 text-center md:text-left">
            📋 Quiz Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Questions Count */}
            <div className="flex items-center justify-center md:justify-start space-x-3 p-3 bg-white rounded-lg shadow-sm">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-800">
                  {currentAssignment?.questions?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
            </div>

            {/* Estimated Time */}
            {currentAssignment?.estimatedTimeMinutes && (
              <div className="flex items-center justify-center md:justify-start space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-800">
                    {currentAssignment.estimatedTimeMinutes}
                  </div>
                  <div className="text-sm text-gray-600">Minutes</div>
                </div>
              </div>
            )}

            {/* Difficulty Level */}
            {currentAssignment?.difficultyLevel && (
              <div className="flex items-center justify-center md:justify-start space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-800">
                    {currentAssignment.difficultyLevel}
                  </div>
                  <div className="text-sm text-gray-600">Level</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Always render audio player, let it handle empty/loading states */}
        <div className="mb-4">


          <SimpleAudioPlayer
            ref={audioPlayerRef}
            audioUrl={audioInstructions || ''}
            autoPlay={true}
            label="Audio Instructions"
            className="w-full"
            onAutoPlayBlocked={() => {
              // Callback handled by SimpleAudioPlayer component internally
            }}
          />
        </div>


        <div className="flex flex-wrap gap-4 text-sm">
          {currentAssignment?.difficultyLevel && (
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {currentAssignment?.difficultyLevel}
            </span>
          )}

          {currentAssignment?.estimatedTimeMinutes && (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
              {currentAssignment?.estimatedTimeMinutes} minutes
            </span>
          )}

          {currentAssignment?.ageGroup && (
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
              {currentAssignment?.ageGroup}
            </span>
          )}
        </div>

        {/* Direct Link - Desktop only */}
        {!isMobile && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-sm text-gray-500">
            <span className="mr-2">Direct link:</span>
            <div className="flex-1 overflow-hidden">
              <input
                type="text"
                value={`${window.location.origin}/play/assignment/${assignmentId}`}
                readOnly
                className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-1 text-gray-700 text-sm"
                onClick={(e) => {
                  (e.target as HTMLInputElement).select();
                  navigator.clipboard.writeText((e.target as HTMLInputElement).value);
                  toast.success('Link copied to clipboard!');
                }}
              />
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/play/assignment/${assignmentId}`);
                toast.success('Link copied to clipboard!');
              }}
              className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-700 p-1 rounded"
              title="Copy link"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Progress Display - Desktop only (mobile uses fixed top indicator) */}
      {!isMobile && currentAssignment?.questions && (
        <ProgressDisplay
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={currentAssignment?.questions.length || 0}
          score={score || 0}
          timeSpent={timeSpent}
        />
      )}

      {/* Mobile Question Navigation - Simplified */}
      {isMobile && currentAssignment?.questions && (
        <div className="mx-4 mb-4 mt-20">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-center space-x-2 flex-wrap">
              {currentAssignment.questions.slice(0, 8).map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (index !== currentQuestionIndex && !isSubmitted) {
                      setCurrentQuestionIndex(index);
                      playSound('click');
                      setTimeout(() => scrollToQuestion(), 100);
                    }
                  }}
                  disabled={isSubmitted}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-300 ${
                    index === currentQuestionIndex
                      ? 'bg-indigo-500 text-white'
                      : responses[currentAssignment?.questions?.[index]?.id || '']?.isCorrect
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } ${isSubmitted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {index + 1}
                </button>
              ))}
              {currentAssignment.questions.length > 8 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
                  +{currentAssignment.questions.length - 8}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TTS Enablement Notice */}
      {!ttsEnabled && currentQuestionIndex === 0 && !audioInstructions && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-center"
        >
          <div className="flex items-center justify-center space-x-2 text-blue-700">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.846l3.537-2.816a1 1 0 011.617.816zM16 10a3 3 0 01-3 3v2a5 5 0 005-5 5 5 0 00-5-5v2a3 3 0 013 3z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Click anywhere to enable voice instructions</span>
          </div>
        </motion.div>
      )}

      {/* Current Question */}
      {currentQuestion ? (
        <div className={`${isMobile ? 'mx-4 mb-20' : ''}`}>
          <div className={`${
            isMobile
              ? 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700'
              : ''
          } question-container`}>
            <motion.div
              key={currentQuestion.id || 'unknown-question'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              data-testid="question-container"
              data-question-index={currentQuestionIndex}
              id="current-question"
            >
              {renderQuestion(currentQuestion)}
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 p-6 rounded-xl my-6">
          <h3 className="text-xl font-bold mb-4">No Question Available</h3>
          <p>There are no questions available for this assignment or the current question could not be loaded.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
          >
            Refresh Page
          </button>
        </div>
      )}

      {/* Navigation Buttons - Desktop only */}
      {!isMobile && (
        <div className="flex justify-between mt-6">
          <button
            data-navigation="true"
            data-testid="previous-button"
            onClick={() => {
              if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(prev => prev - 1);
                playSound('click');

                // Scroll to question container for better UX
                setTimeout(() => scrollToQuestion(), 100);
              }
            }}
            disabled={currentQuestionIndex === 0 || isSubmitted}
            className={`py-3 px-6 rounded-xl font-medium transition-colors ${
              currentQuestionIndex === 0 || isSubmitted
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Previous
          </button>

          <button
            data-navigation="true"
            data-testid={currentAssignment?.questions && currentQuestionIndex < (currentAssignment?.questions?.length || 0) - 1 ? "next-button" : "finish-button"}
            onClick={() => {
              // Check if current question is completed before allowing navigation
              if (!isCurrentQuestionCompleted()) {
                toast.error('Please submit your answer before proceeding.', {
                  duration: 3000,
                  icon: '⚠️'
                });
                return;
              }

              if (currentAssignment?.questions && currentQuestionIndex < (currentAssignment?.questions?.length || 0) - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                playSound('click');

                // Scroll to question container for better UX
                setTimeout(() => scrollToQuestion(), 100);
              } else {
                console.log('🎯 Finish button clicked - calling handleManualSubmit');
                handleManualSubmit();
              }
            }}
            disabled={isSubmitted || isSubmitting}
            className={`py-3 px-6 rounded-xl font-medium transition-colors flex items-center space-x-2 ${
              isSubmitted || isSubmitting
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : !isCurrentQuestionCompleted()
                ? 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {/* Enhanced loader with better animation when submitting */}
            {isSubmitting && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <span className={isSubmitting ? 'ml-2' : ''}>
              {currentAssignment?.questions && currentQuestionIndex < (currentAssignment?.questions?.length || 0) - 1
                ? 'Next'
                : isSubmitting
                ? 'Processing...'
                : 'Finish'
              }
            </span>
          </button>
        </div>
      )}

      {/* Mobile Bottom Navigation - Simplified */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900 backdrop-filter backdrop-blur-lg border-t border-gray-700 p-4">
          <div className="flex items-center justify-between space-x-4">
            {/* Previous Button */}
            <button
              onClick={() => {
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex(prev => prev - 1);
                  playSound('click');
                  setTimeout(() => scrollToQuestion(), 100);
                }
              }}
              disabled={currentQuestionIndex === 0 || isSubmitted}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                currentQuestionIndex === 0 || isSubmitted
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-500'
              }`}
            >
              ← Previous
            </button>

            {/* Speak Button */}
            <button
              onClick={() => {
                if (currentQuestion && isTTSAvailable()) {
                  playSound('click');
                  const isFirstQuestion = currentQuestionIndex === 0;
                  speakQuestion(currentQuestion, isFirstQuestion);
                }
              }}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white flex items-center justify-center"
              title="Speak Question"
            >
              🔊
            </button>

            {/* Audio Button */}
            {audioInstructions && (
              <button
                onClick={() => setShowAudioPlayer(true)}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center"
                title="Play Audio"
              >
                🎵
              </button>
            )}

            {/* Next/Finish Button */}
            <button
              onClick={() => {
                const isLastQuestion = currentQuestionIndex >= (currentAssignment?.questions?.length || 0) - 1;

                if (isLastQuestion) {
                  console.log('🎯 Finish button clicked - calling handleManualSubmit');
                  handleManualSubmit();
                } else {
                  if (!isCurrentQuestionCompleted()) {
                    toast.error('Please submit your answer before proceeding.', {
                      duration: 3000,
                      icon: '⚠️'
                    });
                    return;
                  }

                  if (currentAssignment?.questions && currentQuestionIndex < (currentAssignment?.questions?.length || 0) - 1) {
                    setCurrentQuestionIndex(prev => prev + 1);
                    playSound('click');
                    setTimeout(() => scrollToQuestion(), 100);
                  }
                }
              }}
              disabled={isSubmitted || isSubmitting}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                isSubmitted || isSubmitting
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                currentQuestionIndex >= (currentAssignment?.questions?.length || 0) - 1 ? 'Finish' : 'Next →'
              )}
            </button>
          </div>
        </div>
      )}

      {/* We'll handle anonymous user registration in the PlayAssignmentPage component instead */}

      {/* Celebration Overlay */}
      <CelebrationOverlay
        isVisible={showCelebration}
        score={score || 0}
        submissionId={submissionId || undefined}
        onClose={() => setShowCelebration(false)}
        assignmentTitle={currentAssignment?.title}
        totalQuestions={currentAssignment?.questions?.length}
        correctAnswers={Object.values(responses).filter(r => r.isCorrect).length}
        assignmentOrganizationId={currentAssignment?.organizationId}
      />

      {/* Desktop Floating Buttons */}
      {!isMobile && (
        <>
          {/* Text-to-Speech Button (only show if TTS is available and no audio instructions) */}
          {!audioInstructions && isTTSAvailable() && currentQuestion && (
            <button
              onClick={() => {
                playSound('click');
                const isFirstQuestion = currentQuestionIndex === 0;
                speakQuestion(currentQuestion, isFirstQuestion);
              }}
              className="fixed bottom-6 left-6 bg-green-500 hover:bg-green-600 text-white rounded-full p-3 shadow-lg z-50"
              aria-label="Read Question Aloud"
              title="Read Question Aloud"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </button>
          )}

          {/* Floating Audio Button (only show if there are audio instructions) */}
          {audioInstructions && (
            <button
              onClick={() => setShowAudioPlayer(true)}
              className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg z-50"
              aria-label="Play Audio Instructions"
              title="Play Audio Instructions"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.465a5 5 0 001.06-7.072l5.658-5.657a1 1 0 011.414 0l5.657 5.657a1 1 0 010 1.414l-5.657 5.657a1 1 0 01-1.414 0l-5.657-5.657a1 1 0 010-1.414z" />
              </svg>
            </button>
          )}

          {/* Certificate Floating Button for Anonymous Users */}
          <CertificateFloatingButton />
        </>
      )}

      {/* Audio Instructions Modal - Show for both mobile and desktop */}
      {audioInstructions && showAudioPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {commonTranslate('audio', 'Audio')}
              </h3>
              <button
                onClick={() => setShowAudioPlayer(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Only show the audio player controls */}
            <SimpleAudioPlayer
              audioUrl={currentAssignment?.audioInstructions || ''}
              autoPlay={true}
              showLabel={false}
              onAutoPlayBlocked={() => {
                // Callback handled by SimpleAudioPlayer component internally
              }}
            />
          </div>
        </div>
      )}

      {/* Progress Overlay for Submission Feedback */}
      <ProgressOverlay
        isVisible={progressVisible}
        progress={progress}
        status={progressStatus}
      />

      {/* User Progress Tracker */}
      {currentAssignment && currentAssignment.questions && (
        <UserProgressTracker
          assignment={currentAssignment}
          currentQuestionIndex={currentQuestionIndex}
          currentQuestion={currentAssignment.questions[currentQuestionIndex]}
          showMiniDashboard={true}
        />
      )}

      {/* Enhanced Submission Progress Tracker */}
      <SubmissionProgressTracker
        isVisible={showSubmissionTracker}
        currentStep={currentSubmissionStep}
        steps={submissionSteps}
        showPerformanceMetrics={true}
        onComplete={() => {
          console.log('Submission tracking completed');
        }}
        onError={(error) => {
          console.error('Submission tracking error:', error);
        }}
      />

      {/* Submission Diagnostic - Only show when debug=true in URL */}
      {window.location.search.includes('debug=true') && (
        <SubmissionDiagnostic />
      )}

    </div>
  );
};

export default PlayAssignment;
