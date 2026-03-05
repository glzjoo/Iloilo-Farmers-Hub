
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
}

export default function FarmerProductContext({ product, offerPrice, onAccept, onDecline, onSold, onClose }: FarmerProductContextProps) {
    const totalPrice = product.quantity ? product.price * product.quantity : null;

    if (offerPrice !== undefined && offerPrice !== null) {
        return (
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
                            <div className="flex gap-1.5 justify-center">
                                <button
                                    onClick={onDecline}
                                    className="bg-gray-500 hover:bg-gray-600 text-white text-[10px] font-medium px-2.5 py-1 rounded transition-colors"
                                >
                                    Decline
                                </button>
                                <button
                                    onClick={onAccept}
                                    className="bg-primary hover:bg-green-700 text-white text-[10px] font-medium px-2.5 py-1 rounded transition-colors"
                                >
                                    Accept
                                </button>
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
                        {onSold && (
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
        );
    }

    return (
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
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
    );
}