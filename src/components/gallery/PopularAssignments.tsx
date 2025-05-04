// src/components/gallery/PopularAssignments.tsx
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { InteractiveAssignment } from '../../types/interactiveAssignment';
import { useConfiguration } from '../../context/ConfigurationContext';
import RatingDisplay from './RatingDisplay';

interface PopularAssignmentsProps {
  assignments: InteractiveAssignment[];
  onSelectAssignment: (assignment: InteractiveAssignment) => void;
}

const PopularAssignments = ({ assignments, onSelectAssignment }: PopularAssignmentsProps) => {
  const { config } = useConfiguration();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll the container left or right
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Format the difficulty level for display
  const formatDifficulty = (difficulty?: string) => {
    if (!difficulty) return '';
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  if (assignments.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Scroll Left Button */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
        aria-label="Scroll left"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Scroll Right Button */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
        aria-label="Scroll right"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Scrollable Container */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto pb-4 hide-scrollbar"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="flex space-x-4 px-10">
          {assignments.map((assignment) => (
            <motion.div
              key={assignment.id}
              whileHover={{ scale: 1.03 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden min-w-[280px] max-w-[280px] cursor-pointer"
              onClick={() => onSelectAssignment(assignment)}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold truncate" style={{ color: config.primaryColor }}>
                    {assignment.title}
                  </h3>
                  {assignment.featured && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded dark:bg-yellow-900 dark:text-yellow-300">
                      Featured
                    </span>
                  )}
                </div>
                
                <RatingDisplay rating={assignment.averageRating || 0} size="sm" />
                
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 line-clamp-2">
                  {assignment.description}
                </p>
                
                <div className="mt-3 flex flex-wrap gap-2">
                  {assignment.difficultyLevel && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-300">
                      {formatDifficulty(assignment.difficultyLevel)}
                    </span>
                  )}
                  {assignment.category && (
                    <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded dark:bg-purple-900 dark:text-purple-300">
                      {assignment.category}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Add custom styles to hide scrollbar */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default PopularAssignments;
