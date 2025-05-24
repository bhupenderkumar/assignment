// src/components/exercises/MultipleChoiceExercise.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../lib/utils/soundUtils';
import toast from 'react-hot-toast';

// Define types for the multiple choice exercise
export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
  imageUrl?: string;
}

export interface MultipleChoiceExerciseData {
  question: string;
  options: MultipleChoiceOption[];
  allowMultiple: boolean;
}

interface MultipleChoiceExerciseProps {
  data: MultipleChoiceExerciseData;
  onComplete: (isCorrect: boolean, score: number) => void;
  showFeedback?: boolean;
  readOnly?: boolean;
  initialSelections?: string[];
}

const MultipleChoiceExercise = ({
  data,
  onComplete,
  showFeedback: initialShowFeedback = false,
  readOnly = false,
  initialSelections = []
}: MultipleChoiceExerciseProps) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(initialSelections);
  const [showFeedback, setShowFeedback] = useState(initialShowFeedback);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Handle option selection
  const handleOptionSelect = (optionId: string) => {
    if (readOnly || isSubmitted) return;

    playSound('click', 0.3);

    if (data.allowMultiple) {
      // Toggle selection for multiple choice
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      // Single selection for single choice
      setSelectedOptions([optionId]);
    }
  };

  // Handle submit
  const handleSubmit = () => {
    if (selectedOptions.length === 0) {
      toast.error('Please select an option');
      return;
    }

    setIsSubmitted(true);
    setShowFeedback(true);

    // Calculate correctness
    const correctOptions = data.options.filter(option => option.isCorrect).map(option => option.id);
    const userCorrectSelections = selectedOptions.filter(id => correctOptions.includes(id));
    const userIncorrectSelections = selectedOptions.filter(id => !correctOptions.includes(id));

    // For multiple choice, all correct options must be selected and no incorrect ones
    // For single choice, the selected option must be correct
    const isCorrect = data.allowMultiple
      ? userCorrectSelections.length === correctOptions.length && userIncorrectSelections.length === 0
      : userCorrectSelections.length === 1;

    // Calculate score (percentage of correct answers)
    const score = data.allowMultiple
      ? Math.round(((correctOptions.length - (correctOptions.length - userCorrectSelections.length) - userIncorrectSelections.length) / correctOptions.length) * 100)
      : isCorrect ? 100 : 0;

    // Play appropriate sound
    if (isCorrect) {
      playSound('correct');
      toast.success('Correct!', { duration: 2000 });
    } else {
      playSound('incorrect');
      toast('Try again!', { duration: 2000, icon: '🤔' });
    }

    onComplete(isCorrect, score);
  };

  // Check if an option is correct
  const isOptionCorrect = (optionId: string) => {
    return data.options.find(option => option.id === optionId)?.isCorrect || false;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 my-6">
      <h3 className="text-xl font-bold mb-6">{data.question}</h3>

      <div className="space-y-4 mb-6">
        {data.options.map((option) => {
          const isSelected = selectedOptions.includes(option.id);
          const isCorrect = option.isCorrect;

          // Determine background color based on state
          let bgColor = "bg-white border-gray-300";

          if (showFeedback && isSelected) {
            bgColor = isCorrect
              ? "bg-green-100 border-green-500"
              : "bg-red-100 border-red-500";
          } else if (showFeedback && isCorrect) {
            bgColor = "bg-green-50 border-green-300";
          } else if (isSelected) {
            bgColor = "bg-blue-100 border-blue-500";
          }

          return (
            <motion.div
              key={option.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`p-4 rounded-xl border-2 ${bgColor} cursor-pointer shadow-sm transition-colors duration-300`}
              onClick={() => handleOptionSelect(option.id)}
            >
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                  isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-3 h-3 rounded-full bg-white"
                    />
                  )}
                </div>

                <div className="flex-1 flex items-center">
                  {option.imageUrl && (
                    <img
                      src={option.imageUrl}
                      alt={option.text}
                      className="w-12 h-12 object-cover rounded-lg mr-3"
                    />
                  )}
                  <span className="text-lg">{option.text}</span>
                </div>

                {showFeedback && (
                  <div className="ml-2">
                    {isCorrect ? (
                      <span className="text-green-500 text-xl">✓</span>
                    ) : (
                      isSelected && <span className="text-red-500 text-xl">✗</span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {!showFeedback && (
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all duration-300 text-lg"
            disabled={selectedOptions.length === 0}
          >
            Submit Answer
          </button>
        </div>
      )}

      {/* Feedback Message */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-8 text-center"
          >
            <h3 className="text-xl font-bold mb-2">
              {selectedOptions.every(id => isOptionCorrect(id)) &&
               data.options.filter(o => o.isCorrect).every(o => selectedOptions.includes(o.id))
                ? '🎉 Great job! Your answer is correct!'
                : '😊 Good try! Review the correct answers above.'}
            </h3>
            <button
              onClick={() => {
                setShowFeedback(false);
                setIsSubmitted(false);
                setSelectedOptions([]);
                playSound('click');
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all duration-300 text-lg mt-4"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultipleChoiceExercise;
