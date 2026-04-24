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
    status: 'Pending' | '1st Warning' | '1 week suspension' | '30 days suspension' | 'Permanently Banned' | 'Resolved' | 'Dismissed';
    date: string;
    conversationId?: string;
    mediaUrls?: { url: string; type: 'image' | 'video' }[];
}

// ─── AdminAction ───
export type AdminActionType =
  | 'logged_in'
  | 'logged_out'
  | 'warned'
  | 'suspended'
  | 'reactivated'
  | 'dismissed'
  | 'viewed'
  | 'appeal_approved'
  | 'appeal_rejected';

export interface AdminAction {
  id: string;
  timestamp: string;
  action: AdminActionType;
  targetUser: string;
  details?: string;
  adminName: string;
}

// ─── Appeal ───
export type AppealStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected';

export interface Appeal {
  id: string;
  firestoreId: string;
  userId: string;
  userName: string;
  userEmail: string;
  suspensionType: '1 week suspension' | '30 days suspension' | 'permanent';
  reason: string;
  mediaUrls: { url: string; type: 'image' | 'video' }[];
  status: AppealStatus;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

export const getAppealStatusBadge = (status: AppealStatus) => {
  const config: Record<AppealStatus, { bg: string; text: string }> = {
    Pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    'Under Review': { bg: 'bg-blue-100', text: 'text-blue-700' },
    Approved: { bg: 'bg-green-100', text: 'text-green-700' },
    Rejected: { bg: 'bg-red-100', text: 'text-red-700' },
  };
  const { bg, text } = config[status];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bg} ${text}`}>
      {status}
    </span>
  );
};

export function getStatusBadge(status: Report['status']) {
    switch (status) {
        case 'Pending':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    Pending
                </span>
            );
        case '1st Warning':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                    Warning
                </span>
            );
        case '1 week suspension':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                    1 week suspension
                </span>
            );
        case '30 days suspension':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                    30 days suspension
                </span>
            );
        case 'Permanently Banned':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                    Permanently Banned
                </span>
            );
        case 'Resolved':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                    Resolved
                </span>
            );
        case 'Dismissed':
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-500 border border-gray-200">
                    Dismissed
                </span>
            );
    }
}