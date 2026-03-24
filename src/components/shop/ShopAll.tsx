import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import minus from '../../assets/icons/minus.svg';
import add from '../../assets/icons/add.svg';
import type { Product } from '../../types';
import { getShopProducts, getProductsByCategory } from '../../services/shopService';
import { addToCart } from '../../services/cartService';
import { useAuth } from '../../context/AuthContext';
import ActionGuardModal from '../common/ActionGuardModal';

interface ShopAllProps {
    searchQuery?: string;
    selectedCategory?: string;
}

// score = (rating * 0.4) + (log(reviewCount + 1) * 0.2) + (recencyBoost * 0.1) + (log(soldCount + 1) * 0.3)
// recencyBoost = 0.1 if created within 7 days, then linearly decreases to 0 at 14 days

// Trending Algorithm Score Calculator with New Product Boost
const calculateTrendingScore = (product: Product): number => {
    const ratingScore = (product.rating || 0) * 0.4;
    const soldScore = Math.log10((product.soldCount || 0) + 1) * 0.3;
    const reviewScore = Math.log10((product.reviewCount || 0) + 1) * 0.2;
    
    let recencyScore = 0;
    let newProductBoost = 0;
    
    if (product.createdAt) {
        const now = new Date();
        const createdAt = product.createdAt?.toDate?.() || new Date(product.createdAt);
        const daysSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        
        // Standard recency: 14-day window (0.1 max)
        if (daysSinceCreated <= 14) {
            recencyScore = 0.1 * (1 - daysSinceCreated / 14);
        }
        
        // PRODUCT BOOST: First 7 days get huge visibility boost
        if (daysSinceCreated <= 7) {
            newProductBoost = 1.5; // Temporary boost for cold start
        }
    }
    
    // Calculate total
    let totalScore = ratingScore + soldScore + reviewScore + recencyScore + newProductBoost;
    
    // Ensure fresh products with zero data get at least 1.5 score (minimum visibility)
    if (totalScore < 1.5 && newProductBoost > 0) {
        totalScore = 1.5;
    }
    
    return totalScore;
};

// Diversity multiplier: prevents single farmer from dominating results
const getDiversityMultiplier = (sameFarmerCount: number): number => {
    return Math.max(0.7, 1 - (sameFarmerCount * 0.05));
};

const isOutOfStock = (stock: string): boolean => {
    const stockMatch = stock.match(/^(\d+)/);
    return stockMatch ? parseInt(stockMatch[1]) === 0 : true;
};

export default function ShopAll({ searchQuery = '', selectedCategory = 'All' }: ShopAllProps) {
    const navigate = useNavigate();
    const { user, userProfile } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [addingToCart, setAddingToCart] = useState<string | null>(null);
    
    // Modal state
    const [showGuardModal, setShowGuardModal] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError('');

                const fetchedProducts = selectedCategory && selectedCategory !== 'All'
                    ? await getProductsByCategory(selectedCategory)
                    : await getShopProducts();

                setProducts(fetchedProducts);

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

    const displayedProducts = useMemo(() => {
        let filtered: Product[];

        if (searchQuery) {
            // Use Fuse.js for fuzzy search
            const fuseResults = fuse.search(searchQuery);
            filtered = fuseResults.map(result => result.item);
        } else {
            filtered = [...products];
        }

        const inStock: Product[] = [];
        const outOfStock: Product[] = [];
        
        filtered.forEach(product => {
            if (isOutOfStock(product.stock)) {
                outOfStock.push(product);
            } else {
                inStock.push(product);
            }
        });

        // Calculate base scores
        const withBaseScores = inStock.map(product => ({
            product,
            baseScore: calculateTrendingScore(product)
        }));

        // Sort by base score initially
        withBaseScores.sort((a, b) => b.baseScore - a.baseScore);

        // Apply diversity boost
        const farmerProductCount: Record<string, number> = {};
        const withDiversityScores = withBaseScores.map(item => {
            const farmerId = item.product.farmerId;
            const count = farmerProductCount[farmerId] || 0;
            farmerProductCount[farmerId] = count + 1;
            
            const diversityMultiplier = getDiversityMultiplier(count);
            const finalScore = item.baseScore * diversityMultiplier;
            
            return {
                ...item,
                finalScore,
                diversityMultiplier
            };
        });

        // Re-sort by final score
        withDiversityScores.sort((a, b) => b.finalScore - a.finalScore);
        const sortedInStock = withDiversityScores.map(item => item.product);

        // Out-of-stock: sort by createdAt
        const sortedOutOfStock = outOfStock.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
        });

        return [...sortedInStock, ...sortedOutOfStock];
    }, [products, searchQuery, fuse]);

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
        <section className="w-full py-8">
            <div className="max-w-7xl mx-auto px-6">
                {searchQuery && (
                    <div className="mb-4 flex justify-end">
                        <button
                            onClick={() => navigate('/shop')}
                            className="text-sm text-gray-500 hover:text-primary transition"
                        >
                            Show all products
                        </button>
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
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
            </div>

            {/* Action Guard Modal */}
            <ActionGuardModal
                isOpen={showGuardModal}
                action="addToCart"
                userRole={checkUserRole()}
                onClose={() => setShowGuardModal(false)}
            />
        </section>
    );
}