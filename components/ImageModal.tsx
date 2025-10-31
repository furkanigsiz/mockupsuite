import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

interface ImageModalProps {
  imageSrc: string | null;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageSrc, onClose }) => {
  const { t } = useTranslations();
  if (!imageSrc) {
    return null;
  }

  // Check if imageSrc is already a complete URL or data URI
  const isCompleteUrl = imageSrc.startsWith('http') || imageSrc.startsWith('data:') || imageSrc.startsWith('blob:');
  const imageUrl = isCompleteUrl ? imageSrc : `data:image/png;base64,${imageSrc}`;

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