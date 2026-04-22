import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    query,
    orderBy,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Report } from '../components/admin/adminTypes';

const REPORTS_COLLECTION = 'reports_users';

/**
 * Submit a new user report to Firestore.
 */
export const submitReport = async (data: {
    type: string;
    reportedUser: string;
    reportedUserId: string;
    role: 'Seller' | 'Consumer';
    reportedBy: string;
    reportedById: string;
    reason: string;
    conversationId?: string;
}): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, REPORTS_COLLECTION), {
            ...data,
            status: 'Pending',
            reportCount: 1,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error submitting report:', error);
        throw new Error('Failed to submit report.');
    }
};

/**
 * Fetch all reports for the admin dashboard.
 */
export const getReports = async (): Promise<Report[]> => {
    try {
        const q = query(
            collection(db, REPORTS_COLLECTION),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map((docSnap, idx) => {
            const data = docSnap.data();
            const createdAt = data.createdAt?.toDate?.();
            return {
                id: `#${String(idx + 1).padStart(3, '0')}`,
                firestoreId: docSnap.id,
                type: data.type || 'Other',
                reportedUser: data.reportedUser || 'Unknown',
                reportedUserId: data.reportedUserId || '',
                role: data.role || 'Consumer',
                reportCount: data.reportCount || 1,
                reportedBy: data.reportedBy || 'Unknown',
                reportedById: data.reportedById || '',
                reason: data.reason || '',
                status: data.status || 'Pending',
                date: createdAt ? createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                conversationId: data.conversationId || '',
            } as Report;
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        throw new Error('Failed to fetch reports.');
    }
};

/**
 * Update the status of a report (suspend, ban, resolve, etc.)
 */
export const updateReportStatus = async (
    firestoreId: string,
    status: Report['status']
): Promise<void> => {
    try {
        const docRef = doc(db, REPORTS_COLLECTION, firestoreId);
        await updateDoc(docRef, { status });
    } catch (error) {
        console.error('Error updating report status:', error);
        throw new Error('Failed to update report status.');
    }
};

/**
 * Suspend a user — sets 'suspended' field on their users, farmers, and consumers docs.
 * This prevents them from logging in.
 * Note: We try updateDoc directly without getDoc since the admin may not be Firebase-authenticated.
 */
export const suspendUser = async (
    userId: string,
    type: 'warning' | '1 week suspension' | '30 days suspension' | 'permanent'
): Promise<void> => {
    const getSuspendedUntil = () => {
        switch (type) {
            case 'warning':
                return null; // Warning only, no suspension period
            case '1 week suspension':
                return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            case '30 days suspension':
                return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            case 'permanent':
                return null; // Permanent, no end date
        }
    };

    const suspensionData = {
        suspended: type !== 'warning',
        suspensionType: type,
        suspendedAt: serverTimestamp(),
        suspendedUntil: getSuspendedUntil(),
        warningAcknowledged: type === 'warning' ? false : null,
    };

    const collections = ['users', 'farmers', 'consumers'];

    for (const col of collections) {
        try {
            const ref = doc(db, col, userId);
            await updateDoc(ref, suspensionData);
            console.log(`Updated ${col}/${userId} with suspension`);
        } catch (error: any) {
            // Doc may not exist in this collection — that's fine, skip it
            if (error.code === 'not-found' || error.message?.includes('No document')) {
                console.log(`No doc in ${col}/${userId}, skipping`);
            } else {
                console.warn(`Could not update ${col}/${userId}:`, error.message);
            }
        }
    }

    console.log(`User ${userId} suspended (${type})`);
};

/**
 * Unsuspend / reactivate a user — removes the suspension fields.
 */
export const unsuspendUser = async (userId: string): Promise<void> => {
    const unsuspendData = {
        suspended: false,
        suspensionType: null,
        suspendedAt: null,
        suspendedUntil: null,
    };

    const collections = ['users', 'farmers', 'consumers'];

    for (const col of collections) {
        try {
            const ref = doc(db, col, userId);
            await updateDoc(ref, unsuspendData);
            console.log(`Updated ${col}/${userId} — unsuspended`);
        } catch (error: any) {
            if (error.code === 'not-found' || error.message?.includes('No document')) {
                console.log(`No doc in ${col}/${userId}, skipping`);
            } else {
                console.warn(`Could not update ${col}/${userId}:`, error.message);
            }
        }
    }

    console.log(`User ${userId} unsuspended`);
};
