export interface Report {
    id: string;
    firestoreId?: string;
    type: 'Scam' | 'Harassment' | 'Spam' | 'Fraud' | 'Other';
    reportedUser: string;
    reportedUserId: string;
    role: 'Seller' | 'Consumer';
    reportCount: number;
    reportedBy: string;
    reportedById: string;
    reason: string;
    status: 'Pending' | 'Warning' | 'Suspended' | 'Permanently Banned' | 'Resolved';
    date: string;
    conversationId?: string;
}

export function getStatusBadge(status: Report['status']) {
    switch (status) {
        case 'Pending':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    Pending
                </span>
            );
        case 'Warning':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                    ⚠ Warning
                </span>
            );
        case 'Suspended':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                    🚫 Suspended
                </span>
            );
        case 'Permanently Banned':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                    ⛔ Permanently Banned
                </span>
            );
        case 'Resolved':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                    ✓ Resolved
                </span>
            );
    }
}
