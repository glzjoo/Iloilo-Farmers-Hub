import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db } from '../lib/firebase';
import type { Appeal } from '../components/admin/adminTypes';

const APPEALS_COLLECTION = 'appeals';

/**
 * Submit a new appeal.
 */
export const submitAppeal = async (data: {
  userId: string;
  userName: string;
  userEmail: string;
  suspensionType: string;
  reason: string;
  mediaUrls?: { url: string; type: 'image' | 'video' }[];
}): Promise<string> => {
  // Prevent duplicate pending appeals
  const existingQuery = query(
    collection(db, APPEALS_COLLECTION),
    where('userId', '==', data.userId),
    where('status', 'in', ['Pending', 'Under Review'])
  );
  const existing = await getDocs(existingQuery);
  if (!existing.empty) {
    throw new Error('You already have a pending appeal. Please wait for admin review.');
  }

  const docRef = await addDoc(collection(db, APPEALS_COLLECTION), {
    ...data,
    status: 'Pending',
    adminNotes: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

/**
 * Upload appeal media to Firebase Storage.
 */
export const uploadAppealMedia = async (
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; type: 'image' | 'video' }> => {
  const storage = getStorage();
  const isVideo = file.type.startsWith('video/');
  const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
  const path = `appeals_media/${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({ url, type: isVideo ? 'video' : 'image' });
      }
    );
  });
};

/**
 * Fetch all appeals for admin.
 */
export const getAppeals = async (): Promise<Appeal[]> => {
  const q = query(collection(db, APPEALS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap, idx) => {
    const data = docSnap.data();
    const createdAt = data.createdAt?.toDate?.();
    return {
      id: `#${String(idx + 1).padStart(3, '0')}`,
      firestoreId: docSnap.id,
      userId: data.userId || '',
      userName: data.userName || 'Unknown',
      userEmail: data.userEmail || '',
      suspensionType: data.suspensionType || 'permanent',
      reason: data.reason || '',
      mediaUrls: data.mediaUrls || [],
      status: data.status || 'Pending',
      adminNotes: data.adminNotes || '',
      createdAt: createdAt ? createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || '',
    } as Appeal;
  });
};

/**
 * Update appeal status + admin notes.
 */
export const updateAppealStatus = async (
  firestoreId: string,
  status: Appeal['status'],
  adminNotes?: string
): Promise<void> => {
  const updateData: Record<string, any> = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
  await updateDoc(doc(db, APPEALS_COLLECTION, firestoreId), updateData);
};