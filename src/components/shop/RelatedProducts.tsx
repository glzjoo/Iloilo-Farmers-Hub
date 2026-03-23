import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { Product } from '../../types';
import { getRelatedProducts, getProductById } from '../../services/shopService';

interface RelatedProductsProps {
    productId?: string | null;
}

// Trending Algorithm Score Calculator (same as ShopAll but with category filter))
const calculateTrendingScore = (product: Product): number => {
    const ratingScore = (product.rating || 0) * 0.4;
    const soldScore = Math.log10((product.soldCount || 0) + 1) * 0.3;
    const reviewScore = Math.log10((product.reviewCount || 0) + 1) * 0.2;
    
    let recencyScore = 0;
    if (product.createdAt) {
        const now = new Date();
        const createdAt = product.createdAt?.toDate?.() || new Date(product.createdAt);
        const daysSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceCreated <= 14) {
            recencyScore = 0.1 * (1 - daysSinceCreated / 14);
        }
    }
    
    return ratingScore + soldScore + reviewScore + recencyScore;
};

export default function RelatedProducts({ productId: propProductId }: RelatedProductsProps) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const urlProductId = searchParams.get('id');
    
    const productId = propProductId || urlProductId;
    
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelated = async () => {
            if (!productId) return;

            try {
                const currentProduct = await getProductById(productId);

                if (currentProduct) {
                    // Get same category products (get extra for sorting)
                    const related = await getRelatedProducts(
                        currentProduct.category,
                        productId,
                        10 // Get 10, then sort and take top 5
                    );
                    
                    // Sort by trending score (highest first) and take top 5
                    const sortedByTrending = related
                        .map(p => ({ product: p, score: calculateTrendingScore(p) }))
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 5)
                        .map(item => item.product);
                    
                    setRelatedProducts(sortedByTrending);
                }
            } catch (error) {
                console.error('Error fetching related products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRelated();
    }, [productId]);

    const handleProductClick = (id: string) => {
        navigate(`/item/${id}`);
        // Scroll to top when navigating to related product
        window.scrollTo(0, 0);
    };

    if (loading || relatedProducts.length === 0) {
        return null;
    }

    return (
        <section className="w-full py-8 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-3xl font-primary text-left-aligned font-semibold text-black mb-8">
                    Related Products
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {relatedProducts.map((product) => (
                        <div
                            key={product.id}
                            onClick={() => handleProductClick(product.id)}
                            className="block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        >
                            <img
                                src={product.image || '/placeholder-product.png'}
                                alt={product.name}
                                className="w-full h-32 object-cover"
                            />
                            <div className="p-3">
                                <h3 className="text-sm font-semibold text-gray-900 truncate">
                                    {product.name}
                                </h3>
                                <p className="text-primary text-xs font-semibold">
                                    ₱{product.price.toFixed(2)} / {product.unit}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {product.farmerName}
                                </p>
                                {(product.soldCount || 0) > 0 && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        {product.soldCount} sold • ★ {product.rating.toFixed(1)}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}