// src/context/DatabaseStateContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/services/supabaseService';

// Define the database states
export type DatabaseState = 'initializing' | 'connecting' | 'ready' | 'error';

// Define the context type
interface DatabaseStateContextType {
  state: DatabaseState;
  error: string | null;
  isReady: boolean;
  retryConnection: () => Promise<boolean>;
  executeWhenReady: <T>(operation: () => Promise<T>) => Promise<T>;
  queueLength: number;
}

// Create the context
const DatabaseStateContext = createContext<DatabaseStateContextType | undefined>(undefined);

// Queue for operations waiting for database to be ready
interface QueuedOperation<T> {
  operation: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: any) => void;
}

// Provider component
export const DatabaseStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DatabaseState>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [, setSupabase] = useState<SupabaseClient | null>(null);
  const [operationQueue, setOperationQueue] = useState<QueuedOperation<any>[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [lastRetryTime, setLastRetryTime] = useState(0);

  // Track if initialization has been attempted
  const initializationAttempted = React.useRef(false);

  // Initialize Supabase and check database connection
  useEffect(() => {
    // Prevent multiple initialization attempts
    if (initializationAttempted.current && retryCount === 0) {
      console.log('DatabaseStateContext: Initialization already attempted, skipping');
      return;
    }

    initializationAttempted.current = true;

    const initializeDatabase = async () => {
      try {
        setState('initializing');
        console.log('DatabaseStateContext: Initializing database connection...');

        // Get Supabase client
        const client = await getSupabaseClient(null);
        setSupabase(client);

        // Test database connection
        setState('connecting');
        console.log('DatabaseStateContext: Testing database connection...');

        // Try multiple tables to test connection
        const tablesToTest = ['interactive_assignment', 'user_progress', 'user_profile'];
        let connectionSuccessful = false;

        for (const table of tablesToTest) {
          try {
            const { error } = await client
              .from(table)
              .select('id')
              .limit(1);

            if (!error) {
              console.log(`DatabaseStateContext: Connection successful using table: ${table}`);
              connectionSuccessful = true;
              break;
            }
          } catch (tableError) {
            console.warn(`DatabaseStateContext: Error testing table ${table}:`, tableError);
          }
        }

        if (connectionSuccessful) {
          console.log('DatabaseStateContext: Database connection established successfully');
          setState('ready');
          setError(null);
          window._supabaseReady = true;

          // Process any queued operations
          processQueue();
        } else {
          throw new Error('Could not connect to any database tables');
        }
      } catch (err) {
        console.error('DatabaseStateContext: Error initializing database:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown database error';
        setState('error');
        setError(errorMessage);

        // Retry connection after a delay if not too many attempts
        if (retryCount < 3) { // Reduced from 5 to 3 to prevent too many retries
          const retryDelay = Math.min(1000 * Math.pow(1.5, retryCount), 5000); // Reduced max delay
          console.log(`DatabaseStateContext: Will retry in ${retryDelay/1000} seconds (attempt ${retryCount + 1})`);

          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, retryDelay);
        } else {
          console.log('DatabaseStateContext: Maximum retry attempts reached, setting state to ready anyway');
          // Set state to ready anyway to prevent blocking the app
          setState('ready');
          window._supabaseReady = true;
        }
      }
    };

    initializeDatabase();
  }, [retryCount]);

  // Process the operation queue when database is ready
  const processQueue = () => {
    if (state === 'ready' && operationQueue.length > 0) {
      console.log(`DatabaseStateContext: Processing ${operationQueue.length} queued operations`);

      // Process all queued operations
      const queue = [...operationQueue];
      setOperationQueue([]);

      queue.forEach(async ({ operation, resolve, reject }) => {
        try {
          const result = await operation();
          resolve(result);
        } catch (err) {
          console.error('DatabaseStateContext: Error executing queued operation:', err);
          reject(err);
        }
      });
    }
  };

  // Execute operation when database is ready, or queue it
  const executeWhenReady = async <T,>(operation: () => Promise<T>): Promise<T> => {
    if (state === 'ready') {
      return operation();
    }

    console.log('DatabaseStateContext: Database not ready, queueing operation');
    return new Promise<T>((resolve, reject) => {
      setOperationQueue(prev => [...prev, { operation, resolve, reject }]);
    });
  };

  // Retry database connection
  const retryConnection = async (): Promise<boolean> => {
    // Prevent too frequent retries (at least 2 seconds between retries)
    const now = Date.now();
    if (now - lastRetryTime < 2000) {
      console.log('DatabaseStateContext: Retry attempted too soon, please wait');
      return false;
    }

    setLastRetryTime(now);
    console.log('DatabaseStateContext: Manually retrying database connection');
    setRetryCount(prev => prev + 1);
    return true;
  };

  // When state changes to ready, process the queue
  useEffect(() => {
    if (state === 'ready') {
      processQueue();
    }
  }, [state]);

  const value: DatabaseStateContextType = {
    state,
    error,
    isReady: state === 'ready',
    retryConnection,
    executeWhenReady,
    queueLength: operationQueue.length
  };

  return (
    <DatabaseStateContext.Provider value={value}>
      {children}
    </DatabaseStateContext.Provider>
  );
};

// Custom hook to use the database state context
export const useDatabaseState = () => {
  const context = useContext(DatabaseStateContext);
  if (context === undefined) {
    throw new Error('useDatabaseState must be used within a DatabaseStateProvider');
  }
  return context;
};
