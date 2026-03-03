import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Product } from '../../types';
import { getRelatedProducts } from '../../services/ShopService';

export default function RelatedProducts() {
    const [searchParams] = useSearchParams();
    const productId = searchParams.get('id');
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelated = async () => {
            if (!productId) return;
            
            try {
                // First get current product to know its category
                const { getProductById } = await import('../../services/ShopService');
                const currentProduct = await getProductById(productId);
                
                if (currentProduct) {
                    const related = await getRelatedProducts(
                        currentProduct.category, 
                        productId, 
                        5
                    );
                    setRelatedProducts(related);
                }
            } catch (error) {
                console.error('Error fetching related products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRelated();
    }, [productId]);

    if (loading || relatedProducts.length === 0) {
        return null; // Don't show section if no related products
    }

    return (
        <section className="w-full py-8 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-3xl font-primary text-center font-semi-bold text-black mb-8">Related Products</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {relatedProducts.map((product) => (
                        <a 
                            key={product.id}
                            href={`/item-details?id=${product.id}`}
                            className="block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                            <img 
                                src={product.image || '/placeholder-product.png'} 
                                alt={product.name}
                                className="w-full h-32 object-cover"
                            />
                            <div className="p-3">
                                <h3 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h3>
                                <p className="text-primary text-xs font-semibold">₱{product.price.toFixed(2)} / {product.unit}</p>
                                <p className="text-xs text-gray-500 truncate">{product.farmerName}</p>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}