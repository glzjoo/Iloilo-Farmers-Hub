import { useState, useEffect, useCallback } from 'react';
import type { Conversation, Message } from '../types/messaging';
import {
  subscribeToConversations,
  subscribeToMessages,
  sendMessage as sendMessageService,
  sendOfferMessage as sendOfferMessageService,
  markConversationAsRead,
  getMessages,
  respondToOffer as respondToOfferService,
  sendOrderRequest as sendOrderRequestService,
  respondToOrder as respondToOrderService,
  confirmOrderReceived as confirmOrderReceivedService,
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

export function useMessages(conversationId: string | null | undefined, userId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    getMessages(conversationId).then((initialMessages) => {
      setMessages(initialMessages);
      setHasMore(initialMessages.length === 50);
      setLoading(false);
    });

    const unsubscribe = subscribeToMessages(conversationId, (updatedMessages) => {
      console.log('Messages updated in hook:', updatedMessages.length, 'messages');
      setMessages(updatedMessages);
    });

    return () => unsubscribe();
  }, [conversationId]);

  useEffect(() => {
    if (conversationId && userId) {
      markConversationAsRead(conversationId, userId);
    }
  }, [conversationId, userId]);

  const sendMessage = useCallback(async (
    text: string,
    senderName: string,
    senderAvatar: string
  ) => {
    if (!conversationId || !userId || !text.trim()) {
      console.log('Send blocked:', { conversationId, userId, text });
      return;
    }

    setSending(true);
    try {
      console.log('Calling service with:', { conversationId, userId, senderName, senderAvatar, text });
      await sendMessageService(conversationId, userId, senderName, senderAvatar, text.trim());
    } catch (error) {
      console.error('Send error:', error);
      throw error;
    } finally {
      setSending(false);
    }
  }, [conversationId, userId]);

  const sendOfferMessage = useCallback(async (
    senderName: string,
    senderAvatar: string,
    offerPrice: number
  ) => {
    if (!conversationId || !userId || !offerPrice || offerPrice <= 0) {
      console.log('Send offer blocked:', { conversationId, userId, offerPrice });
      return;
    }

    setSending(true);
    try {
      console.log('Calling sendOfferMessage with:', { conversationId, userId, senderName, offerPrice });
      await sendOfferMessageService(conversationId, userId, senderName, senderAvatar, offerPrice);
    } catch (error) {
      console.error('Send offer error:', error);
      throw error;
    } finally {
      setSending(false);
    }
  }, [conversationId, userId]);

  const respondToOffer = useCallback(async (
    messageId: string,
    response: 'accepted' | 'rejected'
  ) => {
    if (!conversationId || !userId) {
      console.log('Respond to offer blocked:', { conversationId, userId });
      return;
    }

    try {
      console.log('Calling respondToOffer with:', { conversationId, messageId, userId, response });
      await respondToOfferService(conversationId, messageId, userId, response);
      console.log('Respond to offer SUCCESS');
    } catch (error: any) {
      console.error('Respond to offer FULL ERROR:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.customData);
      throw error;
    }
  }, [conversationId, userId]);

  // NEW: sendOrderRequest wrapper
  const sendOrderRequest = useCallback(async (
    senderName: string,
    senderAvatar: string,
    orderDetails: {
      productId: string;
      productName: string;
      productImage: string;
      pricePerUnit: number;
      quantity: number;
      totalPrice: number;
      unit: string;
    }
  ) => {
    if (!conversationId || !userId) {
      console.log('Send order request blocked:', { conversationId, userId });
      return;
    }

    setSending(true);
    try {
      console.log('Calling sendOrderRequest with:', { conversationId, userId, orderDetails });
      const result = await sendOrderRequestService(conversationId, userId, senderName, senderAvatar, orderDetails);
      console.log('Send order request SUCCESS, message ID:', result);
    } catch (error) {
      console.error('Send order request error:', error);
      throw error;
    } finally {
      setSending(false);
    }
  }, [conversationId, userId]);

  // NEW: respondToOrder wrapper
  const respondToOrder = useCallback(async (
    messageId: string,
    response: 'accepted' | 'rejected',
    orderDetails: any
  ) => {
    if (!conversationId || !userId) {
      console.log('Respond to order blocked:', { conversationId, userId });
      return;
    }

    try {
      console.log('Calling respondToOrder with:', { conversationId, messageId, userId, response });
      await respondToOrderService(conversationId, messageId, userId, response, orderDetails);
      console.log('Respond to order SUCCESS');
    } catch (error: any) {
      console.error('Respond to order FULL ERROR:', error);
      throw error;
    }
  }, [conversationId, userId]);

  // NEW: confirmOrderReceived wrapper
  const confirmOrderReceived = useCallback(async (
    senderName: string,
    senderAvatar: string
  ) => {
    if (!conversationId || !userId) {
      console.log('Confirm order received blocked:', { conversationId, userId });
      return;
    }

    try {
      console.log('Calling confirmOrderReceived with:', { conversationId, userId });
      await confirmOrderReceivedService(conversationId, userId, senderName, senderAvatar);
      console.log('Confirm order received SUCCESS');
    } catch (error: any) {
      console.error('Confirm order received FULL ERROR:', error);
      throw error;
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
    sendOfferMessage,
    respondToOffer,
    sendOrderRequest,
    respondToOrder,
    confirmOrderReceived,
    loadMoreMessages,
  };
}