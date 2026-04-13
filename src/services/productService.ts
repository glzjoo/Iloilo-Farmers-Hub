import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    serverTimestamp,
    type QuerySnapshot,
    type DocumentData
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import type { Product } from '../types';
//product service
const PRODUCTS_COLLECTION = 'products';

// Helper to convert Firestore data to Product type
const convertDocToProduct = (doc: DocumentData): Product => {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name,
        price: data.price,
        image: data.image,
        category: data.category,
        farmerId: data.farmerId,
        farmerName: data.farmerName || '',
        description: data.description,
        rating: data.rating || 0,
        reviewCount: data.reviewCount || 0,
        stock: data.stock,
        unit: data.unit,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
    };
};

// Helper to extract storage path from download URL
const getStoragePathFromUrl = (downloadUrl: string): string | null => {
    try {
        console.log('=== DEBUG: Parsing URL ===');
        console.log('Input URL:', downloadUrl);
        
        const url = new URL(downloadUrl);
        console.log('Hostname:', url.hostname);
        console.log('Pathname:', url.pathname);
        console.log('Full URL parts:', {
            protocol: url.protocol,
            host: url.host,
            pathname: url.pathname,
            search: url.search,
            hash: url.hash
        });
        
        // Extract path after /o/
        const pathMatch = url.pathname.match(/\/o\/(.+)$/);
        console.log('Path match result:', pathMatch);
        
        if (pathMatch && pathMatch[1]) {
            const decodedPath = decodeURIComponent(pathMatch[1]);
            console.log('Decoded path:', decodedPath);
            return decodedPath;
        }
        
        console.warn('❌ Could not extract path from URL pattern');
        return null;
    } catch (error) {
        console.error('❌ Error parsing storage URL:', error);
        return null;
    }
};

// CREATE - Add new product
export const addProduct = async (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    imageFile: File | null,
    farmerName: string
): Promise<string> => {
    try {
        let imageUrl = '';
        
        if (imageFile) {
            imageUrl = await uploadProductImage(imageFile, productData.farmerId);
        }

        const productRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
            ...productData,
            farmerName,
            image: imageUrl,
            rating: 0,
            reviewCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return productRef.id;
    } catch (error) {
        console.error('Error adding product:', error);
        throw new Error('Failed to add product. Please try again.');
    }
};

// READ - Get all products for a farmer
export const getFarmerProducts = async (farmerId: string): Promise<Product[]> => {
    try {
        const q = query(
            collection(db, PRODUCTS_COLLECTION),
            where('farmerId', '==', farmerId),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
        return querySnapshot.docs.map(convertDocToProduct);
    } catch (error) {
        console.error('Error fetching farmer products:', error);
        throw new Error('Failed to fetch products.');
    }
};

// READ - Get single product
export const getProductById = async (productId: string): Promise<Product | null> => {
    try {
        const productDoc = await getDocs(query(
            collection(db, PRODUCTS_COLLECTION),
            where('__name__', '==', productId)
        ));
        
        if (productDoc.empty) return null;
        return convertDocToProduct(productDoc.docs[0]);
    } catch (error) {
        console.error('Error fetching product:', error);
        throw new Error('Failed to fetch product.');
    }
};

// UPDATE - Update product
export const updateProduct = async (
    productId: string,
    updates: Partial<Omit<Product, 'id' | 'farmerId' | 'createdAt'>>,
    newImageFile?: File | null
): Promise<void> => {
    try {
        console.log('=== DEBUG: Update Product ===');
        console.log('Product ID:', productId);
        console.log('New image file:', newImageFile ? newImageFile.name : 'none');
        
        const productRef = doc(db, PRODUCTS_COLLECTION, productId);
        const updateData: Record<string, any> = {
            ...updates,
            updatedAt: serverTimestamp(),
        };

        if (newImageFile) {
            const currentProduct = await getProductById(productId);
            console.log('Current product image URL:', currentProduct?.image);
            
            if (currentProduct?.image) {
                console.log('Attempting to delete old image...');
                await deleteProductImage(currentProduct.image);
            } else {
                console.log('No existing image to delete');
            }
            
            if (currentProduct?.farmerId) {
                const newImageUrl = await uploadProductImage(newImageFile, currentProduct.farmerId);
                updateData.image = newImageUrl;
                console.log('New image uploaded:', newImageUrl);
            }
        }

        await updateDoc(productRef, updateData);
        console.log('✅ Product updated successfully');
    } catch (error) {
        console.error('Error updating product:', error);
        throw new Error('Failed to update product.');
    }
};

// DELETE - Delete product
export const deleteProduct = async (productId: string, imageUrl?: string): Promise<void> => {
    try {
        console.log('=== DEBUG: Delete Product ===');
        console.log('Product ID:', productId);
        console.log('Image URL to delete:', imageUrl);

        if (imageUrl) {
            await deleteProductImage(imageUrl);
        } else {
            console.log('No image URL provided, skipping image deletion');
        }

        await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
        console.log('✅ Product document deleted');
    } catch (error) {
        console.error('Error deleting product:', error);
        throw new Error('Failed to delete product.');
    }
};

// UPLOAD - Upload product image to Firebase Storage
export const uploadProductImage = async (file: File, farmerId: string): Promise<string> => {
    try {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const storagePath = `products/${farmerId}/${fileName}`;
        
        console.log('=== DEBUG: Upload Image ===');
        console.log('Storage path:', storagePath);
        console.log('File name:', fileName);
        console.log('File size:', file.size);
        console.log('File type:', file.type);
        
        const storageRef = ref(storage, storagePath);
        console.log('Storage reference created:', storageRef.fullPath);
        
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);
        
        console.log('✅ Upload successful, download URL:', downloadUrl);
        return downloadUrl;
    } catch (error) {
        console.error('❌ Error uploading image:', error);
        throw new Error('Failed to upload image.');
    }
};

// DELETE - Delete product image from storage
export const deleteProductImage = async (imageUrl: string): Promise<void> => {
    try {
        console.log('=== DEBUG: Delete Image ===');
        
        const path = getStoragePathFromUrl(imageUrl);
        
        if (!path) {
            console.warn('❌ Could not extract path, aborting delete');
            return;
        }

        console.log('Creating storage reference for path:', path);
        
        const imageRef = ref(storage, path);
        console.log('Storage reference full path:', imageRef.fullPath);
        console.log('Storage reference bucket:', imageRef.bucket);
        console.log('Storage reference name:', imageRef.name);
        
        console.log('Attempting deleteObject...');
        await deleteObject(imageRef);
        console.log('✅ Successfully deleted image');
        
    } catch (error: any) {
        console.error('=== DEBUG: Delete Error ===');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error serverResponse:', error.serverResponse);
        
        if (error.code === 'storage/object-not-found') {
            console.log('ℹ️ Image already deleted or does not exist');
            return;
        }
        
        if (error.code === 'storage/unauthorized') {
            console.error('❌ Permission denied - check storage rules');
        }
        
        // Don't throw - allow product deletion to continue
    }
};

export const getAllActiveProducts = async (): Promise<Product[]> => {
    try {
        const q = query(
            collection(db, PRODUCTS_COLLECTION),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
        return querySnapshot.docs.map(convertDocToProduct);
    } catch (error) {
        console.error('Error fetching active products:', error);
        throw new Error('Failed to fetch products.');
    }
};