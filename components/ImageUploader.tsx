import React, { useRef, useState } from 'react';
import type { UploadedImage } from '../types';
import { processFile } from '../utils/fileUtils';
import UploadIcon from './icons/UploadIcon';
import { useTranslations } from '../hooks/useTranslations';
import XIcon from './icons/XIcon';
import BackgroundRemoveIcon from './icons/BackgroundRemoveIcon';
import { removeBackground } from '../utils/imageProcessing';

interface ImageUploaderProps {
  onImagesChange: (images: UploadedImage[]) => void;
  uploadedImages: UploadedImage[];
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesChange, uploadedImages }) => {
  const { t } = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processingBgRemoval, setProcessingBgRemoval] = useState<number | null>(null);

  const handleFiles = async (files: FileList | File[]) => {
    try {
      const processedFiles = await Promise.all(Array.from(files).map(processFile));
      onImagesChange([...uploadedImages, ...processedFiles]);
    } catch (error) {
      console.error('Error processing files:', error);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      await handleFiles(files);
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

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/')
      );
      if (imageFiles.length > 0) {
        await handleFiles(imageFiles);
      }
    }
  };

  const handleRemoveBackground = async (index: number) => {
    setProcessingBgRemoval(index);
    try {
      const image = uploadedImages[index];
      const processedBase64 = await removeBackground(image.base64);
      
      const updatedImages = [...uploadedImages];
      updatedImages[index] = {
        ...image,
        base64: processedBase64,
        previewUrl: `data:image/png;base64,${processedBase64}`
      };
      onImagesChange(updatedImages);
    } catch (error) {
      console.error('Error removing background:', error);
      alert('Failed to remove background. Please try again.');
    } finally {
      setProcessingBgRemoval(null);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    onImagesChange(uploadedImages.filter((_, index) => index !== indexToRemove));
  };

  const handleContainerClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-neutral-dark dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4">{t('uploader_title')}</h2>
      
      {uploadedImages.length > 0 ? (
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {uploadedImages.map((image, index) => (
              <div key={`${image.name}-${index}`} className="relative group bg-neutral-light dark:bg-white/5 rounded-lg p-2">
                <img src={image.previewUrl} alt={image.name} className="w-full h-32 object-contain rounded" />
                <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg gap-2">
                  <p className="text-white text-xs text-center px-1 truncate">{image.name}</p>
                  <button
                    onClick={() => handleRemoveBackground(index)}
                    disabled={processingBgRemoval === index}
                    className="flex items-center gap-1 bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-500 transition-all disabled:opacity-50"
                    title="Remove background"
                  >
                    <BackgroundRemoveIcon className="h-3 w-3" />
                    {processingBgRemoval === index ? 'Processing...' : 'Remove BG'}
                  </button>
                </div>
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-500 transition-all z-10"
                  aria-label={`Remove ${image.name}`}
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
          <div 
            className={`flex flex-col items-center gap-4 rounded-xl border-2 border-dashed px-6 py-8 transition-colors ${
              isDragging 
                ? 'border-primary bg-primary/10' 
                : 'border-neutral-medium/40 bg-background-light dark:bg-white/5'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <button 
              onClick={handleContainerClick}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary/20 dark:bg-primary/20 text-primary text-sm font-bold leading-normal tracking-[0.015em]">
              <span className="truncate">{t('uploader_add_more')}</span>
            </button>
            <p className="text-xs text-neutral-medium">or drag & drop images here</p>
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
                {isDragging ? 'Drop images here' : `${t('uploader_cta_multi')} ${t('uploader_cta_alt')}`}
              </p>
              <p className="text-neutral-medium text-sm font-normal leading-normal max-w-[480px] text-center">{t('uploader_file_types')}</p>
            </div>
            <button 
              onClick={handleContainerClick}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary/20 dark:bg-primary/20 text-primary text-sm font-bold leading-normal tracking-[0.015em]">
              <span className="truncate">{t('uploader_cta_multi')}</span>
            </button>
            <p className="text-xs text-neutral-medium">or drag & drop images here</p>
          </div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ImageUploader;
