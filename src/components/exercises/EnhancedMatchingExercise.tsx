// src/components/exercises/EnhancedMatchingExercise.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
import { playSound, playEnhancedFeedback } from '../../lib/utils/soundUtils';
import { scrollToQuestion } from '../../lib/utils/scrollUtils';
import toast from 'react-hot-toast';
import AudioPlayer from '../common/AudioPlayer';

// Define types for the matching exercise
export interface MatchingItem {
  id: string;
  content: string;
  imageUrl?: string;
}

export interface MatchingExerciseData {
  sourceItems: MatchingItem[];
  targetItems: MatchingItem[];
  correctPairs: { sourceId: string; targetId: string }[];
}

interface EnhancedMatchingExerciseProps {
  data: MatchingExerciseData;
  onComplete: (isCorrect: boolean, score: number) => void;
  showFeedback?: boolean;
  readOnly?: boolean;
  initialMatches?: { sourceId: string; targetId: string }[];
  audioInstructions?: string; // URL to audio file with instructions
}

// Particle effect for correct matches
const MatchParticles = ({ isVisible, isCorrect }: { isVisible: boolean; isCorrect: boolean }) => {
  if (!isVisible) return null;

  const particleCount = 15;
  const color = isCorrect ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: particleCount }).map((_, index) => {
        const size = Math.random() * 8 + 4;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 60 + 20;
        const duration = Math.random() * 0.8 + 0.6;
        const delay = Math.random() * 0.3;

        return (
          <motion.div
            key={index}
            className={`absolute rounded-full ${color} opacity-80`}
            style={{
              width: size,
              height: size,
              top: '50%',
              left: '50%',
              x: '-50%',
              y: '-50%',
            }}
            initial={{ scale: 0 }}
            animate={{
              scale: [0, 1, 0],
              x: ['-50%', `-50% + ${Math.cos(angle) * distance}px`],
              y: ['-50%', `-50% + ${Math.sin(angle) * distance}px`],
            }}
            transition={{
              duration,
              delay,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </div>
  );
};

// Draggable source item component
const DraggableSourceItem = ({
  item,
  isMatched,
  isCorrect,
  showFeedback,
  justMatched,
  matchColor,
  isSelected,
  onClick
}: {
  item: MatchingItem;
  isMatched: boolean;
  isCorrect?: boolean;
  showFeedback?: boolean;
  justMatched?: boolean;
  matchColor?: { bg: string; border: string; text: string; line: string } | null;
  isSelected?: boolean;
  onClick?: () => void;
}) => {
  const controls = useAnimation();
  const [showParticles, setShowParticles] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled: showFeedback
  });

  // Animate when an item is just matched
  useEffect(() => {
    if (justMatched) {
      controls.start({
        scale: [1, 1.1, 1],
        transition: { duration: 0.5 }
      });

      // Show particles
      setShowParticles(true);
      const timer = setTimeout(() => setShowParticles(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [justMatched, controls]);

  // Determine background color and styles based on state
  let bgColor = "bg-white border-gray-300";
  let textColor = "text-gray-800";
  let shadowStyle = "shadow-md";

  if (showFeedback && isMatched) {
    bgColor = isCorrect
      ? "bg-green-100 border-green-500"
      : "bg-red-100 border-red-500";
    textColor = isCorrect ? "text-green-700" : "text-red-700";
    shadowStyle = isCorrect ? "shadow-green-200 shadow-lg" : "shadow-red-200 shadow-lg";
  } else if (isMatched && matchColor) {
    bgColor = `${matchColor.bg} ${matchColor.border}`;
    textColor = matchColor.text;
    shadowStyle = `shadow-${matchColor.border.split('-')[1]}-200 shadow-lg`;
  } else if (isDragging) {
    bgColor = "bg-yellow-100 border-yellow-500";
    shadowStyle = "shadow-yellow-200 shadow-xl";
  }

  // Drag indicator for source items that can be dragged
  const DragIndicator = () => {
    if (isMatched || showFeedback) return null;

    return (
      <div className="absolute -right-1 -top-1 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      </div>
    );
  };

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border-2 ${bgColor} cursor-grab ${shadowStyle} transition-colors duration-300 ${isDragging ? 'z-50' : 'z-10'} relative touch-none ${isSelected ? 'ring-2 sm:ring-4 ring-yellow-300' : ''}`}
      whileHover={{ scale: !isMatched && !showFeedback ? 1.03 : 1.01 }}
      whileTap={{ scale: !isMatched && !showFeedback ? 0.97 : 1 }}
      animate={controls}
      data-id={item.id}
      data-is-source="true"
      onClick={onClick}
    >
      <div className="flex items-center">
        {item.imageUrl && (
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex-shrink-0 overflow-hidden rounded-md sm:rounded-lg mr-2 sm:mr-3">
            <img
              src={item.imageUrl}
              alt={item.content}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <span className={`text-sm sm:text-base md:text-lg font-medium ${textColor} leading-tight`}>{item.content}</span>

        {/* Show checkmark or X for feedback */}
        {showFeedback && isMatched && (
          <div className="ml-auto">
            {isCorrect ? (
              <span className="text-green-500 text-lg sm:text-xl md:text-2xl">✓</span>
            ) : (
              <span className="text-red-500 text-lg sm:text-xl md:text-2xl">✗</span>
            )}
          </div>
        )}

        {/* Show arrow for selected item */}
        {isSelected && (
          <div className="ml-auto">
            <span className="text-yellow-500 text-lg sm:text-xl md:text-2xl">👈</span>
          </div>
        )}
      </div>

      {/* Drag indicator */}
      <DragIndicator />

      {/* Particle effects */}
      <MatchParticles
        isVisible={showParticles}
        isCorrect={isCorrect || false}
      />
    </motion.div>
  );
};

// Droppable target item component
const DroppableTargetItem = ({
  item,
  isMatched,
  isDropTarget,
  matchColor,
  isSelected,
  isPotentialMatch,
  onClick
}: {
  item: MatchingItem;
  isMatched: boolean;
  isDropTarget?: boolean;
  matchColor?: { bg: string; border: string; text: string; line: string } | null;
  isSelected?: boolean;
  isPotentialMatch?: boolean;
  onClick?: () => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: item.id,
    disabled: false // Allow dropping even if matched to support changing matches
  });

  // Determine background color and styles based on state
  let bgColor = "bg-white border-gray-300";
  let shadowStyle = "shadow-md";
  let ringStyle = "";

  if (isMatched && matchColor) {
    bgColor = `${matchColor.bg} ${matchColor.border}`;
    shadowStyle = `shadow-${matchColor.border.split('-')[1]}-200 shadow-lg`;
  } else if (isOver || isDropTarget) {
    bgColor = "bg-indigo-50 border-indigo-300";
    shadowStyle = "shadow-indigo-200 shadow-lg";
  } else if (isPotentialMatch && !isSelected) {
    ringStyle = "ring-2 ring-blue-300";
    bgColor = "bg-blue-50 border-blue-200";
  }

  // Get text color from match color
  const textColor = matchColor ? matchColor.text : "text-gray-800";

  return (
    <motion.div
      ref={setNodeRef}
      className={`p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border-2 ${bgColor} ${shadowStyle} transition-all duration-300 relative ${isSelected ? 'ring-2 sm:ring-4 ring-yellow-300' : ringStyle}`}
      whileHover={{ scale: !isMatched ? 1.01 : 1 }}
      data-id={item.id}
      data-is-source="false"
      onClick={onClick}
    >
      <div className="flex items-center">
        {item.imageUrl && (
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex-shrink-0 overflow-hidden rounded-md sm:rounded-lg mr-2 sm:mr-3">
            <img
              src={item.imageUrl}
              alt={item.content}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <span className={`text-sm sm:text-base md:text-lg font-medium ${textColor} leading-tight`}>{item.content}</span>

        {/* Show arrow for selected item */}
        {isSelected && (
          <div className="ml-auto">
            <span className="text-yellow-500 text-lg sm:text-xl md:text-2xl">👈</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// We've replaced the ConnectionLine component with a simpler arrow indicator

// Confetti effect for celebration
const SuccessConfetti = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: 100 }).map((_, index) => {
        const size = Math.random() * 10 + 5;
        const color = [
          'bg-blue-500',
          'bg-green-500',
          'bg-yellow-500',
          'bg-purple-500',
          'bg-pink-500',
        ][Math.floor(Math.random() * 5)];

        return (
          <motion.div
            key={index}
            className={`absolute rounded-full ${color}`}
            style={{
              width: size,
              height: size,
              top: '-5%',
              left: `${Math.random() * 100}%`,
            }}
            initial={{ y: -20, opacity: 0 }}
            animate={{
              y: `${100 + Math.random() * 20}vh`,
              x: Math.random() > 0.5
                ? `${Math.random() * 20}vw`
                : `-${Math.random() * 20}vw`,
              rotate: Math.random() * 360,
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: Math.random() * 2 + 2,
              ease: 'easeOut',
              delay: Math.random() * 0.5,
            }}
          />
        );
      })}
    </div>
  );
};

// Drag handle component for matched items
const DragHandle = ({ onClick }: { onClick: () => void }) => {
  return (
    <motion.div
      className="absolute -right-1 -top-1 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer"
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
      </svg>
    </motion.div>
  );
};

// Reset button component
const ResetButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <motion.button
      className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full p-2 flex items-center justify-center"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title="Reset all matches"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </motion.button>
  );
};

// Generate a palette of distinct colors for matches
const generateMatchColors = (count: number) => {
  // Predefined palette of visually distinct colors
  const colorPalette = [
    { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700', line: '#3b82f6' },
    { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-700', line: '#8b5cf6' },
    { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700', line: '#10b981' },
    { bg: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-700', line: '#f59e0b' },
    { bg: 'bg-pink-100', border: 'border-pink-500', text: 'text-pink-700', line: '#ec4899' },
    { bg: 'bg-cyan-100', border: 'border-cyan-500', text: 'text-cyan-700', line: '#06b6d4' },
    { bg: 'bg-indigo-100', border: 'border-indigo-500', text: 'text-indigo-700', line: '#6366f1' },
    { bg: 'bg-rose-100', border: 'border-rose-500', text: 'text-rose-700', line: '#f43f5e' },
    { bg: 'bg-lime-100', border: 'border-lime-500', text: 'text-lime-700', line: '#84cc16' },
    { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700', line: '#f97316' },
  ];

  // Return the needed number of colors, cycling through the palette if needed
  return Array.from({ length: count }, (_, i) => colorPalette[i % colorPalette.length]);
};

// Utility function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Main component
const EnhancedMatchingExercise = ({
  data,
  onComplete,
  showFeedback: initialShowFeedback = false,
  initialMatches = [],
  audioInstructions
}: EnhancedMatchingExerciseProps) => {
  const [matches, setMatches] = useState<{ sourceId: string; targetId: string }[]>(initialMatches);
  const [showFeedback, setShowFeedback] = useState(initialShowFeedback);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);
  const [justMatchedItem, setJustMatchedItem] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; isSource: boolean } | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Randomize items order only once on component mount to prevent memorization
  const [shuffledSourceItems] = useState(() => shuffleArray(data.sourceItems));
  const [shuffledTargetItems] = useState(() => shuffleArray(data.targetItems));

  // Log audio instructions for debugging
  useEffect(() => {
    if (audioInstructions) {
      console.log('EnhancedMatchingExercise: Audio instructions URL:', audioInstructions);

      // Validate the URL
      try {
        new URL(audioInstructions);
        setAudioError(null);
      } catch (e) {
        console.error('EnhancedMatchingExercise: Invalid audio URL:', audioInstructions, e);
        setAudioError('Invalid audio URL');
      }
    }
  }, [audioInstructions]);

  // Generate colors for matches
  const matchColors = useMemo(() => generateMatchColors(data.sourceItems.length), [data.sourceItems.length]);

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Handle drag start
  const handleDragStart = () => {
    playSound('click', 0.2);
  };

  // Handle drag over for visual feedback
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setHoveredTargetId(over.id as string);
    } else {
      setHoveredTargetId(null);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setHoveredTargetId(null);

    if (over && active.id !== over.id) {
      const sourceId = active.id as string;
      const targetId = over.id as string;

      // Check if source item is already matched
      const existingMatchIndex = matches.findIndex(match => match.sourceId === sourceId);

      // Set this as the just matched item for animation
      setJustMatchedItem(sourceId);
      setTimeout(() => setJustMatchedItem(null), 1000);

      // We're not tracking new matches for connection lines anymore

      if (existingMatchIndex !== -1) {
        // Update existing match
        const updatedMatches = [...matches];
        updatedMatches[existingMatchIndex] = { sourceId, targetId };
        setMatches(updatedMatches);
      } else {
        // Create new match
        setMatches([...matches, { sourceId, targetId }]);
      }

      // Check if the match is correct
      const isCorrect = data.correctPairs.some(
        pair => pair.sourceId === sourceId && pair.targetId === targetId
      );

      // Play appropriate sound
      if (isCorrect) {
        playSound('correct');
        // Reduce toast frequency - only show for every few correct matches
        if (matches.length % 2 === 0) {
          toast.success('Great!', { duration: 1500, icon: '✓' });
        }
      } else {
        playSound('incorrect');
        // Brief feedback without excessive styling
        toast('Try again', { duration: 1500, icon: '🔄' });
      }

      // Check if all items are matched
      if (matches.length + 1 >= data.sourceItems.length) {
        const updatedMatches = existingMatchIndex !== -1
          ? [...matches.slice(0, existingMatchIndex), { sourceId, targetId }, ...matches.slice(existingMatchIndex + 1)]
          : [...matches, { sourceId, targetId }];

        // Calculate score
        const correctMatches = updatedMatches.filter(match => {
          const correctPair = data.correctPairs.find(pair => pair.sourceId === match.sourceId);
          return correctPair && correctPair.targetId === match.targetId;
        });

        const score = Math.round((correctMatches.length / data.sourceItems.length) * 100);
        const allCorrect = correctMatches.length === data.sourceItems.length;

        // Delay showing feedback to allow for animation
        setTimeout(() => {
          setShowFeedback(true);

          // Show confetti for perfect score
          if (allCorrect) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
          }
        }, 800);

        // Play enhanced audio feedback
        if (allCorrect) {
          playEnhancedFeedback('correct');
        } else {
          playEnhancedFeedback('incorrect');
        }

        onComplete(allCorrect, score);
      }
    }
  };

  // Handle item click for tap-to-match interaction
  const handleItemClick = (itemId: string, isSource: boolean) => {
    // Don't allow interaction when feedback is shown
    if (showFeedback) return;

    // Check if this item is already matched
    const isItemMatched = isSource
      ? matches.some(match => match.sourceId === itemId)
      : matches.some(match => match.targetId === itemId);

    // If the item is already matched, select it to allow changing the match
    if (isItemMatched) {
      // If it's already selected, deselect it
      if (selectedItem && selectedItem.id === itemId && selectedItem.isSource === isSource) {
        setSelectedItem(null);
        return;
      }

      // Otherwise, select it to allow changing its match
      setSelectedItem({ id: itemId, isSource });
      playSound('click', 0.2);

      // If it's a source item, remove its existing match
      if (isSource) {
        setMatches(prev => prev.filter(match => match.sourceId !== itemId));
      }
      return;
    }

    // If no item is selected, select this one
    if (!selectedItem) {
      setSelectedItem({ id: itemId, isSource });
      playSound('click', 0.2);
      return;
    }

    // If the same item is clicked again, deselect it
    if (selectedItem.id === itemId && selectedItem.isSource === isSource) {
      setSelectedItem(null);
      return;
    }

    // If an item from the same side is clicked, switch selection
    if (selectedItem.isSource === isSource) {
      setSelectedItem({ id: itemId, isSource });
      playSound('click', 0.2);
      return;
    }

    // At this point, we have a source and target selected, so create a match
    const sourceId = isSource ? itemId : selectedItem.id;
    const targetId = isSource ? selectedItem.id : itemId;

    // Check if source item is already matched
    const existingMatchIndex = matches.findIndex(match => match.sourceId === sourceId);

    // Set this as the just matched item for animation
    setJustMatchedItem(sourceId);
    setTimeout(() => setJustMatchedItem(null), 1000);

    // We're not tracking new matches for connection lines anymore

    if (existingMatchIndex !== -1) {
      // Update existing match
      const updatedMatches = [...matches];
      updatedMatches[existingMatchIndex] = { sourceId, targetId };
      setMatches(updatedMatches);
    } else {
      // Create new match
      setMatches([...matches, { sourceId, targetId }]);
    }

    // Check if the match is correct
    const isCorrect = data.correctPairs.some(
      pair => pair.sourceId === sourceId && pair.targetId === targetId
    );

    // Play appropriate sound
    if (isCorrect) {
      playSound('correct');
      // Reduce toast frequency - only show for every few correct matches
      if (matches.length % 2 === 0) {
        toast.success('Great!', { duration: 1500, icon: '✓' });
      }
    } else {
      playSound('incorrect');
      // Brief feedback without excessive styling
      toast('Try again', { duration: 1500, icon: '🔄' });
    }

    // Reset selection
    setSelectedItem(null);

    // Check if all items are matched
    if (matches.length + 1 >= data.sourceItems.length) {
      const updatedMatches = existingMatchIndex !== -1
        ? [...matches.slice(0, existingMatchIndex), { sourceId, targetId }, ...matches.slice(existingMatchIndex + 1)]
        : [...matches, { sourceId, targetId }];

      // Calculate score
      const correctMatches = updatedMatches.filter(match => {
        const correctPair = data.correctPairs.find(pair => pair.sourceId === match.sourceId);
        return correctPair && correctPair.targetId === match.targetId;
      });

      const score = Math.round((correctMatches.length / data.sourceItems.length) * 100);
      const allCorrect = correctMatches.length === data.sourceItems.length;

      // Delay showing feedback to allow for animation
      setTimeout(() => {
        setShowFeedback(true);

        // Show confetti for perfect score
        if (allCorrect) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      }, 800);

      // Play enhanced audio feedback
      if (allCorrect) {
        playEnhancedFeedback('correct');
      } else {
        playEnhancedFeedback('incorrect');
      }

      onComplete(allCorrect, score);
    }
  };

  // Check if a match is correct
  const isMatchCorrect = (sourceId: string, targetId: string) => {
    return data.correctPairs.some(
      pair => pair.sourceId === sourceId && pair.targetId === targetId
    );
  };

  // Get all source items that are not yet matched (using shuffled order)
  const getUnmatchedSourceItems = () => {
    return shuffledSourceItems.filter(item =>
      !matches.some(match => match.sourceId === item.id)
    );
  };

  // Get all target items that are not yet matched (using shuffled order)
  const getUnmatchedTargetItems = () => {
    return shuffledTargetItems.filter(item =>
      !matches.some(match => match.targetId === item.id)
    );
  };

  // Reset all matches
  const handleReset = () => {
    if (showFeedback) return; // Don't allow reset after feedback is shown

    setShowResetConfirmation(true);
  };

  // Confirm reset
  const confirmReset = () => {
    setMatches([]);
    setShowResetConfirmation(false);
    playSound('click');
    // No toast needed for reset - visual feedback is sufficient
  };

  // Cancel reset
  const cancelReset = () => {
    setShowResetConfirmation(false);
  };

  // Remove a specific match
  const removeMatch = (sourceId: string) => {
    setMatches(prev => prev.filter(match => match.sourceId !== sourceId));
    playSound('click', 0.3);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 my-6 relative overflow-hidden">
      <motion.h3
        className="text-xl font-bold mb-4 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Match the items
      </motion.h3>

      {/* Instructions */}
      {!showFeedback && (
        <motion.div
          className="bg-blue-100 p-3 rounded-lg mb-4 text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {selectedItem ? (
            <p className="text-blue-700 font-medium">
              Now tap on a {selectedItem.isSource ? "match" : "item"} for the highlighted {selectedItem.isSource ? "item" : "match"}
            </p>
          ) : (
            <p className="text-blue-700 font-medium">
              Tap on any item to start matching
            </p>
          )}
        </motion.div>
      )}

      {/* Audio Instructions */}
      {audioInstructions && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <AudioPlayer
            audioUrl={audioInstructions}
            autoPlay={false}
            label="Audio Instructions"
            className="w-full"
          />
        </motion.div>
      )}

      {/* Reset button */}
      {matches.length > 0 && !showFeedback && (
        <ResetButton onClick={handleReset} />
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <motion.div
          className="flex flex-col gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Unmatched Items Section */}
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:gap-8 lg:gap-12">
            {/* Unmatched Source Items (Left Side) */}
            <div className="flex flex-col space-y-2 sm:space-y-3 md:space-y-4 bg-blue-50 p-2 sm:p-3 md:p-4 rounded-lg border-2 border-blue-200">
              <motion.h4
                className="text-sm sm:text-base md:text-lg font-semibold text-center mb-1 sm:mb-2 text-blue-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <span className="hidden sm:inline">📝 Items to Match</span>
                <span className="sm:hidden">📝 Items</span>
              </motion.h4>

              <AnimatePresence>
                {getUnmatchedSourceItems().map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                  >
                    <DraggableSourceItem
                      item={item}
                      isMatched={false}
                      isSelected={selectedItem?.id === item.id && selectedItem?.isSource === true}
                      onClick={() => handleItemClick(item.id, true)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Unmatched Target Items (Right Side) */}
            <div className="flex flex-col space-y-2 sm:space-y-3 md:space-y-4 bg-green-50 p-2 sm:p-3 md:p-4 rounded-lg border-2 border-green-200">
              <motion.h4
                className="text-sm sm:text-base md:text-lg font-semibold text-center mb-1 sm:mb-2 text-green-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <span className="hidden sm:inline">🎯 Match Options</span>
                <span className="sm:hidden">🎯 Options</span>
              </motion.h4>

              <AnimatePresence>
                {getUnmatchedTargetItems().map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                  >
                    <DroppableTargetItem
                      item={item}
                      isMatched={false}
                      isDropTarget={hoveredTargetId === item.id}
                      isSelected={selectedItem?.id === item.id && selectedItem?.isSource === false}
                      isPotentialMatch={selectedItem !== null && selectedItem.isSource === true}
                      onClick={() => handleItemClick(item.id, false)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Matched Pairs Section */}
          {matches.length > 0 && (
            <div className="mt-8">
              <motion.h4
                className="text-lg font-semibold text-center mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                Your Matches
              </motion.h4>

              <div className="space-y-6">
                {matches.map((match, index) => {
                  const sourceItem = data.sourceItems.find(item => item.id === match.sourceId);
                  const targetItem = data.targetItems.find(item => item.id === match.targetId);

                  if (!sourceItem || !targetItem) return null;

                  const isCorrect = isMatchCorrect(match.sourceId, match.targetId);
                  const sourceIndex = data.sourceItems.findIndex(item => item.id === match.sourceId);
                  const itemColor = sourceIndex >= 0 ? matchColors[sourceIndex] : null;

                  return (
                    <motion.div
                      key={`${match.sourceId}-${match.targetId}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                      className="relative"
                    >
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 relative">
                        {/* Source Item */}
                        <div className="relative">
                          <DraggableSourceItem
                            item={sourceItem}
                            isMatched={true}
                            isCorrect={showFeedback ? isCorrect : undefined}
                            showFeedback={showFeedback}
                            justMatched={justMatchedItem === match.sourceId}
                            matchColor={itemColor}
                            isSelected={selectedItem?.id === match.sourceId && selectedItem?.isSource === true}
                            onClick={() => handleItemClick(match.sourceId, true)}
                          />

                          {/* Add drag handle for removing matches */}
                          {!showFeedback && (
                            <DragHandle onClick={() => removeMatch(match.sourceId)} />
                          )}
                        </div>

                        {/* Target Item */}
                        <div>
                          <DroppableTargetItem
                            item={targetItem}
                            isMatched={true}
                            isDropTarget={hoveredTargetId === match.targetId}
                            matchColor={itemColor}
                            isSelected={selectedItem?.id === match.targetId && selectedItem?.isSource === false}
                            onClick={() => handleItemClick(match.targetId, false)}
                          />
                        </div>

                        {/* Connection arrow between matched items */}
                        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden sm:block">
                          <div
                            className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full ${
                              showFeedback
                                ? isCorrect
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                                : itemColor
                                  ? itemColor.bg.replace('bg-', 'bg-').replace('-100', '-500')
                                  : 'bg-blue-500'
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* We're now using the arrow indicator instead of connection lines */}
      </DndContext>

      {/* Confetti effect for perfect score */}
      <AnimatePresence>
        {showConfetti && <SuccessConfetti />}
      </AnimatePresence>

      {/* Feedback Message */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-8 text-center"
          >
            <motion.h3
              className="text-xl font-bold mb-2"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              {matches.every(
                ({ sourceId, targetId }) => isMatchCorrect(sourceId, targetId)
              )
                ? '🎉 Great job! All matches are correct!'
                : '😊 Good try! Some matches need adjustment.'}
            </motion.h3>
            <motion.button
              onClick={() => {
                setShowFeedback(false);
                playSound('click');

                // Scroll to top of question for better UX
                scrollToQuestion();
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all duration-300 text-lg mt-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Continue
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Dialog */}
      <AnimatePresence>
        {showResetConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={cancelReset}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Reset all matches?</h3>
              <p className="text-gray-600 mb-6">
                This will remove all your current matches. Are you sure you want to start over?
              </p>
              <div className="flex justify-end space-x-3">
                <motion.button
                  onClick={cancelReset}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={confirmReset}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Reset
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Audio Button (only show if there are audio instructions) */}
      {audioInstructions && (
        <>
          <motion.button
            onClick={() => setShowAudioPlayer(true)}
            className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg z-50"
            aria-label="Play Audio Instructions"
            title="Play Audio Instructions"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.465a5 5 0 001.06-7.072l5.658-5.657a1 1 0 011.414 0l5.657 5.657a1 1 0 010 1.414l-5.657 5.657a1 1 0 01-1.414 0l-5.657-5.657a1 1 0 010-1.414z" />
            </svg>
          </motion.button>

          {/* Audio Instructions Modal */}
          <AnimatePresence>
            {showAudioPlayer && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={() => setShowAudioPlayer(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold">Audio Instructions</h3>
                    <button
                      onClick={() => setShowAudioPlayer(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {audioError ? (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                      <p className="font-bold">Error loading audio</p>
                      <p className="text-sm">{audioError}</p>
                      <p className="text-xs mt-2">URL: {audioInstructions}</p>
                    </div>
                  ) : (
                    <AudioPlayer
                      audioUrl={audioInstructions || ''}
                      autoPlay={true}
                      showLabel={false}
                    />
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(EnhancedMatchingExercise);
