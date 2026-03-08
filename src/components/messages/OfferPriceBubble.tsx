import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

interface OfferPriceBubbleProps {
  offerPrice: number;
  isSender: boolean;
  offerStatus?: 'pending' | 'accepted' | 'rejected';
  messageId: string;
  onRespondToOffer?: (messageId: string, response: 'accepted' | 'rejected') => Promise<void>;
}

export default function OfferPriceBubble({ 
  offerPrice, 
  isSender, 
  offerStatus = 'pending',
  messageId,
  onRespondToOffer
}: OfferPriceBubbleProps) {
  const { userProfile } = useAuth();
  const isFarmer = userProfile?.role === 'farmer';
  const [isResponding, setIsResponding] = useState(false);

  const handleResponse = async (response: 'accepted' | 'rejected') => {
    if (!onRespondToOffer || isResponding) return;
    setIsResponding(true);
    try {
      await onRespondToOffer(messageId, response);
    } catch (error: any) {
      console.error('Failed to respond to offer:', error);
      alert('Failed to respond to offer. Please try again.');
    } finally {
      setIsResponding(false);
    }
  };

  const getStatusDisplay = () => {
    if (offerStatus === 'accepted') {
      return {
        text: isSender ? 'Offer accepted' : 'You accepted the offer',
        bgColor: isSender ? 'bg-green-500' : 'bg-green-600',
        icon: '✅'
      };
    }
    if (offerStatus === 'rejected') {
      return {
        text: isSender ? 'Offer rejected' : 'You rejected the offer',
        bgColor: isSender ? 'bg-red-400' : 'bg-red-500',
        icon: '❌'
      };
    }
    return {
      text: isSender ? 'Pending offer' : 'New offer received',
      bgColor: isSender ? 'bg-primary' : 'bg-[#5f6a5d]',
      icon: '💰'
    };
  };

  const status = getStatusDisplay();

  // ✅ FIXED: Added flex structure to match MessageBubble alignment
  return (
    <div className={`flex items-end gap-2 mb-1 ${isSender ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar placeholder for alignment - matches MessageBubble structure */}
      <div className="w-8 flex-shrink-0" />
      
      {/* Offer bubble - same max-width and structure as MessageBubble */}
      <div className={`max-w-[70%] ${isSender ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${status.bgColor} text-white ${isSender ? 'rounded-br-none' : 'rounded-bl-none'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span>{status.icon}</span>
            <p className="text-xs font-medium opacity-90">{status.text}</p>
          </div>
          <p className="text-lg font-bold">PHP {offerPrice.toFixed(2)}</p>
          
          {/* Show action buttons only to farmer when offer is pending */}
          {!isSender && offerStatus === 'pending' && isFarmer && onRespondToOffer && (
            <div className="flex gap-2 mt-3 pt-2 border-t border-white/20">
              <button
                onClick={() => handleResponse('accepted')}
                disabled={isResponding}
                className="flex-1 bg-white text-green-600 text-xs font-semibold py-1.5 px-3 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                {isResponding ? '...' : 'Accept'}
              </button>
              <button
                onClick={() => handleResponse('rejected')}
                disabled={isResponding}
                className="flex-1 bg-white/20 text-white text-xs font-semibold py-1.5 px-3 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}
          
          {/* Show status badge for sender when pending */}
          {isSender && offerStatus === 'pending' && (
            <p className="text-xs opacity-75 mt-1 italic">Waiting for response...</p>
          )}
        </div>
      </div>
    </div>
  );
}