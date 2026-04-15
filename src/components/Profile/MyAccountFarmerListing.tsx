import { useState, useEffect } from 'react';
import searchIcon from '../../assets/icons/search.svg';
import filterIcon from '../../assets/icons/Filter.svg';
import ListedProductCard from '../selling/ListedProductCard';
import EditProductModal from '../selling/EditProductModal';
import ConfirmationModal from '../common/ConfirmationModal';
import type { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getFarmerProducts, deleteProduct } from '../../services/productService';
import MyAccountFarmerFilterDropdown from './MyAccountFarmerFilterDropdown';

export default function MyAccountFarmerListing() {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilters, setActiveFilters] = useState({ category: 'All', status: 'All', sortBy: 'Newest' });

    // Fetch products on mount
    useEffect(() => {
        const fetchProducts = async () => {
            if (!user) return;

            try {
                setLoading(true);
                const farmerProducts = await getFarmerProducts(user.uid);
                setProducts(farmerProducts);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch products');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [user]);

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
    };

    const handleDelete = (product: Product) => {
        setProductToDelete(product);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;

        setDeleteLoading(productToDelete.id);
        try {
            await deleteProduct(productToDelete.id, productToDelete.image);
            setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
        } catch (err: any) {
            alert(err.message || 'Failed to delete product');
        } finally {
            setDeleteLoading(null);
            setProductToDelete(null);
        }
    };

    const cancelDelete = () => {
        setProductToDelete(null);
    };

    const handleUpdateSuccess = (updatedProduct: Product) => {
        setProducts(prev => prev.map(p =>
            p.id === updatedProduct.id ? updatedProduct : p
        ));
        setEditingProduct(null);
    };

    // Filter and sort products
    const filteredProducts = products
        .filter(product =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter(product => {
            if (activeFilters.category !== 'All' && product.category !== activeFilters.category) return false;
            if (activeFilters.status !== 'All' && product.status !== activeFilters.status.toLowerCase()) return false;
            return true;
        })
        .sort((a, b) => {
            switch (activeFilters.sortBy) {
                case 'Price: High-Low': return b.price - a.price;
                case 'Price: Low-High': return a.price - b.price;
                case 'Name: A-Z': return a.name.localeCompare(b.name);
                case 'Name: Z-A': return b.name.localeCompare(a.name);
                default: return 0;
            }
        });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold font-primary">Listings ({filteredProducts.length})</h2>
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search listings..."
                            className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary w-[250px]"
                        />
                        <img src={searchIcon} alt="" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                    </div>

                    {/* Filters Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium cursor-pointer transition-colors ${showFilters
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            Filters
                            <img src={filterIcon} alt="" className="w-4 h-4" />
                        </button>

                        {/* Filter Dropdown */}
                        {showFilters && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
                                <MyAccountFarmerFilterDropdown
                                    onApply={(filters) => setActiveFilters(filters)}
                                    onClose={() => setShowFilters(false)}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Divider */}
            <hr className="border-gray-200 mb-6" />

            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg">No listings found</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                        <ListedProductCard
                            key={product.id}
                            product={product}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            isDeleting={deleteLoading === product.id}
                        />
                    ))}
                </div>
            )}

            <ConfirmationModal
                isOpen={Boolean(productToDelete)}
                title="Delete listing"
                message={productToDelete ? `Are you sure you want to delete "${productToDelete.name}"? This action cannot be undone.` : 'Are you sure you want to delete this listing?'}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={handleConfirmDelete}
                onCancel={cancelDelete}
                variant="warning"
            />

            {/* Edit Product Modal */}
            {editingProduct && (
                <EditProductModal
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                    onUpdateSuccess={handleUpdateSuccess}
                />
            )}
        </div>
    );
}