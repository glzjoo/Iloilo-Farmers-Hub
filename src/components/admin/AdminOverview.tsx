// src/components/admin/AdminOverview.tsx
import type { Report } from './adminTypes';
import { getStatusBadge } from './adminTypes';

interface AdminOverviewProps {
  reports: Report[];
  onViewReport: (report: Report) => void;
}

export default function AdminOverview({ reports, onViewReport }: AdminOverviewProps) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'Pending').length,
    resolvedToday: reports.filter(r => r.status === 'Resolved' && r.date.startsWith(today)).length,
    warned: reports.filter(r => r.status === '1st Warning').length,
    suspended: reports.filter(r => r.status === '1 week suspension' || r.status === '30 days suspension').length,
    banned: reports.filter(r => r.status === 'Permanently Banned').length,
  };

  const recentPending = reports
    .filter(r => r.status === 'Pending')
    .slice(0, 5);

  const topReported = [...reports]
    .sort((a, b) => b.reportCount - a.reportCount)
    .slice(0, 5);

  const statCards = [
    { 
      label: 'Total Reports', 
      value: stats.total, 
      color: 'bg-blue-500', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      label: 'Pending', 
      value: stats.pending, 
      color: 'bg-yellow-500', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      label: 'Resolved Today', 
      value: stats.resolvedToday, 
      color: 'bg-green-500', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      label: 'Active Warnings', 
      value: stats.warned, 
      color: 'bg-orange-500', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    { 
      label: 'Suspended', 
      value: stats.suspended, 
      color: 'bg-red-500', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      )
    },
    { 
      label: 'Banned', 
      value: stats.banned, 
      color: 'bg-red-700', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">{card.icon}</span>
              <div className={`w-2 h-2 rounded-full ${card.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Pending Reports */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Pending Reports</h3>
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
              {stats.pending} total
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {recentPending.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                No pending reports
                <svg className="w-8 h-8 mx-auto mt-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            ) : (
              topReported.map((report) => (
                <button
                  key={report.id}
                  onClick={() => onViewReport(report)}
                  className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-none bg-transparent cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-sm font-bold text-red-600 flex-shrink-0">
                    {report.reportedUser.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{report.reportedUser}</p>
                    <p className="text-xs text-gray-500">{report.type} &bull; {report.date}</p>
                  </div>
                  {getStatusBadge(report.status)}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Top Reported Users */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Most Reported Users</h3>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              Needs attention
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {topReported.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                No reports yet
                <svg className="w-8 h-8 mx-auto mt-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            ) : (
              topReported.map((report) => (
                <button
                  key={report.id}
                  onClick={() => onViewReport(report)}
                  className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-none bg-transparent cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600 flex-shrink-0">
                    {report.reportedUser.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{report.reportedUser}</p>
                    <p className="text-xs text-gray-500">{report.reportCount} reports &bull; {report.role}</p>
                  </div>
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    {report.reportCount}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}