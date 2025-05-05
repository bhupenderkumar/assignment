// src/hooks/useUserRole.ts
import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useOrganization } from '../context/OrganizationContext';
import { OrganizationRole } from '../types/organization';

/**
 * Hook to get the current user's role in the current organization
 * @returns Object containing the user's role and loading state
 */
export const useUserRole = () => {
  const [role, setRole] = useState<OrganizationRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user, supabase, isAuthenticated } = useSupabaseAuth();
  const { currentOrganization } = useOrganization();
  
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!isAuthenticated || !user || !currentOrganization || !supabase) {
        setRole(null);
        setIsAdmin(false);
        setIsOwner(false);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Get the user's role in the current organization
        const { data, error } = await supabase
          .from('user_organization')
          .select('role')
          .eq('user_id', user.id)
          .eq('organization_id', currentOrganization.id)
          .single();
        
        if (error) {
          console.error('Error fetching user role:', error);
          setRole(null);
          setIsAdmin(false);
          setIsOwner(false);
          return;
        }
        
        if (data) {
          const userRole = data.role as OrganizationRole;
          setRole(userRole);
          setIsAdmin(userRole === 'admin' || userRole === 'owner');
          setIsOwner(userRole === 'owner');
        } else {
          setRole(null);
          setIsAdmin(false);
          setIsOwner(false);
        }
      } catch (err) {
        console.error('Error in fetchUserRole:', err);
        setRole(null);
        setIsAdmin(false);
        setIsOwner(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserRole();
  }, [isAuthenticated, user, currentOrganization, supabase]);
  
  return { role, isAdmin, isOwner, isLoading };
};
