import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  className = '',
  showLabel = false 
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={className}>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 text-center">
          {clampedProgress}%
        </p>
      )}
    </div>
  );
};

interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 48,
  strokeWidth = 4,
  className = '',
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-indigo-600 dark:text-indigo-500 transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {Math.round(clampedProgress)}%
        </span>
      </div>
    </div>
  );
};

interface UploadProgressProps {
  fileName: string;
  progress: number;
  onCancel?: () => void;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  fileName,
  progress,
  onCancel,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {fileName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Uploading...
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Cancel upload"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      <ProgressBar progress={progress} showLabel />
    </div>
  );
};

interface MultiUploadProgressProps {
  uploads: Array<{
    id: string;
    fileName: string;
    progress: number;
  }>;
  onCancelUpload?: (id: string) => void;
}

export const MultiUploadProgress: React.FC<MultiUploadProgressProps> = ({
  uploads,
  onCancelUpload,
}) => {
  if (uploads.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm w-full space-y-2">
      {uploads.map((upload) => (
        <UploadProgress
          key={upload.id}
          fileName={upload.fileName}
          progress={upload.progress}
          onCancel={onCancelUpload ? () => onCancelUpload(upload.id) : undefined}
        />
      ))}
    </div>
  );
};
