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

// ==========================================
// UNIFIED PRODUCT QUERY INTERFACE
// ==========================================

export interface ProductQueryOptions {
    categories?: string[];
    sortBy?: 'newest' | 'rating' | 'price-asc' | 'price-desc' | 'bestseller';
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
}

// ==========================================
// UNIFIED PRODUCT FETCH FUNCTION
// ==========================================

export const getProducts = async (options: ProductQueryOptions = {}): Promise<Product[]> => {
    try {
        const constraints: any[] = [where('status', '==', 'active')];
        
        // Build query based on options
        if (options.categories && options.categories.length > 0) {
            if (options.categories.length === 1) {
                constraints.push(where('category', '==', options.categories[0]));
            } else {
                constraints.push(where('category', 'in', options.categories.slice(0, 10)));
            }
        }
        
        // Determine sort field for Firestore query
        // Use createdAt as safe default for all queries to ensure index compatibility
        let needsClientSideSort = false;
        
        switch (options.sortBy) {
            case 'price-asc':
            case 'price-desc':
                // Try to use price sort, but will fallback to client-side if index missing
                const priceOrder = options.sortBy === 'price-asc' ? 'asc' : 'desc';
                constraints.push(orderBy('price', priceOrder));
                break;
            case 'rating':
                // Use createdAt for query, sort by rating client-side to avoid index requirement
                constraints.push(orderBy('createdAt', 'desc'));
                needsClientSideSort = true;
                break;
            case 'bestseller':
                constraints.push(where('soldCount', '>', 0));
                constraints.push(orderBy('soldCount', 'desc'));
                break;
            case 'newest':
            default:
                constraints.push(orderBy('createdAt', 'desc'));
                break;
        }
        
        // Fetch extra to account for client-side filtering
        const fetchLimit = (options.limit || 100) * 2;
        constraints.push(limit(fetchLimit));
        
        // Execute query
        const q = query(collection(db, PRODUCTS_COLLECTION), ...constraints);
        const snapshot = await getDocs(q);
        let products = snapshot.docs.map(convertDocToProduct);
        
        // Client-side rating sort (if selected) - handles missing index case
        if (options.sortBy === 'rating' || needsClientSideSort) {
            products.sort((a, b) => {
                if (b.rating !== a.rating) return b.rating - a.rating;
                return b.reviewCount - a.reviewCount;
            });
        }
        
        // Client-side price sort (backup for missing index)
        if (options.sortBy === 'price-asc' || options.sortBy === 'price-desc') {
            const isAsc = options.sortBy === 'price-asc';
            const sorted = [...products].sort((a, b) => isAsc ? a.price - b.price : b.price - a.price);
            // Check if Firestore sort worked (if not, use client-side)
            if (JSON.stringify(products.map(p => p.id)) !== JSON.stringify(sorted.map(p => p.id))) {
                products = sorted;
            }
        }
        
        // Client-side price range filter
        if (options.minPrice !== undefined || options.maxPrice !== undefined) {
            products = products.filter(p => {
                if (options.minPrice !== undefined && p.price < options.minPrice) return false;
                if (options.maxPrice !== undefined && p.price > options.maxPrice) return false;
                return true;
            });
        }
        
        // Client-side stock filter
        if (options.inStockOnly) {
            products = products.filter(p => !isOutOfStock(p.stock));
        }
        
        // Return requested limit
        return products.slice(0, options.limit || 100);
        
    } catch (error) {
        console.error('Error fetching products:', error);
        throw new Error('Failed to fetch products.');
    }
};

// ==========================================
// BACKWARD COMPATIBILITY WRAPPERS
// ==========================================

export const getProductsByCategory = (category: string, limit?: number) => 
    getProducts({ categories: [category], limit });

export const getShopProducts = (limit?: number) => 
    getProducts({ limit });

// FIXED: getNewArrivals with normalized scoring and date validation
export const getNewArrivals = async (limitCount: number = 4): Promise<Product[]> => {
    try {
        const products = await getProducts({ 
            sortBy: 'newest', 
            limit: limitCount * 5,
            inStockOnly: true 
        });
        
        const now = new Date();
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        
        let filtered = products.filter(p => {
            // FIXED: Guard against missing/invalid createdAt
            if (!p.createdAt) return false;
            const createdAt = p.createdAt?.toDate?.() || new Date(p.createdAt);
            // Check if valid date
            if (isNaN(createdAt.getTime())) return false;
            return createdAt >= fourteenDaysAgo;
        });
        
        let usedFallback = false;
        if (filtered.length < limitCount) {
            filtered = products.filter(p => {
                if (!p.createdAt) return false;
                const createdAt = p.createdAt?.toDate?.() || new Date(p.createdAt);
                if (isNaN(createdAt.getTime())) return false;
                return createdAt >= ninetyDaysAgo;
            });
            usedFallback = true;
        }
        
        if (filtered.length === 0) {
            filtered = products;
            usedFallback = true;
        }
        
        // FIXED: Normalize all score components to 0-1 range
        const scored = filtered.map(p => {
            // Guard against missing createdAt
            if (!p.createdAt) {
                return { product: p, score: 0 };
            }
            
            const createdAt = p.createdAt?.toDate?.() || new Date(p.createdAt);
            // Guard against invalid date
            if (isNaN(createdAt.getTime())) {
                return { product: p, score: 0 };
            }
            
            const daysOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
            
            // Normalize each component to 0-1
            const recencyScore = Math.max(0, 1 - (daysOld / (usedFallback ? 90 : 14)));
            const ratingScore = Math.min(1, (p.rating || 0) / 5);
            const soldScore = Math.min(1, Math.log10((p.soldCount || 0) + 1) / 3);
            const reviewScore = Math.min(1, Math.log10((p.reviewCount || 0) + 1) / 3);
            
            // Weighted sum (total max = 1.0)
            const totalScore = (recencyScore * 0.5) + 
                              (ratingScore * 0.25) + 
                              (soldScore * 0.15) + 
                              (reviewScore * 0.1);
            
            return { product: p, score: totalScore };
        });
        
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, limitCount).map(i => i.product);
        
    } catch (error) {
        console.error('Error fetching new arrivals:', error);
        return [];
    }
};

// FIXED: getBestSellers with fallback to highest-rated when no sales
export const getBestSellers = async (targetCount: number = 15): Promise<Product[]> => {
    try {
        // Try to get products with sales first
        const soldQuery = query(
            collection(db, PRODUCTS_COLLECTION),
            where('status', '==', 'active'),
            where('soldCount', '>', 0),
            orderBy('soldCount', 'desc'),
            orderBy('rating', 'desc'),
            limit(targetCount * 2)
        );
        
        const soldSnapshot = await getDocs(soldQuery);
        let products = soldSnapshot.docs.map(convertDocToProduct);
        
        // FIXED: If no bestsellers, fallback to highest rated
        if (products.length === 0) {
            console.log('No bestsellers found, falling back to highest rated');
            const ratedQuery = query(
                collection(db, PRODUCTS_COLLECTION),
                where('status', '==', 'active'),
                orderBy('rating', 'desc'),
                orderBy('reviewCount', 'desc'),
                limit(targetCount * 2)
            );
            
            const ratedSnapshot = await getDocs(ratedQuery);
            products = ratedSnapshot.docs.map(convertDocToProduct);
        }
        
        // Filter out of stock and apply diversity
        const inStock = products.filter(p => !isOutOfStock(p.stock));
        
        // If still not enough, get any active products
        if (inStock.length < targetCount) {
            const existingIds = new Set(inStock.map(p => p.id));
            const remainingNeeded = targetCount - inStock.length;
            
            const fallbackQuery = query(
                collection(db, PRODUCTS_COLLECTION),
                where('status', '==', 'active'),
                orderBy('createdAt', 'desc'),
                limit(remainingNeeded * 2)
            );
            
            const fallbackSnapshot = await getDocs(fallbackQuery);
            const fallbackProducts = fallbackSnapshot.docs
                .map(convertDocToProduct)
                .filter(p => !existingIds.has(p.id) && !isOutOfStock(p.stock));
            
            products = [...inStock, ...fallbackProducts];
        } else {
            products = inStock;
        }
        
        return products.slice(0, targetCount);
        
    } catch (error) {
        console.error('Error fetching best sellers:', error);
        return [];
    }
};

export const getRelatedProducts = async (
    category: string, 
    excludeProductId: string, 
    limitCount: number = 5
): Promise<Product[]> => {
    try {
        const products = await getProducts({ categories: [category], limit: limitCount + 5 });
        return products
            .filter(p => p.id !== excludeProductId)
            .slice(0, limitCount);
    } catch (error) {
        console.error('Error fetching related products:', error);
        return [];
    }
};

export const getProductById = async (productId: string): Promise<Product | null> => {
    try {
        const q = query(
            collection(db, PRODUCTS_COLLECTION),
            where('__name__', '==', productId),
            where('status', '==', 'active')
        );
        
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;
        return convertDocToProduct(querySnapshot.docs[0]);
    } catch (error) {
        console.error('Error fetching product:', error);
        throw new Error('Failed to fetch product.');
    }
};

const isOutOfStock = (stock: string): boolean => {
    const stockMatch = stock.match(/^(\d+)/);
    return stockMatch ? parseInt(stockMatch[1]) === 0 : true;
};

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