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

  // Track connection attempt in progress
  const connectionInProgress = React.useRef(false);

  // Initialize Supabase and check database connection
  useEffect(() => {
    // Prevent multiple initialization attempts
    if ((initializationAttempted.current && retryCount === 0) || connectionInProgress.current) {
      return;
    }

    initializationAttempted.current = true;
    connectionInProgress.current = true;

    const initializeDatabase = async () => {
      try {
        setState('initializing');

        // Get Supabase client - reuse existing client if available
        const client = await getSupabaseClient(null);
        setSupabase(client);

        // Test database connection
        setState('connecting');

        // Try multiple tables to test connection, but only try one at a time
        const tablesToTest = ['interactive_assignment', 'user_progress', 'user_profile'];
        const tableToTest = tablesToTest[Math.min(retryCount, tablesToTest.length - 1)];

        try {
          const { error } = await client
            .from(tableToTest)
            .select('id')
            .limit(1);

          if (!error) {
            // Connection successful
            setState('ready');
            setError(null);
            window._supabaseReady = true;

            // Process any queued operations
            processQueue();
          } else {
            throw new Error(`Error connecting to table ${tableToTest}: ${error.message}`);
          }
        } catch (tableError) {
          // If this specific table failed, try the next one on retry
          throw new Error(`Could not connect to table ${tableToTest}`);
        }
      } catch (err) {
        console.error('DatabaseStateContext: Error initializing database:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown database error';
        setState('error');
        setError(errorMessage);

        // Retry connection after a delay if not too many attempts
        if (retryCount < 2) { // Only retry twice to minimize API calls
          const retryDelay = 2000 + (retryCount * 1000); // Simple linear backoff: 2s, 3s

          setTimeout(() => {
            connectionInProgress.current = false;
            setRetryCount(prev => prev + 1);
          }, retryDelay);
        } else {
          // Set state to ready anyway to prevent blocking the app
          setState('ready');
          window._supabaseReady = true;
          connectionInProgress.current = false;
        }
      } finally {
        if (state === 'ready' || retryCount >= 2) {
          connectionInProgress.current = false;
        }
      }
    };

    initializeDatabase();
  }, [retryCount, state]);

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
    // If database is ready or we've exceeded retry attempts, execute immediately
    if (state === 'ready' || (retryCount >= 2 && state === 'error')) {
      try {
        return await operation();
      } catch (error) {
        console.error('DatabaseStateContext: Error executing operation:', error);
        throw error;
      }
    }

    // If we're still initializing or connecting, queue the operation
    return new Promise<T>((resolve, reject) => {
      // Add to queue with a timeout to prevent operations from being stuck forever
      const timeoutId = setTimeout(() => {
        // If operation times out, remove it from queue and reject
        setOperationQueue(prev => prev.filter(op =>
          !(op.resolve === resolve && op.reject === reject)
        ));
        reject(new Error('Operation timed out waiting for database'));
      }, 10000); // 10 second timeout

      setOperationQueue(prev => [
        ...prev,
        {
          operation: async () => {
            clearTimeout(timeoutId);
            return operation();
          },
          resolve,
          reject
        }
      ]);
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
