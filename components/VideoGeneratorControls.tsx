import React from 'react';
import { UploadedImage, AppMode } from '../types';
import ImageUploader from './ImageUploader';
import ModeSwitcher from './ModeSwitcher';
import SparklesIcon from './icons/SparklesIcon';
import VideoIcon from './icons/VideoIcon';
import { useTranslations } from '../hooks/useTranslations';

interface VideoGeneratorControlsProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  sourceImage: UploadedImage | null;
  onSourceImageChange: (image: UploadedImage | null) => void;
  videoPrompt: string;
  onVideoPromptChange: (prompt: string) => void;
  videoDuration: number;
  onVideoDurationChange: (duration: number) => void;
  videoAspectRatio: '16:9' | '9:16' | '1:1';
  onVideoAspectRatioChange: (ratio: '16:9' | '9:16' | '1:1') => void;
  isLoading: boolean;
  onGenerate: () => void;
  onSuggestPrompts?: () => void;
  isSuggesting?: boolean;
  suggestedPrompts?: string[];
}

const VideoGeneratorControls: React.FC<VideoGeneratorControlsProps> = ({
  mode,
  onModeChange,
  sourceImage,
  onSourceImageChange,
  videoPrompt,
  onVideoPromptChange,
  videoDuration,
  onVideoDurationChange,
  videoAspectRatio,
  onVideoAspectRatioChange,
  isLoading,
  onGenerate,
  onSuggestPrompts,
  isSuggesting = false,
  suggestedPrompts = [],
}) => {
  const { t } = useTranslations();

  const durationOptions = [5, 7, 8];
  const aspectRatioOptions: Array<{ value: '16:9' | '9:16' | '1:1'; label: 'aspect_ratio_landscape' | 'aspect_ratio_portrait' | 'aspect_ratio_square' }> = [
    { value: '16:9', label: 'aspect_ratio_landscape' },
    { value: '9:16', label: 'aspect_ratio_portrait' },
    { value: '1:1', label: 'aspect_ratio_square' },
  ];

  const handleImageChange = (images: UploadedImage[]) => {
    onSourceImageChange(images.length > 0 ? images[0] : null);
  };

  const isGenerateDisabled = isLoading || !sourceImage || !videoPrompt.trim();

  return (
    <div className="flex flex-col gap-8">
      {/* Mode Switcher */}
      <div className="px-4">
        <ModeSwitcher currentMode={mode} onModeChange={onModeChange} />
      </div>

      {/* Image Uploader Section */}
      <ImageUploader
        onImagesChange={handleImageChange}
        uploadedImages={sourceImage ? [sourceImage] : []}
      />

      {/* Video Prompt Input */}
      <div className="flex flex-col gap-4">
        <h2 className="text-neutral-dark dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4">
          {t('video_prompt_title')}
        </h2>
        <div className="px-4">
          <textarea
            id="video-prompt"
            value={videoPrompt}
            onChange={(e) => onVideoPromptChange(e.target.value)}
            placeholder={t('video_prompt_placeholder') as string}
            rows={4}
            className="w-full bg-neutral-light dark:bg-neutral-dark/40 border-2 border-transparent rounded-lg p-3 text-neutral-dark dark:text-gray-200 focus:ring-2 focus:ring-primary focus:border-primary transition"
          />
        </div>
      </div>

      {/* Suggest Prompts Button */}
      {onSuggestPrompts && (
        <div className="space-y-2 px-4">
          <button
            onClick={onSuggestPrompts}
            disabled={isSuggesting || !sourceImage}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg bg-neutral-light dark:bg-neutral-dark/40 hover:bg-neutral-medium/20 dark:hover:bg-neutral-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SparklesIcon className="h-4 w-4 text-custom-accent" />
            {isSuggesting ? t('suggest_button_loading') : t('suggest_button')}
          </button>
          {suggestedPrompts.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {suggestedPrompts.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onVideoPromptChange(suggestion)}
                  className="text-xs text-left p-2 bg-neutral-light dark:bg-neutral-dark/40 hover:bg-neutral-medium/20 dark:hover:bg-neutral-dark rounded-md transition-colors truncate"
                  title={suggestion}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Duration Selector */}
      <div className="px-4">
        <h2 className="text-neutral-dark dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4">
          {t('video_duration_label')}
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {durationOptions.map((duration) => (
            <button
              key={duration}
              onClick={() => onVideoDurationChange(duration)}
              className={`py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${
                videoDuration === duration
                  ? 'bg-primary text-background-dark'
                  : 'bg-neutral-light dark:bg-neutral-dark/40 hover:bg-neutral-medium/20 dark:hover:bg-neutral-dark'
              }`}
            >
              {duration}s
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio Selector */}
      <div className="px-4">
        <h2 className="text-neutral-dark dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4">
          {t('video_aspect_ratio_label')}
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {aspectRatioOptions.map((ratio) => (
            <button
              key={ratio.value}
              onClick={() => onVideoAspectRatioChange(ratio.value)}
              className={`py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${
                videoAspectRatio === ratio.value
                  ? 'bg-primary text-background-dark'
                  : 'bg-neutral-light dark:bg-neutral-dark/40 hover:bg-neutral-medium/20 dark:hover:bg-neutral-dark'
              }`}
            >
              {t(ratio.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="mt-6 px-4">
        <button
          onClick={onGenerate}
          className="w-full flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-12 px-4 bg-primary text-background-dark text-base font-bold leading-normal tracking-[0.015em] disabled:bg-neutral-medium/50 disabled:cursor-not-allowed"
          disabled={isGenerateDisabled}
        >
          <VideoIcon className="h-5 w-5" />
          <span className="truncate">
            {isLoading ? t('generate_video_button_loading') : t('generate_video_button')}
          </span>
        </button>
      </div>
    </div>
  );
};

export default VideoGeneratorControls;
