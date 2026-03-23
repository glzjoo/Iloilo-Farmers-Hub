import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    getRecentTopReviews, 
    getPlatformReviewStats, 
    getProductNamesForReviews, 
    getFarmerNamesForReviews,
    getConsumerProfilesForReviews
} from '../../services/reviewService';
import type { Review } from '../../types';

export default function ReviewSection() {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState({
        averageRating: 0,
        totalReviews: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });
    const [productNames, setProductNames] = useState<Map<string, string>>(new Map());
    const [farmerNames, setFarmerNames] = useState<Map<string, string>>(new Map());
    const [consumerProfiles, setConsumerProfiles] = useState<Map<string, { name: string; avatar: string }>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true);
                
                const [reviewsData, statsData] = await Promise.all([
                    getRecentTopReviews(3, 5),
                    getPlatformReviewStats()
                ]);
                
                setReviews(reviewsData);
                setStats({
                    averageRating: statsData.averageRating,
                    totalReviews: statsData.totalReviews,
                    distribution: statsData.ratingDistribution
                });
                
                if (reviewsData.length > 0) {
                    const [prodMap, farmMap, consumerMap] = await Promise.all([
                        getProductNamesForReviews(reviewsData),
                        getFarmerNamesForReviews(reviewsData),
                        getConsumerProfilesForReviews(reviewsData)
                    ]);
                    setProductNames(prodMap);
                    setFarmerNames(farmMap);
                    setConsumerProfiles(consumerMap);
                }
                
            } catch (err) {
                console.error('Error loading reviews:', err);
                setError('Failed to load reviews');
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, []);

    const getPercentage = (count: number): number => {
        if (stats.totalReviews === 0) return 0;
        return Math.round((count / stats.totalReviews) * 100);
    };

    const formatDate = (timestamp: any): string => {
        if (!timestamp) return '';
        const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const getConsumerDisplay = (review: Review) => {
        const profile = consumerProfiles.get(review.consumerId);
        return {
            name: profile?.name || review.consumerName,
            avatar: profile?.avatar || ''
        };
    };

    if (loading) {
        return (
            <section className="w-full py-12">
                <div className="max-w-7xl mx-auto px-10">
                    <div className="flex items-center gap-6 mb-8 border-b border-gray-300 pb-3">
                        <h2 className="text-lg font-bold text-dark border-b-2 border-black pb-1">Product Reviews</h2>
                    </div>
                    <div className="flex items-start gap-16">
                        <div className="flex flex-col items-start animate-pulse">
                            <div className="w-20 h-16 bg-gray-200 rounded mb-2"></div>
                            <div className="w-28 h-4 bg-gray-200 rounded"></div>
                        </div>
                        <div className="flex-1 space-y-3 max-w-md pt-2 animate-pulse">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-3 h-4 bg-gray-200 rounded"></div>
                                    <div className="flex-1 h-[15px] bg-gray-200 rounded-full"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="border border-gray-200 p-6 h-[200px] rounded-[40px] animate-pulse bg-gray-100"></div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (error || reviews.length === 0) {
        return (
            <section className="w-full py-12">
                <div className="max-w-7xl mx-auto px-10">
                    <div className="flex items-center gap-6 mb-8 border-b border-gray-300 pb-3">
                        <h2 className="text-lg font-bold text-dark border-b-2 border-black pb-1">Product Reviews</h2>
                    </div>
                    <div className="text-center py-8 text-gray-500">
                        <p>No reviews yet. Be the first to review!</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full py-12">
            <div className="max-w-7xl mx-auto px-10">
                <div className="flex items-center gap-6 mb-8 border-b border-gray-300 pb-3">
                    <h2 className="text-lg font-bold text-dark cursor-pointer border-b-2 border-black pb-1">Product Reviews</h2>
                    <h2 className="text-lg font-bold text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">Store Reviews</h2>
                </div>
                
                <div className="flex items-start gap-16">
                    <div className="flex flex-col items-start">
                        <p className="text-6xl font-bold text-dark leading-none">{stats.averageRating.toFixed(2)}</p>
                        <div className="flex items-center mt-2 -ml-1">
                            {[...Array(5)].map((_, i) => (
                                <span 
                                    key={i} 
                                    className={`text-2xl ${i < Math.round(stats.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                        <p className="text-sm text-gray-400 mt-3">{stats.totalReviews} reviews</p>
                    </div>

                    <div className="flex-1 space-y-3 max-w-md pt-2">
                        {[5, 4, 3, 2, 1].map((stars) => (
                            <div key={stars} className="flex items-center gap-3">
                                <span className="text-sm text-gray-500 w-3">{stars}</span>
                                <div className="flex-1 h-[15px] rounded-full overflow-hidden" style={{ backgroundColor: '#D9D9D9' }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ 
                                            width: `${getPercentage(stats.distribution[stars as keyof typeof stats.distribution])}%`, 
                                            backgroundColor: '#FFCB45' 
                                        }}
                                    />
                                </div>
                                <span className="text-xs text-gray-400 w-8 text-right">
                                    {getPercentage(stats.distribution[stars as keyof typeof stats.distribution])}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
                    {reviews.map((review) => {
                        const consumer = getConsumerDisplay(review);
                        return (
                            <div 
                                key={review.id} 
                                className="border border-gray-200 p-6 h-[200px] cursor-pointer hover:shadow-lg transition-shadow"
                                style={{ borderRadius: '40px' }}
                                onClick={() => navigate(`/item/${review.productId}`)}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    {consumer.avatar ? (
                                        <img 
                                            src={consumer.avatar} 
                                            alt={consumer.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                                            {consumer.name?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-dark truncate">{consumer.name}</p>
                                        <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                                    </div>
                                    {review.verifiedPurchase && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex-shrink-0">
                                            Verified
                                        </span>
                                    )}
                                </div>
                                
                                <div className="mb-2 text-xs text-gray-500 truncate">
                                    <span className="font-medium text-gray-700">{productNames.get(review.productId) || 'Product'}</span>
                                    <span className="mx-1">•</span>
                                    <span>{farmerNames.get(review.farmerId) || 'Farmer'}</span>
                                </div>

                                <div className="flex gap-0.5 mb-2">
                                    {[...Array(5)].map((_, s) => (
                                        <span key={s} className={`text-sm ${s < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                                    ))}
                                </div>
                                
                                <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}