import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Message, Conversation, ParticipantInfo } from '../types/messaging';

const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_SUBCOLLECTION = 'messages';

/**
 * Create or get existing conversation between two users
 * Called when "Contact Seller" is clicked
 */
export async function createConversation(
  currentUserId: string,
  currentUserProfile: { firstName: string; lastName: string; role: 'consumer' | 'farmer' },
  otherUserId: string,
  otherUserProfile: { firstName: string; lastName: string; role: 'consumer' | 'farmer' },
  productId?: string
): Promise<string> {
  // Check if conversation already exists
  const conversationsRef = collection(db, CONVERSATIONS_COLLECTION);
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', currentUserId)
  );
  
  const snapshot = await getDocs(q);
  let existingConversationId: string | null = null;
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.participants.includes(otherUserId)) {
      existingConversationId = doc.id;
    }
  });

  if (existingConversationId) {
    return existingConversationId;
  }

  // Create new conversation
  const participantInfo: Record<string, ParticipantInfo> = {
    [currentUserId]: {
      name: `${currentUserProfile.firstName} ${currentUserProfile.lastName}`,
      avatar: '',
      role: currentUserProfile.role,
    },
    [otherUserId]: {
      name: `${otherUserProfile.firstName} ${otherUserProfile.lastName}`,
      avatar: '',
      role: otherUserProfile.role,
    },
  };

  const participantRoles: Record<string, 'consumer' | 'farmer'> = {
    [currentUserId]: currentUserProfile.role,
    [otherUserId]: otherUserProfile.role,
  };

  const newConversation = {
    participants: [currentUserId, otherUserId],
    participantRoles,
    participantInfo,
    lastMessage: null,
    lastMessageAt: serverTimestamp(),
    unreadCount: { [currentUserId]: 0, [otherUserId]: 0 },
    createdAt: serverTimestamp(),
    status: 'active',
    ...(productId && { relatedProductId: productId }),
  };

  const docRef = await addDoc(collection(db, CONVERSATIONS_COLLECTION), newConversation);
  return docRef.id;
}

/**
 * Send a text message
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<void> {
  const batch = writeBatch(db);
  
  // Add message to subcollection
  const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
  const newMessage = {
    senderId,
    senderName,
    text,
    createdAt: serverTimestamp(),
    readBy: [senderId], // Sender has implicitly read it
    type: 'text',
  };
  
  const messageDocRef = doc(messagesRef);
  batch.set(messageDocRef, newMessage);
  
  // Update conversation lastMessage and increment unread for other participant
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const conversationSnap = await getDoc(conversationRef);
  const conversationData = conversationSnap.data();
  
  const otherParticipantId = conversationData?.participants.find((id: string) => id !== senderId);
  
  batch.update(conversationRef, {
    lastMessage: {
      text,
      senderId,
      createdAt: serverTimestamp(),
      readBy: [senderId],
    },
    lastMessageAt: serverTimestamp(),
    [`unreadCount.${otherParticipantId}`]: increment(1),
  });
  
  await batch.commit();
}

/**
 * Mark messages as read
 */
export async function markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  
  await updateDoc(conversationRef, {
    [`unreadCount.${userId}`]: 0,
  });
  
  // Also mark individual messages as read
  const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
  const q = query(
    messagesRef,
    where('readBy', 'not-in', [[userId]]) // Messages not read by this user
  );
  
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  
  snapshot.forEach((messageDoc) => {
    const messageRef = doc(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION, messageDoc.id);
    batch.update(messageRef, {
      readBy: [...(messageDoc.data().readBy || []), userId],
    });
  });
  
  await batch.commit();
}

/**
 * Get messages for a conversation (with pagination)
 */
export async function getMessages(
  conversationId: string,
  lastMessageTimestamp?: Timestamp,
  messageLimit: number = 50
): Promise<Message[]> {
  const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
  
  let q = query(
    messagesRef,
    orderBy('createdAt', 'desc'),
    limit(messageLimit)
  );
  
  if (lastMessageTimestamp) {
    q = query(q, startAfter(lastMessageTimestamp));
  }
  
  const snapshot = await getDocs(q);
  const messages: Message[] = [];
  
  snapshot.forEach((doc) => {
    messages.push({
      id: doc.id,
      ...doc.data(),
    } as Message);
  });
  
  return messages.reverse(); // Return in chronological order
}

/**
 * Subscribe to real-time messages
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
) {
  const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data(),
      } as Message);
    });
    callback(messages);
  });
}

/**
 * Subscribe to user's conversations
 */
export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
) {
  const conversationsRef = collection(db, CONVERSATIONS_COLLECTION);
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const conversations: Conversation[] = [];
    snapshot.forEach((doc) => {
      conversations.push({
        id: doc.id,
        ...doc.data(),
      } as Conversation);
    });
    callback(conversations);
  });
}

/**
 * Search users by name (for starting new conversations)
 * Searches both consumers and farmers collections
 */
export async function searchUsers(searchTerm: string, currentUserId: string): Promise<Array<{
  uid: string;
  name: string;
  role: 'consumer' | 'farmer';
  avatar?: string;
}>> {
  if (!searchTerm || searchTerm.length < 2) return [];
  
  const term = searchTerm.toLowerCase();
  const results: Array<{ uid: string; name: string; role: 'consumer' | 'farmer'; avatar?: string }> = [];
  
  // Search farmers
  const farmersSnapshot = await getDocs(collection(db, 'farmers'));
  farmersSnapshot.forEach((doc) => {
    if (doc.id === currentUserId) return;
    const data = doc.data();
    const fullName = `${data.firstName} ${data.lastName}`.toLowerCase();
    const farmName = (data.farmName || '').toLowerCase();
    
    if (fullName.includes(term) || farmName.includes(term)) {
      results.push({
        uid: doc.id,
        name: data.farmName || `${data.firstName} ${data.lastName}`,
        role: 'farmer',
        avatar: data.profileImage,
      });
    }
  });
  
  // Search consumers
  const consumersSnapshot = await getDocs(collection(db, 'consumers'));
  consumersSnapshot.forEach((doc) => {
    if (doc.id === currentUserId) return;
    const data = doc.data();
    const fullName = `${data.firstName} ${data.lastName}`.toLowerCase();
    
    if (fullName.includes(term)) {
      results.push({
        uid: doc.id,
        name: `${data.firstName} ${data.lastName}`,
        role: 'consumer',
        avatar: data.profileImage,
      });
    }
  });
  
  return results.slice(0, 10); // Limit results
}

/**
 * Get or create conversation with specific user
 * Used when clicking "Contact Seller" on product page
 */
export async function getOrCreateConversationWithUser(
  currentUserId: string,
  currentUserProfile: { firstName: string; lastName: string; role: 'consumer' | 'farmer' },
  otherUserId: string,
  otherUserProfile: { firstName: string; lastName: string; role: 'consumer' | 'farmer' },
  productId?: string
): Promise<string> {
  return createConversation(
    currentUserId,
    currentUserProfile,
    otherUserId,
    otherUserProfile,
    productId
  );
}