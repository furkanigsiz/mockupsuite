import React, { useState, useEffect } from 'react';
import DownloadIcon from './icons/DownloadIcon';
import TrashIcon from './icons/TrashIcon';
import { useTranslations } from '../hooks/useTranslations';
import { downloadImage } from '../utils/fileUtils';
import * as storageService from '../services/storageService';
import CopyIcon from './icons/CopyIcon';
import { copyImageToClipboard } from '../utils/imageProcessing';

interface SavedImageGridProps {
  images: string[]; // Storage paths
  onRemoveImage: (imagePath: string) => void;
  onImageClick: (imageUrl: string) => void;
}

const SavedImageGrid: React.FC<SavedImageGridProps> = ({ images, onRemoveImage, onImageClick }) => {
  const { t } = useTranslations();
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyImage = async (url: string, index: number) => {
    try {
      // Fetch and convert to base64
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        await copyImageToClipboard(base64);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Failed to copy image:', error);
      alert('Failed to copy image to clipboard');
    }
  };

  // Convert storage paths to signed URLs
  useEffect(() => {
    const loadImageUrls = async () => {
      setIsLoading(true);
      const urlMap = new Map<string, string>();
      
      for (const path of images) {
        try {
          const url = await storageService.getImageUrl(path);
          urlMap.set(path, url);
        } catch (e) {
          console.error('Failed to load image URL:', e);
        }
      }
      
      setImageUrls(urlMap);
      setIsLoading(false);
    };

    if (images.length > 0) {
      loadImageUrls();
    } else {
      setIsLoading(false);
    }
  }, [images]);

  const handleDownloadAll = () => {
    images.forEach((path, index) => {
      const url = imageUrls.get(path);
      if (url) {
        // Add a small delay between downloads to prevent the browser from blocking them
        setTimeout(() => {
          // For signed URLs, we need to fetch and convert to base64
          fetch(url)
            .then(res => res.blob())
            .then(blob => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = reader.result as string;
                downloadImage(base64.split(',')[1], `saved_mockup_${index + 1}.png`);
              };
              reader.readAsDataURL(blob);
            })
            .catch(e => console.error('Failed to download image:', e));
        }, index * 200);
      }
    });
  };

  return (
    <div className="w-full bg-neutral-light dark:bg-neutral-dark/40 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-neutral-dark dark:text-gray-100">{t('saved_grid_title')}</h2>
        {images.length > 0 && (
          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-md bg-neutral-light dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <DownloadIcon className="h-4 w-4" />
            {t('download_all_button')}
          </button>
        )}
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-full min-h-[150px]">
          <p className="text-sm text-neutral-medium">{t('loading_project')}</p>
        </div>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((path, index) => {
            const url = imageUrls.get(path);
            if (!url) return null;
            
            return (
              <div
                key={path}
                className="group relative aspect-square overflow-hidden rounded-lg shadow-lg bg-gray-800 cursor-pointer"
                onClick={() => onImageClick(url)}
              >
                <img src={url} alt={`Saved Mockup ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center gap-2 flex-wrap p-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyImage(url, index);
                    }}
                    className={`flex items-center gap-2 backdrop-blur-sm font-semibold py-2 px-4 rounded-full opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                      copiedIndex === index 
                        ? 'bg-green-600/80 text-white' 
                        : 'bg-gray-700/80 text-white hover:bg-gray-600/80'
                    }`}
                    title={copiedIndex === index ? 'Copied!' : 'Copy to clipboard'}
                  >
                    <CopyIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Fetch and download
                      fetch(url)
                        .then(res => res.blob())
                        .then(blob => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64 = reader.result as string;
                            downloadImage(base64.split(',')[1], `saved_mockup_${index + 1}.png`);
                          };
                          reader.readAsDataURL(blob);
                        })
                        .catch(e => console.error('Failed to download image:', e));
                    }}
                    className="flex items-center gap-2 bg-black/50 text-white backdrop-blur-sm font-semibold py-2 px-4 rounded-full opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300 hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary"
                    title={t('download_button')}
                  >
                    <DownloadIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage(path);
                    }}
                    className="flex items-center gap-2 bg-red-600/80 text-white backdrop-blur-sm font-semibold py-2 px-4 rounded-full opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500"
                    title={t('remove_button')}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px] border-2 border-dashed border-neutral-medium/40 rounded-lg text-center p-4">
            <p className="text-sm text-neutral-medium">{t('saved_grid_placeholder')}</p>
        </div>
      )}
    </div>
  );
};

export default SavedImageGrid;