import { useState, useEffect } from 'react';
import mylisting from '../../assets/icons/mylisting.svg';
import searchIcon from '../../assets/icons/search.svg';
import ListedProductCard from './ListedProductCard';
import EditProductModal from './EditProductModal';
import type { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getFarmerProducts, deleteProduct } from '../../services/productService';
import { Link } from 'react-router-dom';

export default function ListingProducts() {
    const { user } = useAuth(); // Removed userProfile since not used
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

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

    const handleDelete = async (product: Product) => {
        if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
            return;
        }

        setDeleteLoading(product.id);
        try {
            await deleteProduct(product.id, product.image);
            setProducts(prev => prev.filter(p => p.id !== product.id));
        } catch (err: any) {
            alert(err.message || 'Failed to delete product');
        } finally {
            setDeleteLoading(null);
        }
    };

    const handleUpdateSuccess = (updatedProduct: Product) => {
        setProducts(prev => prev.map(p => 
            p.id === updatedProduct.id ? updatedProduct : p
        ));
        setEditingProduct(null);
    };

    // Filter products based on search
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-4 pr-10 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-[400px] text-sm"
                    />
                    <img src={searchIcon} alt="Search" className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" />
                </div>
                <Link 
                    to="/AddProduct"
                    className="ml-auto px-6 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                    + Add Product
                </Link>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            <h2 className="text-xl font-semibold mt-4 mb-6">Your listed products ({filteredProducts.length})</h2>

            {filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg">No products found</p>
                    <Link 
                        to="/add-product"
                        className="inline-block mt-4 text-primary hover:underline font-semibold"
                    >
                        Add your first product
                    </Link>
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

            {/* Edit Product Modal */}
            {editingProduct && (
                <EditProductModal
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                    onUpdateSuccess={handleUpdateSuccess}
                />
            )}
        </section>
    );
}