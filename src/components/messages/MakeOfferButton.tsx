import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReviewPromptModal from './ReviewPromptModal';

interface MakeOfferButtonProps {
  product: {
    name: string;
    price: number;
    unit: string;
    image: string;
  } | null;
  farmerName: string;
  onSubmitOffer: (offerPrice: number) => void;
  disabled?: boolean;
  remainingOffers?: number;
  orderStatus?: 'pending' | 'accepted' | 'completed' | null;
  onConfirmReceived?: () => void;
  conversationId?: string;
  productId?: string;
  farmerId?: string;
}

export default function MakeOfferButton({ 
  product, 
  farmerName, 
  onSubmitOffer, 
  disabled, 
  remainingOffers,
  orderStatus,
  onConfirmReceived,
  conversationId,
  productId,
  farmerId,
}: MakeOfferButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasConfirmedReceived, setHasConfirmedReceived] = useState(false); // Track if user clicked

  if (!product) return null;

  // If order is completed and user has confirmed received, show review modal
  if (orderStatus === 'completed' && hasConfirmedReceived) {
    return (
      <ReviewPromptModal
        isOpen={true}
        onClose={() => setHasConfirmedReceived(false)} // Allow closing without reviewing
        productId={productId || ''}
        farmerId={farmerId || ''}
      />
    );
  }

  // If order is accepted, show "Order Received" button
  if (orderStatus === 'accepted') {
    return (
      <div className="px-4 py-3 bg-blue-50 border-t border-blue-200">
        <p className="text-sm text-blue-800 text-center mb-2">
          Have you received the product?
        </p>
        <button
          onClick={() => {
            if (onConfirmReceived) {
              onConfirmReceived();
            }
            setHasConfirmedReceived(true); // Mark as confirmed, modal will show on next render
          }}
          className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          Order Received
        </button>
      </div>
    );
  }

  // If order is completed but user hasn't clicked "Order Received" yet
  // (this handles the case where page was refreshed)
  if (orderStatus === 'completed' && !hasConfirmedReceived) {
    return (
      <div className="px-4 py-3 bg-green-50 border-t border-green-200 text-center">
        <p className="text-sm text-green-800">
          Order completed!
        </p>
        <button
          onClick={() => setHasConfirmedReceived(true)}
          className="mt-2 text-sm text-green-600 underline hover:text-green-800"
        >
          Leave a review
        </button>
      </div>
    );
  }

  // Default: Show Make Offer button
  return (
    <>
      <button
        onClick={() => !disabled && setIsModalOpen(true)}
        disabled={disabled}
        className={`w-fit mx-auto px-8 py-2 rounded-full text-gray-700 font-semibold text-sm cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95`}
        style={{
          background: 'linear-gradient(180deg, rgba(220,252,231,0.7) 0%, rgba(187,247,208,0.4) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1.5px solid rgba(34,197,94,0.3)',
          boxShadow: '0 3px 12px rgba(34,197,94,0.12), 0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
      >
        {disabled ? 'Limit reached' : 'Make Offer'}
      </button>

      <MakeOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        farmerName={farmerName}
        onSubmitOffer={onSubmitOffer}
        disabled={disabled}
        remainingOffers={remainingOffers}
      />
    </>
  );
}

// Keep the existing MakeOfferModal component here (unchanged)
interface MakeOfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        name: string;
        price: number;
        unit: string;
        image: string;
    };
    farmerName: string;
    onSubmitOffer: (offerPrice: number) => void;
    disabled?: boolean;
    remainingOffers?: number;
}

function MakeOfferModal({ isOpen, onClose, product, farmerName, onSubmitOffer, disabled, remainingOffers }: MakeOfferModalProps) {
    const [offerPrice, setOfferPrice] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        const price = parseFloat(offerPrice);
        if (isNaN(price) || price <= 0) {
            alert('Please enter a valid offer price');
            return;
        }
        onSubmitOffer(price);
        setOfferPrice('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="w-full max-w-md rounded-xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-primary px-5 py-3 flex items-center justify-between">
                    <div className="text-white font-semibold text-md">
                        {farmerName} is selling this for PHP {product.price.toFixed(2)} per {product.unit}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-white cursor-pointer transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="bg-white p-6">
                    {remainingOffers !== undefined && (
                        <p className="text-center text-xs text-gray-500 mb-2">
                            You have {remainingOffers} offer{remainingOffers !== 1 ? 's' : ''} remaining
                        </p>
                    )}

                    <p className="text-center text-gray-500 text-sm mb-3">You are offering</p>
                    <div className="relative mb-6">
                        <input
                            type="number"
                            value={offerPrice}
                            onChange={(e) => setOfferPrice(e.target.value)}
                            placeholder={`PHP ${product.price.toFixed(2)}`}
                            className="w-full text-center text-2xl font-bold text-gray-800 bg-green-100/60 border border-green-200 rounded-lg py-4 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            style={{ MozAppearance: 'textfield' }}
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="flex justify-center">
                        <button
                            className='bg-primary rounded-full px-10 py-2.5 text-white font-semibold text-sm cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95'
                            onClick={handleSubmit}
                        >
                            Make offer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}