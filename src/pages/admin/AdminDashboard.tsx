import { useState } from 'react';
import type { Report } from '../../components/admin/adminTypes';
import { getStatusBadge } from '../../components/admin/adminTypes';
import AdminReports from '../../components/admin/reports';
import UserDetailModal from '../../components/admin/userDetailModal';
import ConversationModal from '../../components/admin/ConversationModal';
import SuspendModal from '../../components/admin/SuspendModal';

// Mock data
const mockReports: Report[] = [
    {
        id: '#001',
        type: 'Scam',
        reportedUser: 'Mia_Gly Agri',
        reportedUserId: 'usr_001',
        role: 'Seller',
        reportCount: 1,
        reportedBy: 'Bea Trice',
        reportedById: 'usr_002',
        reason: 'Selling non-local products as local',
        status: 'Warning',
        date: '2026-04-01',
    },
    {
        id: '#002',
        type: 'Scam',
        reportedUser: 'BGly Agri',
        reportedUserId: 'usr_003',
        role: 'Consumer',
        reportCount: 2,
        reportedBy: 'Bea Trice',
        reportedById: 'usr_002',
        reason: 'Fake orders and chargebacks',
        status: 'Suspended',
        date: '2026-03-28',
    },
    {
        id: '#003',
        type: 'Harassment',
        reportedUser: 'Juan Farmer',
        reportedUserId: 'usr_004',
        role: 'Seller',
        reportCount: 3,
        reportedBy: 'Ana Santos',
        reportedById: 'usr_005',
        reason: 'Sending threatening messages to buyers',
        status: 'Pending',
        date: '2026-04-02',
    },
    {
        id: '#004',
        type: 'Fraud',
        reportedUser: 'Pedro Reyes',
        reportedUserId: 'usr_006',
        role: 'Consumer',
        reportCount: 5,
        reportedBy: 'Maria Farm',
        reportedById: 'usr_007',
        reason: 'Using fake payment screenshots',
        status: 'Permanently Banned',
        date: '2026-03-20',
    },
    {
        id: '#005',
        type: 'Spam',
        reportedUser: 'Lisa Tan',
        reportedUserId: 'usr_008',
        role: 'Seller',
        reportCount: 1,
        reportedBy: 'Mark Lim',
        reportedById: 'usr_009',
        reason: 'Spamming promotional messages',
        status: 'Resolved',
        date: '2026-03-15',
    },
];

export default function AdminDashboard() {
    const [reports, setReports] = useState<Report[]>(mockReports);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [showUserDetail, setShowUserDetail] = useState(false);
    const [showConversation, setShowConversation] = useState(false);
    const [suspendModal, setSuspendModal] = useState<{ report: Report; type: 'temporary' | 'permanent' } | null>(null);

    const handleSuspend = (report: Report, type: 'temporary' | 'permanent') => {
        setSuspendModal({ report, type });
    };

    const confirmSuspend = () => {
        if (!suspendModal) return;
        setReports(prev => prev.map(r =>
            r.id === suspendModal.report.id
                ? { ...r, status: suspendModal.type === 'permanent' ? 'Permanently Banned' : 'Suspended' }
                : r
        ));
        setSuspendModal(null);
    };

    const handleReactivate = (reportId: string) => {
        setReports(prev => prev.map(r =>
            r.id === reportId ? { ...r, status: 'Resolved' } : r
        ));
    };

    const handleViewUser = (report: Report) => {
        setSelectedReport(report);
        setShowUserDetail(true);
    };

    const handleViewConversation = (report: Report) => {
        setSelectedReport(report);
        setShowConversation(true);
    };

    return (
        <div className="w-full h-full">
            <AdminReports
                reports={reports}
                onSuspend={handleSuspend}
                onReactivate={handleReactivate}
                onViewUser={handleViewUser}
                onViewConversation={handleViewConversation}
                getStatusBadge={getStatusBadge}
            />

            {/* Modals */}
            {showUserDetail && selectedReport && (
                <UserDetailModal
                    report={selectedReport}
                    onClose={() => { setShowUserDetail(false); setSelectedReport(null); }}
                />
            )}
            {showConversation && selectedReport && (
                <ConversationModal
                    report={selectedReport}
                    onClose={() => { setShowConversation(false); setSelectedReport(null); }}
                />
            )}
            {suspendModal && (
                <SuspendModal
                    report={suspendModal.report}
                    type={suspendModal.type}
                    onClose={() => setSuspendModal(null)}
                    onConfirm={confirmSuspend}
                />
            )}
        </div>
    );
}