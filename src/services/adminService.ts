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
            return false;
        }

        // Check password match on the client side
        const adminDoc = snapshot.docs[0].data();
        return adminDoc.password === password;
    } catch (error) {
        console.error('Admin login error:', error);
        throw new Error('Failed to verify admin credentials.');
    }
};
