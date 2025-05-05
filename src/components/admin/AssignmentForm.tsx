// src/components/admin/AssignmentForm.tsx
import { useState, useCallback, useEffect } from 'react';
import { InteractiveAssignment } from '../../types/interactiveAssignment';
import AssignmentQuestions from './AssignmentQuestions';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import AudioRecorder from '../common/AudioRecorder';

interface AssignmentFormProps {
  initialData?: InteractiveAssignment;
  onSubmit: (data: Partial<InteractiveAssignment>) => void;
  onCancel: () => void;
}

const AssignmentForm = ({ initialData, onSubmit, onCancel }: AssignmentFormProps) => {
  const { fetchAssignmentById, currentAssignment: contextAssignment } = useInteractiveAssignment();

  // Use the initialData or the currentAssignment from context if they match
  const effectiveInitialData = initialData?.id && contextAssignment?.id === initialData.id
    ? contextAssignment
    : initialData;

  const [currentAssignment, setCurrentAssignment] = useState<InteractiveAssignment | null>(effectiveInitialData || null);

  // Initialize form data from the effective initial data
  const [formData, setFormData] = useState<Partial<InteractiveAssignment>>(() => {
    // If we're editing, include the ID in the form data
    const baseData = {
      title: effectiveInitialData?.title || '',
      description: effectiveInitialData?.description || '',
      type: effectiveInitialData?.type || 'MULTIPLE_CHOICE',
      status: effectiveInitialData?.status || 'DRAFT',
      dueDate: effectiveInitialData?.dueDate ? new Date(effectiveInitialData.dueDate) : new Date(),
      difficultyLevel: effectiveInitialData?.difficultyLevel || 'beginner',
      estimatedTimeMinutes: effectiveInitialData?.estimatedTimeMinutes || 15,
      hasAudioFeedback: effectiveInitialData?.hasAudioFeedback ?? false,
      hasCelebration: effectiveInitialData?.hasCelebration ?? true,
      requiresHelp: effectiveInitialData?.requiresHelp ?? false,
      ageGroup: effectiveInitialData?.ageGroup || '',
      audioInstructions: effectiveInitialData?.audioInstructions || '',
    };

    // If effectiveInitialData has an ID, include it
    if (effectiveInitialData?.id) {
      return {
        ...baseData,
        id: effectiveInitialData.id
      };
    }

    return baseData;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Function to refresh assignment data
  const refreshAssignmentData = useCallback(async () => {
    if (initialData?.id) {
      try {
        console.log('Refreshing assignment data for ID:', initialData.id);
        // Force a fresh fetch by bypassing cache
        const refreshedAssignment = await fetchAssignmentById(initialData.id);
        if (refreshedAssignment) {
          console.log('Refreshed assignment data:', refreshedAssignment);
          console.log('Questions count:', refreshedAssignment.questions?.length || 0);
          setCurrentAssignment(refreshedAssignment);

          // Update form data with refreshed assignment data
          setFormData(prev => ({
            ...prev,
            title: refreshedAssignment.title,
            description: refreshedAssignment.description,
            type: refreshedAssignment.type,
            status: refreshedAssignment.status,
            dueDate: refreshedAssignment.dueDate ? new Date(refreshedAssignment.dueDate) : new Date(),
            difficultyLevel: refreshedAssignment.difficultyLevel || 'beginner',
            estimatedTimeMinutes: refreshedAssignment.estimatedTimeMinutes || 15,
            hasAudioFeedback: refreshedAssignment.hasAudioFeedback ?? false,
            hasCelebration: refreshedAssignment.hasCelebration ?? true,
            requiresHelp: refreshedAssignment.requiresHelp ?? false,
            ageGroup: refreshedAssignment.ageGroup || '',
            audioInstructions: refreshedAssignment.audioInstructions || '',
          }));
        } else {
          console.error('Failed to refresh assignment data - no data returned');
        }
      } catch (error) {
        console.error('Error refreshing assignment data:', error);
      }
    }
  }, [initialData?.id, fetchAssignmentById]);

  // Fetch assignment data when component mounts or initialData changes
  useEffect(() => {
    if (initialData?.id) {
      console.log('Initial data changed, refreshing assignment data');
      refreshAssignmentData();
    }
  }, [initialData, refreshAssignmentData]);

  // Update form data when contextAssignment changes
  useEffect(() => {
    if (contextAssignment && initialData?.id === contextAssignment.id) {
      console.log('Context assignment updated, updating form data:', contextAssignment.title);
      setCurrentAssignment(contextAssignment);

      // Update form data with context assignment data
      setFormData(prev => ({
        ...prev,
        title: contextAssignment.title,
        description: contextAssignment.description,
        type: contextAssignment.type,
        status: contextAssignment.status,
        dueDate: contextAssignment.dueDate ? new Date(contextAssignment.dueDate) : new Date(),
        difficultyLevel: contextAssignment.difficultyLevel || 'beginner',
        estimatedTimeMinutes: contextAssignment.estimatedTimeMinutes || 15,
        hasAudioFeedback: contextAssignment.hasAudioFeedback ?? false,
        hasCelebration: contextAssignment.hasCelebration ?? true,
        requiresHelp: contextAssignment.requiresHelp ?? false,
        ageGroup: contextAssignment.ageGroup || '',
        audioInstructions: contextAssignment.audioInstructions || '',
      }));
    }
  }, [contextAssignment, initialData?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'estimatedTimeMinutes') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setFormData(prev => ({ ...prev, dueDate: date }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.type) {
      newErrors.type = 'Type is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // If we're editing an existing assignment, we can show the questions section
  const showQuestions = initialData?.id !== undefined;

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-4 py-2 rounded-lg border ${errors.title ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50`}
            />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
          </div>

        {/* Description */}
        <div className="col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className={`w-full px-4 py-2 rounded-lg border ${errors.description ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50`}
          />
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
        </div>

        {/* Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Type <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${errors.type ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50`}
          >
            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
            <option value="MATCHING">Matching</option>
            <option value="COMPLETION">Completion</option>
            <option value="ORDERING">Ordering</option>
          </select>
          {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${errors.status ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50`}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          {errors.status && <p className="mt-1 text-sm text-red-500">{errors.status}</p>}
        </div>

        {/* Due Date */}
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
            Due Date
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : ''}
            onChange={handleDateChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>

        {/* Difficulty Level */}
        <div>
          <label htmlFor="difficultyLevel" className="block text-sm font-medium text-gray-700 mb-1">
            Difficulty Level
          </label>
          <select
            id="difficultyLevel"
            name="difficultyLevel"
            value={formData.difficultyLevel}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Audio Instructions */}
        <div className="col-span-2">
          <AudioRecorder
            initialAudioUrl={formData.audioInstructions}
            onAudioChange={(audioUrl) => {
              setFormData(prev => ({ ...prev, audioInstructions: audioUrl || '' }));
            }}
            label="Audio Instructions (Optional)"
          />
        </div>

        {/* Estimated Time */}
        <div>
          <label htmlFor="estimatedTimeMinutes" className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Time (minutes)
          </label>
          <input
            type="number"
            id="estimatedTimeMinutes"
            name="estimatedTimeMinutes"
            value={formData.estimatedTimeMinutes}
            onChange={handleChange}
            min="1"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>

        {/* Age Group */}
        <div>
          <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-700 mb-1">
            Age Group
          </label>
          <input
            type="text"
            id="ageGroup"
            name="ageGroup"
            value={formData.ageGroup}
            onChange={handleChange}
            placeholder="e.g., 7-10 years"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>

        {/* Audio Instructions */}
        <div className="col-span-2">
          <label htmlFor="audioInstructions" className="block text-sm font-medium text-gray-700 mb-1">
            Audio Instructions URL
          </label>
          <input
            type="text"
            id="audioInstructions"
            name="audioInstructions"
            value={formData.audioInstructions}
            onChange={handleChange}
            placeholder="https://example.com/audio.mp3"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>

        {/* Checkboxes */}
        <div className="col-span-2 space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasAudioFeedback"
              name="hasAudioFeedback"
              checked={formData.hasAudioFeedback}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="hasAudioFeedback" className="ml-2 block text-sm text-gray-700">
              Has Audio Feedback
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasCelebration"
              name="hasCelebration"
              checked={formData.hasCelebration}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="hasCelebration" className="ml-2 block text-sm text-gray-700">
              Show Celebration on Completion
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="requiresHelp"
              name="requiresHelp"
              checked={formData.requiresHelp}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="requiresHelp" className="ml-2 block text-sm text-gray-700">
              Requires Help/Assistance
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {initialData ? 'Update Assignment' : 'Create Assignment'}
        </button>
      </div>
      </form>

      {/* Show questions section only when editing an existing assignment */}
      {showQuestions && currentAssignment && (
        <div className="border-t border-gray-200 pt-8">
          <AssignmentQuestions
            assignment={currentAssignment}
            onAssignmentUpdate={refreshAssignmentData}
          />
        </div>
      )}
    </div>
  );
};

export default AssignmentForm;
