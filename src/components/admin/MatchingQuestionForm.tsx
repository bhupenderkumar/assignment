// src/components/admin/MatchingQuestionForm.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ImageUploader from '../common/ImageUploader';

interface MatchingPair {
  id: string;
  left: string;
  right: string;
  leftType: 'text' | 'image';
  rightType: 'text' | 'image';
}

interface MatchingQuestionFormProps {
  initialData?: {
    questionText: string;
    pairs: MatchingPair[];
  };
  onSubmit: (data: {
    questionText: string;
    questionData: {
      pairs: MatchingPair[];
    };
  }) => void;
  onCancel: () => void;
}

const MatchingQuestionForm = ({
  initialData,
  onSubmit,
  onCancel
}: MatchingQuestionFormProps) => {
  const [questionText, setQuestionText] = useState(initialData?.questionText || '');
  const [pairs, setPairs] = useState<MatchingPair[]>(
    initialData?.pairs || [
      { id: crypto.randomUUID(), left: '', right: '', leftType: 'text', rightType: 'text' },
      { id: crypto.randomUUID(), left: '', right: '', leftType: 'text', rightType: 'text' }
    ]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Add a new pair
  const handleAddPair = () => {
    setPairs([
      ...pairs,
      {
        id: crypto.randomUUID(),
        left: '',
        right: '',
        leftType: 'text',
        rightType: 'text'
      }
    ]);
  };

  // Remove a pair
  const handleRemovePair = (id: string) => {
    if (pairs.length <= 2) {
      toast.error('Matching questions must have at least 2 pairs');
      return;
    }
    setPairs(pairs.filter(pair => pair.id !== id));
  };

  // Update pair text
  const handlePairTextChange = (id: string, side: 'left' | 'right', value: string) => {
    setPairs(
      pairs.map(pair =>
        pair.id === id ? { ...pair, [side]: value } : pair
      )
    );
  };

  // Toggle between text and image for a side
  const handleTypeToggle = (id: string, side: 'left' | 'right') => {
    const typeKey = side === 'left' ? 'leftType' : 'rightType';
    setPairs(
      pairs.map(pair =>
        pair.id === id
          ? { ...pair, [typeKey]: pair[typeKey] === 'text' ? 'image' : 'text', [side]: '' }
          : pair
      )
    );
  };

  // Handle image upload
  const handleImageUpload = (id: string, side: 'left' | 'right', imageUrl: string) => {
    setPairs(
      pairs.map(pair =>
        pair.id === id ? { ...pair, [side]: imageUrl } : pair
      )
    );
  };

  // Validate the form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!questionText.trim()) {
      newErrors.questionText = 'Question text is required';
    }

    // Check if all pairs have content
    const emptyPairs = pairs.some(pair => {
      return (pair.leftType === 'text' && !pair.left.trim()) || 
             (pair.rightType === 'text' && !pair.right.trim()) ||
             (pair.leftType === 'image' && !pair.left) ||
             (pair.rightType === 'image' && !pair.right);
    });
    
    if (emptyPairs) {
      newErrors.pairs = 'All pairs must have content on both sides';
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
          pairs
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

        {/* Pairs */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Matching Pairs <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleAddPair}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              + Add Pair
            </button>
          </div>
          
          {errors.pairs && <p className="mt-1 text-sm text-red-500">{errors.pairs}</p>}
          
          <div className="space-y-6 mt-3">
            {pairs.map((pair, index) => (
              <motion.div
                key={pair.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Pair {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => handleRemovePair(pair.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Side */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-gray-700">Left Side</label>
                      <button
                        type="button"
                        onClick={() => handleTypeToggle(pair.id, 'left')}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded"
                      >
                        {pair.leftType === 'text' ? 'Switch to Image' : 'Switch to Text'}
                      </button>
                    </div>
                    
                    {pair.leftType === 'text' ? (
                      <input
                        type="text"
                        value={pair.left}
                        onChange={(e) => handlePairTextChange(pair.id, 'left', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        placeholder="Enter left side text"
                      />
                    ) : (
                      <ImageUploader
                        initialImageUrl={pair.left}
                        onImageUpload={(imageUrl) => handleImageUpload(pair.id, 'left', imageUrl)}
                        onImageRemove={() => handlePairTextChange(pair.id, 'left', '')}
                        label="Left Side Image"
                      />
                    )}
                  </div>
                  
                  {/* Right Side */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-gray-700">Right Side</label>
                      <button
                        type="button"
                        onClick={() => handleTypeToggle(pair.id, 'right')}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded"
                      >
                        {pair.rightType === 'text' ? 'Switch to Image' : 'Switch to Text'}
                      </button>
                    </div>
                    
                    {pair.rightType === 'text' ? (
                      <input
                        type="text"
                        value={pair.right}
                        onChange={(e) => handlePairTextChange(pair.id, 'right', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        placeholder="Enter right side text"
                      />
                    ) : (
                      <ImageUploader
                        initialImageUrl={pair.right}
                        onImageUpload={(imageUrl) => handleImageUpload(pair.id, 'right', imageUrl)}
                        onImageRemove={() => handlePairTextChange(pair.id, 'right', '')}
                        label="Right Side Image"
                      />
                    )}
                  </div>
                </div>
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

export default MatchingQuestionForm;
