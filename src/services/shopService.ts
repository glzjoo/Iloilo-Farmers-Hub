import { 
    collection, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit,
    updateDoc,
    doc,
    increment,
    type QuerySnapshot,
    type DocumentData
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Product } from '../types';

const PRODUCTS_COLLECTION = 'products';

// Helper to convert Firestore data to Product type
const convertDocToProduct = (doc: DocumentData): Product => {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name,
        price: data.price,
        image: data.image,
        category: data.category,
        farmerId: data.farmerId,
        farmerName: data.farmerName || 'Unknown Farmer',
        description: data.description,
        rating: data.rating || 0,
        reviewCount: data.reviewCount || 0,
        stock: data.stock,
        unit: data.unit,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        soldCount: data.soldCount || 0, 
    };
};

// Get all active products for shop
export const getShopProducts = async (): Promise<Product[]> => {
    try {
        const q = query(
            collection(db, PRODUCTS_COLLECTION),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
        return querySnapshot.docs.map(convertDocToProduct);
    } catch (error) {
        console.error('Error fetching shop products:', error);
        throw new Error('Failed to fetch products.');
    }
};

// Get products by category
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
    try {
        const q = query(
            collection(db, PRODUCTS_COLLECTION),
            where('status', '==', 'active'),
            where('category', '==', category),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
        return querySnapshot.docs.map(convertDocToProduct);
    } catch (error) {
        console.error('Error fetching products by category:', error);
        throw new Error('Failed to fetch products.');
    }
};

// Get single product by ID
export const getProductById = async (productId: string): Promise<Product | null> => {
    try {
        const q = query(
            collection(db, PRODUCTS_COLLECTION),
            where('__name__', '==', productId),
            where('status', '==', 'active')
        );
        
        const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
        if (querySnapshot.empty) return null;
        return convertDocToProduct(querySnapshot.docs[0]);
    } catch (error) {
        console.error('Error fetching product:', error);
        throw new Error('Failed to fetch product.');
    }
};

// Get related products (same category, exclude current product)
export const getRelatedProducts = async (category: string, excludeProductId: string, limitCount: number = 5): Promise<Product[]> => {
    try {
        const q = query(
            collection(db, PRODUCTS_COLLECTION),
            where('status', '==', 'active'),
            where('category', '==', category),
            limit(limitCount + 1)
        );
        
        const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
        const products = querySnapshot.docs
            .map(convertDocToProduct)
            .filter(p => p.id !== excludeProductId)
            .slice(0, limitCount);
            
        return products;
    } catch (error) {
        console.error('Error fetching related products:', error);
        return [];
    }
};

export const getBestSellers = async (targetCount: number = 15): Promise<Product[]> => {
    try {
        // Step 1: Try to get products with sales, sorted by soldCount
        const soldQuery = query(
            collection(db, PRODUCTS_COLLECTION),
            where('status', '==', 'active'),
            where('soldCount', '>', 0),
            orderBy('soldCount', 'desc'),
            orderBy('rating', 'desc'),
            limit(targetCount)
        );
        
        const soldSnapshot = await getDocs(soldQuery);
        let products = soldSnapshot.docs.map(convertDocToProduct);
        
        // Step 2: If we have less than target, fill with highest-rated products
        if (products.length < targetCount) {
            const existingIds = new Set(products.map(p => p.id));
            const remainingNeeded = targetCount - products.length;
            
            const ratedQuery = query(
                collection(db, PRODUCTS_COLLECTION),
                where('status', '==', 'active'),
                orderBy('rating', 'desc'),
                orderBy('reviewCount', 'desc'),
                limit(remainingNeeded + 10) // Get extra to account for duplicates
            );
            
            const ratedSnapshot = await getDocs(ratedQuery);
            const ratedProducts = ratedSnapshot.docs
                .map(convertDocToProduct)
                .filter(p => !existingIds.has(p.id) && !isOutOfStock(p.stock));
            
            products = [...products, ...ratedProducts].slice(0, targetCount);
        }
        
        // Step 3: fallback - if still not enough, try smaller multiples
        if (products.length < 5) {
            // Just return what we have (less than 5 products total)
            return products;
        } else if (products.length < 10) {
            // Return top 5
            return products.slice(0, 5);
        } else if (products.length < 15) {
            // Return top 10
            return products.slice(0, 10);
        }
        
        return products.slice(0, 15);
        
    } catch (error) {
        console.error('Error fetching best sellers:', error);
        throw new Error('Failed to fetch best sellers.');
    }
};

//  Get New Arrivals (last 14 days) with recency-weighted scoring
export const getNewArrivals = async (limitCount: number = 4): Promise<Product[]> => {
    try {
        // Single query using your existing index
        const q = query(
            collection(db, PRODUCTS_COLLECTION),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc'),
            limit(limitCount * 5) // Fetch extra for filtering
        );
        
        const snapshot = await getDocs(q);
        const allProducts = snapshot.docs.map(convertDocToProduct);
        
        const now = new Date();
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        
        // Filter out of stock first
        let candidates = allProducts.filter(p => !isOutOfStock(p.stock));
        
        // Try 14 days
        let filtered = candidates.filter(p => {
            const createdAt = p.createdAt?.toDate?.() || new Date(p.createdAt);
            return createdAt >= fourteenDaysAgo;
        });
        
        let usedFallback = false;
        
        // Extend to 90 days if needed
        if (filtered.length < limitCount) {
            filtered = candidates.filter(p => {
                const createdAt = p.createdAt?.toDate?.() || new Date(p.createdAt);
                return createdAt >= ninetyDaysAgo;
            });
            usedFallback = true;
            console.log('Extended to 90 days:', filtered.length, 'products');
        }
        
        // Final fallback: use newest available
        if (filtered.length === 0) {
            filtered = candidates;
            usedFallback = true;
            console.log('Using all available products:', filtered.length);
        }
        
        // Score and rank
        const scored = filtered.map(p => {
            const createdAt = p.createdAt?.toDate?.() || new Date(p.createdAt);
            const daysOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
            
            const recencyScore = Math.max(0, 1 - (daysOld / (usedFallback ? 90 : 14))) * 0.5;
            const ratingScore = (p.rating || 0) / 5 * 0.25;
            const soldScore = Math.log10((p.soldCount || 0) + 1) / 2 * 0.15;
            const reviewScore = Math.log10((p.reviewCount || 0) + 1) / 2 * 0.10;
            
            return { product: p, score: recencyScore + ratingScore + soldScore + reviewScore };
        });
        
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, limitCount).map(i => i.product);
        
    } catch (error) {
        console.error('Error fetching new arrivals:', error);
        throw new Error('Failed to fetch new arrivals.');
    }
};

const isOutOfStock = (stock: string): boolean => {
    const stockMatch = stock.match(/^(\d+)/);
    return stockMatch ? parseInt(stockMatch[1]) === 0 : true;
};

// Increment sold count (existing function - keep it)
export const incrementProductSoldCount = async (productId: string, quantity: number = 1): Promise<void> => {
    try {
        const productRef = doc(db, PRODUCTS_COLLECTION, productId);
        await updateDoc(productRef, {
            soldCount: increment(quantity),
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Error incrementing sold count:', error);
        throw new Error('Failed to update product sold count.');
    }
};