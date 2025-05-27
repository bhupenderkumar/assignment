// src/hooks/useUserRole.ts
import { useState, useEffect, useRef } from 'react';
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

  // Cache to prevent duplicate API calls
  const cacheRef = useRef<{
    [key: string]: {
      role: OrganizationRole | null;
      timestamp: number;
    };
  }>({});

  const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!isAuthenticated || !user || !currentOrganization || !supabase) {
        setRole(null);
        setIsAdmin(false);
        setIsOwner(false);
        setIsLoading(false);
        return;
      }

      // Create cache key
      const cacheKey = `${user.id}-${currentOrganization.id}`;

      // Check cache first
      const cached = cacheRef.current[cacheKey];
      if (cached && (Date.now() - cached.timestamp < CACHE_EXPIRATION)) {
        if (process.env.NODE_ENV === 'development') {
          console.log('useUserRole: Using cached role for', cacheKey);
        }
        setRole(cached.role);
        setIsAdmin(cached.role === 'admin' || cached.role === 'owner');
        setIsOwner(cached.role === 'owner');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        if (process.env.NODE_ENV === 'development') {
          console.log('useUserRole: Fetching role for', cacheKey);
        }

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

          // Cache the result
          cacheRef.current[cacheKey] = {
            role: userRole,
            timestamp: Date.now()
          };

          setRole(userRole);
          setIsAdmin(userRole === 'admin' || userRole === 'owner');
          setIsOwner(userRole === 'owner');
        } else {
          // Cache null result too
          cacheRef.current[cacheKey] = {
            role: null,
            timestamp: Date.now()
          };

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

    // Add a small delay to prevent rapid successive calls
    const timeoutId = setTimeout(fetchUserRole, 50);
    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, user?.id, currentOrganization?.id, supabase]);

  return { role, isAdmin, isOwner, isLoading };
};
