import { useState } from 'react';
import type { Appeal } from './adminTypes';
import { updateAppealStatus } from '../../services/appealService';

interface AppealDetailModalProps {
  appeal: Appeal;
  onClose: () => void;
  onAction: (status: 'Approved' | 'Rejected') => void;
}

export default function AppealDetailModal({ appeal, onClose, onAction }: AppealDetailModalProps) {
  const [adminNotes, setAdminNotes] = useState(appeal.adminNotes || '');
  const [loading, setLoading] = useState(false);

  const handleAction = async (status: 'Approved' | 'Rejected') => {
    if (loading) return;
    setLoading(true);
    try {
      await updateAppealStatus(appeal.firestoreId, status, adminNotes.trim());
      onAction(status);
      onClose();
    } catch (error) {
      console.error('Failed to update appeal:', error);
      alert('Failed to process appeal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Appeal Details</h2>
            <p className="text-sm text-gray-500">{appeal.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* User Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">User</p>
              <p className="text-sm font-semibold text-gray-900">{appeal.userName}</p>
              <p className="text-xs text-gray-500">{appeal.userEmail}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Suspension Type</p>
              <p className="text-sm font-semibold text-gray-900">{appeal.suspensionType}</p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Appeal Reason</p>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {appeal.reason}
            </div>
          </div>

          {/* Media */}
          {appeal.mediaUrls && appeal.mediaUrls.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Evidence</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {appeal.mediaUrls.map((media, i) => (
                  <a
                    key={i}
                    href={media.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center hover:opacity-80 transition-opacity"
                  >
                    {media.type === 'video' ? (
                      <div className="flex flex-col items-center gap-1">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-[10px] text-gray-400">Video</span>
                      </div>
                    ) : (
                      <img src={media.url} alt="" className="w-full h-full object-cover" />
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Admin Notes */}
          <div>
            <label className="block text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">
              Admin Notes
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes about this appeal decision..."
              className="w-full min-h-[80px] p-3 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Close
          </button>
          {appeal.status === 'Pending' || appeal.status === 'Under Review' ? (
            <>
              <button
                onClick={() => handleAction('Rejected')}
                disabled={loading}
                className="px-5 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => handleAction('Approved')}
                disabled={loading}
                className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Processing...' : 'Approve'}
              </button>
            </>
          ) : (
            <div
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                appeal.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {appeal.status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}