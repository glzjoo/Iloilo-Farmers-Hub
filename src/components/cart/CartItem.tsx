interface CartItemProps {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    unit: string;
    image: string;
    farmerName: string;
    farmerId: string;
    onQuantityChange: (productId: string, quantity: number) => void;
    onRemove: (productId: string) => void;
    onMessageSeller: () => void;
    isUpdating?: boolean;
}

export default function CartItem({
    productId,
    name,
    price,
    quantity,
    unit,
    image,
    farmerName,
    onQuantityChange,
    onRemove,
    onMessageSeller,
    isUpdating
}: CartItemProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 py-5 sm:py-6 border-b border-gray-200">
            {/* Top row: image + product details */}
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                <img src={image} alt={name} className="w-20 h-20 sm:w-28 sm:h-28 object-cover rounded-lg flex-shrink-0" />

                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4 mb-1">
                        <h3 className="text-lg sm:text-2xl font-primary font-semibold text-black truncate">{name}</h3>
                        <span className="text-sm sm:text-lg font-primary text-gray-500">(₱{price} per {unit})</span>
                    </div>
                    <p className="text-sm font-primary text-gray-500 mb-2">
                        Farm: <span className="text-black underline">{farmerName}</span>
                    </p>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-primary text-gray-500">Quantity:</span>
                        <button
                            onClick={() => onQuantityChange(productId, quantity - 1)}
                            disabled={isUpdating || quantity <= 1}
                            className="w-8 h-8 sm:w-7 sm:h-7 rounded-full border border-gray-300 bg-white flex items-center justify-center cursor-pointer text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                        >−</button>
                        <span className="text-lg font-primary font-semibold w-6 text-center">
                            {isUpdating ? '...' : quantity}
                        </span>
                        <button
                            onClick={() => onQuantityChange(productId, quantity + 1)}
                            disabled={isUpdating}
                            className="w-8 h-8 sm:w-7 sm:h-7 rounded-full border border-gray-300 bg-white flex items-center justify-center cursor-pointer text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                        >+</button>
                    </div>
                </div>
            </div>

            {/* Bottom row on mobile */}
            <div className="flex items-right justify-between sm:flex-col sm:items-end gap-3 sm:gap-2 pl-0 sm:pl-0">
                <p className="text-xl sm:text-2xl font-primary font-bold text-primary flex-shrink-0">
                    ₱{(price * quantity).toFixed(2)}
                </p>

                <div className="flex items-right sm:flex-col gap-2">
                    <button
                        onClick={() => onRemove(productId)}
                        className="px-4 py-2 sm:py-1.5 bg-red-600 text-white text-sm font-primary font-medium rounded-full cursor-pointer border-none hover:bg-red-700"
                    >
                        Remove
                    </button>
                    <button
                        onClick={onMessageSeller}
                        className="px-4 py-2 sm:py-1.5 bg-primary text-white text-sm font-primary font-medium rounded-full cursor-pointer border-none hover:bg-green-700"
                    >
                        Message Seller
                    </button>
                </div>
            </div>
        </div>
    );
}
