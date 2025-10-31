import React, { useRef } from 'react';
import type { UploadedImage } from '../types';
import { processFile } from '../utils/fileUtils';
import UploadIcon from './icons/UploadIcon';
import { useTranslations } from '../hooks/useTranslations';
import XIcon from './icons/XIcon';

interface ImageUploaderProps {
  onImagesChange: (images: UploadedImage[]) => void;
  uploadedImages: UploadedImage[];
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesChange, uploadedImages }) => {
  const { t } = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      try {
        const processedFiles = await Promise.all(Array.from(files).map(processFile));
        onImagesChange([...uploadedImages, ...processedFiles]);
      } catch (error) {
        console.error('Error processing files:', error);
      }
    }
     if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                  <p className="text-white text-xs text-center px-1 truncate">{image.name}</p>
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
          <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-neutral-medium/40 px-6 py-8 bg-background-light dark:bg-white/5">
            <button 
              onClick={handleContainerClick}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary/20 dark:bg-primary/20 text-primary text-sm font-bold leading-normal tracking-[0.015em]">
              <span className="truncate">{t('uploader_add_more')}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col p-4">
          <div className="flex flex-col items-center gap-6 rounded-xl border-2 border-dashed border-neutral-medium/40 px-6 py-14 bg-background-light dark:bg-white/5">
            <div className="flex max-w-[480px] flex-col items-center gap-2">
              <p className="text-neutral-dark dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] max-w-[480px] text-center">{t('uploader_cta_multi')} {t('uploader_cta_alt')}</p>
              <p className="text-neutral-medium text-sm font-normal leading-normal max-w-[480px] text-center">{t('uploader_file_types')}</p>
            </div>
            <button 
              onClick={handleContainerClick}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary/20 dark:bg-primary/20 text-primary text-sm font-bold leading-normal tracking-[0.015em]">
              <span className="truncate">{t('uploader_cta_multi')}</span>
            </button>
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
