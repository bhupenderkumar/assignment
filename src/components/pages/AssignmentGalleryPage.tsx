// src/components/pages/AssignmentGalleryPage.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useConfiguration } from '../../context/ConfigurationContext';
import { InteractiveAssignment } from '../../types/interactiveAssignment';
import GalleryFilters from '../gallery/GalleryFilters';
import AssignmentCard from '../gallery/AssignmentCard';
import PopularAssignments from '../gallery/PopularAssignments';
import toast from 'react-hot-toast';

const AssignmentGalleryPage = () => {
  const [assignments, setAssignments] = useState<InteractiveAssignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<InteractiveAssignment[]>([]);
  const [popularAssignments, setPopularAssignments] = useState<InteractiveAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const { fetchAssignments } = useInteractiveAssignment();
  const { isAuthenticated } = useSupabaseAuth();
  const { config } = useConfiguration();
  const navigate = useNavigate();

  // Fetch assignments on component mount
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setLoading(true);
        console.log('Fetching assignments for gallery...');
        const allAssignments = await fetchAssignments();
        console.log('Fetched assignments:', allAssignments);

        // Filter to only show published template assignments
        const galleryAssignments = allAssignments.filter(
          assignment => assignment.status === 'PUBLISHED' &&
                        (assignment.isTemplate === true || assignment.organizationId === null)
        );
        console.log('Gallery assignments:', galleryAssignments.length);

        setAssignments(galleryAssignments);
        setFilteredAssignments(galleryAssignments);

        // Set popular assignments (for now, just the top 5 by view count)
        if (galleryAssignments.length > 0) {
          const popular = [...galleryAssignments]
            .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
            .slice(0, 5);
          setPopularAssignments(popular);
          console.log('Popular assignments:', popular.length);
        }
      } catch (error) {
        console.error('Error loading assignments:', error);
        toast.error('Failed to load assignments');
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, [fetchAssignments]);

  // Filter assignments when filter criteria change
  useEffect(() => {
    if (!assignments.length) return;

    const filtered = assignments.filter(assignment => {
      // Filter by search term
      const matchesSearch =
        !searchTerm ||
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by category
      const matchesCategory =
        !selectedCategory ||
        assignment.category === selectedCategory;

      // Filter by topic
      const matchesTopic =
        !selectedTopic ||
        assignment.topic === selectedTopic;

      // Filter by difficulty
      const matchesDifficulty =
        !selectedDifficulty ||
        assignment.difficultyLevel === selectedDifficulty;

      return matchesSearch && matchesCategory && matchesTopic && matchesDifficulty;
    });

    setFilteredAssignments(filtered);
  }, [assignments, searchTerm, selectedCategory, selectedTopic, selectedDifficulty]);

  // Handle assignment selection
  const handleSelectAssignment = (assignment: InteractiveAssignment) => {
    navigate(`/play/assignment/${assignment.id}`);
  };

  // Handle filter changes
  const handleFilterChange = (
    category: string | null,
    topic: string | null,
    difficulty: string | null
  ) => {
    setSelectedCategory(category);
    setSelectedTopic(topic);
    setSelectedDifficulty(difficulty);
  };

  // Get unique categories, topics, and difficulties for filter options
  const categories = [...new Set(assignments.map(a => a.category).filter(Boolean))];
  const topics = [...new Set(assignments.map(a => a.topic).filter(Boolean))];
  const difficulties = ['beginner', 'intermediate', 'advanced'];

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold mb-2" style={{ color: config.primaryColor }}>
          Assignment Gallery
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          Browse and discover template assignments that you can import to your organization
        </p>
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                About the Assignment Gallery
              </h3>
              <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  These are template assignments that can be imported to your organization.
                  Once imported, you can modify them without affecting the original templates.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Assignments Section */}
        {popularAssignments.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Popular Assignments</h2>
            <PopularAssignments
              assignments={popularAssignments}
              onSelectAssignment={handleSelectAssignment}
            />
          </div>
        )}

        {/* Filters and Search */}
        <div className="mb-8">
          <GalleryFilters
            categories={categories}
            topics={topics}
            difficulties={difficulties}
            selectedCategory={selectedCategory}
            selectedTopic={selectedTopic}
            selectedDifficulty={selectedDifficulty}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Assignment Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">No assignments found</h3>
            {selectedCategory || selectedTopic || selectedDifficulty || searchTerm ? (
              <p className="text-gray-500 dark:text-gray-400">
                Try adjusting your filters or search term
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                There are no template assignments available in the gallery yet.
                {isAuthenticated && (
                  <span className="block mt-2">
                    You can create new assignments from the dashboard and mark them as templates to appear here.
                  </span>
                )}
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map(assignment => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onSelect={handleSelectAssignment}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AssignmentGalleryPage;
