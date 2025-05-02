// src/components/admin/OrderingQuestionForm.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ImageUploader from '../common/ImageUploader';

interface OrderingItem {
  id: string;
  text: string;
  correctPosition: number;
  imageUrl?: string;
}

interface OrderingQuestionFormProps {
  initialData?: {
    questionText: string;
    items: OrderingItem[];
  };
  onSubmit: (data: {
    questionText: string;
    questionData: {
      items: OrderingItem[];
    };
  }) => void;
  onCancel: () => void;
}

const OrderingQuestionForm = ({
  initialData,
  onSubmit,
  onCancel
}: OrderingQuestionFormProps) => {
  const [questionText, setQuestionText] = useState(initialData?.questionText || '');
  const [items, setItems] = useState<OrderingItem[]>(
    initialData?.items || [
      { id: crypto.randomUUID(), text: '', correctPosition: 1, imageUrl: undefined },
      { id: crypto.randomUUID(), text: '', correctPosition: 2, imageUrl: undefined }
    ]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Add a new item
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        text: '',
        correctPosition: items.length + 1,
        imageUrl: undefined
      }
    ]);
  };

  // Remove an item
  const handleRemoveItem = (id: string) => {
    if (items.length <= 2) {
      toast.error('Ordering questions must have at least 2 items');
      return;
    }
    
    // Get the position of the item to remove
    const itemToRemove = items.find(item => item.id === id);
    if (!itemToRemove) return;
    
    const removedPosition = itemToRemove.correctPosition;
    
    // Remove the item and update positions
    const updatedItems = items
      .filter(item => item.id !== id)
      .map(item => {
        if (item.correctPosition > removedPosition) {
          return { ...item, correctPosition: item.correctPosition - 1 };
        }
        return item;
      });
    
    setItems(updatedItems);
  };

  // Update item text
  const handleItemTextChange = (id: string, text: string) => {
    setItems(
      items.map(item =>
        item.id === id ? { ...item, text } : item
      )
    );
  };

  // Update item position
  const handlePositionChange = (id: string, position: number) => {
    // Find the item that currently has this position
    const itemWithPosition = items.find(item => item.correctPosition === position);
    const currentItem = items.find(item => item.id === id);
    
    if (!currentItem || position < 1 || position > items.length) return;
    
    const currentPosition = currentItem.correctPosition;
    
    // Swap positions
    setItems(
      items.map(item => {
        if (item.id === id) {
          return { ...item, correctPosition: position };
        }
        if (itemWithPosition && item.id === itemWithPosition.id) {
          return { ...item, correctPosition: currentPosition };
        }
        return item;
      })
    );
  };

  // Handle image upload
  const handleImageUpload = (id: string, imageUrl: string) => {
    setItems(
      items.map(item =>
        item.id === id ? { ...item, imageUrl } : item
      )
    );
  };

  // Handle image remove
  const handleImageRemove = (id: string) => {
    setItems(
      items.map(item =>
        item.id === id ? { ...item, imageUrl: undefined } : item
      )
    );
  };

  // Validate the form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!questionText.trim()) {
      newErrors.questionText = 'Question text is required';
    }

    // Check if all items have text
    const emptyItems = items.some(item => !item.text.trim());
    if (emptyItems) {
      newErrors.itemText = 'All items must have text';
    }

    // Check if positions are unique and valid
    const positions = items.map(item => item.correctPosition);
    const uniquePositions = new Set(positions);
    if (uniquePositions.size !== items.length) {
      newErrors.positions = 'Each item must have a unique position';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // Sort items by position before submitting
      const sortedItems = [...items].sort((a, b) => a.correctPosition - b.correctPosition);
      
      onSubmit({
        questionText,
        questionData: {
          items: sortedItems
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

        {/* Items */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Items <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              + Add Item
            </button>
          </div>
          
          {errors.itemText && <p className="mt-1 text-sm text-red-500">{errors.itemText}</p>}
          {errors.positions && <p className="mt-1 text-sm text-red-500">{errors.positions}</p>}
          
          <div className="space-y-4 mt-3">
            {items
              .sort((a, b) => a.correctPosition - b.correctPosition)
              .map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700 mr-2">Position:</span>
                      <select
                        value={item.correctPosition}
                        onChange={(e) => handlePositionChange(item.id, parseInt(e.target.value))}
                        className="px-2 py-1 rounded border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      >
                        {Array.from({ length: items.length }, (_, i) => i + 1).map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={`item-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                        Item Text <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id={`item-${item.id}`}
                        value={item.text}
                        onChange={(e) => handleItemTextChange(item.id, e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        placeholder="Enter item text"
                      />
                    </div>
                    
                    <div>
                      <ImageUploader
                        initialImageUrl={item.imageUrl}
                        onImageUpload={(imageUrl) => handleImageUpload(item.id, imageUrl)}
                        onImageRemove={() => handleImageRemove(item.id)}
                        label="Item Image (Optional)"
                      />
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

export default OrderingQuestionForm;
