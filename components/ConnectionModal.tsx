import React, { useState, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { Integration } from '../types';
import { integrationService } from '../services/integrationService';
import { useAuth } from './AuthProvider';
import { useToast } from './Toast';

interface ConnectionModalProps {
  integration: Integration | null;
  isOpen: boolean;
  mode: 'connect' | 'disconnect' | null;
  onClose: () => void;
  onSuccess: (successMessage?: string) => void;
}

const ConnectionModal: React.FC<ConnectionModalProps> = ({
  integration,
  isOpen,
  mode,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslations();
  const { user } = useAuth();
  const toast = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthWindow, setOauthWindow] = useState<Window | null>(null);

  // Clean up OAuth window on unmount
  useEffect(() => {
    return () => {
      if (oauthWindow && !oauthWindow.closed) {
        oauthWindow.close();
      }
    };
  }, [oauthWindow]);

  // Listen for OAuth callback completion
  useEffect(() => {
    if (!isOpen || mode !== 'connect') return;

    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'oauth_success') {
        setIsProcessing(false);
        if (oauthWindow && !oauthWindow.closed) {
          oauthWindow.close();
        }
        const successMessage = (t as any)('integration_connected_success')?.replace('{platform}', integration?.name) 
          || `Successfully connected to ${integration?.name}`;
        onSuccess(successMessage);
        onClose();
      } else if (event.data.type === 'oauth_error') {
        setIsProcessing(false);
        const errorMessage = event.data.message || 'Authorization failed';
        setError(errorMessage);
        toast.error(errorMessage);
        if (oauthWindow && !oauthWindow.closed) {
          oauthWindow.close();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isOpen, mode, oauthWindow, onSuccess, onClose]);

  const handleConnect = async () => {
    if (!user || !integration) return;

    try {
      setIsProcessing(true);
      setError(null);

      // Initiate OAuth flow
      const { authUrl } = await integrationService.connectIntegration(
        user.id,
        integration.id
      );

      // Open OAuth URL in popup window
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        'oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        throw new Error('Failed to open popup window. Please allow popups for this site.');
      }

      setOauthWindow(popup);

      // Poll to check if popup was closed manually
      const pollTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollTimer);
          setIsProcessing(false);
          setError('Authorization was cancelled');
        }
      }, 500);
    } catch (err: any) {
      console.error('Failed to initiate connection:', err);
      const errorMessage = err.userMessage || err.message || 'Failed to connect';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user || !integration) return;

    try {
      setIsProcessing(true);
      setError(null);

      await integrationService.disconnectIntegration(user.id, integration.id);

      setIsProcessing(false);
      const successMessage = (t as any)('integration_disconnected_success')?.replace('{platform}', integration.name) 
        || `Successfully disconnected from ${integration.name}`;
      onSuccess(successMessage);
      onClose();
    } catch (err: any) {
      console.error('Failed to disconnect:', err);
      const errorMessage = err.userMessage || err.message || 'Failed to disconnect';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (mode === 'connect') {
      handleConnect();
    } else if (mode === 'disconnect') {
      handleDisconnect();
    }
  };

  if (!isOpen || !integration || !mode) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Platform Logo and Name */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={integration.logoUrl}
            alt={`${integration.name} logo`}
            className="w-16 h-16 rounded-lg object-contain"
          />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === 'connect' 
                ? (t as any)('connection_modal_title')?.replace('{platform}', integration.name) || `Connect to ${integration.name}`
                : (t as any)('connection_modal_disconnect_title')?.replace('{platform}', integration.name) || `Disconnect from ${integration.name}?`
              }
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          {mode === 'connect' ? (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {(t as any)('connection_modal_instructions')?.replace('{platform}', integration.name) || 
                  `Click the button below to authorize MockupSuite to access your ${integration.name} account.`}
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="text-xs">
                      {(t as any)('connection_modal_instructions')?.replace('{platform}', integration.name) || 
                        `Click the button below to authorize MockupSuite to access your ${integration.name} account.`}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {(t as any)('connection_modal_disconnect_message')?.replace('{platform}', integration.name) || 
                  `Are you sure you want to disconnect from ${integration.name}? You will lose access to synced data.`}
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="text-xs">
                      {(t as any)('connection_modal_disconnect_message')?.replace('{platform}', integration.name) || 
                        `Are you sure you want to disconnect from ${integration.name}? You will lose access to synced data.`}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && mode === 'connect' && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {(t as any)('connection_modal_connecting')?.replace('{platform}', integration.name) || `Connecting to ${integration.name}...`}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(t as any)('connection_modal_cancel_button') || 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              mode === 'connect'
                ? 'bg-primary text-gray-900 dark:text-[#111718] hover:opacity-90'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                {(t as any)('connection_modal_connecting')?.replace('{platform}', integration.name) || 'Processing...'}
              </span>
            ) : mode === 'connect' ? (
              (t as any)('connection_modal_authorize_button') || 'Authorize'
            ) : (
              (t as any)('connection_modal_disconnect_confirm') || 'Yes, Disconnect'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionModal;
