// src/components/messages/ProductContext.tsx
interface ProductContextProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    unit: string;
  };
  onClose?: () => void;
}

export default function ProductContext({ product, onClose }: ProductContextProps) {
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
          <p className="text-xs text-gray-500 mt-1">
            You're discussing this product
          </p>
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