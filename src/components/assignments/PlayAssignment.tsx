// src/components/assignments/PlayAssignment.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useDatabaseState } from '../../context/DatabaseStateContext';
import { createEnhancedInteractiveAssignmentService } from '../../lib/services/enhancedInteractiveAssignmentService';
import { getCachedItem, setCachedItem } from '../../lib/utils/cacheUtils';
import { checkAssignmentPaymentAccess } from '../pages/PaymentDemoPage';
import ProgressDisplay from './ProgressDisplay';
import { playSound, speakText, stopSpeaking, cleanTextForTTS, isTTSAvailable } from '../../utils/soundUtils';
import CelebrationOverlay from './CelebrationOverlay';
// Anonymous user registration moved to parent component
import EnhancedMatchingExercise from '../exercises/EnhancedMatchingExercise';
import MultipleChoiceExercise from '../exercises/MultipleChoiceExercise';
import CompletionExercise from '../exercises/CompletionExercise';
import OrderingExercise from '../exercises/OrderingExercise';
import SimpleAudioPlayer, { SimpleAudioPlayerRef } from '../common/SimpleAudioPlayer';
import { playSound as playSoundLib, initializeSoundSystem, startBackgroundMusic, stopBackgroundMusic, stopAllSounds } from '../../lib/utils/soundUtils';
import { scrollToQuestion } from '../../lib/utils/scrollUtils';
import toast from 'react-hot-toast';
import { InteractiveAssignment, InteractiveQuestion, InteractiveResponse } from '../../types/interactiveAssignment';
import CertificateFloatingButton from '../certificates/CertificateFloatingButton';

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

  const [currentAssignment, setCurrentAssignment] = useState<InteractiveAssignment | null>(assignment || null);

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
  // Registration is now handled by parent component
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | undefined>(undefined);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [assignmentOrganization, setAssignmentOrganization] = useState<any>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const audioPlayerRef = useRef<SimpleAudioPlayerRef>(null);

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
    const cachedAssignment = getCachedItem(cachedAssignmentKey);

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
      setCurrentAssignment(cachedAssignment as InteractiveAssignment);
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

  // Check if assignment requires payment
  useEffect(() => {
    // Added isSubmitted to prevent repeated calls after assignment is submitted
    if (!currentAssignment?.id || !user?.id || checkingPayment || isSubmitted) return;

    // Use a ref to track if we've already checked payment for this assignment/user combo
    const paymentCheckKey = `${currentAssignment.id}-${user.id}`;
    if (window._checkedPayments && window._checkedPayments[paymentCheckKey]) {
      return; // Don't check again if we've already checked for this combination
    }

    // Initialize the global tracker if it doesn't exist
    if (!window._checkedPayments) {
      window._checkedPayments = {};
    }

    const checkPayment = async () => {
      setCheckingPayment(true);
      try {
        const paymentStatus = await checkAssignmentPaymentAccess(currentAssignment.id, user.id);
        setRequiresPayment(paymentStatus.requiresPayment);
        setHasPaid(paymentStatus.hasPaid);
        setPaymentAmount(paymentStatus.paymentAmount);

        // Mark this combination as checked
        if (window._checkedPayments) {
          window._checkedPayments[paymentCheckKey] = true;
        }

        // If payment is required but not paid, redirect to payment page
        if (paymentStatus.requiresPayment && !paymentStatus.hasPaid) {
          toast.error('This assignment requires payment', { duration: 4000 });
          setTimeout(() => {
            navigate(`/payment-demo?assignmentId=${currentAssignment.id}&amount=${paymentStatus.paymentAmount || 0.5}`);
          }, 2000);
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
    const submitAssignment = () => {
      if (!currentAssignment || !submissionId || isSubmittingRef.current) return;

      isSubmittingRef.current = true;

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

      // Get final responses including current question if needed
      const finalResponses = ensureCurrentQuestionResponse();

      // Calculate overall score
      const totalQuestions = currentAssignment.questions?.length || 0;
      const correctResponses = Object.values(finalResponses).filter(r => r.isCorrect);
      const calculatedScore = totalQuestions > 0
        ? Math.round((correctResponses.length / totalQuestions) * 100)
        : 0;

      setScore(calculatedScore);

      // Submit responses to server
      const responseArray = Object.values(finalResponses);

      // Pass the calculated score to the submitResponses function
      submitResponses(submissionId, responseArray, calculatedScore)
        .then(() => {
          // Reset loading state
          setIsSubmitting(false);

          // Show single success notification
          toast.success('Assignment completed successfully!', {
            duration: 3000,
            icon: '🎉'
          });

          // Show celebration overlay with a slight delay to ensure UI updates
          setTimeout(() => {
            setShowCelebration(true);

            // Stop background music when assignment is completed
            stopBackgroundMusic();

            // Notify parent that assignment is complete
            if (onAssignmentComplete) {
              onAssignmentComplete();
            }
          }, 300);
        })
        .catch(error => {
          console.error('Error submitting responses:', error);

          // Reset loading state
          setIsSubmitting(false);

          toast.error('Failed to submit assignment. Please try again.', {
            duration: 4000
          });
          // Allow retry if submission fails
          setIsSubmitted(false);
          isSubmittingRef.current = false;
        });
    };

    if (isSubmitted && currentAssignment && submissionId) {
      submitAssignment();
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

  // Add user interaction handler to enable audio playback
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
        // Try to play audio instructions if available and autoplay was blocked
        if (currentAssignment?.audioInstructions && audioPlayerRef.current) {
          // This will be handled by the AudioPlayer component
        }
      }
    };

    // Add event listeners for user interaction
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [hasUserInteracted, currentAssignment?.audioInstructions]);

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
    // Set loading state
    setIsSubmitting(true);

    // Scroll to top of page for better UX
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);

    playSound('completion');
    // Just set isSubmitted to true, and the effect will handle the actual submission
    setIsSubmitted(true);
  };

  // Text-to-speech for questions
  const speakQuestion = useCallback((question: InteractiveQuestion) => {
    if (!question) return;

    let textToSpeak = '';

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
      speakText(textToSpeak, { rate: 0.9, volume: 0.8 });
    }
  }, []);

  // Effect to speak question when it changes (only if no audio instructions)
  useEffect(() => {
    const currentQuestion = currentAssignment?.questions?.[currentQuestionIndex];
    if (currentQuestion && !currentQuestion.audioInstructions && isTTSAvailable()) {
      // Delay TTS to allow page to settle
      const timer = setTimeout(() => {
        speakQuestion(currentQuestion);
      }, 1000);

      return () => {
        clearTimeout(timer);
        stopSpeaking();
      };
    }
  }, [currentQuestionIndex, currentAssignment?.questions, speakQuestion]);

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

  // Check for error, payment requirement, or missing assignment first
  const errorContent = renderError();
  const paymentRequiredContent = renderPaymentRequired();
  const noAssignmentContent = renderNoAssignment();

  if (errorContent) return errorContent;
  if (paymentRequiredContent) return paymentRequiredContent;
  if (noAssignmentContent) return noAssignmentContent;

  return (
    <div
      className="container mx-auto py-8 px-4"
      onClick={() => {
        // Initialize sound system on first user interaction
        initializeSoundSystem();
      }}
    >
      {/* Assignment Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        {/* User Info Banner for Anonymous Users */}
        {anonymousUser && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Welcome, {anonymousUser.name}!
                </h3>
                <div className="mt-1 text-sm text-blue-600">
                  <p>You're taking this quiz as a guest. Your results will be saved and can be viewed by the instructor.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <h1 className="text-3xl font-bold mb-2">
          {assignmentOrganization?.name ? (
            <>
              <span className="text-blue-600">{assignmentOrganization.name}</span>
              <span className="text-gray-400 mx-2">|</span>
              <span>{currentAssignment?.title}</span>
            </>
          ) : (
            currentAssignment?.title
          )}
        </h1>
        <p className="text-gray-600 mb-4">{currentAssignment?.description}</p>

        {/* Quiz Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">Quiz Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <svg className="h-4 w-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-gray-700">
                <strong>{currentAssignment?.questions?.length || 0}</strong> Questions
              </span>
            </div>
            {currentAssignment?.estimatedTimeMinutes && (
              <div className="flex items-center">
                <svg className="h-4 w-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700">
                  <strong>{currentAssignment?.estimatedTimeMinutes}</strong> minutes
                </span>
              </div>
            )}
            {currentAssignment?.difficultyLevel && (
              <div className="flex items-center">
                <svg className="h-4 w-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-gray-700">
                  <strong>{currentAssignment?.difficultyLevel}</strong> Level
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Always render audio player, let it handle empty/loading states */}
        <div className="mb-4">
          {/* Debug info for audio instructions */}
          <div className="bg-yellow-100 border border-yellow-300 rounded p-2 mb-2 text-xs">
            <strong>🐛 Audio Debug Info:</strong>
            <br />
            <strong>Assignment ID:</strong> {currentAssignment?.id || 'Not loaded'}
            <br />
            <strong>Audio Instructions:</strong> {currentAssignment?.audioInstructions || 'None/Empty'}
            <br />
            <strong>Audio Instructions Type:</strong> {typeof currentAssignment?.audioInstructions}
            <br />
            <strong>Audio Instructions Length:</strong> {currentAssignment?.audioInstructions?.length || 0}
            <br />
            <strong>Current Assignment Keys:</strong> {currentAssignment ? Object.keys(currentAssignment).join(', ') : 'No assignment'}
            <br />
            <strong>Loading State:</strong> {loading ? 'Loading...' : 'Loaded'}
            <br />
            <strong>Error State:</strong> {error || 'No error'}
          </div>

          <SimpleAudioPlayer
            ref={audioPlayerRef}
            audioUrl={currentAssignment?.audioInstructions || ''}
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

        {/* Direct Link */}
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
      </div>

      {/* Progress Display */}
      {currentAssignment?.questions && (
        <ProgressDisplay
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={currentAssignment?.questions.length || 0}
          score={score || 0}
          timeSpent={timeSpent}
        />
      )}

      {/* Current Question */}
      {currentQuestion ? (
        <motion.div
          key={currentQuestion.id || 'unknown-question'}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          data-testid="question-container"
          data-question-index={currentQuestionIndex}
          id="current-question"
          className="question-container"
        >
          {renderQuestion(currentQuestion)}
        </motion.div>
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

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button
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
          {/* Show loader when submitting */}
          {isSubmitting && (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
          )}
          <span>
            {currentAssignment?.questions && currentQuestionIndex < (currentAssignment?.questions?.length || 0) - 1
              ? 'Next'
              : isSubmitting
              ? 'Submitting...'
              : 'Finish'
            }
          </span>
        </button>
      </div>

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

      {/* Text-to-Speech Button (only show if TTS is available and no audio instructions) */}
      {!currentAssignment?.audioInstructions && isTTSAvailable() && currentQuestion && (
        <button
          onClick={() => {
            playSound('click');
            speakQuestion(currentQuestion);
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
      {currentAssignment?.audioInstructions && (
        <>
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

          {/* Audio Instructions Modal - Only show sound controls */}
          {showAudioPlayer && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Audio</h3>
                  <button
                    onClick={() => setShowAudioPlayer(false)}
                    className="text-gray-500 hover:text-gray-700"
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
        </>
      )}

      {/* Certificate Floating Button for Anonymous Users */}
      <CertificateFloatingButton />
    </div>
  );
};

export default PlayAssignment;
