// src/components/gallery/GalleryFilters.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';


interface GalleryFiltersProps {
  categories: string[];
  topics: string[];
  difficulties: string[];
  selectedCategory: string | null;
  selectedTopic: string | null;
  selectedDifficulty: string | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onFilterChange: (
    category: string | null,
    topic: string | null,
    difficulty: string | null
  ) => void;
}

const GalleryFilters = ({
  categories,
  topics,
  difficulties,
  selectedCategory,
  selectedTopic,
  selectedDifficulty,
  searchTerm,
  onSearchChange,
  onFilterChange,
}: GalleryFiltersProps) => {
  // Configuration not needed in this component
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Handle filter reset
  const handleReset = () => {
    onFilterChange(null, null, null);
    onSearchChange('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex justify-between items-center"
        >
          <span>Filters</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 transition-transform ${isFiltersOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Filter Controls - Responsive */}
      <motion.div
        className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${isFiltersOpen ? 'block' : 'hidden md:grid'}`}
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: isFiltersOpen || window.innerWidth >= 768 ? 1 : 0,
          height: isFiltersOpen || window.innerWidth >= 768 ? 'auto' : 0
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Category Filter */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <select
            id="category"
            value={selectedCategory || ''}
            onChange={(e) => onFilterChange(
              e.target.value || null,
              selectedTopic,
              selectedDifficulty
            )}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Topic Filter */}
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Topic
          </label>
          <select
            id="topic"
            value={selectedTopic || ''}
            onChange={(e) => onFilterChange(
              selectedCategory,
              e.target.value || null,
              selectedDifficulty
            )}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Topics</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Difficulty
          </label>
          <select
            id="difficulty"
            value={selectedDifficulty || ''}
            onChange={(e) => onFilterChange(
              selectedCategory,
              selectedTopic,
              e.target.value || null
            )}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Difficulties</option>
            {difficulties.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Reset Filters Button */}
      {(selectedCategory || selectedTopic || selectedDifficulty || searchTerm) && (
        <div className={`mt-4 ${isFiltersOpen ? 'block' : 'hidden md:block'}`}>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default GalleryFilters;
