// ============================================
// FILE: src/components/selling/ListingProducts.tsx (DYNAMIC)
// ============================================
import mylisting from '../../assets/icons/mylisting.svg';
import searchIcon from '../../assets/icons/search.svg';
import ListedProductCard from './ListedProductCard';
import EditProductModal from './EditProductModal';
import ConfirmationModal from '../common/ConfirmationModal';
import ErrorModal from '../common/ErrorModal';
import type { Product } from '../../types';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function ListingProducts() {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // Real-time listener for farmer's products
        const productsQuery = query(
            collection(db, 'products'),
            where('farmerId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(
            productsQuery,
            (snapshot) => {
                const productsList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Product));
                
                // Sort by created date (newest first)
                productsList.sort((a, b) => {
                    const dateA = a.createdAt?.toDate?.() || new Date(0);
                    const dateB = b.createdAt?.toDate?.() || new Date(0);
                    return dateB.getTime() - dateA.getTime();
                });
                
                setProducts(productsList);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching products:', err);
                setError('Failed to load products');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user?.uid]);

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
    };

    const handleDelete = (product: Product) => {
        setProductToDelete(product);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;

        try {
            await deleteDoc(doc(db, 'products', productToDelete.id));
            // onSnapshot will automatically update the list
        } catch (err: any) {
            alert('Failed to delete product: ' + err.message);
        } finally {
            setProductToDelete(null);
        }
    };

    const cancelDelete = () => {
        setProductToDelete(null);
    };

    const handleSaveEdit = async (updatedProduct: Product) => {
        try {
            const productRef = doc(db, 'products', updatedProduct.id);
            await updateDoc(productRef, {
                name: updatedProduct.name,
                price: updatedProduct.price,
                stock: updatedProduct.stock,
                unit: updatedProduct.unit,
                description: updatedProduct.description,
                category: updatedProduct.category,
                status: updatedProduct.status,
                updatedAt: new Date()
            });
            setEditingProduct(null);
        } catch (err: any) {
            setActionError('Failed to update product: ' + err.message);
        }
    };

    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!user) {
        return (
            <section className="max-w-7xl mx-auto px-10 py-8 text-center">
                <p className="text-gray-500">Please login to view your listings</p>
            </section>
        );
    }

    if (loading) {
        return (
            <section className="max-w-7xl mx-auto px-10 py-8">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </section>
        );
    }

    return (
        <section className="max-w-7xl mx-auto px-10 py-8">
            <div className="flex items-center gap-4 mb-2">
                <img src={mylisting} alt="My Listing" className="w-8 h-8" />
                <h1 className="text-3xl font-bold">My Listing</h1>
                <div className="relative ml-6">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-4 pr-10 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-[400px] text-sm"
                    />
                    <img src={searchIcon} alt="Search" className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" />
                </div>
            </div>

            <h2 className="text-xl font-semibold mt-4 mb-6">
                Your listed products ({filteredProducts.length})
            </h2>

            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg">
                        {searchQuery ? 'No products match your search' : 'No products listed yet'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => window.location.href = '/sell'}
                            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg"
                        >
                            Add Your First Product
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                        <ListedProductCard
                            key={product.id}
                            product={product}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
            <ConfirmationModal
                isOpen={Boolean(productToDelete)}
                title="Delete product"
                message={productToDelete ? `Are you sure you want to delete "${productToDelete.name}"? This action cannot be undone.` : 'Are you sure you want to delete this product?'}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={handleConfirmDelete}
                onCancel={cancelDelete}
                variant="warning"
            />

            <ErrorModal
                isOpen={Boolean(actionError)}
                title="Action failed"
                message={actionError}
                onClose={() => setActionError('')}
            />
            {/* Edit Product Modal */}
            {editingProduct && (
                <EditProductModal
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                    onUpdateSuccess={() => setEditingProduct(null)}
                />
            )}
        </section>
    );
}