// useMessaging.ts - FIXED
import { useState, useEffect, useCallback } from 'react';
import type { Conversation, Message } from '../types/messaging';
import {
  subscribeToConversations,
  subscribeToMessages,
  sendMessage as sendMessageService,
  markConversationAsRead,
  getMessages,
} from '../services/messageService';

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToConversations(
      userId,
      (data) => {
        setConversations(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { conversations, loading };
}

// FIXED: Accept string | null
export function useMessages(conversationId: string | null | undefined, userId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Load initial messages
    getMessages(conversationId).then((initialMessages) => {
      setMessages(initialMessages);
      setHasMore(initialMessages.length === 50);
      setLoading(false);
    });

    // Subscribe to real-time updates
    const unsubscribe = subscribeToMessages(conversationId, (updatedMessages) => {
      setMessages(updatedMessages);
    });

    return () => unsubscribe();
  }, [conversationId]);

  // Mark as read when conversation changes
  useEffect(() => {
    if (conversationId && userId) {
      markConversationAsRead(conversationId, userId);
    }
  }, [conversationId, userId]);

  const sendMessage = useCallback(async (text: string, senderName: string) => {
    if (!conversationId || !userId || !text.trim()) return;
    
    setSending(true);
    try {
      await sendMessageService(conversationId, userId, senderName, text.trim());
    } finally {
      setSending(false);
    }
  }, [conversationId, userId]);

  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || messages.length === 0) return;
    
    const oldestMessage = messages[0];
    const olderMessages = await getMessages(conversationId, oldestMessage.createdAt, 50);
    
    if (olderMessages.length > 0) {
      setMessages((prev) => [...olderMessages, ...prev]);
      setHasMore(olderMessages.length === 50);
    } else {
      setHasMore(false);
    }
  }, [conversationId, messages]);

  return {
    messages,
    loading,
    sending,
    hasMore,
    sendMessage,
    loadMoreMessages,
  };
}