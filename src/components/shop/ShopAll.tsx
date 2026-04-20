// ============================================
// FILE: src/components/shop/ShopAll.tsx (FIXED - HIDE DISTANCE IN MANUAL MODE)
// ============================================
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import minus from '../../assets/icons/minus.svg';
import add from '../../assets/icons/add.svg';
import type { Product } from '../../types';
import type { FarmerWithLocation } from '../../types';
import { 
    getProducts,
    type ProductQueryOptions 
} from '../../services/shopService';
import { addToCart } from '../../services/cartService';
import { useAuth } from '../../context/AuthContext';
import ActionGuardModal from '../common/ActionGuardModal';
import ErrorModal from '../common/ErrorModal';
import FarmerCard from './FarmerCard';

type NearbyMode = 'selection' | 'choosing' | 'gps' | 'manual';

interface ShopAllProps {
    searchQuery?: string;
    queryOptions?: ProductQueryOptions;
    nearbyFarmers?: (FarmerWithLocation & { distance: number; formattedDistance: string })[];
    nearbyMode: NearbyMode;
    nearbyLoading?: boolean;
    nearbyError?: string | null;
    isUsingManualLocation?: boolean;
    hasSearched: boolean;
}

const calculateTrendingScore = (product: Product): number => {
    const ratingScore = (product.rating || 0) * 0.4;
    const soldScore = Math.log10((product.soldCount || 0) + 1) * 0.3;
    const reviewScore = Math.log10((product.reviewCount || 0) + 1) * 0.2;

    let recencyScore = 0;
    if (product.createdAt) {
        const now = new Date();
        const createdAt = product.createdAt?.toDate?.() || new Date(product.createdAt);
        if (!isNaN(createdAt.getTime())) {
            const daysSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceCreated <= 14) {
                recencyScore = 0.1 * (1 - daysSinceCreated / 14);
            }
        }
    }

    return ratingScore + soldScore + reviewScore + recencyScore;
};

const getDiversityMultiplier = (sameFarmerCount: number): number => {
    return Math.max(0.7, 1 - (sameFarmerCount * 0.05));
};

const isOutOfStock = (stock: string): boolean => {
    const stockMatch = stock.match(/^(\d+)/);
    return stockMatch ? parseInt(stockMatch[1]) === 0 : true;
};

// Star display component - whole stars only
function StarDisplay({ rating }: { rating: number }) {
    const roundedRating = Math.round(rating);
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <span 
                    key={star} 
                    className={`text-xs ${star <= roundedRating ? 'text-yellow-500' : 'text-gray-300'}`}
                >
                    ★
                </span>
            ))}
        </div>
    );
}

export default function ShopAll({ 
    searchQuery = '', 
    queryOptions = { sortBy: 'trending', limit: 100 },
    nearbyFarmers = [],
    nearbyMode,
    nearbyLoading = false,
    nearbyError = null,
    isUsingManualLocation = false,
    hasSearched: _hasSearched,
}: ShopAllProps) {
    const navigate = useNavigate();
    const { user, userProfile } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [addingToCart, setAddingToCart] = useState<string | null>(null);
    const [showGuardModal, setShowGuardModal] = useState(false);

    const queryOptionsKey = useMemo(() => {
        return JSON.stringify({
            categories: queryOptions.categories?.sort().join(','),
            sortBy: queryOptions.sortBy,
            minPrice: queryOptions.minPrice,
            maxPrice: queryOptions.maxPrice,
            limit: queryOptions.limit
        });
    }, [queryOptions]);

    useEffect(() => {
        if (nearbyMode !== 'selection') {
            setLoading(false);
            return;
        }

        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError('');
                const fetchedProducts = await getProducts(queryOptions);
                
                let filtered = fetchedProducts;
                if (queryOptions.minPrice !== undefined || queryOptions.maxPrice !== undefined) {
                    filtered = filtered.filter(p => {
                        if (queryOptions.minPrice !== undefined && p.price < queryOptions.minPrice) return false;
                        if (queryOptions.maxPrice !== undefined && p.price > queryOptions.maxPrice) return false;
                        return true;
                    });
                }
                
                setProducts(filtered);

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
    }, [queryOptionsKey, nearbyMode]);

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
        if (nearbyMode !== 'selection') return [];

        let filtered: Product[];

        if (searchQuery) {
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

        if (queryOptions.sortBy === 'newest') {
            const sortedInStock = [...inStock].sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
                const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
                return timeB - timeA;
            });
            
            const sortedOutOfStock = [...outOfStock].sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
                const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
                return timeB - timeA;
            });
            
            return [...sortedInStock, ...sortedOutOfStock];
        } 
        else if (queryOptions.sortBy === 'trending' || !queryOptions.sortBy) {
            const withBaseScores = inStock.map(product => ({
                product,
                baseScore: calculateTrendingScore(product)
            }));

            withBaseScores.sort((a, b) => b.baseScore - a.baseScore);

            const farmerProductCount: Record<string, number> = {};
            const withDiversityScores = withBaseScores.map(item => {
                const farmerId = item.product.farmerId;
                const count = farmerProductCount[farmerId] || 0;
                farmerProductCount[farmerId] = count + 1;
                const diversityMultiplier = getDiversityMultiplier(count);
                const finalScore = item.baseScore * diversityMultiplier;

                return { ...item, finalScore };
            });

            withDiversityScores.sort((a, b) => b.finalScore - a.finalScore);
            const sortedInStock = withDiversityScores.map(item => item.product);

            const sortedOutOfStock = [...outOfStock].sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
                const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
                return timeB - timeA;
            });

            return [...sortedInStock, ...sortedOutOfStock];
        }

        return [...inStock, ...outOfStock];
    }, [products, searchQuery, fuse, queryOptions.sortBy, nearbyMode]);

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
            setErrorMessage(err.message || 'Failed to add to cart');
        } finally {
            setAddingToCart(null);
        }
    };

    // ==========================================
    // NEARBY FARMERS DISPLAY SECTION
    // ==========================================
    
    // Show nearby farmers when in GPS or Manual mode
    if (nearbyMode === 'gps' || nearbyMode === 'manual') {
        // Loading state
        if (nearbyLoading) {
            return (
                <section className="w-full py-8">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            <span className="ml-3 text-gray-600">
                                {isUsingManualLocation ? 'Searching farmers...' : 'Finding your location...'}
                            </span>
                        </div>
                    </div>
                </section>
            );
        }

        // Error state
        if (nearbyError) {
            return (
                <section className="w-full py-8">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <p className="text-lg text-red-600 mb-2">Error finding farmers</p>
                            <p className="text-sm text-gray-500">{nearbyError}</p>
                        </div>
                    </div>
                </section>
            );
        }

        // No farmers found
        if (nearbyFarmers.length === 0) {
            return (
                <section className="w-full py-8">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <p className="text-lg text-gray-900 font-medium mb-2">No farmers found</p>
                            <p className="text-sm text-gray-500 mb-4">
                                {isUsingManualLocation 
                                    ? "No verified farmers with active products in this area."
                                    : "No farmers found within 5km of your location."}
                            </p>
                            <p className="text-xs text-gray-400">
                                Try expanding your search radius or selecting a different location.
                            </p>
                        </div>
                    </div>
                </section>
            );
        }

        // Show nearby farmers grid
        // KEY CHANGE: Pass hideDistance=true when in manual mode
        return (
            <section className="w-full py-4">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Farmers Near You
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {isUsingManualLocation 
                                ? `Showing farmers in selected area (${nearbyFarmers.length} found)`
                                : `Showing farmers within 5km of your location (${nearbyFarmers.length} found)`}
                        </p>
                    </div>

                    {/* Farmers Grid - hide distance badge in manual mode */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {nearbyFarmers.map((farmer) => (
                            <FarmerCard 
                                key={farmer.uid} 
                                farmer={farmer} 
                                hideDistance={isUsingManualLocation}  // KEY FIX: Hide distance in manual mode
                            />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // Choosing mode - show message to select GPS or Manual
    if (nearbyMode === 'choosing') {
        return (
            <section className="w-full py-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <p className="text-lg text-gray-900 font-medium mb-2">Find Nearby Farmers</p>
                        <p className="text-sm text-gray-500">
                            Select a location method from the sidebar to discover farmers near you.
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    // ==========================================
    // SELECTION MODE: REGULAR PRODUCTS RENDER
    // ==========================================
    
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

                            {/* Product Name + Rating (no count) */}
                            <div className="flex items-center justify-between mt-2">
                                <h3 className="text-sm font-semibold text-gray-900 truncate flex-1 min-w-0">
                                    {product.name}
                                </h3>
                                {product.rating > 0 && (
                                    <div className="flex-shrink-0 ml-1">
                                        <StarDisplay rating={product.rating} />
                                    </div>
                                )}
                            </div>

                            <p className="text-primary text-xs font-semibold mt-0.5">
                                ₱{product.price.toFixed(2)} / {product.unit}
                            </p>

                            {/* REVISED LAYOUT: Farmer name inline with quantity buttons */}
                            <div className="flex items-center justify-between mt-1.5">
                                <p className="text-xs text-gray-500 truncate flex-1 mr-2">
                                    {product.farmerName}
                                </p>
                                
                                {/* Quantity buttons inline */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        className="bg-transparent border-none cursor-pointer p-0 disabled:opacity-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDecrement(product.id);
                                        }}
                                        disabled={isOutOfStock(product.stock)}
                                    >
                                        <img src={minus} alt="Decrease" className="w-6 h-6" />
                                    </button>
                                    <span className="text-sm font-semibold text-gray-900 w-4 text-center">
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
                                        <img src={add} alt="Increase" className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {(product.soldCount || 0) > 0 && (
                                <p className="text-xs text-gray-400 mt-1">
                                    {product.soldCount} sold
                                </p>
                            )}

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

            <ActionGuardModal
                isOpen={showGuardModal}
                action="addToCart"
                userRole={checkUserRole()}
                onClose={() => setShowGuardModal(false)}
            />

            <ErrorModal
                isOpen={Boolean(errorMessage)}
                title="Cart error"
                message={errorMessage}
                onClose={() => setErrorMessage('')}
            />
        </div>
    );
}