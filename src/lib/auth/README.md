# Clerk-Supabase Integration

This directory contains the integration between Clerk (authentication) and Supabase (database).

## Architecture

The integration follows these principles:

1. **Single Source of Truth**: The Clerk user is the source of truth for authentication.
2. **Proper JWT Handling**: Clerk JWTs are used to authenticate with Supabase.
3. **Consistent User IDs**: Clerk user IDs are mapped to UUIDs for Supabase.
4. **Singleton Pattern**: Supabase clients are cached to prevent multiple instances.
5. **Error Handling**: Comprehensive error handling with retries and fallbacks.
6. **Database Migrations**: Migrations run only when needed and track their status.

## Key Components

- `clerk-supabase-bridge.ts`: Core integration between Clerk and Supabase
- `../services/supabaseService.ts`: Utility methods for Supabase operations
- `../db/databaseSetupService.ts`: Database initialization and migrations
- `../../context/ClerkAuthContext.tsx`: React context for authentication and database access

## Usage

### In React Components

```tsx
import { useClerkAuth } from '../../context/ClerkAuthContext';

function MyComponent() {
  const { 
    isAuthenticated, 
    user, 
    supabaseUserId,
    db 
  } = useClerkAuth();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  // Fetch data from Supabase
  const fetchData = async () => {
    try {
      const items = await db.fetch('my_table', 
        query => query.eq('user_id', supabaseUserId)
      );
      return items;
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Insert data
  const addItem = async (item) => {
    try {
      const newItem = await db.insert('my_table', {
        ...item,
        user_id: supabaseUserId
      });
      return newItem;
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  // Rest of component...
}
```

### Row Level Security (RLS)

For Supabase tables, use the following RLS policy pattern:

```sql
-- Policy for users to see only their own data
CREATE POLICY "Users can only see their own data" ON my_table
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'sub' = user_id
  );
```

## Troubleshooting

If you encounter authentication issues:

1. Check that Clerk is properly configured with the Supabase JWT template
2. Verify that the Supabase JWT secret matches the one in Clerk
3. Ensure that RLS policies are correctly set up
4. Check the browser console for specific error messages

For database migration issues:

1. Check the `_migration_history` table in Supabase
2. Verify that the database user has the necessary permissions
3. Run migrations manually if needed
