import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { useTranslations } from '../hooks/useTranslations';
import { getCurrentPlan, getRemainingQuota, getVideoQuotaInfo } from '../services/subscriptionService';
import { getCreditBalance } from '../services/creditService';
import { SUBSCRIPTION_PLANS } from '../types';
import type { UserSubscription, QuotaInfo } from '../types';

interface QuotaWidgetProps {
  onUpgradeClick?: () => void;
  refreshTrigger?: number; // Optional prop to trigger refresh from parent
}

const QuotaWidget: React.FC<QuotaWidgetProps> = ({ onUpgradeClick, refreshTrigger }) => {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [videoQuotaInfo, setVideoQuotaInfo] = useState<QuotaInfo | null>(null);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuotaData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Load subscription and quota info
      const [subData, quotaData, videoQuota, credits] = await Promise.all([
        getCurrentPlan(user.id),
        getRemainingQuota(user.id).catch(() => null),
        getVideoQuotaInfo(user.id).catch(() => null),
        getCreditBalance(user.id).catch(() => 0),
      ]);

      setSubscription(subData);
      setQuotaInfo(quotaData);
      setVideoQuotaInfo(videoQuota);
      setCreditBalance(credits);
    } catch (err) {
      console.error('Error loading quota data:', err);
      setError('Kota bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotaData();
  }, [user]);

  // Refresh when refreshTrigger changes (for real-time updates after generation)
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      loadQuotaData();
    }
  }, [refreshTrigger]);

  // Set up real-time updates using polling (every 30 seconds)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadQuotaData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  if (!user || loading) {
    return (
      <div className="bg-white dark:bg-[#1c2527] rounded-lg border border-gray-200 dark:border-[#3b4f54] p-4 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-[#3b4f54] rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-200 dark:bg-[#3b4f54] rounded w-3/4"></div>
      </div>
    );
  }

  if (error || !subscription || !quotaInfo) {
    return null;
  }

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscription.planId);
  if (!plan) return null;

  // Calculate quota percentage
  const quotaPercentage = quotaInfo.total > 0 
    ? (quotaInfo.remaining / quotaInfo.total) * 100 
    : 0;

  // Determine progress bar color based on percentage
  const getProgressColor = () => {
    if (quotaPercentage > 50) return 'bg-green-500';
    if (quotaPercentage >= 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Check if upgrade button should be shown
  const showUpgradeButton = quotaPercentage < 20 || subscription.status === 'expired';

  // Format reset date
  const formatResetDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Süresi dolmuş';
    } else if (diffDays === 0) {
      return 'Bugün';
    } else if (diffDays === 1) {
      return 'Yarın';
    } else if (diffDays <= 7) {
      return `${diffDays} gün içinde`;
    } else {
      return date.toLocaleDateString('tr-TR', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    }
  };

  return (
    <div className="bg-white dark:bg-[#1c2527] rounded-lg border border-gray-200 dark:border-[#3b4f54] p-4 shadow-sm">
      {/* Plan Name */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {plan.displayName}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {subscription.status === 'active' ? 'Aktif Plan' : 'Plan Durumu: ' + subscription.status}
          </p>
        </div>
        {subscription.planId !== 'free' && (
          <div className="text-right">
            <p className="text-lg font-bold text-primary">
              ₺{plan.price}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">/ay</p>
          </div>
        )}
      </div>

      {/* Image Quota Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Kalan Görsel Kotası
          </span>
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {quotaInfo.remaining} / {quotaInfo.total}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-[#3b4f54] rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.max(0, Math.min(100, quotaPercentage))}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {quotaInfo.used} mockup kullanıldı
        </p>
      </div>

      {/* Video Quota Progress Bar */}
      {videoQuotaInfo && (
        <div className="mb-3 pb-3 border-b border-gray-200 dark:border-[#3b4f54]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Kalan Video Kotası
            </span>
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              {videoQuotaInfo.remaining} / {videoQuotaInfo.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-[#3b4f54] rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${
                videoQuotaInfo.total > 0
                  ? (videoQuotaInfo.remaining / videoQuotaInfo.total) * 100 > 50
                    ? 'bg-green-500'
                    : (videoQuotaInfo.remaining / videoQuotaInfo.total) * 100 >= 20
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                  : 'bg-gray-300'
              }`}
              style={{
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    videoQuotaInfo.total > 0
                      ? (videoQuotaInfo.remaining / videoQuotaInfo.total) * 100
                      : 0
                  )
                )}%`,
              }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {videoQuotaInfo.used} video oluşturuldu
          </p>
        </div>
      )}

      {/* Reset/Renewal Date */}
      <div className="mb-3 pb-3 border-b border-gray-200 dark:border-[#3b4f54]">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {subscription.status === 'expired' ? 'Süresi doldu' : 'Yenileme tarihi'}
          </span>
          <span className="text-xs font-medium text-gray-900 dark:text-white">
            {formatResetDate(quotaInfo.resetDate)}
          </span>
        </div>
      </div>

      {/* Credit Balance (if user has credits) */}
      {creditBalance > 0 && (
        <div className="mb-3 pb-3 border-b border-gray-200 dark:border-[#3b4f54]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Kredi Bakiyesi
            </span>
            <span className="text-xs font-semibold text-primary">
              {creditBalance} kredi
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Kota bittiğinde kullanılabilir
          </p>
        </div>
      )}

      {/* Upgrade Button */}
      {showUpgradeButton && (
        <button
          onClick={onUpgradeClick}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
        >
          {subscription.status === 'expired' ? 'Planı Yenile' : 'Şimdi Yükselt'}
        </button>
      )}

      {/* Low Quota Warning */}
      {quotaPercentage < 20 && quotaPercentage > 0 && subscription.status === 'active' && (
        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            ⚠️ Kotanız azalıyor. Daha fazla mockup oluşturmak için planınızı yükseltin.
          </p>
        </div>
      )}

      {/* Quota Exhausted Warning */}
      {quotaInfo.remaining === 0 && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-xs text-red-800 dark:text-red-200">
            🚫 Kotanız tükendi. {creditBalance > 0 ? 'Kredi bakiyeniz kullanılacak.' : 'Devam etmek için yükseltin.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuotaWidget;
