import { supabase } from './supabaseClient';
import {
  SubscriptionPlan,
  UserSubscription,
  QuotaInfo,
  SUBSCRIPTION_PLANS,
  PlanId,
} from '../types';

// Database type that matches Supabase schema
interface DbSubscription {
  id: string;
  user_id: string;
  plan_id: PlanId;
  status: 'active' | 'cancelled' | 'expired';
  current_period_start: string;
  current_period_end: string;
  remaining_quota: number;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all available subscription plans
 */
export function getAvailablePlans(): SubscriptionPlan[] {
  return SUBSCRIPTION_PLANS;
}

/**
 * Get the current subscription plan for a user
 */
export async function getCurrentPlan(userId: string): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch current plan: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const dbSubscription = data as DbSubscription;
  return {
    id: dbSubscription.id,
    userId: dbSubscription.user_id,
    planId: dbSubscription.plan_id,
    status: dbSubscription.status,
    currentPeriodStart: dbSubscription.current_period_start,
    currentPeriodEnd: dbSubscription.current_period_end,
    remainingQuota: dbSubscription.remaining_quota,
    autoRenew: dbSubscription.auto_renew,
    createdAt: dbSubscription.created_at,
    updatedAt: dbSubscription.updated_at,
  };
}

/**
 * Create a new subscription for a user
 */
export async function createSubscription(
  userId: string,
  planId: PlanId,
  paymentToken: string
): Promise<UserSubscription> {
  // Find the plan details
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
  if (!plan) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30); // 30 days subscription period

  const { data, error} = await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        plan_id: planId,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        expires_at: periodEnd.toISOString(),
        remaining_quota: plan.monthlyQuota,
        auto_renew: true,
        updated_at: now.toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create subscription: ${error.message}`);
  }

  // Log the subscription creation
  await supabase.from('usage_logs').insert({
    user_id: userId,
    action: 'plan_changed',
    metadata: {
      planId,
      paymentToken,
      quota: plan.monthlyQuota,
    },
  });

  const dbSubscription = data as DbSubscription;
  return {
    id: dbSubscription.id,
    userId: dbSubscription.user_id,
    planId: dbSubscription.plan_id,
    status: dbSubscription.status,
    currentPeriodStart: dbSubscription.current_period_start,
    currentPeriodEnd: dbSubscription.current_period_end,
    remainingQuota: dbSubscription.remaining_quota,
    autoRenew: dbSubscription.auto_renew,
    createdAt: dbSubscription.created_at,
    updatedAt: dbSubscription.updated_at,
  };
}

/**
 * Upgrade a user's subscription to a higher tier
 * Includes prorated calculation for mid-cycle upgrades
 */
export async function upgradeSubscription(
  userId: string,
  newPlanId: PlanId
): Promise<UserSubscription> {
  // Get current subscription
  const currentSubscription = await getCurrentPlan(userId);
  if (!currentSubscription) {
    throw new Error('No active subscription found');
  }

  // Find the new plan
  const newPlan = SUBSCRIPTION_PLANS.find(p => p.id === newPlanId);
  if (!newPlan) {
    throw new Error(`Invalid plan ID: ${newPlanId}`);
  }

  // Find the current plan
  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === currentSubscription.planId);
  if (!currentPlan) {
    throw new Error(`Current plan not found: ${currentSubscription.planId}`);
  }

  // Calculate prorated charges
  const now = new Date();
  const periodStart = new Date(currentSubscription.currentPeriodStart);
  const periodEnd = new Date(currentSubscription.currentPeriodEnd);
  const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate prorated amount (for payment processing)
  const dailyRateOld = currentPlan.price / totalDays;
  const dailyRateNew = newPlan.price / totalDays;
  const proratedCharge = (dailyRateNew - dailyRateOld) * remainingDays;

  // Update subscription
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      plan_id: newPlanId,
      remaining_quota: newPlan.monthlyQuota, // Reset quota to new plan's quota
      updated_at: now.toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upgrade subscription: ${error.message}`);
  }

  // Log the upgrade
  await supabase.from('usage_logs').insert({
    user_id: userId,
    action: 'plan_changed',
    metadata: {
      oldPlanId: currentSubscription.planId,
      newPlanId,
      proratedCharge,
      remainingDays,
    },
  });

  const dbSubscription = data as DbSubscription;
  return {
    id: dbSubscription.id,
    userId: dbSubscription.user_id,
    planId: dbSubscription.plan_id,
    status: dbSubscription.status,
    currentPeriodStart: dbSubscription.current_period_start,
    currentPeriodEnd: dbSubscription.current_period_end,
    remainingQuota: dbSubscription.remaining_quota,
    autoRenew: dbSubscription.auto_renew,
    createdAt: dbSubscription.created_at,
    updatedAt: dbSubscription.updated_at,
  };
}

/**
 * Cancel a user's subscription
 * Maintains access until the end of the current billing period
 */
export async function cancelSubscription(userId: string): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      auto_renew: false,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }

  // Log the cancellation
  await supabase.from('usage_logs').insert({
    user_id: userId,
    action: 'plan_changed',
    metadata: {
      action: 'cancelled',
    },
  });
}

/**
 * Renew a user's subscription
 * Called automatically when a subscription period ends
 */
export async function renewSubscription(userId: string): Promise<UserSubscription> {
  const currentSubscription = await getCurrentPlan(userId);
  if (!currentSubscription) {
    throw new Error('No subscription found to renew');
  }

  // Find the plan details
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === currentSubscription.planId);
  if (!plan) {
    throw new Error(`Plan not found: ${currentSubscription.planId}`);
  }

  const now = new Date();
  const newPeriodEnd = new Date(now);
  newPeriodEnd.setDate(newPeriodEnd.getDate() + 30); // 30 days subscription period

  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: newPeriodEnd.toISOString(),
      expires_at: newPeriodEnd.toISOString(),
      remaining_quota: plan.monthlyQuota,
      updated_at: now.toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to renew subscription: ${error.message}`);
  }

  // Log the renewal
  await supabase.from('usage_logs').insert({
    user_id: userId,
    action: 'quota_reset',
    metadata: {
      planId: currentSubscription.planId,
      newQuota: plan.monthlyQuota,
      reason: 'renewal',
    },
  });

  const dbSubscription = data as DbSubscription;
  return {
    id: dbSubscription.id,
    userId: dbSubscription.user_id,
    planId: dbSubscription.plan_id,
    status: dbSubscription.status,
    currentPeriodStart: dbSubscription.current_period_start,
    currentPeriodEnd: dbSubscription.current_period_end,
    remainingQuota: dbSubscription.remaining_quota,
    autoRenew: dbSubscription.auto_renew,
    createdAt: dbSubscription.created_at,
    updatedAt: dbSubscription.updated_at,
  };
}

/**
 * Get remaining quota information for a user
 */
export async function getRemainingQuota(userId: string): Promise<QuotaInfo> {
  const subscription = await getCurrentPlan(userId);
  if (!subscription) {
    throw new Error('No subscription found');
  }

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscription.planId);
  if (!plan) {
    throw new Error(`Plan not found: ${subscription.planId}`);
  }

  const total = plan.monthlyQuota;
  const remaining = subscription.remainingQuota;
  const used = total - remaining;

  return {
    total,
    used,
    remaining,
    resetDate: subscription.currentPeriodEnd,
  };
}

/**
 * Decrement the user's quota by a specified amount
 */
export async function decrementQuota(userId: string, amount: number = 1): Promise<QuotaInfo> {
  // Get current subscription
  const subscription = await getCurrentPlan(userId);
  if (!subscription) {
    throw new Error('No subscription found');
  }

  // Check if user has enough quota
  if (subscription.remainingQuota < amount) {
    throw new Error('Insufficient quota');
  }

  // Decrement quota
  const newQuota = subscription.remainingQuota - amount;
  const { error } = await supabase
    .from('subscriptions')
    .update({
      remaining_quota: newQuota,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to decrement quota: ${error.message}`);
  }

  // Log the usage
  await supabase.from('usage_logs').insert({
    user_id: userId,
    action: 'image_generated',
    metadata: {
      amount,
      remainingQuota: newQuota,
    },
  });

  // Return updated quota info
  return getRemainingQuota(userId);
}

/**
 * Reset the monthly quota for a user
 * Called at the start of a new billing period
 */
export async function resetMonthlyQuota(userId: string): Promise<void> {
  const subscription = await getCurrentPlan(userId);
  if (!subscription) {
    throw new Error('No subscription found');
  }

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscription.planId);
  if (!plan) {
    throw new Error(`Plan not found: ${subscription.planId}`);
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({
      remaining_quota: plan.monthlyQuota,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to reset monthly quota: ${error.message}`);
  }

  // Log the reset
  await supabase.from('usage_logs').insert({
    user_id: userId,
    action: 'quota_reset',
    metadata: {
      planId: subscription.planId,
      newQuota: plan.monthlyQuota,
      reason: 'monthly_reset',
    },
  });
}

/**
 * Check if a user can generate an image
 * Returns true if user has quota or credits available
 */
export async function canGenerateImage(userId: string): Promise<boolean> {
  try {
    const subscription = await getCurrentPlan(userId);
    if (!subscription) {
      return false;
    }

    // Check if subscription is active
    if (subscription.status !== 'active') {
      return false;
    }

    // Check if subscription has expired
    const now = new Date();
    const periodEnd = new Date(subscription.currentPeriodEnd);
    if (now > periodEnd) {
      return false;
    }

    // Check if user has remaining quota
    if (subscription.remainingQuota > 0) {
      return true;
    }

    // If no quota, check if user has credits (will be implemented in creditService)
    // For now, return false if no quota
    return false;
  } catch (error) {
    console.error('Error checking if user can generate image:', error);
    return false;
  }
}

/**
 * Check if a user requires an upgrade
 * Returns true if user has exhausted quota or subscription expired
 */
export async function requiresUpgrade(userId: string): Promise<boolean> {
  try {
    const subscription = await getCurrentPlan(userId);
    if (!subscription) {
      return true;
    }

    // Check if subscription has expired
    const now = new Date();
    const periodEnd = new Date(subscription.currentPeriodEnd);
    if (now > periodEnd && subscription.status !== 'active') {
      return true;
    }

    // Check if user has exhausted quota
    if (subscription.remainingQuota === 0) {
      return true;
    }

    // Check if user is on free tier with low quota (< 20%)
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscription.planId);
    if (plan && subscription.planId === 'free') {
      const quotaPercentage = (subscription.remainingQuota / plan.monthlyQuota) * 100;
      if (quotaPercentage < 20) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking if user requires upgrade:', error);
    return false;
  }
}
