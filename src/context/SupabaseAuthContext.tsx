// src/context/SupabaseAuthContext.tsx
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { SupabaseClient, User, Session, WeakPassword } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { getDatabaseSetupService } from '../lib/db/databaseSetupService';
import { getSupabaseClient } from '../lib/services/supabaseService';
import { useDatabaseState } from './DatabaseStateContext';

// Declare global window property for TypeScript
declare global {
  interface Window {
    _supabaseReady?: boolean;
  }
}

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface SupabaseAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isSupabaseLoading: boolean;
  userId: string | null;
  username: string | null;
  userImageUrl: string | null;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ user: User; session: Session; weakPassword?: WeakPassword }>;
  signUp: (email: string, password: string, metadata?: { name?: string }) => Promise<{ user: User | null; session: Session | null }>;
  supabase: SupabaseClient | null;
  user: User | null;
  // Database service
  db: {
    fetch: <T>(table: string, queryBuilder?: (query: any) => any) => Promise<T[]>;
    fetchById: <T>(table: string, id: string) => Promise<T | null>;
    insert: <T>(table: string, record: Partial<T>) => Promise<T>;
    update: <T>(table: string, id: string, updates: Partial<T>) => Promise<T>;
    delete: (table: string, id: string) => Promise<boolean>;
    executeCustomQuery: <T>(queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>) => Promise<T>;
    callProcedure: <T>(procedure: string, params?: Record<string, any>) => Promise<T>;
  };
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

interface SupabaseAuthProviderProps {
  children: ReactNode;
}

export const SupabaseAuthProvider: React.FC<SupabaseAuthProviderProps> = ({ children }) => {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupabaseLoading, setIsSupabaseLoading] = useState<boolean>(true);
  const [username, setUsername] = useState<string | null>(null);
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const { state: dbState, isReady: isDatabaseReady } = useDatabaseState();

  // Initialize Supabase client
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const initSupabase = async () => {
      try {
        console.log('Initializing Supabase client...');

        // Get the singleton Supabase client
        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Supabase configuration is missing. Check your environment variables.');
        }

        // Use the getSupabaseClient function to get the singleton instance
        const client = await getSupabaseClient(null);
        setSupabase(client);
        console.log('Supabase client created successfully');

        // Get current session
        const { data: { session }, error: sessionError } = await client.auth.getSession();

        if (sessionError) {
          console.error('Error getting session:', sessionError);
        }

        // Set user if session exists
        if (session) {
          console.log('User session found');
          setUser(session.user);
        } else {
          console.log('No user session found');
        }

        // Set up auth state change listener
        const { data: { subscription: authSubscription } } = client.auth.onAuthStateChange(
          (_event: any, session: Session | null) => {
            setUser(session?.user || null);
          }
        );

        subscription = authSubscription;
        console.log('Auth state change listener set up');

        // Database initialization is now handled by DatabaseStateContext
        // We just need to initialize the database setup service for migrations
        if (client) {
          try {
            console.log('Setting up database service...');
            const dbSetupService = getDatabaseSetupService(client);

            // Initialize database with simple progress reporting
            // This will run migrations but not test connections (that's handled by DatabaseStateContext)
            const success = await dbSetupService.initialize();

            if (!success) {
              console.warn('Database initialization was not successful, but we can continue with authentication');
            } else {
              console.log('Database setup service initialized successfully');
            }
          } catch (dbError) {
            console.error('Error initializing database setup service:', dbError);
            // Continue anyway - we can still use authentication
          }
        }

        setIsLoading(false);
        setIsSupabaseLoading(false);
        console.log('Supabase authentication initialization complete');
      } catch (error: unknown) {
        const err = error as Error;
        console.error('Error initializing Supabase client:', err);
        toast.error('Failed to connect to database');
        setIsLoading(false);
        setIsSupabaseLoading(false);
      }
    };

    initSupabase();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Update isSupabaseLoading based on database state
  useEffect(() => {
    if (isDatabaseReady && !isSupabaseLoading) {
      // Both auth and database are ready
      console.log('Both authentication and database are ready');
      window._supabaseReady = true;
    } else if (dbState === 'error' && !isSupabaseLoading) {
      // Auth is ready but database has error
      console.log('Authentication ready but database has error');
      // We still set _supabaseReady to true so auth features work
      window._supabaseReady = true;
    }
  }, [dbState, isDatabaseReady, isSupabaseLoading]);

  // Update user info when user changes
  useEffect(() => {
    if (user) {
      // Set username from user metadata or email
      const metadata = user.user_metadata;
      const name = metadata?.name || metadata?.full_name;
      const email = user.email;

      setUsername(name || email || 'User');

      // Set user image if available
      setUserImageUrl(metadata?.avatar_url || null);
    } else {
      setUsername(null);
      setUserImageUrl(null);
    }
  }, [user]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase client not initialized');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      toast.success('Signed in successfully');
      return data;
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error signing in:', err);
      toast.error(err.message || 'Failed to sign in');
      throw error;
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, metadata?: { name?: string }) => {
    if (!supabase) throw new Error('Supabase client not initialized');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) throw error;

      if (data.session) {
        toast.success('Signed up and logged in successfully');
      } else {
        toast.success('Please check your email to confirm your account');
      }

      return data;
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error signing up:', err);
      toast.error(err.message || 'Failed to sign up');
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    if (!supabase) throw new Error('Supabase client not initialized');

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success('Signed out successfully');
      } catch (error: unknown) {
        const err = error as Error;
        console.error('Error signing out:', err);
        toast.error('Failed to sign out');
    }
  };

  // Database methods
  const dbMethods = {
    fetch: async <T,>(table: string, queryBuilder?: (query: any) => any): Promise<T[]> => {
      if (!supabase) throw new Error('Database service not initialized');

      try {
        let query = supabase.from(table).select('*');

        if (queryBuilder) {
          query = queryBuilder(query);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as T[];
      } catch (error) {
        console.error(`Error fetching from ${table}:`, error);
        throw error;
      }
    },

    fetchById: async <T,>(table: string, id: string): Promise<T | null> => {
      if (!supabase) throw new Error('Database service not initialized');

      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        return data as T;
      } catch (error) {
        console.error(`Error fetching ${table} by ID:`, error);
        throw error;
      }
    },

    insert: async <T,>(table: string, record: Partial<T>): Promise<T> => {
      if (!supabase) throw new Error('Database service not initialized');

      try {
        const { data, error } = await supabase
          .from(table)
          .insert(record)
          .select()
          .single();

        if (error) throw error;
        return data as T;
      } catch (error) {
        console.error(`Error inserting into ${table}:`, error);
        throw error;
      }
    },

    update: async <T,>(table: string, id: string, updates: Partial<T>): Promise<T> => {
      if (!supabase) throw new Error('Database service not initialized');

      try {
        const { data, error } = await supabase
          .from(table)
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data as T;
      } catch (error) {
        console.error(`Error updating ${table}:`, error);
        throw error;
      }
    },

    delete: async (table: string, id: string): Promise<boolean> => {
      if (!supabase) throw new Error('Database service not initialized');

      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error(`Error deleting from ${table}:`, error);
        throw error;
      }
    },

    executeCustomQuery: async <T,>(queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>): Promise<T> => {
      if (!supabase) throw new Error('Database service not initialized');

      try {
        const { data, error } = await queryFn(supabase);

        if (error) throw error;
        if (!data) throw new Error('No data returned from query');

        return data as T;
      } catch (error) {
        console.error('Error executing custom query:', error);
        throw error;
      }
    },

    callProcedure: async <T,>(procedure: string, params: Record<string, any> = {}): Promise<T> => {
      if (!supabase) throw new Error('Database service not initialized');

      try {
        const { data, error } = await supabase.rpc(procedure, params);

        if (error) throw error;
        return data as T;
      } catch (error) {
        console.error(`Error calling procedure ${procedure}:`, error);
        throw error;
      }
    }
  };

  const value: SupabaseAuthContextType = {
    isAuthenticated: !!user,
    isLoading,
    isSupabaseLoading,
    userId: user?.id || null,
    username,
    userImageUrl,
    signOut,
    signIn,
    signUp,
    supabase,
    user,
    db: dbMethods
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};
