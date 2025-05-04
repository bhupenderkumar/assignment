// src/context/OrganizationContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { Organization, OrganizationInput, OrganizationUpdateInput } from '../types/organization';
import { createOrganizationService } from '../lib/services/organizationService';
import { useSupabaseAuth } from './SupabaseAuthContext';
import { useConfiguration } from './ConfigurationContext';
import { useDatabaseState } from './DatabaseStateContext';
import toast from 'react-hot-toast';

// Interface for organization cache
interface OrganizationCache {
  organizations: {
    data: Organization[];
    timestamp: number;
  } | null;
  currentOrganizationId: string | null;
  pendingRequests: {
    fetchOrganizations: boolean;
  };
}

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

interface OrganizationContextType {
  organizations: Organization[];
  currentOrganization: Organization | null;
  isLoading: boolean;
  error: string | null;
  fetchOrganizations: () => Promise<void>;
  createOrganization: (organization: OrganizationInput) => Promise<Organization>;
  updateOrganization: (id: string, updates: OrganizationUpdateInput) => Promise<Organization>;
  deleteOrganization: (id: string) => Promise<boolean>;
  setCurrentOrganization: (organization: Organization | null) => void;
  uploadLogo: (file: File, organizationId: string) => Promise<string>;
  uploadSignature: (file: File, organizationId: string) => Promise<string>;
  importAssignmentToOrganization: (assignmentId: string, organizationId: string) => Promise<string>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useSupabaseAuth();
  const { updateConfig } = useConfiguration();
  const { isReady: isDatabaseReady, executeWhenReady } = useDatabaseState();

  // Request cache to prevent duplicate requests
  const requestCache = useRef<OrganizationCache>({
    organizations: null,
    currentOrganizationId: null,
    pendingRequests: {
      fetchOrganizations: false
    }
  });

  // Create organization service - memoize to prevent unnecessary recreations
  const organizationService = useCallback(() => {
    return createOrganizationService(user);
  }, [user]);

  // Initialize current organization from localStorage
  useEffect(() => {
    // Check for both currentOrganizationId (permanent) and selectedOrganizationId (from login)
    const storedOrgId = localStorage.getItem('currentOrganizationId');
    const selectedOrgId = localStorage.getItem('selectedOrganizationId');

    if (selectedOrgId) {
      // If we have a selectedOrganizationId from login, use it and then clear it
      requestCache.current.currentOrganizationId = selectedOrgId;
      localStorage.removeItem('selectedOrganizationId');

      // Also set it as the permanent currentOrganizationId
      localStorage.setItem('currentOrganizationId', selectedOrgId);
      console.log('OrganizationContext: Using selected organization from login:', selectedOrgId);
    } else if (storedOrgId) {
      // Otherwise use the stored organization ID
      requestCache.current.currentOrganizationId = storedOrgId;
    }
  }, []);

  // Fetch organizations on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && isDatabaseReady) {
      fetchOrganizations();
    } else {
      setOrganizations([]);
      setCurrentOrganization(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, isDatabaseReady]);

  // Update configuration when current organization changes
  useEffect(() => {
    if (currentOrganization) {
      console.log('OrganizationContext: Updating config with organization:', currentOrganization.name);

      // Update localStorage
      localStorage.setItem('currentOrganizationId', currentOrganization.id);
      requestCache.current.currentOrganizationId = currentOrganization.id;

      // Update app configuration with organization branding
      updateConfig({
        companyName: currentOrganization.name,
        companyLogo: currentOrganization.logoUrl || 'star',
        primaryColor: currentOrganization.primaryColor || '#0891b2',
        secondaryColor: currentOrganization.secondaryColor || '#7e22ce',
        companyTagline: currentOrganization.headerText || 'EXPLORE · LEARN · MASTER'
      });
    }
    // updateConfig is memoized in ConfigurationContext to prevent infinite loops
  }, [currentOrganization, updateConfig]);

  // Fetch organizations with caching
  const fetchOrganizations = async () => {
    if (!isAuthenticated || !isDatabaseReady) return;

    // Check if there's already a pending request
    if (requestCache.current.pendingRequests.fetchOrganizations) {
      console.log('OrganizationContext: Fetch organizations request already in progress, skipping');
      return;
    }

    // Check if we have cached data that's still valid
    const cache = requestCache.current.organizations;
    const now = Date.now();
    if (cache && (now - cache.timestamp < CACHE_EXPIRATION)) {
      console.log('OrganizationContext: Using cached organizations data');
      setOrganizations(cache.data);

      // Set current organization from cache if needed
      if (cache.data.length > 0 && !currentOrganization) {
        const storedOrgId = requestCache.current.currentOrganizationId;
        if (storedOrgId) {
          const storedOrg = cache.data.find(org => org.id === storedOrgId);
          if (storedOrg) {
            setCurrentOrganization(storedOrg);
            return;
          }
        }
        setCurrentOrganization(cache.data[0]);
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    requestCache.current.pendingRequests.fetchOrganizations = true;

    try {
      // Use executeWhenReady to ensure database is ready
      const data = await executeWhenReady(() => organizationService().getOrganizations());

      // Update cache
      requestCache.current.organizations = {
        data,
        timestamp: now
      };

      setOrganizations(data);

      // Set current organization if not already set
      if (data.length > 0 && !currentOrganization) {
        const storedOrgId = requestCache.current.currentOrganizationId;
        if (storedOrgId) {
          const storedOrg = data.find(org => org.id === storedOrgId);
          if (storedOrg) {
            setCurrentOrganization(storedOrg);
          } else {
            setCurrentOrganization(data[0]);
          }
        } else {
          setCurrentOrganization(data[0]);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch organizations';
      setError(errorMessage);
      console.error('OrganizationContext: Error fetching organizations:', err);
      // Only show toast for non-network errors to avoid spamming the user
      if (!(err instanceof Error && err.message.includes('network'))) {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
      requestCache.current.pendingRequests.fetchOrganizations = false;
    }
  };

  // Create organization
  const createOrganization = async (organization: OrganizationInput) => {
    if (!isDatabaseReady) {
      toast.error('Database not ready. Please try again in a moment.');
      return Promise.reject(new Error('Database not ready'));
    }

    setIsLoading(true);
    setError(null);

    try {
      const newOrganization = await executeWhenReady(() =>
        organizationService().createOrganization(organization)
      );

      // Update local state
      const updatedOrgs = [newOrganization, ...organizations];
      setOrganizations(updatedOrgs);

      // Update cache
      if (requestCache.current.organizations) {
        requestCache.current.organizations.data = updatedOrgs;
        requestCache.current.organizations.timestamp = Date.now();
      } else {
        requestCache.current.organizations = {
          data: updatedOrgs,
          timestamp: Date.now()
        };
      }

      // Set as current organization if it's the first one
      if (organizations.length === 0) {
        setCurrentOrganization(newOrganization);
      }

      toast.success('Organization created successfully');
      return newOrganization;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create organization';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update organization
  const updateOrganization = async (id: string, updates: OrganizationUpdateInput) => {
    if (!isDatabaseReady) {
      toast.error('Database not ready. Please try again in a moment.');
      return Promise.reject(new Error('Database not ready'));
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedOrganization = await executeWhenReady(() =>
        organizationService().updateOrganization(id, updates)
      );

      // Update organizations list
      const updatedOrgs = organizations.map(org =>
        org.id === id ? updatedOrganization : org
      );
      setOrganizations(updatedOrgs);

      // Update cache
      if (requestCache.current.organizations) {
        requestCache.current.organizations.data = updatedOrgs;
        requestCache.current.organizations.timestamp = Date.now();
      }

      // Update current organization if it's the one being updated
      if (currentOrganization?.id === id) {
        setCurrentOrganization(updatedOrganization);
      }

      toast.success('Organization updated successfully');
      return updatedOrganization;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update organization';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete organization
  const deleteOrganization = async (id: string) => {
    if (!isDatabaseReady) {
      toast.error('Database not ready. Please try again in a moment.');
      return Promise.reject(new Error('Database not ready'));
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await executeWhenReady(() =>
        organizationService().deleteOrganization(id)
      );

      if (success) {
        // Remove from organizations list
        const updatedOrganizations = organizations.filter(org => org.id !== id);
        setOrganizations(updatedOrganizations);

        // Update cache
        if (requestCache.current.organizations) {
          requestCache.current.organizations.data = updatedOrganizations;
          requestCache.current.organizations.timestamp = Date.now();
        }

        // If current organization is deleted, set to first available or null
        if (currentOrganization?.id === id) {
          const newCurrentOrg = updatedOrganizations.length > 0 ? updatedOrganizations[0] : null;
          setCurrentOrganization(newCurrentOrg);

          // Update localStorage
          if (newCurrentOrg) {
            localStorage.setItem('currentOrganizationId', newCurrentOrg.id);
            requestCache.current.currentOrganizationId = newCurrentOrg.id;
          } else {
            localStorage.removeItem('currentOrganizationId');
            requestCache.current.currentOrganizationId = null;
          }
        }

        toast.success('Organization deleted successfully');
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete organization';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Upload logo
  const uploadLogo = async (file: File, organizationId: string) => {
    if (!isDatabaseReady) {
      toast.error('Database not ready. Please try again in a moment.');
      return Promise.reject(new Error('Database not ready'));
    }

    setIsLoading(true);
    setError(null);

    try {
      const logoUrl = await executeWhenReady(() =>
        organizationService().uploadLogo(file, organizationId)
      );

      // Update organization with new logo URL
      await updateOrganization(organizationId, { logoUrl });

      return logoUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload logo';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Upload signature
  const uploadSignature = async (file: File, organizationId: string) => {
    if (!isDatabaseReady) {
      toast.error('Database not ready. Please try again in a moment.');
      return Promise.reject(new Error('Database not ready'));
    }

    setIsLoading(true);
    setError(null);

    try {
      const signatureUrl = await executeWhenReady(() =>
        organizationService().uploadSignature(file, organizationId)
      );

      // Update organization with new signature URL
      await updateOrganization(organizationId, { signatureUrl });

      return signatureUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload signature';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Set current organization with proper caching
  const handleSetCurrentOrganization = (organization: Organization | null) => {
    // Update state
    setCurrentOrganization(organization);

    // Update localStorage and cache
    if (organization) {
      localStorage.setItem('currentOrganizationId', organization.id);
      requestCache.current.currentOrganizationId = organization.id;
    } else {
      localStorage.removeItem('currentOrganizationId');
      requestCache.current.currentOrganizationId = null;
    }
  };

  // Import assignment to organization
  const importAssignmentToOrganization = async (assignmentId: string, organizationId: string): Promise<string> => {
    if (!isDatabaseReady) {
      toast.error('Database not ready. Please try again in a moment.');
      return Promise.reject(new Error('Database not ready'));
    }

    setIsLoading(true);
    setError(null);

    try {
      // First, fetch the assignment to copy
      const { data: assignmentData, error: fetchError } = await executeWhenReady(async () => {
        const supabase = await organizationService().getClient();
        return await supabase
          .from('interactive_assignment')
          .select('*')
          .eq('id', assignmentId)
          .single();
      });

      if (fetchError) throw fetchError;
      if (!assignmentData) throw new Error('Assignment not found');

      // Create a new assignment with the same data but for the target organization
      const { data: newAssignment, error: insertError } = await executeWhenReady(async () => {
        const supabase = await organizationService().getClient();

        // Get the current user ID
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) throw new Error('User not authenticated');

        // Create a new assignment object without the id, created_at, and updated_at fields
        const {
          id,
          created_at,
          updated_at,
          is_template, // Remove is_template flag
          source_assignment_id, // Remove any existing source_assignment_id
          ...assignmentToImport
        } = assignmentData;

        // Set the organization_id and created_by fields
        assignmentToImport.organization_id = organizationId;
        assignmentToImport.created_by = currentUser.id;

        // Set source_assignment_id to track that this is an imported assignment
        assignmentToImport.source_assignment_id = assignmentId;

        // Ensure is_template is false for the imported copy
        assignmentToImport.is_template = false;

        return await supabase
          .from('interactive_assignment')
          .insert(assignmentToImport)
          .select()
          .single();
      });

      if (insertError) throw insertError;
      if (!newAssignment) throw new Error('Failed to create new assignment');

      // Now copy all the questions
      const { data: questionsData, error: questionsError } = await executeWhenReady(async () => {
        const supabase = await organizationService().getClient();
        return await supabase
          .from('interactive_question')
          .select('*')
          .eq('assignment_id', assignmentId);
      });

      if (questionsError) throw questionsError;

      // If there are questions, copy them to the new assignment
      if (questionsData && questionsData.length > 0) {
        const questionsToImport = questionsData.map(question => {
          // Create a new question object without the id field
          const { id, ...questionToImport } = question;
          // Set the assignment_id field to the new assignment id
          questionToImport.assignment_id = newAssignment.id;
          return questionToImport;
        });

        const { error: insertQuestionsError } = await executeWhenReady(async () => {
          const supabase = await organizationService().getClient();
          return await supabase
            .from('interactive_question')
            .insert(questionsToImport);
        });

        if (insertQuestionsError) {
          console.error('Error copying questions:', insertQuestionsError);
          // Continue anyway - the assignment was created successfully
        }
      }

      toast.success('Assignment imported successfully');
      return newAssignment.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import assignment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value: OrganizationContextType = {
    organizations,
    currentOrganization,
    isLoading,
    error,
    fetchOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    setCurrentOrganization: handleSetCurrentOrganization,
    uploadLogo,
    uploadSignature,
    importAssignmentToOrganization
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
