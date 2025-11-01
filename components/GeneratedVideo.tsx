import React from 'react';
import { VideoResult } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import Spinner from './Spinner';
import VideoIcon from './icons/VideoIcon';

interface GeneratedVideoProps {
  result: VideoResult | null;
  isLoading: boolean;
  error: string | null;
  progressText: string;
  onSaveVideo?: () => void;
  onDownloadVideo?: () => void;
  onRemoveVideo?: () => void;
  isSaved?: boolean;
}

const GeneratedVideo: React.FC<GeneratedVideoProps> = ({
  result,
  isLoading,
  error,
  progressText,
  onSaveVideo,
  onDownloadVideo,
  onRemoveVideo,
  isSaved = true, // Videos are automatically saved during generation
}) => {
  const { t } = useTranslations();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner progressText={progressText} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 text-lg font-semibold mb-2">
            {t('error_title')}
          </div>
          <div className="text-neutral-dark dark:text-gray-300">{error}</div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <VideoIcon className="h-16 w-16 mx-auto mb-4 text-neutral-medium dark:text-gray-600" />
          <div className="text-neutral-dark dark:text-white text-xl font-bold mb-2">
            Your video will appear here
          </div>
          <div className="text-neutral-medium dark:text-gray-400">
            Upload an image and describe your video to get started
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-neutral-light dark:bg-neutral-dark/40 rounded-lg p-4">
        <video
          src={result.generatedUrl}
          controls
          className="w-full rounded-lg"
          style={{ maxHeight: '600px' }}
        >
          Your browser does not support the video tag.
        </video>
        
        <div className="mt-4 space-y-3">
          <div className="flex justify-between items-center">
            <div className="text-sm text-neutral-medium dark:text-gray-400">
              {result.duration && `${result.duration}s`}
            </div>
            {isSaved && (
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                ✓ {t('video_saved_to_project') || 'Saved to project'}
              </div>
            )}
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {onDownloadVideo && (
              <button
                onClick={onDownloadVideo}
                className="flex-1 px-4 py-2 bg-primary text-background-dark rounded-lg font-semibold hover:bg-primary/90 transition"
              >
                {t('download_video_button') || 'Download Video'}
              </button>
            )}
            
            {onRemoveVideo && isSaved && (
              <button
                onClick={onRemoveVideo}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
              >
                {t('remove_video_button') || 'Remove'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedVideo;
