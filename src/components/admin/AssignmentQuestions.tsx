// src/components/admin/AssignmentQuestions.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InteractiveAssignment, InteractiveQuestion } from '../../types/interactiveAssignment';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import QuestionForm from './QuestionForm';
import toast from 'react-hot-toast';

interface AssignmentQuestionsProps {
  assignment: InteractiveAssignment;
  onAssignmentUpdate?: () => void;
}

const AssignmentQuestions = ({ assignment, onAssignmentUpdate }: AssignmentQuestionsProps) => {
  const {
    createQuestion,
    updateQuestion,
    deleteQuestion,
    fetchAssignmentById,
    showProgress,
    updateProgress,
    hideProgress
  } = useInteractiveAssignment();
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<InteractiveQuestion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localQuestions, setLocalQuestions] = useState<InteractiveQuestion[]>(assignment.questions || []);

  // Update local questions when assignment changes
  useEffect(() => {
    console.log('Assignment in AssignmentQuestions:', assignment);
    console.log('Questions in assignment:', assignment.questions || []);
    setLocalQuestions(assignment.questions || []);
  }, [assignment]);

  // Refresh questions when component mounts
  useEffect(() => {
    console.log('AssignmentQuestions component mounted, refreshing data...');
    refreshAssignmentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get sorted questions
  const sortedQuestions = [...localQuestions].sort((a, b) => a.order - b.order);

  // Refresh assignment data
  const refreshAssignmentData = async () => {
    setIsLoading(true);
    try {
      console.log('Refreshing assignment data in AssignmentQuestions for ID:', assignment.id);
      const refreshedAssignment = await fetchAssignmentById(assignment.id);
      console.log('Refreshed assignment:', refreshedAssignment);

      if (refreshedAssignment && refreshedAssignment.questions) {
        console.log('Questions from refreshed assignment:', refreshedAssignment.questions);
        setLocalQuestions(refreshedAssignment.questions);
        if (onAssignmentUpdate) {
          onAssignmentUpdate();
        }
      } else {
        console.warn('No questions found in refreshed assignment');
      }
    } catch (error) {
      console.error('Error refreshing assignment data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding a new question
  const handleAddQuestion = async (question: Partial<InteractiveQuestion>) => {
    setIsSubmitting(true);
    try {
      const newQuestion = await createQuestion({
        ...question,
        assignmentId: assignment.id,
        order: sortedQuestions.length
      });

      // Update local state with the new question
      setLocalQuestions(prev => [...prev, newQuestion]);

      setShowQuestionForm(false);
      toast.success('Question added successfully');

      // Refresh assignment data to ensure we have the latest
      await refreshAssignmentData();
    } catch (error) {
      console.error('Error adding question:', error);
      toast.error('Failed to add question');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle updating a question
  const handleUpdateQuestion = async (question: Partial<InteractiveQuestion>) => {
    if (!editingQuestion) return;

    setIsSubmitting(true);
    try {
      const updatedQuestion = await updateQuestion(editingQuestion.id, question);

      // Update local state
      setLocalQuestions(prev =>
        prev.map(q => q.id === editingQuestion.id ? updatedQuestion : q)
      );

      setEditingQuestion(null);
      toast.success('Question updated successfully');

      // Refresh assignment data
      await refreshAssignmentData();
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error('Failed to update question');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    // Show loading progress
    showProgress('Deleting question...');
    updateProgress(10, 'Preparing to delete question...');
    setIsLoading(true);

    try {
      updateProgress(30, 'Deleting question...');
      await deleteQuestion(questionId);
      updateProgress(70, 'Question deleted successfully');

      // Update local state
      setLocalQuestions(prev => prev.filter(q => q.id !== questionId));

      toast.success('Question deleted successfully');

      // Refresh assignment data
      updateProgress(80, 'Refreshing assignment data...');
      await refreshAssignmentData();

      updateProgress(100, 'Complete');
      setTimeout(() => hideProgress(), 500);
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
      updateProgress(100, 'Failed to delete question');
      setTimeout(() => hideProgress(), 1000);
    } finally {
      setIsLoading(false);
    }
  };

  // Get question type display name
  const getQuestionTypeDisplay = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-bold">Questions</h2>
          <button
            onClick={refreshAssignmentData}
            className="ml-2 p-1 text-gray-500 hover:text-blue-500 rounded-full"
            title="Refresh questions"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <button
          onClick={() => {
            setEditingQuestion(null);
            setShowQuestionForm(true);
          }}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg"
        >
          Add Question
        </button>
      </div>

      {isLoading ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></div>
            <p className="text-gray-500">Loading questions...</p>
          </div>
        </div>
      ) : sortedQuestions.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <p className="text-gray-500">No questions added yet. Click "Add Question" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedQuestions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800 mr-2">
                      {getQuestionTypeDisplay(question.questionType)}
                    </span>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                      Question {index + 1}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingQuestion(question);
                        setShowQuestionForm(true);
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-2">{question.questionText}</h3>

                {question.questionType === 'MULTIPLE_CHOICE' && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Options:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {question.questionData.options.map((option: any) => (
                        <li key={option.id} className="text-sm">
                          {option.text}
                          {option.isCorrect && (
                            <span className="ml-2 text-green-500 text-xs">✓ Correct</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">
                      {question.questionData.allowMultiple
                        ? 'Multiple correct answers allowed'
                        : 'Single correct answer only'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showQuestionForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold">
                    {editingQuestion ? 'Edit Question' : 'Add New Question'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowQuestionForm(false);
                      setEditingQuestion(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <QuestionForm
                  assignmentId={assignment.id}
                  initialData={editingQuestion || undefined}
                  onSubmit={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
                  onCancel={() => {
                    setShowQuestionForm(false);
                    setEditingQuestion(null);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssignmentQuestions;
