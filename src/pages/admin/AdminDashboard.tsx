// src/pages/admin/AdminDashboard.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Report } from '../../components/admin/adminTypes';
import { getStatusBadge } from '../../components/admin/adminTypes';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminOverview from '../../components/admin/AdminOverview';
import AdminReports from '../../components/admin/reports';
import AdminLogs, { type AdminAction } from '../../components/admin/AdminLogs';
import AdminAppeals from '../../components/admin/AdminAppeals';
import AdminAnalytics from '../../components/admin/AdminAnalytics';
import UserDetailModal from '../../components/admin/userDetailModal';
import ConversationModal from '../../components/admin/ConversationModal';
import SuspendModal from '../../components/admin/SuspendModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { updateReportStatus, suspendUser, unsuspendUser } from '../../services/reportService';

type TabId = 'overview' | 'reports' | 'appeals' | 'logs' | 'analytics';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const [suspendModal, setSuspendModal] = useState<{
    report: Report;
    type: 'warning' | '1 week suspension' | '30 days suspension' | 'permanent';
  } | null>(null);
  
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });
  
  const [latestLog, setLatestLog] = useState<AdminAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!sessionStorage.getItem('isAdmin')) {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Real-time Firestore subscription
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

  const addLog = useCallback((action: AdminAction['action'], targetUser: string, details?: string) => {
    const newLog: AdminAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      targetUser,
      details,
      adminName: 'Admin',
    };
    setLatestLog(newLog);
  }, []);

  const showSuccess = useCallback((title: string, message: string) => {
    setSuccessModal({ isOpen: true, title, message });
  }, []);

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
      if (suspendModal.report.reportedUserId) {
        await suspendUser(suspendModal.report.reportedUserId, suspendModal.type);
      }

      addLog(
        suspendModal.type === 'warning' ? 'warned' : 'suspended',
        suspendModal.report.reportedUser,
        suspendModal.type === 'warning' ? undefined : suspendModal.type
      );

      const actionLabel = suspendModal.type === 'warning' ? 'warned' : 
        suspendModal.type === 'permanent' ? 'banned' : `suspended (${suspendModal.type})`;
      
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

      addLog('reactivated', report?.reportedUser || 'Unknown');
      showSuccess('User Reactivated', `${report?.reportedUser || 'User'} has been reactivated.`);
    } catch (error) {
      console.error('Failed to reactivate user:', error);
      showSuccess('Action Failed', 'Failed to reactivate user. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewUser = (report: Report) => {
    setSelectedReport(report);
    setShowUserDetail(true);
    addLog('viewed', report.reportedUser, 'user details');
  };

  const handleViewConversation = (report: Report) => {
    setSelectedReport(report);
    setShowConversation(true);
    addLog('viewed', report.reportedUser, 'conversation');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('adminActivityLogs');
    navigate('/admin/login');
  };

  const handleOverviewViewReport = (report: Report) => {
    setSelectedReport(report);
    setActiveTab('reports');
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
          {activeTab === 'overview' && (
            <AdminOverview reports={reports} onViewReport={handleOverviewViewReport} />
          )}
          
          {activeTab === 'reports' && (
            <AdminReports
              reports={reports}
              onSuspend={handleSuspend}
              onWarning={handleWarning}
              onReactivate={handleReactivate}
              onViewUser={handleViewUser}
              onViewConversation={handleViewConversation}
              getStatusBadge={getStatusBadge}
            />
          )}
          
          {activeTab === 'appeals' && <AdminAppeals />}
          {activeTab === 'logs' && <AdminLogs newAction={latestLog} />}
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
      
      {showConversation && selectedReport && (
        <ConversationModal
          report={selectedReport}
          onClose={() => {
            setShowConversation(false);
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