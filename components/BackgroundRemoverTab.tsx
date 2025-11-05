import React, { useState, useRef } from 'react';
import { UploadedImage } from '../types';
import { processFile } from '../utils/fileUtils';
import { removeBackgroundWithAI } from '../services/geminiService';
import { useTranslations } from '../hooks/useTranslations';
import BackgroundRemoveIcon from './icons/BackgroundRemoveIcon';
import DownloadIcon from './icons/DownloadIcon';
import CopyIcon from './icons/CopyIcon';
import XIcon from './icons/XIcon';
import StarIcon from './icons/StarIcon';
import SceneIcon from './icons/SceneIcon';
import { downloadImage } from '../utils/fileUtils';
import { copyImageToClipboard } from '../utils/imageProcessing';
import { useAuth } from './AuthProvider';
import * as subscriptionService from '../services/subscriptionService';

interface BackgroundRemoverTabProps {
  onUpgradeClick?: () => void;
  onQuotaRefresh?: () => void;
  projectId?: string;
  onSaveToGallery?: (base64Image: string) => Promise<void>;
  onUseInScene?: (base64Image: string) => void;
}

const BackgroundRemoverTab: React.FC<BackgroundRemoverTabProps> = ({ 
  onUpgradeClick, 
  onQuotaRefresh,
  projectId,
  onSaveToGallery,
  onUseInScene
}) => {
  const { t } = useTranslations();
  const { user } = useAuth();
  const [sourceImage, setSourceImage] = useState<UploadedImage | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      const processed = await processFile(file);
      setSourceImage(processed);
      setProcessedImage(null); // Reset processed image when new source is uploaded
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Failed to process image. Please try again.');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await handleFile(file);
    }
  };

  const handleRemoveBackground = async () => {
    if (!sourceImage || !user) return;

    // Check if user can remove background (has quota)
    const canRemove = await subscriptionService.canRemoveBackground(user.id);
    if (!canRemove) {
      alert(t('error_quota_exceeded') || 'You have exhausted your quota. Please upgrade your plan or purchase credits.');
      if (onUpgradeClick) {
        onUpgradeClick();
      }
      return;
    }

    setIsProcessing(true);
    try {
      const result = await removeBackgroundWithAI(sourceImage.base64, sourceImage.type);
      setProcessedImage(result);

      // Decrement quota after successful background removal
      try {
        await subscriptionService.decrementBackgroundRemovalQuota(user.id, 1);
        // Trigger quota widget refresh
        if (onQuotaRefresh) {
          onQuotaRefresh();
        }
      } catch (quotaError) {
        console.error('Error decrementing quota:', quotaError);
        // Continue even if quota decrement fails - we already processed the image
      }
    } catch (error) {
      console.error('Error removing background:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove background. Please try again.';
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    downloadImage(processedImage, `background_removed_${Date.now()}.png`);
  };

  const handleCopy = async () => {
    if (!processedImage) return;
    
    try {
      await copyImageToClipboard(processedImage);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy image:', error);
      alert('Failed to copy image to clipboard');
    }
  };

  const handleSaveToGallery = async () => {
    if (!processedImage || !onSaveToGallery) return;

    setIsSaving(true);
    try {
      await onSaveToGallery(processedImage);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save to gallery:', error);
      alert('Failed to save to gallery. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSourceImage(null);
    setProcessedImage(null);
    setIsSaved(false);
  };

  return (
    <div className="w-full bg-neutral-light dark:bg-neutral-dark/40 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BackgroundRemoveIcon className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold text-neutral-dark dark:text-gray-100">
            Background Remover
          </h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-medium">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>1 credit per removal</span>
        </div>
      </div>

      {!sourceImage ? (
        // Upload area
        <div
          className={`flex flex-col items-center gap-6 rounded-xl border-2 border-dashed px-6 py-14 transition-colors ${
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-neutral-medium/40 bg-background-light dark:bg-white/5'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="bg-primary/10 text-primary rounded-full p-4">
            <BackgroundRemoveIcon className="h-10 w-10" />
          </div>
          <div className="flex max-w-[480px] flex-col items-center gap-2">
            <p className="text-neutral-dark dark:text-white text-lg font-bold leading-tight text-center">
              {isDragging ? 'Drop image here' : 'Upload an image to remove background'}
            </p>
            <p className="text-neutral-medium text-sm font-normal leading-normal text-center">
              Supports PNG, JPEG, WebP
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary/20 dark:bg-primary/20 text-primary text-sm font-bold leading-normal tracking-[0.015em]"
          >
            <span className="truncate">Choose Image</span>
          </button>
          <p className="text-xs text-neutral-medium">or drag & drop image here</p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        // Processing area
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original Image */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-neutral-dark dark:text-gray-300">
                Original
              </h3>
              <div className="relative bg-white dark:bg-gray-800 rounded-lg p-4 aspect-square">
                <img
                  src={sourceImage.previewUrl}
                  alt="Original"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Processed Image */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-neutral-dark dark:text-gray-300">
                Background Removed
              </h3>
              <div className="relative rounded-lg p-4 aspect-square" style={{
                backgroundImage: processedImage 
                  ? 'repeating-conic-gradient(#e5e7eb 0% 25%, #f9fafb 0% 50%) 50% / 20px 20px'
                  : 'none',
                backgroundColor: processedImage ? 'transparent' : '#1f2937'
              }}>
                {processedImage ? (
                  <img
                    src={`data:image/png;base64,${processedImage}`}
                    alt="Processed"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-medium bg-white dark:bg-gray-800 rounded-lg">
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
                        <p className="text-sm">Processing with AI...</p>
                      </div>
                    ) : (
                      <p className="text-sm text-center px-4">
                        Click "Remove Background" to process
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            {!processedImage ? (
              <>
                <button
                  onClick={handleRemoveBackground}
                  disabled={isProcessing}
                  className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BackgroundRemoveIcon className="h-5 w-5" />
                  {isProcessing ? 'Processing...' : 'Remove Background'}
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-neutral-dark dark:text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <XIcon className="h-5 w-5" />
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveToGallery}
                  disabled={isSaving || isSaved}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                    isSaved
                      ? 'bg-custom-accent text-white cursor-default'
                      : 'bg-primary text-white hover:bg-primary/90'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <StarIcon className="h-5 w-5" fill={isSaved ? 'currentColor' : 'none'} />
                  {isSaving ? 'Saving...' : isSaved ? 'Saved!' : 'Save to Gallery'}
                </button>
                {onUseInScene && (
                  <button
                    onClick={() => onUseInScene(processedImage!)}
                    className="flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-500 transition-colors"
                  >
                    <SceneIcon className="h-5 w-5" />
                    Use in Scene
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                    isCopied
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-neutral-dark dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <CopyIcon className="h-5 w-5" />
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-neutral-dark dark:text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <DownloadIcon className="h-5 w-5" />
                  Download
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-neutral-dark dark:text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <XIcon className="h-5 w-5" />
                  New Image
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BackgroundRemoverTab;
