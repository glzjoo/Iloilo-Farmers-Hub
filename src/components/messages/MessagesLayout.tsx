import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMessages } from '../../hooks/useMessaging';
import MessageProfile from './MessageProfile';
import MessageBubble from './MessageBubble';
import ProductContext from './ProductContext';
import FarmerProductContext from './FarmerProductContext';
import addbutton from '../../assets/icons/add.svg';
import type { Farmer } from '../../types';
import {
  uploadMedia,
  sendMediaMessage,
  getUserProfile,
} from '../../services/messageService';
import { getProductById } from '../../services/productService';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import MakeOfferButton from './MakeOfferButton';
import { submitReport, uploadReportMedia } from '../../services/reportService';

interface MessagesLayoutProps {
  conversationId: string | null;
  onBack?: () => void;
  productContext?: {
    id: string;
    name: string;
    price: number;
    image: string;
    unit: string;
    quantity?: number;
  } | null;
  onCloseProductContext?: () => void;
}

const isWithinTimeWindow = (msg1: any, msg2: any, minutes: number = 5) => {
  if (!msg1?.createdAt || !msg2?.createdAt) return false;
  const time1 = msg1.createdAt instanceof Date ? msg1.createdAt : msg1.createdAt.toDate();
  const time2 = msg2.createdAt instanceof Date ? msg2.createdAt : msg2.createdAt.toDate();
  const diffMs = Math.abs(time2.getTime() - time1.getTime());
  return diffMs <= minutes * 60 * 1000;
};

const MAX_OFFERS_PER_CONSUMER = 100;

export default function MessagesLayout({ conversationId, onBack, productContext, onCloseProductContext }: MessagesLayoutProps) {
  const { user, userProfile } = useAuth();
  const {
    messages,
    loading,
    sending,
    sendMessage,
    sendOfferMessage,
    respondToOffer,
    sendOrderRequest,
    respondToOrder,
    confirmOrderReceived,
  } = useMessages(conversationId, user?.uid);

  const [newMessage, setNewMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [fetchedProductContext, setFetchedProductContext] = useState<MessagesLayoutProps['productContext']>(null);
  const [messageAvatars, setMessageAvatars] = useState<Record<string, string>>({});
  const [totalUserOffers, setTotalUserOffers] = useState(0);
  const [offersLoading, setOffersLoading] = useState(true);
  const [conversationData, setConversationData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [reportType, setReportType] = useState<string | null>(null);
  const [reportDetails, setReportDetails] = useState('');
  const [reportFiles, setReportFiles] = useState<File[]>([]);
  const [reportUploading, setReportUploading] = useState(false);
  const reportFileInputRef = useRef<HTMLInputElement>(null);

  // Debug: Log messages when they change
  useEffect(() => {
    console.log('Messages updated:', messages.length, 'messages');
    const orderRequests = messages.filter(m => m.type === 'order_request');
    console.log('Order requests in messages:', orderRequests.length);
  }, [messages]);

  // Fetch total offers
  useEffect(() => {
    const fetchTotalOffers = async () => {
      if (!user?.uid || userProfile?.role !== 'consumer') {
        setTotalUserOffers(0);
        setOffersLoading(false);
        return;
      }

      setOffersLoading(true);
      try {
        const conversationsRef = collection(db, 'conversations');
        const q = query(conversationsRef, where('participants', 'array-contains', user.uid));
        const conversationsSnap = await getDocs(q);

        let totalOffers = 0;

        for (const convDoc of conversationsSnap.docs) {
          const messagesRef = collection(db, 'conversations', convDoc.id, 'messages');
          const messagesSnap = await getDocs(messagesRef);

          messagesSnap.forEach(msgDoc => {
            const msgData = msgDoc.data();
            if (msgData.type === 'offer' && msgData.senderId === user.uid) {
              totalOffers++;
            }
          });
        }

        setTotalUserOffers(totalOffers);
      } catch (error) {
        console.error('Error fetching total offers:', error);
      } finally {
        setOffersLoading(false);
      }
    };

    fetchTotalOffers();
  }, [user?.uid, userProfile?.role, messages]);

  // Fetch conversation data
  useEffect(() => {
    if (!conversationId) return;

    const fetchConversationData = async () => {
      try {
        const convRef = doc(db, 'conversations', conversationId);
        const convSnap = await getDoc(convRef);
        if (convSnap.exists()) {
          setConversationData(convSnap.data());
        }
      } catch (error) {
        console.error('Error fetching conversation data:', error);
      }
    };

    fetchConversationData();
  }, [conversationId, messages]);

  // Compute derived values BEFORE scroll effects
  const isConsumer = userProfile?.role === 'consumer';
  const hasReachedOfferLimit = totalUserOffers >= MAX_OFFERS_PER_CONSUMER;
  const remainingOffers = Math.max(0, MAX_OFFERS_PER_CONSUMER - totalUserOffers);

  const activeOrder = useMemo(() => {
    return messages.find(m =>
      m.type === 'order_request' && m.orderStatus === 'pending'
    );
  }, [messages]);

  const currentOrderStatus = useMemo(() => {
    if (activeOrder) return 'pending';
    if (conversationData?.orderStatus === 'accepted') return 'accepted';
    if (conversationData?.orderStatus === 'completed') return 'completed';
    return null;
  }, [activeOrder, conversationData]);

  // Scroll to bottom function
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
      }
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 100);
  }, []);

  // Trigger scroll when flag is set
  useEffect(() => {
    if (shouldScrollToBottom) {
      scrollToBottom('smooth');
      setShouldScrollToBottom(false);
    }
  }, [shouldScrollToBottom, scrollToBottom]);

  // Scroll on initial load and when messages change
  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom('auto');
      setTimeout(() => scrollToBottom('smooth'), 300);
    }
  }, [loading, messages.length, scrollToBottom]);

  // Scroll when order status changes (MakeOfferButton appears/disappears)
  useEffect(() => {
    if (currentOrderStatus !== undefined) {
      setShouldScrollToBottom(true);
    }
  }, [currentOrderStatus]);

  // Fetch other user's profile
  useEffect(() => {
    if (!conversationId || !messages.length || !user) {
      setOtherUserProfile(null);
      return;
    }

    const fetchProfile = async () => {
      const otherMessage = messages.find(m => m.senderId !== user.uid);
      if (!otherMessage) return;

      if (otherUserProfile?.uid === otherMessage.senderId) return;

      setProfileLoading(true);
      try {
        const profile = await getUserProfile(otherMessage.senderId);
        if (profile) {
          setOtherUserProfile(profile);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [conversationId, messages, user, otherUserProfile?.uid]);

  // Fetch product context
  useEffect(() => {
    if (!conversationId || productContext) return;

    const fetchProductFromConversation = async () => {
      try {
        const convRef = doc(db, 'conversations', conversationId);
        const convSnap = await getDoc(convRef);

        if (convSnap.exists()) {
          const data = convSnap.data();
          if (data.relatedProductId) {
            const product = await getProductById(data.relatedProductId);
            if (product) {
              setFetchedProductContext({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image || '',
                unit: product.unit,
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch product context:', error);
      }
    };

    fetchProductFromConversation();
  }, [conversationId, productContext]);

  // Fetch avatars
  useEffect(() => {
    const fetchMessageAvatars = async () => {
      const senderIds = [...new Set(messages.map(m => m.senderId))];
      const newAvatars: Record<string, string> = {};

      for (const senderId of senderIds) {
        if (senderId === user?.uid) {
          if (userProfile?.profileImage) {
            newAvatars[senderId] = userProfile.profileImage;
          }
        } else if (!messageAvatars[senderId]) {
          try {
            const profile = await getUserProfile(senderId);
            if (profile?.avatar) {
              newAvatars[senderId] = profile.avatar;
            }
          } catch (error) {
            console.error('Failed to fetch avatar for', senderId, error);
          }
        }
      }

      if (Object.keys(newAvatars).length > 0) {
        setMessageAvatars(prev => ({ ...prev, ...newAvatars }));
      }
    };

    if (messages.length > 0 && user?.uid) {
      fetchMessageAvatars();
    }
  }, [messages, user?.uid, userProfile]);

  const messageGroups = useMemo(() => {
    const groups: Array<{
      message: any;
      showAvatar: boolean;
      isLastInGroup: boolean;
    }> = [];

    messages.forEach((message, index) => {
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

      const showAvatar = !prevMessage ||
        prevMessage.senderId !== message.senderId ||
        !isWithinTimeWindow(prevMessage, message, 5);

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

  const latestReceivedOfferPrice = useMemo((): number | null => {
    const offerMsg = [...messages].reverse().find(
      m => m.type === 'offer' && m.senderId !== user?.uid && m.offerStatus === 'accepted'
    );
    return offerMsg?.offerPrice ?? null;
  }, [messages, user?.uid]);

  const otherParticipantId = useMemo(() => {
    if (!messages.length || !user) return null;
    const otherMsg = messages.find(m => m.senderId !== user.uid);
    return otherMsg?.senderId;
  }, [messages, user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userProfile || !conversationId) return;

    const senderName = userProfile.role === 'farmer'
      ? (userProfile.farmName || `${userProfile.firstName} ${userProfile.lastName}`)
      : `${userProfile.firstName} ${userProfile.lastName}`;

    await sendMessage(newMessage.trim(), senderName, userProfile.profileImage || '');
    setNewMessage('');
    setShouldScrollToBottom(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId || !user || !userProfile) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert('Please select an image or video file');
      return;
    }

    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File too large. Max size: ${isVideo ? '50MB' : '10MB'}`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { url, type } = await uploadMedia(
        file,
        conversationId,
        user.uid,
        (progress) => setUploadProgress(progress)
      );

      const senderName = userProfile.role === 'farmer'
        ? (userProfile.farmName || `${userProfile.firstName} ${userProfile.lastName}`)
        : `${userProfile.firstName} ${userProfile.lastName}`;

      await sendMediaMessage(
        conversationId,
        user.uid,
        senderName,
        userProfile.profileImage || '',
        url,
        type,
        ''
      );
      setShouldScrollToBottom(true);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [conversationId, user, userProfile]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSendOrderRequest = async (quantity: number, totalPrice: number) => {
    console.log('handleSendOrderRequest called with:', { quantity, totalPrice });

    if (!userProfile || !conversationId || !currentProductContext) {
      console.error('Missing required data:', { userProfile, conversationId, currentProductContext });
      return;
    }

    const senderName = userProfile.farmName || `${userProfile.firstName} ${userProfile.lastName}`;

    try {
      console.log('About to call sendOrderRequest from hook');
      await sendOrderRequest(
        senderName,
        userProfile.profileImage || '',
        {
          productId: currentProductContext.id,
          productName: currentProductContext.name,
          productImage: currentProductContext.image,
          pricePerUnit: latestReceivedOfferPrice || currentProductContext.price,
          quantity,
          totalPrice,
          unit: currentProductContext.unit,
        }
      );
      console.log('sendOrderRequest completed successfully');
      setShouldScrollToBottom(true);
    } catch (error: any) {
      console.error('Failed to send order:', error);
      alert(error.message || 'Failed to send order request. Please try again.');
    }
  };

  const handleRespondToOrder = async (messageId: string, response: 'accepted' | 'rejected') => {
    console.log('handleRespondToOrder called:', { messageId, response });

    if (!conversationId || !activeOrder?.orderDetails || !user) {
      console.error('Missing required data:', { conversationId, activeOrder, user });
      return;
    }

    try {
      await respondToOrder(
        messageId,
        response,
        activeOrder.orderDetails
      );
      console.log('respondToOrder completed successfully');
      setShouldScrollToBottom(true);
    } catch (error: any) {
      console.error('Failed to respond to order:', error);
      if (error.message?.includes('Insufficient stock')) {
        alert(error.message);
      } else {
        alert('Failed to respond. Please try again.');
      }
      throw error;
    }
  };

  const handleConfirmReceived = async () => {
    if (!userProfile || !conversationId || !user) return;

    const senderName = `${userProfile.firstName} ${userProfile.lastName}`;

    try {
      await confirmOrderReceived(
        senderName,
        userProfile.profileImage || ''
      );

      sessionStorage.setItem('pendingReview', JSON.stringify({
        productId: currentProductContext?.id,
        farmerId: otherParticipantId,
        orderId: conversationId,
        completedAt: new Date().toISOString()
      }));
      setShouldScrollToBottom(true);
    } catch (error) {
      console.error('Failed to confirm order:', error);
      alert('Failed to confirm. Please try again.');
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

  const participantData = otherUserProfile || otherParticipant || {
    uid: 'loading',
    firstName: 'Loading...',
    lastName: '',
    displayName: 'Loading...',
    role: 'consumer',
  };

  const currentProductContext = productContext || fetchedProductContext;

  // Report handlers
  const handleReportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => {
      const isImage = f.type.startsWith('image/');
      const isVideo = f.type.startsWith('video/');
      return isImage || isVideo;
    });
    if (validFiles.length !== files.length) {
      alert('Only image and video files are allowed.');
    }
    const oversized = validFiles.filter(f => f.size > 50 * 1024 * 1024);
    if (oversized.length > 0) {
      alert('Some files exceed the 50MB limit and were skipped.');
    }
    const finalFiles = validFiles.filter(f => f.size <= 50 * 1024 * 1024).slice(0, 5);
    setReportFiles(prev => [...prev, ...finalFiles].slice(0, 5));
    if (reportFileInputRef.current) reportFileInputRef.current.value = '';
  };

  const removeReportFile = (index: number) => {
    setReportFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReport = async () => {
    if (!user || !userProfile || !participantData || !reportType) return;

    try {
      setReportUploading(true);
      const mediaUrls: { url: string; type: 'image' | 'video' }[] = [];

      if (reportFiles.length > 0) {
        for (const file of reportFiles) {
          const { url, type } = await uploadReportMedia(file, user.uid);
          mediaUrls.push({ url, type });
        }
      }

      const reporterName = userProfile.farmName || `${userProfile.firstName} ${userProfile.lastName}`;
      const reportedName = participantData.farmName || `${participantData.firstName} ${participantData.lastName}`;

      await submitReport({
        type: reportType as any,
        reportedUser: reportedName,
        reportedUserId: otherParticipantId || '',
        role: participantData.role === 'farmer' ? 'Seller' : 'Consumer',
        reportedBy: reporterName,
        reportedById: user.uid,
        reason: reportDetails || reportType || '',
        conversationId: conversationId || '',
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      });

      alert('Report submitted successfully! The admin will review it.');
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setReportUploading(false);
      setShowReportMenu(false);
      setReportType(null);
      setReportDetails('');
      setReportFiles([]);
    }
  };

  return (
    <div className="flex flex-col w-full h-[100dvh] fixed inset-0 z-50 md:z-0 md:relative md:inset-auto md:h-full bg-white overflow-hidden overscroll-none">

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
          user={participantData}
          loading={profileLoading}
        />
        {/* Spacer to push report button to the right */}
        <div className="flex-1" />
        {/* Report Button */}
        <div className="relative">
          <button
            onClick={() => setShowReportMenu(!showReportMenu)}
            className="w-20 h-10 bg-red-500 flex items-center justify-center cursor-pointer text-white rounded-lg"
            title="Report User"
          >
            Report
          </button>
          {showReportMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => { setShowReportMenu(false); setReportType(null); setReportDetails(''); setReportFiles([]); }} />
              <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-40 overflow-hidden">
                <div className="px-4 py-2.5 bg-red-500 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Report this user</p>
                    <p className="text-[10px] text-red-100">{reportType ? 'Provide details' : 'Select a reason'}</p>
                  </div>
                  <button
                    onClick={() => { setShowReportMenu(false); setReportType(null); setReportDetails(''); setReportFiles([]); }}
                    className="text-white/80 hover:text-white bg-transparent border-none cursor-pointer text-lg leading-none"
                  >✕</button>
                </div>

                {!reportType ? (
                  // Step 1: Select reason
                  <div className="py-1">
                    {['Scam / Fraud', 'Harassment', 'Spam', 'Inappropriate Content', 'Other'].map((reason) => (
                      <button
                        key={reason}
                        onClick={() => setReportType(reason)}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors bg-transparent border-none cursor-pointer"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                ) : (
                  // Add details + media
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{reportType}</span>
                      <button
                        onClick={() => setReportType(null)}
                        className="text-xs text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer underline"
                      >Change</button>
                    </div>

                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Describe what happened (optional)..."
                      rows={3}
                      disabled={reportUploading}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 placeholder:text-gray-400 disabled:bg-gray-50"
                    />

                    {/* Media Upload */}
                    <input
                      type="file"
                      ref={reportFileInputRef}
                      onChange={handleReportFileSelect}
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                    />

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => reportFileInputRef.current?.click()}
                        disabled={reportUploading || reportFiles.length >= 5}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Attach Photo/Video {reportFiles.length > 0 && `(${reportFiles.length}/5)`}
                      </button>

                      {reportFiles.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {reportFiles.map((file, idx) => (
                            <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                              {file.type.startsWith('image/') ? (
                                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-[9px] mt-0.5">Video</span>
                                </div>
                              )}
                              <button
                                onClick={() => removeReportFile(idx)}
                                className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 text-white rounded-full text-[10px] flex items-center justify-center cursor-pointer border-none hover:bg-black/80"
                              >✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSubmitReport}
                      disabled={reportUploading}
                      className="w-full mt-3 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg border-none cursor-pointer hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {reportUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        'Submit Report'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {userProfile?.role === 'farmer' && currentProductContext && (
        <FarmerProductContext
          product={currentProductContext}
          offerPrice={latestReceivedOfferPrice}
          consumerId={otherParticipantId || ''}
          conversationId={conversationId}
          lastAcceptedOfferPrice={latestReceivedOfferPrice ?? null}
          onSendOrderRequest={handleSendOrderRequest}
          onClose={onCloseProductContext}
        />
      )}

      {userProfile?.role === 'consumer' && currentProductContext && (
        <ProductContext
          product={currentProductContext}
          onClose={onCloseProductContext}
        />
      )}

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain min-h-0 p-4 space-y-1 bg-white z-10"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
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
                message={{
                  ...message,
                  senderAvatar: messageAvatars[message.senderId] || ''
                }}
                showAvatar={showAvatar}
                isLastInGroup={isLastInGroup}
                onRespondToOffer={respondToOffer}
                onRespondToOrder={handleRespondToOrder}
              />
            ))}
            <div ref={messagesEndRef} style={{ height: '1px', minHeight: '1px' }} />
          </>
        )}
      </div>

      {isUploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-6 w-80">
            <p className="text-center font-semibold mb-4">Uploading...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">{Math.round(uploadProgress || 0)}%</p>
          </div>
        </div>
      )}

      {isConsumer && !offersLoading && (
        <MakeOfferButton
          product={currentProductContext ? {
            name: currentProductContext.name,
            price: currentProductContext.price,
            unit: currentProductContext.unit,
            image: currentProductContext.image,
          } : null}
          farmerName={otherUserProfile?.farmName || otherUserProfile?.displayName || participantData?.firstName || 'Seller'}
          disabled={hasReachedOfferLimit && currentOrderStatus !== 'accepted'}
          remainingOffers={remainingOffers}
          orderStatus={currentOrderStatus}
          onConfirmReceived={handleConfirmReceived}
          conversationId={conversationId || ''}
          productId={currentProductContext?.id || ''}
          farmerId={otherParticipantId || ''}
          onSubmitOffer={async (offerPrice: number) => {
            if (!conversationId || !user?.uid || !userProfile) return;

            if (hasReachedOfferLimit) {
              alert(`You have reached the maximum of ${MAX_OFFERS_PER_CONSUMER} offers across all conversations.\n\nUpgrade your subscription to make more offers!`);
              return;
            }

            const senderName = `${userProfile.firstName} ${userProfile.lastName}`;

            try {
              await sendOfferMessage(senderName, userProfile.profileImage || '', offerPrice);
              setTotalUserOffers(prev => prev + 1);
              setShouldScrollToBottom(true);
            } catch (error) {
              console.error('Failed to send offer:', error);
              alert('Failed to send offer. Please try again.');
            }
          }}
        />
      )}

      {isConsumer && !hasReachedOfferLimit && remainingOffers <= 2 && currentOrderStatus !== 'accepted' && (
        <div className="px-4 py-1 bg-blue-50 text-center">
          <p className="text-xs text-blue-600">
            {remainingOffers} offer{remainingOffers !== 1 ? 's' : ''} remaining
          </p>
        </div>
      )}

      <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0 z-0">
        <form
          onSubmit={handleSend}
          className="flex items-center gap-3"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={triggerFileInput}
            disabled={isUploading}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border-none cursor-pointer text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0 disabled:opacity-50"
            title="Add photo or video"
          >
            <img src={addbutton} alt="Add" className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isUploading ? "Uploading..." : "Type a message..."}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 text-sm font-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:bg-gray-100"
            disabled={sending || isUploading}
          />

          <button
            type="submit"
            disabled={!newMessage.trim() || sending || isUploading}
            className={`w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer flex-shrink-0 transition-colors ${newMessage.trim() && !sending && !isUploading
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