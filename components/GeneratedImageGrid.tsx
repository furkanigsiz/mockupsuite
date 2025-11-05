import React, { useState } from 'react';
import DownloadIcon from './icons/DownloadIcon';
import Spinner from './Spinner';
import { useTranslations } from '../hooks/useTranslations';
import StarIcon from './icons/StarIcon';
import { BatchResult } from '../types';
import SceneIcon from './icons/SceneIcon';
import { downloadImage } from '../utils/fileUtils';
import CopyIcon from './icons/CopyIcon';
import { copyImageToClipboard } from '../utils/imageProcessing';

interface GeneratedImageGridProps {
  results: BatchResult[];
  isLoading: boolean;
  error: string | null;
  onImageClick: (base64Image: string) => void;
  savedImages: string[];
  onSaveImage: (base64Image: string) => void;
  progressText?: string;
  onUseInScene?: (base64Image: string) => void;
  showUseInSceneButton?: boolean;
}

const GeneratedImageGrid: React.FC<GeneratedImageGridProps> = ({ results, isLoading, error, onImageClick, savedImages, onSaveImage, progressText, onUseInScene, showUseInSceneButton }) => {
  const { t } = useTranslations();
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const handleCopyImage = async (img: string, resultIndex: number, index: number) => {
    try {
      await copyImageToClipboard(img);
      const key = `${resultIndex}-${index}`;
      setCopiedIndex(key);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy image:', error);
      alert('Failed to copy image to clipboard');
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <Spinner progressText={progressText} />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full min-h-[400px] bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
          <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-red-300">{t('error_title')}</h3>
              <p className="mt-2 text-sm text-red-400 max-w-md mx-auto">{error}</p>
          </div>
        </div>
      );
    }

    if (results.length > 0) {
      return (
        <div className="space-y-8">
          {results.map((result, resultIndex) => (
            <div key={resultIndex} className="bg-neutral-light dark:bg-neutral-dark/40 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                    <img src={result.source.previewUrl} alt={result.source.name} className="w-12 h-12 object-cover rounded-md border-2 border-neutral-medium/20" />
                    <span className="font-semibold text-neutral-dark dark:text-gray-300 truncate" title={result.source.name}>{result.source.name}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {result.generated.map((img, index) => {
                    const isSaved = savedImages.includes(img);
                    const copyKey = `${resultIndex}-${index}`;
                    const isCopied = copiedIndex === copyKey;
                    return (
                    <div 
                        key={copyKey} 
                        className="group relative aspect-square overflow-hidden rounded-lg shadow-lg bg-gray-800 cursor-pointer"
                        onClick={() => onImageClick(img)}
                    >
                        <img src={`data:image/png;base64,${img}`} alt={`Generated Mockup ${index + 1} for ${result.source.name}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center gap-2 flex-wrap p-2">
                        <button
                            onClick={(e) => {
                            e.stopPropagation();
                            handleCopyImage(img, resultIndex, index);
                            }}
                            className={`flex items-center gap-2 backdrop-blur-sm font-semibold py-2 px-4 rounded-full opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                              isCopied 
                                ? 'bg-green-600/80 text-white' 
                                : 'bg-gray-700/80 text-white hover:bg-gray-600/80'
                            }`}
                            title={isCopied ? 'Copied!' : 'Copy to clipboard'}
                        >
                            <CopyIcon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(img, `mockup_${result.source.name}_${index + 1}.png`);
                            }}
                            className="flex items-center gap-2 bg-black/50 text-white backdrop-blur-sm font-semibold py-2 px-4 rounded-full opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300 hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary"
                            title={t('download_button')}
                        >
                            <DownloadIcon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={(e) => {
                            e.stopPropagation();
                            onSaveImage(img);
                            }}
                            disabled={isSaved}
                            className="flex items-center gap-2 bg-primary/80 text-background-dark backdrop-blur-sm font-semibold py-2 px-4 rounded-full opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300 hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary disabled:bg-custom-accent/80 disabled:cursor-default"
                            title={isSaved ? t('saved_button') : t('save_button')}
                        >
                            <StarIcon className={`h-5 w-5 ${isSaved ? 'text-background-dark' : ''}`} fill={isSaved ? 'currentColor' : 'none'} />
                        </button>
                        {showUseInSceneButton && onUseInScene && (
                             <button
                                onClick={(e) => {
                                e.stopPropagation();
                                onUseInScene(img);
                                }}
                                className="flex items-center gap-2 bg-teal-600/80 text-white backdrop-blur-sm font-semibold py-2 px-4 rounded-full opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300 hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500"
                                title={t('use_in_scene_button')}
                            >
                                <SceneIcon className="h-5 w-5" />
                            </button>
                        )}
                        </div>
                    </div>
                    )})}
                </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed border-neutral-medium/40 rounded-lg bg-neutral-light dark:bg-white/5">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-neutral-medium/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="mt-4 text-lg text-neutral-medium">{t('grid_batch_placeholder_title')}</p>
        <p className="text-sm text-neutral-medium/80">{t('grid_batch_placeholder_description')}</p>
      </div>
    );
  };
  
  return (
    <div className="w-full bg-neutral-light dark:bg-neutral-dark/40 rounded-xl p-6 min-h-[400px] lg:min-h-[600px] flex flex-col">
       <h2 className="text-xl font-bold text-neutral-dark dark:text-gray-100 mb-4">{t('grid_title')}</h2>
       <div className="flex-grow flex flex-col">
         {renderContent()}
       </div>
    </div>
  )

};

export default GeneratedImageGrid;