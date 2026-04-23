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
    type DocumentData
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Product } from '../types';

const PRODUCTS_COLLECTION = 'products';
//shopservice.ts
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
    sortBy?: 'trending' | 'newest' | 'rating' | 'price-asc' | 'price-desc' | 'bestseller';
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

        // Apply sorting - simplified: just fetch by createdAt for trending/newest
        // Let ShopAll handle the algorithm
        switch (options.sortBy) {
            case 'price-asc':
                constraints.push(orderBy('price', 'asc'));
                break;
            case 'price-desc':
                constraints.push(orderBy('price', 'desc'));
                break;
            case 'rating':
                constraints.push(orderBy('rating', 'desc'));
                constraints.push(orderBy('reviewCount', 'desc'));
                break;
            case 'bestseller':
                constraints.push(where('soldCount', '>', 0));
                constraints.push(orderBy('soldCount', 'desc'));
                break;
            case 'trending':
            case 'newest':
            default:
                // For trending, just get recent products - ShopAll will apply algorithm
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

// Simplified getNewArrivals - uses client-side filtering
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
            if (!p.createdAt) return false;
            const createdAt = p.createdAt?.toDate?.() || new Date(p.createdAt);
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

        // Score and rank
        const scored = filtered.map(p => {
            if (!p.createdAt) return { product: p, score: 0 };

            const createdAt = p.createdAt?.toDate?.() || new Date(p.createdAt);
            if (isNaN(createdAt.getTime())) return { product: p, score: 0 };

            const daysOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

            const recencyScore = Math.max(0, 1 - (daysOld / (usedFallback ? 90 : 14))) * 0.5;
            const ratingScore = Math.min(1, (p.rating || 0) / 5) * 0.25;
            const soldScore = Math.min(1, Math.log10((p.soldCount || 0) + 1) / 3) * 0.15;
            const reviewScore = Math.min(1, Math.log10((p.reviewCount || 0) + 1) / 3) * 0.1;

            return {
                product: p,
                score: recencyScore + ratingScore + soldScore + reviewScore
            };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, limitCount).map(i => i.product);

    } catch (error) {
        console.error('Error fetching new arrivals:', error);
        return [];
    }
};

// Simplified getBestSellers
export const getBestSellers = async (targetCount: number = 15): Promise<Product[]> => {
    try {
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

        if (products.length === 0) {
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

        const inStock = products.filter(p => !isOutOfStock(p.stock));

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

// Simplified getTrendingItems - uses existing index
export const getTrendingItems = async (limitCount: number = 4): Promise<{ id: string; name: string; image: string }[]> => {
    try {
        // Use existing index: status + soldCount
        const bestQuery = query(
            collection(db, PRODUCTS_COLLECTION),
            where('status', '==', 'active'),
            where('soldCount', '>', 0),
            orderBy('soldCount', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(bestQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            image: doc.data().image || '/placeholder-product.png'
        }));

    } catch (error) {
        console.error('Error fetching trending items:', error);
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