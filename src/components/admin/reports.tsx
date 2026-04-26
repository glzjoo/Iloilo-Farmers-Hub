// src/components/admin/reports.tsx
import { useState, type JSX } from 'react';
import type { Report } from './adminTypes';

interface AdminReportsProps {
    reports: Report[];
    onSuspend: (report: Report, type: '1 week suspension' | '30 days suspension' | 'permanent') => void;
    onWarning: (report: Report) => void;
    onReactivate: (reportId: string) => void;
    onDismiss: (report: Report) => void;
    onViewUser: (report: Report) => void;
    onViewEvidence: (report: Report) => void;
    getStatusBadge: (status: Report['status']) => JSX.Element | undefined;
}

function getNextSuspensionAction(status: Report['status']): {
    type: '1 week suspension' | '30 days suspension' | 'permanent';
    label: string;
    color: string;
    hoverColor: string;
} | null {
    switch (status) {
        case 'Pending':
        case '1st Warning':
            return {
                type: '1 week suspension',
                label: 'Suspend',
                color: 'bg-orange-500',
                hoverColor: 'hover:bg-orange-600',
            };
        case '1 week suspension':
            return {
                type: '30 days suspension',
                label: '30 Days Suspend',
                color: 'bg-red-500',
                hoverColor: 'hover:bg-red-600',
            };
        case '30 days suspension':
            return {
                type: 'permanent',
                label: 'Ban Permanently',
                color: 'bg-red-700',
                hoverColor: 'hover:bg-red-800',
            };
        default:
            return null;
    }
}

export default function AdminReports({
    reports,
    onSuspend,
    onWarning,
    onReactivate,
    onDismiss,
    onViewUser,
    onViewEvidence,
    getStatusBadge,
}: AdminReportsProps) {
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredReports = reports.filter(r => {
        const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
        const matchesSearch = searchQuery === '' ||
            r.reportedUser.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.reportedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const statusCounts = {
        All: reports.length,
        Pending: reports.filter(r => r.status === 'Pending').length,
        Warning: reports.filter(r => r.status === '1st Warning').length,
        '1 week suspension': reports.filter(r => r.status === '1 week suspension').length,
        '30 days suspension': reports.filter(r => r.status === '30 days suspension').length,
        'Permanently Banned': reports.filter(r => r.status === 'Permanently Banned').length,
        Resolved: reports.filter(r => r.status === 'Resolved').length,
        Dismissed: reports.filter(r => r.status === 'Dismissed').length,
    };

    return (
        <div>
            {/* Page Title */}
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <svg className="w-8 h-8 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Reported Issues and Scam Alert</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Review and manage reported users and activities</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3 mb-4 sm:mb-6">
                {Object.entries(statusCounts).map(([status, count]) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border text-left cursor-pointer transition-all ${filterStatus === status
                            ? 'bg-primary text-white border-primary shadow-md'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-primary/30 hover:shadow-sm'
                            }`}
                    >
                        <p className={`text-lg sm:text-2xl font-bold ${filterStatus === status ? 'text-white' : 'text-gray-900'}`}>{count}</p>
                        <p className={`text-[10px] sm:text-xs font-medium mt-0.5 truncate ${filterStatus === status ? 'text-green-100' : 'text-gray-500'}`}>{status}</p>
                    </button>
                ))}
            </div>

            {/* Search + Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
                <div className="px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3 border-b border-gray-100">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by user, report ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 border-none outline-none text-sm text-gray-700 bg-transparent placeholder:text-gray-400"
                    />
                </div>

                {/* Desktop Table - hidden on mobile */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-900 text-white">
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Report ID</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Type</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Reported User</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Role</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Reports</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Reported By</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Reason</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Media</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Status</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReports.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                                        No reports found.
                                    </td>
                                </tr>
                            ) : (
                                filteredReports.map((report, idx) => (
                                    <tr key={report.id} className={`border-b border-gray-100 hover:bg-green-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                        <td className="px-4 py-3 font-mono font-semibold text-gray-700">{report.id}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${report.type === 'Scam' ? 'bg-red-100 text-red-700'
                                                : report.type === 'Harassment' ? 'bg-orange-100 text-orange-700'
                                                    : report.type === 'Fraud' ? 'bg-purple-100 text-purple-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {report.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{report.reportedUser}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${report.role === 'Seller' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                                                }`}>
                                                {report.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-gray-800">{report.reportCount}</td>
                                        <td className="px-4 py-3 text-gray-600">{report.reportedBy}</td>
                                        <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={report.reason}>
                                            {report.reason}
                                        </td>
                                        <td className="px-4 py-3">
                                            {report.mediaUrls && report.mediaUrls.length > 0 ? (
                                                <div className="flex items-center gap-1.5">
                                                    {report.mediaUrls.map((media, i) => (
                                                        <a
                                                            key={i}
                                                            href={media.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0"
                                                            title={media.type === 'video' ? 'View video' : 'View image'}
                                                        >
                                                            {media.type === 'video' ? (
                                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            ) : (
                                                                <img src={media.url} alt="" className="w-full h-full object-cover" />
                                                            )}
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">{getStatusBadge(report.status)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1.5">
                                                {/* Row 1: Warning + Suspend */}
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {report.status === 'Pending' && (
                                                        <button
                                                            onClick={() => onWarning(report)}
                                                            className="px-2.5 py-1 bg-yellow-500 text-white text-[11px] font-semibold rounded-md border-none cursor-pointer hover:bg-yellow-600 transition-colors"
                                                        >
                                                            Warning
                                                        </button>
                                                    )}

                                                    {(() => {
                                                        const action = getNextSuspensionAction(report.status);
                                                        if (!action) return null;
                                                        return (
                                                            <button
                                                                onClick={() => onSuspend(report, action.type)}
                                                                className={`px-2.5 py-1 text-white text-[11px] font-semibold rounded-md border-none cursor-pointer transition-colors ${action.color} ${action.hoverColor}`}
                                                            >
                                                                {action.label}
                                                            </button>
                                                        );
                                                    })()}

                                                    {(report.status === '1 week suspension' || report.status === '30 days suspension' || report.status === 'Permanently Banned') && (
                                                        <button
                                                            onClick={() => onReactivate(report.id)}
                                                            className="px-2.5 py-1 bg-green-600 text-white text-[11px] font-semibold rounded-md border-none cursor-pointer hover:bg-green-700 transition-colors"
                                                        >
                                                            Reactivate
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Row 2: View User + View Evidence */}
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => onViewUser(report)}
                                                        className="px-1.5 py-1 bg-transparent text-gray-500 border-none cursor-pointer hover:text-primary transition-colors"
                                                        title="View User Details"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => onViewEvidence(report)}
                                                        className="px-1.5 py-1 bg-transparent text-gray-500 border-none cursor-pointer hover:text-primary transition-colors"
                                                        title="View Evidence"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                {/* Row 3: Dismiss */}
                                                {report.status === 'Pending' && (
                                                    <div className="flex items-center">
                                                        <button
                                                            onClick={() => onDismiss(report)}
                                                            className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[11px] font-semibold rounded-md border border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors"
                                                        >
                                                            Dismiss
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card Layout - visible only on mobile */}
                <div className="md:hidden">
                    {filteredReports.length === 0 ? (
                        <div className="px-4 py-12 text-center text-gray-400">
                            No reports found.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredReports.map((report) => (
                                <div key={report.id} className="p-4 hover:bg-green-50/30 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="font-mono font-semibold text-xs text-gray-500">{report.id}</span>
                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${report.type === 'Scam' ? 'bg-red-100 text-red-700'
                                                    : report.type === 'Harassment' ? 'bg-orange-100 text-orange-700'
                                                        : report.type === 'Fraud' ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {report.type}
                                                </span>
                                            </div>
                                            <p className="font-semibold text-gray-900 text-sm">{report.reportedUser}</p>
                                        </div>
                                        <div className="flex-shrink-0 ml-2">
                                            {getStatusBadge(report.status)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
                                        <div>
                                            <span className="text-gray-400">Role</span>
                                            <div className="mt-0.5">
                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${report.role === 'Seller' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                                    {report.role}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Reports</span>
                                            <p className="font-bold text-gray-800 mt-0.5">{report.reportCount}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-400">Reported By</span>
                                            <p className="text-gray-700 mt-0.5">{report.reportedBy}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-400">Reason</span>
                                            <p className="text-gray-600 mt-0.5 line-clamp-2">{report.reason}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-400">Media</span>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                {report.mediaUrls && report.mediaUrls.length > 0 ? (
                                                    report.mediaUrls.map((media, i) => (
                                                        <a
                                                            key={i}
                                                            href={media.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity"
                                                            title={media.type === 'video' ? 'View video' : 'View image'}
                                                        >
                                                            {media.type === 'video' ? (
                                                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            ) : (
                                                                <img src={media.url} alt="" className="w-full h-full object-cover" />
                                                            )}
                                                        </a>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400 text-xs">—</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile Actions - same 3-row layout */}
                                    <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                                        {/* Row 1: Warning + Suspend/Reactivate */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {report.status === 'Pending' && (
                                                <button
                                                    onClick={() => onWarning(report)}
                                                    className="px-3 py-1.5 bg-yellow-500 text-white text-[11px] font-semibold rounded-md border-none cursor-pointer hover:bg-yellow-600 transition-colors"
                                                >
                                                    Warning
                                                </button>
                                            )}

                                            {(() => {
                                                const action = getNextSuspensionAction(report.status);
                                                if (!action) return null;
                                                return (
                                                    <button
                                                        onClick={() => onSuspend(report, action.type)}
                                                        className={`px-3 py-1.5 text-white text-[11px] font-semibold rounded-md border-none cursor-pointer transition-colors ${action.color} ${action.hoverColor}`}
                                                    >
                                                        {action.label}
                                                    </button>
                                                );
                                            })()}

                                            {(report.status === '1 week suspension' || report.status === '30 days suspension' || report.status === 'Permanently Banned') && (
                                                <button
                                                    onClick={() => onReactivate(report.id)}
                                                    className="px-3 py-1.5 bg-green-600 text-white text-[11px] font-semibold rounded-md border-none cursor-pointer hover:bg-green-700 transition-colors"
                                                >
                                                    Reactivate
                                                </button>
                                            )}
                                        </div>

                                        {/* Row 2: View User + View Evidence */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onViewUser(report)}
                                                className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg border-none cursor-pointer hover:text-primary hover:bg-green-50 transition-colors"
                                                title="View User Details"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => onViewEvidence(report)}
                                                className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg border-none cursor-pointer hover:text-primary hover:bg-green-50 transition-colors"
                                                title="View Evidence"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Row 3: Dismiss */}
                                        {report.status === 'Pending' && (
                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => onDismiss(report)}
                                                    className="px-3 py-1.5 bg-gray-100 text-gray-600 text-[11px] font-semibold rounded-md border border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors"
                                                >
                                                    Dismiss
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}