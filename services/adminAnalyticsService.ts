import { supabase } from './supabaseClient';

/**
 * Admin Analytics Service
 * Provides analytics and reporting for admin dashboard
 */

export interface AdminStats {
  totalRevenue: number;
  revenueChange: number;
  activeSubscriptions: number;
  subscriptionsChange: number;
  newUsers: number;
  newUsersChange: number;
  totalMockups: number;
  mockupsChange: number;
}

export interface RevenueData {
  date: string;
  amount: number;
}

export interface ConversionMetrics {
  conversionRate: number;
  conversionChange: number;
  freeUsers: number;
  paidUsers: number;
}

export interface PaymentMetrics {
  successRate: number;
  successRateChange: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
}

export interface TopUser {
  userId: string;
  email: string;
  planId: string;
  usage: number;
  avatarUrl?: string;
}

export interface RecentPayment {
  userId: string;
  email: string;
  amount: number;
  status: 'success' | 'failed';
  createdAt: string;
}

/**
 * Get admin dashboard statistics
 */
export async function getAdminStats(period: 'daily' | 'monthly' = 'monthly'): Promise<AdminStats> {
  const now = new Date();
  const periodStart = new Date(now);
  
  if (period === 'monthly') {
    periodStart.setDate(1); // Start of current month
  } else {
    periodStart.setHours(0, 0, 0, 0); // Start of today
  }
  
  const previousPeriodStart = new Date(periodStart);
  const previousPeriodEnd = new Date(periodStart);
  
  if (period === 'monthly') {
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
  } else {
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
  }

  // Get revenue for current period
  const { data: currentRevenue } = await supabase
    .from('payment_transactions')
    .select('amount')
    .eq('status', 'success')
    .gte('created_at', periodStart.toISOString());

  const totalRevenue = currentRevenue?.reduce((sum, t) => sum + t.amount, 0) || 0;

  // Get revenue for previous period
  const { data: previousRevenue } = await supabase
    .from('payment_transactions')
    .select('amount')
    .eq('status', 'success')
    .gte('created_at', previousPeriodStart.toISOString())
    .lt('created_at', periodStart.toISOString());

  const previousTotalRevenue = previousRevenue?.reduce((sum, t) => sum + t.amount, 0) || 0;
  const revenueChange = previousTotalRevenue > 0 
    ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100 
    : 0;

  // Get active subscriptions
  const { count: activeSubscriptions } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .neq('plan_id', 'free');

  // Get previous period active subscriptions
  const { count: previousActiveSubscriptions } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .neq('plan_id', 'free')
    .lt('created_at', periodStart.toISOString());

  const subscriptionsChange = previousActiveSubscriptions && previousActiveSubscriptions > 0
    ? ((activeSubscriptions || 0) - previousActiveSubscriptions) / previousActiveSubscriptions * 100
    : 0;

  // Get new users in current period
  const { count: newUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', periodStart.toISOString());

  // Get new users in previous period
  const { count: previousNewUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', previousPeriodStart.toISOString())
    .lt('created_at', periodStart.toISOString());

  const newUsersChange = previousNewUsers && previousNewUsers > 0
    ? ((newUsers || 0) - previousNewUsers) / previousNewUsers * 100
    : 0;

  // Get total mockups generated
  const { count: totalMockups } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('action', 'image_generated')
    .gte('created_at', periodStart.toISOString());

  // Get previous period mockups
  const { count: previousMockups } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('action', 'image_generated')
    .gte('created_at', previousPeriodStart.toISOString())
    .lt('created_at', periodStart.toISOString());

  const mockupsChange = previousMockups && previousMockups > 0
    ? ((totalMockups || 0) - previousMockups) / previousMockups * 100
    : 0;

  return {
    totalRevenue,
    revenueChange,
    activeSubscriptions: activeSubscriptions || 0,
    subscriptionsChange,
    newUsers: newUsers || 0,
    newUsersChange,
    totalMockups: totalMockups || 0,
    mockupsChange,
  };
}

/**
 * Get revenue over time for chart
 */
export async function getRevenueOverTime(days: number = 30): Promise<RevenueData[]> {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  const { data } = await supabase
    .from('payment_transactions')
    .select('amount, created_at')
    .eq('status', 'success')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  // Group by date
  const revenueByDate: { [key: string]: number } = {};
  
  data?.forEach(transaction => {
    const date = new Date(transaction.created_at).toISOString().split('T')[0];
    revenueByDate[date] = (revenueByDate[date] || 0) + transaction.amount;
  });

  return Object.entries(revenueByDate).map(([date, amount]) => ({
    date,
    amount,
  }));
}

/**
 * Get conversion metrics (free to paid)
 */
export async function getConversionMetrics(): Promise<ConversionMetrics> {
  // Get total free users
  const { count: freeUsers } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('plan_id', 'free');

  // Get total paid users
  const { count: paidUsers } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .neq('plan_id', 'free')
    .eq('status', 'active');

  const totalUsers = (freeUsers || 0) + (paidUsers || 0);
  const conversionRate = totalUsers > 0 ? ((paidUsers || 0) / totalUsers) * 100 : 0;

  // Get previous month conversion rate
  const previousMonthStart = new Date();
  previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
  previousMonthStart.setDate(1);
  
  const previousMonthEnd = new Date(previousMonthStart);
  previousMonthEnd.setMonth(previousMonthEnd.getMonth() + 1);

  const { count: previousPaidUsers } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .neq('plan_id', 'free')
    .eq('status', 'active')
    .gte('created_at', previousMonthStart.toISOString())
    .lt('created_at', previousMonthEnd.toISOString());

  const { count: previousTotalUsers } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', previousMonthStart.toISOString())
    .lt('created_at', previousMonthEnd.toISOString());

  const previousConversionRate = previousTotalUsers && previousTotalUsers > 0
    ? ((previousPaidUsers || 0) / previousTotalUsers) * 100
    : 0;

  const conversionChange = previousConversionRate > 0
    ? conversionRate - previousConversionRate
    : 0;

  return {
    conversionRate,
    conversionChange,
    freeUsers: freeUsers || 0,
    paidUsers: paidUsers || 0,
  };
}

/**
 * Get payment success/failure metrics
 */
export async function getPaymentMetrics(): Promise<PaymentMetrics> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get all payments in last 30 days
  const { data: payments } = await supabase
    .from('payment_transactions')
    .select('status')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const totalPayments = payments?.length || 0;
  const successfulPayments = payments?.filter(p => p.status === 'success').length || 0;
  const failedPayments = payments?.filter(p => p.status === 'failed').length || 0;

  const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

  // Get previous 30 days metrics
  const sixtyDaysAgo = new Date(thirtyDaysAgo);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 30);

  const { data: previousPayments } = await supabase
    .from('payment_transactions')
    .select('status')
    .gte('created_at', sixtyDaysAgo.toISOString())
    .lt('created_at', thirtyDaysAgo.toISOString());

  const previousTotalPayments = previousPayments?.length || 0;
  const previousSuccessfulPayments = previousPayments?.filter(p => p.status === 'success').length || 0;
  const previousSuccessRate = previousTotalPayments > 0 
    ? (previousSuccessfulPayments / previousTotalPayments) * 100 
    : 0;

  const successRateChange = previousSuccessRate > 0 ? successRate - previousSuccessRate : 0;

  return {
    successRate,
    successRateChange,
    totalPayments,
    successfulPayments,
    failedPayments,
  };
}

/**
 * Get top users by usage
 */
export async function getTopUsers(limit: number = 10): Promise<TopUser[]> {
  const { data } = await supabase
    .from('usage_logs')
    .select('user_id')
    .eq('action', 'image_generated');

  // Count usage per user
  const usageByUser: { [key: string]: number } = {};
  data?.forEach(log => {
    usageByUser[log.user_id] = (usageByUser[log.user_id] || 0) + 1;
  });

  // Sort by usage
  const sortedUsers = Object.entries(usageByUser)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit);

  // Get user details
  const topUsers: TopUser[] = [];
  for (const [userId, usage] of sortedUsers) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, avatar_url')
      .eq('id', userId)
      .single();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id')
      .eq('user_id', userId)
      .single();

    if (profile) {
      topUsers.push({
        userId,
        email: profile.email || 'Unknown',
        planId: subscription?.plan_id || 'free',
        usage,
        avatarUrl: profile.avatar_url,
      });
    }
  }

  return topUsers;
}

/**
 * Get recent payment activity
 */
export async function getRecentPayments(limit: number = 10): Promise<RecentPayment[]> {
  const { data } = await supabase
    .from('payment_transactions')
    .select('user_id, amount, status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!data) return [];

  const payments: RecentPayment[] = [];
  for (const transaction of data) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', transaction.user_id)
      .single();

    payments.push({
      userId: transaction.user_id,
      email: profile?.email || 'Unknown',
      amount: transaction.amount,
      status: transaction.status as 'success' | 'failed',
      createdAt: transaction.created_at,
    });
  }

  return payments;
}

/**
 * Generate admin report (CSV export)
 */
export async function generateReport(
  type: 'revenue' | 'users' | 'subscriptions',
  startDate: Date,
  endDate: Date
): Promise<string> {
  let csvContent = '';

  switch (type) {
    case 'revenue':
      const { data: revenueData } = await supabase
        .from('payment_transactions')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      csvContent = 'Date,User ID,Type,Amount,Status\n';
      revenueData?.forEach(t => {
        csvContent += `${t.created_at},${t.user_id},${t.type},${t.amount},${t.status}\n`;
      });
      break;

    case 'users':
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, email, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      csvContent = 'User ID,Email,Created At\n';
      userData?.forEach(u => {
        csvContent += `${u.id},${u.email},${u.created_at}\n`;
      });
      break;

    case 'subscriptions':
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('user_id, plan_id, status, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      csvContent = 'User ID,Plan,Status,Created At\n';
      subscriptionData?.forEach(s => {
        csvContent += `${s.user_id},${s.plan_id},${s.status},${s.created_at}\n`;
      });
      break;
  }

  return csvContent;
}
