// src/components/admin/AssignmentForm.tsx
import { useState, useCallback, useEffect } from 'react';
import { InteractiveAssignment } from '../../types/interactiveAssignment';
import AssignmentQuestions from './AssignmentQuestions';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import AudioRecorder from '../common/AudioRecorder';
import { sanitizeInput, validateAssignmentContent } from '../../lib/utils/securityUtils';
import { useTranslations } from '../../hooks/useTranslations';

interface AssignmentFormProps {
  initialData?: InteractiveAssignment;
  onSubmit: (data: Partial<InteractiveAssignment>) => void;
  onCancel: () => void;
}

const AssignmentForm = ({ initialData, onSubmit, onCancel }: AssignmentFormProps) => {
  const { fetchAssignmentById, currentAssignment: contextAssignment } = useInteractiveAssignment();
  const { commonTranslate, assignmentTranslate, validationTranslate, getPlaceholder } = useTranslations();

  // Use the initialData or the currentAssignment from context if they match
  const effectiveInitialData = initialData?.id && contextAssignment?.id === initialData.id
    ? contextAssignment
    : initialData;

  const [currentAssignment, setCurrentAssignment] = useState<InteractiveAssignment | null>(effectiveInitialData || null);

  // Initialize form data from the effective initial data
  const [formData, setFormData] = useState<Partial<InteractiveAssignment>>(() => {
    // 🔍 DEBUG: Log initial data for payment fields
    console.log('🔄 Initializing form data with payment fields:', {
      effectiveInitialDataRequiresPayment: effectiveInitialData?.requiresPayment,
      effectiveInitialDataPaymentAmount: effectiveInitialData?.paymentAmount,
      hasInitialData: !!effectiveInitialData,
      initialDataId: effectiveInitialData?.id
    });

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
      requiresPayment: effectiveInitialData?.requiresPayment === true, // Explicit boolean check
      paymentAmount: effectiveInitialData?.paymentAmount ?? 0.5,
      ageGroup: effectiveInitialData?.ageGroup || '',
      audioInstructions: effectiveInitialData?.audioInstructions || '',
    };

    // 🔍 DEBUG: Log final base data payment fields
    console.log('🔄 Final base data payment fields:', {
      requiresPayment: baseData.requiresPayment,
      paymentAmount: baseData.paymentAmount
    });

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

          // 🔍 DEBUG: Log payment fields from refreshed assignment
          console.log('🔄 Refreshed assignment payment fields:', {
            requiresPayment: refreshedAssignment.requiresPayment,
            paymentAmount: refreshedAssignment.paymentAmount
          });

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
            requiresPayment: refreshedAssignment.requiresPayment === true, // Explicit boolean check
            paymentAmount: refreshedAssignment.paymentAmount ?? 0.5,
            ageGroup: refreshedAssignment.ageGroup || '',
            audioInstructions: refreshedAssignment.audioInstructions || '',
          }));

          // 🔍 DEBUG: Log form data after update
          console.log('🔄 Form data after refresh update:', {
            requiresPayment: refreshedAssignment.requiresPayment ?? false,
            paymentAmount: refreshedAssignment.paymentAmount || 0.5
          });
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

      // 🔍 DEBUG: Log payment fields from context assignment
      console.log('🔄 Context assignment payment fields:', {
        requiresPayment: contextAssignment.requiresPayment,
        paymentAmount: contextAssignment.paymentAmount
      });

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
        requiresPayment: contextAssignment.requiresPayment === true, // Explicit boolean check
        paymentAmount: contextAssignment.paymentAmount ?? 0.5,
        ageGroup: contextAssignment.ageGroup || '',
        audioInstructions: contextAssignment.audioInstructions || '',
      }));

      // 🔍 DEBUG: Log form data after context update
      console.log('🔄 Form data after context update:', {
        requiresPayment: contextAssignment.requiresPayment ?? false,
        paymentAmount: contextAssignment.paymentAmount || 0.5
      });
    }
  }, [contextAssignment, initialData?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'estimatedTimeMinutes') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else if (name === 'paymentAmount') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
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

    // SECURITY: Validate and sanitize title
    if (!formData.title?.trim()) {
      newErrors.title = validationTranslate('required');
    } else if (formData.title.length > 200) {
      newErrors.title = validationTranslate('maxLength', 'Title must be less than 200 characters');
    }

    // SECURITY: Validate and sanitize description
    if (!formData.description?.trim()) {
      newErrors.description = validationTranslate('required');
    } else if (formData.description.length > 2000) {
      newErrors.description = validationTranslate('maxLength', 'Description must be less than 2000 characters');
    }

    if (!formData.type) {
      newErrors.type = validationTranslate('required');
    }

    if (!formData.status) {
      newErrors.status = validationTranslate('required');
    }

    // SECURITY: Validate assignment content if it exists
    if (formData.questions && formData.questions.length > 0) {
      const contentValidation = validateAssignmentContent(formData.questions);
      if (!contentValidation.isValid) {
        newErrors.content = contentValidation.errors.join(', ');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // SECURITY: Sanitize form data before submission
      const sanitizedData = {
        ...formData,
        title: sanitizeInput(formData.title || ''),
        description: sanitizeInput(formData.description || ''),
        ageGroup: sanitizeInput(formData.ageGroup || ''),
        audioInstructions: sanitizeInput(formData.audioInstructions || '')
      };

      // 🔍 DEBUG: Log payment fields before submission
      console.log('💰 Payment fields in form submission:', {
        requiresPayment: sanitizedData.requiresPayment,
        paymentAmount: sanitizedData.paymentAmount,
        formDataRequiresPayment: formData.requiresPayment,
        formDataPaymentAmount: formData.paymentAmount
      });

      onSubmit(sanitizedData);
    }
  };

  // If we're editing an existing assignment, we can show the questions section
  const showQuestions = initialData?.id !== undefined;

  // 🔍 DEBUG: Log current form data state on every render
  console.log('🔄 Current form data state (render):', {
    requiresPayment: formData.requiresPayment,
    paymentAmount: formData.paymentAmount,
    hasInitialData: !!initialData,
    initialDataId: initialData?.id
  });

  return (
    <div className="space-y-6 md:space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Title */}
          <div className="md:col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              {commonTranslate('title')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={getPlaceholder('enterAssignmentTitle')}
              className={`w-full px-4 py-3 md:py-2 rounded-lg border ${errors.title ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-base md:text-sm`}
            />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
          </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            {commonTranslate('description')} <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder={getPlaceholder('enterAssignmentDescription')}
            className={`w-full px-4 py-3 md:py-2 rounded-lg border ${errors.description ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-base md:text-sm resize-none`}
          />
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
        </div>

        {/* Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
            {commonTranslate('type')} <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className={`w-full px-4 py-3 md:py-2 rounded-lg border ${errors.type ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-base md:text-sm`}
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
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            {commonTranslate('status')} <span className="text-red-500">*</span>
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={`w-full px-4 py-3 md:py-2 rounded-lg border ${errors.status ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-base md:text-sm`}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          {errors.status && <p className="mt-1 text-sm text-red-500">{errors.status}</p>}
        </div>

        {/* Due Date */}
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
            {assignmentTranslate('dueDate')}
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : ''}
            onChange={handleDateChange}
            className="w-full px-4 py-3 md:py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-base md:text-sm"
          />
        </div>

        {/* Difficulty Level */}
        <div>
          <label htmlFor="difficultyLevel" className="block text-sm font-medium text-gray-700 mb-2">
            {assignmentTranslate('difficultyLevel')}
          </label>
          <select
            id="difficultyLevel"
            name="difficultyLevel"
            value={formData.difficultyLevel}
            onChange={handleChange}
            className="w-full px-4 py-3 md:py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-base md:text-sm"
          >
            <option value="beginner">{assignmentTranslate('beginner')}</option>
            <option value="intermediate">{assignmentTranslate('intermediate')}</option>
            <option value="advanced">{assignmentTranslate('advanced')}</option>
          </select>
        </div>

        {/* Audio Instructions */}
        <div className="md:col-span-2">
          <AudioRecorder
            initialAudioUrl={formData.audioInstructions}
            onAudioChange={(audioUrl) => {
              setFormData(prev => ({ ...prev, audioInstructions: audioUrl || '' }));
            }}
            label={assignmentTranslate('audioInstructionsOptional')}
          />
        </div>

        {/* Estimated Time */}
        <div>
          <label htmlFor="estimatedTimeMinutes" className="block text-sm font-medium text-gray-700 mb-2">
            {assignmentTranslate('estimatedTime')}
          </label>
          <input
            type="number"
            id="estimatedTimeMinutes"
            name="estimatedTimeMinutes"
            value={formData.estimatedTimeMinutes}
            onChange={handleChange}
            min="1"
            className="w-full px-4 py-3 md:py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-base md:text-sm"
          />
        </div>

        {/* Age Group */}
        <div>
          <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-700 mb-2">
            {assignmentTranslate('ageGroup')}
          </label>
          <input
            type="text"
            id="ageGroup"
            name="ageGroup"
            value={formData.ageGroup}
            onChange={handleChange}
            placeholder={getPlaceholder('enterAgeGroup')}
            className="w-full px-4 py-3 md:py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-base md:text-sm"
          />
        </div>

        {/* Checkboxes */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="hasAudioFeedback"
              name="hasAudioFeedback"
              checked={formData.hasAudioFeedback}
              onChange={handleChange}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
            />
            <label htmlFor="hasAudioFeedback" className="ml-3 block text-sm text-gray-700">
              {assignmentTranslate('hasAudioFeedback')}
            </label>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="hasCelebration"
              name="hasCelebration"
              checked={formData.hasCelebration}
              onChange={handleChange}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
            />
            <label htmlFor="hasCelebration" className="ml-3 block text-sm text-gray-700">
              {assignmentTranslate('hasCelebration')}
            </label>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="requiresHelp"
              name="requiresHelp"
              checked={formData.requiresHelp}
              onChange={handleChange}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
            />
            <label htmlFor="requiresHelp" className="ml-3 block text-sm text-gray-700">
              {assignmentTranslate('requiresHelp')}
            </label>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="requiresPayment"
              name="requiresPayment"
              checked={formData.requiresPayment}
              onChange={handleChange}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
            />
            <label htmlFor="requiresPayment" className="ml-3 block text-sm text-gray-700">
              {assignmentTranslate('requiresPayment')}
            </label>
          </div>

          {formData.requiresPayment && (
            <div className="pl-8 pt-2">
              <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-2">
                {assignmentTranslate('paymentAmount')}
              </label>
              <input
                type="number"
                id="paymentAmount"
                name="paymentAmount"
                value={formData.paymentAmount}
                onChange={handleChange}
                min="0.1"
                step="0.1"
                className="w-full max-w-xs px-4 py-3 md:py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-base md:text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-6 py-3 md:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium text-base md:text-sm"
        >
          {commonTranslate('cancel')}
        </button>
        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-3 md:py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-base md:text-sm"
        >
          {initialData ? assignmentTranslate('updateAssignment') : assignmentTranslate('createAssignment')}
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
