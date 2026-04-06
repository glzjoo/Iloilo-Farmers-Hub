import type { Report } from './adminTypes';

interface SuspendModalProps {
    report: Report;
    type: 'temporary' | 'permanent';
    onClose: () => void;
    onConfirm: () => void;
}

export default function SuspendModal({ report, type, onClose, onConfirm }: SuspendModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl ${type === 'permanent' ? 'bg-red-100' : 'bg-orange-100'}`}>
                        {type === 'permanent' ? '⛔' : '🚫'}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {type === 'permanent' ? 'Permanently Ban User?' : 'Temporarily Suspend User?'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-1">
                        You are about to {type === 'permanent' ? 'permanently ban' : 'temporarily suspend'} <strong>{report.reportedUser}</strong>.
                    </p>
                    <p className="text-xs text-gray-400">
                        {type === 'permanent'
                            ? 'This action cannot be undone. The user will lose all access.'
                            : 'The user will be unable to access the platform for 30 days.'}
                    </p>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg border-none cursor-pointer text-sm font-semibold hover:bg-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-5 py-2 text-white rounded-lg border-none cursor-pointer text-sm font-semibold transition-colors ${type === 'permanent'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-orange-500 hover:bg-orange-600'
                            }`}
                    >
                        {type === 'permanent' ? 'Ban Permanently' : 'Suspend 30 Days'}
                    </button>
                </div>
            </div>
        </div>
    );
}
