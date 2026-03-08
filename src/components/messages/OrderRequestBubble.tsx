// src/components/messages/OrderRequestBubble.tsx
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

interface OrderRequestBubbleProps {
  orderDetails: {
    productName: string;
    productImage: string;
    pricePerUnit: number;
    quantity: number;
    totalPrice: number;
    unit: string;
  };
  isSender: boolean;
  orderStatus?: 'pending' | 'accepted' | 'rejected' | 'completed';
  messageId: string;
  onRespondToOrder?: (messageId: string, response: 'accepted' | 'rejected') => Promise<void>;
}

export default function OrderRequestBubble({
  orderDetails,
  isSender,
  orderStatus = 'pending',
  messageId,
  onRespondToOrder,
}: OrderRequestBubbleProps) {
  const { userProfile } = useAuth();
  const isConsumer = userProfile?.role === 'consumer';
  const [isResponding, setIsResponding] = useState(false);

  const handleResponse = async (response: 'accepted' | 'rejected') => {
    if (!onRespondToOrder || isResponding) return;
    setIsResponding(true);
    try {
      await onRespondToOrder(messageId, response);
    } catch (error) {
      console.error('Failed to respond to order:', error);
      alert('Failed to respond. Please try again.');
    } finally {
      setIsResponding(false);
    }
  };

  const getStatusDisplay = () => {
    if (orderStatus === 'accepted') {
      return {
        text: isSender ? 'Order accepted' : 'You accepted the order',
        bgColor: isSender ? 'bg-green-500' : 'bg-green-600',
        icon: '✅',
        subText: 'Preparing for delivery...',
      };
    }
    if (orderStatus === 'rejected') {
      return {
        text: isSender ? 'Order rejected' : 'You rejected the order',
        bgColor: isSender ? 'bg-red-400' : 'bg-red-500',
        icon: '❌',
        subText: isSender ? 'Consumer rejected this order' : 'Order cancelled',
      };
    }
    return {
      text: isSender ? 'Order sent' : 'New order request',
      bgColor: isSender ? 'bg-primary' : 'bg-[#5f6a5d]',
      subText: isSender ? 'Waiting for confirmation...' : 'Review and respond',
    };
  };

  const status = getStatusDisplay();

  return (
    <div className={`flex items-end gap-2 mb-1 ${isSender ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="w-8 flex-shrink-0" />
      
      <div className={`max-w-[70%] ${isSender ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 shadow-sm ${status.bgColor} text-white ${isSender ? 'rounded-br-none' : 'rounded-bl-none'}`}>
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span>{status.icon}</span>
            <p className="text-xs font-medium opacity-90">{status.text}</p>
          </div>

          {/* Product Image */}
          <div className="flex gap-3 mb-3">
            <img
              src={orderDetails.productImage}
              alt={orderDetails.productName}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div className="flex-1">
              <p className="font-semibold text-sm">{orderDetails.productName}</p>
              <p className="text-xs opacity-90">Qty: {orderDetails.quantity} {orderDetails.unit}</p>
              <p className="text-xs opacity-90">₱{orderDetails.pricePerUnit.toFixed(2)} each</p>
            </div>
          </div>

          {/* Total Price */}
          <div className="bg-white/20 rounded-lg px-3 py-2 mb-3">
            <p className="text-xs opacity-75">Total Amount</p>
            <p className="text-xl font-bold">₱{orderDetails.totalPrice.toFixed(2)}</p>
          </div>

          {/* ACTION BUTTONS - Only for consumer when pending */}
          {!isSender && orderStatus === 'pending' && isConsumer && onRespondToOrder && (
            <div className="flex gap-2 mt-2 pt-2 border-t border-white/20">
              <button
                onClick={() => handleResponse('rejected')}
                disabled={isResponding}
                className="flex-1 bg-white/20 text-white text-xs font-semibold py-2 px-3 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                {isResponding ? '...' : 'Reject'}
              </button>
              <button
                onClick={() => handleResponse('accepted')}
                disabled={isResponding}
                className="flex-1 bg-white text-green-600 text-xs font-semibold py-2 px-3 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                {isResponding ? '...' : 'Accept'}
              </button>
            </div>
          )}

          {/* Status message for sender */}
          {isSender && orderStatus === 'pending' && (
            <p className="text-xs opacity-75 mt-1 italic">{status.subText}</p>
          )}

          {/* Final status display */}
          {orderStatus !== 'pending' && (
            <p className="text-xs opacity-90 mt-1">{status.subText}</p>
          )}
        </div>
      </div>
    </div>
  );
}