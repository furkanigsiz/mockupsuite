import React, { useEffect, useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import Spinner from './Spinner';

interface OAuthCallbackHandlerProps {
  onComplete: (success: boolean, message: string) => void;
}

/**
 * Component to handle OAuth callback redirects from external platforms
 * Extracts authorization code and state from URL, processes the callback,
 * and redirects back to integrations page with status message
 */
const OAuthCallbackHandler: React.FC<OAuthCallbackHandlerProps> = ({ onComplete }) => {
  const { t } = useTranslations();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Extract query parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const success = urlParams.get('success');
        const error = urlParams.get('error');
        const platform = urlParams.get('platform') || 'platform';

        console.log('[OAuthCallback] Processing callback:', { success, error, platform, hasOpener: !!window.opener });

        // Format platform name for display
        const platformName = platform
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        // Check if OAuth provider returned an error
        if (error) {
          const errorMsg = error || t('integration_oauth_error');
          setStatus('error');
          setMessage(errorMsg);
          
          console.log('[OAuthCallback] Error detected:', errorMsg);
          
          // Close popup if opened in popup window
          if (window.opener) {
            console.log('[OAuthCallback] Notifying parent of error and closing popup');
            // Notify parent window of error
            if (window.opener.postMessage) {
              window.opener.postMessage(
                { type: 'oauth_error', error: errorMsg },
                window.location.origin
              );
            }
            // Close after delay to show error message
            setTimeout(() => {
              window.close();
            }, 2000);
          } else {
            console.log('[OAuthCallback] No opener, redirecting to integrations');
            // Redirect to integrations page after delay
            setTimeout(() => {
              onComplete(false, errorMsg);
            }, 2000);
          }
          return;
        }

        // Check for success parameter
        if (success === 'true') {
          setStatus('success');
          const successMsg = t('integration_connected_success')?.replace('{platform}', platformName) 
            || `Successfully connected to ${platformName}`;
          setMessage(successMsg);

          console.log('[OAuthCallback] Success detected:', successMsg);

          // Close popup if opened in popup window
          if (window.opener) {
            console.log('[OAuthCallback] Notifying parent of success and closing popup');
            // Notify parent window of success
            if (window.opener.postMessage) {
              window.opener.postMessage(
                { type: 'oauth_success', platform },
                window.location.origin
              );
            }
            // Close immediately without delay
            setTimeout(() => {
              console.log('[OAuthCallback] Closing popup now');
              window.close();
            }, 500);
          } else {
            console.log('[OAuthCallback] No opener, redirecting to integrations');
            // Redirect to integrations page after delay
            setTimeout(() => {
              onComplete(true, successMsg);
            }, 2000);
          }
        } else {
          console.log('[OAuthCallback] Invalid callback - missing parameters');
          // Invalid callback - missing required parameters
          const errorMsg = t('integration_oauth_invalid_callback') || 'Invalid OAuth callback parameters';
          setStatus('error');
          setMessage(errorMsg);
          
          // Close popup if opened in popup window
          if (window.opener) {
            console.log('[OAuthCallback] Notifying parent of error and closing popup');
            // Notify parent window of error
            if (window.opener.postMessage) {
              window.opener.postMessage(
                { type: 'oauth_error', error: errorMsg },
                window.location.origin
              );
            }
            // Close after delay to show error message
            setTimeout(() => {
              window.close();
            }, 2000);
          } else {
            console.log('[OAuthCallback] No opener, redirecting to integrations');
            // Redirect to integrations page after delay
            setTimeout(() => {
              onComplete(false, errorMsg);
            }, 2000);
          }
          return;
        }
      } catch (error) {
        console.error('[OAuthCallback] Exception:', error);
        const errorMsg = error instanceof Error 
          ? error.message 
          : t('integration_oauth_error') || 'Failed to complete authorization';
        
        setStatus('error');
        setMessage(errorMsg);

        // Close popup if opened in popup window
        if (window.opener) {
          console.log('[OAuthCallback] Notifying parent of exception and closing popup');
          // Notify parent window of error
          if (window.opener.postMessage) {
            window.opener.postMessage(
              { type: 'oauth_error', error: errorMsg },
              window.location.origin
            );
          }
          // Close after delay to show error message
          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          console.log('[OAuthCallback] No opener, redirecting to integrations');
          // Redirect to integrations page after delay
          setTimeout(() => {
            onComplete(false, errorMsg);
          }, 2000);
        }
      }
    };

    processCallback();
  }, [t, onComplete]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <Spinner progressText={message || t('integration_oauth_processing')} />
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                <svg
                  className="h-8 w-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t('integration_oauth_success_title') || 'Connection Successful!'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {message}
              </p>
              {window.opener && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                  {t('integration_oauth_closing') || 'This window will close automatically...'}
                </p>
              )}
              {!window.opener && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                  {t('integration_oauth_redirecting') || 'Redirecting...'}
                </p>
              )}
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                <svg
                  className="h-8 w-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t('integration_oauth_error_title') || 'Authorization Failed'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {message}
              </p>
              {!window.opener && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                  {t('integration_oauth_redirecting') || 'Redirecting...'}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthCallbackHandler;
