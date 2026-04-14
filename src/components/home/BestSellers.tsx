import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import filter from '../../assets/icons/Filter.svg';
import buyItem from '../../assets/icons/buy-item.svg';
import addtocart from '../../assets/icons/add-to-cart.svg';
import type { Product } from '../../types';
import { getBestSellers } from '../../services/shopService';

export default function BestSellers() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBestSellers = async () => {
            try {
                setLoading(true);
                const fetched = await getBestSellers(15); // Target 15, fallback 10→5
                setProducts(fetched);
            } catch (err) {
                console.error('Error loading best sellers:', err);
                setError('Failed to load best sellers');
            } finally {
                setLoading(false);
            }
        };

        fetchBestSellers();
    }, []);

    const handleProductClick = (productId: string) => {
        navigate(`/item/${productId}`);
    };

    // Loading skeleton
    if (loading) {
        return (
            <section className="w-full py-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-heading text-2xl font-bold text-primary">Best Sellers</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="w-full h-32 bg-neutral-300 rounded-lg mb-2"></div>
                                <div className="h-4 bg-neutral-300 rounded w-3/4 mb-1"></div>
                                <div className="h-4 bg-neutral-300 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // Error state
    if (error || products.length === 0) {
        return (
            <section className="w-full py-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-heading text-2xl font-bold text-primary">Best Sellers</h2>
                    </div>
                    <div className="text-center py-8 text-neutral-500">
                        <p>No best sellers yet. Check out our shop!</p>
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
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-heading text-2xl font-bold text-primary">Best Sellers</h2>
                    <button className="flex items-center gap-2 bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity">
                        <img src={filter} className="w-5 h-5" alt="Filter" />
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="cursor-pointer group"
                            onClick={() => handleProductClick(product.id)}
                        >
                            <div className="relative overflow-hidden rounded-lg">
                                <img
                                    src={product.image || '/placeholder-product.png'}
                                    alt={product.name}
                                    className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                                />
                                {(product.soldCount || 0) > 0 && (
                                    <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                                        {product.soldCount} sold
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between mt-2">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-body text-sm font-semibold text-primary truncate">{product.name}</h3>
                                    <p className="font-body text-leaf text-xs font-semibold">
                                        ₱{product.price.toFixed(2)} / {product.unit}
                                    </p>
                                    {product.rating > 0 && (
                                        <p className="text-xs text-yellow-500">★ {product.rating.toFixed(1)}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 ml-2">
                                    <button
                                        className="bg-transparent border-none cursor-pointer p-0 hover:scale-110 transition-transform"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleProductClick(product.id);
                                        }}
                                    >
                                        <img src={addtocart} alt="Add to cart" className="w-7 h-7" />
                                    </button>
                                    <button
                                        className="bg-transparent border-none cursor-pointer p-0 hover:scale-110 transition-transform"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleProductClick(product.id);
                                        }}
                                    >
                                        <img src={buyItem} alt="Buy item" className="w-7 h-7" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}