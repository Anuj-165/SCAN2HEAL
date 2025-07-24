import React from 'react';
import { Heart, Activity } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'medical' | 'heartbeat';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  variant = 'default',
  text 
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  if (variant === 'medical') {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className={`${sizes[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        {text && (
          <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">{text}</p>
        )}
      </div>
    );
  }

  if (variant === 'heartbeat') {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <Heart className={`${sizes[size]} text-red-500 animate-pulse`} />
        {text && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className={`${sizes[size]} border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400 rounded-full animate-spin`}></div>
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;