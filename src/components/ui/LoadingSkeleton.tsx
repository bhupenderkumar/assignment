// src/components/ui/LoadingSkeleton.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'avatar' | 'button';
  lines?: number;
  animate?: boolean;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  variant = 'text',
  lines = 1,
  animate = true
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700 rounded';
  const animationClasses = animate ? 'animate-pulse' : '';

  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 w-full';
      case 'card':
        return 'h-32 w-full';
      case 'avatar':
        return 'h-12 w-12 rounded-full';
      case 'button':
        return 'h-10 w-24';
      default:
        return 'h-4 w-full';
    }
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            initial={animate ? { opacity: 0.3 } : {}}
            animate={animate ? { opacity: [0.3, 0.7, 0.3] } : {}}
            transition={animate ? { duration: 1.5, repeat: Infinity, delay: index * 0.1 } : {}}
            className={`${baseClasses} ${getVariantClasses()} ${
              index === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={animate ? { opacity: 0.3 } : {}}
      animate={animate ? { opacity: [0.3, 0.7, 0.3] } : {}}
      transition={animate ? { duration: 1.5, repeat: Infinity } : {}}
      className={`${baseClasses} ${getVariantClasses()} ${animationClasses} ${className}`}
    />
  );
};

// Predefined skeleton layouts
export const UserCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 rounded-lg border ${className}`}>
    <div className="flex items-start space-x-3">
      <LoadingSkeleton variant="avatar" />
      <div className="flex-1 space-y-2">
        <LoadingSkeleton variant="text" className="w-3/4" />
        <LoadingSkeleton variant="text" className="w-1/2" />
        <div className="flex space-x-2 mt-2">
          <LoadingSkeleton variant="button" className="w-16 h-6" />
          <LoadingSkeleton variant="button" className="w-12 h-6" />
        </div>
      </div>
    </div>
  </div>
);

export const ActivityCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 rounded-lg border ${className}`}>
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-2">
          <LoadingSkeleton variant="text" className="w-3/4" />
          <LoadingSkeleton variant="text" className="w-1/2" />
        </div>
        <LoadingSkeleton variant="button" className="w-16 h-8" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <LoadingSkeleton variant="text" className="h-3" />
        <LoadingSkeleton variant="text" className="h-3" />
        <LoadingSkeleton variant="text" className="h-3" />
        <LoadingSkeleton variant="text" className="h-3" />
      </div>
    </div>
  </div>
);

export const StatsSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 ${className}`}>
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="text-center space-y-2">
        <LoadingSkeleton variant="text" className="w-12 h-8 mx-auto" />
        <LoadingSkeleton variant="text" className="w-16 h-4 mx-auto" />
      </div>
    ))}
  </div>
);

export default LoadingSkeleton;
