import { 
    collection, 
    doc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    serverTimestamp,
    updateDoc,
    getDoc,
    increment,
    writeBatch,
    limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import type { Review, ReviewStats } from '../types';

export type { Review } from '../types';

const REVIEWS_COLLECTION = 'reviews';
const PRODUCTS_COLLECTION = 'products';
const FARMERS_COLLECTION = 'farmers';

// Helper to convert Firestore doc to Review
const convertDocToReview = (doc: any): Review => {
    const data = doc.data();
    return {
        id: doc.id,
        productId: data.productId,
        farmerId: data.farmerId,
        consumerId: data.consumerId,
        consumerName: data.consumerName,
        consumerAvatar: data.consumerAvatar,
        rating: data.rating,
        quality: data.quality,
        appearance: data.appearance,
        comment: data.comment,
        images: data.images || [],
        video: data.video,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        orderId: data.orderId,
        verifiedPurchase: data.verifiedPurchase || false,
    };
};

//------------------------------------------CREATE SECTION------------------------------------------

// CREATE - Add a new review
export const addReview = async (
    reviewData: any, // Changed to any to be flexible
    imageFiles?: File[],
    videoFile?: File | null
): Promise<string> => {
    try {
        console.log('addReview received:', reviewData);
        
        const batch = writeBatch(db);
        
        // 1. Upload images if provided
        const imageUrls: string[] = [];
        if (imageFiles && imageFiles.length > 0) {
            for (const file of imageFiles) {
                const url = await uploadReviewMedia(file, reviewData.consumerId, 'image');
                imageUrls.push(url);
            }
        }

        // 2. Upload video if provided
        let videoUrl: string | null = null;
        if (videoFile) {
            videoUrl = await uploadReviewMedia(videoFile, reviewData.consumerId, 'video');
        }

        // 3. Create review document - Build clean object without undefined
        const reviewRef = doc(collection(db, REVIEWS_COLLECTION));
        
        const newReview: any = {
            productId: reviewData.productId,
            farmerId: reviewData.farmerId,
            consumerId: reviewData.consumerId,
            consumerName: reviewData.consumerName,
            consumerAvatar: reviewData.consumerAvatar || '',
            rating: reviewData.rating,
            quality: reviewData.quality,
            appearance: reviewData.appearance || '',
            comment: reviewData.comment,
            images: imageUrls,
            video: videoUrl,
            verifiedPurchase: reviewData.verifiedPurchase || false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        // Only add optional fields if they exist
        if (reviewData.orderId) {
            newReview.orderId = reviewData.orderId;
        }
        
        console.log('Creating review document:', newReview);
        
        batch.set(reviewRef, newReview);

        // 4. Update product rating stats
        const productRef = doc(db, PRODUCTS_COLLECTION, reviewData.productId);
        batch.update(productRef, {
            reviewCount: increment(1),
            lastReviewAt: serverTimestamp(),
        });

        // 5. Update farmer's review count
        const farmerRef = doc(db, FARMERS_COLLECTION, reviewData.farmerId);
        batch.update(farmerRef, {
            totalReviews: increment(1),
            lastReviewAt: serverTimestamp(),
        });

        await batch.commit();

        // 6. Recalculate and update average ratings
        await updateProductAverageRating(reviewData.productId);
        await updateFarmerAverageRating(reviewData.farmerId);

        return reviewRef.id;
    } catch (error) {
        console.error('Error adding review:', error);
        throw new Error('Failed to submit review. Please try again.');
    }
};

//------------------------------------------READ SECTION------------------------------------------

// READ - Get reviews for a product
export const getProductReviews = async (
    productId: string, 
    limitCount: number = 20
): Promise<Review[]> => {
    try {
        const q = query(
            collection(db, REVIEWS_COLLECTION),
            where('productId', '==', productId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(convertDocToReview);
    } catch (error) {
        console.error('Error fetching product reviews:', error);
        throw new Error('Failed to load reviews.');
    }
};

// READ - Get reviews for a farmer (all products)
export const getFarmerReviews = async (
    farmerId: string, 
    limitCount: number = 50
): Promise<Review[]> => {
    try {
        const q = query(
            collection(db, REVIEWS_COLLECTION),
            where('farmerId', '==', farmerId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(convertDocToReview);
    } catch (error) {
        console.error('Error fetching farmer reviews:', error);
        throw new Error('Failed to load reviews.');
    }
};

// READ - Get review stats for a product
export const getProductReviewStats = async (productId: string): Promise<ReviewStats> => {
    try {
        const q = query(
            collection(db, REVIEWS_COLLECTION),
            where('productId', '==', productId)
        );
        
        const snapshot = await getDocs(q);
        const reviews = snapshot.docs.map(convertDocToReview);
        
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let totalRating = 0;
        
        reviews.forEach(review => {
            distribution[review.rating as keyof typeof distribution]++;
            totalRating += review.rating;
        });
        
        return {
            averageRating: reviews.length > 0 ? totalRating / reviews.length : 0,
            totalReviews: reviews.length,
            ratingDistribution: distribution,
        };
    } catch (error) {
        console.error('Error calculating review stats:', error);
        return {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        };
    }
};

// READ - Check if user has already reviewed a product from an order
export const hasUserReviewedOrder = async (
    consumerId: string, 
    orderId: string
): Promise<boolean> => {
    try {
        const q = query(
            collection(db, REVIEWS_COLLECTION),
            where('consumerId', '==', consumerId),
            where('orderId', '==', orderId)
        );
        
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking existing review:', error);
        return false;
    }
};

// READ - Get a single review by ID
export const getReviewById = async (reviewId: string): Promise<Review | null> => {
    try {
        const reviewDoc = await getDoc(doc(db, REVIEWS_COLLECTION, reviewId));
        if (!reviewDoc.exists()) return null;
        return convertDocToReview(reviewDoc);
    } catch (error) {
        console.error('Error fetching review:', error);
        return null;
    }
};

// READ - Get recent top-rated reviews (for landing page)
export const getRecentTopReviews = async (
    limitCount: number = 3,
    minRating: number = 5
): Promise<Review[]> => {
    try {
        const q = query(
            collection(db, REVIEWS_COLLECTION),
            where('rating', '==', minRating),
            where('verifiedPurchase', '==', true),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(convertDocToReview);
    } catch (error) {
        console.error('Error fetching recent top reviews:', error);
        throw new Error('Failed to load reviews.');
    }
};

// READ - Get platform-wide review stats (for landing page)
export const getPlatformReviewStats = async (): Promise<ReviewStats> => {
    try {
        // For efficiency, we'll fetch last 100 reviews to calculate stats
        // If you have thousands, consider storing pre-calculated stats in a separate doc
        const q = query(
            collection(db, REVIEWS_COLLECTION),
            orderBy('createdAt', 'desc'),
            limit(100)
        );
        
        const snapshot = await getDocs(q);
        const reviews = snapshot.docs.map(convertDocToReview);
        
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let totalRating = 0;
        
        reviews.forEach(review => {
            distribution[review.rating as keyof typeof distribution]++;
            totalRating += review.rating;
        });
        
        const totalReviews = reviews.length;
        
        return {
            averageRating: totalReviews > 0 ? Math.round((totalRating / totalReviews) * 100) / 100 : 0,
            totalReviews,
            ratingDistribution: distribution,
        };
    } catch (error) {
        console.error('Error calculating platform stats:', error);
        return {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        };
    }
};

// READ - Get product names for reviews (helper)
export const getProductNamesForReviews = async (reviews: Review[]): Promise<Map<string, string>> => {
    const productIds = [...new Set(reviews.map(r => r.productId))];
    const productMap = new Map<string, string>();
    
    await Promise.all(
        productIds.map(async (productId) => {
            try {
                const productDoc = await getDoc(doc(db, PRODUCTS_COLLECTION, productId));
                if (productDoc.exists()) {
                    productMap.set(productId, productDoc.data().name);
                }
            } catch (error) {
                console.error(`Error fetching product ${productId}:`, error);
            }
        })
    );
    
    return productMap;
};

// READ - Get farmer names for reviews (helper)
export const getFarmerNamesForReviews = async (reviews: Review[]): Promise<Map<string, string>> => {
    const farmerIds = [...new Set(reviews.map(r => r.farmerId))];
    const farmerMap = new Map<string, string>();
    
    await Promise.all(
        farmerIds.map(async (farmerId) => {
            try {
                const farmerDoc = await getDoc(doc(db, FARMERS_COLLECTION, farmerId));
                if (farmerDoc.exists()) {
                    const data = farmerDoc.data();
                    farmerMap.set(farmerId, data.farmName || `${data.firstName} ${data.lastName}`);
                }
            } catch (error) {
                console.error(`Error fetching farmer ${farmerId}:`, error);
            }
        })
    );
    
    return farmerMap;
};

// READ - Get consumer profiles for reviews (for avatars)
export const getConsumerProfilesForReviews = async (reviews: Review[]): Promise<Map<string, { name: string; avatar: string }>> => {
    const consumerIds = [...new Set(reviews.map(r => r.consumerId))];
    const consumerMap = new Map<string, { name: string; avatar: string }>();
    
    await Promise.all(
        consumerIds.map(async (consumerId) => {
            try {
                const consumerDoc = await getDoc(doc(db, 'consumers', consumerId));
                if (consumerDoc.exists()) {
                    const data = consumerDoc.data();
                    consumerMap.set(consumerId, {
                        name: `${data.firstName} ${data.lastName}`,
                        avatar: data.profileImage || ''
                    });
                }
            } catch (error) {
                console.error(`Error fetching consumer ${consumerId}:`, error);
            }
        })
    );
    
    return consumerMap;
};

//------------------------------------------UPDATE SECTION------------------------------------------

// UPDATE - Update an existing review
export const updateReview = async (
    reviewId: string,
    updates: Partial<Pick<Review, 'rating' | 'quality' | 'appearance' | 'comment'>>,
    newImageFiles?: File[],
    newVideoFile?: File | null
): Promise<void> => {
    try {
        const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
        const reviewSnap = await getDoc(reviewRef);
        
        if (!reviewSnap.exists()) {
            throw new Error('Review not found');
        }
        
        const currentReview = convertDocToReview(reviewSnap);
        
        // Upload new media if provided
        const newImages: string[] = [...(currentReview.images || [])];
        if (newImageFiles && newImageFiles.length > 0) {
            for (const file of newImageFiles) {
                const url = await uploadReviewMedia(file, currentReview.consumerId, 'image');
                newImages.push(url);
            }
        }
        
        let newVideo = currentReview.video;
        if (newVideoFile) {
            newVideo = await uploadReviewMedia(newVideoFile, currentReview.consumerId, 'video');
        }
        
        await updateDoc(reviewRef, {
            ...updates,
            images: newImages,
            video: newVideo,
            updatedAt: serverTimestamp(),
        });
        
        // Recalculate averages
        await updateProductAverageRating(currentReview.productId);
        await updateFarmerAverageRating(currentReview.farmerId);
        
    } catch (error) {
        console.error('Error updating review:', error);
        throw new Error('Failed to update review.');
    }
};

//------------------------------------------DELETE SECTION------------------------------------------

// DELETE - Delete a review
export const deleteReview = async (reviewId: string): Promise<void> => {
    try {
        const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
        const reviewSnap = await getDoc(reviewRef);
        
        if (!reviewSnap.exists()) {
            throw new Error('Review not found');
        }
        
        const review = convertDocToReview(reviewSnap);
        
        const batch = writeBatch(db);
        
        // Delete review
        batch.delete(reviewRef);
        
        // Update product review count
        const productRef = doc(db, PRODUCTS_COLLECTION, review.productId);
        batch.update(productRef, {
            reviewCount: increment(-1),
        });
        
        // Update farmer review count
        const farmerRef = doc(db, FARMERS_COLLECTION, review.farmerId);
        batch.update(farmerRef, {
            totalReviews: increment(-1),
        });
        
        await batch.commit();
        
        // Recalculate averages
        await updateProductAverageRating(review.productId);
        await updateFarmerAverageRating(review.farmerId);
        
    } catch (error) {
        console.error('Error deleting review:', error);
        throw new Error('Failed to delete review.');
    }
};

//------------------------------------------HELPERS------------------------------------------

// HELPER - Upload review media (images/video)
const uploadReviewMedia = async (
    file: File, 
    consumerId: string, 
    type: 'image' | 'video'
): Promise<string> => {
    try {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const folder = type === 'image' ? 'images' : 'videos';
        const storagePath = `reviews/${consumerId}/${folder}/${fileName}`;
        
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);
        
        return downloadUrl;
    } catch (error) {
        console.error(`Error uploading ${type}:`, error);
        throw new Error(`Failed to upload ${type}.`);
    }
};

// HELPER - Update product average rating
const updateProductAverageRating = async (productId: string): Promise<void> => {
    try {
        const stats = await getProductReviewStats(productId);
        const productRef = doc(db, PRODUCTS_COLLECTION, productId);
        
        await updateDoc(productRef, {
            rating: Math.round(stats.averageRating * 10) / 10, // Round to 1 decimal
        });
    } catch (error) {
        console.error('Error updating product rating:', error);
    }
};

// HELPER - Update farmer average rating
const updateFarmerAverageRating = async (farmerId: string): Promise<void> => {
    try {
        const q = query(
            collection(db, REVIEWS_COLLECTION),
            where('farmerId', '==', farmerId)
        );
        
        const snapshot = await getDocs(q);
        const reviews = snapshot.docs.map(convertDocToReview);
        
        if (reviews.length === 0) return;
        
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const average = totalRating / reviews.length;
        
        const farmerRef = doc(db, FARMERS_COLLECTION, farmerId);
        await updateDoc(farmerRef, {
            averageRating: Math.round(average * 10) / 10,
        });
    } catch (error) {
        console.error('Error updating farmer rating:', error);
    }
};