# Organization System Architecture Plan

## Overview

This document outlines the architecture for implementing an organization-based system in the interactive assignments application. The system will allow:

1. Admin users to create organizations
2. Regular users to join existing organizations
3. Content (assignments, questions) to be associated with specific organizations
4. Users to only see content from their organization

## Current System Analysis

The application currently has:
- Authentication via Supabase Auth
- Organization and user_organization tables already exist
- Interactive assignments and questions tables
- No current organization-based filtering of content

## Data Model

### Existing Tables
- `organization`: Stores organization details
- `user_organization`: Maps users to organizations with roles
- `interactive_assignment`: Has an `organization_id` column (nullable)
- `interactive_question`: Linked to assignments

### Required Changes
1. Make `organization_id` required for new assignments
2. Add organization selection during user onboarding
3. Add organization creation for admin users
4. Filter all content queries by organization

## User Roles and Permissions

### Organization Roles
1. **Owner**
   - Can create and manage the organization
   - Can add/remove users
   - Can create/edit all content
   - Can assign admin roles

2. **Admin**
   - Can add/remove regular users
   - Can create/edit content
   - Cannot modify the organization settings

3. **Member**
   - Can view and interact with content
   - Cannot create or edit content (unless specifically granted)

## User Flows

### New User Registration
1. User signs up with email/password
2. After successful registration, user is prompted to either:
   - Create a new organization (becomes Owner)
   - Join an existing organization (becomes Member)
3. If joining, user enters organization name
4. System validates and associates user with the organization

### Existing User Login
1. User logs in with credentials
2. System retrieves user's organization(s)
3. If user belongs to multiple organizations, prompt to select one
4. User is directed to dashboard showing only their organization's content

### Organization Creation
1. User selects "Create Organization" option
2. User enters organization details:
   - Name
   - Type (company, school, other)
   - Branding elements (logo, colors, etc.)
3. System creates organization and assigns user as Owner
4. User is directed to organization dashboard

### Content Creation
1. When creating new assignments, the system automatically associates them with the user's current organization
2. All queries for assignments filter by the user's organization

## Technical Implementation

### Database Changes
- No schema changes needed as the required tables already exist
- Add RLS (Row Level Security) policies to enforce organization-based access

### Authentication Context Updates
1. Enhance `SupabaseAuthContext` to include:
   - User's organizations
   - Current active organization
   - Organization switching functionality

2. Create a new `OrganizationSwitcher` component for the UI

### Row Level Security Policies

```sql
-- Example RLS policy for interactive_assignment table
CREATE POLICY "Users can view assignments from their organizations" ON interactive_assignment
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organization
      WHERE user_id = auth.uid()
    )
  );

-- Example RLS policy for creating assignments
CREATE POLICY "Users can create assignments in their organizations" ON interactive_assignment
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organization
      WHERE user_id = auth.uid()
    )
  );
```

### UI Components

1. **Organization Creation Form**
   - Fields for organization details
   - Logo upload functionality
   - Color picker for branding

2. **Organization Joining Form**
   - Organization name input
   - Validation against existing organizations

3. **Organization Switcher**
   - Dropdown in header/sidebar
   - Shows all organizations user belongs to
   - Allows switching between them

4. **User Management Interface** (for Owners/Admins)
   - List of users in organization
   - Role assignment
   - Invite new users functionality

## Implementation Plan

### Phase 1: Core Organization Infrastructure
1. Update `SupabaseAuthContext` to include organization data
2. Create organization selection during onboarding
3. Implement organization-based filtering for assignments

### Phase 2: Organization Management
1. Create organization management interface for Owners
2. Implement user role management
3. Add organization switching functionality

### Phase 3: Enhanced Features
1. Implement organization invitations
2. Add organization-specific analytics
3. Create organization branding customization

## Security Considerations

1. **Row Level Security**
   - Implement RLS policies for all tables to enforce organization-based access
   - Ensure policies are comprehensive and tested

2. **Role-Based Access Control**
   - Enforce role permissions at both database and application levels
   - Validate all operations against user roles

3. **Data Isolation**
   - Ensure complete isolation of data between organizations
   - Audit queries to confirm proper filtering

## User Experience Considerations

1. **Onboarding**
   - Clear guidance for new users on organization creation vs. joining
   - Simple process for entering organization details

2. **Organization Switching**
   - Intuitive UI for users belonging to multiple organizations
   - Clear indication of which organization is currently active

3. **Permissions Clarity**
   - Users should understand what they can and cannot do based on their role
   - Provide helpful messages when actions are restricted

## Testing Strategy

1. **Unit Tests**
   - Test organization creation, joining, and switching
   - Verify role-based permissions

2. **Integration Tests**
   - Test end-to-end flows for different user roles
   - Verify data isolation between organizations

3. **Security Tests**
   - Attempt to access data across organization boundaries
   - Verify RLS policies are effective
