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

//  Increment sold count when order is completed
export const incrementProductSoldCount = async (productId: string, quantity: number = 1): Promise<void> => {
    try {
        const productRef = doc(db, PRODUCTS_COLLECTION, productId);
        await updateDoc(productRef, {
            soldCount: increment(quantity),
            updatedAt: new Date()
        });
        console.log(`✅ Incremented soldCount for ${productId} by ${quantity}`);
    } catch (error) {
        console.error('Error incrementing sold count:', error);
        throw new Error('Failed to update product sold count.');
    }
};