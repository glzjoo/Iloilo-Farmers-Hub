import { useState } from 'react';
import type { AdminAction } from './adminTypes';

interface AdminLogsProps {
  logs?: AdminAction[];
  loading?: boolean;
}

const actionConfig: Record<string, { icon: string; color: string }> = {
  logged_in: { icon: '🔑', color: 'text-blue-600 bg-blue-50' },
  logged_out: { icon: '🚪', color: 'text-gray-600 bg-gray-50' },
  warned: { icon: '⚠️', color: 'text-yellow-600 bg-yellow-50' },
  suspended: { icon: '🚫', color: 'text-orange-600 bg-orange-50' },
  reactivated: { icon: '✅', color: 'text-green-600 bg-green-50' },
  dismissed: { icon: '🗑️', color: 'text-gray-600 bg-gray-50' },
  viewed: { icon: '👁️', color: 'text-purple-600 bg-purple-50' },
  appeal_approved: { icon: '✅', color: 'text-green-600 bg-green-50' },
  appeal_rejected: { icon: '❌', color: 'text-red-600 bg-red-50' },
};

export default function AdminLogs({ logs = [], loading }: AdminLogsProps) {
  const [filter, setFilter] = useState<string>('All');
  const [search, setSearch] = useState('');

  const safeLogs = Array.isArray(logs) ? logs : [];

  const filtered = safeLogs.filter((log) => {
    const matchesFilter = filter === 'All' || log.action === filter;
    const matchesSearch =
      search === '' ||
      (log.targetUser || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.adminName || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const uniqueActions = Array.from(new Set(safeLogs.map((l) => l.action).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <svg className="w-8 h-8 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Admin Activity Logs</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Track all admin actions and logins</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              filter === 'All' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {uniqueActions.map((action) => (
            <button
              key={action}
              onClick={() => setFilter(action)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filter === action ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {action.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Time</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Admin</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Target</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    No logs found.
                  </td>
                </tr>
              ) : (
                filtered.map((log, idx) => {
                  const cfg = actionConfig[log.action] || { icon: '📝', color: 'text-gray-600 bg-gray-50' };
                  const date = new Date(log.timestamp || Date.now());
                  const key = log.id ? `${log.id}-${idx}` : `log-${idx}`;
                  return (
                    <tr key={key} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{log.adminName || 'Admin'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                          <span>{cfg.icon}</span>
                          {(log.action || 'unknown').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{log.targetUser || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate" title={log.details || ''}>
                        {log.details || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-400">No logs found.</div>
          ) : (
            filtered.map((log, idx) => {
              const cfg = actionConfig[log.action] || { icon: '📝', color: 'text-gray-600 bg-gray-50' };
              const date = new Date(log.timestamp || Date.now());
              const key = log.id ? `${log.id}-m-${idx}` : `log-m-${idx}`;
              return (
                <div key={key} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                      <span>{cfg.icon}</span>
                      {(log.action || 'unknown').replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {log.adminName || 'Admin'} <span className="text-gray-400 font-normal">→</span> {log.targetUser || '—'}
                  </p>
                  {log.details && <p className="text-xs text-gray-500 mt-1">{log.details}</p>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}