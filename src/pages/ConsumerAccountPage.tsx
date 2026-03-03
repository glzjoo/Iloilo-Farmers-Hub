import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import accountSettingsIcon from '../assets/icons/account-settings.svg';
import shareIcon from '../assets/icons/share.svg';
import ProfileInfoSectionConsumer from '../components/Profile/ProfileInfoSectionConsumer';
import { getCart, removeFromCart, updateCartItemQuantity } from '../services/cartService';
import type { CartItem } from '../types';

interface ConsumerProfile {
    firstName: string;
    lastName: string;
    address: string;
    phoneNo: string;
    email: string | null;
    interest?: string;
    profileImage?: string;
    createdAt?: any;
}

export default function ConsumerAccountPage() {
    const [activeTab, setActiveTab] = useState<'orders' | 'saved' | 'profile'>('orders');
    const [profile, setProfile] = useState<ConsumerProfile | null>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [cartLoading, setCartLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        fetchProfile();
        fetchCart();
    }, [user]);

    const fetchProfile = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            const consumerDoc = await getDoc(doc(db, 'consumers', user.uid));
            if (consumerDoc.exists()) {
                setProfile(consumerDoc.data() as ConsumerProfile);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCart = async () => {
        if (!user) return;
        try {
            setCartLoading(true);
            const items = await getCart(user.uid);
            setCartItems(items);
        } catch (err) {
            console.error('Error fetching cart:', err);
        } finally {
            setCartLoading(false);
        }
    };

    const handleQuantityChange = async (productId: string, newQuantity: number) => {
        if (!user || newQuantity < 1) return;
        
        try {
            await updateCartItemQuantity(user.uid, productId, newQuantity);
            setCartItems(prev => prev.map(item => 
                item.productId === productId 
                    ? { ...item, quantity: newQuantity }
                    : item
            ));
        } catch (err: any) {
            alert(err.message || 'Failed to update quantity');
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

    const getJoinDate = () => {
        if (!profile?.createdAt) return 'N/A';
        try {
            const date = profile.createdAt.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return 'N/A';
        }
    };

    const displayName = profile
        ? `${profile.firstName} ${profile.lastName}`
        : 'Consumer';

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    if (loading) {
        return (
            <section className="max-w-6xl mx-auto px-10 py-8">
                <p className="text-gray-500">Loading...</p>
            </section>
        );
    }

    return (
        <section className="w-full max-w-6xl mx-auto px-10 py-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <img src={accountSettingsIcon} alt="" className="w-8 h-8" />
                <div>
                    <h1 className="text-2xl font-bold font-primary">My Account</h1>
                    <p className="text-sm text-gray-500">Manage your account and orders</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="border border-gray-200 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-xl bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                        {profile?.profileImage ? (
                            <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                            </svg>
                        )}
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <h2 className="text-lg font-bold font-primary">{displayName}</h2>
                        </div>
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
                        >
                            Profile details &gt;
                        </button>
                    </div>

                    {/* Join Date */}
                    <div className="text-center px-6 border-l border-gray-200">
                        <p className="text-lg font-bold font-primary">{getJoinDate()}</p>
                        <p className="text-xs text-gray-500">Joined</p>
                    </div>

                    {/* Edit Profile Button */}
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className="px-6 py-2 rounded-full bg-primary text-white text-sm font-semibold cursor-pointer hover:bg-green-700 transition-colors"
                    >
                        Edit Profile
                    </button>

                    {/* Share Icon */}
                    <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                        <img src={shareIcon} alt="Share" className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-6 py-3 text-sm font-semibold cursor-pointer transition-colors ${activeTab === 'orders'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    My Orders
                </button>
                <button
                    onClick={() => setActiveTab('saved')}
                    className={`px-6 py-3 text-sm font-semibold cursor-pointer transition-colors ${activeTab === 'saved'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Favorites ({cartItems.length})
                </button>
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-6 py-3 text-sm font-semibold cursor-pointer transition-colors ${activeTab === 'profile'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Profile Info
                </button>
            </div>

            {/* Tab Content */}
            <div key={activeTab} className="animate-tab-fade-in">
                {activeTab === 'orders' && (
                    <div className="text-center py-16 text-gray-500">
                        <p>No orders yet</p>
                    </div>
                )}
                
                {activeTab === 'saved' && (
                    <div>
                        {cartLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : cartItems.length === 0 ? (
                            <div className="text-center py-16 text-gray-500">
                                <p>No items in favorites</p>
                                <button 
                                    onClick={() => setActiveTab('orders')}
                                    className="mt-4 px-6 py-2 bg-primary text-white rounded-lg"
                                >
                                    Browse Products
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cartItems.map((item) => (
                                    <div key={item.productId} className="flex items-center gap-6 py-6 border-b border-gray-200">
                                        <img 
                                            src={item.image} 
                                            alt={item.name} 
                                            className="w-28 h-28 object-cover rounded-lg flex-shrink-0"
                                        />
                                        <div className="flex-1">
                                            <h3 className="text-xl font-primary font-semibold text-black">{item.name}</h3>
                                            <p className="text-sm text-gray-500 mb-2">Farm: {item.farmerName}</p>
                                            <p className="text-lg font-primary font-bold text-primary">₱{item.price.toFixed(2)} / {item.unit}</p>
                                            
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-sm text-gray-500">Quantity:</span>
                                                <button
                                                    onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                                    className="w-7 h-7 rounded-full border border-gray-300 bg-white flex items-center justify-center cursor-pointer text-gray-600 hover:bg-gray-100"
                                                >−</button>
                                                <span className="text-lg font-semibold w-6 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                                    className="w-7 h-7 rounded-full border border-gray-300 bg-white flex items-center justify-center cursor-pointer text-gray-600 hover:bg-gray-100"
                                                >+</button>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-primary font-bold text-primary">
                                                ₱{(item.price * item.quantity).toFixed(2)}
                                            </p>
                                            <button
                                                onClick={() => handleRemove(item.productId)}
                                                className="mt-2 px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-full cursor-pointer hover:bg-red-700"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
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
                                            onClick={() => window.location.href = '/cart'}
                                            className="px-10 py-3 bg-primary text-white font-primary font-semibold rounded-full cursor-pointer hover:bg-green-700"
                                        >
                                            Go to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {activeTab === 'profile' && <ProfileInfoSectionConsumer />}
            </div>
        </section>
    );
}