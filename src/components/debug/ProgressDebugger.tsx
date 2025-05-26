// src/components/debug/ProgressDebugger.tsx
import React, { useEffect, useState } from 'react';
import { useUserProgress } from '../../hooks/useUserProgress';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';

interface ProgressDebuggerProps {
  assignmentId?: string;
  totalQuestions?: number;
  currentQuestionIndex?: number;
  currentQuestionId?: string;
}

const ProgressDebugger: React.FC<ProgressDebuggerProps> = ({
  assignmentId = 'test-assignment',
  totalQuestions = 10,
  currentQuestionIndex = 0,
  currentQuestionId = 'test-question-1'
}) => {
  const {
    currentJourney,
    isTracking,
    startTracking,
    trackQuestionStart,
    trackQuestionAnswer,
    getProgressPercentage,
    getCurrentMilestone,
    saveProgress
  } = useUserProgress();

  const { user, anonymousUser } = useSupabaseAuth();
  const { updateUserProgress } = useInteractiveAssignment();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const info = {
      user: user ? { id: user.id, email: user.email } : null,
      anonymousUser: anonymousUser ? { id: anonymousUser.id, name: anonymousUser.name } : null,
      currentJourney: currentJourney ? {
        assignmentId: currentJourney.assignmentId,
        userId: currentJourney.userId,
        totalQuestions: currentJourney.totalQuestions,
        currentQuestionIndex: currentJourney.currentQuestionIndex,
        questionsProgress: Object.keys(currentJourney.questionsProgress),
        status: currentJourney.status,
        totalTimeSpent: currentJourney.totalTimeSpent
      } : null,
      isTracking,
      progressPercentage: getProgressPercentage(),
      milestone: getCurrentMilestone()
    };
    setDebugInfo(info);
  }, [user, anonymousUser, currentJourney, isTracking, getProgressPercentage, getCurrentMilestone]);

  const handleStartTracking = () => {
    console.log('🔧 Debug: Starting tracking with:', { assignmentId, totalQuestions });
    startTracking(assignmentId, totalQuestions);
  };

  const handleTrackQuestion = () => {
    console.log('🔧 Debug: Tracking question:', { currentQuestionId, currentQuestionIndex });
    trackQuestionStart(currentQuestionId, currentQuestionIndex);
  };

  const handleAnswerQuestion = (isCorrect: boolean) => {
    console.log('🔧 Debug: Answering question:', { currentQuestionId, isCorrect });
    trackQuestionAnswer(currentQuestionId, isCorrect, { answer: 'test-answer' });
  };

  const handleSaveProgress = async () => {
    console.log('🔧 Debug: Saving progress...');
    try {
      await saveProgress();
      console.log('🔧 Debug: Progress saved successfully');
    } catch (error) {
      console.error('🔧 Debug: Failed to save progress:', error);
    }
  };

  const handleTestDatabase = async () => {
    if (!currentJourney) {
      console.warn('🔧 Debug: No current journey to test database with');
      return;
    }

    try {
      const testProgress = {
        userId: currentJourney.userId,
        assignmentId: currentJourney.assignmentId,
        startedAt: currentJourney.startedAt,
        timeSpent: currentJourney.totalTimeSpent,
        status: 'IN_PROGRESS' as const,
        questionsAnswered: Object.values(currentJourney.questionsProgress).filter(q => q.answeredAt).length,
        currentQuestionIndex: currentJourney.currentQuestionIndex
      };

      console.log('🔧 Debug: Testing database update with:', testProgress);
      const result = await updateUserProgress(testProgress);
      console.log('🔧 Debug: Database update result:', result);
    } catch (error) {
      console.error('🔧 Debug: Database test failed:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <h3 className="text-lg font-bold mb-3 text-gray-800">Progress Debugger</h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={handleStartTracking}
          className="w-full bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
        >
          Start Tracking
        </button>
        
        <button
          onClick={handleTrackQuestion}
          className="w-full bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
          disabled={!isTracking}
        >
          Track Question
        </button>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handleAnswerQuestion(true)}
            className="flex-1 bg-emerald-500 text-white px-3 py-1 rounded text-sm hover:bg-emerald-600"
            disabled={!isTracking}
          >
            Answer Correct
          </button>
          <button
            onClick={() => handleAnswerQuestion(false)}
            className="flex-1 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
            disabled={!isTracking}
          >
            Answer Wrong
          </button>
        </div>
        
        <button
          onClick={handleSaveProgress}
          className="w-full bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
          disabled={!isTracking}
        >
          Save Progress
        </button>
        
        <button
          onClick={handleTestDatabase}
          className="w-full bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
          disabled={!isTracking}
        >
          Test Database
        </button>
      </div>

      <div className="text-xs bg-gray-100 p-2 rounded max-h-40 overflow-y-auto">
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
    </div>
  );
};

export default ProgressDebugger;
