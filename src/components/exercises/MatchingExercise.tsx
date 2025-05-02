import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { playSound } from '../../lib/utils/soundUtils';
import toast from 'react-hot-toast';
import AudioPlayer from '../common/AudioPlayer';

// Define types for the matching exercise
export interface MatchingExerciseItem {
  id: string;
  content: string;
  imageUrl?: string;
}

export interface MatchingExerciseData {
  sourceItems: MatchingExerciseItem[];
  targetItems: MatchingExerciseItem[];
  correctPairs: { sourceId: string; targetId: string }[];
}

interface MatchingExerciseProps {
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

// Confetti animation component for celebrations
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

// Connection line between matched items
const ConnectionLine = ({
  sourceId,
  targetId,
  isCorrect,
  showFeedback,
  isAnimating = false,
  matchColor
}: {
  sourceId: string;
  targetId: string;
  isCorrect: boolean;
  showFeedback: boolean;
  isAnimating?: boolean;
  matchColor?: { bg: string; border: string; text: string; line: string } | null;
}) => {
  const [sourceRect, setSourceRect] = useState<DOMRect | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const controls = useAnimation();

  // Animate the connection line when it's first created
  useEffect(() => {
    if (isAnimating && pathRef.current) {
      controls.start({
        pathLength: 1,
        transition: { duration: 0.6, ease: "easeOut" }
      });
    }
  }, [isAnimating, controls]);

  useEffect(() => {
    const updateRects = () => {
      const sourceElement = document.querySelector(`[data-id="${sourceId}"]`);
      const targetElement = document.querySelector(`[data-id="${targetId}"]`);

      if (sourceElement && targetElement) {
        setSourceRect(sourceElement.getBoundingClientRect());
        setTargetRect(targetElement.getBoundingClientRect());
      }
    };

    updateRects();
    window.addEventListener('resize', updateRects);

    return () => {
      window.removeEventListener('resize', updateRects);
    };
  }, [sourceId, targetId]);

  if (!sourceRect || !targetRect) return null;

  // Calculate line coordinates
  const sourceX = sourceRect.right;
  const sourceY = sourceRect.top + sourceRect.height / 2;
  const targetX = targetRect.left;
  const targetY = targetRect.top + targetRect.height / 2;

  // Calculate control points for curved path
  const curveOffset = Math.min(80, Math.abs(targetX - sourceX) / 2);

  // Create path for curved line
  const path = `M ${sourceX} ${sourceY} C ${sourceX + curveOffset} ${sourceY}, ${targetX - curveOffset} ${targetY}, ${targetX} ${targetY}`;

  // Determine line color based on correctness or match color
  let lineColor;
  let lineWidth = 5; // Thicker lines for children
  let dashArray = "0";

  if (showFeedback) {
    lineColor = isCorrect ? '#22c55e' : '#ef4444'; // Green or red
    lineWidth = 6;
  } else if (matchColor) {
    lineColor = matchColor.line;
  } else {
    lineColor = '#3b82f6'; // Default blue
  }

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <motion.path
        ref={pathRef}
        d={path}
        stroke={lineColor}
        strokeWidth={lineWidth}
        fill="none"
        strokeDasharray={dashArray}
        initial={isAnimating ? { pathLength: 0 } : { pathLength: 1 }}
        animate={controls}
        filter={showFeedback && isCorrect ? "url(#glow)" : ""}
      />

      {/* Animated dots along the path for children */}
      {(showFeedback || isAnimating) && (
        <motion.circle
          r={8} // Larger dots for children
          fill={lineColor}
          filter="drop-shadow(0 0 3px rgba(255,255,255,0.8))"
          initial={{ offsetDistance: "0%" }}
          animate={{
            offsetDistance: ["0%", "100%"],
            scale: [1, 1.3, 1]
          }}
          transition={{
            offsetDistance: {
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            },
            scale: {
              duration: 0.5,
              repeat: Infinity,
              repeatType: "reverse"
            }
          }}
          style={{
            offsetPath: `path("${path}")`,
            offsetRotate: "0deg"
          }}
        />
      )}
    </svg>
  );
};







// Draggable source item component
const DraggableSourceItem = ({
  item,
  isMatched,
  isCorrect,
  showFeedback,
  justMatched,
  matchColor
}: {
  item: MatchingExerciseItem;
  isMatched: boolean;
  isCorrect?: boolean;
  showFeedback?: boolean;
  justMatched?: boolean;
  matchColor?: { bg: string; border: string; text: string; line: string } | null;
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
      className={`p-4 rounded-xl border-2 ${bgColor} cursor-grab ${shadowStyle} transition-colors duration-300 ${isDragging ? 'z-50' : 'z-10'} relative touch-none`}
      whileHover={{ scale: !isMatched && !showFeedback ? 1.03 : 1.01 }}
      whileTap={{ scale: !isMatched && !showFeedback ? 0.97 : 1 }}
      animate={controls}
      data-id={item.id}
      data-is-source="true"
    >
      <div className="flex items-center">
        {item.imageUrl && (
          <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-lg mr-3">
            <img
              src={item.imageUrl}
              alt={item.content}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <span className={`text-lg font-medium ${textColor}`}>{item.content}</span>

        {/* Show checkmark or X for feedback */}
        {showFeedback && isMatched && (
          <div className="ml-auto">
            {isCorrect ? (
              <span className="text-green-500 text-2xl">✓</span>
            ) : (
              <span className="text-red-500 text-2xl">✗</span>
            )}
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
  matchColor
}: {
  item: MatchingExerciseItem;
  isMatched: boolean;
  isDropTarget?: boolean;
  matchColor?: { bg: string; border: string; text: string; line: string } | null;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: item.id,
    disabled: false // Allow dropping even if matched to support changing matches
  });

  // Determine background color and styles based on state
  let bgColor = "bg-white border-gray-300";
  let shadowStyle = "shadow-md";

  if (isMatched && matchColor) {
    bgColor = `${matchColor.bg} ${matchColor.border}`;
    shadowStyle = `shadow-${matchColor.border.split('-')[1]}-200 shadow-lg`;
  } else if (isOver || isDropTarget) {
    bgColor = "bg-indigo-50 border-indigo-300";
    shadowStyle = "shadow-indigo-200 shadow-lg";
  }

  // Get text color from match color
  const textColor = matchColor ? matchColor.text : "text-gray-800";

  return (
    <motion.div
      ref={setNodeRef}
      className={`p-4 rounded-xl border-2 ${bgColor} ${shadowStyle} transition-all duration-300 relative`}
      whileHover={{ scale: !isMatched ? 1.01 : 1 }}
      data-id={item.id}
      data-is-source="false"
    >
      <div className="flex items-center">
        {item.imageUrl && (
          <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-lg mr-3">
            <img
              src={item.imageUrl}
              alt={item.content}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <span className={`text-lg font-medium ${textColor}`}>{item.content}</span>
      </div>
    </motion.div>
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

const MatchingExercise: React.FC<MatchingExerciseProps> = ({
  data,
  onComplete,
  showFeedback: initialShowFeedback = false,
  initialMatches = [],
  audioInstructions
}) => {
  const [matches, setMatches] = useState<{ sourceId: string; targetId: string }[]>(initialMatches);
  const [showFeedback, setShowFeedback] = useState(initialShowFeedback);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);
  const [justMatchedItem, setJustMatchedItem] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [newMatchIds, setNewMatchIds] = useState<Set<string>>(new Set());
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; isSource: boolean } | null>(null);

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

      // Track new match for connection line animation
      setNewMatchIds(prev => {
        const newSet = new Set(prev);
        newSet.add(`${sourceId}-${targetId}`);
        return newSet;
      });

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
        toast.success('Correct match!', {
          icon: '✓',
          style: {
            borderRadius: '10px',
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #10b981'
          }
        });
      } else {
        playSound('incorrect');
        toast.error('Try again!', {
          icon: '✗',
          style: {
            borderRadius: '10px',
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #ef4444'
          }
        });
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

        // Play celebration sound if all correct
        if (allCorrect) {
          playSound('celebration');
        } else {
          playSound('complete');
        }

        onComplete(allCorrect, score);
      }
    }
  };

  // Handle item click for tap-to-match interaction
  const handleItemClick = (itemId: string, isSource: boolean) => {
    // Don't allow interaction when feedback is shown
    if (showFeedback) return;

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

    // Create a new match object to track for animation
    const newMatch = { sourceId, targetId };

    if (existingMatchIndex !== -1) {
      // Update existing match
      const updatedMatches = [...matches];
      updatedMatches[existingMatchIndex] = newMatch;
      setMatches(updatedMatches);
    } else {
      // Create new match
      setMatches([...matches, newMatch]);
    }

    // Check if the match is correct
    const isCorrect = data.correctPairs.some(
      pair => pair.sourceId === sourceId && pair.targetId === targetId
    );

    // Play appropriate sound
    if (isCorrect) {
      playSound('correct');
      toast.success('Correct match!', {
        icon: '✓',
        style: {
          borderRadius: '10px',
          background: '#ecfdf5',
          color: '#065f46',
          border: '1px solid #10b981'
        }
      });
    } else {
      playSound('incorrect');
      toast.error('Try again!', {
        icon: '✗',
        style: {
          borderRadius: '10px',
          background: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #ef4444'
        }
      });
    }

    // Reset selection
    setSelectedItem(null);

    // Check if all items are matched
    if (matches.length + 1 >= data.sourceItems.length) {
      const updatedMatches = existingMatchIndex !== -1
        ? [...matches.slice(0, existingMatchIndex), newMatch, ...matches.slice(existingMatchIndex + 1)]
        : [...matches, newMatch];

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

      // Play celebration sound if all correct
      if (allCorrect) {
        playSound('celebration');
      } else {
        playSound('complete');
      }

      onComplete(allCorrect, score);
    }
  };

  // Reset all matches
  const handleReset = () => {
    if (showFeedback) return; // Don't allow reset after feedback is shown

    setShowResetConfirmation(true);
  };

  // Confirm reset
  const confirmReset = () => {
    setMatches([]);
    setNewMatchIds(new Set());
    setShowResetConfirmation(false);
    playSound('click');
    toast.success('All matches have been reset', {
      icon: '🔄',
      style: {
        borderRadius: '10px',
        background: '#eff6ff',
        color: '#1e40af',
        border: '1px solid #3b82f6'
      }
    });
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

  // Find target item for a source
  const getMatchedTargetId = (sourceId: string) => {
    const match = matches.find(m => m.sourceId === sourceId);
    return match ? match.targetId : null;
  };

  // Check if a match is correct
  const isMatchCorrect = (sourceId: string, targetId: string) => {
    return data.correctPairs.some(
      pair => pair.sourceId === sourceId && pair.targetId === targetId
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 my-4 relative">
      <h3 className="text-xl font-bold mb-4 text-center">Match the items</h3>

      {/* Instructions */}
      {!showFeedback && (
        <div className="bg-blue-100 p-3 rounded-lg mb-4 text-center">
          {selectedItem ? (
            <p className="text-blue-700 font-medium">
              Now tap on a {selectedItem.isSource ? "match" : "item"} for the highlighted {selectedItem.isSource ? "item" : "match"}
            </p>
          ) : (
            <p className="text-blue-700 font-medium">
              Tap on any item to start matching
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source Items (Left Side) */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-semibold text-center mb-2">Items</h4>
          {data.sourceItems.map((item) => {
            const matchedTargetId = getMatchedTargetId(item.id);
            const isMatched = !!matchedTargetId;
            const isSelected = selectedItem?.id === item.id && selectedItem?.isSource === true;
            const isCorrect = isMatched && showFeedback &&
              isMatchCorrect(item.id, matchedTargetId);

            // Determine background color based on state
            let bgColor = "bg-white border-gray-300";
            let shadowStyle = "shadow-md";

            if (showFeedback && isMatched) {
              bgColor = isCorrect
                ? "bg-green-100 border-green-500"
                : "bg-red-100 border-red-500";
              shadowStyle = isCorrect ? "shadow-green-200 shadow-lg" : "shadow-red-200 shadow-lg";
            } else if (isMatched) {
              bgColor = "bg-blue-100 border-blue-500";
              shadowStyle = "shadow-blue-200 shadow-lg";
            } else if (isSelected) {
              bgColor = "bg-yellow-100 border-yellow-500";
              shadowStyle = "shadow-yellow-200 shadow-xl";
            }

            return (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`p-4 rounded-xl border-2 ${bgColor} cursor-pointer ${shadowStyle} transition-all duration-300 ${isSelected ? 'ring-4 ring-yellow-300' : ''}`}
                onClick={() => handleItemClick(item.id, true)}
                data-id={item.id}
              >
                <div className="flex items-center">
                  {item.imageUrl && (
                    <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg mr-3">
                      <img
                        src={item.imageUrl}
                        alt={item.content}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <span className="text-lg font-medium">{item.content}</span>

                  {/* Show visual indicator for selected item */}
                  {isSelected && (
                    <div className="ml-auto">
                      <span className="text-yellow-500 text-2xl">👈</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Target Items (Right Side) */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-semibold text-center mb-2">Matches</h4>
          {data.targetItems.map((item) => {
            const isMatched = matches.some(match => match.targetId === item.id);
            const matchingSourceId = matches.find(match => match.targetId === item.id)?.sourceId;
            const isCorrect = matchingSourceId && showFeedback &&
              isMatchCorrect(matchingSourceId, item.id);
            const isSelected = selectedItem?.id === item.id && selectedItem?.isSource === false;
            const canBeSelected = !showFeedback;

            // Determine background color based on state
            let bgColor = "bg-white border-gray-300";
            let shadowStyle = "shadow-md";

            if (showFeedback && isMatched) {
              bgColor = isCorrect
                ? "bg-green-100 border-green-500"
                : "bg-red-100 border-red-500";
              shadowStyle = isCorrect ? "shadow-green-200 shadow-lg" : "shadow-red-200 shadow-lg";
            } else if (isMatched) {
              bgColor = "bg-blue-100 border-blue-500";
              shadowStyle = "shadow-blue-200 shadow-lg";
            } else if (isSelected) {
              bgColor = "bg-yellow-100 border-yellow-500";
              shadowStyle = "shadow-yellow-200 shadow-xl";
            } else if (canBeSelected && selectedItem) {
              bgColor = "bg-indigo-50 border-indigo-300";
              shadowStyle = "shadow-indigo-100";
            }

            return (
              <motion.div
                key={item.id}
                whileHover={{ scale: canBeSelected ? 1.03 : 1.01 }}
                whileTap={{ scale: canBeSelected ? 0.97 : 1 }}
                className={`p-4 rounded-xl border-2 ${bgColor} cursor-pointer ${shadowStyle} transition-all duration-300 ${isSelected ? 'ring-4 ring-yellow-300' : canBeSelected && selectedItem ? 'ring-2 ring-indigo-200' : ''}`}
                onClick={() => handleItemClick(item.id, false)}
                data-id={item.id}
              >
                <div className="flex items-center">
                  {item.imageUrl && (
                    <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg mr-3">
                      <img
                        src={item.imageUrl}
                        alt={item.content}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <span className="text-lg font-medium">{item.content}</span>

                  {/* Show visual indicator for selected or potential match */}
                  {isSelected && (
                    <div className="ml-auto">
                      <span className="text-yellow-500 text-2xl">👈</span>
                    </div>
                  )}
                  {canBeSelected && selectedItem && !isSelected && !isMatched && (
                    <div className="ml-auto">
                      <span className="text-indigo-500 text-2xl">?</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Connection lines between matched items */}
      {matches.map(({ sourceId, targetId }) => {
        const isCorrect = isMatchCorrect(sourceId, targetId);
        const isNewMatch = !!(newMatch && newMatch.sourceId === sourceId && newMatch.targetId === targetId);

        return (
          <ConnectionLine
            key={`${sourceId}-${targetId}`}
            sourceId={sourceId}
            targetId={targetId}
            isCorrect={isCorrect}
            showFeedback={showFeedback}
            isAnimating={isNewMatch}
          />
        );
      })}

      {/* Show confetti for perfect score */}
      {showConfetti && <Confetti />}

      {/* Feedback Message */}
      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center"
        >
          <h3 className="text-xl font-bold mb-2">
            {matches.every(
              ({ sourceId, targetId }) => isMatchCorrect(sourceId, targetId)
            )
              ? '🎉 Great job! All matches are correct!'
              : '😊 Good try! Some matches need adjustment.'}
          </h3>
          <button
            onClick={() => setShowFeedback(false)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all duration-300 text-lg mt-4"
          >
            Continue
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default MatchingExercise;
