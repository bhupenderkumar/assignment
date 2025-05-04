// src/lib/services/organizationService.ts
import { SupabaseClient, User } from '@supabase/supabase-js';
import { Organization, OrganizationInput, OrganizationUpdateInput } from '../../types/organization';
import { getSupabaseClient } from './supabaseService';
import toast from 'react-hot-toast';

/**
 * Map a database row to an Organization object
 * @param row Database row
 * @returns Organization object
 */
const mapRowToOrganization = (row: any): Organization => {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    headerText: row.header_text,
    signatureUrl: row.signature_url,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
};

/**
 * Map an Organization object to a database row
 * @param organization Organization object
 * @returns Database row
 */
const mapOrganizationToRow = (organization: OrganizationInput, userId: string): any => {
  return {
    name: organization.name,
    type: organization.type,
    logo_url: organization.logoUrl,
    primary_color: organization.primaryColor,
    secondary_color: organization.secondaryColor,
    header_text: organization.headerText,
    signature_url: organization.signatureUrl,
    created_by: userId
  };
};

/**
 * Map an Organization update object to a database row
 * @param organization Organization update object
 * @returns Database row
 */
const mapOrganizationUpdateToRow = (organization: OrganizationUpdateInput): any => {
  const row: any = {};

  if (organization.name !== undefined) row.name = organization.name;
  if (organization.type !== undefined) row.type = organization.type;
  if (organization.logoUrl !== undefined) row.logo_url = organization.logoUrl;
  if (organization.primaryColor !== undefined) row.primary_color = organization.primaryColor;
  if (organization.secondaryColor !== undefined) row.secondary_color = organization.secondaryColor;
  if (organization.headerText !== undefined) row.header_text = organization.headerText;
  if (organization.signatureUrl !== undefined) row.signature_url = organization.signatureUrl;

  // Always update the updated_at timestamp
  row.updated_at = new Date().toISOString();

  return row;
};

/**
 * Create a factory function that returns the organization service
 * @param user Current user (optional)
 * @returns Organization service
 */
export const createOrganizationService = (user: User | null = null) => {
  // Get the Supabase client
  let supabasePromise: Promise<SupabaseClient> | null = null;

  const getClient = async (): Promise<SupabaseClient> => {
    if (!supabasePromise) {
      supabasePromise = getSupabaseClient(user);
    }
    return supabasePromise;
  };

  return {
    /**
     * Get the Supabase client
     * @returns Promise that resolves to a Supabase client
     */
    getClient,

    /**
     * Get all organizations for the current user
     * @returns Promise that resolves to an array of organizations
     */
    async getOrganizations(): Promise<Organization[]> {
      try {
        const supabase = await getClient();

        // Get the current user ID
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          console.log('No current user, returning empty organizations array');
          return [];
        }

        // First get the user's organization memberships
        const { data: userOrgs, error: userOrgsError } = await supabase
          .from('user_organization')
          .select('organization_id')
          .eq('user_id', currentUser.id);

        if (userOrgsError) {
          console.error('Error fetching user organizations:', userOrgsError);
          throw userOrgsError;
        }

        // If user has no organizations, return empty array
        if (!userOrgs || userOrgs.length === 0) {
          console.log('User has no organization memberships');
          return [];
        }

        // Get the organization IDs the user is a member of
        const orgIds = userOrgs.map(uo => uo.organization_id);
        console.log('User is a member of organizations:', orgIds);

        // Fetch the organizations the user is a member of
        const { data, error } = await supabase
          .from('organization')
          .select('*')
          .in('id', orgIds)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(mapRowToOrganization);
      } catch (error) {
        console.error('Error getting organizations:', error);
        toast.error('Failed to get organizations');
        throw error;
      }
    },

    /**
     * Search for organizations by name
     * @param searchTerm Search term to match against organization names
     * @returns Promise that resolves to an array of organizations
     */
    async searchOrganizations(searchTerm: string): Promise<Organization[]> {
      try {
        const supabase = await getClient();

        // If search term is empty, return a limited set of organizations
        if (!searchTerm.trim()) {
          console.log('Empty search term, returning limited set of organizations');
          const { data, error } = await supabase
            .from('organization')
            .select('*')
            .order('name', { ascending: true })
            .limit(10);

          if (error) throw error;
          return (data || []).map(mapRowToOrganization);
        }

        // Normalize the search term - convert to lowercase
        const normalizedSearchTerm = searchTerm.toLowerCase().trim();
        console.log('Normalized search term:', normalizedSearchTerm);

        // Search for organizations by name (case insensitive)
        // Try multiple search patterns to increase chances of finding matches
        const { data, error } = await supabase
          .from('organization')
          .select('*')
          .or(`name.ilike.%${normalizedSearchTerm}%,name.ilike.${normalizedSearchTerm}%,name.ilike.%${normalizedSearchTerm}`)
          .order('name', { ascending: true })
          .limit(20);

        if (error) throw error;

        console.log('Raw search results:', data);

        // Return the search results
        return (data || []).map(mapRowToOrganization);
      } catch (error) {
        console.error('Error searching organizations:', error);
        toast.error('Failed to search organizations');
        throw error;
      }
    },

    /**
     * Get an organization by ID
     * @param id Organization ID
     * @returns Promise that resolves to an organization or null if not found
     */
    async getOrganizationById(id: string): Promise<Organization | null> {
      try {
        const supabase = await getClient();

        const { data, error } = await supabase
          .from('organization')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;

        return data ? mapRowToOrganization(data) : null;
      } catch (error) {
        console.error(`Error getting organization ${id}:`, error);
        toast.error('Failed to get organization');
        throw error;
      }
    },

    /**
     * Create a new organization
     * @param organization Organization data
     * @returns Promise that resolves to the created organization
     */
    async createOrganization(organization: OrganizationInput): Promise<Organization> {
      try {
        const supabase = await getClient();

        // Get the current user ID
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from('organization')
          .insert(mapOrganizationToRow(organization, currentUser.id))
          .select()
          .single();

        if (error) throw error;

        // Also create a user_organization record to establish ownership
        const { error: userOrgError } = await supabase
          .from('user_organization')
          .insert({
            user_id: currentUser.id,
            organization_id: data.id,
            role: 'owner'
          });

        if (userOrgError) {
          console.error('Error creating user_organization record:', userOrgError);
          // Continue anyway - the organization was created successfully
        }

        return mapRowToOrganization(data);
      } catch (error) {
        console.error('Error creating organization:', error);
        toast.error('Failed to create organization');
        throw error;
      }
    },

    /**
     * Update an organization
     * @param id Organization ID
     * @param updates Organization updates
     * @returns Promise that resolves to the updated organization
     */
    async updateOrganization(id: string, updates: OrganizationUpdateInput): Promise<Organization> {
      try {
        const supabase = await getClient();

        const { data, error } = await supabase
          .from('organization')
          .update(mapOrganizationUpdateToRow(updates))
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        return mapRowToOrganization(data);
      } catch (error) {
        console.error(`Error updating organization ${id}:`, error);
        toast.error('Failed to update organization');
        throw error;
      }
    },

    /**
     * Delete an organization
     * @param id Organization ID
     * @returns Promise that resolves to true if successful
     */
    async deleteOrganization(id: string): Promise<boolean> {
      try {
        const supabase = await getClient();

        const { error } = await supabase
          .from('organization')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return true;
      } catch (error) {
        console.error(`Error deleting organization ${id}:`, error);
        toast.error('Failed to delete organization');
        throw error;
      }
    },

    /**
     * Upload an organization logo
     * @param file Logo file
     * @param organizationId Organization ID
     * @returns Promise that resolves to the logo URL
     */
    async uploadLogo(file: File, organizationId: string): Promise<string> {
      try {
        const supabase = await getClient();

        // Upload to storage
        const { data, error } = await supabase.storage
          .from('organization-logos')
          .upload(`${organizationId}/${file.name}`, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) throw error;

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('organization-logos')
          .getPublicUrl(data.path);

        return publicUrl;
      } catch (error) {
        console.error('Error uploading logo:', error);
        toast.error('Failed to upload logo');
        throw error;
      }
    },

    /**
     * Upload an organization signature
     * @param file Signature file
     * @param organizationId Organization ID
     * @returns Promise that resolves to the signature URL
     */
    async uploadSignature(file: File, organizationId: string): Promise<string> {
      try {
        const supabase = await getClient();

        // Upload to storage
        const { data, error } = await supabase.storage
          .from('organization-signatures')
          .upload(`${organizationId}/${file.name}`, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) throw error;

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('organization-signatures')
          .getPublicUrl(data.path);

        return publicUrl;
      } catch (error) {
        console.error('Error uploading signature:', error);
        toast.error('Failed to upload signature');
        throw error;
      }
    }
  };
};

// Export a singleton instance for convenience
export const organizationService = createOrganizationService();
