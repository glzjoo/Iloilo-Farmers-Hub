import { useState, type JSX } from 'react';
import type { Report } from './adminTypes';

interface AdminReportsProps {
    reports: Report[];
    onSuspend: (report: Report, type: 'temporary' | 'permanent') => void;
    onReactivate: (reportId: string) => void;
    onViewUser: (report: Report) => void;
    onViewConversation: (report: Report) => void;
    getStatusBadge: (status: Report['status']) => JSX.Element | undefined;
}

export default function AdminReports({
    reports,
    onSuspend,
    onReactivate,
    onViewUser,
    onViewConversation,
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
        Warning: reports.filter(r => r.status === 'Warning').length,
        Suspended: reports.filter(r => r.status === 'Suspended').length,
        'Permanently Banned': reports.filter(r => r.status === 'Permanently Banned').length,
        Resolved: reports.filter(r => r.status === 'Resolved').length,
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Admin Header */}
            <div className="bg-primary shadow-md">
                <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-lg tracking-wide">ADMIN DASHBOARD</h1>
                            <p className="text-green-200 text-xs">Iloilo Farmers Hub</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-green-100 text-sm hidden sm:block">Welcome, Admin</span>
                        <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm">A</div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
                {/* Page Title */}
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">⚠️</span>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Reported Issues and Scam Alert</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Review and manage reported users and activities</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    {Object.entries(statusCounts).map(([status, count]) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${filterStatus === status
                                ? 'bg-primary text-white border-primary shadow-md'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-primary/30 hover:shadow-sm'
                                }`}
                        >
                            <p className={`text-2xl font-bold ${filterStatus === status ? 'text-white' : 'text-gray-900'}`}>{count}</p>
                            <p className={`text-xs font-medium mt-0.5 ${filterStatus === status ? 'text-green-100' : 'text-gray-500'}`}>{status}</p>
                        </button>
                    ))}
                </div>

                {/* Search + Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
                    <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                    {/* Table */}
                    <div className="overflow-x-auto">
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
                                                    {report.status !== 'Suspended' && report.status !== 'Permanently Banned' && (
                                                        <button
                                                            onClick={() => onSuspend(report, 'temporary')}
                                                            className="px-2.5 py-1 bg-orange-500 text-white text-[11px] font-semibold rounded-md border-none cursor-pointer hover:bg-orange-600 transition-colors"
                                                        >
                                                            Suspend
                                                        </button>
                                                    )}
                                                    {(report.status === 'Suspended' || report.status === 'Warning') && (
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
                                                    {report.status !== 'Permanently Banned' && (
                                                        <button
                                                            onClick={() => onSuspend(report, 'permanent')}
                                                            className="px-1.5 py-1 bg-transparent text-gray-400 text-base border-none cursor-pointer hover:text-red-600 transition-colors"
                                                            title="Permanently Ban"
                                                        >
                                                            ⛔
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}