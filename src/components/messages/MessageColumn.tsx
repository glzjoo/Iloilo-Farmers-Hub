import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useConversations } from '../../hooks/useMessaging';
import { searchUsers, getUserProfile } from '../../services/messageService';
import type { Conversation } from '../../types/messaging';
import searchIcon from '../../assets/icons/search.svg';

interface MessageColumnProps {
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onStartNewConversation?: (userId: string, userProfile: { name: string; role: 'consumer' | 'farmer' }) => void;
}

export default function MessageColumn({ 
  selectedConversationId, 
  onSelectConversation,
  onStartNewConversation 
}: MessageColumnProps) {
  const { user } = useAuth();
  const { conversations, loading } = useConversations(user?.uid);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    uid: string;
    name: string;
    role: 'consumer' | 'farmer';
    avatar?: string;
  }> | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  // Store user avatars with uid as key
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});

  // Fetch avatars for all conversation participants
  useEffect(() => {
    const fetchAvatars = async () => {
      const newAvatars: Record<string, string> = {};
      
      for (const conversation of conversations) {
        const otherId = conversation.participants.find(id => id !== user?.uid);
        if (otherId && !userAvatars[otherId]) {
          try {
            const profile = await getUserProfile(otherId);
            if (profile?.avatar) {
              newAvatars[otherId] = profile.avatar;
            }
          } catch (error) {
            console.error('Failed to fetch avatar for', otherId, error);
          }
        }
      }
      
      // Only update state if we found new avatars
      if (Object.keys(newAvatars).length > 0) {
        setUserAvatars(prev => ({ ...prev, ...newAvatars }));
      }
    };
    
    if (conversations.length > 0 && user?.uid) {
      fetchAvatars();
    }
  }, [conversations, user?.uid]);

  // Debounced search
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsers(searchTerm, user?.uid || '');
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, user?.uid]);

  const handleSearchResultClick = (result: { uid: string; name: string; role: 'consumer' | 'farmer' }) => {
    if (onStartNewConversation) {
      onStartNewConversation(result.uid, { name: result.name, role: result.role });
    }
    setSearchTerm('');
    setSearchResults(null);
  };

  const formatTimestamp = (timestamp: { toDate: () => Date } | Date | undefined) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    if (!user) return null;
    const otherId = conversation.participants.find(id => id !== user.uid);
    if (!otherId) return null;
    return {
      ...conversation.participantInfo[otherId],
      uid: otherId,
    };
  };

  // Helper to get avatar for a user
  const getAvatarForUser = (userId: string, name: string) => {
    const avatar = userAvatars[userId];
    const initial = name?.charAt(0).toUpperCase() || '?';
    
    if (avatar) {
      return (
        <img 
          src={avatar} 
          alt={name}
          className="w-full h-full object-cover"
        />
      );
    }
    
    return (
      <span className="text-white font-bold text-lg">
        {initial}
      </span>
    );
  };

  return (
    // Main container - flex column, fixed width, full height, no shrink
    <div className="flex flex-col w-full h-full bg-white">
      
      {/* Header section - fixed at top, no shrink */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <button 
            onClick={() => window.history.back()} 
            className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center border-none cursor-pointer hover:bg-primary-dark transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-primary font-bold text-black">Messages</h2>
        </div>

        {/* Search container - relative for dropdown positioning */}
        <div className="relative">
          <div className="flex items-center border border-gray-300 rounded-full px-3 py-2 bg-gray-50 focus-within:bg-white focus-within:border-primary transition-colors">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-none outline-none bg-transparent text-sm w-full text-gray-700 font-primary"
            />
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <img src={searchIcon} className="w-4 h-4 opacity-50" alt="Search" />
            )}
          </div>
          
          {/* Search Results Dropdown - absolute positioned */}
          {searchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.uid}
                  onClick={() => handleSearchResultClick(result)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {result.avatar ? (
                      <img 
                        src={result.avatar} 
                        alt={result.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs font-bold">
                        {result.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{result.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{result.role}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {searchResults && searchResults.length === 0 && searchTerm.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 p-4 text-center text-gray-500 text-sm">
              No users found
            </div>
          )}
        </div>
      </div>

      {/* Conversation list - scrollable, takes remaining space */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500 font-primary text-sm">No conversations yet</p>
            <p className="text-gray-400 text-xs mt-1">Search for users to start messaging</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {conversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation);
              const isSelected = selectedConversationId === conversation.id;
              const unreadCount = conversation.unreadCount?.[user?.uid || ''] || 0;
              const lastMessage = conversation.lastMessage;
              const otherId = conversation.participants.find(id => id !== user?.uid) || '';

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`flex items-center gap-3 px-4 py-4 border-b border-gray-100 text-left w-full transition-colors ${
                    isSelected ? 'bg-blue-50 border-l-4 border-l-primary' : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
                    !userAvatars[otherId] ? 'bg-primary' : ''
                  }`}>
                    {getAvatarForUser(otherId, otherParticipant?.name || '')}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-primary font-semibold text-sm truncate ${
                        unreadCount > 0 ? 'text-black' : 'text-gray-700'
                      }`}>
                        {otherParticipant?.name || 'Unknown'}
                      </h3>
                      {lastMessage && (
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {formatTimestamp(lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${
                        unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-500'
                      }`}>
                        {lastMessage ? (
                          <>
                            {lastMessage.senderId === user?.uid && (
                              <span className="text-gray-400 mr-1">You: </span>
                            )}
                            {lastMessage.text}
                          </>
                        ) : (
                          <span className="text-gray-400 italic">No messages yet</span>
                        )}
                      </p>
                      
                      {unreadCount > 0 && (
                        <span className="ml-2 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}