import { useCallback } from 'react';
import { useToast } from '../components/Toast';
import { SupabaseError, getUserFriendlyMessage, handleSupabaseError, isRetryable } from '../utils/errorHandling';
import { useTranslations } from './useTranslations';

interface ErrorHandlerOptions {
  showToast?: boolean;
  onRetry?: () => void | Promise<void>;
  customMessage?: string;
}

/**
 * Hook for handling errors with toast notifications and retry logic
 */
export function useErrorHandler() {
  const toast = useToast();
  const t = useTranslations();
  const language = localStorage.getItem('language') as 'en' | 'tr' || 'en';

  const handleError = useCallback(
    (error: any, options: ErrorHandlerOptions = {}) => {
      const { showToast = true, onRetry, customMessage } = options;

      // Convert to SupabaseError
      const supabaseError = handleSupabaseError(error);

      // Get user-friendly message
      const message = customMessage || getUserFriendlyMessage(supabaseError, language);

      // Log error for debugging
      console.error('Error handled:', supabaseError);

      // Show toast notification
      if (showToast) {
        toast.error(message, 7000);

        // Show retry option if error is retryable
        if (isRetryable(supabaseError.type) && onRetry) {
          const retryText = language === 'tr' ? 'Tekrar Dene' : 'Retry';
          setTimeout(() => {
            toast.info(`${retryText}?`, 5000);
          }, 500);
        }
      }

      return supabaseError;
    },
    [toast, language]
  );

  const handlePaymentError = useCallback(
    (error: any, onRetry?: () => void | Promise<void>) => {
      const supabaseError = handleError(error, { onRetry });

      // Additional payment-specific handling
      if (supabaseError.type.includes('PAYMENT')) {
        // Track payment error for analytics
        console.warn('Payment error occurred:', {
          type: supabaseError.type,
          message: supabaseError.message,
          timestamp: new Date().toISOString(),
        });
      }

      return supabaseError;
    },
    [handleError]
  );

  const handleQuotaError = useCallback(
    (error: any) => {
      const supabaseError = handleError(error);

      // Show upgrade prompt for quota errors
      if (
        supabaseError.type === 'QUOTA_ERROR' ||
        supabaseError.type === 'NO_CREDITS' ||
        supabaseError.type === 'SUBSCRIPTION_EXPIRED'
      ) {
        // Trigger upgrade modal (this would be handled by the component)
        const event = new CustomEvent('show-upgrade-modal', {
          detail: { reason: supabaseError.type },
        });
        window.dispatchEvent(event);
      }

      return supabaseError;
    },
    [handleError]
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      toast.success(message, duration);
    },
    [toast]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      toast.warning(message, duration);
    },
    [toast]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      toast.info(message, duration);
    },
    [toast]
  );

  return {
    handleError,
    handlePaymentError,
    handleQuotaError,
    showSuccess,
    showWarning,
    showInfo,
  };
}
