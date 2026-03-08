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
  arrayUnion,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import type { Message, Conversation, ParticipantInfo } from '../types/messaging';

const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_SUBCOLLECTION = 'messages';

// Interface for user profile when creating conversations
interface ConversationUserProfile {
  firstName: string;
  lastName: string;
  role: 'consumer' | 'farmer';
  farmName?: string;
}

/**
 * Create or get existing conversation between two users
 */
export async function createConversation(
  currentUserId: string,
  currentUserProfile: ConversationUserProfile,
  otherUserId: string,
  otherUserProfile: ConversationUserProfile,
  productId?: string // Changed from 'product' object to 'productId' string
): Promise<string> {
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
    if (productId) {
      // Update the existing conversation with the new product context
      const conversationRef = doc(db, CONVERSATIONS_COLLECTION, existingConversationId);
      await updateDoc(conversationRef, {
        relatedProductId: productId
      });
    }
    return existingConversationId;
  }

  const participantInfo: Record<string, ParticipantInfo> = {
    [currentUserId]: {
      name: currentUserProfile.role === 'farmer' && currentUserProfile.farmName
        ? currentUserProfile.farmName
        : `${currentUserProfile.firstName} ${currentUserProfile.lastName}`,
      avatar: '',
      role: currentUserProfile.role,
    },
    [otherUserId]: {
      name: otherUserProfile.role === 'farmer' && otherUserProfile.farmName
        ? otherUserProfile.farmName
        : `${otherUserProfile.firstName} ${otherUserProfile.lastName}`,
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
    ...(productId && { relatedProductId: productId }), // Now productId is defined
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
  senderAvatar: string,
  text: string
): Promise<void> {
  const batch = writeBatch(db);

  const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
  const newMessage = {
    senderId,
    senderName,
    senderAvatar,
    text,
    createdAt: serverTimestamp(),
    readBy: [senderId],
    type: 'text',
  };

  const messageDocRef = doc(messagesRef);
  batch.set(messageDocRef, newMessage);

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
 * Respond to an offer (accept or reject)
 */
export async function respondToOffer(
  conversationId: string,
  messageId: string,
  responderId: string,
  response: 'accepted' | 'rejected'
): Promise<void> {
  const batch = writeBatch(db);

  // Update the offer message
  const messageRef = doc(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION, messageId);
  
  // Get current message data for price
  const messageSnap = await getDoc(messageRef);
  const messageData = messageSnap.data();
  const offerPrice = messageData?.offerPrice;

  batch.update(messageRef, {
    offerStatus: response,
    offerResponseAt: serverTimestamp(),
    offerResponseBy: responderId,
    readBy: arrayUnion(responderId),
  });

  // Update conversation
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  
  if (response === 'accepted') {
    batch.update(conversationRef, {
      pendingOfferId: null,
      pendingOfferPrice: null,
      lastMessage: {
        text: `✅ Offer accepted: PHP ${offerPrice?.toFixed(2)}`,
        senderId: responderId,
        createdAt: serverTimestamp(),
        readBy: [responderId],
      },
      lastMessageAt: serverTimestamp(),
    });
  } else {
    batch.update(conversationRef, {
      pendingOfferId: null,
      pendingOfferPrice: null,
      lastMessage: {
        text: `❌ Offer rejected`,
        senderId: responderId,
        createdAt: serverTimestamp(),
        readBy: [responderId],
      },
      lastMessageAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

/**
 * Send an offer message
 */
export async function sendOfferMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string,
  offerPrice: number
): Promise<string> { // Return message ID
  const batch = writeBatch(db);

  const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
  const newMessage = {
    senderId,
    senderName,
    senderAvatar,
    text: `Made an offer: PHP ${offerPrice.toFixed(2)}`,
    createdAt: serverTimestamp(),
    readBy: [senderId],
    type: 'offer',
    offerPrice,
    offerStatus: 'pending', // NEW: Start as pending
  };

  const messageDocRef = doc(messagesRef);
  batch.set(messageDocRef, newMessage);

  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const conversationSnap = await getDoc(conversationRef);
  const conversationData = conversationSnap.data();
  const otherParticipantId = conversationData?.participants.find((id: string) => id !== senderId);

  batch.update(conversationRef, {
    lastMessage: {
      text: `New offer: PHP ${offerPrice.toFixed(2)}`,
      senderId,
      createdAt: serverTimestamp(),
      readBy: [senderId],
    },
    lastMessageAt: serverTimestamp(),
    [`unreadCount.${otherParticipantId}`]: increment(1),
    pendingOfferId: messageDocRef.id, // Track pending offer
    pendingOfferPrice: offerPrice, // Track pending price
  });

  await batch.commit();
  return messageDocRef.id;
}

/**
 * Upload media (image/video) to Firebase Storage
 */
export async function uploadMedia(
  file: File,
  conversationId: string,
  uploaderId: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; type: 'image' | 'video' }> {
  const isVideo = file.type.startsWith('video/');
  const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const storageRef = ref(storage, `message-attachments/${conversationId}/${fileName}`);

  const metadata = {
    contentType: file.type,
    customMetadata: {
      uploader: uploaderId,
      conversationId: conversationId,
    },
  };

  const uploadTask = uploadBytesResumable(storageRef, file, metadata);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({
          url: downloadURL,
          type: isVideo ? 'video' : 'image',
        });
      }
    );
  });
}

/**
 * Send media message (image or video)
 */
export async function sendMediaMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string,
  mediaUrl: string,
  type: 'image' | 'video',
  caption?: string
): Promise<void> {
  const batch = writeBatch(db);

  const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
  const newMessage = {
    senderId,
    senderName,
    senderAvatar,
    text: caption || '',
    createdAt: serverTimestamp(),
    readBy: [senderId],
    type,
    ...(type === 'image' ? { imageUrl: mediaUrl } : { videoUrl: mediaUrl }),
  };

  const messageDocRef = doc(messagesRef);
  batch.set(messageDocRef, newMessage);

  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const conversationSnap = await getDoc(conversationRef);
  const conversationData = conversationSnap.data();
  const otherParticipantId = conversationData?.participants.find((id: string) => id !== senderId);

  const lastMessageText = type === 'image' ? '📷 Photo' : '🎥 Video';

  batch.update(conversationRef, {
    lastMessage: {
      text: caption || lastMessageText,
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

  return messages.reverse();
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
 * Search users by name
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

  return results.slice(0, 10);
}

/**
 * Get or create conversation with specific user
 */
export async function getOrCreateConversationWithUser(
  currentUserId: string,
  currentUserProfile: ConversationUserProfile,
  otherUserId: string,
  otherUserProfile: ConversationUserProfile,
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

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<{
  uid: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: 'consumer' | 'farmer';
  avatar?: string;
  farmName?: string;
  isOnline?: boolean;
} | null> {
  try {
    // Try farmers collection first
    const farmerDoc = await getDoc(doc(db, 'farmers', userId));
    if (farmerDoc.exists()) {
      const data = farmerDoc.data();
      return {
        uid: userId,
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: data.farmName || `${data.firstName} ${data.lastName}`,
        role: 'farmer',
        avatar: data.profileImage,
        farmName: data.farmName,
        isOnline: false,
      };
    }

    // Try consumers collection
    const consumerDoc = await getDoc(doc(db, 'consumers', userId));
    if (consumerDoc.exists()) {
      const data = consumerDoc.data();
      return {
        uid: userId,
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: `${data.firstName} ${data.lastName}`,
        role: 'consumer',
        avatar: data.profileImage,
        isOnline: false,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Send order request (Farmer initiates sale)
 */
export async function sendOrderRequest(
  conversationId: string,
  senderId: string,
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
): Promise<string> {
  const batch = writeBatch(db);

  const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
  const newMessage = {
    senderId,
    senderName,
    senderAvatar,
    text: `Order request: ${orderDetails.productName} x${orderDetails.quantity}`,
    createdAt: serverTimestamp(),
    readBy: [senderId],
    type: 'order_request',
    orderDetails,
    orderStatus: 'pending',
  };

  const messageDocRef = doc(messagesRef);
  batch.set(messageDocRef, newMessage);

  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const conversationSnap = await getDoc(conversationRef);
  const conversationData = conversationSnap.data();
  const otherParticipantId = conversationData?.participants.find((id: string) => id !== senderId);

  batch.update(conversationRef, {
    lastMessage: {
      text: `📦 Order request: ${orderDetails.productName}`,
      senderId,
      createdAt: serverTimestamp(),
      readBy: [senderId],
    },
    lastMessageAt: serverTimestamp(),
    [`unreadCount.${otherParticipantId}`]: increment(1),
    activeOrderId: messageDocRef.id,
    orderStatus: 'pending',
  });

  await batch.commit();
  return messageDocRef.id;
}

/**
 * Respond to order request (Consumer accepts/rejects)
 */
export async function respondToOrder(
  conversationId: string,
  messageId: string,
  responderId: string,
  response: 'accepted' | 'rejected',
  orderDetails: any
): Promise<void> {
  const batch = writeBatch(db);

  // Update the order message
  const messageRef = doc(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION, messageId);
  
  batch.update(messageRef, {
    orderStatus: response,
    orderResponseAt: serverTimestamp(),
    orderResponseBy: responderId,
    readBy: arrayUnion(responderId),
  });

  // Send response message
  const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
  const responseMessage = {
    senderId: responderId,
    senderName: response === 'accepted' ? 'Order Accepted' : 'Order Rejected',
    senderAvatar: '',
    text: response === 'accepted' 
      ? `✅ I accept the order for ${orderDetails.productName}` 
      : `❌ I cannot accept this order`,
    createdAt: serverTimestamp(),
    readBy: [responderId],
    type: 'order_response',
    orderStatus: response,
  };

  const responseMsgRef = doc(messagesRef);
  batch.set(responseMsgRef, responseMessage);

  // Update conversation
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  
  if (response === 'accepted') {
    batch.update(conversationRef, {
      orderStatus: 'accepted',
      lastAcceptedOfferPrice: orderDetails.pricePerUnit, // Store for future reference
      lastMessage: {
        text: `✅ Order accepted`,
        senderId: responderId,
        createdAt: serverTimestamp(),
        readBy: [responderId],
      },
      lastMessageAt: serverTimestamp(),
    });
  } else {
    batch.update(conversationRef, {
      activeOrderId: null,
      orderStatus: null,
      lastMessage: {
        text: `❌ Order rejected`,
        senderId: responderId,
        createdAt: serverTimestamp(),
        readBy: [responderId],
      },
      lastMessageAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

/**
 * Confirm order received (Consumer side)
 */
export async function confirmOrderReceived(
  conversationId: string,
  userId: string,
  userName: string,
  userAvatar: string
): Promise<void> {
  const batch = writeBatch(db);

  // Send confirmation message
  const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
  const confirmMessage = {
    senderId: userId,
    senderName: userName,
    senderAvatar: userAvatar,
    text: '📦 I received the product!',
    createdAt: serverTimestamp(),
    readBy: [userId],
    type: 'order_received',
  };

  const msgRef = doc(messagesRef);
  batch.set(msgRef, confirmMessage);

  // Update conversation
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const conversationSnap = await getDoc(conversationRef);
  const conversationData = conversationSnap.data();
  const otherParticipantId = conversationData?.participants.find((id: string) => id !== userId);

  batch.update(conversationRef, {
    orderStatus: 'completed',
    activeOrderId: null,
    lastMessage: {
      text: '📦 Order received by customer',
      senderId: userId,
      createdAt: serverTimestamp(),
      readBy: [userId],
    },
    lastMessageAt: serverTimestamp(),
    [`unreadCount.${otherParticipantId}`]: increment(1),
  });

  await batch.commit();
}