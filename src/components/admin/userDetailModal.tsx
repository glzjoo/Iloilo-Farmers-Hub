import type { Report } from './adminTypes';
import { getStatusBadge } from './adminTypes';

interface UserDetailModalProps {
    report: Report;
    onClose: () => void;
}

export default function UserDetailModal({ report, onClose }: UserDetailModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-primary px-6 py-4 flex items-center justify-between">
                    <h3 className="text-white font-bold text-lg">User Details</h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white bg-transparent border-none cursor-pointer text-xl leading-none">✕</button>
                </div>

                <div className="p-6">
                    {/* Profile Section */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl text-primary font-bold">
                            {report.reportedUser.charAt(0)}
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-lg">{report.reportedUser}</h4>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${report.role === 'Seller' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                {report.role}
                            </span>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-gray-500 text-xs mb-1">User ID</p>
                            <p className="font-mono font-semibold text-gray-800">{report.reportedUserId}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-gray-500 text-xs mb-1">Total Reports</p>
                            <p className="font-bold text-red-600 text-lg">{report.reportCount}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-gray-500 text-xs mb-1">Status</p>
                            <div className="mt-0.5">{getStatusBadge(report.status)}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-gray-500 text-xs mb-1">Report Date</p>
                            <p className="font-semibold text-gray-800">{report.date}</p>
                        </div>
                    </div>

                    {/* Reported By */}
                    <div className="mt-4 bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500 text-xs mb-1">Reported By</p>
                        <p className="font-semibold text-gray-800">{report.reportedBy}</p>
                    </div>

                    {/* Reason */}
                    <div className="mt-4 bg-red-50 rounded-lg p-3 border border-red-100">
                        <p className="text-red-500 text-xs font-semibold mb-1">Reason for Report</p>
                        <p className="text-gray-800 text-sm">{report.reason}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg border-none cursor-pointer text-sm font-semibold hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
