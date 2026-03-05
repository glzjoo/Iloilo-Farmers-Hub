import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import minus from '../../assets/icons/minus.svg';
import add from '../../assets/icons/add.svg';
import type { Product } from '../../types';
import { getShopProducts, getProductsByCategory } from '../../services/shopService';
import { addToCart } from '../../services/cartService';
import { useAuth } from '../../context/AuthContext';

interface ShopAllProps {
    searchQuery?: string;
    selectedCategory?: string;
}

export default function ShopAll({ searchQuery = '', selectedCategory = 'All' }: ShopAllProps) {
    const navigate = useNavigate();
    const { user, userProfile } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [addingToCart, setAddingToCart] = useState<string | null>(null);

    // Fetch products on mount or when category changes
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError('');

                let fetchedProducts: Product[];

                if (selectedCategory && selectedCategory !== 'All') {
                    fetchedProducts = await getProductsByCategory(selectedCategory);
                } else {
                    fetchedProducts = await getShopProducts();
                }

                setProducts(fetchedProducts);

                // Initialize quantities
                const initialQuantities: Record<string, number> = {};
                fetchedProducts.forEach(p => {
                    initialQuantities[p.id] = 1;
                });
                setQuantities(initialQuantities);

            } catch (err: any) {
                setError(err.message || 'Failed to fetch products');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [selectedCategory]);

    const handleIncrement = (productId: string) => {
        setQuantities(prev => ({
            ...prev,
            [productId]: (prev[productId] || 1) + 1
        }));
    };

    const handleDecrement = (productId: string) => {
        setQuantities(prev => ({
            ...prev,
            [productId]: Math.max(1, (prev[productId] || 1) - 1)
        }));
    };

    const handleProductClick = (productId: string) => {
        navigate(`/item-details?id=${productId}`);
    };

    const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
        e.stopPropagation();

        if (!user) {
            alert('Please login to add items to cart');
            navigate('/login');
            return;
        }

        if (userProfile?.role !== 'consumer') {
            alert('Only consumers can add items to cart');
            return;
        }

        const quantity = quantities[product.id] || 1;
        setAddingToCart(product.id);

        try {
            await addToCart(user.uid, {
                id: product.id,
                name: product.name,
                price: product.price,
                unit: product.unit,
                image: product.image,
                farmerId: product.farmerId,
                farmerName: product.farmerName || 'Unknown Farmer',
            }, quantity);

            alert(`Added ${quantity} ${product.unit} of ${product.name} to cart!`);
        } catch (err: any) {
            alert(err.message || 'Failed to add to cart');
        } finally {
            setAddingToCart(null);
        }
    };

    // Filter by search query
    const filteredProducts = searchQuery
        ? products.filter(product =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.farmerName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : products;

    if (loading) {
        return (
            <section className="w-full py-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="w-full py-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center py-16 text-red-500">
                        <p className="text-xl">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full py-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between mb-12">
                    <p className="text-gray-500">{filteredProducts.length} products found</p>
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-xl font-primary text-gray-400">
                            {searchQuery ? `No products found for "${searchQuery}"` : 'No products available'}
                        </p>
                        <p className="text-sm font-primary text-gray-400 mt-2">
                            {searchQuery ? 'Try a different search term' : 'Check back later for new listings'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className="cursor-pointer group"
                                onClick={() => handleProductClick(product.id)}
                            >
                                <div className="relative overflow-hidden rounded-lg">
                                    <img
                                        src={product.image || '/placeholder-product.png'}
                                        alt={product.name}
                                        className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                                    />
                                    {product.stock === '0' || product.stock.startsWith('0') && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <span className="text-white font-bold">Out of Stock</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h3>
                                        <p className="text-primary text-xs font-semibold pb-1">₱{product.price.toFixed(2)} / {product.unit}</p>
                                        <p className="text-xs text-gray-500 truncate">{product.farmerName}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 mt-2">
                                    <button
                                        className="bg-transparent border-none cursor-pointer p-0 disabled:opacity-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDecrement(product.id);
                                        }}
                                        disabled={product.stock === '0' || product.stock.startsWith('0')}
                                    >
                                        <img src={minus} alt="Decrease" className="w-7 h-7" />
                                    </button>
                                    <span className="text-sm font-semibold text-gray-900 w-5 text-center">
                                        {quantities[product.id] || 1}
                                    </span>
                                    <button
                                        className="bg-transparent border-none cursor-pointer p-0 disabled:opacity-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleIncrement(product.id);
                                        }}
                                        disabled={product.stock === '0' || product.stock.startsWith('0')}
                                    >
                                        <img src={add} alt="Increase" className="w-7 h-7" />
                                    </button>
                                </div>

                                <button
                                    className="w-full bg-primary flex items-center justify-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-2xl border-none cursor-pointer mb-5 mt-2 hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    onClick={(e) => handleAddToCart(e, product)}
                                    disabled={product.stock === '0' || product.stock.startsWith('0') || addingToCart === product.id}
                                >
                                    {addingToCart === product.id ? 'Adding...' : (product.stock === '0' || product.stock.startsWith('0') ? 'Out of Stock' : 'Add to Cart')}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}