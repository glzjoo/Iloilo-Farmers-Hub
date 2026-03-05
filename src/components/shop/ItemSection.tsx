import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { Product } from '../../types';
import { getProductById } from '../../services/shopService';

export default function ItemSection() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const productId = searchParams.get('id');

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
//    const [selectedImage, setSelectedImage] = useState(0); for carousel, but we only have one image for now
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!productId) {
                setError('No product selected');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const fetchedProduct = await getProductById(productId);
                if (!fetchedProduct) {
                    setError('Product not found');
                } else {
                    setProduct(fetchedProduct);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load product');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

// For now, we only have one image per product, so the navigation is simplified
//    const handlePrev = () => {
//        setSelectedImage((prev) => (prev === 0 ? 0 : prev - 1));
//    };
//
//    const handleNext = () => {
//        setSelectedImage((prev) => (prev === 0 ? 0 : prev + 1));
//   };

    const handleMessageSeller = () => {
        // TODO: Navigate to messaging with this farmer
        console.log('Message farmer:', product?.farmerId);
        alert(`Messaging feature coming soon! Farmer: ${product?.farmerName}`);
    };

    const handleAddToCart = () => {
        if (!product) return;
        // TODO: Implement cart functionality
        console.log(`Added ${quantity} ${product.unit} of ${product.name} to cart`);
        alert(`Added ${quantity} ${product.unit} of ${product.name} to cart`);
    };

    if (loading) {
        return (
            <section className="w-full py-12">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </section>
        );
    }

    if (error || !product) {
        return (
            <section className="w-full py-12">
                <div className="max-w-4xl mx-auto px-10 text-center">
                    <p className="text-red-500 text-xl">{error || 'Product not found'}</p>
                    <button
                        onClick={() => navigate('/shop')}
                        className="mt-4 px-6 py-2 bg-primary text-white rounded-lg"
                    >
                        Back to Shop
                    </button>
                </div>
            </section>
        );
    }

    // Parse stock value
    const stockMatch = product.stock.match(/^(\d+)/);
    const stockValue = stockMatch ? parseInt(stockMatch[1]) : 0;
    const isOutOfStock = stockValue === 0;

    return (
        <section className="w-full py-12">
            <div className="max-w-4xl mx-auto px-10 flex gap-10">
                // REPLACE the image section with this simpler version:
                <div className="flex flex-col items-center w-[320px] flex-shrink-0">
                    <div className="w-full h-[260px] rounded-xl overflow-hidden mb-3 bg-gray-100">
                        <img
                            src={product.image || '/placeholder-product.png'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Product details */}
                <div className="flex-1">
                    <div className="flex items-baseline gap-4 mb-1">
                        <h1 className="text-3xl font-primary font-bold text-black">{product.name}</h1>
                        <span className="text-2xl font-primary text-gray-600">(₱{product.price} per {product.unit})</span>
                    </div>
                    <p className="text-sm font-primary text-gray-500 mb-3">
                        {product.rating > 0 ? (
                            <>
                                {product.rating} <span className="text-yellow-500">★</span> | {product.reviewCount} Ratings
                            </>
                        ) : (
                            'No ratings yet'
                        )}
                    </p>

                    <p className="text-3xl font-primary font-bold text-primary mb-4">₱{product.price.toFixed(2)}</p>

                    <div className="flex gap-4 mb-2">
                        <span className="text-sm font-primary text-gray-500 w-20">Category:</span>
                        <span className="text-sm font-primary font-semibold text-black">{product.category}</span>
                    </div>
                    <div className="flex gap-4 mb-2">
                        <span className="text-sm font-primary text-gray-500 w-20">Stock:</span>
                        <span className={`text-sm font-primary font-semibold ${isOutOfStock ? 'text-red-500' : 'text-black'}`}>
                            {product.stock}
                        </span>
                    </div>
                    <div className="flex gap-4 mb-2">
                        <span className="text-sm font-primary text-gray-500 w-20">Details:</span>
                        <span className="text-sm font-primary font-semibold text-black">{product.description || 'No description available'}</span>
                    </div>
                    <div className="flex gap-4 mb-2">
                        <span className="text-sm font-primary text-gray-500 w-20">Farm:</span>
                        <span className="text-sm font-primary font-semibold text-black underline cursor-pointer hover:text-primary">
                            {product.farmerName || 'Unknown Farm'}
                        </span>
                    </div>
                    <div className="flex gap-4 items-center mb-6">
                        <span className="text-sm font-primary text-gray-500 w-20">Quantity:</span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                disabled={isOutOfStock}
                                className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center cursor-pointer text-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                −
                            </button>
                            <span className="text-lg font-primary font-semibold w-8 text-center">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                disabled={isOutOfStock}
                                className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center cursor-pointer text-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-16">
                        <button
                            onClick={handleAddToCart}
                            disabled={isOutOfStock}
                            className="px-8 py-2.5 border-2 border-primary text-primary font-primary font-semibold rounded-full cursor-pointer bg-white hover:bg-green-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed"
                        >
                            {isOutOfStock ? 'Out of Stock' : 'Add to cart'}
                        </button>
                        <button
                            onClick={handleMessageSeller}
                            className="px-8 py-2.5 bg-primary text-white font-primary font-semibold rounded-full cursor-pointer border-none hover:bg-green-700"
                        >
                            Message Seller
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}