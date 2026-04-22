// ============================================
// FILE: src/services/cartService.ts (DEBUG VERSION)
// ============================================
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Cart, CartItem } from '../types';

const CARTS_COLLECTION = 'carts';

// Get user's cart
export const getCart = async (userId: string): Promise<CartItem[]> => {
    console.log('[getCart] Fetching cart for user:', userId);
    try {
        const cartDoc = await getDoc(doc(db, CARTS_COLLECTION, userId));
        
        if (!cartDoc.exists()) {
            console.log('[getCart] Cart document does not exist');
            return [];
        }
        
        const data = cartDoc.data() as Cart;
        console.log('[getCart] Cart data retrieved:', data);
        return data.items || [];
    } catch (error) {
        console.error('[getCart] Error fetching cart:', error);
        throw new Error('Failed to fetch cart');
    }
};

// Add item to cart
export const addToCart = async (
    userId: string, 
    product: {
        id: string;
        name: string;
        price: number;
        unit: string;
        image: string;
        farmerId: string;
        farmerName: string;
        stock: number;
    }, 
    quantity: number
): Promise<void> => {
    console.log('[addToCart] Starting with userId:', userId, 'product:', product.id, 'qty:', quantity);
    
    if (!userId) {
        console.error('[addToCart] ERROR: userId is empty or undefined!');
        throw new Error('User ID is required');
    }

    try {
        const cartRef = doc(db, CARTS_COLLECTION, userId);
        console.log('[addToCart] Cart reference path:', cartRef.path);
        
        const cartDoc = await getDoc(cartRef);
        console.log('[addToCart] Cart exists:', cartDoc.exists());
        
        const newItem: CartItem = {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            unit: product.unit,
            image: product.image,
            farmerId: product.farmerId,
            farmerName: product.farmerName,
            addedAt: new Date(),
            stock: product.stock,
        };
        
        console.log('[addToCart] New item prepared:', newItem);
        
        if (!cartDoc.exists()) {
            console.log('[addToCart] Creating NEW cart document');
            const newCart = {
                userId: userId,
                items: [newItem],
                updatedAt: serverTimestamp(), 
            };
            console.log('[addToCart] Setting document with:', newCart);
            await setDoc(cartRef, newCart);
            console.log('[addToCart] SUCCESS: New cart created');
        } else {
            console.log('[addToCart] Updating EXISTING cart');
            const data = cartDoc.data() as Cart;
            const existingItems = data.items || [];
            console.log('[addToCart] Existing items count:', existingItems.length);
            
            const existingIndex = existingItems.findIndex(
                item => item.productId === product.id
            );
            
            let updatedItems: CartItem[];
            
            if (existingIndex >= 0) {
                console.log('[addToCart] Item exists at index:', existingIndex);
                updatedItems = existingItems.map((item, index) => 
                    index === existingIndex 
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                console.log('[addToCart] Adding new item to cart');
                updatedItems = [...existingItems, newItem];
            }
            
            console.log('[addToCart] Updated items:', updatedItems);
            await updateDoc(cartRef, {
                items: updatedItems,
                updatedAt: serverTimestamp(),
            });
            console.log('[addToCart] SUCCESS: Cart updated');
        }
    } catch (error: any) {
        console.error('[addToCart] ERROR:', error);
        console.error('[addToCart] Error code:', error.code);
        console.error('[addToCart] Error message:', error.message);
        throw new Error('Failed to add item to cart: ' + error.message);
    }
};

// Update cart item quantity
export const updateCartItemQuantity = async (
    userId: string,
    productId: string,
    quantity: number
): Promise<void> => {
    console.log('[updateCartItemQuantity] userId:', userId, 'product:', productId, 'qty:', quantity);
    try {
        const cartRef = doc(db, CARTS_COLLECTION, userId);
        const cartDoc = await getDoc(cartRef);
        
        if (!cartDoc.exists()) {
            console.error('[updateCartItemQuantity] Cart not found');
            throw new Error('Cart not found');
        }
        
        const data = cartDoc.data() as Cart;
        const updatedItems = data.items.map(item => 
            item.productId === productId 
                ? { ...item, quantity: Math.max(1, quantity) }
                : item
        );
        
        await updateDoc(cartRef, {
            items: updatedItems,
            updatedAt: serverTimestamp(),
        });
        console.log('[updateCartItemQuantity] SUCCESS');
    } catch (error: any) {
        console.error('[updateCartItemQuantity] ERROR:', error);
        throw new Error('Failed to update cart');
    }
};

// Remove item from cart
export const removeFromCart = async (
    userId: string,
    productId: string
): Promise<void> => {
    console.log('[removeFromCart] userId:', userId, 'product:', productId);
    try {
        const cartRef = doc(db, CARTS_COLLECTION, userId);
        const cartDoc = await getDoc(cartRef);
        
        if (!cartDoc.exists()) {
            console.log('[removeFromCart] Cart does not exist');
            return;
        }
        
        const data = cartDoc.data() as Cart;
        const updatedItems = data.items.filter(
            item => item.productId !== productId
        );
        
        await updateDoc(cartRef, {
            items: updatedItems,
            updatedAt: serverTimestamp(),
        });
        console.log('[removeFromCart] SUCCESS');
    } catch (error: any) {
        console.error('[removeFromCart] ERROR:', error);
        throw new Error('Failed to remove item from cart');
    }
};

// Clear entire cart
export const clearCart = async (userId: string): Promise<void> => {
    console.log('[clearCart] userId:', userId);
    try {
        const cartRef = doc(db, CARTS_COLLECTION, userId);
        await updateDoc(cartRef, {
            items: [],
            updatedAt: serverTimestamp(),
        });
        console.log('[clearCart] SUCCESS');
    } catch (error: any) {
        console.error('[clearCart] ERROR:', error);
        throw new Error('Failed to clear cart');
    }
};