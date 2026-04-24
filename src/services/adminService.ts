import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Verify admin credentials against the 'admins' collection in Firestore.
 */
export const verifyAdminLogin = async (
    username: string,
    password: string
): Promise<boolean> => {
    try {
        const q = query(
            collection(db, 'admins'),
            where('username', '==', username)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log('No admin found with username:', username);
            return false;
        }

        const adminDoc = snapshot.docs[0].data();
        const isMatch = adminDoc.password === password;
        
        if (!isMatch) {
            console.log('Password mismatch for admin:', username);
        }
        
        return isMatch;
    } catch (error: any) {
        console.error('Admin login error:', error.code || 'NO_CODE', error.message || error);
        // Re-throw with more detail for the UI
        throw new Error(error.message || 'Failed to verify admin credentials.');
    }
};