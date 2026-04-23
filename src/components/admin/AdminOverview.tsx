// src/components/admin/AdminOverview.tsx
import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  getTotalUserCounts,
  getMonthlyUserRegistrations,
  getDashboardStats,
  type UserCounts,
  type MonthlyRegistration,
  type DashboardStats,
} from '../../services/analyticsService';

const COLORS = {
  farmers: '#10B981',
  consumers: '#6366F1',
  line: '#10B981',
};

export default function AdminOverview() {
  const [userCounts, setUserCounts] = useState<UserCounts>({ farmers: 0, consumers: 0, total: 0 });
  const [monthlyData, setMonthlyData] = useState<MonthlyRegistration[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    revenue: 0,
    revenueChangePercent: 0,
    ordersCount: 0,
    ordersChangePercent: 0,
    newCustomersThisMonth: 0,
    newCustomersChangePercent: 0,
    activeProducts: 0,
    productsChangePercent: 0,
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoadingAnalytics(true);
      try {
        const [counts, monthly, dashboardStats] = await Promise.all([
          getTotalUserCounts(),
          getMonthlyUserRegistrations(),
          getDashboardStats(),
        ]);
        setUserCounts(counts);
        setMonthlyData(monthly);
        setStats(dashboardStats);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoadingAnalytics(false);
      }
    };
    fetchAnalytics();
  }, []);

  const totalUsersData = [
    { name: 'Farmers', value: userCounts.farmers, color: COLORS.farmers },
    { name: 'Consumers', value: userCounts.consumers, color: COLORS.consumers },
  ];

  const statCards = [
    {
      title: 'Total Farmer Revenue',
      subtitle: '(Last 30 Days)',
      value: stats.revenue > 0 ? `₱${stats.revenue.toLocaleString()}` : '₱0.00',
      change: `${stats.revenueChangePercent >= 0 ? '↑' : '↓'} ${Math.abs(stats.revenueChangePercent)}% vs last month`,
      changeType: stats.revenueChangePercent >= 0 ? ('up' as const) : ('down' as const),
      icon: (
        <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Total Orders',
      subtitle: '(Last 30 Days)',
      value: stats.ordersCount.toLocaleString(),
      change: `${stats.ordersChangePercent >= 0 ? '↑' : '↓'} ${Math.abs(stats.ordersChangePercent)}% vs last month`,
      changeType: stats.ordersChangePercent >= 0 ? ('up' as const) : ('down' as const),
      icon: (
        <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      title: 'New Customers',
      subtitle: '(Last 30 Days)',
      value: stats.newCustomersThisMonth.toLocaleString(),
      change: `${stats.newCustomersChangePercent >= 0 ? '↑' : '↓'} ${Math.abs(stats.newCustomersChangePercent)}% vs last month`,
      changeType: stats.newCustomersChangePercent >= 0 ? ('up' as const) : ('down' as const),
      icon: (
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      title: 'Active Products',
      subtitle: '(Last 30 Days)',
      value: stats.activeProducts.toLocaleString(),
      change: `${stats.productsChangePercent >= 0 ? '↑' : '↓'} ${Math.abs(stats.productsChangePercent)}% vs last month`,
      changeType: stats.productsChangePercent >= 0 ? ('up' as const) : ('down' as const),
      icon: (
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart - Total Users */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-6">Total Users</h3>
          <div className="h-64">
            {loadingAnalytics ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading...</div>
            ) : userCounts.total === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No users yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={totalUsersData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {totalUsersData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value ?? 0}`, 'Users']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {totalUsersData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600">{item.name}</span>
                <span className="text-sm font-bold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Line Chart - User Registration Per Month */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-medium text-gray-900 mb-6">User Registration Per Month</h3>
          <div className="h-64">
            {loadingAnalytics ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading...</div>
            ) : monthlyData.every((d) => d.users === 0) ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No registration data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value) => [`${value ?? 0}`, 'Users']}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke={COLORS.line}
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: COLORS.line }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-gray-600">Monthly Unique Visitors Summary</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900">{card.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{card.subtitle}</p>
              </div>
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              {loadingAnalytics ? '...' : card.value}
            </p>
            <p
              className={`text-xs font-medium ${
                card.changeType === 'up' ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {card.change}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}