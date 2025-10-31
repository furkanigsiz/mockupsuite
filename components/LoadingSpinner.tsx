import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        border-indigo-200 dark:border-indigo-800
        border-t-indigo-600 dark:border-t-indigo-400
        rounded-full
        animate-spin
        ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  );
};

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="text-gray-700 dark:text-gray-300 text-center">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

interface LoadingStateProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  isLoading, 
  message,
  children 
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="text-gray-600 dark:text-gray-400 text-center">
            {message}
          </p>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
