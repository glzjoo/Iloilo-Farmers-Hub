// src/pages/admin/AdminDashboard.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Report, Appeal, AdminAction } from '../../components/admin/adminTypes';
import { getStatusBadge, getAppealStatusBadge } from '../../components/admin/adminTypes';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminOverview from '../../components/admin/AdminOverview';
import AdminReports from '../../components/admin/reports';
import AdminLogs from '../../components/admin/AdminLogs';
import AdminAppeals from '../../components/admin/AdminAppeals';
import AdminAnalytics from '../../components/admin/AdminAnalytics';
import UserDetailModal from '../../components/admin/userDetailModal';
import EvidenceModal from '../../components/admin/EvidenceModal';
import SuspendModal from '../../components/admin/SuspendModal';
import AppealDetailModal from '../../components/admin/AppealDetailModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { updateReportStatus, unsuspendUser } from '../../services/reportService';
import { updateAppealStatus } from '../../services/appealService';

type TabId = 'overview' | 'reports' | 'appeals' | 'logs' | 'analytics';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const loginLoggedRef = useRef(false);

  const [reports, setReports] = useState<Report[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [logs, setLogs] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [appealsLoading, setAppealsLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [suspendModal, setSuspendModal] = useState<{
    report: Report;
    type: 'warning' | '1 week suspension' | '30 days suspension' | 'permanent';
  } | null>(null);

  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [showAppealDetail, setShowAppealDetail] = useState(false);

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });

  const [actionLoading, setActionLoading] = useState(false);

  // Auth guard + log admin login once per session
  useEffect(() => {
    if (!sessionStorage.getItem('isAdmin')) {
      navigate('/admin/login');
      return;
    }
    if (!loginLoggedRef.current) {
      loginLoggedRef.current = true;
      addLog('logged_in', 'System', 'Admin accessed dashboard');
    }
  }, [navigate]);

  // ─── Real-time Reports ───
  useEffect(() => {
    const reportsQuery = query(
      collection(db, 'reports_users'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      reportsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc, idx) => {
          const d = doc.data();
          const createdAt = d.createdAt?.toDate?.();
          return {
            id: `#${String(idx + 1).padStart(3, '0')}`,
            firestoreId: doc.id,
            type: d.type || 'Other',
            reportedUser: d.reportedUser || 'Unknown',
            reportedUserId: d.reportedUserId || '',
            role: d.role || 'Consumer',
            reportCount: d.reportCount || 1,
            reportedBy: d.reportedBy || 'Unknown',
            reportedById: d.reportedById || '',
            reason: d.reason || '',
            status: d.status || 'Pending',
            date: createdAt ? createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            conversationId: d.conversationId || '',
            mediaUrls: d.mediaUrls || [],
          } as Report;
        });
        setReports(data);
        setLoading(false);
      },
      (error) => {
        console.error('Firestore subscription error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ─── Real-time Appeals ───
  useEffect(() => {
    const appealsQuery = query(
      collection(db, 'appeals'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      appealsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc, idx) => {
          const d = doc.data();
          const createdAt = d.createdAt?.toDate?.();
          return {
            id: `#${String(idx + 1).padStart(3, '0')}`,
            firestoreId: doc.id,
            userId: d.userId || '',
            userName: d.userName || 'Unknown',
            userEmail: d.userEmail || '',
            suspensionType: d.suspensionType || 'permanent',
            reason: d.reason || '',
            mediaUrls: d.mediaUrls || [],
            status: d.status || 'Pending',
            adminNotes: d.adminNotes || '',
            createdAt: createdAt ? createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            updatedAt: d.updatedAt?.toDate?.()?.toISOString() || '',
          } as Appeal;
        });
        setAppeals(data);
        setAppealsLoading(false);
      },
      (error) => {
        console.error('Firestore appeals subscription error:', error);
        setAppealsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ─── Real-time Admin Logs ───
  useEffect(() => {
    const logsQuery = query(
      collection(db, 'admin_logs'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      logsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const d = doc.data();
          const ts = d.timestamp?.toDate?.();
          return {
            id: doc.id,
            timestamp: ts ? ts.toISOString() : new Date().toISOString(),
            action: d.action || 'unknown',
            targetUser: d.targetUser || 'Unknown',
            details: d.details || '',
            adminName: d.adminName || 'Admin',
          } as AdminAction;
        });
        setLogs(data);
        setLogsLoading(false);
      },
      (error) => {
        console.error('Firestore logs subscription error:', error);
        setLogsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ─── Persist log to Firestore ───
  const addLog = useCallback(async (action: AdminAction['action'], targetUser: string, details?: string) => {
    try {
      await addDoc(collection(db, 'admin_logs'), {
        action,
        targetUser,
        details: details || '',
        adminName: 'Admin',
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to write admin log:', err);
    }
  }, []);

  const showSuccess = useCallback((title: string, message: string) => {
    setSuccessModal({ isOpen: true, title, message });
  }, []);

  // ─── Report Handlers ───
  const handleSuspend = (report: Report, type: '1 week suspension' | '30 days suspension' | 'permanent') => {
    setSuspendModal({ report, type });
  };

  const handleWarning = (report: Report) => {
    setSuspendModal({ report, type: 'warning' });
  };

  const confirmSuspend = async () => {
    if (!suspendModal || actionLoading) return;
    setActionLoading(true);

    const statusMap: Record<string, Report['status']> = {
      warning: '1st Warning',
      '1 week suspension': '1 week suspension',
      '30 days suspension': '30 days suspension',
      permanent: 'Permanently Banned',
    };
    const newStatus = statusMap[suspendModal.type];

    try {
      if (suspendModal.report.firestoreId) {
        await updateReportStatus(suspendModal.report.firestoreId, newStatus);
      }

      const actionLabel =
        suspendModal.type === 'warning' ? 'warned' :
        suspendModal.type === 'permanent' ? 'banned' : `suspended (${suspendModal.type})`;

      await addLog(
        suspendModal.type === 'warning' ? 'warned' : 'suspended',
        suspendModal.report.reportedUser,
        suspendModal.type === 'warning' ? undefined : suspendModal.type
      );

      showSuccess(
        'Action Completed',
        `${suspendModal.report.reportedUser} has been ${actionLabel} successfully.`
      );
    } catch (error) {
      console.error('Failed to process action:', error);
      showSuccess('Action Failed', 'Something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
      setSuspendModal(null);
    }
  };

  const handleReactivate = async (reportId: string) => {
    if (actionLoading) return;
    setActionLoading(true);

    const report = reports.find((r) => r.id === reportId);
    try {
      if (report?.firestoreId) {
        await updateReportStatus(report.firestoreId, 'Resolved');
      }
      if (report?.reportedUserId) {
        await unsuspendUser(report.reportedUserId);
      }

      await addLog('reactivated', report?.reportedUser || 'Unknown');
      showSuccess('User Reactivated', `${report?.reportedUser || 'User'} has been reactivated.`);
    } catch (error) {
      console.error('Failed to reactivate user:', error);
      showSuccess('Action Failed', 'Failed to reactivate user. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismiss = async (report: Report) => {
    if (actionLoading) return;
    setActionLoading(true);

    try {
      if (report.firestoreId) {
        await updateReportStatus(report.firestoreId, 'Dismissed');
      }

      await addLog('dismissed', report.reportedUser, 'report marked as false/not relevant');
      showSuccess('Report Dismissed', `Report ${report.id} has been dismissed. No action was taken against ${report.reportedUser}.`);
    } catch (error) {
      console.error('Failed to dismiss report:', error);
      showSuccess('Action Failed', 'Failed to dismiss report. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewUser = (report: Report) => {
    setSelectedReport(report);
    setShowUserDetail(true);
    addLog('viewed', report.reportedUser, 'user details');
  };

  const handleViewEvidence = (report: Report) => {
    setSelectedReport(report);
    setShowEvidence(true);
    addLog('viewed', report.reportedUser, 'evidence');
  };

  // ─── Appeal Handlers ───
  const handleViewAppeal = (appeal: Appeal) => {
    setSelectedAppeal(appeal);
    setShowAppealDetail(true);
    addLog('viewed', appeal.userName, 'appeal details');
  };

  const handleAppealAction = async (appeal: Appeal, status: 'Approved' | 'Rejected') => {
    try {
      if (status === 'Approved' && appeal.userId) {
        await unsuspendUser(appeal.userId);
      }
      await addLog(
        status === 'Approved' ? 'appeal_approved' : 'appeal_rejected',
        appeal.userName,
        status === 'Approved' ? 'appeal approved — user reinstated' : 'appeal rejected'
      );
      showSuccess(
        status === 'Approved' ? 'Appeal Approved' : 'Appeal Rejected',
        status === 'Approved'
          ? `${appeal.userName} has been reinstated.`
          : `The appeal from ${appeal.userName} has been rejected.`
      );
    } catch (error) {
      console.error('Failed to process appeal:', error);
      showSuccess('Action Failed', 'Failed to process appeal. Please try again.');
    }
  };

  const handleLogout = () => {
    addLog('logged_out', 'System', 'Admin logged out');
    sessionStorage.removeItem('isAdmin');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabId)}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className={`flex-1 overflow-y-auto min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="lg:hidden bg-primary px-4 py-3 flex items-center justify-between">
          <h1 className="text-white font-bold text-sm">Admin Dashboard</h1>
          <span className="text-green-200 text-xs">Iloilo Farmers Hub</span>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
          {activeTab === 'overview' && <AdminOverview />}

          {activeTab === 'reports' && (
            <AdminReports
              reports={reports}
              onSuspend={handleSuspend}
              onWarning={handleWarning}
              onReactivate={handleReactivate}
              onDismiss={handleDismiss}
              onViewUser={handleViewUser}
              onViewEvidence={handleViewEvidence}
              getStatusBadge={getStatusBadge}
            />
          )}

          {activeTab === 'appeals' && (
            <AdminAppeals
              appeals={appeals}
              loading={appealsLoading}
              onViewAppeal={handleViewAppeal}
              getStatusBadge={getAppealStatusBadge}
            />
          )}

          {activeTab === 'logs' && <AdminLogs logs={logs} loading={logsLoading} />}

          {activeTab === 'analytics' && <AdminAnalytics />}
        </div>
      </main>

      {showUserDetail && selectedReport && (
        <UserDetailModal
          report={selectedReport}
          onClose={() => {
            setShowUserDetail(false);
            setSelectedReport(null);
          }}
        />
      )}

      {showEvidence && selectedReport && (
        <EvidenceModal
          report={selectedReport}
          onClose={() => {
            setShowEvidence(false);
            setSelectedReport(null);
          }}
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

      {showAppealDetail && selectedAppeal && (
        <AppealDetailModal
          appeal={selectedAppeal}
          onClose={() => {
            setShowAppealDetail(false);
            setSelectedAppeal(null);
          }}
          onAction={(status) => handleAppealAction(selectedAppeal, status)}
        />
      )}

      <ConfirmationModal
        isOpen={successModal.isOpen}
        title={successModal.title}
        message={successModal.message}
        confirmLabel="OK"
        onConfirm={() => setSuccessModal({ isOpen: false, title: '', message: '' })}
        onCancel={() => setSuccessModal({ isOpen: false, title: '', message: '' })}
        variant="success"
      />
    </div>
  );
}