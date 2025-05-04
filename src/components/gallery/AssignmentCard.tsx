// src/components/gallery/AssignmentCard.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useConfiguration } from '../../context/ConfigurationContext';
import { useOrganization } from '../../context/OrganizationContext';
import { InteractiveAssignment } from '../../types/interactiveAssignment';
import RatingDisplay from './RatingDisplay';
import toast from 'react-hot-toast';

interface AssignmentCardProps {
  assignment: InteractiveAssignment;
  onSelect: (assignment: InteractiveAssignment) => void;
}

const AssignmentCard = ({ assignment, onSelect }: AssignmentCardProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [showImportOptions, setShowImportOptions] = useState(false);
  const { config } = useConfiguration();
  const { organizations, importAssignmentToOrganization } = useOrganization();
  const navigate = useNavigate();

  // Format the difficulty level for display
  const formatDifficulty = (difficulty?: string) => {
    if (!difficulty) return 'Not specified';
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  // Format the assignment type for display
  const formatType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Handle assignment preview
  const handlePreview = () => {
    onSelect(assignment);
  };

  // Handle assignment import to organization
  const handleImport = async (organizationId: string) => {
    try {
      setIsImporting(true);
      await importAssignmentToOrganization(assignment.id, organizationId);
      toast.success('Assignment imported successfully');
      setShowImportOptions(false);
    } catch (error) {
      console.error('Error importing assignment:', error);
      toast.error('Failed to import assignment');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full"
    >
      {/* Card Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold truncate" style={{ color: config.primaryColor }}>
            {assignment.title}
          </h3>
          <div className="flex space-x-2">
            {assignment.isTemplate && (
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                Template
              </span>
            )}
            {assignment.featured && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-yellow-900 dark:text-yellow-300">
                Featured
              </span>
            )}
          </div>
        </div>

        {/* Rating Display */}
        <div className="mt-1">
          <RatingDisplay rating={assignment.averageRating || 0} count={assignment.ratingCount || 0} />
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-grow">
        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4">
          {assignment.description}
        </p>

        {/* Assignment Details */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Type:</span>{' '}
            <span className="font-medium">{formatType(assignment.type)}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Difficulty:</span>{' '}
            <span className="font-medium">{formatDifficulty(assignment.difficultyLevel)}</span>
          </div>
          {assignment.category && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Category:</span>{' '}
              <span className="font-medium">{assignment.category}</span>
            </div>
          )}
          {assignment.topic && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Topic:</span>{' '}
              <span className="font-medium">{assignment.topic}</span>
            </div>
          )}
          {assignment.estimatedTimeMinutes && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Time:</span>{' '}
              <span className="font-medium">{assignment.estimatedTimeMinutes} min</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <button
            onClick={handlePreview}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Preview
          </button>

          <div className="relative">
            <button
              onClick={() => setShowImportOptions(!showImportOptions)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                  </svg>
                  Import to Organization
                </>
              )}
            </button>

            {/* Organization Selection Dropdown */}
            {showImportOptions && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                <div className="p-3">
                  <h4 className="text-sm font-semibold mb-2">Import to Organization:</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    This will create a copy of the assignment in your selected organization.
                  </p>
                  {organizations.length === 0 ? (
                    <p className="text-sm text-gray-500">No organizations available</p>
                  ) : (
                    <ul className="space-y-1">
                      {organizations.map((org) => (
                        <li key={org.id}>
                          <button
                            onClick={() => handleImport(org.id)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center"
                          >
                            {org.logoUrl ? (
                              <img src={org.logoUrl} alt={org.name} className="w-5 h-5 mr-2" />
                            ) : (
                              <div className="w-5 h-5 mr-2 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                {org.name.charAt(0)}
                              </div>
                            )}
                            {org.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AssignmentCard;
