interface MessageProfileProps {
  farmer: {
    firstName: string;
    lastName: string;
    profileImage?: string;
    farmName?: string;
    phoneNo?: string;
    email?: string | null;
    createdAt?: Date;
  };
  isOnline?: boolean;
}

export default function MessageProfile({ farmer, isOnline = false }: MessageProfileProps) {
  const displayName = farmer.farmName || `${farmer.firstName} ${farmer.lastName}`;
  const initial = displayName.charAt(0).toUpperCase();

  // Generate consistent background color from name
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

  return (
    <section className="flex items-center gap-3 flex-1">
      <div className="relative">
        {farmer.profileImage ? (
          <img 
            src={farmer.profileImage} 
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
          />
        ) : (
          <div className={`w-10 h-10 rounded-full ${getAvatarColor(displayName)} flex items-center justify-center flex-shrink-0 shadow-sm border-2 border-white`}>
            <span className="text-white font-bold text-lg">{initial}</span>
          </div>
        )}
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-primary font-semibold text-black truncate">
          {displayName}
        </h2>
        <p className="text-xs text-gray-500">
          {isOnline ? 'Online' : 'Tap to view profile'}
        </p>
      </div>
    </section>
  );
}