import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`
        animate-pulse bg-gray-200 dark:bg-gray-700 rounded
        ${className}
      `}
    />
  );
};

export const ImageSkeleton: React.FC = () => {
  return (
    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
      <Skeleton className="w-full h-full" />
    </div>
  );
};

export const ImageGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <ImageSkeleton key={index} />
      ))}
    </div>
  );
};

export const ProjectCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <Skeleton className="h-6 w-3/4 mb-3" />
      <Skeleton className="h-4 w-1/2 mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
};

export const ProjectListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProjectCardSkeleton key={index} />
      ))}
    </div>
  );
};

export const GallerySkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <ImageGridSkeleton count={8} />
    </div>
  );
};
