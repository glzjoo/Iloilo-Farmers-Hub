import type { Report } from './adminTypes';

interface SuspendModalProps {
    report: Report;
    type: 'warning' | '1 week suspension' | '30 days suspension' | 'permanent';
    onClose: () => void;
    onConfirm: () => void;
}


//this is what the users will see

const modalConfig = {
    'warning': {
        icon: '⚠️',
        iconBg: 'bg-yellow-100',
        title: 'Issue Warning to User?',
        description: 'issue a warning to',
        detail: 'The user will be notified about the violation. No suspension will be applied yet.',
        buttonText: 'Issue Warning',
        buttonClass: 'bg-yellow-500 hover:bg-yellow-600',
    },
    '1 week suspension': {
        icon: '🚫',
        iconBg: 'bg-orange-100',
        title: 'Suspend User for 1 Week?',
        description: 'temporarily suspend',
        detail: 'The user will be unable to access the platform for 7 days.',
        buttonText: 'Suspend 1 Week',
        buttonClass: 'bg-orange-500 hover:bg-orange-600',
    },
    '30 days suspension': {
        icon: '🚫',
        iconBg: 'bg-red-100',
        title: 'Suspend User for 30 Days?',
        description: 'suspend for 30 days',
        detail: 'The user will be unable to access the platform for 30 days.',
        buttonText: 'Suspend 30 Days',
        buttonClass: 'bg-red-500 hover:bg-red-600',
    },
    'permanent': {
        icon: '⛔',
        iconBg: 'bg-red-100',
        title: 'Permanently Ban User?',
        description: 'permanently ban',
        detail: 'This action cannot be undone. The user will lose all access.',
        buttonText: 'Ban Permanently',
        buttonClass: 'bg-red-600 hover:bg-red-700',
    },
};

export default function SuspendModal({ report, type, onClose, onConfirm }: SuspendModalProps) {
    const config = modalConfig[type];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl ${config.iconBg}`}>
                        {config.icon}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {config.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-1">
                        You are about to {config.description} <strong>{report.reportedUser}</strong>.
                    </p>
                    <p className="text-xs text-gray-400">
                        {config.detail}
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
                        className={`px-5 py-2 text-white rounded-lg border-none cursor-pointer text-sm font-semibold transition-colors ${config.buttonClass}`}
                    >
                        {config.buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
}
