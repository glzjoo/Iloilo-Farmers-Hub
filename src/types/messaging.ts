import type { Timestamp } from 'firebase/firestore';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Timestamp;
  readBy: string[];
  type: 'text' | 'image' | 'video' | 'offer';
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
// Offer-specific fields
  offerPrice?: number;
  offerStatus?: 'pending' | 'accepted' | 'rejected'; 
  offerResponseAt?: Timestamp; //  When farmer responded
  offerResponseBy?: string; // Who responded (farmer UID)
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