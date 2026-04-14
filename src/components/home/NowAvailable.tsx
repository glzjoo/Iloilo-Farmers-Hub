import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../types';
import { getNewArrivals } from '../../services/shopService';

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
                    <div className="text-center py-12 text-neutral-500 w-full">
                        <p>Check back soon for fresh arrivals!</p>
                        <button 
                            onClick={() => navigate('/shop')}
                            className="mt-2 text-leaf hover:underline font-semibold"
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
                        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-6 pt-16 bg-gradient-to-t from-black/70 to-transparent">
                            <p className="font-body text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">Now Available</p>
                            <h3 className="font-heading text-xl font-bold text-white mb-1 capitalize">{product.name}</h3>
                            <p className="font-body text-white/90 text-sm mb-1">₱{product.price.toFixed(2)} / {product.unit}</p>
                            {product.rating > 0 && (
                                <p className="text-yellow-400 text-xs mb-3">★ {product.rating.toFixed(1)}</p>
                            )}
                            <button 
                                className="font-body bg-white text-primary font-semibold rounded-full px-6 py-2 text-sm cursor-pointer hover:bg-accent active:scale-95 transition-all duration-200"
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