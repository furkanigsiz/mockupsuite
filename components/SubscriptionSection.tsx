import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { useTranslations } from '../hooks/useTranslations';
import { getCurrentPlan, getRemainingQuota } from '../services/subscriptionService';
import { UserSubscription, QuotaInfo, SUBSCRIPTION_PLANS } from '../types';
import Spinner from './Spinner';

interface SubscriptionSectionProps {
  onManageSubscription: () => void;
}

export function SubscriptionSection({ onManageSubscription }: SubscriptionSectionProps) {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [srAnnouncement, setSrAnnouncement] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      setSrAnnouncement('Loading subscription data');

      // Fetch subscription and quota data
      const [subscriptionData, quotaData] = await Promise.all([
        getCurrentPlan(user.id),
        getRemainingQuota(user.id),
      ]);

      setSubscription(subscriptionData);
      setQuotaInfo(quotaData);
      setSrAnnouncement('Subscription data loaded');
    } catch (err) {
      console.error('Error loading subscription data:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to load subscription data';
      setError(errorMsg);
      setSrAnnouncement(`Error: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanDetails = () => {
    if (!subscription) return null;
    return SUBSCRIPTION_PLANS.find(p => p.id === subscription.planId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6">
        {/* Screen reader announcements */}
        <div 
          role="status" 
          aria-live="polite" 
          aria-atomic="true"
          className="sr-only"
        >
          {srAnnouncement}
        </div>
        <div className="flex items-center justify-center py-12" role="status" aria-label="Loading subscription data">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6">
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={loadSubscriptionData}
            className="mt-4 text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark rounded"
            aria-label="Retry loading subscription data"
          >
            {t('subscription_try_again')}
          </button>
        </div>
      </div>
    );
  }

  if (!subscription || !quotaInfo) {
    return (
      <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6">
        <div className="text-center py-8">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('subscription_no_subscription')}</p>
        </div>
      </div>
    );
  }

  const plan = getPlanDetails();
  if (!plan) return null;

  const quotaPercentage = (quotaInfo.remaining / quotaInfo.total) * 100;

  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6">
      {/* Screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {srAnnouncement}
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('subscription_section_title')}
        </h3>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
          subscription.status === 'active'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            : subscription.status === 'cancelled'
            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }`}>
          {t(`subscription_status_${subscription.status}` as any)}
        </span>
      </div>

      {/* Current Plan Display */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary/20 text-primary">
              {plan.displayName}
            </span>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-gray-900 dark:text-white">
              ₺{plan.price}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
              {t('subscription_per_month')}
            </span>
          </div>
        </div>
        
        {subscription.status === 'active' && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {t('subscription_renews_on', { date: formatDate(subscription.currentPeriodEnd) })}
          </p>
        )}
        
        {subscription.status === 'cancelled' && (
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
            {t('subscription_access_until', { date: formatDate(subscription.currentPeriodEnd) })}
          </p>
        )}
      </div>

      {/* Quota Display */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('subscription_monthly_generations')}
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {quotaInfo.remaining.toLocaleString()} / {quotaInfo.total.toLocaleString()}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              quotaPercentage > 50
                ? 'bg-green-500'
                : quotaPercentage > 20
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${quotaPercentage}%` }}
          />
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {t('subscription_resets_on', { date: formatDate(quotaInfo.resetDate) })}
        </p>
      </div>

      {/* Plan Features */}
      <div className="mb-6 p-4 bg-white dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {t('subscription_plan_features')}
        </h4>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="material-symbols-outlined text-primary text-lg flex-shrink-0">
              check_circle
            </span>
            <span>{t('subscription_generations_per_month', { quota: plan.monthlyQuota })}</span>
          </li>
          <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="material-symbols-outlined text-primary text-lg flex-shrink-0">
              check_circle
            </span>
            <span>{t('subscription_max_resolution', { resolution: plan.features.maxResolution })}</span>
          </li>
          {!plan.features.hasWatermark && (
            <>
              <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="material-symbols-outlined text-primary text-lg flex-shrink-0">
                  check_circle
                </span>
                <span>{t('subscription_no_watermark')}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="material-symbols-outlined text-primary text-lg flex-shrink-0">
                  check_circle
                </span>
                <span>{t('subscription_high_resolution')}</span>
              </li>
            </>
          )}
          {plan.features.queuePriority === 'high' && (
            <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="material-symbols-outlined text-primary text-lg flex-shrink-0">
                check_circle
              </span>
              <span>{t('subscription_priority_queue')}</span>
            </li>
          )}
          {plan.features.supportLevel === 'priority' && (
            <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="material-symbols-outlined text-primary text-lg flex-shrink-0">
                check_circle
              </span>
              <span>{t('subscription_priority_support')}</span>
            </li>
          )}
          {plan.features.supportLevel === 'email' && (
            <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="material-symbols-outlined text-primary text-lg flex-shrink-0">
                check_circle
              </span>
              <span>{t('subscription_email_support')}</span>
            </li>
          )}
        </ul>
      </div>

      {/* Manage Subscription Button */}
      <button
        onClick={onManageSubscription}
        className="w-full flex items-center justify-center gap-2 rounded-lg h-11 px-4 bg-primary/20 text-primary hover:bg-primary/30 transition-colors font-bold text-sm
                 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark"
        aria-label="Manage subscription and upgrade plan"
      >
        <span className="material-symbols-outlined text-lg" aria-hidden="true">upgrade</span>
        <span>{t('profile_manage_subscription')}</span>
      </button>

      {/* Low Quota Warning */}
      {quotaPercentage < 20 && quotaPercentage > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-lg flex-shrink-0">
              warning
            </span>
            <p className="text-xs text-yellow-800 dark:text-yellow-300">
              {t('subscription_low_quota_warning')}
            </p>
          </div>
        </div>
      )}

      {/* No Quota Warning */}
      {quotaInfo.remaining === 0 && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-lg flex-shrink-0">
              error
            </span>
            <p className="text-xs text-red-800 dark:text-red-300">
              {t('subscription_no_quota_warning', { date: formatDate(quotaInfo.resetDate) })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
