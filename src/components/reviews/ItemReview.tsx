// ============================================
// FILE: src/components/reviews/ItemReview.tsx (COMPLETE)
// ============================================
import { useState, useEffect } from 'react';
import Filter from '../../assets/icons/Filter.svg';
import { getProductReviews, getProductReviewStats } from '../../services/reviewService';
import type { Review } from '../../types';

interface ItemReviewProps {
    productId: string;
}

// Star display component - whole stars only
function StarRating({ rating, size = 'text-lg' }: { rating: number; size?: string }) {
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

// Star rating with label
function RatingRow({ label, rating }: { label: string; rating: number }) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-24">{label}:</span>
            <StarRating rating={rating} size="text-sm" />
            <span className="text-sm text-gray-400">({rating}/5)</span>
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

const formatTime = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

export default function ItemReview({ productId }: ItemReviewProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
    const [loading, setLoading] = useState(true);
    const [filterRating, setFilterRating] = useState<number | null>(null);

    useEffect(() => {
        console.log('ItemReview mounted with productId:', productId);
        
        const fetchReviews = async () => {
            if (!productId) {
                console.log('No productId provided, skipping fetch');
                setLoading(false);
                return;
            }

            try {
                console.log('Fetching reviews for productId:', productId);
                const [reviewsData, statsData] = await Promise.all([
                    getProductReviews(productId, 50),
                    getProductReviewStats(productId)
                ]);
                console.log('Fetched reviews:', reviewsData.length, 'Stats:', statsData);
                setReviews(reviewsData);
                setStats(statsData);
            } catch (error) {
                console.error('Error fetching reviews:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [productId]);

    const filteredReviews = filterRating 
        ? reviews.filter(r => Math.round(r.rating) === filterRating)
        : reviews;

    if (loading) {
        return (
            <section className="w-full py-12">
                <div className="max-w-4xl mx-auto px-10">
                    <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full py-12">
            <div className="max-w-4xl mx-auto px-10">
                {/* Stats Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-primary font-semibold text-black">Reviews</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {stats.averageRating.toFixed(1)} ★ • {stats.totalReviews} reviews
                        </p>
                    </div>
                    <div className="relative group">
                        <button className="flex items-center gap-2 bg-transparent border-none cursor-pointer">
                            <img src={Filter} className="w-5 h-5" alt="Filter" />
                            {filterRating && <span className="text-sm text-primary">{filterRating}★</span>}
                        </button>
                        {/* Filter Dropdown */}
                        <div className="absolute right-0 top-full mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button 
                                onClick={() => setFilterRating(null)}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${!filterRating ? 'text-primary font-medium' : ''}`}
                            >
                                All
                            </button>
                            {[5, 4, 3, 2, 1].map(star => (
                                <button 
                                    key={star}
                                    onClick={() => setFilterRating(star)}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filterRating === star ? 'text-primary font-medium' : ''}`}
                                >
                                    {star} Stars
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {filteredReviews.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        {filterRating 
                            ? `No ${filterRating}-star reviews yet`
                            : 'No reviews yet. Be the first to review!'
                        }
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {filteredReviews.map((review) => (
                            <div key={review.id} className="bg-gray-100 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-3">
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
                                        <h3 className="text-lg font-primary font-bold text-black">
                                            {review.consumerName}
                                        </h3>
                                        {review.verifiedPurchase && (
                                            <span className="text-xs text-green-600 font-medium">
                                                ✓ Verified Purchase
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="ml-13 pl-0.5 space-y-3">
                                    {/* Overall Product Rating */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-600">Rating: </span>
                                        <StarRating rating={review.rating} />
            
                                    </div>
                                    
                                    {/* Detailed Ratings */}
                                    <div className="bg-white/50 rounded-lg p-3 space-y-2">
                                        <RatingRow label="Quality" rating={review.quality} />
                                        <RatingRow label="Appearance" rating={review.appearance} />
                                        {review.farmerRating > 0 && (
                                            <RatingRow label="Farmer Service" rating={review.farmerRating} />
                                        )}
                                    </div>
                                    
                                    <p className="text-sm font-primary text-gray-600">
                                        {formatDate(review.createdAt)} &nbsp; {formatTime(review.createdAt)}
                                    </p>
                                    
                                    {/* Review Images */}
                                    {review.images && review.images.length > 0 && (
                                        <div className="flex gap-2 mt-3">
                                            {review.images.map((img: string, idx: number) => (
                                                <img 
                                                    key={idx}
                                                    src={img} 
                                                    alt={`Review ${idx + 1}`}
                                                    className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80"
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
                                            className="w-full max-w-md mt-3 rounded-lg"
                                        />
                                    )}
                                    
                                    {/* Comment */}
                                    {review.comment && (
                                        <p className="text-sm font-primary text-black mt-2 bg-white/30 p-3 rounded-lg">
                                            {review.comment}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}