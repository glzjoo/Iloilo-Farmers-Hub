// MessageBubble.tsx - Full updated version
import type { Message } from '../../types/messaging';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import OfferPriceBubble from './OfferPriceBubble';

interface MessageBubbleProps {
  message: Message & { senderAvatar?: string };
  showAvatar: boolean;
  isLastInGroup: boolean;
  onRespondToOffer?: (messageId: string, response: 'accepted' | 'rejected') => Promise<void>;
}

export default function MessageBubble({
  message,
  showAvatar = true,
  isLastInGroup = true,
  onRespondToOffer
}: MessageBubbleProps) {
  const { user } = useAuth();
  const isOwnMessage = message.senderId === user?.uid;
  const isRead = message.readBy.length > 1;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const formatTime = (timestamp: { toDate: () => Date } | Date | undefined) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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

  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="relative">
            {!imageLoaded && (
              <div className="w-64 h-48 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <img
              src={message.imageUrl}
              alt="Shared image"
              className={`max-w-64 max-h-80 rounded-lg object-cover cursor-pointer transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
              onLoad={() => setImageLoaded(true)}
              onClick={() => window.open(message.imageUrl, '_blank')}
            />
            {message.text && (
              <p className="text-sm mt-2">{message.text}</p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="relative w-64">
            {!videoLoaded && (
              <div className="w-64 h-48 bg-gray-900 rounded-lg flex items-center justify-center">
                <svg className="w-12 h-12 text-white opacity-50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
            <video
              src={message.videoUrl}
              controls
              className={`max-w-64 max-h-80 rounded-lg ${videoLoaded ? 'block' : 'hidden'}`}
              onLoadedData={() => setVideoLoaded(true)}
              preload="metadata"
            />
            {message.text && (
              <p className="text-sm mt-2">{message.text}</p>
            )}
          </div>
        );

      default:
        return <p className="text-sm font-primary leading-relaxed">{message.text}</p>;
    }
  };

  //  Offer messages now use OfferPriceBubble which has matching alignment
  if (message.type === 'offer') {
    return (
      <div className="mb-1">
        <OfferPriceBubble
          offerPrice={message.offerPrice || 0}
          isSender={isOwnMessage}
          offerStatus={message.offerStatus} 
          messageId={message.id} 
          onRespondToOffer={onRespondToOffer}
        />
        {/* Timestamp row for offer messages */}
        {isLastInGroup && (
          <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'} pl-10 pr-10`}>
            <span className="text-xs text-gray-400">
              {formatTime(message.createdAt)}
            </span>
            {isOwnMessage && (
              <span className="text-xs" title={isRead ? 'Read' : 'Delivered'}>
                {isRead ? (
                  <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                )}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {showAvatar && !isOwnMessage ? (
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-5 shadow-sm overflow-hidden">
          {message.senderAvatar ? (
            <img
              src={message.senderAvatar}
              alt={message.senderName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full ${getAvatarColor(message.senderName)} flex items-center justify-center`}>
              <span className="text-white text-sm font-bold">
                {message.senderName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      {/* Message Content */}
      <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl shadow-sm ${isOwnMessage
            ? 'bg-primary text-white rounded-br-none'
            : 'bg-gray-100 text-gray-900 rounded-bl-none'
            } ${!showAvatar && isOwnMessage ? 'rounded-tr-2xl' : ''} ${!showAvatar && !isOwnMessage ? 'rounded-tl-2xl' : ''} ${message.type !== 'text' ? 'p-2' : ''
            }`}
        >
          {renderContent()}
        </div>

        {/* Timestamp and Read Receipt */}
        {isLastInGroup && (
          <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-gray-400">
              {formatTime(message.createdAt)}
            </span>

            {isOwnMessage && (
              <span className="text-xs" title={isRead ? 'Read' : 'Delivered'}>
                {isRead ? (
                  <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
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