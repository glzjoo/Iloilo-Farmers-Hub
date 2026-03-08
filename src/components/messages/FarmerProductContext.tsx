import { useState } from 'react';
import OrderConfirmationModal from './OrderConfirmationModal';

interface FarmerProductContextProps {
    product: {
        id: string;
        name: string;
        price: number;
        image: string;
        unit: string;
        quantity?: number;
    };
    offerPrice?: number | null;
    onAccept?: () => void;
    onDecline?: () => void;
    onSold?: () => void;
    onClose?: () => void;
    consumerId?: string;
    conversationId?: string;
    lastAcceptedOfferPrice?: number | null;
    onSendOrderRequest?: (quantity: number, totalPrice: number) => void;
}

export default function FarmerProductContext({ 
    product, 
    offerPrice, 
    onSold, 
    onClose,
    consumerId,
    conversationId,
    lastAcceptedOfferPrice,
    onSendOrderRequest,
}: FarmerProductContextProps) {
    const [showOrderModal, setShowOrderModal] = useState(false);
    const totalPrice = product.quantity ? product.price * product.quantity : null;

    const handleSoldClick = () => {
        console.log('Sold clicked - onSendOrderRequest:', !!onSendOrderRequest, 'consumerId:', consumerId, 'conversationId:', conversationId);
        
        if (onSendOrderRequest && consumerId && conversationId) {
            setShowOrderModal(true);
        } else if (onSold) {
            onSold();
        }
    };

    const handleConfirmOrder = (quantity: number, totalPrice: number) => {
        console.log('Confirming order:', { quantity, totalPrice });
        if (onSendOrderRequest) {
            onSendOrderRequest(quantity, totalPrice);
        }
    };

    // When there's an active offer - show offer UI with Sold button
    if (offerPrice !== undefined && offerPrice !== null) {
        return (
            <>
                <div className="bg-green-50/30 border-b border-gray-200 px-4 py-3">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                            {/* Image and Buttons */}
                            <div className="flex flex-col gap-2">
                                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                    {product.image && (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                    )}
                                </div>
                            </div>

                            {/* Offer Details */}
                            <div className="flex flex-col justify-start pt-1">
                                <p className="text-red-500 font-medium text-xs mb-0.5">Offered you</p>
                                <p className="text-gray-900 font-bold text-lg leading-none">
                                    PHP {offerPrice.toFixed(2)}
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                    / {product.quantity || 1} {product.unit} {product.name}
                                </p>
                            </div>
                        </div>

                        {/* Sold Button*/}
                        <div className="flex items-start pt-2">
                            {onSendOrderRequest && consumerId ? (
                                <button
                                    onClick={handleSoldClick}
                                    className="bg-primary hover:bg-green-700 text-white text-xs font-medium px-6 py-1.5 rounded transition-colors"
                                >
                                    Sold
                                </button>
                            ) : onSold && (
                                <button
                                    onClick={onSold}
                                    className="bg-primary hover:bg-green-700 text-white text-xs font-medium px-6 py-1.5 rounded transition-colors"
                                >
                                    Sold
                                </button>
                            )}
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 p-1 ml-2 -mt-1 -mr-2"
                                    title="Hide offer"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Order Confirmation Modal */}
                {consumerId && conversationId && (
                    <OrderConfirmationModal
                        isOpen={showOrderModal}
                        onClose={() => setShowOrderModal(false)}
                        onConfirm={handleConfirmOrder}
                        product={product}
                        consumerId={consumerId}
                        conversationId={conversationId}
                        lastAcceptedOfferPrice={lastAcceptedOfferPrice ?? null}
                    />
                )}
            </>
        );
    }

    // When there's NO offer - show basic product info WITH Sold button
    return (
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {product.name}
                        </h3>
                        <p className="text-lg font-bold text-primary">
                            ₱{product.price.toFixed(2)} <span className="text-sm font-normal text-gray-500">per {product.unit}</span>
                        </p>
                        {product.quantity && totalPrice ? (
                            <p className="text-xs text-gray-500 mt-1">
                                Qty: {product.quantity} · Total: <span className="font-semibold text-gray-700">₱{totalPrice.toFixed(2)}</span>
                            </p>
                        ) : (
                            <p className="text-xs text-gray-500 mt-1">
                                You're discussing this product
                            </p>
                        )}
                    </div>
                </div>
                
                {/* ADDED: Sold button for when there's no offer */}
                <div className="flex items-center gap-2">
                    {onSendOrderRequest && consumerId && conversationId && (
                        <button
                            onClick={handleSoldClick}
                            className="bg-primary hover:bg-green-700 text-white text-xs font-medium px-6 py-1.5 rounded transition-colors"
                        >
                            Sold
                        </button>
                    )}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            title="Hide product info"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Order Confirmation Modal - ALSO NEEDED HERE */}
            {consumerId && conversationId && onSendOrderRequest && (
                <OrderConfirmationModal
                    isOpen={showOrderModal}
                    onClose={() => setShowOrderModal(false)}
                    onConfirm={handleConfirmOrder}
                    product={product}
                    consumerId={consumerId}
                    conversationId={conversationId}
                    lastAcceptedOfferPrice={lastAcceptedOfferPrice ?? null}
                />
            )}
        </div>
    );
}