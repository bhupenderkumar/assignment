// src/components/exercises/CompletionExercise.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound, playEnhancedFeedback } from '../../lib/utils/soundUtils';
import { scrollToQuestion } from '../../lib/utils/scrollUtils';
import toast from 'react-hot-toast';

// Define types for the completion exercise
export interface CompletionBlank {
  id: string;
  answer: string;
  position: number;
}

export interface CompletionExerciseData {
  text: string;
  blanks: CompletionBlank[];
}

interface CompletionExerciseProps {
  data: CompletionExerciseData;
  onComplete: (isCorrect: boolean, score: number) => void;
  showFeedback?: boolean;
  readOnly?: boolean;
  initialAnswers?: { blankId: string; answer: string }[];
}

const CompletionExercise = ({
  data,
  onComplete,
  showFeedback: initialShowFeedback = false,
  readOnly = false,
  initialAnswers = []
}: CompletionExerciseProps) => {
  const [answers, setAnswers] = useState<{ blankId: string; answer: string }[]>(initialAnswers);
  const [showFeedback, setShowFeedback] = useState(initialShowFeedback);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Process text with blanks
  const processedText = () => {
    let result = [];
    let currentText = data.text;

    // Sort blanks by position to ensure correct order
    const sortedBlanks = [...data.blanks].sort((a, b) => a.position - b.position);

    // If there are no blanks or the text doesn't contain underscores, return the text as is
    if (sortedBlanks.length === 0 || !currentText.includes('_')) {
      // Create blanks at the positions specified in the data
      let lastPosition = 0;

      for (let i = 0; i < sortedBlanks.length; i++) {
        const blank = sortedBlanks[i];
        const beforeBlank = currentText.substring(lastPosition, blank.position);

        if (beforeBlank) {
          result.push(beforeBlank);
        }

        // Add the blank (will be replaced with an input field)
        result.push({ id: blank.id, index: i });

        // Update the last position
        lastPosition = blank.position + blank.answer.length;
      }

      // Add any remaining text
      if (lastPosition < currentText.length) {
        result.push(currentText.substring(lastPosition));
      }

      return result;
    }

    // For backward compatibility, also handle texts with underscores
    for (let i = 0; i < sortedBlanks.length; i++) {
      const blank = sortedBlanks[i];
      const underscoreIndex = currentText.indexOf('_');

      if (underscoreIndex !== -1) {
        // Find the sequence of underscores
        let underscoreCount = 0;
        while (currentText[underscoreIndex + underscoreCount] === '_') {
          underscoreCount++;
        }

        // Add text before the blank
        result.push(currentText.substring(0, underscoreIndex));

        // Add the blank (will be replaced with an input field)
        result.push({ id: blank.id, index: i });

        // Update the current text
        currentText = currentText.substring(underscoreIndex + underscoreCount);
      }
    }

    // Add any remaining text
    if (currentText) {
      result.push(currentText);
    }

    return result;
  };

  // Handle answer change
  const handleAnswerChange = (blankId: string, value: string) => {
    if (readOnly || isSubmitted) return;

    const existingAnswerIndex = answers.findIndex(a => a.blankId === blankId);

    if (existingAnswerIndex !== -1) {
      const updatedAnswers = [...answers];
      updatedAnswers[existingAnswerIndex] = { blankId, answer: value };
      setAnswers(updatedAnswers);
    } else {
      setAnswers([...answers, { blankId, answer: value }]);
    }
  };

  // Get answer for a blank
  const getAnswer = (blankId: string) => {
    return answers.find(a => a.blankId === blankId)?.answer || '';
  };

  // Check if an answer is correct
  const isAnswerCorrect = (blankId: string) => {
    const userAnswer = getAnswer(blankId).trim().toLowerCase();
    const correctAnswer = data.blanks.find(b => b.id === blankId)?.answer.trim().toLowerCase() || '';
    return userAnswer === correctAnswer;
  };

  // Handle submit
  const handleSubmit = () => {
    // Check if all blanks have answers
    const missingAnswers = data.blanks.filter(blank =>
      !answers.some(a => a.blankId === blank.id && a.answer.trim() !== '')
    );

    if (missingAnswers.length > 0) {
      toast.error(`Please fill in all the blanks (${missingAnswers.length} blank${missingAnswers.length > 1 ? 's' : ''} empty)`);
      return;
    }

    setIsSubmitted(true);
    setShowFeedback(true);

    // Calculate correctness
    const correctAnswers = answers.filter(a => isAnswerCorrect(a.blankId));
    const isAllCorrect = correctAnswers.length === data.blanks.length;

    // Calculate score
    const score = Math.round((correctAnswers.length / data.blanks.length) * 100);

    // Play enhanced audio feedback
    if (isAllCorrect) {
      playEnhancedFeedback('correct');
    } else {
      playEnhancedFeedback('incorrect');
    }

    // Show brief feedback without excessive notifications
    if (isAllCorrect) {
      toast.success('Perfect!', { duration: 2000 });
    } else {
      toast(`${correctAnswers.length}/${data.blanks.length} correct`, {
        duration: 2000,
        icon: '📝'
      });
    }

    onComplete(isAllCorrect, score);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 my-6">
      <h3 className="text-xl font-bold mb-6">Fill in the blanks</h3>

      <div className="text-lg leading-relaxed mb-6">
        {processedText().map((item, index) => {
          if (typeof item === 'string') {
            return <span key={index}>{item}</span>;
          } else {
            // Item is an object with id and index properties
            const blankObj = item as { id: string; index: number };
            const blankId = blankObj.id;
            const blankIndex = blankObj.index;
            const isCorrect = isAnswerCorrect(blankId);

            // Determine input style based on state
            let inputStyle = "border-gray-300 focus:border-blue-500";

            if (showFeedback) {
              inputStyle = isCorrect
                ? "border-green-500 bg-green-50"
                : "border-red-500 bg-red-50";
            }

            return (
              <span key={index} className="inline-block mx-1">
                <span className="relative inline-flex items-center">
                  {/* Blank number indicator */}
                  <span className="absolute -top-3 -left-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {blankIndex + 1}
                  </span>

                  {/* Input field */}
                  <input
                    type="text"
                    value={getAnswer(blankId)}
                    onChange={(e) => handleAnswerChange(blankId, e.target.value)}
                    className={`border-b-2 ${inputStyle} px-2 py-1 text-center min-w-24 focus:outline-none transition-colors duration-300`}
                    placeholder="________"
                    disabled={readOnly || isSubmitted}
                    aria-label={`Blank ${blankIndex + 1}`}
                  />

                  {/* Feedback indicator */}
                  {showFeedback && (
                    <span className="ml-1">
                      {isCorrect ? (
                        <span className="text-green-500 text-sm">✓</span>
                      ) : (
                        <span className="text-red-500 text-sm">✗</span>
                      )}
                    </span>
                  )}
                </span>
              </span>
            );
          }
        })}
      </div>

      {!showFeedback && (
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all duration-300 text-lg"
            disabled={answers.length < data.blanks.length}
          >
            Check Answers
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
              {answers.every(a => isAnswerCorrect(a.blankId))
                ? '🎉 Great job! All answers are correct!'
                : '😊 Good try! Some answers need correction.'}
            </h3>

            {!answers.every(a => isAnswerCorrect(a.blankId)) && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-bold text-lg mb-2">Correct Answers:</h4>
                <ul className="text-left grid grid-cols-1 md:grid-cols-2 gap-2">
                  {data.blanks
                    .sort((a, b) => a.position - b.position)
                    .map((blank, index) => {
                      const userAnswer = getAnswer(blank.id);
                      const isCorrect = isAnswerCorrect(blank.id);

                      return (
                        <li key={blank.id} className={`p-2 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                          <div className="flex items-center">
                            <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">
                              {index + 1}
                            </span>
                            <span className="font-medium">
                              {isCorrect ? (
                                <span className="text-green-700">{blank.answer}</span>
                              ) : (
                                <div>
                                  <span className="text-red-500 line-through mr-2">{userAnswer}</span>
                                  <span className="text-green-700">{blank.answer}</span>
                                </div>
                              )}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}

            <button
              onClick={() => {
                if (answers.every(a => isAnswerCorrect(a.blankId))) {
                  // If all answers are correct, just continue
                  playSound('click');
                } else {
                  // If some answers are wrong, reset and try again
                  setShowFeedback(false);
                  setIsSubmitted(false);
                  playSound('click');

                  // Scroll to top of question for better UX
                  scrollToQuestion();
                }
              }}
              className={`font-bold py-3 px-6 rounded-xl shadow-md transition-all duration-300 text-lg mt-4 ${
                answers.every(a => isAnswerCorrect(a.blankId))
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {answers.every(a => isAnswerCorrect(a.blankId)) ? 'Continue' : 'Try Again'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompletionExercise;
