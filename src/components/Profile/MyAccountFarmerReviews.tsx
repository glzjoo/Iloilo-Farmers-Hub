
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getFarmerReviews } from '../../services/reviewService';
import { getProductById } from '../../services/shopService';
import type { Review } from '../../types';

interface ReviewWithProduct extends Review {
    productName?: string;
}

// Star display component - whole stars only
function StarDisplay({ rating, size = 'text-lg' }: { rating: number; size?: string }) {
    const roundedRating = Math.round(rating);
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={`${size} ${star <= roundedRating ? 'text-yellow-500' : 'text-gray-300'}`}
                >
                    ★
                </span>
            ))}
        </div>
    );
}

// Rating row with label
function RatingRow({ label, rating }: { label: string; rating: number }) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-20">{label}:</span>
            <StarDisplay rating={rating} size="text-sm" />
        </div>
    );
}

// Simple date formatter
const formatDate = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).replace(/\//g, '/');
};

export default function MyAccountFarmerReviews() {
    const [sortBy, setSortBy] = useState('newest');
    const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        const fetchReviews = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const farmerReviews = await getFarmerReviews(user.uid, 100);

                // Fetch product names for each review
                const reviewsWithProducts = await Promise.all(
                    farmerReviews.map(async (review) => {
                        try {
                            const product = await getProductById(review.productId);
                            return {
                                ...review,
                                productName: product?.name || 'Unknown Product'
                            };
                        } catch {
                            return {
                                ...review,
                                productName: 'Unknown Product'
                            };
                        }
                    })
                );

                setReviews(reviewsWithProducts);
            } catch (err: any) {
                console.error('Error fetching farmer reviews:', err);
                setError('Failed to load reviews');
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [user]);

    // Sort reviews based on selected option
    const sortedReviews = [...reviews].sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);

        switch (sortBy) {
            case 'newest':
                return dateB.getTime() - dateA.getTime();
            case 'oldest':
                return dateA.getTime() - dateB.getTime();
            case 'highest':
                return b.rating - a.rating;
            case 'lowest':
                return a.rating - b.rating;
            default:
                return dateB.getTime() - dateA.getTime();
        }
    });

    if (loading) {
        return (
            <div className="border border-gray-200 rounded-xl p-6 min-h-[400px]">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold font-primary">Reviews</h2>
                </div>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="border border-gray-200 rounded-xl p-6 min-h-[400px]">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold font-primary">Reviews</h2>
                </div>
                <div className="text-center py-12 text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="border border-gray-200 rounded-xl p-6 min-h-[400px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold font-primary">Reviews ({reviews.length})</h2>

                <div className="relative">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2 pr-8 rounded-md bg-primary text-white text-sm font-semibold cursor-pointer outline-none appearance-none"
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="highest">Highest Rating</option>
                        <option value="lowest">Lowest Rating</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Reviews List */}
            {sortedReviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                    <p className="text-gray-400 text-base font-medium">No reviews yet</p>
                    <p className="text-gray-400 text-sm mt-1">Reviews from buyers will appear here</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2">
                    {sortedReviews.map((review) => (
                        <div key={review.id} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                            {/* Review Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                                        {review.consumerAvatar ? (
                                            <img
                                                src={review.consumerAvatar}
                                                alt={review.consumerName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-lg font-bold text-gray-600">
                                                {review.consumerName.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-primary font-bold text-black">
                                            {review.consumerName}
                                        </h3>
                                        {/* Product Name Label */}
                                        <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                                            {review.productName}
                                        </span>
                                        {review.verifiedPurchase && (
                                            <span className="text-xs text-green-600 font-medium ml-2">
                                                ✓ Verified
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <StarDisplay rating={review.rating} size="text-base" />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatDate(review.createdAt)}
                                    </p>
                                </div>
                            </div>

                            {/* Review Content */}
                            <div className="ml-13 pl-0.5">
                                {/* Review Images */}
                                {review.images && review.images.length > 0 && (
                                    <div className="flex gap-2 mb-3">
                                        {review.images.map((img: string, idx: number) => (
                                            <img
                                                key={idx}
                                                src={img}
                                                alt={`Review ${idx + 1}`}
                                                className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80"
                                                onClick={() => window.open(img, '_blank')}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Video */}
                                {review.video && (
                                    <video
                                        src={review.video}
                                        controls
                                        className="w-full max-w-sm mb-3 rounded-lg"
                                    />
                                )}

                                {/* UPDATED: Rating Details with Stars */}
                                <div className="bg-white/50 rounded-lg p-3 space-y-2 mb-3">
                                    <RatingRow label="Rating" rating={review.rating} />
                                    <RatingRow label="Quality" rating={review.quality} />
                                    <RatingRow label="Appearance" rating={review.appearance} />
                                    {review.farmerRating > 0 && (
                                        <RatingRow label="Farmer Service" rating={review.farmerRating} />
                                    )}
                                </div>

                                {/* Comment */}
                                <p className="text-sm font-primary text-black">{review.comment}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}