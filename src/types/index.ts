export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string;
    role: 'farmer' | 'consumer';
    createdAt: Date;
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
    // New verification fields
    verificationStatus?: 'pending' | 'verified' | 'rejected';
    verificationData?: VerificationData;
    farmName?: string;
    farmAddress?: string;
    farmType?: string;
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

// NEW: Pending farmer data for verification-first flow
export interface PendingFarmer {
    tempId: string;
    farmerData: FarmerSignupData; // From validations.ts
    emailForAuth: string;
    createdAt: Date;
    expiresAt: Date;
    verificationAttempts: number;
    maxAttempts: number;
    status?: 'pending' | 'completed' | 'expired';
    completedAt?: Date;
    assignedUid?: string;
}

// NEW: Verification data stored after Face++/Cloud Vision
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

// NEW: Face++ API response types
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

// NEW: Cloud Vision OCR result
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

// Import from validations to avoid circular dependency
import type { FarmerSignupData } from '../lib/validations';