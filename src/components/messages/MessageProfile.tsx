interface MessageProfileProps {
  user: {
    uid: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    avatar?: string;
    role?: 'consumer' | 'farmer';
    farmName?: string;
    isOnline?: boolean;
  };
  loading?: boolean;
}

export default function MessageProfile({ user, loading = false }: MessageProfileProps) {
  const displayName = user?.displayName || user?.farmName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown';
  const initial = displayName.charAt(0).toUpperCase();

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <section className="flex items-center gap-3 flex-1 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-gray-300" />
        <div className="flex-1">
          <div className="h-4 bg-gray-300 rounded w-32 mb-1" />
          <div className="h-3 bg-gray-300 rounded w-20" />
        </div>
      </section>
    );
  }

  return (
    <section className="flex items-center gap-3 flex-1">
      <div className="relative">
        {user?.avatar ? (
          <img 
            src={user.avatar} 
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
          />
        ) : (
          <div className={`w-10 h-10 rounded-full ${getAvatarColor(displayName)} flex items-center justify-center flex-shrink-0 shadow-sm border-2 border-white`}>
            <span className="text-white font-bold text-lg">{initial}</span>
          </div>
        )}
        {user?.isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-primary font-semibold text-black truncate">
          {displayName}
        </h2>
        <p className="text-xs text-gray-500 capitalize">
          {user?.isOnline ? 'Online' : user?.role || 'User'}
        </p>
      </div>
    </section>
  );
}