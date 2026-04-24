// ============================================
// FILE: src/components/cart/ItemsCheckout.tsx (FIXED)
// ============================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import CartItem from './CartItem';
import ConfirmationModal from '../common/ConfirmationModal';
import ErrorModal from '../common/ErrorModal';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { removeFromCart, updateCartItemQuantity } from '../../services/cartService';
import type { CartItem as CartItemType } from '../../types';

export default function ItemsCheckout() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [cartItems, setCartItems] = useState<CartItemType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [updatingItem, setUpdatingItem] = useState<string | null>(null);
    const [pendingRemoveProductId, setPendingRemoveProductId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            setCartItems([]);
            return;
        }

        console.log('Setting up cart listener for user:', user.uid);
        const cartRef = doc(db, 'carts', user.uid);

        const unsubscribe = onSnapshot(
            cartRef,
            (docSnapshot) => {
                console.log('Cart snapshot received:', docSnapshot.exists(), docSnapshot.data());
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    const items = data.items || [];
                    console.log('Cart items count:', items.length);
                    setCartItems(items);
                } else {
                    console.log('Cart document does not exist yet');
                    setCartItems([]);
                }
                setLoading(false);
            },
            (err) => {
                console.error('Cart listener error:', err);
                setError('Failed to load cart: ' + err.message);
                setLoading(false);
            }
        );

        return () => {
            console.log('Cleaning up cart listener');
            unsubscribe();
        };
    }, [user?.uid]); // Only re-run if user ID changes

    const handleQuantityChange = async (productId: string, newQuantity: number) => {
        if (!user || newQuantity < 1) return;

        setUpdatingItem(productId);
        try {
            await updateCartItemQuantity(user.uid, productId, newQuantity);
            // State updates automatically via onSnapshot
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to update quantity');
        } finally {
            setUpdatingItem(null);
        }
    };

    const handleRemove = (productId: string) => {
        setPendingRemoveProductId(productId);
    };

    const closeRemoveConfirmation = () => {
        setPendingRemoveProductId(null);
    };

    const handleConfirmRemove = async () => {
        if (!user || !pendingRemoveProductId) return;

        setPendingRemoveProductId(null);
        try {
            await removeFromCart(user.uid, pendingRemoveProductId);
            // State updates automatically via onSnapshot
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to remove item');
        }
    };

    const handleMessageSeller = (item: CartItemType) => {
        navigate('/messages', {
            state: {
                farmerId: item.farmerId,
                farmerName: item.farmerName,
                product: {
                    id: item.productId,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                    unit: item.unit,
                    quantity: item.quantity
                }
            }
        });
    };

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    if (!user) {
        return (
            <section className="w-full py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-10 text-center">
                    <h2 className="text-2xl sm:text-3xl font-primary font-semibold text-primary mb-8">Your Favorites</h2>
                    <p className="text-gray-500 mb-4">Please login to view your list</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2 bg-primary text-white rounded-lg"
                    >
                        Login
                    </button>
                </div>
            </section>
        );
    }

    if (loading) {
        return (
            <section className="w-full py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-10">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full py-8 sm:py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-10">
                <h2 className="text-2xl sm:text-3xl font-primary font-semibold text-primary mb-6 sm:mb-8">
                    Your Favorites ({cartItems.length} items)
                </h2>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {cartItems.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-xl text-gray-500 mb-4">Your list is empty</p>
                        <button
                            onClick={() => navigate('/shop')}
                            className="px-6 py-2 bg-primary text-white rounded-lg"
                        >
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <>
                        {cartItems.map((item) => (
                            <CartItem
                                key={item.productId}
                                productId={item.productId}
                                name={item.name}
                                price={item.price}
                                quantity={item.quantity}
                                unit={item.unit}
                                image={item.image}
                                farmerName={item.farmerName}
                                farmerId={item.farmerId}
                                onQuantityChange={handleQuantityChange}
                                onRemove={handleRemove}
                                onMessageSeller={() => handleMessageSeller(item)}
                                isUpdating={updatingItem === item.productId}
                            />
                        ))}

                        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-lg sm:text-xl font-primary font-semibold">Total:</span>
                                <span className="text-2xl sm:text-3xl font-primary font-bold text-primary">
                                    ₱{calculateTotal().toFixed(2)}
                                </span>
                            </div>

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => navigate('/shop')}
                                    className="w-full sm:w-auto px-10 py-3 bg-gray-200 text-gray-700 font-primary font-semibold rounded-full cursor-pointer hover:bg-gray-300 transition-colors"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <ConfirmationModal
                isOpen={Boolean(pendingRemoveProductId)}
                title="Remove item"
                message="Are you sure you want to remove this item from your cart?"
                confirmLabel="Remove"
                cancelLabel="Keep item"
                onConfirm={handleConfirmRemove}
                onCancel={closeRemoveConfirmation}
                variant="warning"
            />

            <ErrorModal
                isOpen={Boolean(errorMessage)}
                title="Cart error"
                message={errorMessage}
                onClose={() => setErrorMessage('')}
            />
        </section>
    );
}