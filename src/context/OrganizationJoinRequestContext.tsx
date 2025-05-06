// src/context/OrganizationJoinRequestContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { OrganizationJoinRequest } from '../types/organization';
import { useSupabaseAuth } from './SupabaseAuthContext';
import { createOrganizationJoinRequestService } from '../lib/services/organizationJoinRequestService';

// Define the context type
interface OrganizationJoinRequestContextType {
  userJoinRequests: OrganizationJoinRequest[];
  isLoading: boolean;
  error: string | null;
  refreshUserJoinRequests: () => Promise<void>;
  lastRefreshed: Date | null;
}

// Create the context with default values
const OrganizationJoinRequestContext = createContext<OrganizationJoinRequestContextType>({
  userJoinRequests: [],
  isLoading: false,
  error: null,
  refreshUserJoinRequests: async () => {},
  lastRefreshed: null,
});

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Provider component
export const OrganizationJoinRequestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useSupabaseAuth();
  const [userJoinRequests, setUserJoinRequests] = useState<OrganizationJoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  // Use a ref to track if we've already fetched data
  const dataFetchedRef = useRef<boolean>(false);

  // Function to fetch user join requests
  const fetchUserJoinRequests = useCallback(async (force = false) => {
    // Skip if not authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    // Skip if we've already fetched data and it's not a forced refresh
    // and the cache hasn't expired
    if (
      dataFetchedRef.current && 
      !force && 
      lastRefreshed && 
      (new Date().getTime() - lastRefreshed.getTime() < CACHE_EXPIRATION)
    ) {
      console.log('Using cached join requests data');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const joinRequestService = createOrganizationJoinRequestService(user);
      const requests = await joinRequestService.getUserJoinRequests();
      
      setUserJoinRequests(requests);
      setLastRefreshed(new Date());
      dataFetchedRef.current = true;
      
      console.log('Fetched user join requests:', requests.length);
    } catch (err) {
      console.error('Error fetching join requests:', err);
      setError('Failed to fetch your join requests');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, lastRefreshed]);

  // Fetch data when the component mounts or when the user changes
  useEffect(() => {
    fetchUserJoinRequests();
  }, [fetchUserJoinRequests, user?.id]);

  // Function to manually refresh the data
  const refreshUserJoinRequests = useCallback(async () => {
    await fetchUserJoinRequests(true);
  }, [fetchUserJoinRequests]);

  // Context value
  const contextValue: OrganizationJoinRequestContextType = {
    userJoinRequests,
    isLoading,
    error,
    refreshUserJoinRequests,
    lastRefreshed,
  };

  return (
    <OrganizationJoinRequestContext.Provider value={contextValue}>
      {children}
    </OrganizationJoinRequestContext.Provider>
  );
};

// Custom hook to use the context
export const useOrganizationJoinRequests = () => useContext(OrganizationJoinRequestContext);
