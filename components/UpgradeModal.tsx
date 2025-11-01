import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { useTranslations } from '../hooks/useTranslations';
import { getCurrentPlan } from '../services/subscriptionService';
import { SUBSCRIPTION_PLANS, PlanId, UserSubscription } from '../types';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (planId: PlanId) => void;
  trigger?: 'quota_exhausted' | 'manual' | 'renewal_reminder';
}

export function UpgradeModal({ isOpen, onClose, onUpgrade, trigger = 'manual' }: UpgradeModalProps) {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      // Reset state when modal opens
      setSelectedPlan(null);
      setIsProcessing(false);
      loadCurrentSubscription();
    } else if (!isOpen) {
      // Reset state when modal closes
      setSelectedPlan(null);
      setIsProcessing(false);
    }
  }, [isOpen, user]);

  const loadCurrentSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const subscription = await getCurrentPlan(user.id);
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Error loading current subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProratedPrice = (newPlanId: PlanId): number => {
    if (!currentSubscription) return 0;

    const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === currentSubscription.planId);
    const newPlan = SUBSCRIPTION_PLANS.find(p => p.id === newPlanId);

    if (!currentPlan || !newPlan) return 0;

    // Calculate remaining days in current period
    const now = new Date();
    const periodEnd = new Date(currentSubscription.currentPeriodEnd);
    const periodStart = new Date(currentSubscription.currentPeriodStart);
    
    const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate prorated charge
    const dailyRateOld = currentPlan.price / totalDays;
    const dailyRateNew = newPlan.price / totalDays;
    const proratedCharge = (dailyRateNew - dailyRateOld) * remainingDays;

    return Math.max(0, proratedCharge);
  };

  const handleUpgrade = async (planId: PlanId) => {
    setSelectedPlan(planId);
    setIsProcessing(true);
    
    try {
      await onUpgrade(planId);
    } catch (error) {
      console.error('Error upgrading plan:', error);
      setIsProcessing(false);
    }
  };

  const getAvailableUpgrades = (): PlanId[] => {
    if (!currentSubscription) return ['starter', 'pro', 'business'];

    const currentPlanIndex = SUBSCRIPTION_PLANS.findIndex(p => p.id === currentSubscription.planId);
    return SUBSCRIPTION_PLANS
      .slice(currentPlanIndex + 1)
      .map(p => p.id);
  };

  const getPlanFeatures = (planId: PlanId): string[] => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) return [];

    const features: string[] = [
      t('pricing_feature_quota', { quota: plan.monthlyQuota.toString() }),
    ];

    if (!plan.features.hasWatermark) {
      features.push(t('pricing_feature_no_watermark'));
      features.push(t('pricing_feature_high_resolution'));
    }

    if (plan.features.queuePriority === 'high') {
      features.push(t('pricing_feature_priority_queue'));
    }

    if (plan.features.supportLevel === 'priority') {
      features.push(t('pricing_feature_priority_support'));
    } else if (plan.features.supportLevel === 'email') {
      features.push(t('pricing_feature_email_support'));
    }

    return features;
  };

  const getTriggerMessage = (): string => {
    switch (trigger) {
      case 'quota_exhausted':
        return t('upgrade_modal_quota_exhausted_message');
      case 'renewal_reminder':
        return t('upgrade_modal_renewal_reminder_message');
      case 'manual':
      default:
        return t('upgrade_modal_manual_message');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl my-8">
        <div className="bg-white dark:bg-background-dark rounded-xl shadow-2xl p-8 md:p-12">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              {t('upgrade_modal_title')}
            </h2>
            <p className="mt-3 text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {getTriggerMessage()}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Current Plan Info */}
              {currentSubscription && (
                <div className="mb-8 p-6 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {t('upgrade_modal_current_plan')}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {t(`pricing_plan_${currentSubscription.planId}_name`)} - 
                        {currentSubscription.remainingQuota} / {SUBSCRIPTION_PLANS.find(p => p.id === currentSubscription.planId)?.monthlyQuota} {t('upgrade_modal_remaining')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        ₺{SUBSCRIPTION_PLANS.find(p => p.id === currentSubscription.planId)?.price}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('pricing_per_month')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Comparison Table */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                  {t('upgrade_modal_compare_plans')}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getAvailableUpgrades().map((planId) => {
                    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
                    if (!plan) return null;

                    const isPopular = planId === 'pro';
                    const features = getPlanFeatures(planId);
                    const proratedPrice = calculateProratedPrice(planId);
                    const showProrated = currentSubscription && currentSubscription.planId !== 'free' && proratedPrice > 0;

                    return (
                      <div
                        key={planId}
                        className={`relative flex flex-col rounded-xl p-6 transition-all ${
                          isPopular
                            ? 'border-2 border-primary bg-white dark:bg-background-dark shadow-lg scale-105'
                            : 'border border-gray-200 dark:border-white/10 bg-white dark:bg-background-dark shadow-sm'
                        } ${
                          selectedPlan === planId
                            ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-background-dark'
                            : ''
                        }`}
                      >
                        {/* Popular Badge */}
                        {isPopular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-background-dark">
                              {t('pricing_most_popular')}
                            </span>
                          </div>
                        )}

                        {/* Plan Name */}
                        <h4 className={`text-xl font-bold ${
                          isPopular ? 'text-primary' : 'text-gray-900 dark:text-white'
                        }`}>
                          {t(`pricing_plan_${planId}_name`)}
                        </h4>

                        {/* Price */}
                        <div className="mt-4">
                          <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                            ₺{plan.price}
                          </span>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {t('pricing_per_month')}
                          </span>
                        </div>

                        {/* Prorated Price */}
                        {showProrated && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-xs text-blue-800 dark:text-blue-200">
                              {t('upgrade_modal_prorated_today')}: <span className="font-bold">₺{proratedPrice.toFixed(2)}</span>
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                              {t('upgrade_modal_prorated_explanation')}
                            </p>
                          </div>
                        )}

                        {/* Features */}
                        <ul className="mt-6 space-y-3 flex-1">
                          {features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="material-symbols-outlined text-primary text-lg flex-shrink-0 mt-0.5">
                                check_circle
                              </span>
                              <span className="text-gray-700 dark:text-gray-300 text-sm">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {/* Upgrade Button */}
                        <div className="mt-6">
                          <button
                            onClick={() => handleUpgrade(planId)}
                            disabled={isProcessing && selectedPlan === planId}
                            className={`w-full flex items-center justify-center rounded-lg h-11 px-4 text-sm font-bold leading-normal tracking-wide transition-all ${
                              isPopular
                                ? 'bg-primary text-background-dark hover:opacity-90'
                                : 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isProcessing && selectedPlan === planId ? (
                              <span className="flex items-center gap-2">
                                <span className="animate-spin">⏳</span>
                                {t('pricing_processing')}
                              </span>
                            ) : (
                              t('upgrade_modal_upgrade_button')
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('upgrade_modal_footer_note')}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
