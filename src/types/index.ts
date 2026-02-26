export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string;
    role: 'farmer' | 'consumer';
    createdAt: Date;
}

// Extended profile that combines auth + role-specific data
// This is what's actually returned by useAuth() after the context fetches complete data
export interface ExtendedUserProfile extends UserProfile {
    firstName?: string;
    lastName?: string;
    profileImage?: string;
    phoneNo?: string;
    // Farmer-specific fields
    farmName?: string;
    farmAddress?: string;
    farmType?: string;
    verificationStatus?: 'pending' | 'verified' | 'rejected';
    // Consumer-specific fields
    interest?: string;
    address?: string; // Consumer's address (different from cardAddress)
}

export interface Farmer {
    uid: string;
    firstName: string;
    lastName: string;
    phoneNo: string;
    email: string | null;
    idType: string;
    cardAddress: string;
    profileImage?: string;
    createdAt: Date;
    // verification fields
    verificationStatus?: 'pending' | 'verified' | 'rejected';
    verificationData?: VerificationData;
    farmName?: string;
    farmAddress?: string;
    farmType?: string;
    // lastPhotoChange for the 1-week cooldown feature
    lastPhotoChange?: Date | { toDate(): Date } | any; // Firestore timestamp
}

export interface Consumer {
    uid: string;
    firstName: string;
    lastName: string;
    phoneNo: string;
    email: string | null;
    address: string;
    profileImage?: string;
    createdAt: Date;
    interest?: string;
    // lastPhotoChange for consistency (if consumers also get photo upload)
    lastPhotoChange?: Date | { toDate(): Date } | any;
}


export interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    farmerId: string;
    description?: string;
    rating?: number;
    reviewCount?: number;
}


export interface PendingFarmer {
    tempId: string;
    farmerData: {
        firstName: string;
        lastName: string;
        email: string;
        farmName: string;
        farmAddress: string;
        phoneNo: string;
        farmType: string;
        password: string;
        confirmPassword: string;
        agreeToTerms: boolean;
    };
    authEmail: string;
    createdAt: Date;
    expiresAt: Date;
    verificationAttempts: number;
    maxAttempts: number;
    status?: 'pending' | 'completed' | 'expired';
    completedAt?: Date;
    assignedUid?: string;
}

// Verification data stored after Face++/Cloud Vision
export interface VerificationData {
    faceMatchScore: number;
    faceMatchPassed: boolean;
    extractedIdNumber?: string;
    extractedFullName?: string;
    extractedAddress?: string;
    idCardImageUrl?: string;
    selfieImageUrl?: string;
    verifiedAt: Date;
    verifiedBy: string; // 'face++_cloudVision'
    idType: string;
}

// Face++ API response types
export interface FacePlusPlusResult {
    confidence?: number;
    thresholds?: {
        '1e-3': number;
        '1e-4': number;
        '1e-5': number;
    };
    request_id?: string;
    time_used?: number;
    error_message?: string;
}

// Cloud Vision OCR result
export interface CloudVisionResult {
    fullTextAnnotation?: {
        text: string;
    };
    textAnnotations?: Array<{
        description: string;
        boundingPoly?: any;
    }>;
    error?: {
        message: string;
        code: number;
    };
}