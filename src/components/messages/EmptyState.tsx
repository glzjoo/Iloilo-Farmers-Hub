export default function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
        <svg 
          className="w-16 h-16 text-primary opacity-50" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
          />
        </svg>
      </div>
      <h3 className="text-2xl font-primary font-bold text-gray-800 mb-2">
        Your Messages
      </h3>
      <p className="text-gray-500 text-center max-w-md mb-6">
        Connect with farmers and consumers directly. Start a conversation by searching for a user or visiting a product page.
      </p>
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Use the search bar to find users</span>
      </div>
    </div>
  );
}