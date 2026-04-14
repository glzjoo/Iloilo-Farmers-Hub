// ============================================
// FILE: src/components/home/NowAvailable.tsx 
// ============================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../types';
import { getNewArrivals } from '../../services/shopService';

// Star display component - whole stars only
function StarDisplay({ rating }: { rating: number }) {
    const roundedRating = Math.round(rating);
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <span 
                    key={star} 
                    className={`text-xs ${star <= roundedRating ? 'text-yellow-400' : 'text-gray-400'}`}
                >
                    ★
                </span>
            ))}
        </div>
    );
}

export default function NowAvailable() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchNewArrivals = async () => {
            try {
                setLoading(true);
                const fetched = await getNewArrivals(4);
                setProducts(fetched);
            } catch (err) {
                console.error('Error loading new arrivals:', err);
                setError('Failed to load new arrivals');
            } finally {
                setLoading(false);
            }
        };

        fetchNewArrivals();
    }, []);

    const handleProductClick = (productId: string) => {
        navigate(`/item/${productId}`);
    };

    if (loading) {
        return (
            <section className="w-full py-8">
                <div className="flex flex-wrap gap-4 justify-center">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-[300px] h-[510px] bg-gray-200 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            </section>
        );
    }

    if (error || products.length === 0) {
        return (
            <section className="w-full py-8">
                <div className="flex flex-wrap gap-4 justify-center">
                    <div className="text-center py-12 text-gray-500 w-full">
                        <p>Check back soon for fresh arrivals!</p>
                        <button 
                            onClick={() => navigate('/shop')}
                            className="mt-2 text-primary hover:underline"
                        >
                            Browse All Products
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full py-8">
            <div className="flex flex-wrap gap-4 justify-center">
                {products.map((product) => (
                    <div 
                        key={product.id} 
                        className="relative w-[300px] h-[510px] rounded-lg overflow-hidden cursor-pointer group"
                        onClick={() => handleProductClick(product.id)}
                    >
                        <img 
                            src={product.image || '/placeholder-product.png'} 
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-6 pt-16 bg-gradient-to-t from-black/60 to-transparent">
                            <p className="text-sm text-white/80">Now Available</p>
                            <h3 className="text-xl font-bold text-white mb-1">{product.name}</h3>
                            <p className="text-white/90 text-sm mb-2">₱{product.price.toFixed(2)} / {product.unit}</p>
                            
                            {/* Stars only - no count */}
                            {product.rating > 0 && (
                                <div className="mb-2">
                                    <StarDisplay rating={product.rating} />
                                </div>
                            )}
                            
                            <button 
                                className="bg-white text-primary font-bold rounded-full px-6 py-2 text-lg cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleProductClick(product.id);
                                }}
                            >
                                Order now
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}