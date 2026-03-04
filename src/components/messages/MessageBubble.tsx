// MessageBubble.tsx
import type { Message } from '../../types/messaging';
import { useAuth } from '../../context/AuthContext';

interface MessageBubbleProps {
  message: Message;
  showAvatar: boolean;
  isLastInGroup: boolean; // NEW: Show timestamp only on last message in group
}

export default function MessageBubble({ 
  message, 
  showAvatar = true,
  isLastInGroup = true // Default to true for backwards compatibility
}: MessageBubbleProps) {
  const { user } = useAuth();
  const isOwnMessage = message.senderId === user?.uid;
  const isRead = message.readBy.length > 1;

  const formatTime = (timestamp: { toDate: () => Date } | Date | undefined) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
    <div className={`flex items-end gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar - Only show if showAvatar is true */}
      {showAvatar && !isOwnMessage ? (
        <div className={`w-8 h-8 rounded-full ${getAvatarColor(message.senderName)} flex items-center justify-center flex-shrink-0 mb-5 shadow-sm`}>
          {message.senderName ? (
            <span className="text-white text-sm font-bold">
              {message.senderName.charAt(0).toUpperCase()}
            </span>
          ) : (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          )}
        </div>
      ) : (
        // Spacer for alignment when avatar is hidden
        <div className="w-8 flex-shrink-0" />
      )}
      
      {/* Message Content */}
      <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl shadow-sm ${
            isOwnMessage
              ? 'bg-primary text-white rounded-br-none'
              : 'bg-gray-100 text-gray-900 rounded-bl-none'
          } ${!showAvatar && isOwnMessage ? 'rounded-tr-2xl' : ''} ${!showAvatar && !isOwnMessage ? 'rounded-tl-2xl' : ''}`}
        >
          <p className="text-sm font-primary leading-relaxed">{message.text}</p>
        </div>
        
        {/* Timestamp and Read Receipt - Only show if last in group */}
        {isLastInGroup && (
          <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-gray-400">
              {formatTime(message.createdAt)}
            </span>
            
            {isOwnMessage && (
              <span className="text-xs" title={isRead ? 'Read' : 'Delivered'}>
                {isRead ? (
                  <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}