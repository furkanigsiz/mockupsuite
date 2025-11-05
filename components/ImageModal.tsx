import React, { useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import DownloadIcon from './icons/DownloadIcon';
import CopyIcon from './icons/CopyIcon';
import { downloadImage } from '../utils/fileUtils';
import { copyImageToClipboard } from '../utils/imageProcessing';

interface ImageModalProps {
  imageSrc: string | null;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageSrc, onClose }) => {
  const { t } = useTranslations();
  const [isCopied, setIsCopied] = useState(false);

  if (!imageSrc) {
    return null;
  }

  // Check if imageSrc is already a complete URL or data URI
  const isCompleteUrl = imageSrc.startsWith('http') || imageSrc.startsWith('data:') || imageSrc.startsWith('blob:');
  const imageUrl = isCompleteUrl ? imageSrc : `data:image/png;base64,${imageSrc}`;

  const handleDownload = async () => {
    if (isCompleteUrl && !imageSrc.startsWith('data:')) {
      // For external URLs, fetch and convert to base64
      try {
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          downloadImage(base64, 'mockup.png');
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Failed to download image:', error);
      }
    } else {
      const base64 = imageSrc.startsWith('data:') ? imageSrc.split(',')[1] : imageSrc;
      downloadImage(base64, 'mockup.png');
    }
  };

  const handleCopy = async () => {
    try {
      if (isCompleteUrl && !imageSrc.startsWith('data:')) {
        // For external URLs, fetch and convert to base64
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          await copyImageToClipboard(base64);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        };
        reader.readAsDataURL(blob);
      } else {
        const base64 = imageSrc.startsWith('data:') ? imageSrc.split(',')[1] : imageSrc;
        await copyImageToClipboard(base64);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy image:', error);
      alert('Failed to copy image to clipboard');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 transition-opacity duration-300 animate-[fade-in_0.2s_ease-in-out]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-modal-title"
    >
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <div
        className="relative max-w-4xl max-h-[90vh] p-4"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image container
      >
        <h2 id="image-modal-title" className="sr-only">{t('image_modal_title')}</h2>
        <img
          src={imageUrl}
          alt="Generated Mockup"
          className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        />
        
        {/* Action buttons */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 backdrop-blur-sm font-semibold py-2 px-4 rounded-full transition-all duration-200 ${
              isCopied 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-700/80 text-white hover:bg-gray-600/80'
            }`}
            title={isCopied ? 'Copied!' : 'Copy to clipboard'}
          >
            <CopyIcon className="h-5 w-5" />
            <span className="text-sm">{isCopied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-black/50 text-white backdrop-blur-sm font-semibold py-2 px-4 rounded-full hover:bg-black/70 transition-all duration-200"
            title="Download"
          >
            <DownloadIcon className="h-5 w-5" />
            <span className="text-sm">Download</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-0 -right-1 sm:top-6 sm:right-6 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-all duration-200"
          aria-label={t('image_modal_close_button')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ImageModal;