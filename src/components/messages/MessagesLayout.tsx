// MessagesLayout.tsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMessages } from '../../hooks/useMessaging';
import MessageProfile from './MessageProfile';
import MessageBubble from './MessageBubble';
import addbutton from '../../assets/icons/add.svg';
import type { Farmer } from '../../types';

interface MessagesLayoutProps {
  conversationId: string | null;
  onBack?: () => void;
}

// Helper: Check if two messages are within 5 minutes
const isWithinTimeWindow = (msg1: any, msg2: any, minutes: number = 5) => {
  if (!msg1?.createdAt || !msg2?.createdAt) return false;
  const time1 = msg1.createdAt instanceof Date ? msg1.createdAt : msg1.createdAt.toDate();
  const time2 = msg2.createdAt instanceof Date ? msg2.createdAt : msg2.createdAt.toDate();
  const diffMs = Math.abs(time2.getTime() - time1.getTime());
  return diffMs <= minutes * 60 * 1000;
};

export default function MessagesLayout({ conversationId, onBack }: MessagesLayoutProps) {
  const { user, userProfile } = useAuth();
  const { messages, loading, sending, sendMessage } = useMessages(conversationId, user?.uid);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Group messages for display
  const messageGroups = useMemo(() => {
    const groups: Array<{
      message: any;
      showAvatar: boolean;
      isLastInGroup: boolean;
    }> = [];

    messages.forEach((message, index) => {
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
      
      // Show avatar if:
      // - First message
      // - Different sender from previous
      // - Previous message is more than 5 minutes old
      const showAvatar = !prevMessage || 
        prevMessage.senderId !== message.senderId ||
        !isWithinTimeWindow(prevMessage, message, 5);

      // Is last in group if:
      // - Last message overall
      // - Next message is different sender
      // - Next message is more than 5 minutes later
      const isLastInGroup = !nextMessage || 
        nextMessage.senderId !== message.senderId ||
        !isWithinTimeWindow(message, nextMessage, 5);

      groups.push({
        message,
        showAvatar,
        isLastInGroup,
      });
    });

    return groups;
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userProfile) return;

    const senderName = userProfile.role === 'farmer' 
      ? (userProfile.farmName || `${userProfile.firstName} ${userProfile.lastName}`)
      : `${userProfile.firstName} ${userProfile.lastName}`;

    await sendMessage(newMessage, senderName);
    setNewMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const otherParticipant: Farmer | null = useMemo(() => {
    if (!conversationId || !messages.length) return null;
    const firstMessage = messages.find(m => m.senderId !== user?.uid);
    if (firstMessage) {
      const nameParts = firstMessage.senderName.split(' ');
      return {
        uid: firstMessage.senderId,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        phoneNo: '',
        email: null,
        profileImage: '',
        createdAt: new Date(),
      };
    }
    return null;
  }, [messages, user?.uid, conversationId]);

  // Empty state - no conversation selected
  if (!conversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 h-full">
        <div className="text-center p-8">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-primary font-semibold text-gray-700 mb-2">Select a conversation</h3>
          <p className="text-gray-500">Choose a conversation from the sidebar or search for users to start messaging</p>
        </div>
      </div>
    );
  }

  const loadingParticipant: Farmer = {
    uid: 'loading',
    firstName: 'Loading...',
    lastName: '',
    phoneNo: '',
    email: null,
    createdAt: new Date(),
  };

  return (
    // Main container - flex column, full height
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      
      {/* Header - fixed height */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0 z-20">
        {onBack && (
          <button 
            onClick={onBack}
            className="md:hidden w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <MessageProfile 
          farmer={otherParticipant || loadingParticipant} 
        />
      </div>

      {/* Messages - flex-1 to fill space, scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-white z-10">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-400 text-sm">No messages yet</p>
            <p className="text-gray-300 text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          <>
            {messageGroups.map(({ message, showAvatar, isLastInGroup }) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                showAvatar={showAvatar}
                isLastInGroup={isLastInGroup}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input - fixed height */}
      <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0 z-20">
        <form 
          onSubmit={handleSend}
          className="flex items-center gap-3"
        >
          <button 
            type="button"
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border-none cursor-pointer text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0"
            title="Add attachment (coming soon)"
          >
            <img src={addbutton} alt="Add" className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 text-sm font-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            disabled={sending}
          />
          
          <button 
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer flex-shrink-0 transition-colors ${
              newMessage.trim() && !sending
                ? 'bg-primary hover:bg-primary-dark text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}