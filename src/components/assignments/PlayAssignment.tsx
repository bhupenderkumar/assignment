// src/components/assignments/PlayAssignment.tsx
import { useState, useEffect, useCallback } from 'react';
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
}

const PlayAssignment = ({ assignment }: PlayAssignmentProps) => {
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

  // Update currentAssignment when assignment prop changes
  useEffect(() => {
    if (assignment) {
      setCurrentAssignment(assignment);
    }
  }, [assignment]);

  // Function to fetch assignment with retry logic and caching
  const fetchAssignment = useCallback(async () => {
    // Check if Supabase is still initializing
    if (isSupabaseLoading) {
      console.log('Supabase is still initializing, waiting...');
      return;
    }

    // We'll use the database state context instead of the global flag
    if (!isDatabaseReady) {
      console.log('Database is not ready yet, waiting...');

      if (dbState === 'error') {
        setError('Database connection error. Please try refreshing the page.');
      } else {
        setError('Database connection is initializing, please try again in a moment.');
      }

      return;
    }

    if (!assignmentId) {
      console.error('No assignment ID provided');
      setError('No assignment ID provided');
      return;
    }

    // Check if we have a cached version of this assignment
    const cachedAssignmentKey = `cached_assignment_${assignmentId}`;
    const cachedAssignment = getCachedItem(cachedAssignmentKey);

    if (cachedAssignment) {
      console.log('Using cached assignment data');
      setCurrentAssignment(cachedAssignment);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`Attempting to fetch assignment (attempt ${retryCount + 1})`);

      // Create service with error handling
      let service;
      try {
        service = assignmentService();
      } catch (serviceError) {
        console.error('Error creating assignment service:', serviceError);

        // Check if Supabase is ready again - it might be a timing issue
        if (!window._supabaseReady) {
          setError('Database connection is initializing, please try again in a moment.');
        } else {
          setError('Error connecting to the database. Please try refreshing the page.');
        }
        setLoading(false);
        return;
      }

      // Check if we're on a shared assignment page by looking at the URL
      const isSharedPage = window.location.pathname.includes('/play/share/');
      console.log('Is shared page:', isSharedPage);

      let assignment;
      if (isSharedPage) {
        // If we're on a shared page, we need to get the assignment by the shareable link
        const shareableLink = window.location.pathname.split('/play/share/')[1];
        console.log('Shareable link:', shareableLink);

        if (shareableLink) {
          assignment = await service.getAssignmentByShareableLink(shareableLink);
        } else {
          throw new Error('Invalid shareable link');
        }
      } else {
        // Normal assignment page - get by ID
        assignment = await service.getPublicAssignmentById(assignmentId);
      }

      if (assignment) {
        console.log('Assignment fetched successfully:', assignment);
        console.log('Questions:', assignment.questions);

        if (assignment.questions && assignment.questions.length > 0) {
          console.log('First question:', assignment.questions[0]);
        } else {
          console.log('No questions found for this assignment');
        }

        setCurrentAssignment(assignment);

        // Cache the assignment data
        setCachedItem(cachedAssignmentKey, assignment);
        console.log('Assignment data cached successfully');
      } else {
        console.log('Assignment not found');
        setError('Assignment not found or not published');
      }
    } catch (err) {
      console.error('Error fetching assignment:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [assignmentId, assignmentService, retryCount, isSupabaseLoading, isDatabaseReady, dbState]);

  // Fetch assignment on mount or when database state changes
  useEffect(() => {
    // Only fetch if assignment is not provided as a prop
    if (assignment) {
      return;
    }

    const controller = new AbortController();

    // Log the current URL and assignment ID
    console.log('Current URL:', window.location.pathname);
    console.log('Assignment ID from URL params:', assignmentId);

    // Use the database state context to determine readiness
    if (isDatabaseReady && !isSupabaseLoading) {
      console.log('Database and authentication are ready, fetching assignment...');

      // Use executeWhenReady to ensure the database is ready
      executeWhenReady(() => {
        return fetchAssignment();
      }).catch(err => {
        console.error('Error executing database operation:', err);
      });
    } else if (dbState === 'error') {
      // If there's a database error, show it
      console.log('Database has an error, showing error state');
      setError('Database connection error. Please try refreshing the page.');
    } else if (!isSupabaseLoading && dbState !== 'ready') {
      // If auth is ready but database is still initializing
      console.log('Authentication ready but database still initializing...');

      // Set a timeout to check again
      const timeoutId = setTimeout(() => {
        if (isDatabaseReady) {
          console.log('Database is now ready, fetching assignment...');
          fetchAssignment();
        } else {
          console.log('Database still not ready, will retry...');
          setRetryCount(prev => prev + 1);
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    } else {
      // Both auth and database are still initializing
      const retryDelay = Math.min(1000 * Math.pow(1.5, retryCount), 5000); // Max 5 seconds

      console.log(`Still initializing, will retry in ${retryDelay/1000} seconds (attempt ${retryCount + 1})`);

      const timeoutId = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, retryDelay);

      return () => clearTimeout(timeoutId);
    }

    // Cleanup function to abort any in-progress fetches when component unmounts
    return () => {
      controller.abort();
    };
  }, [assignment, assignmentId, fetchAssignment, isSupabaseLoading, retryCount, isDatabaseReady, dbState, executeWhenReady]);

  // Check if user is registered
  useEffect(() => {
    if (currentAssignment && !anonymousUser) {
      setShowRegistration(true);
    }
  }, [currentAssignment, anonymousUser]);

  // Start timer when assignment is loaded
  useEffect(() => {
    // Only start timer and create submission when assignment is first loaded
    if (currentAssignment && !timerInterval) {
      const interval = window.setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);

      setTimerInterval(interval);

      // Create submission only if we have a user and no submission ID yet
      if (anonymousUser && !submissionId) {
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
          });
      }
    }

    // Cleanup function
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [currentAssignment?.id, anonymousUser?.id, submissionId, timerInterval]); // Include submissionId to prevent duplicate submissions

  // Handle response update
  const handleResponseUpdate = (questionId: string, responseData: any, isCorrect: boolean) => {
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
  };

  // Handle question completion
  const handleQuestionComplete = (isCorrect: boolean, questionScore: number) => {
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
        handleSubmit();
      }
    }, 2000);
  };

  // Handle submit
  const handleSubmit = () => {
    if (!currentAssignment || !submissionId) return;

    // Calculate overall score
    const totalQuestions = currentAssignment.questions?.length || 0;
    const correctResponses = Object.values(responses).filter(r => r.isCorrect);
    const calculatedScore = Math.round((correctResponses.length / totalQuestions) * 100);

    setScore(calculatedScore);
    setIsSubmitted(true);

    // Submit responses to server
    const responseArray = Object.values(responses);

    // Pass the calculated score to the submitResponses function
    submitResponses(submissionId, responseArray, calculatedScore)
      .then(() => {
        // Show celebration overlay
        setShowCelebration(true);
      })
      .catch(error => {
        console.error('Error submitting responses:', error);
        toast.error('Failed to submit responses. Please try again.');
      });
  };

  // Render current question
  const renderQuestion = (question: InteractiveQuestion) => {
    console.log('Rendering question:', question);
    console.log('Question type:', question.questionType);
    console.log('Question data:', question.questionData);

    switch (question.questionType) {
      case 'MATCHING':
        return (
          <EnhancedMatchingExercise
            data={{
              sourceItems: question.questionData.pairs.map((pair: any) => ({
                id: pair.id + '-left',
                content: pair.left,
                imageUrl: pair.leftType === 'image' ? pair.left : undefined
              })),
              targetItems: question.questionData.pairs.map((pair: any) => ({
                id: pair.id + '-right',
                content: pair.right,
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
        return (
          <MultipleChoiceExercise
            data={{
              question: question.questionText,
              options: question.questionData.options,
              allowMultiple: question.questionData.allowMultiple
            }}
            onComplete={(isCorrect, score) => {
              handleQuestionComplete(isCorrect, score);
            }}
          />
        );

      case 'COMPLETION':
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
  };

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

  // Get current question
  const currentQuestion = currentAssignment.questions?.[currentQuestionIndex];

  // Debug information
  console.log('Current assignment:', currentAssignment);
  console.log('Current question index:', currentQuestionIndex);
  console.log('Current question:', currentQuestion);
  console.log('Questions array:', currentAssignment.questions);

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
          score={score !== null ? score : undefined}
          timeSpent={timeSpent}
        />
      )}

      {/* Current Question */}
      {currentQuestion && (
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderQuestion(currentQuestion)}
        </motion.div>
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
              handleSubmit();
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
