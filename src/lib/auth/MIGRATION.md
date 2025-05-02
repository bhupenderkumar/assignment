# Migration from Clerk to Supabase Auth

This project has been migrated from using Clerk for authentication to using Supabase Auth. This document outlines the changes made during the migration.

## Changes Made

1. **Removed Clerk Dependencies**
   - Removed `@clerk/clerk-react` from package.json
   - Removed ClerkProvider from App.tsx

2. **Added Supabase Auth Context**
   - Created a new `SupabaseAuthContext.tsx` to replace ClerkAuthContext
   - Implemented authentication methods using Supabase Auth
   - Ensured it provides the same functionality as the previous ClerkAuthContext

3. **Updated Authentication Components**
   - Created a new `SupabaseAuth.tsx` component to replace ClerkAuth
   - Updated SignInPage and SignUpPage to use the new component

4. **Updated App Component**
   - Removed ClerkProvider
   - Updated the provider structure to use only SupabaseAuth

5. **Updated Protected Routes**
   - Modified the ProtectedRoute component to use Supabase Auth

6. **Updated User Management**
   - Ensured user profile data is properly handled with Supabase Auth

## Benefits of the Migration

1. **Simplified Architecture**
   - Using a single service (Supabase) for both authentication and database operations
   - Reduced complexity in the codebase
   - Eliminated the need for complex integration between Clerk and Supabase

2. **Improved Performance**
   - Reduced the number of API calls needed for authentication
   - Eliminated the overhead of maintaining two separate services

3. **Better Developer Experience**
   - Simplified authentication flow
   - More consistent API for both authentication and database operations
   - Easier to maintain and extend

## How to Use

The authentication API remains largely the same, but now uses the `useSupabaseAuth` hook instead of `useClerkAuth`. The hook provides the following:

```typescript
const {
  isAuthenticated,  // Boolean indicating if user is authenticated
  isLoading,        // Boolean indicating if auth state is loading
  userId,           // String containing the user's ID
  username,         // String containing the user's name
  userImageUrl,     // String containing the URL to the user's profile image
  signIn,           // Function to sign in with email and password
  signUp,           // Function to sign up with email and password
  signOut,          // Function to sign out
  supabase,         // Supabase client instance
  user,             // Supabase user object
  db                // Database utility methods
} = useSupabaseAuth();
```

## Environment Variables

The application requires the following environment variables:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```
