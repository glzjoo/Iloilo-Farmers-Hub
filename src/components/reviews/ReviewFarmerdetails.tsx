import { useState, useRef, type ChangeEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Camera from '../../assets/icons/camera.svg';
import { addReview } from '../../services/reviewService';
import { useAuth } from '../../context/AuthContext';

const StarIcon = ({ filled, onClick }: { filled: boolean; onClick: () => void }) => (
    <svg
        onClick={onClick}
        className={`w-10 h-10 cursor-pointer transition-colors ${filled ? 'text-[#187A38]' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
    >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

interface LocationState {
    productId?: string;
    farmerId?: string;
    orderId?: string;
    fromOrder?: boolean;
}

export default function ReviewFarmerDetails() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, userProfile } = useAuth();

    const { productId, farmerId, orderId, fromOrder } = (location.state as LocationState) || {};

    const [rating, setRating] = useState(0);
    const [quality, setQuality] = useState(0);
    const [appearance, setAppearance] = useState(0);
    const [comment, setComment] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [video, setVideo] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        for (const file of files) {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');

            if (isImage) {
                if (images.length >= 5) {
                    alert('Maximum 5 images allowed');
                    continue;
                }
                setImages(prev => [...prev, file]);
            } else if (isVideo) {
                if (video) {
                    alert('Only 1 video allowed. Remove current video first.');
                    continue;
                }
                if (file.size > 50 * 1024 * 1024) {
                    alert('Video must be less than 50MB');
                    continue;
                }
                setVideo(file);
            }
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeVideo = () => {
        setVideo(null);
    };

    const totalMediaCount = images.length + (video ? 1 : 0);

    const handleSubmit = async () => {
        if (!user || !userProfile) {
            setError('Please log in to submit a review');
            return;
        }

        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        if (quality === 0) {
            setError('Please rate the quality');
            return;
        }

        if (!productId || !farmerId) {
            setError('Missing product or farmer information');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const reviewData: any = {
                productId,
                farmerId,
                consumerId: user.uid,
                consumerName: `${userProfile.firstName} ${userProfile.lastName}`,
                consumerAvatar: userProfile.profileImage || '',
                rating,
                quality: quality > 0 ? `${quality}/5` : '',
                appearance: appearance > 0 ? `${appearance}/5` : '',
                comment: comment.trim(),
                verifiedPurchase: fromOrder || false,
            };

            if (orderId) {
                reviewData.orderId = orderId;
            }

            console.log('Submitting review with data:', reviewData);

            await addReview(reviewData, images, video);

            if (fromOrder) {
                navigate('/messages');
            } else {
                navigate(-1);
            }
        } catch (err: any) {
            console.error('Full error:', err);
            setError(err.message || 'Failed to submit review. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-12 mt-8 w-full max-w-6xl mx-auto px-4">
            {error && (
                <div className="w-full bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            <div className="flex flex-col flex-1 pl-2">
                <p className="font-semibold text-lg text-black mb-4">Rate Farmer</p>
                <div className="flex gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                            key={star}
                            filled={rating >= star}
                            onClick={() => setRating(star)}
                        />
                    ))}
                </div>


                {/* Combined Media Upload Section */}
                <p className="font-medium text-black mb-4">
                    Add photos or video ({totalMediaCount}/6)
                </p>

                {/* Selected Media Preview */}
                <div className="flex gap-3 flex-wrap mb-4">
                    {/* Images */}
                    {images.map((img, idx) => (
                        <div key={`img-${idx}`} className="relative w-20 h-20">
                            <img
                                src={URL.createObjectURL(img)}
                                alt=""
                                className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                                onClick={() => removeImage(idx)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                            >
                                ×
                            </button>
                        </div>
                    ))}

                    {/* Video */}
                    {video && (
                        <div className="relative w-28 h-20">
                            <video
                                src={URL.createObjectURL(video)}
                                className="w-full h-full object-cover rounded-lg"
                            />
                            <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                                VIDEO
                            </span>
                            <button
                                onClick={removeVideo}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {/* Single Add Button */}
                    {totalMediaCount < 6 && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-[#187A38] hover:border-primary hover:bg-green-50 transition-colors"
                        >
                            <img src={Camera} alt="" className="w-6 h-6 mb-1" />
                            <span className="text-xs font-medium text-gray-600">Add Media</span>
                        </button>
                    )}
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                />

                <p className="text-xs text-gray-500 mb-6">
                    Max 5 images + 1 video. Video max 50MB.
                </p>
            </div>

            <div className="flex flex-col flex-1">
                <div className="flex justify-start mb-2">
                    <span className="text-sm text-gray-600">
                        {comment.length}/500 characters
                    </span>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-black">Quality:</label>
                        <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <StarIcon
                                    key={`quality-${star}`}
                                    filled={quality >= star}
                                    onClick={() => setQuality(star)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-black">Appearance:</label>
                        <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <StarIcon
                                    key={`appearance-${star}`}
                                    filled={appearance >= star}
                                    onClick={() => setAppearance(star)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-black">Comment:</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value.slice(0, 500))}
                            placeholder="Share your overall experience with this farmer and product..."
                            className="w-full h-[120px] bg-white border border-gray-300 rounded-lg p-4 resize-none outline-none text-black focus:ring-1 focus:ring-[#187A38]"
                        />
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || rating === 0}
                    className="w-full h-12 bg-[#187A38] rounded-md text-white font-semibold mt-6 hover:bg-green-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
            </div>
        </div>
    );
}