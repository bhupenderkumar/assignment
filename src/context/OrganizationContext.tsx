// src/context/OrganizationContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Organization, OrganizationInput, OrganizationUpdateInput } from '../types/organization';
import { createOrganizationService } from '../lib/services/organizationService';
import { useSupabaseAuth } from './SupabaseAuthContext';
import { useConfiguration } from './ConfigurationContext';
import toast from 'react-hot-toast';

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
  
  // Create organization service
  const organizationService = createOrganizationService(user);
  
  // Fetch organizations on mount and when user changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrganizations();
    } else {
      setOrganizations([]);
      setCurrentOrganization(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);
  
  // Update configuration when current organization changes
  useEffect(() => {
    if (currentOrganization) {
      // Update app configuration with organization branding
      updateConfig({
        companyName: currentOrganization.name,
        companyLogo: currentOrganization.logoUrl || 'star',
        primaryColor: currentOrganization.primaryColor || '#0891b2',
        secondaryColor: currentOrganization.secondaryColor || '#7e22ce',
        companyTagline: currentOrganization.headerText || 'EXPLORE · LEARN · MASTER'
      });
    }
  }, [currentOrganization]);
  
  // Fetch organizations
  const fetchOrganizations = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await organizationService.getOrganizations();
      setOrganizations(data);
      
      // Set current organization if not already set
      if (data.length > 0 && !currentOrganization) {
        setCurrentOrganization(data[0]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch organizations';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create organization
  const createOrganization = async (organization: OrganizationInput) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newOrganization = await organizationService.createOrganization(organization);
      setOrganizations(prev => [newOrganization, ...prev]);
      
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
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedOrganization = await organizationService.updateOrganization(id, updates);
      
      // Update organizations list
      setOrganizations(prev => 
        prev.map(org => org.id === id ? updatedOrganization : org)
      );
      
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
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await organizationService.deleteOrganization(id);
      
      if (success) {
        // Remove from organizations list
        setOrganizations(prev => prev.filter(org => org.id !== id));
        
        // If current organization is deleted, set to first available or null
        if (currentOrganization?.id === id) {
          const remaining = organizations.filter(org => org.id !== id);
          setCurrentOrganization(remaining.length > 0 ? remaining[0] : null);
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
    setIsLoading(true);
    setError(null);
    
    try {
      const logoUrl = await organizationService.uploadLogo(file, organizationId);
      
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
    setIsLoading(true);
    setError(null);
    
    try {
      const signatureUrl = await organizationService.uploadSignature(file, organizationId);
      
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
  
  const value: OrganizationContextType = {
    organizations,
    currentOrganization,
    isLoading,
    error,
    fetchOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    setCurrentOrganization,
    uploadLogo,
    uploadSignature
  };
  
  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
