import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import minus from '../../assets/icons/minus.svg';
import add from '../../assets/icons/add.svg';
import type { Product } from '../../types';
import { 
    getProducts,
    type ProductQueryOptions 
} from '../../services/shopService';
import { addToCart } from '../../services/cartService';
import { useAuth } from '../../context/AuthContext';
import ActionGuardModal from '../common/ActionGuardModal';

interface ShopAllProps {
    searchQuery?: string;
    queryOptions?: ProductQueryOptions;
}

// Trending Algorithm Score Calculator
// Applied only for 'newest' sort to ensure diverse, quality new arrivals
const calculateTrendingScore = (product: Product): number => {
    const ratingScore = (product.rating || 0) * 0.4;
    const soldScore = Math.log10((product.soldCount || 0) + 1) * 0.3;
    const reviewScore = Math.log10((product.reviewCount || 0) + 1) * 0.2;

    let recencyScore = 0;
    if (product.createdAt) {
        const now = new Date();
        const createdAt = product.createdAt?.toDate?.() || new Date(product.createdAt);
        const daysSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreated <= 14) {
            recencyScore = 0.1 * (1 - daysSinceCreated / 14);
        }
    }

    return ratingScore + soldScore + reviewScore + recencyScore;
};

// Diversity multiplier: prevents single farmer from dominating results
const getDiversityMultiplier = (sameFarmerCount: number): number => {
    return Math.max(0.7, 1 - (sameFarmerCount * 0.05));
};

const isOutOfStock = (stock: string): boolean => {
    const stockMatch = stock.match(/^(\d+)/);
    return stockMatch ? parseInt(stockMatch[1]) === 0 : true;
};

export default function ShopAll({ 
    searchQuery = '', 
    queryOptions = { sortBy: 'newest', limit: 100 }
}: ShopAllProps) {
    const navigate = useNavigate();
    const { user, userProfile } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [addingToCart, setAddingToCart] = useState<string | null>(null);
    const [showGuardModal, setShowGuardModal] = useState(false);

    // Fetch products when queryOptions change
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError('');

                console.log('Fetching products with options:', queryOptions);
                const fetchedProducts = await getProducts(queryOptions);
                
                // Client-side price filtering (if range specified)
                let filtered = fetchedProducts;
                if (queryOptions.minPrice !== undefined || queryOptions.maxPrice !== undefined) {
                    filtered = filtered.filter(p => {
                        if (queryOptions.minPrice !== undefined && p.price < queryOptions.minPrice) return false;
                        if (queryOptions.maxPrice !== undefined && p.price > queryOptions.maxPrice) return false;
                        return true;
                    });
                }
                
                setProducts(filtered);

                // Initialize quantities
                const initialQuantities: Record<string, number> = {};
                filtered.forEach(p => {
                    initialQuantities[p.id] = 1;
                });
                setQuantities(initialQuantities);

            } catch (err: any) {
                console.error('Error fetching products:', err);
                setError(err.message || 'Failed to fetch products');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [queryOptions]);

    // Initialize Fuse instance for fuzzy search
    const fuse = useMemo(() => {
        const fuseOptions = {
            keys: [
                { name: 'name', weight: 0.5 },
                { name: 'category', weight: 0.3 },
                { name: 'farmerName', weight: 0.2 }
            ],
            threshold: 0.4,
            minMatchCharLength: 2,
            includeScore: false
        };
        return new Fuse(products, fuseOptions);
    }, [products]);

    // Process and display products
    const displayedProducts = useMemo(() => {
        let filtered: Product[];

        // 1. Apply search if exists (Fuse.js fuzzy search)
        if (searchQuery) {
            const fuseResults = fuse.search(searchQuery);
            filtered = fuseResults.map(result => result.item);
        } else {
            filtered = [...products];
        }

        // 2. Split by stock status (in stock first)
        const inStock: Product[] = [];
        const outOfStock: Product[] = [];

        filtered.forEach(product => {
            if (isOutOfStock(product.stock)) {
                outOfStock.push(product);
            } else {
                inStock.push(product);
            }
        });

        // 3. Apply trending algorithm ONLY for 'newest' sort (discovery mode)
        // For other sorts (rating, price), respect Firestore ordering
        if (!queryOptions.sortBy || queryOptions.sortBy === 'newest') {
            // Calculate base scores
            const withBaseScores = inStock.map(product => ({
                product,
                baseScore: calculateTrendingScore(product)
            }));

            // Sort by base score
            withBaseScores.sort((a, b) => b.baseScore - a.baseScore);

            // Apply diversity boost to prevent farmer domination
            const farmerProductCount: Record<string, number> = {};
            const withDiversityScores = withBaseScores.map(item => {
                const farmerId = item.product.farmerId;
                const count = farmerProductCount[farmerId] || 0;
                farmerProductCount[farmerId] = count + 1;
                const diversityMultiplier = getDiversityMultiplier(count);
                const finalScore = item.baseScore * diversityMultiplier;

                return { ...item, finalScore };
            });

            // Re-sort by final diversity-adjusted score
            withDiversityScores.sort((a, b) => b.finalScore - a.finalScore);
            const sortedInStock = withDiversityScores.map(item => item.product);

            // Sort out-of-stock by date (newest first)
            const sortedOutOfStock = outOfStock.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                return dateB.getTime() - dateA.getTime();
            });

            return [...sortedInStock, ...sortedOutOfStock];
        }

        // For rating/price sorts: Firestore already sorted, just separate stock status
        // In-stock items first (maintaining their sort order), then out-of-stock
        return [...inStock, ...outOfStock];

    }, [products, searchQuery, fuse, queryOptions.sortBy]);

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
        navigate(`/item/${productId}`);
    };

    const checkUserRole = (): 'guest' | 'farmer' | 'consumer' => {
        if (!user || !userProfile) return 'guest';
        return userProfile.role;
    };

    const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
        e.stopPropagation();

        const role = checkUserRole();

        if (role !== 'consumer') {
            setShowGuardModal(true);
            return;
        }

        const quantity = quantities[product.id] || 1;
        setAddingToCart(product.id);

        try {
            await addToCart(user!.uid, {
                id: product.id,
                name: product.name,
                price: product.price,
                unit: product.unit,
                image: product.image,
                farmerId: product.farmerId,
                farmerName: product.farmerName || 'Unknown Farmer',
                stock: parseInt(product.stock) || 0,
            }, quantity);

            alert(`Added ${quantity} ${product.unit} of ${product.name} to cart!`);
        } catch (err: any) {
            alert(err.message || 'Failed to add to cart');
        } finally {
            setAddingToCart(null);
        }
    };

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
        <div className="w-full">
            {searchQuery && (
                <div className="mb-6 flex justify-end">
                    <button
                        onClick={() => navigate('/shop')}
                        className="text-sm text-gray-500 hover:text-primary transition"
                    >
                        Show all products
                    </button>
                </div>
            )}

            {/* Show active filters summary */}
            {(queryOptions.categories?.length || queryOptions.sortBy !== 'newest' || queryOptions.minPrice !== undefined) && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg text-sm text-green-800">
                    <span className="font-semibold">Active filters:</span>
                    {queryOptions.categories && queryOptions.categories.length > 0 && (
                        <span className="ml-2 px-2 py-1 bg-green-100 rounded-full">
                            {queryOptions.categories.join(', ')}
                        </span>
                    )}
                    {queryOptions.sortBy && queryOptions.sortBy !== 'newest' && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full capitalize">
                            Sort: {queryOptions.sortBy.replace('-', ' ')}
                        </span>
                    )}
                    {queryOptions.minPrice !== undefined && (
                        <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                            ₱{queryOptions.minPrice}{queryOptions.maxPrice ? ` - ₱${queryOptions.maxPrice}` : '+'}
                        </span>
                    )}
                    <span className="ml-2 text-gray-500">({displayedProducts.length} products)</span>
                </div>
            )}

            {displayedProducts.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-xl font-primary text-gray-400">
                        {searchQuery ? `No products found for "${searchQuery}"` : 'No products available'}
                    </p>
                    <p className="text-sm font-primary text-gray-400 mt-2">
                        {searchQuery ? 'Try a different search term' : 'Check back later for new listings'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {displayedProducts.map((product) => (
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
                                {isOutOfStock(product.stock) && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="text-white font-bold">Out of Stock</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col mt-2">
                                <div className="flex items-center justify-between gap-1">
                                    <h3 className="text-sm font-semibold text-gray-900 truncate flex-1 min-w-0">
                                        {product.name}
                                    </h3>
                                    {product.rating > 0 && (
                                        <span className="text-xs text-yellow-600 flex-shrink-0">
                                            ★ {product.rating.toFixed(1)}
                                        </span>
                                    )}
                                </div>

                                <p className="text-primary text-xs font-semibold mt-0.5">
                                    ₱{product.price.toFixed(2)} / {product.unit}
                                </p>

                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                    {product.farmerName}
                                </p>

                                {(product.soldCount || 0) > 0 && (
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {product.soldCount} sold
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-1 mt-2">
                                <button
                                    className="bg-transparent border-none cursor-pointer p-0 disabled:opacity-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDecrement(product.id);
                                    }}
                                    disabled={isOutOfStock(product.stock)}
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
                                    disabled={isOutOfStock(product.stock)}
                                >
                                    <img src={add} alt="Increase" className="w-7 h-7" />
                                </button>
                            </div>

                            <button
                                className="w-full bg-primary flex items-center justify-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-2xl border-none cursor-pointer mb-5 mt-2 hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                onClick={(e) => handleAddToCart(e, product)}
                                disabled={isOutOfStock(product.stock) || addingToCart === product.id}
                            >
                                {addingToCart === product.id
                                    ? 'Adding...'
                                    : isOutOfStock(product.stock)
                                        ? 'Out of Stock'
                                        : 'Add to Cart'
                                }
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Action Guard Modal */}
            <ActionGuardModal
                isOpen={showGuardModal}
                action="addToCart"
                userRole={checkUserRole()}
                onClose={() => setShowGuardModal(false)}
            />
        </div>
    );
}