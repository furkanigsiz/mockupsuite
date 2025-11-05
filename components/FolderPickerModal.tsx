import React, { useState, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';

interface Folder {
  id: string;
  name: string;
}

interface FolderPickerModalProps {
  isOpen: boolean;
  folders: Folder[];
  isLoading: boolean;
  onClose: () => void;
  onSelectFolder: (folderId: string | null, folderName: string) => void;
}

const FolderPickerModal: React.FC<FolderPickerModalProps> = ({
  isOpen,
  folders,
  isLoading,
  onClose,
  onSelectFolder,
}) => {
  const { t } = useTranslations();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = () => {
    const folderName = selectedFolderId 
      ? folders.find(f => f.id === selectedFolderId)?.name || 'Root'
      : 'Root';
    onSelectFolder(selectedFolderId, folderName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {(t as any)('integration_select_folder_title') || 'Select Google Drive Folder'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Root folder option */}
              <button
                onClick={() => setSelectedFolderId(null)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  selectedFolderId === null
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="text-gray-900 dark:text-white font-medium">
                  {(t as any)('integration_root_folder') || 'Root Folder (My Drive)'}
                </span>
              </button>

              {/* Folder list */}
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    selectedFolderId === folder.id
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className="text-gray-900 dark:text-white">{folder.name}</span>
                </button>
              ))}

              {folders.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  {(t as any)('integration_no_folders') || 'No folders found. Files will be uploaded to root.'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {(t as any)('payment_checkout_cancel_button') || 'Cancel'}
          </button>
          <button
            onClick={handleSelect}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg font-medium bg-primary text-gray-900 dark:text-[#111718] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(t as any)('integration_select_folder_confirm') || 'Select Folder'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderPickerModal;
