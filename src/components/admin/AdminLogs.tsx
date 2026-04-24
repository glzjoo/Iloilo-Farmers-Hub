// src/components/admin/AdminLogs.tsx
import { useEffect, useState } from 'react';

export interface AdminAction {
  id: string;
  timestamp: string;
  action: 'warned' | 'suspended' | 'reactivated' | 'viewed' | 'dismissed';
  targetUser: string;
  details?: string;
  adminName: string;
}

interface AdminLogsProps {
  newAction?: AdminAction | null;
}

export default function AdminLogs({ newAction }: AdminLogsProps) {
  const [logs, setLogs] = useState<AdminAction[]>(() => {
    const stored = sessionStorage.getItem('adminActivityLogs');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    if (newAction) {
      setLogs((prev) => {
        const updated = [newAction, ...prev].slice(0, 100);
        sessionStorage.setItem('adminActivityLogs', JSON.stringify(updated));
        return updated;
      });
    }
  }, [newAction]);

  const getActionIcon = (action: AdminAction['action']) => {
    switch (action) {
      case 'warned': 
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'suspended': 
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        );
      case 'reactivated': 
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'viewed': 
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      case 'dismissed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
    }
  };

  const getActionColor = (action: AdminAction['action']) => {
    switch (action) {
      case 'warned': return 'text-yellow-600 bg-yellow-50';
      case 'suspended': return 'text-red-600 bg-red-50';
      case 'reactivated': return 'text-green-600 bg-green-50';
      case 'viewed': return 'text-gray-600 bg-gray-50';
      case 'dismissed': return 'text-gray-500 bg-gray-100';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Admin Activity Log</h3>
        <span className="text-xs text-gray-500">
          {logs.length} entries &bull; session only
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <p className="text-gray-500 text-sm">No activity recorded yet.</p>
          <p className="text-gray-400 text-xs mt-1">Actions will appear here as you manage reports.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActionColor(log.action)}`}>
                {getActionIcon(log.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">{log.adminName}</span>{' '}
                  <span className="text-gray-600">{log.action}</span>{' '}
                  <span className="font-semibold">{log.targetUser}</span>
                  {log.details && <span className="text-gray-500"> ({log.details})</span>}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{formatTime(log.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}