import { useState, type JSX } from 'react';
import type { Report } from './adminTypes';

interface AdminReportsProps {
    reports: Report[];
    onSuspend: (report: Report, type: '1 week suspension' | '30 days suspension' | 'permanent') => void;
    onWarning: (report: Report) => void;
    onReactivate: (reportId: string) => void;
    onViewUser: (report: Report) => void;
    onViewConversation: (report: Report) => void;
    getStatusBadge: (status: Report['status']) => JSX.Element | undefined;
    onLogout: () => void;
}

/** Determine the next suspension level based on the current report status */
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
                label: '1 Week Suspend',
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
            return null; // Already permanently banned or resolved
    }
}

export default function AdminReports({
    reports,
    onSuspend,
    onWarning,
    onReactivate,
    onViewUser,
    onViewConversation,
    getStatusBadge,
    onLogout,
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
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Admin head */}
            <div className="bg-primary shadow-md">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-sm sm:text-lg tracking-wide">ADMIN DASHBOARD</h1>
                            <p className="text-green-200 text-[10px] sm:text-xs">Iloilo Farmers Hub</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-green-100 text-sm hidden sm:block">Welcome, Admin</span>
                        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">A</div>
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-medium rounded-lg border border-white/20 cursor-pointer transition-all duration-200"
                            title="Logout"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
                {/* Page Title */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <span className="text-2xl sm:text-3xl">⚠️</span>
                    <div>
                        <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Reported Issues and Scam Alert</h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Review and manage reported users and activities</p>
                    </div>
                </div>

                {/* Stats  */}
                <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4 sm:mb-6">
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

                    {/* Desktop Table hidden on mobile */}
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
                                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReports.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
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
                                            <td className="px-4 py-3">{getStatusBadge(report.status)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {/* Warning Button — only show if not already warned/suspended/banned */}
                                                    {report.status === 'Pending' && (
                                                        <button
                                                            onClick={() => onWarning(report)}
                                                            className="px-2.5 py-1 bg-yellow-500 text-white text-[11px] font-semibold rounded-md border-none cursor-pointer hover:bg-yellow-600 transition-colors"
                                                        >
                                                            ⚠ Warning
                                                        </button>
                                                    )}

                                                    {/* Progressive Suspend/Ban Button */}
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

                                                    {/* Reactivate — only for suspended/banned users */}
                                                    {(report.status === '1 week suspension' || report.status === '30 days suspension' || report.status === 'Permanently Banned') && (
                                                        <button
                                                            onClick={() => onReactivate(report.id)}
                                                            className="px-2.5 py-1 bg-green-600 text-white text-[11px] font-semibold rounded-md border-none cursor-pointer hover:bg-green-700 transition-colors"
                                                        >
                                                            Reactivate
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => onViewUser(report)}
                                                        className="px-1.5 py-1 bg-transparent text-gray-500 text-base border-none cursor-pointer hover:text-primary transition-colors"
                                                        title="View User Details"
                                                    >
                                                        👤
                                                    </button>
                                                    <button
                                                        onClick={() => onViewConversation(report)}
                                                        className="px-1.5 py-1 bg-transparent text-gray-500 text-base border-none cursor-pointer hover:text-primary transition-colors"
                                                        title="View Conversation"
                                                    >
                                                        💬
                                                    </button>
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
                                        {/* Card Header */}
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

                                        {/* Card Details */}
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
                                        </div>

                                        {/* Card Actions */}
                                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                            {/* Warning Button — only show if pending */}
                                            {report.status === 'Pending' && (
                                                <button
                                                    onClick={() => onWarning(report)}
                                                    className="px-3 py-1.5 bg-yellow-500 text-white text-[11px] font-semibold rounded-md border-none cursor-pointer hover:bg-yellow-600 transition-colors"
                                                >
                                                    ⚠ Warning
                                                </button>
                                            )}

                                            {/* Progressive Suspend/Ban Button */}
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

                                            {/* Reactivate — only for suspended/banned users */}
                                            {(report.status === '1 week suspension' || report.status === '30 days suspension' || report.status === 'Permanently Banned') && (
                                                <button
                                                    onClick={() => onReactivate(report.id)}
                                                    className="px-3 py-1.5 bg-green-600 text-white text-[11px] font-semibold rounded-md border-none cursor-pointer hover:bg-green-700 transition-colors"
                                                >
                                                    Reactivate
                                                </button>
                                            )}

                                            <div className="flex-1" />
                                            <button
                                                onClick={() => onViewUser(report)}
                                                className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 text-base rounded-lg border-none cursor-pointer hover:text-primary hover:bg-green-50 transition-colors"
                                                title="View User Details"
                                            >
                                                👤
                                            </button>
                                            <button
                                                onClick={() => onViewConversation(report)}
                                                className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 text-base rounded-lg border-none cursor-pointer hover:text-primary hover:bg-green-50 transition-colors"
                                                title="View Conversation"
                                            >
                                                💬
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}