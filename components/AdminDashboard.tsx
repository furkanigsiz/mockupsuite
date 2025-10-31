import React, { useEffect, useState } from 'react';
import {
  getAdminStats,
  getConversionMetrics,
  getPaymentMetrics,
  getTopUsers,
  getRecentPayments,
  generateReport,
  AdminStats,
  ConversionMetrics,
  PaymentMetrics,
  TopUser,
  RecentPayment,
} from '../services/adminAnalyticsService';
import { authService } from '../services/authService';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [conversionMetrics, setConversionMetrics] = useState<ConversionMetrics | null>(null);
  const [paymentMetrics, setPaymentMetrics] = useState<PaymentMetrics | null>(null);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'subscriptions' | 'settings'>('dashboard');

  useEffect(() => {
    loadDashboardData();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, conversionData, paymentData, topUsersData, recentPaymentsData] = await Promise.all([
        getAdminStats('monthly'),
        getConversionMetrics(),
        getPaymentMetrics(),
        getTopUsers(3),
        getRecentPayments(3),
      ]);

      setStats(statsData);
      setConversionMetrics(conversionData);
      setPaymentMetrics(paymentData);
      setTopUsers(topUsersData);
      setRecentPayments(recentPaymentsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(1); // Start of current month

      const csvContent = await generateReport('revenue', startDate, endDate);
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-report-${startDate.toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₺${amount.toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number) => {
    return value >= 0 ? 'text-green-500' : 'text-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#101f22]">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full bg-[#101f22]">
      {/* Sidebar */}
      <aside className="sticky top-0 h-screen w-64 flex-shrink-0 bg-white/5 p-4 border-r border-white/10">
        <div className="flex h-full flex-col justify-between">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-[#2bcdee]/20 rounded-lg">
                <span className="text-[#2bcdee] text-2xl">✨</span>
              </div>
              <h1 className="text-white text-lg font-bold leading-normal">MockupSuite</h1>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                  activeTab === 'dashboard' ? 'bg-[#2bcdee]/20 text-[#2bcdee]' : 'text-gray-400 hover:bg-white/5'
                }`}
              >
                <span className="text-2xl">📊</span>
                <p className="text-sm font-medium leading-normal">Dashboard</p>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                  activeTab === 'users' ? 'bg-[#2bcdee]/20 text-[#2bcdee]' : 'text-gray-400 hover:bg-white/5'
                }`}
              >
                <span className="text-2xl">👥</span>
                <p className="text-sm font-medium leading-normal">Users</p>
              </button>
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                  activeTab === 'subscriptions' ? 'bg-[#2bcdee]/20 text-[#2bcdee]' : 'text-gray-400 hover:bg-white/5'
                }`}
              >
                <span className="text-2xl">💳</span>
                <p className="text-sm font-medium leading-normal">Subscriptions</p>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                  activeTab === 'settings' ? 'bg-[#2bcdee]/20 text-[#2bcdee]' : 'text-gray-400 hover:bg-white/5'
                }`}
              >
                <span className="text-2xl">⚙️</span>
                <p className="text-sm font-medium leading-normal">Settings</p>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg border border-white/10">
            <div className="w-10 h-10 bg-[#2bcdee]/20 rounded-full flex items-center justify-center">
              <span className="text-[#2bcdee] text-lg">👤</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-white text-base font-medium leading-normal">Admin</h1>
              <p className="text-gray-500 text-sm font-normal leading-normal truncate">
                {currentUser?.email || 'admin@example.com'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          {/* Page Heading */}
          <div className="flex flex-wrap justify-between gap-4 items-center">
            <p className="text-white text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">
              Admin Dashboard
            </p>
            <button
              onClick={handleGenerateReport}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#2bcdee] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#2bcdee]/90 transition-colors"
            >
              <span className="truncate">Generate Report</span>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-1 flex-col gap-2 rounded-lg p-6 border bg-white/5 border-white/10">
              <p className="text-gray-400 text-base font-medium leading-normal">Total Revenue (Monthly)</p>
              <p className="text-white tracking-light text-2xl font-bold leading-tight">
                {stats ? formatCurrency(stats.totalRevenue) : '₺0'}
              </p>
              <p className={`text-base font-medium leading-normal ${getChangeColor(stats?.revenueChange || 0)}`}>
                {stats ? formatPercentage(stats.revenueChange) : '+0%'}
              </p>
            </div>
            <div className="flex flex-1 flex-col gap-2 rounded-lg p-6 border bg-white/5 border-white/10">
              <p className="text-gray-400 text-base font-medium leading-normal">Active Subscriptions</p>
              <p className="text-white tracking-light text-2xl font-bold leading-tight">
                {stats?.activeSubscriptions || 0}
              </p>
              <p className={`text-base font-medium leading-normal ${getChangeColor(stats?.subscriptionsChange || 0)}`}>
                {stats ? formatPercentage(stats.subscriptionsChange) : '+0%'}
              </p>
            </div>
            <div className="flex flex-1 flex-col gap-2 rounded-lg p-6 border bg-white/5 border-white/10">
              <p className="text-gray-400 text-base font-medium leading-normal">New Users (Monthly)</p>
              <p className="text-white tracking-light text-2xl font-bold leading-tight">
                {stats?.newUsers || 0}
              </p>
              <p className={`text-base font-medium leading-normal ${getChangeColor(stats?.newUsersChange || 0)}`}>
                {stats ? formatPercentage(stats.newUsersChange) : '+0%'}
              </p>
            </div>
            <div className="flex flex-1 flex-col gap-2 rounded-lg p-6 border bg-white/5 border-white/10">
              <p className="text-gray-400 text-base font-medium leading-normal">Total Mock-ups Generated</p>
              <p className="text-white tracking-light text-2xl font-bold leading-tight">
                {stats?.totalMockups || 0}
              </p>
              <p className={`text-base font-medium leading-normal ${getChangeColor(stats?.mockupsChange || 0)}`}>
                {stats ? formatPercentage(stats.mockupsChange) : '+0%'}
              </p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-white/10 p-6 bg-white/5">
              <p className="text-white text-base font-medium leading-normal">Revenue Over Time</p>
              <p className="text-white tracking-light text-[32px] font-bold leading-tight truncate">
                {stats ? formatCurrency(stats.totalRevenue) : '₺0'}
              </p>
              <div className="flex gap-1">
                <p className="text-gray-400 text-base font-normal leading-normal">Last 30 Days</p>
                <p className={`text-base font-medium leading-normal ${getChangeColor(stats?.revenueChange || 0)}`}>
                  {stats ? formatPercentage(stats.revenueChange) : '+0%'}
                </p>
              </div>
              <div className="flex min-h-[180px] flex-1 flex-col gap-8 py-4">
                <svg fill="none" height="148" preserveAspectRatio="none" viewBox="-3 0 478 150" width="100%" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H326.769H0V109Z" fill="url(#paint0_linear)"></path>
                  <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="#2bcdee" strokeLinecap="round" strokeWidth="3"></path>
                  <defs>
                    <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear" x1="236" x2="236" y1="1" y2="149">
                      <stop stopColor="#2bcdee" stopOpacity="0.3"></stop>
                      <stop offset="1" stopColor="#2bcdee" stopOpacity="0"></stop>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex min-w-72 flex-1 flex-col justify-between gap-2 rounded-lg border border-white/10 p-6 bg-white/5">
                <p className="text-white text-base font-medium leading-normal">Conversion Rate (Free to Paid)</p>
                <div className="flex justify-center items-center">
                  <p className="text-white tracking-light text-5xl font-bold leading-tight truncate">
                    {conversionMetrics ? `${conversionMetrics.conversionRate.toFixed(1)}%` : '0%'}
                  </p>
                </div>
                <div className="flex gap-1 justify-center">
                  <p className="text-gray-400 text-base font-normal leading-normal">Last 30 Days</p>
                  <p className={`text-base font-medium leading-normal ${getChangeColor(conversionMetrics?.conversionChange || 0)}`}>
                    {conversionMetrics ? formatPercentage(conversionMetrics.conversionChange) : '+0%'}
                  </p>
                </div>
              </div>
              <div className="flex min-w-72 flex-1 flex-col justify-between gap-2 rounded-lg border border-white/10 p-6 bg-white/5">
                <p className="text-white text-base font-medium leading-normal">Payment Success Rate</p>
                <div className="flex justify-center items-center">
                  <p className="text-white tracking-light text-5xl font-bold leading-tight truncate">
                    {paymentMetrics ? `${paymentMetrics.successRate.toFixed(1)}%` : '0%'}
                  </p>
                </div>
                <div className="flex gap-1 justify-center">
                  <p className="text-gray-400 text-base font-normal leading-normal">Last 30 Days</p>
                  <p className={`text-base font-medium leading-normal ${getChangeColor(paymentMetrics?.successRateChange || 0)}`}>
                    {paymentMetrics ? formatPercentage(paymentMetrics.successRateChange) : '+0%'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section Header */}
          <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 pt-5">
            User & Activity
          </h2>

          {/* Data Tables */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Top Users Table */}
            <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-white text-base font-semibold">Top Users by Usage</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-400">
                  <thead className="text-xs text-gray-400 uppercase bg-white/5">
                    <tr>
                      <th className="px-6 py-3" scope="col">User</th>
                      <th className="px-6 py-3" scope="col">Plan</th>
                      <th className="px-6 py-3 text-right" scope="col">Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topUsers.map((user, index) => (
                      <tr key={index} className="border-b border-white/10">
                        <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#2bcdee]/20 flex items-center justify-center">
                              <span className="text-[#2bcdee]">👤</span>
                            </div>
                            <span className="truncate max-w-[150px]">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 capitalize">{user.planId}</td>
                        <td className="px-6 py-4 text-right">{user.usage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Payments Table */}
            <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-white text-base font-semibold">Recent Payment Activity</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-400">
                  <thead className="text-xs text-gray-400 uppercase bg-white/5">
                    <tr>
                      <th className="px-6 py-3" scope="col">User</th>
                      <th className="px-6 py-3" scope="col">Amount</th>
                      <th className="px-6 py-3" scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((payment, index) => (
                      <tr key={index} className="border-b border-white/10">
                        <td className="px-6 py-4 font-medium text-white whitespace-nowrap truncate max-w-[150px]">
                          {payment.email}
                        </td>
                        <td className="px-6 py-4">{formatCurrency(payment.amount)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${
                              payment.status === 'success'
                                ? 'bg-green-900 text-green-300'
                                : 'bg-red-900 text-red-300'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 me-1 rounded-full ${
                                payment.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                              }`}
                            ></span>
                            {payment.status === 'success' ? 'Success' : 'Failed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
