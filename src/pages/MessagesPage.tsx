// MessagesPage.tsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import MessageColumn from '../components/messages/MessageColumn';
import MessagesLayout from '../components/messages/MessagesLayout';
import { getOrCreateConversationWithUser } from '../services/messageService';

export default function MessagesPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isMobileSidebarVisible, setIsMobileSidebarVisible] = useState(true);
  const { user, userProfile } = useAuth();

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsMobileSidebarVisible(false);
  };

  const handleBackToSidebar = () => {
    setIsMobileSidebarVisible(true);
    setSelectedConversationId(null);
  };

  const handleStartNewConversation = async (
    otherUserId: string, 
    otherUserProfile: { name: string; role: 'consumer' | 'farmer' }
  ) => {
    if (!user || !userProfile) return;

    try {
      const conversationId = await getOrCreateConversationWithUser(
        user.uid,
        {
          firstName: userProfile.firstName || '',
          lastName: userProfile.lastName || '',
          role: userProfile.role as 'consumer' | 'farmer',
        },
        otherUserId,
        {
          firstName: otherUserProfile.name.split(' ')[0] || '',
          lastName: otherUserProfile.name.split(' ').slice(1).join(' ') || '',
          role: otherUserProfile.role,
        }
      );
      
      handleSelectConversation(conversationId);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  return (
    // Full height container, no scrolling at this level
    <div className="flex h-full w-full overflow-hidden bg-white">
      {/* Sidebar - Independent scroll */}
      <div 
        className={`
          ${isMobileSidebarVisible ? 'flex' : 'hidden'} 
          md:flex flex-col w-full md:w-80 h-full border-r border-gray-200 flex-shrink-0
        `}
      >
        <MessageColumn
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          onStartNewConversation={handleStartNewConversation}
        />
      </div>

      {/* Chat Area - Independent scroll */}
      <div 
        className={`
          ${!isMobileSidebarVisible ? 'flex' : 'hidden'} 
          md:flex flex-1 h-full min-w-0
        `}
      >
        <MessagesLayout 
          conversationId={selectedConversationId}
          onBack={handleBackToSidebar}
        />
      </div>
    </div>
  );
}