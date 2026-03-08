import { useNavigate } from 'react-router-dom';

interface ReviewPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  farmerId: string;
}

export default function ReviewPromptModal({
  isOpen,
  onClose,
  productId,
  farmerId,
}: ReviewPromptModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleReviewNow = () => {
    // Navigate to review page with state
    navigate('/review-farmer', {
      state: {
        productId,
        farmerId,
        fromOrder: true,
      },
    });
    onClose();
  };

  const handleMaybeLater = () => {
    // Just close the modal, user can review later from order history
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" 
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-white p-6 text-center mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Icon */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg 
            className="w-8 h-8 text-green-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Order Received!
        </h3>
        
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          Have a moment to share your experience? Your feedback helps other buyers and supports local farmers.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleReviewNow}
            className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-green-700 transition-colors duration-200"
          >
            Review Now!
          </button>
          
          <button
            onClick={handleMaybeLater}
            className="w-full py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}