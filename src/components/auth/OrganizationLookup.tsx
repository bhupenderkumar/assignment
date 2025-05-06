// src/components/auth/OrganizationLookup.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';
import { Organization, OrganizationType } from '../../types/organization';
import { createOrganizationService } from '../../lib/services/organizationService';
import { createOrganizationJoinRequestService } from '../../lib/services/organizationJoinRequestService';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import toast from 'react-hot-toast';

interface OrganizationLookupProps {
  onOrganizationSelect: (organization: Organization, action?: string) => void;
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
  const { isAuthenticated, user } = useSupabaseAuth();

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
    // Store the selected organization in localStorage for potential join request
    localStorage.setItem('selectedOrganizationForJoin', JSON.stringify(organization));
    onOrganizationSelect(organization);
  };

  // Handle showing join request form
  const handleShowJoinRequest = (organization: Organization) => {
    // Pass the organization to the parent component to handle join request
    // Use a different approach to handle join requests
    setSelectedOrganization(organization);
    // Store the selected organization in localStorage for potential join request
    localStorage.setItem('selectedOrganizationForJoin', JSON.stringify(organization));
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
      // If user is not authenticated, store the join request message in localStorage
      if (!isAuthenticated) {
        // Store the join request message in localStorage
        localStorage.setItem('pendingJoinRequestMessage', requestMessage.trim());

        // Select the organization and proceed to login
        onOrganizationSelect(selectedOrganization, 'join-request');
        return;
      }

      // If user is authenticated, create the join request directly
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

      // Create organization data object
      const organizationData = {
        name: newOrgName.trim(),
        type: orgType,
        signatureUrl: defaultSignatureUrl
      };

      // If user is not authenticated, store the organization data in localStorage
      // and pass it to the parent component to handle after authentication
      if (!isAuthenticated) {
        // Store the organization data in localStorage to be used after authentication
        localStorage.setItem('pendingOrganization', JSON.stringify(organizationData));

        // Pass a temporary organization object to the parent component
        // This will be used to display the organization name during login
        const tempOrganization: Organization = {
          id: 'pending',
          ...organizationData,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'pending',
          logoUrl: '',
          headerText: '',
          primaryColor: config.primaryColor,
          secondaryColor: config.secondaryColor
        };

        toast.success('Please complete authentication to create your organization');

        // Select the temporary organization
        onOrganizationSelect(tempOrganization);
        return;
      }

      // If user is authenticated, create the organization directly
      const organizationService = createOrganizationService(user);
      const newOrganization = await organizationService.createOrganization(organizationData);

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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
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
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Find Your Organization
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Enter your organization name to continue
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm border-l-4 border-red-500 dark:border-red-400 flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSearch} className="mb-6">
                <div className="mb-4">
                  <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Organization Name
                  </label>
                  <div className="relative group">
                    <input
                      id="organizationName"
                      type="text"
                      value={organizationName}
                      onChange={handleSearchInputChange}
                      className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white shadow-sm transition-all duration-200 group-hover:border-blue-300 dark:group-hover:border-blue-500"
                      placeholder="Search for your organization..."
                      autoFocus
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {isSearching && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Start typing to search for your organization
                  </p>
                </div>
              </form>

              {!isSearching && organizationName.trim() === '' ? (
                <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl mb-6 border border-dashed border-gray-200 dark:border-gray-700">
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                    <svg className="h-8 w-8 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Search for your organization</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                    Type the name of your organization in the search box above to get started
                  </p>
                </div>
              ) : !isSearching && searchResults.length > 0 ? (
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Found {searchResults.length} organization{searchResults.length !== 1 ? 's' : ''}
                    </h3>
                    {searchResults.length > 5 && (
                      <span className="text-xs text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-800/50 py-1 px-2 rounded-full">
                        Showing top {Math.min(searchResults.length, 10)} results
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {searchResults.slice(0, 10).map((org) => (
                      <div
                        key={org.id}
                        className="w-full flex flex-col p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200 bg-white dark:bg-gray-800"
                      >
                        <div className="flex items-center space-x-4">
                          {org.logoUrl ? (
                            <img
                              src={getFullLogoUrl(org.logoUrl)}
                              alt={org.name}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-200 dark:border-gray-600 shadow-sm"
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
                            className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-sm"
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
                            <div className="font-semibold text-gray-900 dark:text-white text-lg">{org.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <span className="capitalize">{org.type}</span>
                              <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                              <span className="text-xs">ID: {org.id.substring(0, 8)}...</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-3 mt-4">
                          <button
                            onClick={() => handleSelectOrganization(org)}
                            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center justify-center"
                            style={{
                              backgroundColor: org.primaryColor || undefined
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Select Organization
                          </button>
                          <button
                            onClick={() => handleShowJoinRequest(org)}
                            className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm rounded-lg font-medium transition-colors flex items-center justify-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Request to Join
                          </button>
                        </div>

                        {/* Add a hidden input field to store the join request message */}
                        <input
                          type="hidden"
                          id={`join-request-message-${org.id}`}
                          name={`join-request-message-${org.id}`}
                          value=""
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : !isSearching && organizationName.trim() !== '' && searchResults.length === 0 && !error ? (
                <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl mb-6 border border-dashed border-gray-200 dark:border-gray-700">
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                    <svg className="h-8 w-8 text-amber-500 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No organizations found</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                    Try a different search term or create a new organization
                  </p>
                </div>
              ) : null}

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-1">Don't see your organization?</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        Create your own organization to manage assignments and users
                      </p>
                      <button
                        onClick={handleSwitchToCreate}
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Create a New Organization
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-2">
                <button
                  onClick={onBack}
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
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
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Request to Join
                </h1>
                {selectedOrganization && (
                  <div className="mt-3 flex items-center justify-center">
                    <div className="flex items-center bg-white dark:bg-gray-700 rounded-full px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-600">
                      {selectedOrganization.logoUrl ? (
                        <img
                          src={getFullLogoUrl(selectedOrganization.logoUrl)}
                          alt={selectedOrganization.name}
                          className="w-6 h-6 rounded-md object-cover mr-2"
                          onError={(e) => {
                            const imgElement = e.currentTarget as HTMLImageElement;
                            imgElement.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white font-bold text-xs mr-2"
                          style={{
                            background: selectedOrganization.primaryColor && selectedOrganization.secondaryColor
                              ? `linear-gradient(to bottom right, ${selectedOrganization.primaryColor}, ${selectedOrganization.secondaryColor})`
                              : 'linear-gradient(to bottom right, #4f46e5, #8b5cf6)'
                          }}
                        >
                          {selectedOrganization.name.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">{selectedOrganization.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm border-l-4 border-red-500 dark:border-red-400 flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmitJoinRequest} className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 text-sm text-blue-700 dark:text-blue-300">
                      <p>Your request will be reviewed by the organization administrators. You'll be notified once it's approved.</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label htmlFor="requestMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message to Administrators (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <textarea
                      id="requestMessage"
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white shadow-sm"
                      placeholder="Explain why you want to join this organization"
                      rows={4}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Adding a message increases your chances of being approved
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isRequesting}
                  className="w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-md disabled:opacity-70 flex items-center justify-center"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`
                  }}
                >
                  {isRequesting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                      Submit Request
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-6">
                <button
                  onClick={() => {
                    setMode('search');
                    setSelectedOrganization(null);
                    setRequestMessage('');
                  }}
                  className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-green-50 dark:bg-green-900/30 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Create Your Organization
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Set up your organization to get started with assignments
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm border-l-4 border-red-500 dark:border-red-400 flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCreateOrganization} className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="mb-5">
                  <label htmlFor="newOrgName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Organization Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <input
                      id="newOrgName"
                      type="text"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white shadow-sm"
                      placeholder="Enter organization name"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    This will be the name displayed to all users of your organization
                  </p>
                </div>

                <div className="mb-6">
                  <label htmlFor="orgType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Organization Type
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <select
                      id="orgType"
                      value={orgType}
                      onChange={(e) => setOrgType(e.target.value as OrganizationType)}
                      className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white shadow-sm appearance-none"
                      required
                    >
                      <option value="company">Company</option>
                      <option value="school">School</option>
                      <option value="other">Other</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Select the type that best describes your organization
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-md disabled:opacity-70 flex items-center justify-center"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`
                  }}
                >
                  {isCreating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Organization...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Organization
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-6">
                <button
                  onClick={handleSwitchToSearch}
                  className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
