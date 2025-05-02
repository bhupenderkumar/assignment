// src/hooks/useForceUpdate.ts
import { useState, useCallback } from 'react';

/**
 * A hook that returns a function to force a component to re-render
 * @returns A function that when called will force the component to re-render
 */
export const useForceUpdate = () => {
  const [, setTick] = useState(0);
  
  const forceUpdate = useCallback(() => {
    setTick(tick => tick + 1);
  }, []);
  
  return forceUpdate;
};
