// src/components/assignments/PlayAssignment.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useDatabaseState } from '../../context/DatabaseStateContext';
import { createEnhancedInteractiveAssignmentService } from '../../lib/services/enhancedInteractiveAssignmentService';
import { getCachedItem, setCachedItem } from '../../lib/utils/cacheUtils';
import ProgressDisplay from './ProgressDisplay';
import CelebrationOverlay from './CelebrationOverlay';
import AnonymousUserRegistration from '../auth/AnonymousUserRegistration';
import EnhancedMatchingExercise from '../exercises/EnhancedMatchingExercise';
import MultipleChoiceExercise from '../exercises/MultipleChoiceExercise';
import CompletionExercise from '../exercises/CompletionExercise';
import OrderingExercise from '../exercises/OrderingExercise';
import AudioPlayer from '../common/AudioPlayer';
import { playSound } from '../../lib/utils/soundUtils';
import toast from 'react-hot-toast';
import { InteractiveAssignment, InteractiveQuestion, InteractiveResponse } from '../../types/interactiveAssignment';

interface PlayAssignmentProps {
  assignment?: InteractiveAssignment | null;
  onAssignmentStart?: () => void;
  onAssignmentComplete?: () => void;
}

const PlayAssignment = ({
  assignment,
  onAssignmentStart,
  onAssignmentComplete
}: PlayAssignmentProps) => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { anonymousUser, createSubmission, submitResponses } = useInteractiveAssignment();
  const { user, isSupabaseLoading } = useSupabaseAuth();

  const [currentAssignment, setCurrentAssignment] = useState<InteractiveAssignment | null>(assignment || null);
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
  const [showCelebration, setShowCelebration] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  // Create the enhanced service
  const assignmentService = useCallback(() => {
    return createEnhancedInteractiveAssignmentService(user);
  }, [user]);

  // Import the database state context
  const { isReady: isDatabaseReady, executeWhenReady, state: dbState } = useDatabaseState();

  // Update currentAssignment when assignment prop changes - only once
  useEffect(() => {
    if (assignment && !currentAssignment) {
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

    if (cachedAssignment) {
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

  // Check if user is registered
  useEffect(() => {
    if (currentAssignment && !anonymousUser) {
      setShowRegistration(true);
    }
  }, [currentAssignment, anonymousUser]);

  // Effect to handle submission when isSubmitted changes
  useEffect(() => {
    // We need to define a local function here to avoid the circular dependency
    const submitAssignment = () => {
      if (!currentAssignment || !submissionId) return;

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

      // Show a loading toast while submitting
      const loadingToast = toast.loading('Saving your results...');

      // Submit responses to server
      const responseArray = Object.values(finalResponses);

      // Pass the calculated score to the submitResponses function
      submitResponses(submissionId, responseArray, calculatedScore)
        .then(() => {
          // Dismiss loading toast
          toast.dismiss(loadingToast);
          toast.success('Assignment completed!');

          // Show celebration overlay with a slight delay to ensure UI updates
          setTimeout(() => {
            setShowCelebration(true);

            // Notify parent that assignment is complete
            if (onAssignmentComplete) {
              onAssignmentComplete();
            }
          }, 300);
        })
        .catch(error => {
          // Dismiss loading toast
          toast.dismiss(loadingToast);
          console.error('Error submitting responses:', error);
          toast.error('Failed to submit responses. Please try again.');
          // Allow retry if submission fails
          setIsSubmitted(false);
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

    // Start the timer
    const interval = window.setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    setTimerInterval(interval);

    // Notify parent that assignment has started
    if (onAssignmentStart) {
      onAssignmentStart();
    }

    // Create submission only if we have a user, an assignment, and no submission ID yet
    if (anonymousUser && !submissionId && currentAssignment.id) {
      // Use a flag to prevent duplicate API calls
      let isCreatingSubmission = false;

      if (!isCreatingSubmission) {
        isCreatingSubmission = true;

        createSubmission({
          assignmentId: currentAssignment.id,
          userId: anonymousUser.id,
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
    };
  }, [currentAssignment, anonymousUser, submissionId, timerInterval, createSubmission, onAssignmentStart]);

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
  const handleQuestionComplete = useCallback((isCorrect: boolean) => {
    if (!currentAssignment || !currentAssignment.questions) return;

    const currentQuestion = currentAssignment.questions[currentQuestionIndex];

    // Update response
    handleResponseUpdate(currentQuestion.id, responses[currentQuestion.id]?.responseData || {}, isCorrect);

    // Auto-advance to next question after a delay
    setTimeout(() => {
      if (currentQuestionIndex < currentAssignment.questions!.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        playSound('click');
      } else {
        // This is the last question, submit the assignment
        if (currentAssignment && submissionId) {
          setIsSubmitted(true);
        }
      }
    }, 2000);
  }, [currentAssignment, currentQuestionIndex, handleResponseUpdate, responses, submissionId]);

  // Manual submit handler for the "Finish" button
  const handleManualSubmit = () => {
    // Just set isSubmitted to true, and the effect will handle the actual submission
    setIsSubmitted(true);
  };

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
            onComplete={(isCorrect) => {
              handleQuestionComplete(isCorrect);
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
            onComplete={(isCorrect) => {
              handleQuestionComplete(isCorrect);
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
            onComplete={(isCorrect) => {
              handleQuestionComplete(isCorrect);
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
            onComplete={(isCorrect) => {
              handleQuestionComplete(isCorrect);
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
  if (loading || isSupabaseLoading) {
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
      </div>
    );
  }

  // Error state
  if (error) {
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

  // No assignment found
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

  // Get current question - memoized to prevent unnecessary re-renders
  const currentQuestion = useMemo(() => {
    return currentAssignment.questions?.[currentQuestionIndex];
  }, [currentAssignment, currentQuestionIndex]);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Assignment Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{currentAssignment.title}</h1>
        <p className="text-gray-600 mb-4">{currentAssignment.description}</p>

        {currentAssignment.audioInstructions && (
          <div className="mb-4">
            <AudioPlayer
              audioUrl={currentAssignment.audioInstructions}
              autoPlay={true}
              label="Audio Instructions"
              className="w-full"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-sm">
          {currentAssignment.difficultyLevel && (
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {currentAssignment.difficultyLevel}
            </span>
          )}

          {currentAssignment.estimatedTimeMinutes && (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
              {currentAssignment.estimatedTimeMinutes} minutes
            </span>
          )}

          {currentAssignment.ageGroup && (
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
              {currentAssignment.ageGroup}
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
      {currentAssignment.questions && (
        <ProgressDisplay
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={currentAssignment.questions.length}
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
            if (currentAssignment.questions && currentQuestionIndex < currentAssignment.questions.length - 1) {
              setCurrentQuestionIndex(prev => prev + 1);
              playSound('click');
            } else {
              handleManualSubmit();
            }
          }}
          disabled={isSubmitted}
          className={`py-3 px-6 rounded-xl font-medium transition-colors ${
            isSubmitted
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {currentAssignment.questions && currentQuestionIndex < currentAssignment.questions.length - 1
            ? 'Next'
            : 'Finish'
          }
        </button>
      </div>

      {/* Anonymous User Registration Modal */}
      <AnonymousUserRegistration
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
        onSuccess={() => {
          // The submission will be created by the useEffect hook when anonymousUser changes
          setShowRegistration(false);
        }}
      />

      {/* Celebration Overlay */}
      <CelebrationOverlay
        isVisible={showCelebration}
        score={score || 0}
        submissionId={submissionId || undefined}
        onClose={() => setShowCelebration(false)}
      />

      {/* Floating Audio Button (only show if there are audio instructions) */}
      {currentAssignment.audioInstructions && (
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

          {/* Audio Instructions Modal */}
          {showAudioPlayer && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">Audio Instructions</h3>
                  <button
                    onClick={() => setShowAudioPlayer(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <AudioPlayer
                  audioUrl={currentAssignment.audioInstructions}
                  autoPlay={true}
                  showLabel={false}
                />
                <p className="mt-4 text-sm text-gray-600">
                  Listen to the audio instructions for this assignment. You can replay this anytime by clicking the audio button.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PlayAssignment;
