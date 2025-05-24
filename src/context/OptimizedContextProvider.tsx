// src/context/OptimizedContextProvider.tsx
import React, { createContext, useContext, useMemo, useCallback, ReactNode } from 'react';
import { ConfigurationProvider } from './ConfigurationContext';
import { DatabaseStateProvider } from './DatabaseStateContext';
import { SupabaseAuthProvider } from './SupabaseAuthContext';
import { OrganizationProvider } from './OrganizationContext';
import { OrganizationJoinRequestProvider } from './OrganizationJoinRequestContext';
import { InteractiveAssignmentProvider } from './InteractiveAssignmentContext';

/**
 * Optimized context provider that reduces unnecessary re-renders
 * by memoizing context values and using stable references
 */

interface OptimizedContextState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

interface OptimizedContextType {
  state: OptimizedContextState;
  actions: {
    refresh: () => void;
    clearError: () => void;
  };
}

const OptimizedContext = createContext<OptimizedContextType | undefined>(undefined);

export const useOptimizedContext = () => {
  const context = useContext(OptimizedContext);
  if (!context) {
    throw new Error('useOptimizedContext must be used within OptimizedContextProvider');
  }
  return context;
};

interface OptimizedContextProviderProps {
  children: ReactNode;
}

/**
 * Memoized provider wrapper to prevent unnecessary re-renders
 */
const MemoizedProvider = React.memo<{
  children: ReactNode;
  Provider: React.ComponentType<{ children: ReactNode }>
}>(({ children, Provider }) => (
  <Provider>{children}</Provider>
));

MemoizedProvider.displayName = 'MemoizedProvider';

/**
 * Optimized context provider that combines all context providers
 * with performance optimizations
 */
export const OptimizedContextProvider: React.FC<OptimizedContextProviderProps> = ({ children }) => {
  const [state, setState] = React.useState<OptimizedContextState>({
    isInitialized: false,
    isLoading: true,
    error: null
  });

  // Memoized actions to prevent re-renders
  const actions = useMemo(() => ({
    refresh: () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      // Trigger refresh logic here
      setTimeout(() => {
        setState(prev => ({ ...prev, isLoading: false, isInitialized: true }));
      }, 100);
    },
    clearError: () => {
      setState(prev => ({ ...prev, error: null }));
    }
  }), []);

  // Memoized context value
  const contextValue = useMemo(() => ({
    state,
    actions
  }), [state, actions]);

  // Memoized provider components to prevent re-creation
  const providers = useMemo(() => [
    ConfigurationProvider,
    DatabaseStateProvider,
    SupabaseAuthProvider,
    OrganizationProvider,
    OrganizationJoinRequestProvider,
    InteractiveAssignmentProvider
  ], []);

  // Render nested providers efficiently
  const renderProviders = useCallback((
    providers: React.ComponentType<{ children: ReactNode }>[],
    children: ReactNode,
    index = 0
  ): ReactNode => {
    if (index >= providers.length) {
      return children;
    }

    const Provider = providers[index];
    return (
      <MemoizedProvider Provider={Provider}>
        {renderProviders(providers, children, index + 1)}
      </MemoizedProvider>
    );
  }, []);

  return (
    <OptimizedContext.Provider value={contextValue}>
      {renderProviders(providers, children)}
    </OptimizedContext.Provider>
  );
};

/**
 * Performance monitoring hook for context providers
 */
export const useContextPerformance = () => {
  const renderCount = React.useRef(0);
  const lastRenderTime = React.useRef(Date.now());

  React.useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (process.env.NODE_ENV === 'development') {
      console.log(`Context render #${renderCount.current}, time since last: ${timeSinceLastRender}ms`);
    }
  });

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current
  };
};

/**
 * Hook to prevent unnecessary re-renders in child components
 */
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  const callbackRef = React.useRef(callback);
  const depsRef = React.useRef(deps);

  // Update callback if dependencies changed
  React.useEffect(() => {
    callbackRef.current = callback;
    depsRef.current = deps;
  }, deps);

  // Return stable callback reference
  return React.useCallback(
    ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
    []
  );
};

/**
 * Hook to memoize expensive computations
 */
export const useStableMemo = <T extends unknown>(
  factory: () => T,
  deps: React.DependencyList
): T => {
  const valueRef = React.useRef<T>();
  const depsRef = React.useRef<React.DependencyList>();

  // Check if dependencies changed
  const depsChanged = !depsRef.current ||
    deps.length !== depsRef.current.length ||
    deps.some((dep, index) => dep !== depsRef.current![index]);

  if (depsChanged) {
    valueRef.current = factory();
    depsRef.current = deps;
  }

  return valueRef.current!;
};

/**
 * Context selector hook to prevent unnecessary re-renders
 */
export const useContextSelector = <T extends unknown, R extends unknown>(
  context: React.Context<T>,
  selector: (value: T) => R
): R => {
  const value = useContext(context);
  const selectedValue = React.useRef<R>();
  const selectorRef = React.useRef(selector);

  // Update selector reference
  selectorRef.current = selector;

  // Memoize selected value
  const newSelectedValue = useMemo(() => {
    if (!value) return undefined as R;
    return selectorRef.current(value);
  }, [value]);

  // Only update if selected value actually changed
  if (selectedValue.current !== newSelectedValue) {
    selectedValue.current = newSelectedValue;
  }

  return selectedValue.current!;
};

/**
 * Batch state updates to reduce re-renders
 */
export const useBatchedState = <T extends unknown>(
  initialState: T
): [T, (updater: (prev: T) => T) => void] => {
  const [state, setState] = React.useState(initialState);
  const pendingUpdates = React.useRef<((prev: T) => T)[]>([]);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const batchedSetState = useCallback((updater: (prev: T) => T) => {
    pendingUpdates.current.push(updater);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState(prevState => {
        let newState = prevState;
        pendingUpdates.current.forEach(update => {
          newState = update(newState);
        });
        pendingUpdates.current = [];
        return newState;
      });
    }, 0);
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, batchedSetState];
};

export default OptimizedContextProvider;
