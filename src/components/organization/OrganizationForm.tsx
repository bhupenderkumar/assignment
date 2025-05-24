// src/components/organization/OrganizationForm.tsx
import React, { useState, useRef } from 'react';
import { Organization, OrganizationInput, OrganizationType } from '../../types/organization';
import { useOrganization } from '../../context/OrganizationContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { validateOrganizationName, sanitizeInput } from '../../lib/utils/securityUtils';

interface OrganizationFormProps {
  initialData?: Organization;
  onSubmit: (data: OrganizationInput) => Promise<void>;
  onCancel: () => void;
}

const OrganizationForm: React.FC<OrganizationFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<OrganizationType>(initialData?.type || 'company');
  const [headerText, setHeaderText] = useState(initialData?.headerText || '');
  const [primaryColor, setPrimaryColor] = useState(initialData?.primaryColor || '#0891b2');
  const [secondaryColor, setSecondaryColor] = useState(initialData?.secondaryColor || '#7e22ce');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File upload refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // File upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logoUrl || null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(initialData?.signatureUrl || null);

  // Organization context
  const { uploadLogo, uploadSignature } = useOrganization();

  // Handle logo file change
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle signature file change
  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignatureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // SECURITY: Validate organization name
    const nameValidation = validateOrganizationName(name);
    if (!nameValidation.isValid) {
      nameValidation.errors.forEach(error => toast.error(error));
      return;
    }

    if (!signaturePreview && !signatureFile) {
      toast.error('Signature is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // SECURITY: Sanitize all input data
      const organizationData: OrganizationInput = {
        name: sanitizeInput(name),
        type,
        headerText: sanitizeInput(headerText),
        primaryColor: sanitizeInput(primaryColor),
        secondaryColor: sanitizeInput(secondaryColor),
        logoUrl: logoPreview || undefined,
        signatureUrl: signaturePreview || '' // Will be updated after upload
      };

      // If we're editing an existing organization and have new files to upload
      if (initialData?.id) {
        // Upload logo if changed
        if (logoFile) {
          const logoUrl = await uploadLogo(logoFile, initialData.id);
          organizationData.logoUrl = logoUrl;
        }

        // Upload signature if changed
        if (signatureFile) {
          const signatureUrl = await uploadSignature(signatureFile, initialData.id);
          organizationData.signatureUrl = signatureUrl;
        }
      }

      // Submit the form
      await onSubmit(organizationData);
    } catch (error) {
      console.error('Error submitting organization form:', error);
      toast.error('Failed to save organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto"
    >
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        {initialData ? 'Edit Organization' : 'Create New Organization'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organization Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Organization Name *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter organization name"
            required
          />
        </div>

        {/* Organization Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Organization Type *
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as OrganizationType)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="company">Company</option>
            <option value="school">School</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Header Text */}
        <div>
          <label htmlFor="headerText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Header Text / Tagline
          </label>
          <input
            type="text"
            id="headerText"
            value={headerText}
            onChange={(e) => setHeaderText(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter header text or tagline"
          />
        </div>

        {/* Brand Colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Primary Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                id="primaryColor"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="#000000"
              />
            </div>
          </div>

          <div>
            <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Secondary Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                id="secondaryColor"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-10 w-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>

        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Organization Logo
          </label>
          <div className="flex items-center space-x-4">
            {logoPreview && (
              <div className="relative w-16 h-16 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                <img
                  src={logoPreview}
                  alt="Logo Preview"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setLogoPreview(null);
                    setLogoFile(null);
                    if (logoInputRef.current) logoInputRef.current.value = '';
                  }}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex-1">
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoChange}
                accept="image/*"
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
              >
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {logoPreview ? 'Change Logo' : 'Upload Logo'}
              </label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, or SVG (max. 2MB)
              </p>
            </div>
          </div>
        </div>

        {/* Signature Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Signature Image *
          </label>
          <div className="flex items-center space-x-4">
            {signaturePreview && (
              <div className="relative w-32 h-16 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                <img
                  src={signaturePreview}
                  alt="Signature Preview"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSignaturePreview(null);
                    setSignatureFile(null);
                    if (signatureInputRef.current) signatureInputRef.current.value = '';
                  }}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex-1">
              <input
                type="file"
                ref={signatureInputRef}
                onChange={handleSignatureChange}
                accept="image/*"
                className="hidden"
                id="signature-upload"
              />
              <label
                htmlFor="signature-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
              >
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                {signaturePreview ? 'Change Signature' : 'Upload Signature'}
              </label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, or SVG (max. 2MB)
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Save Organization'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default OrganizationForm;
