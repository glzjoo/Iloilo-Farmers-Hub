// ============================================
// FILE: src/components/shop/ItemSection.tsx (FIXED - ADD TO CART ACTUALLY WORKS)
// ============================================
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { Product } from '../../types';
import { getProductById } from '../../services/shopService';
import { addToCart } from '../../services/cartService'; // ADD THIS IMPORT
import { useAuth } from '../../context/AuthContext';
import ActionGuardModal from '../common/ActionGuardModal';
import ErrorModal from '../common/ErrorModal';

interface ItemSectionProps {
    productId?: string | null;
    product?: Product | null;
}

// Star display - whole stars only
function StarDisplay({ rating, size = 'text-lg' }: { rating: number; size?: string }) {
    const roundedRating = Math.round(rating);
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <span 
                    key={star} 
                    className={`${size} ${star <= roundedRating ? 'text-yellow-500' : 'text-gray-300'}`}
                >
                    ★
                </span>
            ))}
        </div>
    );
}

export default function ItemSection({ productId: propProductId, product: propProduct }: ItemSectionProps) {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, userProfile } = useAuth();
    const urlProductId = searchParams.get('id');
    
    const productId = propProductId || urlProductId;

    const [product, setProduct] = useState<Product | null>(propProduct || null);
    const [loading, setLoading] = useState(!propProduct);
    const [error, setError] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false); // ADD loading state

    const [showCartModal, setShowCartModal] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);

    useEffect(() => {
        if (propProduct) {
            setProduct(propProduct);
            setLoading(false);
            return;
        }

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
    }, [productId, propProduct]);

    const checkUserRole = (): 'guest' | 'farmer' | 'consumer' => {
        if (!user || !userProfile) return 'guest';
        return userProfile.role;
    };

    const handleMessageSeller = () => {
        const role = checkUserRole();
        
        if (role !== 'consumer') {
            setShowMessageModal(true);
            return;
        }

        if (!product) return;
        
        navigate('/messages', {
            state: {
                farmerId: product.farmerId,
                farmerName: product.farmerName,
                product: {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    unit: product.unit,
                    quantity: quantity 
                }
            }
        });
    };

    // FIXED: Actually calls addToCart service
    const handleAddToCart = async () => {
        const role = checkUserRole();
        
        if (role !== 'consumer') {
            setShowCartModal(true);
            return;
        }

        if (!product || !user) return;
        
        setAddingToCart(true);
        try {
            const stockValue = parseInt(product.stock.match(/^(\d+)/)?.[1] || '0');
            
            await addToCart(user.uid, {
                id: product.id,
                name: product.name,
                price: product.price,
                unit: product.unit,
                image: product.image,
                farmerId: product.farmerId,
                farmerName: product.farmerName || 'Unknown Farmer',
                stock: stockValue,
            }, quantity);

            alert(`Added ${quantity} ${product.unit} of ${product.name} to cart!`);
        } catch (err: any) {
            console.error('Add to cart error:', err);
            setErrorMessage(err.message || 'Failed to add to cart');
        } finally {
            setAddingToCart(false);
        }
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
                <div className="max-w-4xl mx-auto px-4 sm:px-10 text-center">
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

    const stockMatch = product.stock.match(/^(\d+)/);
    const stockValue = stockMatch ? parseInt(stockMatch[1]) : 0;
    const isOutOfStock = stockValue === 0;

    return (
        <section className="w-full py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-10 flex flex-col md:flex-row gap-6 md:gap-10">

                <div className="flex flex-col items-center w-full md:w-[320px] flex-shrink-0">
                    <div className="w-full h-[260px] rounded-xl overflow-hidden mb-3 bg-gray-100">
                        <img
                            src={product.image || '/placeholder-product.png'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                <div className="flex-1">
                    <div className="flex flex-wrap items-baseline gap-2 sm:gap-4 mb-1">
                        <h1 className="text-2xl sm:text-3xl font-primary font-bold text-black">{product.name}</h1>
                        <span className="text-lg sm:text-2xl font-primary text-gray-600">(₱{product.price} per {product.unit})</span>
                    </div>
                    
                    {/* Updated Rating Display */}
                    <div className="flex items-center gap-2 mb-3">
                        {product.rating > 0 ? (
                            <>
                                <StarDisplay rating={product.rating} />
                                <span className="text-sm font-primary text-gray-600">
                                    {product.rating.toFixed(1)} • {product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}
                                </span>
                            </>
                        ) : (
                            <span className="text-sm font-primary text-gray-500">No ratings yet</span>
                        )}
                    </div>

                    <p className="text-2xl sm:text-3xl font-primary font-bold text-primary mb-4">₱{product.price.toFixed(2)}</p>

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

                    <div className="flex flex-wrap gap-3 sm:gap-4 mt-8 md:mt-16">
                        <button
                            onClick={handleAddToCart}
                            disabled={isOutOfStock || addingToCart}
                            className="px-8 py-2.5 border-2 border-primary text-primary font-primary font-semibold rounded-full cursor-pointer bg-white hover:bg-green-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed"
                        >
                            {addingToCart ? 'Adding...' : isOutOfStock ? 'Out of Stock' : 'Add to cart'}
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

            <ActionGuardModal
                isOpen={showCartModal}
                action="addToCart"
                userRole={checkUserRole()}
                onClose={() => setShowCartModal(false)}
            />

            <ActionGuardModal
                isOpen={showMessageModal}
                action="messageSeller"
                userRole={checkUserRole()}
                onClose={() => setShowMessageModal(false)}
            />

            <ErrorModal
                isOpen={Boolean(errorMessage)}
                title="Cart error"
                message={errorMessage}
                onClose={() => setErrorMessage('')}
            />
        </section>
    );
}