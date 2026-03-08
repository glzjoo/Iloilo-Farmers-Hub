import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CartItem from './CartItem';
import { useAuth } from '../../context/AuthContext';
import { getCart, removeFromCart, updateCartItemQuantity } from '../../services/cartService';
import type { CartItem as CartItemType } from '../../types';

export default function ItemsCheckout() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [cartItems, setCartItems] = useState<CartItemType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingItem, setUpdatingItem] = useState<string | null>(null);

    useEffect(() => {
        const fetchCart = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const items = await getCart(user.uid);
                setCartItems(items);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch cart');
            } finally {
                setLoading(false);
            }
        };

        fetchCart();
    }, [user]);

    const handleQuantityChange = async (productId: string, newQuantity: number) => {
        if (!user || newQuantity < 1) return;

        setUpdatingItem(productId);
        try {
            await updateCartItemQuantity(user.uid, productId, newQuantity);
            setCartItems(prev => prev.map(item =>
                item.productId === productId
                    ? { ...item, quantity: newQuantity }
                    : item
            ));
        } catch (err: any) {
            alert(err.message || 'Failed to update quantity');
        } finally {
            setUpdatingItem(null);
        }
    };

    const handleRemove = async (productId: string) => {
        if (!user) return;

        if (!confirm('Are you sure you want to remove this item?')) return;

        try {
            await removeFromCart(user.uid, productId);
            setCartItems(prev => prev.filter(item => item.productId !== productId));
        } catch (err: any) {
            alert(err.message || 'Failed to remove item');
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
                <div className="max-w-5xl mx-auto px-10 text-center">
                    <h2 className="text-3xl font-primary font-semibold text-primary mb-8">Your Favorites</h2>
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
                <div className="max-w-5xl mx-auto px-10">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full py-12">
            <div className="max-w-5xl mx-auto px-10">
                <h2 className="text-3xl font-primary font-semibold text-primary mb-8">
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

                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-xl font-primary font-semibold">Total:</span>
                                <span className="text-3xl font-primary font-bold text-primary">
                                    ₱{calculateTotal().toFixed(2)}
                                </span>
                            </div>

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => navigate('/shop')}
                                    className="px-10 py-3 bg-gray-200 text-gray-700 font-primary font-semibold rounded-full cursor-pointer hover:bg-gray-300"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}