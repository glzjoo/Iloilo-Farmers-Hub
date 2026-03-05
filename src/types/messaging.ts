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
  offerPrice?: number;
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