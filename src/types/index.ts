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
