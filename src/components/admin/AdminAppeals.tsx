import { useState, type JSX } from 'react';
import type { Appeal } from './adminTypes';

interface AdminAppealsProps {
  appeals?: Appeal[];
  loading?: boolean;
  onViewAppeal: (appeal: Appeal) => void;
  getStatusBadge: (status: Appeal['status']) => JSX.Element;
}

export default function AdminAppeals({
  appeals = [],
  loading,
  onViewAppeal,
  getStatusBadge,
}: AdminAppealsProps) {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const safeAppeals = Array.isArray(appeals) ? appeals : [];

  const filteredAppeals = safeAppeals.filter((a) => {
    const matchesStatus = filterStatus === 'All' || a.status === filterStatus;
    const matchesSearch =
      searchQuery === '' ||
      (a.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.id || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    All: safeAppeals.length,
    Pending: safeAppeals.filter((a) => a.status === 'Pending').length,
    'Under Review': safeAppeals.filter((a) => a.status === 'Under Review').length,
    Approved: safeAppeals.filter((a) => a.status === 'Approved').length,
    Rejected: safeAppeals.filter((a) => a.status === 'Rejected').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <svg className="w-8 h-8 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Appeals</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Review and manage user suspension appeals</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border text-left cursor-pointer transition-all ${
              filterStatus === status
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-white text-gray-700 border-gray-200 hover:border-primary/30 hover:shadow-sm'
            }`}
          >
            <p className={`text-lg sm:text-2xl font-bold ${filterStatus === status ? 'text-white' : 'text-gray-900'}`}>
              {count}
            </p>
            <p className={`text-[10px] sm:text-xs font-medium mt-0.5 truncate ${filterStatus === status ? 'text-green-100' : 'text-gray-500'}`}>
              {status}
            </p>
          </button>
        ))}
      </div>

      {/* Search + Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
        <div className="px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3 border-b border-gray-100">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by user, email, appeal ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-none outline-none text-sm text-gray-700 bg-transparent placeholder:text-gray-400"
          />
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Appeal ID</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Suspension</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Reason</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Media</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppeals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    No appeals found.
                  </td>
                </tr>
              ) : (
                filteredAppeals.map((appeal, idx) => (
                  <tr
                    key={`${appeal.firestoreId || appeal.id || idx}`}
                    className={`border-b border-gray-100 hover:bg-green-50/30 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-gray-700">{appeal.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{appeal.userName}</p>
                      <p className="text-xs text-gray-500">{appeal.userEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                          appeal.suspensionType === 'permanent'
                            ? 'bg-red-100 text-red-700'
                            : appeal.suspensionType === '30 days suspension'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {appeal.suspensionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={appeal.reason}>
                      {appeal.reason}
                    </td>
                    <td className="px-4 py-3">
                      {appeal.mediaUrls && appeal.mediaUrls.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          {appeal.mediaUrls.map((media, i) => (
                            <a
                              key={`${appeal.firestoreId}-media-${i}`}
                              href={media.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0"
                              title={media.type === 'video' ? 'View video' : 'View image'}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {media.type === 'video' ? (
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <img src={media.url} alt="" className="w-full h-full object-cover" />
                              )}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(appeal.status)}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{appeal.createdAt}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onViewAppeal(appeal)}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-md border-none cursor-pointer hover:bg-primary/90 transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {filteredAppeals.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-400">No appeals found.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredAppeals.map((appeal, idx) => (
                <div key={`${appeal.firestoreId || appeal.id || idx}-mobile`} className="p-4 hover:bg-green-50/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-mono font-semibold text-xs text-gray-500">{appeal.id}</span>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">{appeal.userName}</p>
                      <p className="text-xs text-gray-500">{appeal.userEmail}</p>
                    </div>
                    <div className="flex-shrink-0 ml-2">{getStatusBadge(appeal.status)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
                    <div>
                      <span className="text-gray-400">Suspension</span>
                      <p className="font-semibold text-gray-800 mt-0.5">{appeal.suspensionType}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Date</span>
                      <p className="text-gray-700 mt-0.5">{appeal.createdAt}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">Reason</span>
                      <p className="text-gray-600 mt-0.5 line-clamp-3">{appeal.reason}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">Media</span>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {appeal.mediaUrls && appeal.mediaUrls.length > 0 ? (
                          appeal.mediaUrls.map((media, i) => (
                            <a
                              key={`${appeal.firestoreId}-mmedia-${i}`}
                              href={media.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {media.type === 'video' ? (
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <img src={media.url} alt="" className="w-full h-full object-cover" />
                              )}
                            </a>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onViewAppeal(appeal)}
                    className="w-full py-2 bg-primary text-white text-xs font-semibold rounded-md border-none cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    Review Appeal
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}