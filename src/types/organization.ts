// src/types/organization.ts

/**
 * Organization type
 */
export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  headerText?: string;
  signatureUrl: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Organization type enum
 */
export type OrganizationType = 'company' | 'school' | 'other';

/**
 * User organization role
 */
export type OrganizationRole = 'owner' | 'admin' | 'member';

/**
 * User organization relationship
 */
export interface UserOrganization {
  id: string;
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Organization creation input
 */
export interface OrganizationInput {
  name: string;
  type: OrganizationType;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  headerText?: string;
  signatureUrl: string;
}

/**
 * Organization update input
 */
export interface OrganizationUpdateInput {
  name?: string;
  type?: OrganizationType;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  headerText?: string;
  signatureUrl?: string;
}
