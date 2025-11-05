import React from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { Integration } from '../types';

interface IntegrationCardProps {
  integration: Integration;
  onConnect: (integrationId: string) => void;
  onDisconnect: (integrationId: string) => void;
  onSync?: (integrationId: string, operation: string) => void;
  isSyncing?: boolean;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onConnect,
  onDisconnect,
  onSync,
  isSyncing = false,
}) => {
  const { t } = useTranslations();

  const isComingSoon = integration.status === 'coming_soon';
  const isConnected = integration.isConnected;

  // Determine platform-specific actions
  const getPlatformActions = () => {
    if (!isConnected || isComingSoon) return null;

    switch (integration.name.toLowerCase()) {
      case 'shopify':
        return (
          <button
            onClick={() => onSync?.(integration.id, 'sync_products')}
            disabled={isSyncing}
            className="w-full px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSyncing && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {(t as any)('integration_sync_products_button') || 'Ürünleri Senkronize Et'}
          </button>
        );
      case 'figma':
        return (
          <button
            onClick={() => onSync?.(integration.id, 'browse_files')}
            disabled={isSyncing}
            className="w-full px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSyncing && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {(t as any)('integration_browse_button') || 'Browse Files'}
          </button>
        );
      case 'google drive':
        return (
          <button
            onClick={() => onSync?.(integration.id, 'select_folder')}
            disabled={isSyncing}
            className="w-full px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSyncing && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            {(t as any)('integration_select_folder_button') || 'Select Folder'}
          </button>
        );
      case 'dropbox':
        // Note: Upload functionality is available in the gallery/mockup views
        // This card just shows the connection status
        return null;
      default:
        return null;
    }
  };

  const platformActions = getPlatformActions();

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 ${
        isComingSoon 
          ? 'opacity-75' 
          : 'hover:shadow-lg hover:border-primary/50 dark:hover:border-primary/50'
      }`}
    >
      {/* Header with Logo and Status */}
      <div className="flex items-start gap-4 mb-4">
        <img
          src={integration.logoUrl}
          alt={`${integration.name} logo`}
          className={`w-16 h-16 rounded-lg object-contain ${isComingSoon ? 'grayscale' : ''}`}
        />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {integration.name}
          </h3>
          {/* Status Badge */}
          {isConnected && !isComingSoon && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {(t as any)('integration_status_connected') || 'Connected'}
            </span>
          )}
          {isComingSoon && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              {(t as any)('integration_status_coming_soon') || 'Coming Soon'}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {integration.description}
      </p>

      {/* Action Buttons */}
      <div className="space-y-2">
        {/* Primary Connection Button */}
        {!isComingSoon && (
          <button
            onClick={() => isConnected ? onDisconnect(integration.id) : onConnect(integration.id)}
            className="w-full px-4 py-2 rounded-lg font-medium transition-colors bg-primary text-gray-900 dark:text-[#111718] hover:opacity-90"
          >
            {isConnected 
              ? (t as any)('integration_disconnect_button') || 'Disconnect'
              : (t as any)('integration_connect_button') || 'Connect'
            }
          </button>
        )}

        {isComingSoon && (
          <button
            disabled
            className="w-full px-4 py-2 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
          >
            {(t as any)('integration_status_coming_soon') || 'Coming Soon'}
          </button>
        )}

        {/* Platform-Specific Action Button */}
        {platformActions}
      </div>
    </div>
  );
};

export default IntegrationCard;
