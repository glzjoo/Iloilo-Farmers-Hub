import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import MessageColumn from '../components/messages/MessageColumn';
import MessagesLayout from '../components/messages/MessagesLayout';
import ProductContext from '../components/messages/ProductContext';
import { getOrCreateConversationWithUser, getUserProfile } from '../services/messageService';

interface LocationState {
  farmerId?: string;
  farmerName?: string;
  product?: {
    id: string;
    name: string;
    price: number;
    image: string;
    unit: string;
  };
}

export default function MessagesPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isMobileSidebarVisible, setIsMobileSidebarVisible] = useState(true);
  const [productContext, setProductContext] = useState<LocationState['product'] | null>(null);
  const { user, userProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle navigation state (from "Message Seller" button)
  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.farmerId && state?.product && user && userProfile) {
      // Create or get conversation
      const createConversation = async () => {
        try {
          // Get farmer profile
          const farmerProfile = await getUserProfile(state.farmerId!);
          if (!farmerProfile) {
            console.error('Farmer not found');
            return;
          }

          // Create conversation with product context
          const conversationId = await getOrCreateConversationWithUser(
            user.uid,
            {
              firstName: userProfile.firstName || '',
              lastName: userProfile.lastName || '',
              role: userProfile.role as 'consumer' | 'farmer',
              farmName: userProfile.farmName,
            },
            state.farmerId!,
            {
              firstName: farmerProfile.firstName,
              lastName: farmerProfile.lastName,
              role: farmerProfile.role,
              farmName: farmerProfile.farmName,
            },
            state.product!.id // Pass product ID
          );

          // Set product context for display
          setProductContext(state.product!);
          
          // Select the conversation
          setSelectedConversationId(conversationId);
          setIsMobileSidebarVisible(false);
          
          // Clear navigation state to prevent re-creation on refresh
          navigate('/messages', { replace: true, state: {} });
        } catch (error) {
          console.error('Failed to create conversation:', error);
        }
      };

      createConversation();
    }
  }, [location.state, user, userProfile, navigate]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsMobileSidebarVisible(false);
    // TODO: Fetch product context for existing conversations
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
          farmName: userProfile.farmName,
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
    <div className="flex flex-1 h-full min-h-0 bg-white overflow-hidden">
      {/* Sidebar */}
      <div className={`
        ${isMobileSidebarVisible ? 'flex' : 'hidden'} 
        md:flex flex-col w-full md:w-80 h-full border-r border-gray-200 flex-shrink-0
      `}>
        <MessageColumn
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          onStartNewConversation={handleStartNewConversation}
        />
      </div>

      {/* Chat Area */}
      <div className={`
        ${!isMobileSidebarVisible ? 'flex' : 'hidden'} 
        md:flex flex-1 h-full min-h-0 flex-col
      `}>
        {/* Product Context Section - Shows for both farmer and consumer */}
        {productContext && (
          <ProductContext 
            product={productContext}
            onClose={() => setProductContext(null)}
          />
        )}
        
        <MessagesLayout 
          conversationId={selectedConversationId}
          onBack={handleBackToSidebar}
        />
      </div>
    </div>
  );
}