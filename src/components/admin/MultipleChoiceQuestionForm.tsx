// src/components/admin/MultipleChoiceQuestionForm.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
  imageUrl?: string;
}

interface MultipleChoiceQuestionFormProps {
  initialData?: {
    questionText: string;
    options: MultipleChoiceOption[];
    allowMultiple: boolean;
  };
  onSubmit: (data: {
    questionText: string;
    questionData: {
      options: MultipleChoiceOption[];
      allowMultiple: boolean;
    };
  }) => void;
  onCancel: () => void;
}

const MultipleChoiceQuestionForm = ({
  initialData,
  onSubmit,
  onCancel
}: MultipleChoiceQuestionFormProps) => {
  const [questionText, setQuestionText] = useState(initialData?.questionText || '');
  const [options, setOptions] = useState<MultipleChoiceOption[]>(
    initialData?.options || [
      { id: crypto.randomUUID(), text: '', isCorrect: false },
      { id: crypto.randomUUID(), text: '', isCorrect: false }
    ]
  );
  const [allowMultiple, setAllowMultiple] = useState(initialData?.allowMultiple || false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Add a new option
  const handleAddOption = () => {
    setOptions([...options, { id: crypto.randomUUID(), text: '', isCorrect: false }]);
  };

  // Remove an option
  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) {
      toast.error('Multiple choice questions must have at least 2 options');
      return;
    }
    setOptions(options.filter(option => option.id !== id));
  };

  // Update option text
  const handleOptionTextChange = (id: string, text: string) => {
    setOptions(
      options.map(option =>
        option.id === id ? { ...option, text } : option
      )
    );
  };

  // Toggle option correctness
  const handleToggleCorrect = (id: string) => {
    setOptions(
      options.map(option => {
        if (option.id === id) {
          return { ...option, isCorrect: !option.isCorrect };
        }
        
        // If not allowing multiple correct answers, uncheck other options
        if (!allowMultiple && !option.isCorrect) {
          return option;
        } else if (!allowMultiple) {
          return { ...option, isCorrect: false };
        }
        
        return option;
      })
    );
  };

  // Validate the form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!questionText.trim()) {
      newErrors.questionText = 'Question text is required';
    }

    // Check if at least one option is marked as correct
    const hasCorrectOption = options.some(option => option.isCorrect);
    if (!hasCorrectOption) {
      newErrors.options = 'At least one option must be marked as correct';
    }

    // Check if all options have text
    const emptyOptions = options.some(option => !option.text.trim());
    if (emptyOptions) {
      newErrors.optionText = 'All options must have text';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit({
        questionText,
        questionData: {
          options,
          allowMultiple
        }
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Question Text */}
        <div>
          <label htmlFor="questionText" className="block text-sm font-medium text-gray-700 mb-1">
            Question Text <span className="text-red-500">*</span>
          </label>
          <textarea
            id="questionText"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.questionText ? 'border-red-500' : 'border-gray-300'
            } focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50`}
            rows={3}
            placeholder="Enter your question here..."
          />
          {errors.questionText && <p className="mt-1 text-sm text-red-500">{errors.questionText}</p>}
        </div>

        {/* Allow Multiple Answers */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="allowMultiple"
            checked={allowMultiple}
            onChange={() => setAllowMultiple(!allowMultiple)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="allowMultiple" className="ml-2 block text-sm text-gray-700">
            Allow multiple correct answers
          </label>
        </div>

        {/* Options */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Options <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleAddOption}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              + Add Option
            </button>
          </div>
          
          {errors.options && <p className="mt-1 text-sm text-red-500">{errors.options}</p>}
          {errors.optionText && <p className="mt-1 text-sm text-red-500">{errors.optionText}</p>}
          
          <div className="space-y-3 mt-3">
            {options.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-3"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`correct-${option.id}`}
                      checked={option.isCorrect}
                      onChange={() => handleToggleCorrect(option.id)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`correct-${option.id}`} className="text-sm text-gray-700">
                      Correct
                    </label>
                  </div>
                </div>
                
                <div className="flex-grow">
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={() => handleRemoveOption(option.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg"
        >
          {initialData ? 'Update Question' : 'Add Question'}
        </button>
      </div>
    </form>
  );
};

export default MultipleChoiceQuestionForm;
