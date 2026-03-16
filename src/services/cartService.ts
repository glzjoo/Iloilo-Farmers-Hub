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
    try {
        const cartDoc = await getDoc(doc(db, CARTS_COLLECTION, userId));
        
        if (!cartDoc.exists()) {
            return [];
        }
        
        const data = cartDoc.data() as Cart;
        return data.items || [];
    } catch (error) {
        console.error('Error fetching cart:', error);
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
        stock: number; // ADDED: stock is required
    }, 
    quantity: number
): Promise<void> => {
    try {
        const cartRef = doc(db, CARTS_COLLECTION, userId);
        const cartDoc = await getDoc(cartRef);
        
        // Use regular Date instead of serverTimestamp for array items
        const newItem: CartItem = {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            unit: product.unit,
            image: product.image,
            farmerId: product.farmerId,
            farmerName: product.farmerName,
            addedAt: new Date(), // Use regular Date instead of serverTimestamp
            stock: product.stock, // ADDED: include stock
        };
        
        if (!cartDoc.exists()) {
            // Create new cart
            const newCart = {
                userId: userId,
                items: [newItem],
                updatedAt: serverTimestamp(), 
            };
            await setDoc(cartRef, newCart);
        } else {
            // Update existing cart
            const data = cartDoc.data() as Cart;
            const existingItems = data.items || [];
            
            // Check if item already exists
            const existingIndex = existingItems.findIndex(
                item => item.productId === product.id
            );
            
            let updatedItems: CartItem[];
            
            if (existingIndex >= 0) {
                // Update quantity if item exists
                updatedItems = existingItems.map((item, index) => 
                    index === existingIndex 
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                // Add new item
                updatedItems = [...existingItems, newItem];
            }
            
            await updateDoc(cartRef, {
                items: updatedItems,
                updatedAt: serverTimestamp(),
            });
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        throw new Error('Failed to add item to cart');
    }
};

// Update cart item quantity
export const updateCartItemQuantity = async (
    userId: string,
    productId: string,
    quantity: number
): Promise<void> => {
    try {
        const cartRef = doc(db, CARTS_COLLECTION, userId);
        const cartDoc = await getDoc(cartRef);
        
        if (!cartDoc.exists()) {
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
    } catch (error) {
        console.error('Error updating cart:', error);
        throw new Error('Failed to update cart');
    }
};

// Remove item from cart
export const removeFromCart = async (
    userId: string,
    productId: string
): Promise<void> => {
    try {
        const cartRef = doc(db, CARTS_COLLECTION, userId);
        const cartDoc = await getDoc(cartRef);
        
        if (!cartDoc.exists()) {
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
    } catch (error) {
        console.error('Error removing from cart:', error);
        throw new Error('Failed to remove item from cart');
    }
};

// Clear entire cart
export const clearCart = async (userId: string): Promise<void> => {
    try {
        const cartRef = doc(db, CARTS_COLLECTION, userId);
        await updateDoc(cartRef, {
            items: [],
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        throw new Error('Failed to clear cart');
    }
};