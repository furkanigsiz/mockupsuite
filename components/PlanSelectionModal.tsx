import React, { useState } from 'react';
import { SUBSCRIPTION_PLANS, PlanId } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface PlanSelectionModalProps {
  onSelectPlan: (planId: PlanId) => void;
  isProcessing?: boolean;
}

export function PlanSelectionModal({ onSelectPlan, isProcessing = false }: PlanSelectionModalProps) {
  const { t } = useTranslations();
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);

  const handleSelectPlan = (planId: PlanId) => {
    setSelectedPlan(planId);
    onSelectPlan(planId);
  };

  const getPlanFeatures = (planId: PlanId): string[] => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) return [];

    const features: string[] = [
      t('pricing_feature_quota', { quota: plan.monthlyQuota.toString() }),
    ];

    if (plan.features.hasWatermark) {
      features.push(t('pricing_feature_watermark'));
      features.push(t('pricing_feature_resolution', { resolution: '512px' }));
    } else {
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
    } else {
      features.push(t('pricing_feature_community_support'));
    }

    return features;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-[1400px] max-h-[95vh] overflow-y-auto">
        <div className="bg-white dark:bg-background-dark rounded-2xl shadow-2xl p-6 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              {t('pricing_title')}
            </h2>
            <p className="mt-3 text-base text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              {t('pricing_subtitle')}
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isPopular = plan.id === 'pro';
              const features = getPlanFeatures(plan.id);

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-xl p-6 transition-all ${
                    isPopular
                      ? 'border-2 border-primary bg-white dark:bg-background-dark shadow-lg lg:scale-105'
                      : 'border border-gray-200 dark:border-white/10 bg-white dark:bg-background-dark shadow-sm'
                  } ${
                    selectedPlan === plan.id
                      ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-background-dark'
                      : ''
                  }`}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-background-dark">
                        {t('pricing_most_popular')}
                      </span>
                    </div>
                  )}

                  {/* Plan Name */}
                  <h3
                    className={`text-xl font-bold ${
                      isPopular ? 'text-primary' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {t(`pricing_plan_${plan.id}_name`)}
                  </h3>

                  {/* Plan Description */}
                  <p className="mt-2 text-gray-500 dark:text-gray-400 text-xs">
                    {t(`pricing_plan_${plan.id}_description`)}
                  </p>

                  {/* Price */}
                  <div className="mt-4">
                    <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                      ₺{plan.price}
                    </span>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('pricing_per_month')}
                    </span>
                  </div>

                  {/* Features */}
                  <ul className="mt-6 space-y-3 flex-1">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-primary text-lg flex-shrink-0 mt-0.5">
                          check_circle
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 text-xs">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <div className="mt-6">
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isProcessing && selectedPlan === plan.id}
                      className={`w-full flex items-center justify-center rounded-lg h-11 px-4 text-xs font-bold leading-normal tracking-wide transition-all ${
                        isPopular
                          ? 'bg-primary text-background-dark hover:opacity-90'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isProcessing && selectedPlan === plan.id ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin">⏳</span>
                          {t('pricing_processing')}
                        </span>
                      ) : plan.id === 'free' ? (
                        t('pricing_start_free')
                      ) : (
                        t('pricing_choose_plan')
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('pricing_footer_note')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
