import React, { useState, useEffect } from 'react';
import * as paymentService from '../services/paymentService';
import { SubscriptionPlan, CreditPackage } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { retryPaymentOperation } from '../utils/retryMechanism';
import { useTranslations } from '../hooks/useTranslations';

interface PaymentCheckoutProps {
  userId: string;
  plan?: SubscriptionPlan;
  creditPackage?: CreditPackage;
  proratedPrice?: number; // Optional prorated price for upgrades
  onSuccess: (transactionId: string) => void;
  onCancel: () => void;
  onError: (error: string) => void;
}

export const PaymentCheckout: React.FC<PaymentCheckoutProps> = ({
  userId,
  plan,
  creditPackage,
  proratedPrice,
  onSuccess,
  onCancel,
  onError,
}) => {
  
  const [loading, setLoading] = useState(true);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const { handlePaymentError } = useErrorHandler();
  const { t } = useTranslations();

  // Initialize payment with retry logic
  const initializePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      setRetrying(retryCount > 0);

      const response = await retryPaymentOperation(
        async () => {
          if (plan) {
            return await paymentService.createSubscriptionPayment(userId, plan, proratedPrice);
          } else if (creditPackage) {
            return await paymentService.createCreditPayment(userId, creditPackage);
          } else {
            throw new Error('No plan or credit package provided');
          }
        },
        (attempt) => {
          console.log(`Payment initialization retry attempt ${attempt}`);
        }
      );

      if (response.success && response.checkoutFormUrl && response.token) {
        setCheckoutUrl(response.checkoutFormUrl);
        setToken(response.token);
        setLoading(false);
        setRetryCount(0);
      } else {
        throw new Error(response.errorMessage || t('error_payment_processing'));
      }
    } catch (err: any) {
      console.error('Payment initialization error:', err);
      const supabaseError = handlePaymentError(err, () => handleRetry());
      const errorMessage = supabaseError.message || t('error_payment_processing');
      setError(errorMessage);
      setLoading(false);
      onError(errorMessage);
    }
  };

  // Handle payment callback from popup/iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Security: Verify origin (in production, check against İyzico domain)
      if (!event.data || typeof event.data !== 'object') return;

      const { type, status, token: callbackToken } = event.data;

      console.log('Received postMessage:', event.data);

      // Handle İyzico callback from payment-callback.html
      if (type === 'IYZICO_PAYMENT_CALLBACK' && callbackToken) {
        console.log('İyzico payment callback received, token:', callbackToken);
        
        // Show loading state
        setLoading(true);
        setError(null);
        
        // Verify payment on backend
        try {
          // Get conversation ID from transaction
          const transaction = await paymentService.getPaymentTransactionByToken(callbackToken);
          const conversationId = transaction?.iyzicoConversationId || `${userId}-${Date.now()}`;
          
          const verification = await retryPaymentOperation(
            () => paymentService.verifyPayment(userId, callbackToken, conversationId)
          );
          
          console.log('Payment verification result:', verification);
          
          if (verification.success) {
            // Clean up localStorage (but keep plan info for completePaidRegistration)
            localStorage.removeItem('completed_payment_token');
            localStorage.removeItem('pending_payment_token');
            localStorage.removeItem('pending_payment_time');
            // DON'T remove pending_payment_plan here - it will be removed in completePaidRegistration
            
            onSuccess(verification.paymentId || callbackToken);
          } else {
            const errorMsg = verification.errorMessage || t('error_payment_failed');
            setError(errorMsg);
            onError(errorMsg);
            setLoading(false);
          }
        } catch (err: any) {
          console.error('Payment verification error:', err);
          const supabaseError = handlePaymentError(err);
          const errorMsg = supabaseError.message || t('error_payment_failed');
          setError(errorMsg);
          onError(errorMsg);
          setLoading(false);
        }
      }
      // Legacy callback handler (kept for backwards compatibility)
      else if (type === 'PAYMENT_CALLBACK' && callbackToken === token) {
        if (status === 'success') {
          // Verify payment on backend
          try {
            const conversationId = `${userId}-${Date.now()}`;
            const verification = await retryPaymentOperation(
              () => paymentService.verifyPayment(userId, callbackToken, conversationId)
            );
            if (verification.success) {
              onSuccess(verification.paymentId || '');
            } else {
              const errorMsg = verification.errorMessage || t('error_payment_failed');
              setError(errorMsg);
              onError(errorMsg);
            }
          } catch (err: any) {
            const supabaseError = handlePaymentError(err);
            const errorMsg = supabaseError.message || t('error_payment_failed');
            setError(errorMsg);
            onError(errorMsg);
          }
        } else {
          const errorMsg = t('error_payment_cancelled');
          setError(errorMsg);
          onError(errorMsg);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [token, userId, onSuccess, onError]);

  // Initialize on mount
  useEffect(() => {
    initializePayment();
  }, []);

  // Handle retry with limit
  const handleRetry = () => {
    if (retryCount >= 2) {
      // Max retries reached
      setError(t('error_retry_failed'));
      return;
    }
    setRetryCount(retryCount + 1);
    setRetrying(true);
    initializePayment();
  };

  // Render loading state
  if (loading && !error) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {retrying ? t('payment_checkout_retrying') : t('payment_checkout_preparing')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              {t('payment_checkout_redirecting')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center space-y-6">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
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

            {/* Error Message */}
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('payment_checkout_failed_title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {error}
              </p>
              {retryCount >= 2 && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {t('error_retry_failed')}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full">
              {retryCount < 2 && (
                <button
                  onClick={handleRetry}
                  className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={retrying}
                >
                  {retrying ? t('payment_checkout_retrying') : t('payment_checkout_retry_button')}
                </button>
              )}
              <button
                onClick={onCancel}
                className={`${retryCount >= 2 ? 'w-full' : 'flex-1'} px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors`}
              >
                {retryCount >= 2 ? t('payment_checkout_close_button') : t('payment_checkout_cancel_button')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Open payment in new window and listen for completion
  const handleOpenPayment = () => {
    if (checkoutUrl && token) {
      // Store payment token and plan info in localStorage for callback handling
      localStorage.setItem('pending_payment_token', token);
      localStorage.setItem('pending_payment_time', Date.now().toString());
      
      // Store plan info for callback
      if (plan) {
        console.log('Storing plan in localStorage:', plan.id);
        localStorage.setItem('pending_payment_plan', plan.id);
        console.log('Verified localStorage:', localStorage.getItem('pending_payment_plan'));
      } else if (creditPackage) {
        console.log('Storing credit package in localStorage:', creditPackage.id);
        localStorage.setItem('pending_payment_credit_package', creditPackage.id);
      }
      
      // Open in new window
      const width = 900;
      const height = 900;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      const paymentWindow = window.open(
        checkoutUrl,
        'iyzico-payment',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes,location=yes`
      );
      
      if (!paymentWindow) {
        alert('Pop-up engellendi! Lütfen tarayıcınızın pop-up engelleyicisini devre dışı bırakın.');
        return;
      }
      
      // Poll for window close or payment completion
      const checkInterval = setInterval(() => {
        if (paymentWindow?.closed) {
          clearInterval(checkInterval);
          
          // Wait a bit for localStorage to be updated
          setTimeout(() => {
            // Check if payment was completed
            const completedToken = localStorage.getItem('completed_payment_token');
            if (completedToken === token) {
              // Payment completed successfully
              localStorage.removeItem('completed_payment_token');
              localStorage.removeItem('pending_payment_token');
              localStorage.removeItem('pending_payment_time');
              // DON'T remove pending_payment_plan here - it will be removed in completePaidRegistration
              onSuccess(completedToken);
            } else {
              // Window closed without completion
              localStorage.removeItem('pending_payment_token');
              localStorage.removeItem('pending_payment_time');
              localStorage.removeItem('pending_payment_plan');
              localStorage.removeItem('pending_payment_credit_package');
              onCancel();
            }
          }, 500);
        }
      }, 500);
    }
  };

  // Render payment modal
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('payment_checkout_title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {plan ? `${plan.displayName} ${t('payment_checkout_plan_label')}` : `${creditPackage?.name} ${t('payment_checkout_package_label')}`} - ₺
            {proratedPrice !== undefined && proratedPrice > 0 ? proratedPrice.toFixed(2) : (plan?.price || creditPackage?.price)}
          </p>
          {proratedPrice !== undefined && proratedPrice > 0 && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Kalan dönem için orantılı ücret (Normal fiyat: ₺{plan?.price})
            </p>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Ödeme penceresi açılacak</p>
              <p>Güvenli ödeme sayfası yeni bir pencerede açılacak. Ödemenizi tamamladıktan sonra bu sayfaya geri döneceksiniz.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleOpenPayment}
            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Ödeme Sayfasını Aç
          </button>
          
          <button
            onClick={onCancel}
            className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
          >
            İptal
          </button>
        </div>

        {/* Security Badge */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg
              className="w-4 h-4 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>{t('payment_checkout_secure_payment')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
