import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number, totalPrice: number) => void;
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    unit: string;
  };
  consumerId: string;
  conversationId: string;
  lastAcceptedOfferPrice: number | null | undefined;
}

export default function OrderConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  product,
  consumerId,
  conversationId: _conversationId,
  lastAcceptedOfferPrice,
}: OrderConfirmationModalProps) {
  const { user: _user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [consumerName, setConsumerName] = useState('');

  // Fetch quantity from consumer's cart and consumer name
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch consumer name
        const consumerDoc = await getDoc(doc(db, 'consumers', consumerId));
        if (consumerDoc.exists()) {
          const data = consumerDoc.data();
          setConsumerName(`${data.firstName} ${data.lastName}`);
        }

        // Use 'carts' (plural) not 'cart'
        const cartsRef = collection(db, 'carts');
        const q = query(
          cartsRef,
          where('userId', '==', consumerId),
          where('productId', '==', product.id)
        );
        const cartSnap = await getDocs(q);

        if (!cartSnap.empty) {
          const cartData = cartSnap.docs[0].data();
          setQuantity(cartData.quantity || 1);
        }
      } catch (error) {
        console.error('Error fetching order data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, consumerId, product.id]);

  if (!isOpen) return null;

  // Use last accepted offer price or default product price
  const pricePerUnit = lastAcceptedOfferPrice || product.price;
  const totalPrice = pricePerUnit * quantity;

  const handleConfirm = () => {
    onConfirm(quantity, totalPrice);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl overflow-hidden shadow-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary px-5 py-3 flex items-center justify-between">
          <div className="text-white font-semibold text-md">
            Confirm Order
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Product Details */}
              <div className="flex gap-4 mb-6">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">To: {consumerName}</p>
                  <p className="text-primary font-bold mt-1">
                    ₱{pricePerUnit.toFixed(2)} / {product.unit}
                  </p>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
                <div className="flex items-center gap-3 mb-4">
                  <label className="text-sm font-medium text-gray-700">Quantity:</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center border border-gray-300 rounded-lg py-1"
                      min="1"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">{product.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price per unit:</span>
                  <span>₱{pricePerUnit.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-primary text-lg">₱{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-green-700 transition-colors"
                >
                  Confirm Order
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}