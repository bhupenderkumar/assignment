// src/hooks/useProgressOverlay.ts
import { useState, useCallback } from 'react';

interface ProgressState {
  isVisible: boolean;
  progress: number;
  status: string;
}

interface UseProgressOverlayReturn extends ProgressState {
  showProgress: (initialStatus?: string) => void;
  updateProgress: (newProgress: number, newStatus: string) => void;
  hideProgress: () => void;
  resetProgress: () => void;
}

export const useProgressOverlay = (initialProgress = 0, initialStatus = ''): UseProgressOverlayReturn => {
  const [state, setState] = useState<ProgressState>({
    isVisible: false,
    progress: initialProgress,
    status: initialStatus
  });

  const showProgress = useCallback((initialStatus?: string) => {
    setState(prev => ({
      ...prev,
      isVisible: true,
      progress: 0,
      status: initialStatus || 'Starting...'
    }));
  }, []);

  const updateProgress = useCallback((newProgress: number, newStatus: string) => {
    setState(prev => ({
      ...prev,
      progress: Math.min(Math.max(0, newProgress), 100), // Ensure progress is between 0-100
      status: newStatus
    }));
  }, []);

  const hideProgress = useCallback(() => {
    setState(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  const resetProgress = useCallback(() => {
    setState({
      isVisible: false,
      progress: 0,
      status: ''
    });
  }, []);

  return {
    ...state,
    showProgress,
    updateProgress,
    hideProgress,
    resetProgress
  };
};

export default useProgressOverlay;
