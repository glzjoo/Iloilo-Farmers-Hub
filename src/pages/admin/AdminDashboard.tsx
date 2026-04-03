import { useState, useEffect } from 'react';
import type { Report } from '../../components/admin/adminTypes';
import { getStatusBadge } from '../../components/admin/adminTypes';
import AdminReports from '../../components/admin/reports';
import UserDetailModal from '../../components/admin/userDetailModal';
import ConversationModal from '../../components/admin/ConversationModal';
import SuspendModal from '../../components/admin/SuspendModal';
import { getReports, updateReportStatus, suspendUser, unsuspendUser } from '../../services/reportService';

export default function AdminDashboard() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [showUserDetail, setShowUserDetail] = useState(false);
    const [showConversation, setShowConversation] = useState(false);
    const [suspendModal, setSuspendModal] = useState<{ report: Report; type: 'temporary' | 'permanent' } | null>(null);

    // Fetch reports from Firestore
    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data = await getReports();
                setReports(data);
            } catch (error) {
                console.error('Failed to fetch reports:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    const handleSuspend = (report: Report, type: 'temporary' | 'permanent') => {
        setSuspendModal({ report, type });
    };

    const confirmSuspend = async () => {
        if (!suspendModal) return;
        const newStatus = suspendModal.type === 'permanent' ? 'Permanently Banned' : 'Suspended';

        try {
            // Update report status in Firestore
            if (suspendModal.report.firestoreId) {
                await updateReportStatus(suspendModal.report.firestoreId, newStatus as Report['status']);
            }

            // Suspend the actual user account
            if (suspendModal.report.reportedUserId) {
                await suspendUser(suspendModal.report.reportedUserId, suspendModal.type);
            }
        } catch (error) {
            console.error('Failed to suspend user:', error);
            alert('Failed to suspend user. Please try again.');
        }

        // Update local state
        setReports(prev => prev.map(r =>
            r.id === suspendModal.report.id
                ? { ...r, status: newStatus as Report['status'] }
                : r
        ));
        setSuspendModal(null);
    };

    const handleReactivate = async (reportId: string) => {
        const report = reports.find(r => r.id === reportId);
        try {
            if (report?.firestoreId) {
                await updateReportStatus(report.firestoreId, 'Resolved');
            }
            // Unsuspend the actual user account
            if (report?.reportedUserId) {
                await unsuspendUser(report.reportedUserId);
            }
        } catch (error) {
            console.error('Failed to reactivate user:', error);
            alert('Failed to reactivate user. Please try again.');
        }
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Loading reports...</p>
                </div>
            </div>
        );
    }

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