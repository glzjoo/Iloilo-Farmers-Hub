import { useParams, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Product } from '../types';
import { getProductById } from '../services/shopService';
import ItemSection from "../components/shop/ItemSection";
import RelatedProducts from "../components/shop/RelatedProducts";
import ItemReview from "../components/reviews/ItemReview";

export default function ItemsDetailsPage() {
    const params = useParams<{ productId: string }>();
    const location = useLocation();
    
    // Get productId from URL path param, or query param, or state
    const urlProductId = params.productId;
    const queryParams = new URLSearchParams(location.search);
    const queryProductId = queryParams.get('id');
    const stateProductId = (location.state as any)?.productId;
    
    // Use the first available productId
    const productId = urlProductId || queryProductId || stateProductId;

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    console.log('ItemsDetailsPage - URL params:', params);
    console.log('ItemsDetailsPage - Query params:', location.search);
    console.log('ItemsDetailsPage - Resolved productId:', productId);
    // Add at the top of ItemsDetailsPage component
    console.log('=== DEBUG ItemsDetailsPage ===');
    console.log('Full pathname:', window.location.pathname);
    console.log('Full search:', window.location.search);
    console.log('useParams result:', params);
    console.log('===============================');
    
    useEffect(() => {
        console.log('ItemsDetailsPage useEffect triggered, productId:', productId);
        
        if (!productId) {
            console.log('No productId available');
            setLoading(false);
            return;
        }

        const fetchProduct = async () => {
            try {
                setLoading(true);
                console.log('Fetching product:', productId);
                const fetchedProduct = await getProductById(productId);
                console.log('Fetched product:', fetchedProduct);
                setProduct(fetchedProduct);
            } catch (err) {
                console.error('Failed to load product:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!productId) {
        return (
            <div className="text-center py-12 text-gray-500">
                No product selected. Please browse the shop to view item details.
            </div>
        );
    }

    return (
        <>
            <ItemSection productId={productId} product={product} />
            <RelatedProducts productId={productId} />
            <ItemReview productId={productId} />
        </>
    );
}