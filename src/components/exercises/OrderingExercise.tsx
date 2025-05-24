// src/components/exercises/OrderingExercise.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, DragEndEvent, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { playSound } from '../../lib/utils/soundUtils';
import toast from 'react-hot-toast';

// Define types for the ordering exercise
export interface OrderingItem {
  id: string;
  text: string;
  correctPosition: number;
  imageUrl?: string;
}

export interface OrderingExerciseData {
  instructions: string;
  items: OrderingItem[];
}

interface OrderingExerciseProps {
  data: OrderingExerciseData;
  onComplete: (isCorrect: boolean, score: number) => void;
  showFeedback?: boolean;
  readOnly?: boolean;
  initialOrder?: string[];
}

// Sortable item component
const SortableItem = ({
  item,
  isCorrect,
  showFeedback,
  position
}: {
  item: OrderingItem;
  isCorrect?: boolean;
  showFeedback?: boolean;
  position: number;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Determine background color based on state
  let bgColor = "bg-white border-gray-300";

  if (showFeedback) {
    bgColor = isCorrect
      ? "bg-green-100 border-green-500"
      : "bg-red-100 border-red-500";
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-4 rounded-xl border-2 ${bgColor} cursor-grab shadow-md transition-colors duration-300 mb-3`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3">
          {position + 1}
        </div>

        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.text}
            className="w-12 h-12 object-cover rounded-lg mr-3"
          />
        )}

        <span className="text-lg font-medium flex-1">{item.text}</span>

        {showFeedback && (
          <div className="ml-2">
            {isCorrect ? (
              <span className="text-green-500 text-xl">✓</span>
            ) : (
              <span className="text-red-500 text-xl">✗</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Main component
const OrderingExercise = ({
  data,
  onComplete,
  showFeedback: initialShowFeedback = false,
  readOnly = false,
  initialOrder = []
}: OrderingExerciseProps) => {
  // Initialize items in a random order if no initial order is provided
  const [items, setItems] = useState<OrderingItem[]>(() => {
    if (initialOrder.length > 0) {
      return initialOrder.map(id => data.items.find(item => item.id === id)!);
    }

    // Shuffle items for initial state
    return [...data.items].sort(() => Math.random() - 0.5);
  });

  const [showFeedback, setShowFeedback] = useState(initialShowFeedback);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (readOnly || isSubmitted) return;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        playSound('click', 0.3);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Check if an item is in the correct position
  const isItemCorrect = (item: OrderingItem, index: number) => {
    return item.correctPosition === index;
  };

  // Handle submit
  const handleSubmit = () => {
    setIsSubmitted(true);
    setShowFeedback(true);

    // Calculate correctness
    const correctItems = items.filter((item, index) => isItemCorrect(item, index));
    const isAllCorrect = correctItems.length === items.length;

    // Calculate score
    const score = Math.round((correctItems.length / items.length) * 100);

    // Play appropriate sound
    if (isAllCorrect) {
      playSound('correct');
      toast.success('Perfect!', { duration: 2000 });
    } else {
      playSound('incorrect');
      toast('Check the order', { duration: 2000, icon: '🔄' });
    }

    onComplete(isAllCorrect, score);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 my-6">
      <h3 className="text-xl font-bold mb-2">Put in the correct order</h3>
      <p className="text-gray-600 mb-6">{data.instructions}</p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 mb-6">
            {items.map((item, index) => (
              <SortableItem
                key={item.id}
                item={item}
                isCorrect={isItemCorrect(item, index)}
                showFeedback={showFeedback}
                position={index}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {!showFeedback && (
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all duration-300 text-lg"
          >
            Check Order
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
              {items.every((item, index) => isItemCorrect(item, index))
                ? '🎉 Great job! The order is correct!'
                : '😊 Good try! Check the correct order below.'}
            </h3>

            {!items.every((item, index) => isItemCorrect(item, index)) && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-bold text-lg mb-2">Correct Order:</h4>
                <ol className="text-left list-decimal list-inside">
                  {[...data.items]
                    .sort((a, b) => a.correctPosition - b.correctPosition)
                    .map(item => (
                      <li key={item.id} className="mb-1">
                        {item.text}
                      </li>
                    ))
                  }
                </ol>
              </div>
            )}

            <button
              onClick={() => {
                setShowFeedback(false);
                setIsSubmitted(false);

                if (!items.every((item, index) => isItemCorrect(item, index))) {
                  // Reset to random order for retry
                  setItems([...data.items].sort(() => Math.random() - 0.5));
                }

                playSound('click');
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all duration-300 text-lg mt-4"
            >
              {items.every((item, index) => isItemCorrect(item, index)) ? 'Continue' : 'Try Again'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderingExercise;
