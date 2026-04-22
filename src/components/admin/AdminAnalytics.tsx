// src/components/admin/AdminAnalytics.tsx
export default function AdminAnalytics() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Analytics</h3>
      <p className="text-gray-500 text-sm max-w-md mx-auto">
        Detailed analytics and visualizations are coming soon.
        This will include report trends, resolution metrics, and user behavior insights.
      </p>
    </div>
  );
}