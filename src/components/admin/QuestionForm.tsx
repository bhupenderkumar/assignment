// src/components/admin/QuestionForm.tsx
import { useState } from 'react';
import { InteractiveAssignmentType, InteractiveQuestion } from '../../types/interactiveAssignment';
import MultipleChoiceQuestionForm from './MultipleChoiceQuestionForm';
import MatchingQuestionForm from './MatchingQuestionForm';
import OrderingQuestionForm from './OrderingQuestionForm';
import CompletionQuestionForm from './CompletionQuestionForm';

interface QuestionFormProps {
  assignmentId: string;
  initialData?: InteractiveQuestion;
  onSubmit: (question: Partial<InteractiveQuestion>) => void;
  onCancel: () => void;
}

const QuestionForm = ({
  assignmentId,
  initialData,
  onSubmit,
  onCancel
}: QuestionFormProps) => {
  const [questionType, setQuestionType] = useState<InteractiveAssignmentType>(
    initialData?.questionType || 'MULTIPLE_CHOICE'
  );

  // Handle form submission based on question type
  const handleSubmit = (data: any) => {
    const baseQuestion: Partial<InteractiveQuestion> = {
      assignmentId,
      questionType,
      questionText: data.questionText,
      questionData: data.questionData,
      order: initialData?.order || 0,
    };

    // If we're editing, include the ID
    if (initialData?.id) {
      baseQuestion.id = initialData.id;
    }

    onSubmit(baseQuestion);
  };

  // Render the appropriate form based on question type
  const renderQuestionForm = () => {
    switch (questionType) {
      case 'MULTIPLE_CHOICE':
        return (
          <MultipleChoiceQuestionForm
            initialData={
              initialData && initialData.questionType === 'MULTIPLE_CHOICE'
                ? {
                    questionText: initialData.questionText,
                    options: initialData.questionData.options,
                    allowMultiple: initialData.questionData.allowMultiple
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            onCancel={onCancel}
          />
        );
      case 'MATCHING':
        return (
          <MatchingQuestionForm
            initialData={
              initialData && initialData.questionType === 'MATCHING'
                ? {
                    questionText: initialData.questionText,
                    pairs: initialData.questionData.pairs
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            onCancel={onCancel}
          />
        );
      case 'ORDERING':
        return (
          <OrderingQuestionForm
            initialData={
              initialData && initialData.questionType === 'ORDERING'
                ? {
                    questionText: initialData.questionText,
                    items: initialData.questionData.items
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            onCancel={onCancel}
          />
        );
      case 'COMPLETION':
        return (
          <CompletionQuestionForm
            initialData={
              initialData && initialData.questionType === 'COMPLETION'
                ? {
                    questionText: initialData.questionText,
                    text: initialData.questionData.text,
                    blanks: initialData.questionData.blanks
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            onCancel={onCancel}
          />
        );
      default:
        return (
          <div className="p-4 bg-yellow-100 rounded-lg">
            <p>Form for {questionType} questions is not yet implemented.</p>
            <button
              onClick={onCancel}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Go Back
            </button>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-6">
        {initialData ? 'Edit Question' : 'Add New Question'}
      </h2>

      <div className="mb-6">
        <label htmlFor="questionType" className="block text-sm font-medium text-gray-700 mb-1">
          Question Type <span className="text-red-500">*</span>
        </label>
        <select
          id="questionType"
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value as InteractiveAssignmentType)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
        >
          <option value="MULTIPLE_CHOICE">Multiple Choice</option>
          <option value="MATCHING">Matching</option>
          <option value="COMPLETION">Completion</option>
          <option value="ORDERING">Ordering</option>
        </select>
      </div>

      {renderQuestionForm()}
    </div>
  );
};

export default QuestionForm;
