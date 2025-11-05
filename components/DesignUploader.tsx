import React, { useRef, useState } from 'react';
import type { UploadedImage } from '../types';
import { processFile } from '../utils/fileUtils';
import { useTranslations } from '../hooks/useTranslations';
import XIcon from './icons/XIcon';
import BackgroundRemoveIcon from './icons/BackgroundRemoveIcon';
import { removeBackground } from '../utils/imageProcessing';

interface DesignUploaderProps {
  onDesignChange: (image: UploadedImage | null) => void;
  design: UploadedImage | null;
}

const DesignUploader: React.FC<DesignUploaderProps> = ({ onDesignChange, design }) => {
  const { t } = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processingBgRemoval, setProcessingBgRemoval] = useState(false);

  const handleFile = async (file: File) => {
    try {
      const processedFile = await processFile(file);
      onDesignChange(processedFile);
    } catch (error) {
      console.error('Error processing file:', error);
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

  const handleRemoveImage = () => {
    onDesignChange(null);
  };

  const handleRemoveBackground = async () => {
    if (!design) return;
    
    setProcessingBgRemoval(true);
    try {
      const processedBase64 = await removeBackground(design.base64);
      onDesignChange({
        ...design,
        base64: processedBase64,
        previewUrl: `data:image/png;base64,${processedBase64}`
      });
    } catch (error) {
      console.error('Error removing background:', error);
      alert('Failed to remove background. Please try again.');
    } finally {
      setProcessingBgRemoval(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-neutral-dark dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4">{t('step_1_title')}</h2>
      
      {design ? (
        <div className="p-4">
          <div className="relative group bg-neutral-light dark:bg-white/5 rounded-lg p-4">
            <img src={design.previewUrl} alt={design.name} className="w-full h-40 object-contain" />
            <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg gap-2">
              <p className="text-white text-sm text-center px-2 truncate">{design.name}</p>
              <button
                onClick={handleRemoveBackground}
                disabled={processingBgRemoval}
                className="flex items-center gap-2 bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-500 transition-all disabled:opacity-50"
                title="Remove background"
              >
                <BackgroundRemoveIcon className="h-4 w-4" />
                {processingBgRemoval ? 'Processing...' : 'Remove Background'}
              </button>
            </div>
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-500 transition-all z-10"
              aria-label={`Remove ${design.name}`}
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col p-4">
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
            <div className="flex max-w-[480px] flex-col items-center gap-2">
              <p className="text-neutral-dark dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] max-w-[480px] text-center">
                {isDragging ? 'Drop design here' : t('design_uploader_cta_title')}
              </p>
              <p className="text-neutral-medium text-sm font-normal leading-normal max-w-[480px] text-center">{t('design_uploader_cta_subtitle')}</p>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary/20 dark:bg-primary/20 text-primary text-sm font-bold leading-normal tracking-[0.015em]">
              <span className="truncate">{t('design_uploader_cta_button')}</span>
            </button>
            <p className="text-xs text-neutral-medium">or drag & drop design here</p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/png, image/jpeg, image/svg+xml"
              onChange={handleFileChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignUploader;
