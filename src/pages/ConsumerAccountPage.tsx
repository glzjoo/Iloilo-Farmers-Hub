import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import accountSettingsIcon from '../assets/icons/account-settings.svg';
import shareIcon from '../assets/icons/share.svg';
import ProfileInfoSectionConsumer from '../components/Profile/ProfileInfoSectionConsumer';
//consumerAccountPage.tsx
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
    const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
    const [profile, setProfile] = useState<ConsumerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        fetchProfile();
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

    const getJoinDate = () => {
        if (!profile?.createdAt) return 'N/A';
        try {
            const date = profile.createdAt.toDate
                ? profile.createdAt.toDate()
                : new Date(profile.createdAt);

            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';

            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
        } catch {
            return 'N/A';
        }
    };

    const displayName = profile
        ? `${profile.firstName} ${profile.lastName}`
        : 'Consumer';

    if (loading) {
        return (
            <section className="max-w-6xl mx-auto px-4 sm:px-10 py-8">
                <p className="text-gray-500">Loading...</p>
            </section>
        );
    }

    return (
        <section className="w-full max-w-6xl mx-auto px-4 sm:px-10 py-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <img src={accountSettingsIcon} alt="" className="w-8 h-8" />
                <div>
                    <h1 className="text-2xl font-bold font-primary">My Account</h1>
                    <p className="text-sm text-gray-500">
                        Manage your account and orders
                    </p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="border border-gray-200 rounded-xl p-4 sm:p-6 mb-6">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div className="w-20 h-20 rounded-xl bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                        {profile?.profileImage ? (
                            <img
                                src={profile.profileImage}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <svg
                                className="w-10 h-10 text-gray-400"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                            </svg>
                        )}
                    </div>

                    <div className="flex-1">
                        <h2 className="text-lg font-bold font-primary">
                            {displayName}
                        </h2>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Profile details &gt;
                        </button>
                    </div>

                    <div className="text-center px-4 sm:px-6 border-l border-gray-200">
                        <p className="text-lg font-bold font-primary">
                            {getJoinDate()}
                        </p>
                        <p className="text-xs text-gray-500">Joined</p>
                    </div>

                    <button
                        onClick={() => setActiveTab('profile')}
                        className="px-6 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-green-700 transition-colors"
                    >
                        Edit Profile
                    </button>

                    <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <img src={shareIcon} alt="Share" className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-6 py-3 text-sm font-semibold transition-colors ${
                        activeTab === 'orders'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    My Orders
                </button>

                <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-6 py-3 text-sm font-semibold transition-colors ${
                        activeTab === 'profile'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Profile Info
                </button>
            </div>

            {/* Tab Content */}
            <div key={activeTab}>
                {activeTab === 'orders' && (
                    <div className="text-center py-16 text-gray-500">
                        <p>No orders yet</p>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <ProfileInfoSectionConsumer />
                )}
            </div>
        </section>
    );
}