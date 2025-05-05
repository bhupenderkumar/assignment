// src/components/auth/OrganizationLookup.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';
import { Organization, OrganizationType } from '../../types/organization';
import { createOrganizationService } from '../../lib/services/organizationService';
import { createOrganizationJoinRequestService } from '../../lib/services/organizationJoinRequestService';
import toast from 'react-hot-toast';

interface OrganizationLookupProps {
  onOrganizationSelect: (organization: Organization) => void;
  onBack: () => void;
}

// Helper function to get the full URL for organization logos
const getFullLogoUrl = (logoUrl: string | null): string => {
  if (!logoUrl) return '';

  // If it's already a full URL, return it
  if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
    return logoUrl;
  }

  // If it's a storage path, convert it to a full URL
  if (logoUrl.startsWith('/')) {
    logoUrl = logoUrl.substring(1); // Remove leading slash if present
  }

  // Construct the full URL using the Supabase project ID
  return `https://uymsiskesqqrfnpslinp.supabase.co/storage/v1/object/public/organization-logos/${logoUrl}`;
};

const OrganizationLookup: React.FC<OrganizationLookupProps> = ({ onOrganizationSelect, onBack }) => {
  const { config } = useConfiguration();

  // State for organization search
  const [organizationName, setOrganizationName] = useState('');
  const [isSearching, setIsSearching] = useState(true); // Start with loading state
  const [searchResults, setSearchResults] = useState<Organization[]>([]);
  const [error, setError] = useState<string | null>(null);

  // State for organization creation
  const [mode, setMode] = useState<'search' | 'create' | 'request'>('search');
  const [newOrgName, setNewOrgName] = useState('');
  const [orgType, setOrgType] = useState<OrganizationType>('company');
  const [isCreating, setIsCreating] = useState(false);

  // State for join request
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  // Initialize with empty search results and not loading
  useEffect(() => {
    // Set initial state - not searching, empty results
    setIsSearching(false);
    setSearchResults([]);

    // Show a helpful message to guide users
    setError(null);
  }, []);

  // Debounce search to avoid too many requests
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Handle organization search input change with debounce
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOrganizationName(value);

    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // If the input is empty, clear results
    if (!value.trim()) {
      setSearchResults([]);
      setError(null);
      return;
    }

    // Set a new timeout to search after typing stops
    const timeout = setTimeout(() => {
      performSearch(value);
    }, 300); // 300ms debounce

    setSearchTimeout(timeout);
  };

  // Handle form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!organizationName.trim()) {
      setError('Please enter an organization name');
      return;
    }

    performSearch(organizationName);
  };

  // Perform the actual search
  const performSearch = async (searchValue: string) => {
    if (!searchValue.trim()) {
      return;
    }

    setIsSearching(true);
    setError(null);

    const searchTerm = searchValue.trim();
    console.log('Searching for organizations with term:', searchTerm);

    try {
      // Use the organization service for search
      const organizationService = createOrganizationService();
      const orgs = await organizationService.searchOrganizations(searchTerm);

      console.log('Search results:', orgs);

      if (orgs && orgs.length > 0) {
        setSearchResults(orgs);
        setError(null);
      } else {
        // If no results, show a helpful message
        setError(`No organizations found with name containing "${searchTerm}". Try a different search term or create a new organization.`);
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching for organizations:', err);
      setError('Failed to search for organizations. Please try again later.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle organization selection
  const handleSelectOrganization = (organization: Organization) => {
    onOrganizationSelect(organization);
  };

  // Handle showing join request form
  const handleShowJoinRequest = (organization: Organization) => {
    // Pass the organization to the parent component to handle join request
    // Use a different approach to handle join requests
    setSelectedOrganization(organization);
    setMode('request');
  };

  // Handle submitting a join request
  const handleSubmitJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrganization) {
      setError('No organization selected');
      return;
    }

    setIsRequesting(true);
    setError(null);

    try {
      // Create a join request
      const joinRequestService = createOrganizationJoinRequestService();
      await joinRequestService.createJoinRequest(
        selectedOrganization.id,
        requestMessage.trim() || undefined
      );

      toast.success('Join request submitted successfully');

      // Go back to search mode
      setMode('search');
      setSelectedOrganization(null);
      setRequestMessage('');
    } catch (err) {
      console.error('Error submitting join request:', err);
      setError('Failed to submit join request. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  // Handle organization creation
  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newOrgName.trim()) {
      setError('Please enter an organization name');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Create a default signature URL (this is required by the schema)
      // In a real implementation, you might want to use a default image or let users upload one
      const defaultSignatureUrl = 'https://via.placeholder.com/200x100?text=Signature';

      // Use the organization service to create a new organization
      const organizationService = createOrganizationService();
      const newOrganization = await organizationService.createOrganization({
        name: newOrgName.trim(),
        type: orgType,
        signatureUrl: defaultSignatureUrl
      });

      toast.success('Organization created successfully!');

      // Select the newly created organization
      onOrganizationSelect(newOrganization);
    } catch (err) {
      console.error('Error creating organization:', err);
      setError('Failed to create organization. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Switch to create mode
  const handleSwitchToCreate = () => {
    setMode('create');
    setError(null);
  };

  // Switch back to search mode
  const handleSwitchToSearch = () => {
    setMode('search');
    setError(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {mode === 'search' ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Find Your Organization
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Enter your organization name to continue
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSearch} className="mb-6">
                <div className="mb-4">
                  <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Organization Name
                  </label>
                  <div className="relative">
                    <input
                      id="organizationName"
                      type="text"
                      value={organizationName}
                      onChange={handleSearchInputChange}
                      className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Search for your organization..."
                      autoFocus
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {isSearching && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Start typing to search for your organization
                  </p>
                </div>
              </form>

              {!isSearching && organizationName.trim() === '' ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-6">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Search for your organization</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Type the name of your organization in the search box above
                  </p>
                </div>
              ) : !isSearching && searchResults.length > 0 ? (
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Found {searchResults.length} organization{searchResults.length !== 1 ? 's' : ''}:
                    </h3>
                    {searchResults.length > 5 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Showing top {Math.min(searchResults.length, 10)} results
                      </span>
                    )}
                  </div>

                  {searchResults.slice(0, 10).map((org) => (
                    <div
                      key={org.id}
                      className="w-full flex flex-col p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {org.logoUrl ? (
                          <img
                            src={getFullLogoUrl(org.logoUrl)}
                            alt={org.name}
                            className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                            onError={(e) => {
                              console.error('Error loading logo:', e);
                              // Replace with fallback on error
                              const imgElement = e.currentTarget as HTMLImageElement;
                              imgElement.style.display = 'none';

                              // Find the fallback element (next sibling)
                              const fallbackElement = imgElement.nextElementSibling as HTMLElement;
                              if (fallbackElement) {
                                fallbackElement.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className="w-10 h-10 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                          style={{
                            display: org.logoUrl ? 'none' : 'flex',
                            background: org.primaryColor && org.secondaryColor
                              ? `linear-gradient(to bottom right, ${org.primaryColor}, ${org.secondaryColor})`
                              : undefined
                          }}
                        >
                          {org.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{org.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{org.type}</div>
                        </div>
                      </div>

                      <div className="flex space-x-2 mt-3">
                        <button
                          onClick={() => handleSelectOrganization(org)}
                          className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md font-medium transition-colors"
                          style={{
                            backgroundColor: org.primaryColor || undefined
                          }}
                        >
                          Select
                        </button>
                        <button
                          onClick={() => handleShowJoinRequest(org)}
                          className="flex-1 py-1.5 px-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm rounded-md font-medium transition-colors"
                        >
                          Request to Join
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !isSearching && organizationName.trim() !== '' && searchResults.length === 0 && !error ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-6">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No organizations found</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Try a different search term or create a new organization
                  </p>
                </div>
              ) : null}

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Don't see your organization?
                </p>
                <button
                  onClick={handleSwitchToCreate}
                  className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Create a New Organization
                </button>
              </div>

              <div className="text-center mt-6">
                <button
                  onClick={onBack}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Skip Organization Selection
                </button>
              </div>
            </motion.div>
          ) : mode === 'request' ? (
            <motion.div
              key="request"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Request to Join
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  {selectedOrganization?.name}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmitJoinRequest} className="mb-6">
                <div className="mb-6">
                  <label htmlFor="requestMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message (Optional)
                  </label>
                  <textarea
                    id="requestMessage"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Explain why you want to join this organization"
                    rows={4}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Your request will be sent to the organization administrators for approval.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isRequesting}
                  className="w-full py-2 px-4 rounded-lg text-white font-medium transition-colors bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 disabled:opacity-70"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`
                  }}
                >
                  {isRequesting ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>

              <div className="text-center mt-6">
                <button
                  onClick={() => {
                    setMode('search');
                    setSelectedOrganization(null);
                    setRequestMessage('');
                  }}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center mx-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Organization Search
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Create Your Organization
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Set up your organization to get started
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateOrganization} className="mb-6">
                <div className="mb-4">
                  <label htmlFor="newOrgName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Organization Name
                  </label>
                  <input
                    id="newOrgName"
                    type="text"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter organization name"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="orgType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Organization Type
                  </label>
                  <select
                    id="orgType"
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value as OrganizationType)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="company">Company</option>
                    <option value="school">School</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-2 px-4 rounded-lg text-white font-medium transition-colors bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 disabled:opacity-70"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`
                  }}
                >
                  {isCreating ? 'Creating...' : 'Create Organization'}
                </button>
              </form>

              <div className="text-center mt-6">
                <button
                  onClick={handleSwitchToSearch}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center mx-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Organization Search
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrganizationLookup;
