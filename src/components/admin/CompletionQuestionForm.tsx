// src/components/admin/CompletionQuestionForm.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface CompletionBlank {
  id: string;
  answer: string;
  position: number;
}

interface CompletionQuestionFormProps {
  initialData?: {
    questionText: string;
    text: string;
    blanks: CompletionBlank[];
  };
  onSubmit: (data: {
    questionText: string;
    questionData: {
      text: string;
      blanks: CompletionBlank[];
    };
  }) => void;
  onCancel: () => void;
}

const CompletionQuestionForm = ({
  initialData,
  onSubmit,
  onCancel
}: CompletionQuestionFormProps) => {
  const [questionText, setQuestionText] = useState(initialData?.questionText || '');
  const [completionText, setCompletionText] = useState(initialData?.text || '');
  const [blanks, setBlanks] = useState<CompletionBlank[]>(initialData?.blanks || []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedText, setSelectedText] = useState('');

  // Update blanks when completion text changes
  useEffect(() => {
    // Remove blanks that are no longer valid (position beyond text length)
    const updatedBlanks = blanks.filter(blank => blank.position < completionText.length);
    if (updatedBlanks.length !== blanks.length) {
      setBlanks(updatedBlanks);
    }
  }, [completionText]);

  // Handle text selection
  const handleTextSelection = () => {
    // Get the textarea element
    const textarea = document.getElementById('completionText') as HTMLTextAreaElement;
    if (!textarea) return;

    // Get the selected text from the textarea
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end) {
      const selected = completionText.substring(start, end).trim();
      if (selected) {
        setSelectedText(selected);
      } else {
        setSelectedText('');
      }
    } else {
      setSelectedText('');
    }
  };

  // Add a blank at the current selection
  const handleAddBlank = () => {
    if (!selectedText) {
      toast.error('Please select text to create a blank');
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // Get the textarea element
    const textarea = document.getElementById('completionText') as HTMLTextAreaElement;
    if (!textarea) return;

    // Calculate the actual position in the text
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;

    if (startPos === undefined || endPos === undefined) {
      toast.error('Could not determine selection position');
      return;
    }

    // Check if this position overlaps with any existing blank
    const overlappingBlank = blanks.find(blank => {
      const blankEnd = blank.position + blank.answer.length;
      return (startPos < blankEnd && endPos > blank.position);
    });

    if (overlappingBlank) {
      toast.error('Selection overlaps with an existing blank');
      return;
    }

    // Create a new blank
    const newBlank: CompletionBlank = {
      id: crypto.randomUUID(),
      answer: selectedText,
      position: startPos
    };

    // Add the blank and sort by position
    const updatedBlanks = [...blanks, newBlank].sort((a, b) => a.position - b.position);
    setBlanks(updatedBlanks);

    // Replace the selected text with underscores in the completion text
    const beforeSelection = completionText.substring(0, startPos);
    const afterSelection = completionText.substring(endPos);
    const underscores = '_'.repeat(selectedText.length);

    setCompletionText(beforeSelection + underscores + afterSelection);
    setSelectedText('');

    // Show success message
    toast.success('Blank created successfully');
  };

  // Remove a blank
  const handleRemoveBlank = (id: string) => {
    setBlanks(blanks.filter(blank => blank.id !== id));
  };

  // Update blank answer
  const handleBlankAnswerChange = (id: string, answer: string) => {
    setBlanks(
      blanks.map(blank =>
        blank.id === id ? { ...blank, answer } : blank
      )
    );
  };

  // Validate the form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!questionText.trim()) {
      newErrors.questionText = 'Question text is required';
    }

    if (!completionText.trim()) {
      newErrors.completionText = 'Completion text is required';
    }

    if (blanks.length === 0) {
      newErrors.blanks = 'At least one blank is required';
    }

    // Check if all blanks have answers
    const emptyBlanks = blanks.some(blank => !blank.answer.trim());
    if (emptyBlanks) {
      newErrors.blankAnswers = 'All blanks must have answers';
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
          text: completionText,
          blanks
        }
      });
    }
  };

  // Render the completion text with blanks highlighted
  const renderCompletionText = () => {
    if (!completionText) return null;

    // Sort blanks by position (descending) to avoid position shifts when replacing
    const sortedBlanks = [...blanks].sort((a, b) => b.position - a.position);

    let highlightedText = completionText;

    sortedBlanks.forEach((blank, index) => {
      const beforeBlank = highlightedText.substring(0, blank.position);
      const afterBlank = highlightedText.substring(blank.position + blank.answer.length);

      // Create a more visually appealing blank with a number
      const blankNumber = blanks.length - index; // Since we're going in reverse order
      highlightedText = beforeBlank +
        `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-300 font-medium inline-flex items-center">
          <span class="bg-blue-500 text-white rounded-full w-4 h-4 inline-flex items-center justify-center text-xs mr-1">${blankNumber}</span>
          ${'_'.repeat(Math.max(3, blank.answer.length))}
        </span>` +
        afterBlank;
    });

    return <div dangerouslySetInnerHTML={{ __html: highlightedText }} className="leading-relaxed" />;
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

        {/* Completion Text */}
        <div>
          <label htmlFor="completionText" className="block text-sm font-medium text-gray-700 mb-1">
            Completion Text <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <textarea
              id="completionText"
              value={completionText}
              onChange={(e) => setCompletionText(e.target.value)}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.completionText ? 'border-red-500' : 'border-gray-300'
              } focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50`}
              rows={5}
              placeholder="Enter the text with blanks here..."
            />
            {selectedText && (
              <div className="absolute top-2 right-2 bg-yellow-100 p-1 rounded-lg border border-yellow-300 shadow-sm">
                <p className="text-xs text-gray-700 mb-1">Selected: "{selectedText}"</p>
                <button
                  type="button"
                  onClick={handleAddBlank}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm w-full flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Make Blank
                </button>
              </div>
            )}

            <div className="mt-2 flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Select text to create blanks. The selected text will become the answer.
              </p>
              <button
                type="button"
                onClick={handleAddBlank}
                disabled={!selectedText}
                className={`px-3 py-1 rounded-lg text-sm flex items-center ${
                  selectedText
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Make Blank
              </button>
            </div>
          </div>
          {errors.completionText && <p className="mt-1 text-sm text-red-500">{errors.completionText}</p>}
        </div>

        {/* Preview */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">Preview:</h4>
            <span className="text-xs text-gray-500">
              {blanks.length} {blanks.length === 1 ? 'blank' : 'blanks'} created
            </span>
          </div>
          {completionText ? (
            <div className="p-4 bg-white rounded border border-gray-200 shadow-sm">
              {renderCompletionText()}
            </div>
          ) : (
            <div className="p-4 bg-white rounded border border-gray-200 text-center text-gray-500">
              Enter completion text above to see a preview
            </div>
          )}
          <p className="mt-2 text-xs text-gray-500">
            This is how the question will appear to students. Blanks are numbered to match the answers below.
          </p>
        </div>

        {/* Blanks */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Blanks <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500">
              Select text and click "Make Blank" to create blanks
            </p>
          </div>

          {errors.blanks && <p className="mt-1 text-sm text-red-500">{errors.blanks}</p>}
          {errors.blankAnswers && <p className="mt-1 text-sm text-red-500">{errors.blankAnswers}</p>}

          {blanks.length === 0 ? (
            <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
              <p>No blanks created yet.</p>
              <p className="mt-2 text-sm">Select text in the completion text above and click "Make Blank" to create your first blank.</p>
              <div className="mt-4 flex justify-center">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 inline-flex items-center text-left">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">How to create blanks:</p>
                    <ol className="text-xs text-blue-600 list-decimal ml-4 mt-1">
                      <li>Enter your completion text</li>
                      <li>Select the text you want to make into a blank</li>
                      <li>Click the "Make Blank" button</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 mt-3">
              {blanks
                .sort((a, b) => a.position - b.position)
                .map((blank, index) => (
                  <motion.div
                    key={blank.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-grow">
                      <input
                        type="text"
                        value={blank.answer}
                        onChange={(e) => handleBlankAnswerChange(blank.id, e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        placeholder="Answer"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlank(blank.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                      title="Remove blank"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </motion.div>
                ))}
            </div>
          )}
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

export default CompletionQuestionForm;
