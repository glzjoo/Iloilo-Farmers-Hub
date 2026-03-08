import type { Timestamp } from 'firebase/firestore';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Timestamp;
  readBy: string[];
  type: 'text' | 'image' | 'video' | 'offer' | 'order_request' | 'order_response' | 'order_received' | 'review_prompt';
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
// Offer-specific fields
  offerPrice?: number;
  offerStatus?: 'pending' | 'accepted' | 'rejected'; 
  offerResponseAt?: Timestamp; //  When farmer responded
  offerResponseBy?: string; // Who responded (farmer UID)

  // Order-specific fields
  orderDetails?: {
    productId: string;
    productName: string;
    productImage: string;
    pricePerUnit: number;
    quantity: number;
    totalPrice: number;
    unit: string;
  };
  orderStatus?: 'pending' | 'accepted' | 'rejected' | 'completed';
  orderResponseAt?: Timestamp;
  orderResponseBy?: string;
}

export interface ParticipantInfo {
  name: string;
  avatar: string;
  role: 'consumer' | 'farmer';
}

export interface Conversation {
  id: string;
  participants: string[]; // Array of UIDs
  participantRoles: Record<string, 'consumer' | 'farmer'>;
  participantInfo: Record<string, ParticipantInfo>;
  lastMessage: {
    text: string;
    senderId: string;
    createdAt: Timestamp;
    readBy: string[];
  } | null;
  lastMessageAt: Timestamp;
  unreadCount: Record<string, number>;
  createdAt: Timestamp;
  relatedProductId?: string;
  status: 'active' | 'archived';
  pendingOfferId?: string; // Track active pending offer
  pendingOfferPrice?: number; // Quick access to pending offer amount
  activeOrderId?: string | null; // Track pending order
  orderStatus?: 'pending' | 'accepted' | 'completed';
  lastAcceptedOfferPrice?: number; // Store last accepted offer price
}

export interface ConversationPreview {
  id: string;
  otherParticipant: ParticipantInfo & { uid: string };
  lastMessage: {
    text: string;
    senderId: string;
    createdAt: Timestamp;
    readBy: string[];
  } | null;
  unreadCount: number;
  updatedAt: Timestamp;
}