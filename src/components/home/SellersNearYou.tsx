// ============================================
// FILE: src/components/home/SellersNearYou.tsx (DYNAMIC - NO DISTANCE BADGES)
// ============================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { FarmerWithLocation } from '../../types';
import FarmerCard from '../shop/FarmerCard';

interface FarmerWithDistance extends FarmerWithLocation {
  distance: number;
  formattedDistance: string;
}

export default function SellersNearYou() {
    const navigate = useNavigate();
    const [farmers, setFarmers] = useState<FarmerWithDistance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRandomFarmers = async () => {
            try {
                setLoading(true);
                setError(null);

                // Query for verified farmers with locations
                const farmersQuery = query(
                    collection(db, 'farmers'),
                    where('verificationStatus', '==', 'verified'),
                    where('farmLocation', '!=', null),
                    limit(20)
                );

                const snapshot = await getDocs(farmersQuery);
                
                if (snapshot.empty) {
                    setFarmers([]);
                    setLoading(false);
                    return;
                }

                // Convert to array and shuffle
                const allFarmers = snapshot.docs.map(doc => {
                    const data = doc.data() as FarmerWithLocation;
                    return {
                        ...data,
                        uid: doc.id,
                        distance: Math.random() * 14 + 1,
                        formattedDistance: `${(Math.random() * 14 + 1).toFixed(1)} km`,
                    } as FarmerWithDistance;
                });

                // Shuffle array (Fisher-Yates)
                for (let i = allFarmers.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [allFarmers[i], allFarmers[j]] = [allFarmers[j], allFarmers[i]];
                }

                // Take first 5 random farmers
                const randomFarmers = allFarmers.slice(0, 5);
                
                // Sort by distance for consistent display
                randomFarmers.sort((a, b) => a.distance - b.distance);
                
                setFarmers(randomFarmers);

            } catch (err: any) {
                console.error('Error fetching random farmers:', err);
                setError(err.message || 'Failed to load farmers');
            } finally {
                setLoading(false);
            }
        };

        fetchRandomFarmers();
    }, []);

    const handleViewAll = () => {
        navigate('/shop', { state: { showNearby: true } });
    };

    if (loading) {
        return (
            <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Sellers Near You</h2>
                </div>
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </section>
        );
    }

    if (error || farmers.length === 0) {
        return (
            <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Sellers Near You</h2>
                </div>
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                    <p className="text-gray-500">
                        {error ? 'Unable to load farmers. Please try again later.' : 'No farmers available at the moment.'}
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Sellers Near You</h2>
                <button 
                    onClick={handleViewAll}
                    className="text-sm text-primary hover:text-green-700 font-medium flex items-center gap-1"
                >
                    View All
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                {farmers.map((farmer) => (
                    <FarmerCard 
                        key={farmer.uid} 
                        farmer={farmer}
                        hideDistance={true}  // KEY CHANGE: Hide distance badges
                    />
                ))}
            </div>
        </section>
    );
}