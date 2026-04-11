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
import FarmerCard from './FarmerCard';
import { 
    CITY_COORDINATES, 
    BARANGAY_COORDINATES, 
    typedBarangays,
    type Coordinates 
} from '../../hooks/useNearbyFarmers';

interface ShopAllProps {
    searchQuery?: string;
    queryOptions?: ProductQueryOptions;
    nearbyFarmers?: (FarmerWithLocation & { distance: number; formattedDistance: string })[];
    showNearbyFarmers?: boolean;
    nearbyLoading?: boolean;
    nearbyError?: string | null;
    onManualLocationSelect?: (coords: { lat: number; lng: number } | null) => void; // ADD THIS
    isUsingManualLocation?: boolean;
    gpsPermissionGranted?: boolean;
}

// Type for barangay data
interface CityInfo {
    name: string;
    psgcCode: string;
    barangays: Array<{
        name: string;
        psgcCode: string;
        centroid: {
            lat: number;
            lng: number;
        };
    }>;
}

interface BarangayData {
    province: {
        name: string;
        psgcCode: string;
    };
    cities: CityInfo[];
}

const typedBarangaysData = typedBarangays as unknown as BarangayData;

// Trending Algorithm Score Calculator - FULL ALGORITHM
const calculateTrendingScore = (product: Product): number => {
    const ratingScore = (product.rating || 0) * 0.4;
    const soldScore = Math.log10((product.soldCount || 0) + 1) * 0.3;
    const reviewScore = Math.log10((product.reviewCount || 0) + 1) * 0.2;

    let recencyScore = 0;
    if (product.createdAt) {
        const now = new Date();
        const createdAt = product.createdAt?.toDate?.() || new Date(product.createdAt);
        // Guard against invalid date
        if (!isNaN(createdAt.getTime())) {
            const daysSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceCreated <= 14) {
                recencyScore = 0.1 * (1 - daysSinceCreated / 14);
            }
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
    queryOptions = { sortBy: 'trending', limit: 100 },
    // NEW props
    nearbyFarmers = [],
    showNearbyFarmers = false,
    nearbyLoading = false,
    nearbyError = null,
    onManualLocationSelect,
}: ShopAllProps) {
    const navigate = useNavigate();
    const { user, userProfile } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [addingToCart, setAddingToCart] = useState<string | null>(null);
    const [showGuardModal, setShowGuardModal] = useState(false);

    // State for manual location selector in empty state
    const [showManualSelector, setShowManualSelector] = useState(false);
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedBarangay, setSelectedBarangay] = useState('');

    // Stable dependency key to prevent infinite re-fetching
    const queryOptionsKey = useMemo(() => {
        return JSON.stringify({
            categories: queryOptions.categories?.sort().join(','),
            sortBy: queryOptions.sortBy,
            minPrice: queryOptions.minPrice,
            maxPrice: queryOptions.maxPrice,
            limit: queryOptions.limit
        });
    }, [queryOptions]);

    // Fetch products when queryOptions change (only when not showing nearby farmers)
    useEffect(() => {
        if (showNearbyFarmers) {
            setLoading(false);
            return;
        }

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
    }, [queryOptionsKey, showNearbyFarmers]);

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
        // If showing nearby farmers, return empty (we render farmers separately)
        if (showNearbyFarmers) return [];

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

        // 3. Apply algorithms based on sort type
        if (queryOptions.sortBy === 'newest') {
            // Pure date sort - NO algorithm
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
            // FULL TRENDING ALGORITHM with diversity (DEFAULT behavior)
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
            const sortedOutOfStock = [...outOfStock].sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
                const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
                return timeB - timeA;
            });

            return [...sortedInStock, ...sortedOutOfStock];
        }

        // For rating/price sorts: Firestore already sorted, just separate stock status
        return [...inStock, ...outOfStock];

    }, [products, searchQuery, fuse, queryOptions.sortBy, showNearbyFarmers]);

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

    // Handle city selection in empty state
    const handleCityChange = (city: string) => {
        setSelectedCity(city);
        setSelectedBarangay('');
        
        if (city && CITY_COORDINATES[city] && onManualLocationSelect) {
            onManualLocationSelect(CITY_COORDINATES[city]);
        }
    };

    // Handle barangay selection in empty state
    const handleBarangayChange = (barangay: string) => {
        setSelectedBarangay(barangay);
        
        if (selectedCity && onManualLocationSelect) {
            if (BARANGAY_COORDINATES[selectedCity]?.[barangay]) {
                onManualLocationSelect(BARANGAY_COORDINATES[selectedCity][barangay]);
            } else if (CITY_COORDINATES[selectedCity]) {
                onManualLocationSelect(CITY_COORDINATES[selectedCity]);
            }
        }
    };

    const getBarangaysForCity = (cityName: string): string[] => {
        const city = typedBarangaysData.cities.find((c) => c.name === cityName);
        return city ? city.barangays.map((b) => b.name) : [];
    };

    const cities = typedBarangaysData.cities.map((c) => c.name);

    // NEARBY FARMERS RENDER
    if (showNearbyFarmers) {
        if (nearbyLoading) {
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

        if (nearbyError) {
            return (
                <section className="w-full py-8">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center py-16 text-red-500">
                            <p className="text-xl">{nearbyError}</p>
                        </div>
                    </div>
                </section>
            );
        }

        if (nearbyFarmers.length === 0) {
            return (
                <div className="w-full">
                    <div className="text-center py-12 bg-gray-50 rounded-lg px-6">
                        <div className="mb-4">
                            <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <p className="text-xl font-primary text-gray-600 mb-2">
                            No farmers within 5km
                        </p>
                        <p className="text-sm font-primary text-gray-400 mb-6">
                            Try selecting a different location to find more farmers
                        </p>

                        {/* Manual Location Selector - Same as GPS fallback */}
                        {!showManualSelector ? (
                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowManualSelector(true)}
                                    className="w-full max-w-xs mx-auto px-6 py-3 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                >
                                    📍 Select Location Manually
                                </button>
                                <div>
                                    <button
                                        onClick={() => navigate('/shop')}
                                        className="text-sm text-gray-500 hover:text-primary transition underline"
                                    >
                                        Browse all products instead
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-xs mx-auto bg-white p-4 rounded-lg shadow-sm space-y-3 text-left">
                                <p className="text-sm font-medium text-gray-700 text-center">Select your location:</p>
                                
                                {/* City Dropdown */}
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">City/Municipality</label>
                                    <select
                                        value={selectedCity}
                                        onChange={(e) => handleCityChange(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                                    >
                                        <option value="">Select city...</option>
                                        {cities.map((city) => (
                                            <option key={city} value={city}>
                                                {city}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Barangay Dropdown */}
                                {selectedCity && (
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Barangay (optional)</label>
                                        <select
                                            value={selectedBarangay}
                                            onChange={(e) => handleBarangayChange(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                                        >
                                            <option value="">All barangays</option>
                                            {getBarangaysForCity(selectedCity).map((barangay) => (
                                                <option key={barangay} value={barangay}>
                                                    {barangay}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Back button */}
                                <button
                                    onClick={() => {
                                        setShowManualSelector(false);
                                        setSelectedCity('');
                                        setSelectedBarangay('');
                                    }}
                                    className="w-full text-xs text-gray-500 hover:text-primary py-2"
                                >
                                    ← Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="w-full">
                <div className="mb-6 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Found <span className="font-semibold text-primary">{nearbyFarmers.length}</span> farmers within 5km
                    </p>
                    <button
                        onClick={() => navigate('/shop')}
                        className="text-sm text-gray-500 hover:text-primary transition"
                    >
                        Show all products
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {nearbyFarmers.map((farmer) => (
                        <FarmerCard key={farmer.uid} farmer={farmer} />
                    ))}
                </div>
            </div>
        );
    }

    // REGULAR PRODUCTS RENDER
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

            <ActionGuardModal
                isOpen={showGuardModal}
                action="addToCart"
                userRole={checkUserRole()}
                onClose={() => setShowGuardModal(false)}
            />
        </div>
    );
}