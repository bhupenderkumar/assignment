// src/components/organization/OrganizationBranding.tsx
import React, { useState, useRef } from 'react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { Organization } from '../../types/organization';
import toast from 'react-hot-toast';

interface OrganizationBrandingProps {
  organization: Organization;
  onUpdate: (updatedOrg: Organization) => void;
}

const OrganizationBranding: React.FC<OrganizationBrandingProps> = ({ organization, onUpdate }) => {
  const { supabase } = useSupabaseAuth();
  const { currentOrganization } = useOrganization();
  const [name, setName] = useState(organization.name);
  const [primaryColor, setPrimaryColor] = useState(organization.primaryColor || '#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState(organization.secondaryColor || '#6366F1');
  const [headerText, setHeaderText] = useState(organization.headerText || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const signatureFileRef = useRef<HTMLInputElement>(null);

  // Check if current user is owner or admin of the organization
  const canEditBranding = organization.id === currentOrganization?.id;

  // Upload file to storage
  const uploadFile = async (file: File, bucket: string, path: string): Promise<string | null> => {
    if (!supabase) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${path}/${Date.now()}.${fileExt}`;

      console.log(`Uploading file to bucket: ${bucket}, path: ${fileName}`);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      console.log(`File uploaded successfully. Public URL: ${urlData.publicUrl}`);
      return urlData.publicUrl;
    } catch (err) {
      console.error('Error uploading file:', err);
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supabase || !canEditBranding) return;

    setIsSubmitting(true);

    try {
      // Upload logo if selected
      let logoUrl = organization.logoUrl;
      if (logoFileRef.current?.files?.length) {
        const uploadedUrl = await uploadFile(
          logoFileRef.current.files[0],
          'organization-logos',
          `${organization.id}`
        );

        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        } else {
          toast.error('Failed to upload logo');
        }
      }

      // Upload signature if selected
      let signatureUrl = organization.signatureUrl;
      if (signatureFileRef.current?.files?.length) {
        const uploadedUrl = await uploadFile(
          signatureFileRef.current.files[0],
          'organization-signatures',
          `${organization.id}`
        );

        if (uploadedUrl) {
          signatureUrl = uploadedUrl;
        } else {
          toast.error('Failed to upload signature');
        }
      }

      // Update organization in database
      const { data, error } = await supabase
        .from('organization')
        .update({
          name,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          header_text: headerText,
          logo_url: logoUrl,
          signature_url: signatureUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', organization.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const updatedOrg: Organization = {
        ...organization,
        name,
        primaryColor,
        secondaryColor,
        headerText,
        logoUrl,
        signatureUrl,
        updatedAt: new Date()
      };

      onUpdate(updatedOrg);
      toast.success('Organization branding updated successfully');
    } catch (err) {
      console.error('Error updating organization branding:', err);

      // Provide more specific error message if available
      if (err instanceof Error) {
        toast.error(`Failed to update organization branding: ${err.message}`);
      } else {
        toast.error('Failed to update organization branding');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canEditBranding) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to edit organization branding.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Organization Branding
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Organization name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Organization Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Enter organization name"
            required
          />
        </div>

        {/* Colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Primary Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                id="primaryColor"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-10 rounded border border-gray-300 dark:border-gray-600"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="#RRGGBB"
              />
            </div>
          </div>

          <div>
            <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Secondary Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                id="secondaryColor"
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-10 w-10 rounded border border-gray-300 dark:border-gray-600"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="#RRGGBB"
              />
            </div>
          </div>
        </div>

        {/* Header text */}
        <div>
          <label htmlFor="headerText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Header Text
          </label>
          <input
            id="headerText"
            type="text"
            value={headerText}
            onChange={(e) => setHeaderText(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Enter header text (optional)"
          />
        </div>

        {/* Logo upload */}
        <div>
          <label htmlFor="logo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Organization Logo
          </label>
          <div className="flex items-center space-x-4">
            {organization.logoUrl && (
              <img
                src={organization.logoUrl}
                alt="Organization Logo"
                className="h-16 w-16 object-contain rounded-md border border-gray-300 dark:border-gray-600"
              />
            )}
            <input
              id="logo"
              type="file"
              ref={logoFileRef}
              accept="image/*"
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Recommended size: 200x200 pixels. Max file size: 2MB.
          </p>
        </div>

        {/* Signature upload */}
        <div>
          <label htmlFor="signature" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Certificate Signature
          </label>
          <div className="flex items-center space-x-4">
            {organization.signatureUrl && (
              <img
                src={organization.signatureUrl}
                alt="Certificate Signature"
                className="h-16 w-32 object-contain rounded-md border border-gray-300 dark:border-gray-600"
              />
            )}
            <input
              id="signature"
              type="file"
              ref={signatureFileRef}
              accept="image/*"
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Recommended size: 300x100 pixels. Max file size: 1MB.
          </p>
        </div>

        {/* Preview */}
        <div className="mt-6 p-4 rounded-lg border border-gray-300 dark:border-gray-600">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preview
          </h4>
          <div
            className="p-4 rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              color: '#ffffff'
            }}
          >
            <div className="flex items-center space-x-3">
              {organization.logoUrl ? (
                <img
                  src={organization.logoUrl}
                  alt={name}
                  className="h-10 w-10 rounded-full object-cover bg-white"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-lg font-bold" style={{ color: primaryColor }}>
                  {name.charAt(0)}
                </div>
              )}
              <div>
                <div className="font-bold">{name}</div>
                {headerText && <div className="text-sm opacity-90">{headerText}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Branding Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrganizationBranding;
