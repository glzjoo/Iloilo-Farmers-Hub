export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string;
    role: 'farmer' | 'consumer';
    createdAt: Date;
}

// Extended profile that combines auth + role-specific data
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
    address?: string;
}

export interface Farmer {
    uid: string;
    firstName: string;
    lastName: string;
    phoneNo: string;
    email: string | null;
    idType?: string; // Made optional - comes from ID verification
    cardAddress?: string; // Made optional - comes from ID verification
    profileImage?: string;
    createdAt: Date;
    verificationStatus?: 'pending' | 'verified' | 'rejected';
    verificationData?: VerificationData;
    farmName?: string;
    farmAddress?: string;
    farmType?: string;
    lastPhotoChange?: Date | { toDate(): Date } | any;
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
    lastPhotoChange?: Date | { toDate(): Date } | any;
}

export interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    farmerId: string;
    description: string;
    rating: number;
    reviewCount: number;
    stock: string;
    unit: string;
    status: 'active' | 'inactive';
}

// Updated for passwordless OTP flow - REMOVED password fields
export interface PendingFarmer {
    tempId: string;
    farmerData: {
        firstName: string;
        lastName: string;
        email?: string; // Optional
        farmName: string;
        farmAddress: string;
        phoneNo: string;
        farmType: string;
        agreeToTerms: boolean;
    };
    idVerified: boolean; // Track if ID verification is complete
    verificationData?: VerificationData; // Store ID verification results
    createdAt: Date | any; // Firestore timestamp
    expiresAt: Date | any; // Firestore timestamp
    verificationAttempts?: number;
    maxAttempts?: number;
    status?: 'pending' | 'id_verified' | 'completed' | 'expired';
    completedAt?: Date | any;
    assignedUid?: string;
}

export interface VerificationData {
    faceMatchScore?: number;
    faceMatchPassed?: boolean;
    extractedIdNumber?: string;
    extractedFullName?: string;
    extractedAddress?: string;
    idCardImageUrl?: string;
    selfieImageUrl?: string;
    verifiedAt?: Date | any;
    verifiedBy?: string;
    idType?: string;
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